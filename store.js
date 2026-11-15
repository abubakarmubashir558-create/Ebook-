/* Ebook store search and filters */
const GUMROAD_LINKS = {
  "ai-money-machine": "",
  "gut-reset": "",
  "gen-z-wealth-code": "",
  "sleep-like-a-ceo": ""
};

document.addEventListener("DOMContentLoaded", () => {
  const search = document.querySelector("[data-store-search]");
  const searchForm = search?.closest("form");
  const cards = [...document.querySelectorAll("[data-book-card]")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const status = document.querySelector("[data-search-status]");
  const count = document.querySelector("[data-results-count]");
  let activeFilter = "all";
  const isHome = /(?:^|\/)index\.html$/.test(location.pathname) ||
    location.pathname.endsWith("/Ebook-/") || location.pathname.endsWith("/");

  const normalize = value => (value || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

  function applyFilters() {
    const term = normalize(search?.value);
    const words = term.split(" ").filter(Boolean);
    const titles = new Set();

    cards.forEach(card => {
      const searchable = normalize([
        card.dataset.search, card.dataset.category, card.innerText,
        card.querySelector("h3")?.innerText
      ].join(" "));
      const matchesTerm = !words.length || words.every(word =>
        searchable.split(" ").some(token => token.startsWith(word) || token.includes(word))
      );
      const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
      const show = matchesTerm && matchesFilter;
      card.hidden = !show;
      if (show) titles.add(card.querySelector("a[href]")?.getAttribute("href") || card.innerText);
    });

    const n = titles.size;
    if (status) status.textContent = term
      ? (n ? "Found " + n + " matching ebook" + (n === 1 ? "." : "s.") :
        "No matching ebooks. Try a different title or keyword.")
      : "Showing all " + n + " ebooks.";
    if (count) count.textContent = n + " matching " + (n === 1 ? "guide" : "guides") + " · PDF format";
    return n;
  }

  if (search) {
    const params = new URLSearchParams(location.search);
    const initialQuery = params.get("search") || params.get("q") || "";
    if (initialQuery) search.value = initialQuery;
    search.addEventListener("input", applyFilters);
  }

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    applyFilters();
    if (isHome) {
      document.querySelector("#library")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const term = search?.value.trim();
      const url = new URL(location.href);
      if (term) url.searchParams.set("search", term);
      else url.searchParams.delete("search");
      history.replaceState({}, "", url);
    } else if (search?.value.trim()) {
      location.href = "index.html?search=" + encodeURIComponent(search.value.trim()) + "#library";
    }
  });

  filterButtons.forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    applyFilters();
    document.querySelector("#library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  document.querySelectorAll("[data-topic-filter]").forEach(link => {
    link.addEventListener("click", () => {
      const filter = link.dataset.topicFilter || "all";
      const control = document.querySelector('[data-filter="' + filter + '"]');
      if (control) control.click();
    });
  });

  const productId = document.body.dataset.product;
  const buyButton = document.querySelector("[data-buy-button]");
  const checkoutUrl = productId ? GUMROAD_LINKS[productId] : "";
  if (buyButton && checkoutUrl) {
    buyButton.href = checkoutUrl;
    buyButton.classList.remove("disabled");
    buyButton.removeAttribute("aria-disabled");
    buyButton.textContent = "Buy ebook";
    buyButton.target = "_blank";
    buyButton.rel = "noopener noreferrer";
  }

  applyFilters();
});
