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
