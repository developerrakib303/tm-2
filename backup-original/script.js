/* =========================================================
   SG REPAIR — interactions
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  /* -------------------- Mobile navigation -------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var siteHeader = document.querySelector(".site-header");

  function setMenu(open) {
    mainNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
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
  }

  /* -------------------- Active nav link on scroll -------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".main-nav a[href^='#']")
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function setActiveLink() {
    var pos = window.scrollY + 140;
    var currentId = "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = "#" + sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === currentId);
    });
  }
  if (sections.length) {
    window.addEventListener("scroll", setActiveLink, { passive: true });
    setActiveLink();
  }

  /* -------------------- Count-up stats -------------------- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    var suffix = el.textContent.indexOf("+") !== -1 ? "+" : "";
    var duration = 1600;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* -------------------- Scroll reveal + counters -------------------- */
  var revealEls = document.querySelectorAll(
    ".section-heading, .hero__copy, .service-grid, .feature-card, " +
      ".why__copy, .stats-banner, .process-card, .testimonial-grid, " +
      ".cta, .brands, .footer__grid > *"
  );

  if ("IntersectionObserver" in window) {
    revealEls.forEach(function (el, i) {
      el.classList.add("reveal");
      // subtle stagger within sibling groups
      el.style.transitionDelay = (i % 4) * 80 + "ms";
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
      var suffix = el.textContent.indexOf("+") !== -1 ? "+" : "";
      el.textContent = el.dataset.count + suffix;
    });
  }

  /* -------------------- Reusable carousel --------------------
     Only ever scrolls the carousel CONTAINER horizontally — it never
     calls scrollIntoView / moves the page, so page scrolling is never
     overridden. Activates only when the cards overflow (mobile/tablet);
     on desktop the cards are a static grid and nothing rotates. */
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
          cards[active].getBoundingClientRect().left -
          grid.getBoundingClientRect().left;
        grid.scrollTo({ left: grid.scrollLeft + delta, behavior: "smooth" });
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
            if (d < bd) {
              bd = d;
              best = k;
            }
          });
          highlight(best);
        });
      },
      { passive: true }
    );

    function startAuto() {
      stopAuto();
      if (!isCarousel()) return;
      timer = setInterval(function () {
        go(active + 1);
      }, 5000);
    }
    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.setAttribute("role", "button");
      dot.setAttribute("tabindex", "0");
      dot.addEventListener("click", function () {
        go(i);
        startAuto();
      });
      dot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(i);
          startAuto();
        }
      });
    });

    grid.addEventListener("mouseenter", stopAuto);
    grid.addEventListener("mouseleave", startAuto);
    grid.addEventListener("touchstart", stopAuto, { passive: true });
    grid.addEventListener("touchend", startAuto, { passive: true });

    var rt = null;
    window.addEventListener("resize", function () {
      if (rt) clearTimeout(rt);
      rt = setTimeout(function () {
        highlight(active);
        startAuto();
      }, 200);
    });

    startAuto();
  }

  initCarousel(
    document.querySelector(".service-grid"),
    document.querySelector(".dots--services"),
    ".service-card"
  );
  initCarousel(
    document.querySelector(".testimonial-grid"),
    document.querySelector(".dots:not(.dots--services)"),
    ".testimonial-card"
  );

  /* -------------------- Year in footer (auto) -------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
