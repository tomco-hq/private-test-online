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
  var stripEl = document.querySelector(".shipping-strip");
  var stripH = (stripEl && stripEl.offsetHeight) || 28;

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
      header.classList.toggle("scrolled-past-strip", window.pageYOffset > stripH);
    }
  }

  // --- Cart drawer ---------------------------------------------------
  var drawer = document.getElementById("cartDrawer");
  var backdrop = document.getElementById("cartBackdrop");
  var openBtn = document.getElementById("cartOpen");
  var closeBtn = document.getElementById("cartClose");
  var continueBtn = document.getElementById("cartContinue");
  var lastFocus = null;

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    backdrop.classList.add("open");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    setTimeout(function () { closeBtn && closeBtn.focus(); }, 50);
  }
  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener("click", openCart);
  if (closeBtn) closeBtn.addEventListener("click", closeCart);
  if (backdrop) backdrop.addEventListener("click", closeCart);
  if (continueBtn) continueBtn.addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("open")) closeCart();
  });

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
