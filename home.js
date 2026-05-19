// home.js — page-local behaviour for the long-scroll home page.
// Snipcart itself is loaded by /script.js; this file handles only the
// footer year, scroll reveal, and the sticky-header shadow.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // --- Footer year (in case /script.js runs before this element) ------
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Scroll reveal + header shadow ----------------------------------
  // Driven by a throttled scroll/resize handler rather than
  // IntersectionObserver — a plain geometry check works reliably in every
  // rendering context (including headless previews where IO may not fire).
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal")
  );
  var header = document.getElementById("siteHeader");

  if (reduceMotion) {
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  function updateOnScroll() {
    var viewportH = window.innerHeight;

    if (!reduceMotion) {
      revealEls.forEach(function (el) {
        if (el.classList.contains("in-view")) return;
        if (el.getBoundingClientRect().top < viewportH * 0.85) {
          el.classList.add("in-view");
        }
      });
    }

    if (header) {
      header.classList.toggle("scrolled", window.pageYOffset > 8);
    }
  }

  // Time-based throttle (no requestAnimationFrame: rAF callbacks don't run
  // in non-painting contexts, which would freeze scroll updates there).
  var lastRun = 0;
  function onScroll() {
    var now = Date.now();
    if (now - lastRun < 80) return;
    lastRun = now;
    updateOnScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateOnScroll();
})();
