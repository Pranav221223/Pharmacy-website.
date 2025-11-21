/*const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // The port your Node.js backend will run on

// --- Middleware ---

// CORRECTED: Combined and clarified CORS configuration.
app.use(cors({
    origin: ['http://127.0.0.1:3001', 'http://localhost:3001'], 
    credentials: true
}));

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session configuration
app.use(session({
    secret: 'YOUR_VERY_STRONG_SECRET_KEY_HERE_CHANGE_THIS_NOW',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// --- File Paths ---
const productsFilePath = path.join(__dirname, 'data', 'products.json');
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// --- Helpers ---
const readJSONFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Warning: Data file not found at ${filePath}. Returning empty array.`);
            return [];
        }
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
};

const writeJSONFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error.message);
        throw new Error('Failed to save data due to server error.');
    }
};

// --- Middleware to Protect Admin Routes ---
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please log in to access this resource.' });
    }
};

// --- API Endpoints ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSONFile(usersFilePath);
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        req.session.userId = user.username;
        res.status(200).json({ message: 'Login successful', username: user.username });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

// Logout (no auth required)
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ message: 'Failed to log out. Server error.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful.' });
    });
});

// Check Auth
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({ authenticated: true, username: req.session.userId });
    } else {
        res.status(200).json({ authenticated: false });
    }
});

// --- Product Management Endpoints ---
app.get('/api/products', (req, res) => {
    const products = readJSONFile(productsFilePath);
    res.json(products);
});

app.post('/api/products', isAuthenticated, (req, res) => {
    const newProduct = req.body;
    const products = readJSONFile(productsFilePath);

    if (!newProduct.id || !newProduct.name || !newProduct.image || typeof newProduct.price !== 'number' || newProduct.price <= 0) {
        return res.status(400).json({ message: 'Missing or invalid product data. Requires ID, Name, Image URL, and a positive Price.' });
    }
    if (products.some(p => p.id === newProduct.id)) {
        return res.status(409).json({ message: `Product with ID '${newProduct.id}' already exists. Please choose a unique ID.` });
    }

    products.push(newProduct);
    try {
        writeJSONFile(productsFilePath, products);
        res.status(201).json({ message: 'Product added successfully!', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add product. Please try again.', error: error.message });
    }
});

app.put('/api/products/:id', isAuthenticated, (req, res) => {
    const productId = req.params.id;
    const updatedProductData = req.body;
    let products = readJSONFile(productsFilePath);

    const index = products.findIndex(p => p.id === productId);

    if (index === -1) {
        return res.status(404).json({ message: `Product with ID '${productId}' not found.` });
    }

    if (!updatedProductData.name || !updatedProductData.image || typeof updatedProductData.price !== 'number' || updatedProductData.price <= 0) {
        return res.status(400).json({ message: 'Missing or invalid product data for update. Requires Name, Image URL, and a positive Price.' });
    }

    products[index] = { ...products[index], ...updatedProductData, id: productId };

    try {
        writeJSONFile(productsFilePath, products);
        res.status(200).json({ message: 'Product updated successfully!', product: products[index] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product. Please try again.', error: error.message });
    }
});

app.delete('/api/products/:id', isAuthenticated, (req, res) => {
    const productId = req.params.id;
    let products = readJSONFile(productsFilePath);

    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length === initialLength) {
        return res.status(404).json({ message: `Product with ID '${productId}' not found.` });
    }

    try {
        writeJSONFile(productsFilePath, products);
        res.status(200).json({ message: 'Product deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product. Please try again.', error: error.message });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your frontend at: http://127.0.0.1:3001/public/admin.html`);
    console.log(`Note: The API endpoints are at http://localhost:${PORT}/api/*`);
}); */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors({
    origin: ['http://127.0.0.1:3001', 'http://localhost:3001'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Session Config ---
app.use(session({
    secret: 'YOUR_VERY_STRONG_SECRET_KEY_HERE_CHANGE_THIS_NOW',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// --- File Paths ---
const dataDir = path.join(__dirname, 'data');
const productsFilePath = path.join(dataDir, 'products.json');
const usersFilePath = path.join(dataDir, 'users.json');

// --- Ensure data dir & files exist ---
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([
        {
            username: "admin",
            passwordHash: bcrypt.hashSync("admin123", 10)
        }
    ], null, 4));
    console.log("Created default admin user: admin / admin123");
}

if (!fs.existsSync(productsFilePath)) {
    fs.writeFileSync(productsFilePath, JSON.stringify([], null, 4));
}

// --- Helpers ---
const readJSONFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJSONFile = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

// --- Auth Middleware ---
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
};

// --- API Routes ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSONFile(usersFilePath);
    const user = users.find(u => u.username === username);

    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    if (!bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.userId = user.username;
    res.json({ message: 'Login successful', username: user.username });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Check Auth
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.userId });
    } else {
        res.json({ authenticated: false });
    }
});

// Get Products
app.get('/api/products', (req, res) => {
    res.json(readJSONFile(productsFilePath));
});

// Add Product
app.post('/api/products', isAuthenticated, (req, res) => {
    const { name, image, price } = req.body;
    if (!name || !image || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Invalid product data.' });
    }

    const products = readJSONFile(productsFilePath);
    const newProduct = { id: Date.now().toString(), name, image, price };

    products.push(newProduct);
    writeJSONFile(productsFilePath, products);

    res.status(201).json({ message: 'Product added!', product: newProduct });
});

// Update Product
app.put('/api/products/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, image, price } = req.body;

    const products = readJSONFile(productsFilePath);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    if (!name || !image || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ message: 'Invalid product data.' });
    }

    products[index] = { ...products[index], name, image, price };
    writeJSONFile(productsFilePath, products);

    res.json({ message: 'Product updated!', product: products[index] });
});

// Delete Product
app.delete('/api/products/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    let products = readJSONFile(productsFilePath);

    const initialLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
        return res.status(404).json({ message: 'Product not found' });
    }

    writeJSONFile(productsFilePath, products);
    res.json({ message: 'Product deleted!' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🔗 Open frontend at http://127.0.0.1:3001/public/admin.html`);
});

