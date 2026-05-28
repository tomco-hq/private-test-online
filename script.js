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
