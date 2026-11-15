/* Add each Gumroad product URL below after creating its Gumroad checkout page. Keep the quotes. */
const GUMROAD_LINKS = {
  "ai-money-machine": "",
  "gut-reset": "",
  "gen-z-wealth-code": "",
  "sleep-like-a-ceo": ""
};
document.addEventListener("DOMContentLoaded", () => {
  const search = document.querySelector("[data-store-search]");
  const cards = [...document.querySelectorAll("[data-book-card]")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  let activeFilter = "all";
  function applyFilters() {
    const term = (search?.value || "").trim().toLowerCase();
    cards.forEach(card => {
      const matchesTerm = !term || (card.dataset.search || card.innerText).toLowerCase().includes(term);
      const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
      card.hidden = !(matchesTerm && matchesFilter);
    });
  }
  search?.addEventListener("input", applyFilters);
  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    applyFilters();
  }));
  const productId = document.body.dataset.product;
  const buyButton = document.querySelector("[data-buy-button]");
  const gumroadUrl = productId ? GUMROAD_LINKS[productId] : "";
  if (buyButton && gumroadUrl) {
    buyButton.href = gumroadUrl;
    buyButton.classList.remove("disabled");
    buyButton.removeAttribute("aria-disabled");
    buyButton.textContent = "Buy ebook on Gumroad ↗";
    buyButton.target = "_blank";
    buyButton.rel = "noopener noreferrer";
  }
});
