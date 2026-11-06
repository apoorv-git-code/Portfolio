(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(pointer: fine)").matches;
  var TAU = Math.PI * 2;

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal (IntersectionObserver)
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ===========================================================
     CUSTOM CURSOR
  =========================================================== */
  (function initCursor() {
    if (!isFinePointer) return;

    document.body.classList.add("custom-cursor-active");

    var dot = document.getElementById("cursor-dot");
    var halo = document.getElementById("cursor-halo");
    var trailEls = document.querySelectorAll(".cursor-trail span");

    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var dotPos = { x: mouse.x, y: mouse.y };
    var haloPos = { x: mouse.x, y: mouse.y };
    var trailPos = [];
    trailEls.forEach(function () { trailPos.push({ x: mouse.x, y: mouse.y }); });

    var firstMove = true;
    document.body.classList.add("cursor-idle");

    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (firstMove) {
        firstMove = false;
        dotPos.x = haloPos.x = mouse.x;
        dotPos.y = haloPos.y = mouse.y;
        trailPos.forEach(function (p) { p.x = mouse.x; p.y = mouse.y; });
        document.body.classList.remove("cursor-idle");
      }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      document.body.classList.add("cursor-idle");
    });
    document.documentElement.addEventListener("mouseenter", function () {
      if (!firstMove) document.body.classList.remove("cursor-idle");
    });

    // Hover state via event delegation
    var hoverSelector = "a, button, .badge, .icon-btn, .project-card";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hoverSelector)) {
        document.body.classList.add("cursor-hover");
      }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(hoverSelector)) {
        document.body.classList.remove("cursor-hover");
      }
    });

    function cursorLoop() {
      dotPos.x += (mouse.x - dotPos.x) * 0.9;
      dotPos.y += (mouse.y - dotPos.y) * 0.9;
      haloPos.x += (mouse.x - haloPos.x) * 0.16;
      haloPos.y += (mouse.y - haloPos.y) * 0.16;

      if (dot) dot.style.transform = "translate3d(" + dotPos.x + "px," + dotPos.y + "px,0) translate(-50%,-50%)";
      if (halo) halo.style.transform = "translate3d(" + haloPos.x + "px," + haloPos.y + "px,0) translate(-50%,-50%)";

      var target = mouse;
      for (var i = 0; i < trailPos.length; i++) {
        var f = 0.32 - i * 0.055;
        trailPos[i].x += (target.x - trailPos[i].x) * f;
        trailPos[i].y += (target.y - trailPos[i].y) * f;
        trailEls[i].style.transform =
          "translate3d(" + trailPos[i].x + "px," + trailPos[i].y + "px,0) translate(-50%,-50%)";
        target = trailPos[i];
      }

      requestAnimationFrame(cursorLoop);
    }
    cursorLoop();
  })();

  /* ===========================================================
     STARFIELD: lightweight interactive space-dust canvas
  =========================================================== */
  (function initStarfield() {
    var canvas = document.getElementById("cosmic-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var width = window.innerWidth;
    var height = window.innerHeight;


    var lowPower = (navigator.hardwareConcurrency || 4) <= 4;

    var mouse = { x: width / 2, y: height / 2, active: false };
    var stars = [];
    var heroEl = document.getElementById("top");
    var heroVisible = true;

    var PALETTE = [
      "255,255,255", // soft white
      "160,220,255", // ambient cyan/blue
      "255,196,120"  // amber highlight
    ];

    function resizeCanvas(rebuild) {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuild !== false) createStars();
    }

    function createStars() {
      var count = Math.round((width * height) / 9000);
      count = Math.max(80, Math.min(count, 150));
      if (lowPower) count = Math.round(count * 0.7);

      stars = [];
      for (var i = 0; i < count; i++) {
        var x = Math.random() * width;
        var y = Math.random() * height;
        var colorRoll = Math.random();
        stars.push({
          x: x, y: y, baseX: x, baseY: y,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          r: 0.7 + Math.random() * 1.7,
          alphaBase: 0.35 + Math.random() * 0.6,
          twinkleSpeed: 0.4 + Math.random() * 1.5,
          phase: Math.random() * TAU,
          rgb: colorRoll < 0.72 ? PALETTE[0] : colorRoll < 0.9 ? PALETTE[1] : PALETTE[2]
        });
      }
    }

    function update(dt) {
      var repelRadius = 130;
      var repelStrength = 0.9;
      var spring = 0.012;
      var damping = 0.92;
      var stepScale = dt / 16.67; // frame-rate independent motion

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        // drift
        s.baseX += s.vx * stepScale;
        s.baseY += s.vy * stepScale;
        if (s.baseX < -20) s.baseX = width + 20;
        if (s.baseX > width + 20) s.baseX = -20;
        if (s.baseY < -20) s.baseY = height + 20;
        if (s.baseY > height + 20) s.baseY = -20;

        if (mouse.active) {
          var dx = s.x - mouse.x;
          var dy = s.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (dist < repelRadius) {
            // gentle repulsion near the cursor, easing off with distance
            var force = (1 - dist / repelRadius) * repelStrength;
            s.x += (dx / dist) * force * stepScale;
            s.y += (dy / dist) * force * stepScale;
          }
        }

        // spring back toward drifting base position
        s.x += (s.baseX - s.x) * spring * stepScale;
        s.y += (s.baseY - s.y) * spring * stepScale;
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = 0.5 + 0.5 * Math.sin(now * 0.0016 * s.twinkleSpeed + s.phase);
        var alpha = s.alphaBase * (0.4 + 0.6 * twinkle);

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + s.rgb + "," + alpha.toFixed(3) + ")";
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
    }

    /* ---------- main loop (single rAF handle: no duplicate loops) ---------- */
    var lastTime = performance.now();
    var rafId = 0;

    function frame(now) {
      rafId = 0;
      var dt = Math.min(now - lastTime, 48);
      lastTime = now;
      update(dt);
      draw(now);
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (rafId || reduceMotion || document.hidden || !heroVisible) return;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    /* ---------- events ---------- */
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      mouse.active = false;
    });

    var resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var rebuild = window.innerWidth !== width || Math.abs(window.innerHeight - height) > 120;
        resizeCanvas(rebuild);
        if (!rafId) draw(performance.now()); // repaint: resizing clears the canvas
      }, 150);
    }
    window.addEventListener("resize", onResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    // Pause once scrolled past the hero section.
    if (heroEl && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) start(); else stop();
      }, { threshold: 0 }).observe(heroEl);
    }

    /* ---------- init ---------- */
    resizeCanvas();
    if (reduceMotion) draw(0); else start();
  })();

  /* ===========================================================
     HEADER: scrolled state, scroll-spy, nav a11y
  =========================================================== */
  (function initHeader() {
    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (mainNav && "IntersectionObserver" in window) {
      var links = {};
      mainNav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Object.keys(links).forEach(function (id) {
            var on = id === entry.target.id;
            links[id].classList.toggle("is-active", on);
            if (on) links[id].setAttribute("aria-current", "true"); else links[id].removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      Object.keys(links).forEach(function (id) {
        var sec = document.getElementById(id);
        if (sec) spy.observe(sec);
      });
    }

    function closeNav(returnFocus) {
      if (!mainNav || !navToggle || !mainNav.classList.contains("is-open")) return;
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      if (returnFocus) navToggle.focus();
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(true); });
    document.addEventListener("click", function (e) {
      if (mainNav && navToggle && !mainNav.contains(e.target) && !navToggle.contains(e.target)) closeNav(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 720) closeNav(false); });
  })();
})();
