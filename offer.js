// offer.js — page-local behaviour for the Sunrise Print landing page.
// Snipcart itself is loaded by /script.js; this file only handles
// scroll reveal, the sticky CTA bar, and the urgency countdown.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // --- Footer year (in case /script.js runs before this element) -------
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Scroll reveal + sticky CTA --------------------------------------
  // Driven by a throttled scroll/resize handler rather than
  // IntersectionObserver — a plain geometry check works reliably in every
  // rendering context (including headless previews where IO may not fire).
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal")
  );
  var hero = document.getElementById("hero");
  var stickyCta = document.getElementById("stickyCta");

  if (reduceMotion) {
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  function updateOnScroll() {
    var viewportH = window.innerHeight;

    // Reveal any section whose top has scrolled into the lower viewport.
    if (!reduceMotion) {
      revealEls.forEach(function (el) {
        if (el.classList.contains("in-view")) return;
        var top = el.getBoundingClientRect().top;
        if (top < viewportH * 0.85) {
          el.classList.add("in-view");
        }
      });
    }

    // Sticky CTA: visible once the hero has scrolled mostly out of view.
    if (hero && stickyCta) {
      var heroBottom = hero.getBoundingClientRect().bottom;
      var show = heroBottom < viewportH * 0.4;
      stickyCta.classList.toggle("visible", show);
      stickyCta.setAttribute("aria-hidden", show ? "false" : "true");
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

  // --- Urgency countdown: fixed deadline -------------------------------
  // Counts down to a real, fixed date so the figure is the same for every
  // visitor and doesn't reset on reload. Edit DEADLINE to change the date.
  var countdownEl = document.getElementById("countdown");
  if (countdownEl) {
    var DEADLINE = new Date("2026-07-04T23:59:59").getTime();

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    function tick() {
      var remaining = DEADLINE - Date.now();
      if (remaining <= 0) {
        countdownEl.textContent = "Offer ended";
        clearInterval(timer);
        return;
      }
      var totalSeconds = Math.floor(remaining / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;
      countdownEl.textContent =
        days + "d " + pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    }

    tick();
    var timer = setInterval(tick, 1000);
  }
})();
