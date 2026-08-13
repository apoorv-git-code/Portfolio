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

    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

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
     COSMIC SCENE: starfield + interactive black hole
  =========================================================== */
  (function initCosmicScene() {
    var canvas = document.getElementById("cosmic-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = window.innerWidth;
    var height = window.innerHeight;

    var mouse = { x: width / 2, y: height * 0.42 };
    var pointerActive = false; // true while pointer is over the hero section

    var baseCenter = { x: width / 2, y: height * 0.44 };
    var offset = { x: 0, y: 0 };
    var targetOffset = { x: 0, y: 0 };
    var center = { x: baseCenter.x, y: baseCenter.y };

    var scale = { bhRadius: 0, innerR: 0, outerR: 0, proximityRadius: 0 };

    var stars = [];
    var diskParticles = [];
    var shockwaves = [];

    var glowGold, glowCyan, glowWhite;

    /* ---------- sprite generation (avoids per-particle shadowBlur cost) ---------- */
    function makeGlowSprite(rgb, size) {
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var gctx = c.getContext("2d");
      var grad = gctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(" + rgb + ",1)");
      grad.addColorStop(0.35, "rgba(" + rgb + ",0.55)");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, size, size);
      return c;
    }

    /* ---------- sizing ---------- */
    function computeScale() {
      var minDim = Math.min(width, height);
      scale.bhRadius = Math.max(72, minDim * 0.16);
      scale.innerR = scale.bhRadius * 1.9;
      scale.outerR = scale.bhRadius * 6.4;
      scale.proximityRadius = scale.outerR * 1.5;
      baseCenter.x = width / 2;
      baseCenter.y = height * 0.5;
    }

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeScale();
      createStars();
      createDiskParticles();
    }

    /* ---------- starfield ---------- */
    function createStars() {
      var count = Math.round((width * height) / 8500);
      count = Math.max(90, Math.min(count, 260));
      stars = [];
      for (var i = 0; i < count; i++) {
        var x = Math.random() * width;
        var y = Math.random() * height;
        stars.push({
          x: x, y: y, baseX: x, baseY: y,
          vx: 0, vy: 0,
          r: 0.6 + Math.random() * 1.5,
          alphaBase: 0.35 + Math.random() * 0.65,
          twinkleSpeed: 0.5 + Math.random() * 1.6,
          phase: Math.random() * TAU,
          bright: Math.random() < 0.16
        });
      }
    }

    function updateStars(dt, now) {
      var attractRadius = 170;
      var attractStrength = 0.055;
      var spring = 0.02;
      var damping = 0.9;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        if (pointerActive) {
          var dx = mouse.x - s.x;
          var dy = mouse.y - s.y;
          var dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (dist < attractRadius) {
            var force = (1 - dist / attractRadius) * attractStrength;
            s.vx += (dx / dist) * force;
            s.vy += (dy / dist) * force;
          }
        }

        s.vx += (s.baseX - s.x) * spring;
        s.vy += (s.baseY - s.y) * spring;
        s.vx *= damping;
        s.vy *= damping;
        s.x += s.vx;
        s.y += s.vy;
      }
    }

    function drawStars(now) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = 0.5 + 0.5 * Math.sin(now * 0.0015 * s.twinkleSpeed + s.phase);
        var alpha = s.alphaBase * (0.4 + 0.6 * twinkle);

        if (s.bright) {
          var glowSize = s.r * 9;
          ctx.globalAlpha = alpha * 0.8;
          ctx.drawImage(glowWhite, s.x - glowSize / 2, s.y - glowSize / 2, glowSize, glowSize);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- accretion disk particles ---------- */
    function createDiskParticles() {
      var count = width < 640 ? 90 : 170;
      diskParticles = [];
      for (var i = 0; i < count; i++) {
        var r = scale.innerR + Math.random() * (scale.outerR - scale.innerR);
        diskParticles.push({
          angle: Math.random() * TAU,
          radius: r,
          radiusOffset: 0,
          size: 0.9 + Math.random() * 2.1,
          flicker: Math.random() * TAU
        });
      }
    }

    function diskColor(t) {
      // t: 0 (inner, hot) -> 1 (outer, cooler)
      var r1 = 255, g1 = 245, b1 = 220; // hot near-white gold
      var r2 = 255, g2 = 100, b2 = 20;  // deep orange
      var r = Math.round(r1 + (r2 - r1) * t);
      var g = Math.round(g1 + (g2 - g1) * t);
      var b = Math.round(b1 + (b2 - b1) * t);
      return r + "," + g + "," + b;
    }

    function updateDiskParticles(dt, speedMultiplier) {
      var K = 5200; // keplerian constant (tuned for visual speed)
      for (var i = 0; i < diskParticles.length; i++) {
        var p = diskParticles[i];
        var angularSpeed = K / Math.pow(p.radius, 1.5);
        p.angle += angularSpeed * speedMultiplier * (dt / 1000);
        p.radiusOffset *= Math.pow(0.9, dt / 16);
      }
    }

    function drawDiskParticles(now, glowBoost) {
      var flattenY = 0.58;
      for (var i = 0; i < diskParticles.length; i++) {
        var p = diskParticles[i];
        var r = p.radius + p.radiusOffset;
        var x = center.x + Math.cos(p.angle) * r;
        var y = center.y + Math.sin(p.angle) * r * flattenY;

        // occlude particles passing directly behind the event horizon
        var behind = Math.sin(p.angle) > 0 && Math.abs(Math.cos(p.angle)) < 0.55 && r < scale.innerR * 1.05;
        if (behind) continue;

        var t = Math.min(1, Math.max(0, (r - scale.innerR) / (scale.outerR - scale.innerR)));
        var rgb = diskColor(t);
        var flicker = 0.75 + 0.25 * Math.sin(now * 0.004 + p.flicker);
        var alpha = (1 - t * 0.6) * flicker * glowBoost;

        var glowSize = p.size * 10;
        ctx.globalAlpha = Math.min(1, alpha * 0.7);
        ctx.drawImage(glowGold, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);

        ctx.globalAlpha = Math.min(1, alpha + 0.15);
        ctx.fillStyle = "rgba(" + rgb + ",1)";
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.55, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- lensing arc (Gargantua-style bent light above the horizon) ---------- */
    function drawLensingArcs(glowBoost) {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.globalAlpha = 0.55 * glowBoost;
      ctx.strokeStyle = "rgba(255,214,150,0.9)";
      ctx.lineWidth = Math.max(1.8, scale.bhRadius * 0.045);
      ctx.beginPath();
      ctx.ellipse(0, 0, scale.bhRadius * 1.55, scale.outerR * 1.12, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();

      ctx.globalAlpha = 0.3 * glowBoost;
      ctx.lineWidth = Math.max(1.2, scale.bhRadius * 0.03);
      ctx.beginPath();
      ctx.ellipse(0, 0, scale.bhRadius * 1.3, scale.outerR * 0.9, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /* ---------- event horizon ---------- */
    function drawEventHorizon(glowBoost) {
      // outer ambient glow
      var g = ctx.createRadialGradient(
        center.x, center.y, scale.bhRadius * 0.6,
        center.x, center.y, scale.bhRadius * 4.2
      );
      g.addColorStop(0, "rgba(255,170,80," + (0.35 * glowBoost) + ")");
      g.addColorStop(0.4, "rgba(255,120,30," + (0.12 * glowBoost) + ")");
      g.addColorStop(1, "rgba(255,120,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(center.x, center.y, scale.bhRadius * 4.2, 0, TAU);
      ctx.fill();

      // relativistic (Doppler) beaming: the approaching edge of the disk
      // reads brighter and blue-shifted, as in the real Gargantua render
      var cyanSize = scale.bhRadius * 5.2;
      ctx.globalAlpha = 0.4 * glowBoost;
      ctx.drawImage(
        glowCyan,
        center.x - scale.bhRadius * 1.6 - cyanSize / 2,
        center.y - cyanSize / 2,
        cyanSize, cyanSize
      );
      ctx.globalAlpha = 1;

      // pure black core
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(center.x, center.y, scale.bhRadius, 0, TAU);
      ctx.fill();

      // thin bright rim (gravitational lensing edge)
      var rimGrad = ctx.createLinearGradient(
        center.x - scale.bhRadius, center.y,
        center.x + scale.bhRadius, center.y
      );
      rimGrad.addColorStop(0, "rgba(0,243,255,0.55)");
      rimGrad.addColorStop(0.5, "rgba(255,255,255,0.9)");
      rimGrad.addColorStop(1, "rgba(255,170,60,0.6)");
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = Math.max(1.2, scale.bhRadius * 0.055) * (1 + glowBoost * 0.4);
      ctx.globalAlpha = 0.75 * glowBoost;
      ctx.beginPath();
      ctx.arc(center.x, center.y, scale.bhRadius * 1.01, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* ---------- gravitational wave shockwaves ---------- */
    function triggerShockwave() {
      if (reduceMotion) return;
      shockwaves.push({ radius: scale.bhRadius, life: 1 });
    }

    function updateShockwaves(dt) {
      for (var i = shockwaves.length - 1; i >= 0; i--) {
        var w = shockwaves[i];
        w.radius += dt * 0.9;
        w.life -= dt * 0.0016;
        if (w.life <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }
        var band = 46;
        for (var j = 0; j < diskParticles.length; j++) {
          var p = diskParticles[j];
          var d = Math.abs(p.radius + p.radiusOffset - w.radius);
          if (d < band) {
            var influence = (1 - d / band) * w.life;
            p.radiusOffset += influence * 5.5;
          }
        }
      }
    }

    function drawShockwaves() {
      for (var i = 0; i < shockwaves.length; i++) {
        var w = shockwaves[i];
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.globalAlpha = w.life * 0.5;
        ctx.strokeStyle = "rgba(0,243,255,0.8)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, w.radius, w.radius * 0.42, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- main loop ---------- */
    var lastTime = performance.now();
    var running = true;

    function frame(now) {
      if (!running) return;
      var dt = Math.min(now - lastTime, 48);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // black hole center: subtle lerp toward mouse when pointer is over hero
      if (pointerActive) {
        targetOffset.x = clamp((mouse.x - baseCenter.x) * 0.05, -50, 50);
        targetOffset.y = clamp((mouse.y - baseCenter.y) * 0.05, -34, 34);
      } else {
        targetOffset.x = 0;
        targetOffset.y = 0;
      }
      offset.x += (targetOffset.x - offset.x) * 0.055;
      offset.y += (targetOffset.y - offset.y) * 0.055;
      center.x = baseCenter.x + offset.x;
      center.y = baseCenter.y + offset.y;

      var distToCenter = Math.hypot(mouse.x - center.x, mouse.y - center.y);
      var proximity = pointerActive
        ? clamp(1 - distToCenter / scale.proximityRadius, 0, 1)
        : 0;
      var speedMultiplier = 1 + proximity * 2.4;
      var glowBoost = 1 + proximity * 0.9;

      updateStars(dt, now);
      drawStars(now);

      updateDiskParticles(dt, speedMultiplier);
      updateShockwaves(dt);

      drawEventHorizon(glowBoost);
      drawDiskParticles(now, glowBoost);
      drawLensingArcs(glowBoost);
      drawShockwaves();

      requestAnimationFrame(frame);
    }

    function frameStatic() {
      // Reduced-motion fallback: a single, still render.
      ctx.clearRect(0, 0, width, height);
      drawStars(0);
      drawEventHorizon(1);
      drawDiskParticles(0, 1);
      drawLensingArcs(1);
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    /* ---------- events ---------- */
    var heroEl = document.getElementById("top");

    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    if (heroEl) {
      heroEl.addEventListener("pointerenter", function () { pointerActive = true; });
      heroEl.addEventListener("pointerleave", function () { pointerActive = false; });
    }

    document.addEventListener("click", function () {
      triggerShockwave();
    });

    var resizeTimer;
    function scheduleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeCanvas();
        if (reduceMotion) frameStatic();
      }, 150);
    }
    window.addEventListener("resize", scheduleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleResize);
    }

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running && !reduceMotion) {
        lastTime = performance.now();
        requestAnimationFrame(frame);
      }
    });

    /* ---------- init ---------- */
    glowGold = makeGlowSprite("255,170,60", 96);
    glowCyan = makeGlowSprite("0,243,255", 96);
    glowWhite = makeGlowSprite("255,255,255", 48);

    resizeCanvas();

    if (reduceMotion) {
      frameStatic();
    } else {
      requestAnimationFrame(frame);
    }
  })();
})();
