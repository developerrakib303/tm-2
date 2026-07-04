/* =========================================================
   PRIME TECH ENGINEERING — Single Service page interactions
   Booking form validation + accessible gallery lightbox
   Loaded AFTER script.js (which handles nav, FAQ, reveal…)
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     BOOKING FORM — inline validation + success state
     ============================================================ */
  var form = document.getElementById("bookingForm");

  if (form) {
    var formCard = form.closest(".book__form");

    var setInvalid = function (field, control, invalid) {
      if (!field) return;
      field.classList.toggle("is-invalid", invalid);
      var ctrl = control || field.querySelector(".input, .select, .textarea, input[type='checkbox']");
      var err = field.querySelector(".field__err");
      if (ctrl) {
        ctrl.setAttribute("aria-invalid", invalid ? "true" : "false");
        // associate the visible error text so screen readers announce the reason on focus
        if (err && err.id) {
          if (invalid) ctrl.setAttribute("aria-describedby", err.id);
          else ctrl.removeAttribute("aria-describedby");
        }
      }
    };

    var emailOk = function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    };
    var phoneOk = function (v) {
      // 8+ digits once separators/“+” are stripped — Singapore-friendly, forgiving of format
      return (v.replace(/[\s()+-]/g, "").match(/\d/g) || []).length >= 8;
    };

    var validateControl = function (control) {
      // every control (including the consent checkbox) lives inside a .field wrapper
      var field = control.closest(".field");
      if (!field) return true;

      var value = (control.value || "").trim();
      var ok = true;

      if (control.type === "checkbox") {
        ok = control.checked;
      } else if (control.hasAttribute("required") && !value) {
        ok = false;
      } else if (control.type === "email" && value) {
        ok = emailOk(value);
      } else if (control.type === "tel" && value) {
        ok = phoneOk(value);
      }

      setInvalid(field, control, !ok);
      return ok;
    };

    var controls = Array.prototype.slice.call(
      form.querySelectorAll("input, select, textarea")
    );

    // re-validate a field the moment the user corrects it
    controls.forEach(function (control) {
      var evt = control.tagName === "SELECT" || control.type === "checkbox" ? "change" : "blur";
      control.addEventListener(evt, function () {
        validateControl(control);
      });
      control.addEventListener("input", function () {
        var field = control.closest(".field");
        if (field && field.classList.contains("is-invalid")) validateControl(control);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstBad = null;
      controls.forEach(function (control) {
        var ok = validateControl(control);
        if (!ok && !firstBad) firstBad = control;
      });

      if (firstBad) {
        firstBad.focus();
        if (typeof firstBad.scrollIntoView === "function") {
          firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        return;
      }

      // success — no backend wired, so we surface a confirmation state
      if (formCard) {
        formCard.classList.add("is-sent");
        var success = formCard.querySelector(".form-success");
        if (success && typeof success.scrollIntoView === "function") {
          success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        var heading = formCard.querySelector(".form-success h3");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
      }
      form.reset();
    });
  }

  /* ============================================================
     GALLERY LIGHTBOX
     ============================================================ */
  var lightbox = document.getElementById("lightbox");
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));

  if (lightbox && items.length) {
    var lbImg = document.getElementById("lightboxImg");
    var lbCap = document.getElementById("lightboxCap");
    var lbCount = document.getElementById("lightboxCount");
    var current = 0;
    var lastFocused = null;

    var decode = function (html) {
      var t = document.createElement("textarea");
      t.innerHTML = html;
      return t.value;
    };

    var render = function (i) {
      current = (i + items.length) % items.length;
      var btn = items[current];
      var full = btn.getAttribute("data-full");
      var cap = decode(btn.getAttribute("data-caption") || "");
      var img = btn.querySelector("img");
      lbImg.setAttribute("src", full);
      lbImg.setAttribute("alt", (img && img.getAttribute("alt")) || cap);
      if (lbCap) lbCap.textContent = cap;
      if (lbCount) lbCount.textContent = " · " + (current + 1) + " / " + items.length;
    };

    var open = function (i) {
      lastFocused = document.activeElement;
      render(i);
      lightbox.hidden = false;
      // allow the browser to paint before flipping the display flag (for future transitions)
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      var closeBtn = lightbox.querySelector(".lightbox__close");
      if (closeBtn) closeBtn.focus();
    };

    var close = function () {
      lightbox.classList.remove("is-open");
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    };

    items.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        open(i);
      });
    });

    lightbox.addEventListener("click", function (e) {
      var action = e.target.closest("[data-lb]");
      if (action) {
        var kind = action.getAttribute("data-lb");
        if (kind === "close") close();
        else if (kind === "prev") render(current - 1);
        else if (kind === "next") render(current + 1);
        return;
      }
      // click on the backdrop (outside the stage) closes
      if (!e.target.closest(".lightbox__stage")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") render(current - 1);
      else if (e.key === "ArrowRight") render(current + 1);
      else if (e.key === "Tab") {
        // simple focus trap within the lightbox controls
        var focusables = Array.prototype.slice.call(
          lightbox.querySelectorAll("button:not([disabled])")
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
