/* Ebook store: search, category filters, cart and checkout links. */

/* Paste each product's checkout URL (for example from Gumroad) between the quotes.
   An empty value means "checkout not connected yet". */
const CHECKOUT_LINKS = {
  "ai-money-machine": "",
  "gut-reset": "",
  "gen-z-wealth-code": "",
  "sleep-like-a-ceo": "",
  "bundle": ""
};
const SUPPORT_EMAIL = "Ebookbyali@gmail.com";
const CART_KEY = "ebook-cart-v1";

const PRODUCTS = {
  "ai-money-machine": { title: "AI Money Machine", price: 6.99, list: 15, cv: "c-ai" },
  "gut-reset": { title: "Gut Reset", price: 6.99, list: 15, cv: "c-gut" },
  "gen-z-wealth-code": { title: "The Gen Z Wealth Code", price: 6.99, list: 15, cv: "c-genz" },
  "sleep-like-a-ceo": { title: "Sleep Like a CEO", price: 6.99, list: 15, cv: "c-sleep" },
  "bundle": { title: "Complete bundle", price: 30, list: 60, cv: "", includes: ["ai-money-machine", "gut-reset", "gen-z-wealth-code", "sleep-like-a-ceo"] }
};
const BOOK_SLUGS = PRODUCTS.bundle.includes;

const money = n => "$" + n.toFixed(2);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  const el = $("[data-toast]");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------- Cart ---------- */
function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(s => PRODUCTS[s]) : [];
  } catch (e) { return []; }
}
function setCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ }
  updateBadge();
}
function updateBadge() {
  const n = getCart().length;
  $$("[data-cart-count]").forEach(el => { el.textContent = n; el.hidden = n === 0; });
}
function addToCart(slug) {
  if (!PRODUCTS[slug]) return;
  let cart = getCart();
  if (cart.includes(slug)) { toast(PRODUCTS[slug].title + " is already in your cart."); return; }
  if (slug === "bundle") {
    cart = cart.filter(s => s === "bundle" || !BOOK_SLUGS.includes(s));
    cart.push("bundle");
  } else if (cart.includes("bundle")) {
    toast(PRODUCTS[slug].title + " is already included in your bundle.");
    return;
  } else {
    cart.push(slug);
  }
  setCart(cart);
  toast("Added to cart: " + PRODUCTS[slug].title);
  if ($("[data-cart-page]")) renderCart();
}
function removeFromCart(slug) {
  setCart(getCart().filter(s => s !== slug));
  renderCart();
}

function miniCover(slug) {
  const p = PRODUCTS[slug];
  return '<span class="cover cover-mini ' + p.cv + '" aria-hidden="true"><img class="cover-img" src="covers/' + slug +
    '.jpg" alt="" onerror="this.remove()"><span class="cv-title">' + p.title + '</span></span>';
}

function renderCart() {
  const page = $("[data-cart-page]");
  if (!page) return;
  const cart = getCart();
  const list = $("[data-cart-items]");
  const summary = $("[data-cart-summary]");
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p><a class="btn btn-brand" href="index.html#shelf">Browse the ebooks</a></div>';
    summary.hidden = true;
    return;
  }
  list.innerHTML = cart.map(slug => {
    const p = PRODUCTS[slug];
    const thumbs = slug === "bundle" ? p.includes.map(miniCover).join("") : miniCover(slug);
    const meta = slug === "bundle" ? "4 ebooks, PDF format" : "PDF ebook, 20 pages";
    return '<article class="cart-line"><div class="cart-thumbs">' + thumbs + '</div><div class="info"><h3>' + p.title +
      '</h3><div class="meta">' + meta + '</div><div class="price-row"><b>' + money(p.price) + '</b><span class="was">' + money(p.list) +
      '</span></div></div><button class="link-btn" type="button" data-remove="' + slug + '" aria-label="Remove ' + p.title + ' from cart">Remove</button></article>';
  }).join("");
  const total = cart.reduce((s, slug) => s + PRODUCTS[slug].price, 0);
  const listPrice = cart.reduce((s, slug) => s + PRODUCTS[slug].list, 0);
  $("[data-sum-list]").textContent = money(listPrice);
  $("[data-sum-disc]").textContent = "−" + money(listPrice - total);
  $("[data-sum-total]").textContent = money(total);
  summary.hidden = false;
  $("[data-checkout-links]").hidden = true;
  $("[data-checkout-note]").hidden = cart.every(s => CHECKOUT_LINKS[s]);
}

function startCheckout() {
  const cart = getCart();
  const ready = cart.filter(s => CHECKOUT_LINKS[s]);
  if (!cart.length) return;
  if (cart.length === 1 && ready.length === 1) {
    window.open(CHECKOUT_LINKS[ready[0]], "_blank", "noopener");
    return;
  }
  if (!ready.length) {
    toast("Online checkout is being connected. Email " + SUPPORT_EMAIL + " to order.");
    return;
  }
  const box = $("[data-checkout-links]");
  box.innerHTML = '<p class="muted small">Each ebook is paid for separately:</p>' + ready.map(s =>
    '<a class="btn btn-brand" href="' + CHECKOUT_LINKS[s] + '" target="_blank" rel="noopener">Pay for ' + PRODUCTS[s].title + '</a>').join("");
  box.hidden = false;
}

function buyNow(slug) {
  const url = CHECKOUT_LINKS[slug];
  if (url) window.open(url, "_blank", "noopener");
  else toast("Online checkout is being connected. Email " + SUPPORT_EMAIL + " to order.");
}

/* ---------- Search and filters (home page) ---------- */
function setupShelf() {
  const cards = $$("[data-card]");
  if (!cards.length) return;
  const input = $("[data-search]");
  const status = $("[data-search-status]");
  const count = $("[data-shelf-count]");
  const title = $("[data-shelf-title]");
  const empty = $("[data-empty]");
  const labels = { all: "New and popular", money: "Money & AI", health: "Health & Wellbeing" };
  let cat = "all";

  const norm = v => (v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

  function apply() {
    const words = norm(input && input.value).split(" ").filter(Boolean);
    let shown = 0;
    cards.forEach(card => {
      const h3 = card.querySelector("h3");
      const hay = norm(card.dataset.search + " " + card.dataset.cat + " " + (h3 ? h3.textContent : ""));
      const okTerm = words.every(w => hay.includes(w));
      const okCat = cat === "all" || card.dataset.cat === cat;
      card.hidden = !(okTerm && okCat);
      if (!card.hidden) shown++;
    });
    if (title) title.textContent = labels[cat] || labels.all;
    if (count) count.textContent = shown + (shown === 1 ? " ebook" : " ebooks");
    if (empty) empty.hidden = shown !== 0;
    if (status) status.textContent = words.length ? (shown ? "Found " + shown + " matching ebook" + (shown === 1 ? "." : "s.") : "") : "";
  }

  function setCat(next) {
    cat = labels[next] ? next : "all";
    $$(".nav-row a[data-cat]").forEach(a => {
      if (a.dataset.cat === cat) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    apply();
  }

  const params = new URLSearchParams(location.search);
  if (input && (params.get("search") || params.get("q"))) input.value = params.get("search") || params.get("q");
  setCat(params.get("cat") || "all");

  $$(".nav-row a[data-cat]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    setCat(a.dataset.cat);
    const url = new URL(location.href);
    if (a.dataset.cat === "all") url.searchParams.delete("cat"); else url.searchParams.set("cat", a.dataset.cat);
    history.replaceState({}, "", url.pathname + url.search + "#shelf");
    $("#shelf").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  if (input) input.addEventListener("input", apply);
  const form = $("[data-search-form]");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    setCat("all");
    $("#shelf").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ---------- Wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateBadge();
  setupShelf();
  renderCart();

  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const buy = e.target.closest("[data-buy]");
    if (buy) { buyNow(buy.dataset.buy); return; }
    const rem = e.target.closest("[data-remove]");
    if (rem) { removeFromCart(rem.dataset.remove); return; }
    if (e.target.closest("[data-checkout]")) startCheckout();
  });

  /* Product and bundle pages: hide the "checkout is being connected" note once a link exists */
  const productId = document.body.dataset.product || (/bundle\.html$/.test(location.pathname) ? "bundle" : "");
  if (productId && CHECKOUT_LINKS[productId]) $$("[data-checkout-note]").forEach(el => { el.hidden = true; });

  window.addEventListener("storage", () => { updateBadge(); renderCart(); });
});
