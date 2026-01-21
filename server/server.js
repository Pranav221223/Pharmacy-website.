// ==========================
// server.js (UPDATED & FIXED)
// ==========================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();

// IMPORTANT: Dynamic port for cloud deployment
const PORT = process.env.PORT || 3000;

// ==========================
// MIDDLEWARE
// ==========================

// CORS – allow GitHub Pages + local dev
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
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// ==========================
// DATA FILE SETUP
// ==========================
const dataDir = path.join(__dirname, 'data');
const productsFilePath = path.join(dataDir, 'products.json');
const usersFilePath = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create default admin user if not exists
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(
        usersFilePath,
        JSON.stringify(
            [
                {
                    username: 'admin',
                    passwordHash: bcrypt.hashSync('admin123', 10)
                }
            ],
            null,
            4
        )
    );
    console.log('✅ Default admin created: admin / admin123');
}

// Create products file if not exists
if (!fs.existsSync(productsFilePath)) {
    fs.writeFileSync(productsFilePath, JSON.stringify([], null, 4));
}

// ==========================
// HELPER FUNCTIONS
// ==========================
const readJSONFile = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return [];
    }
};

const writeJSONFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
};

// ==========================
// AUTH MIDDLEWARE
// ==========================
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    return res.status(401).json({ message: 'Unauthorized' });
};

// ==========================
// AUTH ROUTES
// ==========================

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSONFile(usersFilePath);

    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.userId = user.username;
    res.json({ message: 'Login successful', username: user.username });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.clearCookie('pharma.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Check authentication
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        return res.json({ authenticated: true, username: req.session.userId });
    }
    res.json({ authenticated: false });
});

// ==========================
// PRODUCT ROUTES
// ==========================

// Get all products (PUBLIC)
app.get('/api/products', (req, res) => {
    const products = readJSONFile(productsFilePath);
    res.json(products);
});

// Add product (ADMIN)
app.post('/api/products', isAuthenticated, (req, res) => {
    const { name, image, price, tag } = req.body;

    if (!name || !image || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Invalid product data' });
    }

    const products = readJSONFile(productsFilePath);

    const newProduct = {
        id: Date.now().toString(),
        name,
        image,
        price,
        tag: tag ? tag.trim().toUpperCase() : null
    };

    products.push(newProduct);
    writeJSONFile(productsFilePath, products);

    res.status(201).json({ message: 'Product added', product: newProduct });
});

// Update product (ADMIN)
app.put('/api/products/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, image, price, tag } = req.body;

    const products = readJSONFile(productsFilePath);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (!name || !image || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Invalid product data' });
    }

    products[index] = {
        ...products[index],
        name,
        image,
        price,
        tag: tag ? tag.trim().toUpperCase() : null
    };

    writeJSONFile(productsFilePath, products);
    res.json({ message: 'Product updated', product: products[index] });
});

// Delete product (ADMIN)
app.delete('/api/products/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    let products = readJSONFile(productsFilePath);

    const originalLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === originalLength) {
        return res.status(404).json({ message: 'Product not found' });
    }

    writeJSONFile(productsFilePath, products);
    res.json({ message: 'Product deleted' });
});

// ==========================
// SERVER START
// ==========================
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
