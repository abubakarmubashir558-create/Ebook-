/* Ebook store: smart search, category filters, cart and checkout links. */

/* Paste each product's checkout URL (for example from Gumroad) between the quotes.
   An empty value means "checkout not connected yet". */
const CHECKOUT_LINKS = {
  "ai-money-machine": "https://asiayasmeen.gumroad.com/l/ai-money-machine",
  "gut-reset": "https://asiayasmeen.gumroad.com/l/gut-reset",
  "gen-z-wealth-code": "https://asiayasmeen.gumroad.com/l/gen-z-wealth-code",
  "sleep-like-a-ceo": "https://asiayasmeen.gumroad.com/l/sleep-like-a-ceo",
  "bundle": "https://asiayasmeen.gumroad.com/l/4-ebook-bundle",
  "my-husband-is-lying": "https://asiayasmeen.gumroad.com/l/my-husband-is-lying",
  "my-wife-is-lying": "https://asiayasmeen.gumroad.com/l/my-wife-is-lying",
  "we-were-both-lying": "https://asiayasmeen.gumroad.com/l/we-were-both-lying",
  "fiction-bundle": "https://asiayasmeen.gumroad.com/l/lying-trilogy-bundle"
};
const SUPPORT_EMAIL = "Ebookbyali@gmail.com";
const CART_KEY = "ebook-cart-v1";

const PRODUCTS = {
  "ai-money-machine": { title: "AI Money Machine", price: 5.99, list: 15, cv: "c-ai" },
  "gut-reset": { title: "Gut Reset", price: 5.99, list: 15, cv: "c-gut" },
  "gen-z-wealth-code": { title: "The Gen Z Wealth Code", price: 5.99, list: 15, cv: "c-genz" },
  "sleep-like-a-ceo": { title: "Sleep Like a CEO", price: 5.99, list: 15, cv: "c-sleep" },
  "my-husband-is-lying": { title: "My Husband Is Lying", price: 5.99, list: 15, cv: "c-lie1", pages: 23 },
  "my-wife-is-lying": { title: "My Wife Is Lying", price: 5.99, list: 15, cv: "c-lie2", pages: 18 },
  "we-were-both-lying": { title: "We Were Both Lying", price: 5.99, list: 15, cv: "c-lie3", pages: 18 },
  "bundle": { title: "Complete bundle", price: 15.99, list: 20, cv: "", includes: ["ai-money-machine", "gut-reset", "gen-z-wealth-code", "sleep-like-a-ceo"] },
  "fiction-bundle": { title: "The Lying Trilogy bundle", price: 13.99, list: 17.97, cv: "", includes: ["my-husband-is-lying", "my-wife-is-lying", "we-were-both-lying"] }
};
const BUNDLES = Object.keys(PRODUCTS).filter(s => PRODUCTS[s].includes);

/* Words people might type. Add more here and search picks them up everywhere. */
const SEARCH_DATA = [
  { slug: "ai-money-machine", title: "AI Money Machine", cat: "money", catLabel: "Self Improvement",
    terms: "ai artificial intelligence chatgpt prompts automation tools freelance freelancing side hustle online business make money online income earn earning money digital skills productivity work career free tools passive income" },
  { slug: "gut-reset", title: "Gut Reset", cat: "health", catLabel: "Self Improvement",
    terms: "gut health healthy microbiome digestion digestive stomach bloating belly food diet nutrition eating probiotics wellness wellbeing energy mood body fitness healing detox 30 day" },
  { slug: "gen-z-wealth-code", title: "The Gen Z Wealth Code", cat: "money", catLabel: "Self Improvement",
    terms: "gen z wealth money finance financial saving savings investing invest investment budget budgeting income creator economy crypto personal finance young 20s side hustle digital assets brand rich" },
  { slug: "sleep-like-a-ceo", title: "Sleep Like a CEO", cat: "health", catLabel: "Self Improvement",
    terms: "sleep insomnia rest bedtime night routine recovery health healthy wellbeing wellness energy focus performance productivity ceo stress brain wearable habits tired fatigue" },
  { slug: "my-husband-is-lying", title: "My Husband Is Lying", cat: "fiction", catLabel: "Fiction",
    terms: "fiction novel story stories thriller psychological suspense mystery drama romance marriage husband wife couple lying lies liar trilogy series book reading read secrets betrayal revenge love family twist cliffhanger domestic emma jake chloe husband cheating affair second phone first" },
  { slug: "my-wife-is-lying", title: "My Wife Is Lying", cat: "fiction", catLabel: "Fiction",
    terms: "fiction novel story stories thriller psychological suspense mystery drama romance marriage husband wife couple lying lies liar trilogy series book reading read secrets betrayal revenge love family twist cliffhanger domestic emma jake chloe wife diary blackmail second" },
  { slug: "we-were-both-lying", title: "We Were Both Lying", cat: "fiction", catLabel: "Fiction",
    terms: "fiction novel story stories thriller psychological suspense mystery drama romance marriage husband wife couple lying lies liar trilogy series book reading read secrets betrayal revenge love family twist cliffhanger domestic emma jake chloe final ending finale last third" }
];

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

/* ---------- Smart search ---------- */
const norm = v => (v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/* Edit distance that counts swapping two neighbouring letters as one typo ("slepe" -> "sleep") */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

function wordMatches(q, tokens) {
  for (const t of tokens) {
    if (t === q) return true;
    if (q.length >= 2 && t.startsWith(q)) return true;                 /* "heal" finds "health" */
    if (q.length >= 4 && t.length >= 4 && q.startsWith(t)) return true; /* "healthy" finds "health" */
    if (q.length >= 4 && q[0] === t[0] && Math.abs(q.length - t.length) <= 1 && editDistance(q, t) <= (q.length >= 8 ? 2 : 1)) return true; /* typos */
  }
  return false;
}

const INDEX = SEARCH_DATA.map(d => ({
  d,
  titleTokens: norm(d.title).split(" "),
  tokens: norm(d.title + " " + d.terms + " " + d.cat).split(" ").filter(Boolean)
}));

/* Returns matching products, best matches first. An empty query matches everything. */
function searchBooks(query) {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length) return INDEX.map(x => x.d);
  const hits = [];
  INDEX.forEach(x => {
    let score = 0;
    for (const w of words) {
      if (wordMatches(w, x.titleTokens)) score += 3;
      else if (wordMatches(w, x.tokens)) score += 1;
      else return;
    }
    hits.push({ d: x.d, score });
  });
  return hits.sort((a, b) => b.score - a.score).map(h => h.d);
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
  if (PRODUCTS[slug].includes) {
    const inc = PRODUCTS[slug].includes;
    cart = cart.filter(s => s === slug || !inc.includes(s));
    cart.push(slug);
  } else if (BUNDLES.some(b => cart.includes(b) && PRODUCTS[b].includes.includes(slug))) {
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
    '-400.jpg" alt="" width="400" height="600" loading="lazy" decoding="async" onerror="this.remove()"><span class="cv-title">' + p.title + '</span></span>';
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
    const thumbs = p.includes ? p.includes.map(miniCover).join("") : miniCover(slug);
    const meta = p.includes ? p.includes.length + " ebooks, PDF format" : "PDF ebook, " + (p.pages || 20) + " pages";
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

/* ---------- Home page: shelf filter + search ---------- */
function setupShelf() {
  const cards = $$("[data-card]");
  if (!cards.length) return false;
  const input = $("[data-search]");
  const status = $("[data-search-status]");
  const count = $("[data-shelf-count]");
  const title = $("[data-shelf-title]");
  const empty = $("[data-empty]");
  const grid = cards[0].parentElement;
  const labels = { all: "Self Improvement", self: "Self Improvement", money: "Money & AI", health: "Health & Wellbeing", fiction: "Fiction" };
  const mainCards = $$("[data-card]", cards[0].closest("[data-scope]") || document);
  let cat = "all";

  function apply() {
    const query = input ? input.value.trim() : "";
    const found = searchBooks(query).map(d => d.slug);
    let shown = 0;
    cards.forEach(card => {
      const ok = found.includes(card.dataset.slug) && (cat === "all" || card.dataset.cat === cat || (cat === "self" && card.dataset.cat !== "fiction"));
      card.hidden = !ok;
      if (ok) shown++;
    });
    /* Best matches first while searching */
    if (query) {
      found.slice().reverse().forEach(slug => {
        const c = cards.find(x => x.dataset.slug === slug);
        if (c) c.parentElement.prepend(c);
      });
    }
    /* Show or hide whole sections: shelves with no visible cards, and the bundle banners */
    $$("[data-scope]").forEach(sec => {
      if (sec.dataset.scope === "popular") { sec.hidden = !!query || cat !== "all"; return; }
      const own = $$("[data-card]", sec);
      const inScope = cat === "all" || (sec.dataset.scope === "books" ? cat !== "fiction" : cat === "fiction");
      sec.hidden = own.length ? !own.some(c => !c.hidden) : (!!query || !inScope);
    });
    const mainShown = mainCards.filter(c => !c.hidden).length;
    if (title) title.textContent = query ? "Search results" : (labels[cat] || labels.all);
    if (count) count.textContent = mainShown + (mainShown === 1 ? " ebook" : " ebooks");
    if (empty) {
      empty.hidden = shown !== 0;
      if (shown === 0) empty.textContent = "No ebooks match “" + query + "”. Try health, sleep, AI, money or saving.";
    }
    if (status) {
      status.innerHTML = "";
      if (query && shown) {
        status.append("Showing " + shown + (shown === 1 ? " ebook" : " ebooks") + " for “" + query + "”. ");
        const clear = document.createElement("button");
        clear.type = "button"; clear.className = "link-btn inline"; clear.textContent = "Clear search";
        clear.addEventListener("click", () => { input.value = ""; apply(); input.focus(); });
        status.append(clear);
      }
    }
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
  if (input && input.value) setTimeout(() => { const s = $("#shelf"); if (s && location.hash !== "#faq") s.scrollIntoView({ block: "start" }); }, 50);

  $$(".nav-row a[data-cat]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    if (input) input.value = "";
    setCat(a.dataset.cat);
    const url = new URL(location.href);
    url.searchParams.delete("search");
    if (a.dataset.cat === "all") url.searchParams.delete("cat"); else url.searchParams.set("cat", a.dataset.cat);
    history.replaceState({}, "", url.pathname + url.search + "#shelf");
    $("#shelf").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  if (input) input.addEventListener("input", () => { if (cat !== "all") setCat("all"); else apply(); });
  const form = $("[data-search-form]");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    if (cat !== "all") setCat("all"); else apply();
    if (input) input.blur();
    $("#shelf").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return true;
}

/* ---------- Other pages: live suggestions under the search box ---------- */
function setupSuggestions() {
  const wrap = $("[data-search-wrap]");
  const input = $("[data-search]");
  if (!wrap || !input) return;
  const list = document.createElement("ul");
  list.className = "suggest"; list.setAttribute("role", "listbox"); list.id = "suggest-list"; list.hidden = true;
  wrap.append(list);
  input.setAttribute("aria-controls", "suggest-list");
  let active = -1;

  function close() { list.hidden = true; active = -1; }
  function render() {
    const q = input.value.trim();
    if (!q) { close(); return; }
    const hits = searchBooks(q);
    if (!hits.length) {
      list.innerHTML = '<li class="suggest-none">No ebooks match “' + q.replace(/[<>&"]/g, "") + '”. Try health, sleep, AI or money.</li>';
    } else {
      list.innerHTML = hits.map((d, i) => '<li role="option"><a href="' + d.slug + '.html" data-i="' + i + '">' +
        '<span class="sg-thumb"><img src="covers/' + d.slug + '-400.jpg" alt="" width="40" height="60" decoding="async"></span>' +
        '<span class="sg-text"><b>' + d.title + '</b><small>' + d.catLabel + ' · $5.99</small></span></a></li>').join("");
    }
    list.hidden = false; active = -1;
  }
  function move(step) {
    const links = $$("a", list);
    if (!links.length) return;
    active = (active + step + links.length) % links.length;
    links.forEach((a, i) => a.classList.toggle("on", i === active));
    links[active].scrollIntoView({ block: "nearest" });
  }
  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Escape") close();
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); $$("a", list)[active].click(); }
  });
  document.addEventListener("click", e => { if (!wrap.contains(e.target)) close(); });
}

/* ---------- Wire up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateBadge();
  if (!setupShelf()) setupSuggestions();
  renderCart();

  document.addEventListener("click", e => {
    const bd = e.target.closest(".bundle");
    if (bd && !e.target.closest("a, button")) { const go = $(".text-link", bd); if (go) { location.href = go.href; return; } }
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const buy = e.target.closest("[data-buy]");
    if (buy) { buyNow(buy.dataset.buy); return; }
    const rem = e.target.closest("[data-remove]");
    if (rem) { removeFromCart(rem.dataset.remove); return; }
    if (e.target.closest("[data-checkout]")) startCheckout();
  });

  /* Product and bundle pages: hide the "checkout is being connected" note once a link exists */
  const productId = document.body.dataset.product || "";
  if (productId && CHECKOUT_LINKS[productId]) $$("[data-checkout-note]").forEach(el => { el.hidden = true; });

  window.addEventListener("storage", () => { updateBadge(); renderCart(); });
});

/* ---------- Motion: scroll reveal, add-to-cart feedback, progress bar. Plain JS, no libraries. ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  function setup() {
    // Scroll reveal for things below the first screen
    var sel = ".sec-head, .card, .bundle, .trust > *, .faq details, .faq-side, .foot-grid > div, .more-card, .product .block, .facts, .bundle-bar, .cart-line, .summary";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add("in");
        setTimeout(function () { el.classList.remove("reveal", "in"); el.style.removeProperty("--d"); }, 1200);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(sel).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) return; // already on screen at load
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(sel); }) : [el];
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 3) * 90 + "ms");
      el.classList.add("reveal");
      io.observe(el);
    });

    // Thin progress bar at the top of the page
    var bar = document.createElement("div");
    bar.className = "scrollbar"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var ticking = false;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();

    // Add-to-cart feedback
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]");
      if (!btn) return;
      var before = null;
      try { before = localStorage.getItem("ebook-cart-v1"); } catch (x) {}
      setTimeout(function () {
        var after = null;
        try { after = localStorage.getItem("ebook-cart-v1"); } catch (x) {}
        if (after === before) return;
        var label = btn.textContent;
        btn.classList.add("added"); btn.textContent = "Added ✓";
        setTimeout(function () { btn.classList.remove("added"); btn.textContent = label; }, 1400);
        var c = document.querySelector(".cart-btn");
        if (c) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
      }, 0);
    }, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
})();


/* ---------- FAQ: one open at a time; footer: back to top ---------- */
(function () {
  function setup() {
    var items = document.querySelectorAll(".faq details");
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
    var top = document.querySelector("[data-top]");
    if (top) top.addEventListener("click", function () {
      var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
})();


/* ---------- Cookie consent: analytics stay off until the visitor accepts ---------- */
(function () {
  var KEY = "ebook-consent";
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function setConsent(granted) {
    if (typeof gtag === "function") gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
  }
  function build() {
    var box = document.createElement("div");
    box.className = "cookie"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Cookie choices"); box.hidden = true;
    box.innerHTML = '<p>We use cookies for anonymous visit statistics so we can improve the store. Your cart works without them. <a href="/privacy.html#cookies">Read more</a></p>' +
      '<div class="cookie-btns"><button type="button" class="btn btn-outline btn-sm" data-cookie="denied">Decline</button>' +
      '<button type="button" class="btn btn-brand btn-sm" data-cookie="granted">Accept</button></div>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cookie]"); if (!b) return;
      var granted = b.getAttribute("data-cookie") === "granted";
      save(granted ? "granted" : "denied"); setConsent(granted); box.hidden = true;
    });
    return box;
  }
  function setup() {
    var box = build();
    if (!read()) box.hidden = false;
    var legal = document.querySelector(".legal");
    if (legal) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "cookie-link"; b.textContent = "Cookie settings";
      legal.appendChild(document.createTextNode(" ")); legal.appendChild(b);
      b.addEventListener("click", function () { box.hidden = false; });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
})();
