// ===============================
// UPDATED script.js (PRODUCTION)
// ===============================

// ---------- CONFIG ----------
const API_BASE_URL = 'https://pharmacy-backend.onrender.com/api'; // CHANGE if backend URL changes
const whatsappPhoneNumber = '919620318855';

// ---------- STATE ----------
let allProducts = [];
let cart = [];

// ---------- UI ELEMENTS ----------
const cartCountSpan = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const mobileMenuSidebar = document.getElementById('mobileMenuSidebar');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

// ===============================
// LOCAL STORAGE (CART)
// ===============================
function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function loadCart() {
    const stored = localStorage.getItem('shoppingCart');
    cart = stored ? JSON.parse(stored) : [];
}

// ===============================
// FETCH PRODUCTS FROM BACKEND
// ===============================
async function loadAllProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        allProducts = await res.json();

        // Normalize tags
        allProducts.forEach(p => {
            if (p.tag) p.tag = p.tag.trim().toUpperCase();
        });

    } catch (err) {
        console.error(err);
        showNotification('Unable to load products', 'error');
        allProducts = [];
    }
}

// ===============================
// PRODUCT CARD RENDERING
// ===============================
function createMedicineCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!products.length) {
        container.innerHTML = '<p>No products available.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'medicine-card';

        const tagHtml = product.tag
            ? `<div class="medicine-tag ${product.tag.toLowerCase()}">${product.tag}</div>`
            : '';

        card.innerHTML = `
            ${tagHtml}
            <img src="${product.image}" alt="${product.name}" class="medicine-img">
            <h2 class="medicine-name">${product.name}</h2>
            <p class="medicine-price">₹${product.price.toFixed(2)}</p>

            <div class="quantity-container">
                <label>Quantity:</label>
                <div class="quantity-controls product-card-quantity-controls">
                    <button onclick="updateCardQty('${product.id}', -1)">-</button>
                    <input type="number" id="qty-${product.id}" value="1" min="1">
                    <button onclick="updateCardQty('${product.id}', 1)">+</button>
                </div>
            </div>

            <div class="action-buttons">
                <button class="add-to-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                <button onclick="buyNow('${product.id}')">Buy Now</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ===============================
// QUANTITY HANDLING
// ===============================
function updateCardQty(id, change) {
    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) || 1;
    val = Math.max(1, val + change);
    input.value = val;
}

// ===============================
// CART LOGIC
// ===============================
function addToCart(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = parseInt(qtyInput.value) || 1;

    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const item = cart.find(i => i.productId === productId);
    if (item) item.quantity += qty;
    else cart.push({ productId, quantity: qty });

    saveCart();
    updateCartUI();
    showNotification(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.productId !== productId);
    saveCart();
    updateCartUI();
}

function updateCartItem(productId, change) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) removeFromCart(productId);
    else {
        saveCart();
        updateCartUI();
    }
}

// ===============================
// CART UI
// ===============================
function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (!cart.length) {
        emptyCartMessage.style.display = 'block';
    } else {
        emptyCartMessage.style.display = 'none';
        cart.forEach(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) return;

            total += product.price * item.quantity;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${product.image}">
                <div class="cart-item-details-and-actions">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${product.name}</div>
                        <div class="cart-item-price">₹${product.price}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls cart-item-quantity-controls">
                            <button onclick="updateCartItem('${item.productId}', 1)">+</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartItem('${item.productId}', -1)">-</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart('${item.productId}')">X</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });
    }

    cartTotalSpan.textContent = `₹${total.toFixed(2)}`;
    cartCountSpan.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

// ===============================
// CART TOGGLE
// ===============================
function toggleCart() {
    cartSidebar.classList.toggle('open');
    document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : 'auto';
}

// ===============================
// BUY NOW / WHATSAPP
// ===============================
function checkoutCart() {
    if (!cart.length) return;

    let msg = 'Hello, I want to order:\n\n';
    let total = 0;

    cart.forEach((item, i) => {
        const p = allProducts.find(x => x.id === item.productId);
        if (!p) return;
        const price = p.price * item.quantity;
        total += price;
        msg += `${i + 1}. ${item.quantity} x ${p.name} = ₹${price}\n`;
    });

    msg += `\nTotal: ₹${total}`;
    window.open(`https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');

    cart = [];
    saveCart();
    updateCartUI();
    toggleCart();
}

function buyNow(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const url = `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(
        `I want to buy ${product.name} for ₹${product.price}`
    )}`;
    window.open(url, '_blank');
}

// ===============================
// MOBILE MENU
// ===============================
function toggleMobileMenu() {
    mobileMenuSidebar.classList.toggle('open');
    mobileMenuOverlay.classList.toggle('open');
    document.body.style.overflow = mobileMenuSidebar.classList.contains('open') ? 'hidden' : 'auto';
}

// ===============================
// NOTIFICATION
// ===============================
function showNotification(msg, type) {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000);
}

// ===============================
// INIT
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllProducts();
    loadCart();

    const path = window.location.pathname;

    const popular = allProducts.filter(
        p => p.tag === 'SALE' || p.tag === 'BESTSELLER'
    );
    const newest = allProducts.filter(p => p.tag === 'NEW');

    if (path.includes('products.html')) {
        createMedicineCards(allProducts, 'allProducts');
    } else if (path === '/' || path.includes('index.html')) {
        createMedicineCards(popular, 'popularMedicineList');
        createMedicineCards(newest, 'newMedicineList');
    }

    updateCartUI();
});
