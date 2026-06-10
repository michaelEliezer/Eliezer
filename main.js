/* ========================================
   ELIEZER â€” Main JS
   Loader, Scroll, Interactions
   ======================================== */

var canAnimate = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canAnimate) {
  document.documentElement.classList.add("has-gsap");
}

// ---- Mobile Navigation ----
(function () {
  var nav = document.getElementById("nav");
  var menu = document.querySelector("[data-nav-menu]");
  var links = document.querySelectorAll(".nav-links a");
  if (!nav || !menu) return;

  function setMenu(open) {
    nav.classList.toggle("nav--open", open);
    menu.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  menu.addEventListener("click", function () {
    setMenu(!nav.classList.contains("nav--open"));
  });

  links.forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
})();

// ---- Loader ----
(function () {
  var loader = document.getElementById("loader");
  if (!loader) {
    initAnimations();
    return;
  }

  var logo = loader.querySelector(".loader-logo");
  var startTime = Date.now();
  var maxWait = 3500;
  var finished = false;

  function finishLoader() {
    if (finished) return;
    finished = true;
    loader.classList.add("done");
    setTimeout(function () { initAnimations(); }, 900);
  }

  if (canAnimate) {
    if (logo) {
      gsap.fromTo(logo,
        { opacity: 0, y: 10, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out", delay: 0.15 }
      );
    }
    window.addEventListener("load", function () {
      var elapsed = Date.now() - startTime;
      var remaining = Math.max(0, 1600 - elapsed);
      setTimeout(finishLoader, remaining);
    });
    setTimeout(finishLoader, maxWait);
  } else {
    window.addEventListener("load", function () { setTimeout(finishLoader, 400); });
    setTimeout(finishLoader, maxWait);
  }
})();


// ---- Scroll Animations ----
function initAnimations() {
  if (window.__eliezerAnimInit) return;
  window.__eliezerAnimInit = true;

  var navbar = document.getElementById("nav");
  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navTicking = false;

  function updateNavState() {
    var scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    if (navbar) navbar.classList.toggle("scrolled", scrollPosition > 24);

    var activeSection = sections[0] ? sections[0].id : "";
    sections.forEach(function (section) {
      if (section.offsetTop - 140 <= scrollPosition) activeSection = section.id;
    });

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + activeSection;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function requestNavStateUpdate() {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(function () {
      updateNavState();
      navTicking = false;
    });
  }

  updateNavState();
  window.addEventListener("scroll", requestNavStateUpdate, { passive: true });
  window.addEventListener("resize", requestNavStateUpdate);

  if (!canAnimate) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: true
  });

  document.querySelectorAll(".reveal").forEach(function (el, index) {
    gsap.fromTo(el,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.85, delay: Math.min(index * 0.02, 0.12), ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      }
    );
  });

  ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    if (typeof initAnimations === "function") initAnimations();
  }, 200);
});

var activeScrollFrame = null;

function smoothScrollTo(targetY, duration) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetY);
    return;
  }

  if (activeScrollFrame) {
    cancelAnimationFrame(activeScrollFrame);
    activeScrollFrame = null;
  }

  var startY = window.pageYOffset || document.documentElement.scrollTop || 0;
  var distance = targetY - startY;
  var startTime = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));

    if (progress < 1) {
      activeScrollFrame = requestAnimationFrame(step);
    } else {
      activeScrollFrame = null;
    }
  }

  activeScrollFrame = requestAnimationFrame(step);
}


// ---- Review Panels ----
(function () {
  var panels = document.querySelectorAll(".review-panel");
  var navBtns = document.querySelectorAll(".review-nav-btn");
  var current = 0;
  var total = panels.length;

  function showPanel(index) {
    if (index < 0 || index >= total) return;
    panels[current].classList.remove("active");
    navBtns[current].classList.remove("active");
    navBtns[current].setAttribute("aria-pressed", "false");
    current = index;
    panels[current].classList.add("active");
    navBtns[current].classList.add("active");
    navBtns[current].setAttribute("aria-pressed", "true");
  }

  navBtns.forEach(function (btn) {
    btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");

    btn.addEventListener("click", function () {
      var idx = parseInt(btn.getAttribute("data-nav"), 10);
      if (!isNaN(idx)) showPanel(idx);
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); showPanel((current + 1) % total); }
      if (e.key === "ArrowLeft") { e.preventDefault(); showPanel((current - 1 + total) % total); }
    });
  });
})();


// ---- Archive Room ----
(function () {
  var triggers = document.querySelectorAll("[data-archive-trigger], [data-archive-open]");
  var lastTrigger = null;
  var archive = document.getElementById("archive");
  if (!archive) return;

  var closeBtn = archive.querySelector(".archive-close");
  var archiveTitle = document.getElementById("archiveTitle");
  var panels = archive.querySelectorAll(".archive-panel");
  var isOpen = false;

  var projectTitles = {
    atelier: "Atelier Studio â€” Archive",
    frost: "Frost Node â€” Archive",
    aura: "Aura Spaces â€” Archive"
  };

  function openArchive(project) {
    if (isOpen) return;
    isOpen = true;
    archive.classList.remove("archive--revealed");

    // Show correct panel
    panels.forEach(function (panel) {
      panel.classList.toggle("active", panel.getAttribute("data-panel") === project);
    });

    // Update title
    if (archiveTitle && projectTitles[project]) {
      archiveTitle.textContent = projectTitles[project];
    }

    archive.classList.add("open");
    archive.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      archive.classList.add("archive--revealed");
    }, 80);
    if (closeBtn) closeBtn.focus();
  }

  function closeArchive() {
    if (!isOpen) return;
    isOpen = false;
    archive.classList.remove("open");
    archive.classList.remove("archive--revealed");
    archive.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastTrigger) lastTrigger.focus();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      lastTrigger = trigger;
      var project = trigger.getAttribute("data-project") || "atelier";
      openArchive(project);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeArchive);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) closeArchive(); });
  archive.addEventListener("click", function (e) { if (e.target === archive) closeArchive(); });
})();


// ---- Smooth Scroll ----
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (e) {
    var href = this.getAttribute("href");
    if (!href || href === "#") return;

    var target = null;
    try {
      target = document.querySelector(href);
    } catch (err) {
      target = null;
    }

    if (target) {
      e.preventDefault();
      var destination = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - 92);
      smoothScrollTo(destination, 850);
    }
  });
});


// ---- Commission Form ----
(function () {
  var form = document.getElementById("commissionForm");
  if (!form) return;

  var status = document.getElementById("commissionStatus");
  var submitBtn = form.querySelector(".commission-submit");

  function getCaptchaToken() {
    var responseField = form.querySelector('[name="h-captcha-response"]');
    var fieldToken = responseField ? responseField.value.trim() : "";

    if (fieldToken) return fieldToken;
    if (window.hcaptcha && typeof window.hcaptcha.getResponse === "function") {
      return window.hcaptcha.getResponse().trim();
    }

    return "";
  }

  function resetCaptcha() {
    if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {
      window.hcaptcha.reset();
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    status.textContent = "";
    status.className = "commission-status";

    if (!getCaptchaToken()) {
      status.textContent = "Please complete the captcha before submitting.";
      status.className = "commission-status commission-status--error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    var formData = new FormData(form);

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data.success) {
          status.textContent = "Request received. I'll review the details and respond soon.";
          status.className = "commission-status commission-status--success";
          form.reset();
          resetCaptcha();
        } else {
          status.textContent = "Submission failed. Please email directly instead.";
          status.className = "commission-status commission-status--error";
          resetCaptcha();
        }
      })
      .catch(function () {
        status.textContent = "Submission failed. Please email directly instead.";
        status.className = "commission-status commission-status--error";
        resetCaptcha();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit for Review";
      });
  });
})();
