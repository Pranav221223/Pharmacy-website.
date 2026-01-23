// ===============================
// script.js (PRODUCTION)
// ===============================

const API_BASE_URL = 'https://pharmacy-backend.onrender.com/api';
const whatsappPhoneNumber = '919620318855';

let allProducts = [];
let cart = [];

// ---------- CART STORAGE ----------
const saveCart = () =>
  localStorage.setItem('cart', JSON.stringify(cart));

const loadCart = () =>
  cart = JSON.parse(localStorage.getItem('cart') || '[]');

// ---------- FETCH PRODUCTS ----------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    allProducts = await res.json();
  } catch {
    alert('Failed to load products');
  }
}

// ---------- RENDER ----------
function renderProducts(containerId, products) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  products.forEach(p => {
    container.innerHTML += `
      <div class="medicine-card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    `;
  });
}

// ---------- CART ----------
function addToCart(id) {
  const item = cart.find(i => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  saveCart();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  loadCart();
  renderProducts('productList', allProducts);
});
