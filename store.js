/* Store search and category filters. Add individual checkout URLs only when they are ready. */
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
  const isHome = /(?:^|\/)index\.html$/.test(location.pathname) || location.pathname.endsWith("/Ebook-/") || location.pathname.endsWith("/");

  function applyFilters() {
    const term = (search?.value || "").trim().toLowerCase().replace(/\s+/g, " ");
    let visible = 0;
    const visibleTitles = new Set();
    cards.forEach(card => {
      const searchable = [
        card.dataset.search || "",
        card.dataset.category || "",
        card.innerText || "",
        card.querySelector("h3")?.innerText || ""
      ].join(" ").toLowerCase();
      const matchesTerm = !term || searchable.includes(term) || term.split(" ").every(word => searchable.includes(word));
      const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
      const show = matchesTerm && matchesFilter;
      card.hidden = !show;
      if (show) {
        visible++;
        const link = card.querySelector("a[href]");
        visibleTitles.add(link?.getAttribute("href") || card.innerText);
      }
    });
    if (status) status.textContent = term
      ? (visibleTitles.size ? "Showing " + visibleTitles.size + " matching ebook" + (visibleTitles.size === 1 ? "." : "s.") : "No matching ebooks. Try another title or topic.")
      : "Showing all " + visibleTitles.size + " ebooks.";
    if (count) count.innerHTML = "<strong>" + visibleTitles.size + " matching guide" + (visibleTitles.size === 1 ? "" : "s") + "</strong> · PDF format";
  }

  if (search) {
    const params = new URLSearchParams(location.search);
    const initialQuery = params.get("search") || params.get("q") || "";
    if (initialQuery) search.value = initialQuery;
    search.addEventListener("input", applyFilters);
  }

  searchForm?.addEventListener("submit", event => {
    const term = (search?.value || "").trim();
    if (isHome) {
      event.preventDefault();
      applyFilters();
      document.querySelector("#library")?.scrollIntoView({ behavior: "smooth" });
    } else if (term) {
      event.preventDefault();
      location.href = "index.html?search=" + encodeURIComponent(term) + "#library";
    }
  });

  filterButtons.forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    applyFilters();
  }));

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
