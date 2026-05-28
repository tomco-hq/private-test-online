// Site-wide script.
//
// Single source of truth for Snipcart: the public API key, version, and
// load behavior are configured here ONCE. No HTML page hardcodes the key.
// The loader below injects Snipcart's CSS + JS on first user interaction,
// so pages stay fast until a visitor moves toward the cart.

// --- Footer year ----------------------------------------------------------

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// --- Snipcart (modern v3.4+ install) -------------------------------------

// Replace publicApiKey with your real key from the Snipcart dashboard:
// Store management > API keys.
window.SnipcartSettings = {
  publicApiKey: "YOUR_SNIPCART_API_KEY",
  loadStrategy: "on-user-interaction",
  version: "3.7.1",
};

// Official Snipcart loader. Creates the #snipcart container and injects the
// theme CSS + JS automatically — no per-page Snipcart markup required.
(() => {
  var c, d;
  (d = (c = window.SnipcartSettings).version) != null || (c.version = "3.0");
  var s, S;
  (S = (s = window.SnipcartSettings).timeoutDuration) != null ||
    (s.timeoutDuration = 2750);
  var l, p;
  (p = (l = window.SnipcartSettings).domain) != null ||
    (l.domain = "cdn.snipcart.com");
  var w, u;
  (u = (w = window.SnipcartSettings).protocol) != null ||
    (w.protocol = "https");
  var m =
    window.SnipcartSettings.version.includes("v3.0.0-ci") ||
    (window.SnipcartSettings.version != "3.0" &&
      window.SnipcartSettings.version.localeCompare("3.4.0", void 0, {
        numeric: true,
        sensitivity: "base",
      }) === -1);
  var f = ["focus", "mouseover", "touchmove", "scroll", "keydown"];
  window.LoadSnipcart = o;
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", r)
    : r();
  function r() {
    window.SnipcartSettings.loadStrategy
      ? window.SnipcartSettings.loadStrategy === "on-user-interaction" &&
        (f.forEach((t) => document.addEventListener(t, o)),
        setTimeout(o, window.SnipcartSettings.timeoutDuration))
      : o();
  }
  var a = false;
  function o() {
    if (a) return;
    a = true;
    let t = document.getElementsByTagName("head")[0],
      e = document.querySelector("#snipcart"),
      i = document.querySelector(
        `src[src^="${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}"][src$="snipcart.js"]`,
      ),
      n = document.querySelector(
        `link[href^="${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}"][href$="snipcart.css"]`,
      );
    e ||
      ((e = document.createElement("div")),
      (e.id = "snipcart"),
      e.setAttribute("hidden", "true"),
      document.body.appendChild(e));
    v(e);
    i ||
      ((i = document.createElement("script")),
      (i.src = `${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}/themes/v${window.SnipcartSettings.version}/default/snipcart.js`),
      (i.async = true),
      t.appendChild(i));
    n ||
      ((n = document.createElement("link")),
      (n.rel = "stylesheet"),
      (n.type = "text/css"),
      (n.href = `${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}/themes/v${window.SnipcartSettings.version}/default/snipcart.css`),
      t.prepend(n));
    f.forEach((c) => document.removeEventListener(c, o));
  }
  function v(t) {
    if (!m) return;
    t.dataset.apiKey = window.SnipcartSettings.publicApiKey;
    t.dataset.configModalStyle = "side";
  }
})();

// --- Mobile drawer nav ----------------------------------------------------
//
// Progressive enhancement: inject a hamburger toggle so the nav collapses
// into a drawer on narrow screens. No per-page markup is required and the
// markup is untouched, so v1/v2 stay identical for the CSS A/B — only CSS
// decides WHEN the toggle shows (v1 max-width, v2 min-width).
(function () {
  function setupDrawer(container, menu, placeToggleFirst) {
    if (!container || !menu || container.querySelector(".nav-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Toggle menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";
    if (placeToggleFirst) container.insertBefore(btn, container.firstChild);
    else container.appendChild(btn);

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!container.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Inner pages: the .nav bar is its own container + menu.
    var inner = document.querySelector(".nav");
    if (inner) setupDrawer(inner, inner, true);
    // Home: toggle lives in .site-header; the .anchor-nav is the drawer.
    var header = document.querySelector(".site-header");
    var anchor = header && header.querySelector(".anchor-nav");
    if (header && anchor) setupDrawer(header, anchor, false);
  });
})();

// --- Sticky add-to-cart bar (product detail pages) -----------------------
//
// Progressive enhancement: on a product page, mirror the in-page "Add to
// cart" button into a fixed bottom bar that slides up once the real button
// scrolls out of view. JS-injected with no markup change, so v1/v2 stay
// identical for the CSS A/B; CSS only styles the bar (shared, identical).
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var detail = document.querySelector(".product-detail");
    if (!detail) return;
    var addBtn = detail.querySelector(".snipcart-add-item");
    if (!addBtn) return;

    var nameEl = document.querySelector("header h1");
    var priceEl = document.querySelector("header .tagline");

    var bar = document.createElement("div");
    bar.className = "product-sticky-cta";
    bar.setAttribute("aria-hidden", "true");

    var meta = document.createElement("div");
    meta.className = "sticky-meta";
    meta.innerHTML =
      '<span class="sticky-name"></span><span class="sticky-price"></span>';
    meta.querySelector(".sticky-name").textContent = nameEl
      ? nameEl.textContent.trim()
      : "";
    meta.querySelector(".sticky-price").textContent = priceEl
      ? priceEl.textContent.trim()
      : "";

    // Clone the Snipcart button so it carries identical data-item-* attrs;
    // Snipcart binds by class, so the clone adds to cart like the original.
    var clone = addBtn.cloneNode(true);
    clone.removeAttribute("id");

    bar.appendChild(meta);
    bar.appendChild(clone);
    document.body.appendChild(bar);

    function show(visible) {
      bar.classList.toggle("is-visible", visible);
      bar.setAttribute("aria-hidden", String(!visible));
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          // Show the bar only while the real button is off-screen.
          show(!entries[0].isIntersecting);
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(addBtn);
    }
  });
})();

// --- Shop controls: search + sort (shop page only) -----------------------
//
// Inject a search box + sort dropdown above the product grid on inner pages
// (shop.html). Skipped on the home page because that grid is the .site-header
// home layout, not the shop catalog. JS-injected, no markup change.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".nav"); // inner-page sentinel (home uses .site-header)
    var grid = document.querySelector(".product-grid");
    if (!nav || !grid) return;

    var cards = Array.prototype.slice.call(
      grid.querySelectorAll(".product-card"),
    );
    if (cards.length < 2) return;

    var items = cards.map(function (card) {
      var nameEl = card.querySelector("h3");
      var priceEl = card.querySelector(".price");
      var priceText = priceEl
        ? priceEl.textContent.replace(/[^0-9.]/g, "")
        : "0";
      return {
        card: card,
        name: nameEl ? nameEl.textContent.trim().toLowerCase() : "",
        price: parseFloat(priceText) || 0,
      };
    });

    var controls = document.createElement("div");
    controls.className = "shop-controls";
    controls.innerHTML =
      '<div class="field">' +
      '<label for="shop-search">Search</label>' +
      '<input id="shop-search" type="search" placeholder="Search products" autocomplete="off" />' +
      "</div>" +
      '<div class="field">' +
      '<label for="shop-sort">Sort</label>' +
      '<select id="shop-sort">' +
      '<option value="default">Featured</option>' +
      '<option value="price-asc">Price: low to high</option>' +
      '<option value="price-desc">Price: high to low</option>' +
      '<option value="name">Name A&ndash;Z</option>' +
      "</select>" +
      "</div>" +
      '<span class="count" data-shop-count></span>';
    grid.parentNode.insertBefore(controls, grid);

    var empty = document.createElement("p");
    empty.className = "shop-empty";
    empty.hidden = true;
    empty.textContent = "No products match.";
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    var searchEl = controls.querySelector("#shop-search");
    var sortEl = controls.querySelector("#shop-sort");
    var countEl = controls.querySelector("[data-shop-count]");

    function apply() {
      var q = searchEl.value.trim().toLowerCase();
      var s = sortEl.value;
      var ordered = items.slice();
      if (s === "price-asc")
        ordered.sort(function (a, b) { return a.price - b.price; });
      else if (s === "price-desc")
        ordered.sort(function (a, b) { return b.price - a.price; });
      else if (s === "name")
        ordered.sort(function (a, b) { return a.name.localeCompare(b.name); });

      // Re-attach in the new order (appendChild on existing nodes reorders).
      ordered.forEach(function (it) { grid.appendChild(it.card); });

      var visible = 0;
      ordered.forEach(function (it) {
        var match = !q || it.name.indexOf(q) !== -1;
        it.card.classList.toggle("is-hidden", !match);
        if (match) visible++;
      });
      countEl.textContent = visible + " of " + items.length;
      empty.hidden = visible !== 0;
    }

    searchEl.addEventListener("input", apply);
    sortEl.addEventListener("change", apply);
    apply();
  });
})();

// --- Quantity selector (product detail pages) ----------------------------
//
// Insert a stepper before the Add-to-cart button. Snipcart reads
// data-item-quantity on click, so we sync the value to every
// .snipcart-add-item on the page (including the sticky-bar clone).
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var detail = document.querySelector(".product-detail");
    if (!detail) return;
    var addBtn = detail.querySelector(".snipcart-add-item");
    if (!addBtn) return;

    var wrap = document.createElement("div");
    wrap.className = "qty-selector";
    wrap.innerHTML =
      '<label for="qty-input">Quantity</label>' +
      '<span class="qty-group">' +
      '<button type="button" aria-label="Decrease quantity" data-qty="-1">&minus;</button>' +
      '<input id="qty-input" type="number" inputmode="numeric" min="1" max="99" value="1" />' +
      '<button type="button" aria-label="Increase quantity" data-qty="1">+</button>' +
      "</span>";
    addBtn.parentNode.insertBefore(wrap, addBtn);

    var input = wrap.querySelector("input");

    function syncAll() {
      var v = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));
      input.value = v;
      // Sync to every Snipcart button (including any sticky-bar clone).
      var all = document.querySelectorAll(".snipcart-add-item");
      for (var i = 0; i < all.length; i++)
        all[i].setAttribute("data-item-quantity", v);
    }

    wrap.querySelectorAll("button[data-qty]").forEach(function (b) {
      b.addEventListener("click", function () {
        input.value =
          (parseInt(input.value, 10) || 1) +
          parseInt(b.getAttribute("data-qty"), 10);
        syncAll();
      });
    });
    input.addEventListener("input", syncAll);
    input.addEventListener("change", syncAll);
    syncAll();
  });
})();

// --- Image lightbox (product detail pages) -------------------------------
//
// Click/keyboard-activate the detail image to view it full-screen. Closes on
// the close button, outside click, or Escape. Single-image gallery; multi-
// image support would need products.json to carry an image array.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var img = document.querySelector(".product-detail-img");
    if (!img) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">✕</button>' +
      '<img alt="" />';
    document.body.appendChild(box);

    var bigImg = box.querySelector("img");
    var closeBtn = box.querySelector(".lightbox-close");

    function open() {
      bigImg.src = img.currentSrc || img.src;
      bigImg.alt = img.alt || "";
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
    }

    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.addEventListener("click", open);
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });
  });
})();
