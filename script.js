/* =========================================================
   PRIME TECH ENGINEERING — "Meridian" interactions
   ========================================================= */
(function () {
  "use strict";

  var docEl = document.documentElement;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------- Mobile navigation -------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var siteHeader = document.querySelector(".site-header");

  function setMenu(open) {
    if (!mainNav || !navToggle) return;
    mainNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (siteHeader) siteHeader.classList.toggle("menu-open", open);
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      setMenu(!mainNav.classList.contains("is-open"));
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mainNav.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });

    // close the mobile menu if we resize up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && mainNav.classList.contains("is-open")) setMenu(false);
    });
  }

  /* -------------------- Sticky header shadow -------------------- */
  function updateHeader() {
    if (siteHeader) siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  /* -------------------- Active nav link on scroll -------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".main-nav a[href^='#']")
  );
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.length > 1 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  function setActiveLink() {
    var pos = window.scrollY + 130;
    var currentId = "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = "#" + sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === currentId);
    });
  }
  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      updateHeader();
      if (sections.length) setActiveLink();
      scrollTicking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------- FAQ accordion -------------------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
  faqItems.forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      // single-open: close every item first
      faqItems.forEach(function (other) {
        other.classList.remove("is-open");
        var b = other.querySelector(".faq-q");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* -------------------- Count-up stats -------------------- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    var suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* -------------------- Scroll reveal + counters -------------------- */
  docEl.classList.add("js-ready");
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    revealEls.forEach(function (el) {
      var group = el.parentElement;
      if (group) {
        var siblings = Array.prototype.slice.call(group.querySelectorAll(":scope > .reveal"));
        var i = siblings.indexOf(el);
        if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
      }
    });

    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  }

  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-count]").forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  }

  /* -------------------- Testimonial carousel (mobile only) --------------------
     Scrolls only the carousel container horizontally; never moves the page. */
  function initCarousel(grid, dotsWrap, cardSel) {
    if (!grid || !dotsWrap) return;
    var cards = grid.querySelectorAll(cardSel);
    var dots = dotsWrap.querySelectorAll("span");
    if (!cards.length || !dots.length) return;

    var active = 0;
    var timer = null;
    var raf = null;

    function isCarousel() {
      return grid.scrollWidth - grid.clientWidth > 4;
    }
    function highlight(i) {
      active = (i + dots.length) % dots.length;
      dots.forEach(function (d, k) {
        d.classList.toggle("active", k === active);
      });
    }
    function go(i) {
      highlight(i);
      if (isCarousel() && cards[active]) {
        var delta =
          cards[active].getBoundingClientRect().left - grid.getBoundingClientRect().left;
        grid.scrollTo({ left: grid.scrollLeft + delta, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }

    grid.addEventListener(
      "scroll",
      function () {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          if (!isCarousel()) return;
          var gl = grid.getBoundingClientRect().left;
          var best = 0;
          var bd = Infinity;
          cards.forEach(function (c, k) {
            var d = Math.abs(c.getBoundingClientRect().left - gl);
            if (d < bd) { bd = d; best = k; }
          });
          highlight(best);
        });
      },
      { passive: true }
    );

    function startAuto() {
      stopAuto();
      if (!isCarousel() || reduceMotion) return;
      timer = setInterval(function () { go(active + 1); }, 5500);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach(function (dot, i) {
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-label", "Go to review " + (i + 1));
      dot.addEventListener("click", function () { go(i); startAuto(); });
      dot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); startAuto(); }
      });
    });

    grid.addEventListener("mouseenter", stopAuto);
    grid.addEventListener("mouseleave", startAuto);
    grid.addEventListener("touchstart", stopAuto, { passive: true });
    grid.addEventListener("touchend", startAuto, { passive: true });

    var rt = null;
    window.addEventListener("resize", function () {
      if (rt) clearTimeout(rt);
      rt = setTimeout(function () { highlight(active); startAuto(); }, 200);
    });

    startAuto();
  }

  initCarousel(
    document.querySelector(".testimonial-grid"),
    document.querySelector(".dots"),
    ".testimonial-card"
  );

  /* -------------------- Coverage map pins (tap / click to reveal district) -------------------- */
  var coveragePins = Array.prototype.slice.call(document.querySelectorAll(".sg-pin"));
  if (coveragePins.length) {
    var clearPins = function (except) {
      coveragePins.forEach(function (p) {
        if (p !== except) p.classList.remove("is-active");
      });
    };
    var togglePin = function (pin) {
      var willOpen = !pin.classList.contains("is-active");
      clearPins(pin);
      pin.classList.toggle("is-active", willOpen);
      // bring the active pin to the front so its label isn't covered by later pins
      if (willOpen && pin.parentNode) pin.parentNode.appendChild(pin);
    };
    coveragePins.forEach(function (pin) {
      pin.addEventListener("click", function () { togglePin(pin); });
      pin.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePin(pin); }
      });
    });
    // dismiss when tapping/clicking anywhere outside a pin
    document.addEventListener("click", function (e) {
      if (!(e.target && e.target.closest && e.target.closest(".sg-pin"))) clearPins(null);
    });
  }

  /* -------------------- Year in footer -------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
