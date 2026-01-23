// ==========================
// server.js (PRODUCTION READY)
// ==========================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// ==========================
// MIDDLEWARE
// ==========================

app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://pranav221223.github.io'
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================
// SESSION CONFIG
// ==========================

app.use(session({
  name: 'pharma.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// ==========================
// DATA FILE SETUP
// ==========================

const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([
    {
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10)
    }
  ], null, 2));
  console.log('✅ Default admin created: admin / admin123');
}

if (!fs.existsSync(productsFile)) {
  fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
}

// ==========================
// HELPERS
// ==========================

const readJSON = file =>
  JSON.parse(fs.readFileSync(file, 'utf8'));

const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ==========================
// AUTH MIDDLEWARE
// ==========================

const isAuth = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

// ==========================
// AUTH ROUTES
// ==========================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(usersFile);

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.user = username;
  res.json({ message: 'Login successful' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('pharma.sid');
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

// ==========================
// PRODUCT ROUTES
// ==========================

app.get('/api/products', (req, res) => {
  res.json(readJSON(productsFile));
});

app.post('/api/products', isAuth, (req, res) => {
  const { name, image, price, tag } = req.body;
  if (!name || !image || typeof price !== 'number') {
    return res.status(400).json({ message: 'Invalid product data' });
  }

  const products = readJSON(productsFile);
  const product = {
    id: Date.now().toString(),
    name,
    image,
    price,
    tag: tag ? tag.toUpperCase() : null
  };

  products.push(product);
  writeJSON(productsFile, products);

  res.status(201).json(product);
});

app.delete('/api/products/:id', isAuth, (req, res) => {
  const products = readJSON(productsFile).filter(
    p => p.id !== req.params.id
  );
  writeJSON(productsFile, products);
  res.json({ message: 'Deleted' });
});

// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
