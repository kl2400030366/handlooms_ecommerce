// Simple front-end behaviours shared across pages
document.addEventListener("DOMContentLoaded", () => {
  setupRoleBasedLogin();
  setupBuyerCart();
  setupCheckoutPage();
  setupArtisanEditor();
  setupMarketingDashboard();
});

// ---- Login redirect ----
function setupRoleBasedLogin() {
  const form = document.getElementById("login-form");
  const roleSelect = document.getElementById("role");

  if (!form || !roleSelect) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const role = roleSelect.value;

    let target = "buyer-dashboard.html";
    if (role === "artisan") target = "artisan-dashboard.html";
    if (role === "marketing") target = "marketing-dashboard.html";
    if (role === "admin") target = "marketing-dashboard.html"; // update when an admin page exists

    window.location.href = target;
  });
}

// ---- Buyer cart & Buy Now ----
const CART_STORAGE_KEY = "handloomCart";

function setupBuyerCart() {
  const productCards = document.querySelectorAll("[data-product-id]");
  if (!productCards.length) return;

  const cartCountEl = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const cartEmptyEl = document.getElementById("cart-empty");
  const cartSummaryEl = document.getElementById("cart-summary");
  const cartTotalEl = document.getElementById("cart-total");

  let cart = loadCart();
  renderCart();

  productCards.forEach((card) => {
    const id = card.getAttribute("data-product-id");
    const name = card.getAttribute("data-product-name");
    const price = Number(card.getAttribute("data-product-price") || 0);

    const addBtn = card.querySelector('[data-action="add-cart"]');
    const buyBtn = card.querySelector('[data-action="buy-now"]');

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addToCart({ id, name, price });
        renderCart(true);
        const panel = document.getElementById("cart-panel");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        addToCart({ id, name, price });
        renderCart(true);
        const panel = document.getElementById("cart-panel");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  });

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  function addToCart(item) {
    const existing = cart.find((entry) => entry.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart();
  }

  function removeFromCart(id) {
    cart = cart.filter((entry) => entry.id !== id);
    saveCart();
  }

  function updateBadge() {
    if (!cartCountEl) return;
    const totalQty = cart.reduce((sum, entry) => sum + (entry.qty || 0), 0);
    cartCountEl.textContent = String(totalQty);
  }

  function renderCart(showPanel = false) {
    if (!cartItemsEl || !cartEmptyEl || !cartSummaryEl || !cartTotalEl) {
      updateBadge();
      return;
    }

    cartItemsEl.innerHTML = "";

    if (!cart.length) {
      cartEmptyEl.style.display = "block";
      cartSummaryEl.classList.add("hidden");
      updateBadge();
      return;
    }

    cartEmptyEl.style.display = "none";

    cart.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-row-title">${entry.name}</div>
        <div class="cart-row-qty">x${entry.qty}</div>
        <div class="cart-row-price">$${(entry.price * entry.qty).toFixed(2)}</div>
        <button class="cart-remove" type="button">Remove</button>
      `;
      const removeBtn = row.querySelector(".cart-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          removeFromCart(entry.id);
          renderCart();
        });
      }
      cartItemsEl.appendChild(row);
    });

    const total = cart.reduce((sum, entry) => sum + entry.price * entry.qty, 0);
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
    cartSummaryEl.classList.remove("hidden");
    updateBadge();

    if (showPanel) {
      const panel = document.getElementById("cart-panel");
      if (panel) {
        panel.classList.remove("hidden");
      }
    }
  }
}

// ---- Checkout page (COD) ----
function setupCheckoutPage() {
  const itemsEl = document.getElementById("checkout-items");
  const emptyEl = document.getElementById("checkout-empty");
  const summaryEl = document.getElementById("checkout-summary");
  const totalEl = document.getElementById("checkout-total");
  const form = document.getElementById("cod-form");
  const successEl = document.getElementById("cod-success");

  if (!itemsEl || !emptyEl || !summaryEl || !totalEl || !form || !successEl) {
    return;
  }

  let cart = [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cart = parsed;
    }
  } catch {
    cart = [];
  }

  if (!cart.length) {
    emptyEl.style.display = "block";
    summaryEl.classList.add("hidden");
  } else {
    emptyEl.style.display = "none";

    cart.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-row-title">${entry.name}</div>
        <div class="cart-row-qty">x${entry.qty}</div>
        <div class="cart-row-price">$${(entry.price * entry.qty).toFixed(2)}</div>
        <span></span>
      `;
      itemsEl.appendChild(row);
    });

    const total = cart.reduce((sum, entry) => sum + entry.price * entry.qty, 0);
    totalEl.textContent = `$${total.toFixed(2)}`;
    summaryEl.classList.remove("hidden");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // In a real app you would send to backend; here we just clear cart and show success.
    localStorage.removeItem(CART_STORAGE_KEY);
    form.classList.add("hidden");
    successEl.classList.remove("hidden");
  });
}

// ---- Artisan dashboard editor ----
const ARTISAN_STORAGE_KEY = "handloomArtisanProducts";

function setupArtisanEditor() {
  const grid = document.getElementById("artisan-product-grid");
  const editor = document.getElementById("artisan-editor");
  const form = document.getElementById("artisan-editor-form");
  const cancelBtn = document.getElementById("artisan-editor-cancel");
  const idInput = document.getElementById("artisan-editor-id");
  const nameInput = document.getElementById("artisan-name");
  const priceInput = document.getElementById("artisan-price");
  const stockInput = document.getElementById("artisan-stock");
  const descInput = document.getElementById("artisan-description");
  const imgEl = document.getElementById("artisan-editor-image");

  if (!grid || !editor || !form || !cancelBtn || !idInput || !nameInput || !priceInput || !stockInput || !descInput || !imgEl) {
    return;
  }

  let products = loadArtisanProducts();

  function loadArtisanProducts() {
    try {
      const raw = localStorage.getItem(ARTISAN_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveArtisanProducts() {
    localStorage.setItem(ARTISAN_STORAGE_KEY, JSON.stringify(products));
  }

  function openEditor(card) {
    const id = card.getAttribute("data-artisan-id");
    const titleEl = card.querySelector(".product-title");
    const priceEl = card.querySelector(".product-price");
    const img = card.querySelector("img");

    if (!id || !titleEl || !priceEl || !img) return;

    const existing = products[id] || {};
    const priceValue = existing.price ?? (Number((priceEl.textContent || "").replace(/[^0-9.]/g, "")) || 0);

    idInput.value = id;
    nameInput.value = existing.name || titleEl.textContent || "";
    priceInput.value = priceValue;
    stockInput.value = existing.stock ?? 10;
    descInput.value = existing.description || "";
    imgEl.src = img.src;

    editor.classList.remove("hidden");
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  grid.querySelectorAll(".product-grid-card").forEach((card) => {
    const editBtn = card.querySelector('[data-artisan-action="edit"]');
    const viewBtn = card.querySelector('[data-artisan-action="view"]');

    if (editBtn) {
      editBtn.addEventListener("click", () => openEditor(card));
    }

    if (viewBtn) {
      viewBtn.addEventListener("click", () => openEditor(card));
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = idInput.value;
    if (!id) return;

    const name = nameInput.value.trim();
    const price = Number(priceInput.value || 0);
    const stock = Number(stockInput.value || 0);
    const description = descInput.value.trim();

    products[id] = { name, price, stock, description };
    saveArtisanProducts();

    const card = grid.querySelector(`[data-artisan-id="${id}"]`);
    if (card) {
      const titleEl = card.querySelector(".product-title");
      const priceEl = card.querySelector(".product-price");
      if (titleEl) titleEl.textContent = name || titleEl.textContent;
      if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`;
    }

    editor.classList.add("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    editor.classList.add("hidden");
  });
}

// ---- Marketing dashboard banner selection ----
const BANNER_STORAGE_KEY = "handloomHomepageBanner";

function setupMarketingDashboard() {
  const bannerContainer = document.getElementById("marketing-banners");
  const currentTextEl = document.getElementById("marketing-current-banner-text");

  if (!bannerContainer || !currentTextEl) return;

  const bannerLabels = {
    collection: "New Collection Launch",
    explore: "Explore Now",
    sale: "Festival Sale"
  };

  function applyBanner(id) {
    const label = bannerLabels[id] || "Handloom banner";
    currentTextEl.textContent = `Homepage hero is currently using: ${label}. (Prototype configured from Marketing Dashboard.)`;
    localStorage.setItem(BANNER_STORAGE_KEY, id);
  }

  // Load saved selection
  const saved = localStorage.getItem(BANNER_STORAGE_KEY);
  if (saved && bannerLabels[saved]) {
    applyBanner(saved);
  }

  bannerContainer.querySelectorAll("[data-banner-id]").forEach((card) => {
    const id = card.getAttribute("data-banner-id");
    const btn = card.querySelector('[data-banner-action="use"]');
    if (!id || !btn) return;

    btn.addEventListener("click", () => applyBanner(id));
  });
}
