(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
     Terminal typing effect
  --------------------------------------------------------- */
  var terminalBody = document.getElementById("terminal-body");

  var terminalScript = [
    { type: "prompt", text: "whoami" },
    { type: "output", text: "Apoorv Mishra" },
    { type: "prompt", text: "role --current" },
    { type: "output", text: "Aspiring Backend & Systems Engineer", accent: true },
    { type: "prompt", text: "location" },
    { type: "output", text: "Chandigarh, India" },
    { type: "prompt", text: "status" },
    { type: "output", text: "Learning new things everyday !", accent: true }
  ];

  function renderStatic() {
    var html = "";
    terminalScript.forEach(function (line) {
      if (line.type === "prompt") {
        html +=
          '<div class="term-prompt-line"><span class="p">visitor@apoorv-mishra:~$</span> ' +
          line.text +
          "</div>";
      } else {
        html +=
          '<div class="term-output' +
          (line.accent ? " accent" : "") +
          '">' +
          line.text +
          "</div>";
      }
    });
    terminalBody.innerHTML = html;
  }

  function typeTerminal() {
    var lineIndex = 0;
    var charIndex = 0;
    var currentLineEl = null;

    function nextLine() {
      if (lineIndex >= terminalScript.length) {
        var cursor = document.createElement("span");
        cursor.className = "term-cursor";
        terminalBody.appendChild(cursor);
        return;
      }

      var line = terminalScript[lineIndex];
      currentLineEl = document.createElement("div");

      if (line.type === "prompt") {
        currentLineEl.className = "term-prompt-line";
        var promptSpan = document.createElement("span");
        promptSpan.className = "p";
        promptSpan.textContent = "visitor@apoorv-mishra:~$ ";
        currentLineEl.appendChild(promptSpan);
      } else {
        currentLineEl.className = "term-output" + (line.accent ? " accent" : "");
      }

      terminalBody.appendChild(currentLineEl);
      charIndex = 0;
      typeChar(line.text);
    }

    function typeChar(text) {
      if (charIndex < text.length) {
        currentLineEl.appendChild(document.createTextNode(text[charIndex]));
        charIndex++;
        setTimeout(function () { typeChar(text); }, 18 + Math.random() * 22);
      } else {
        lineIndex++;
        setTimeout(nextLine, 260);
      }
    }

    nextLine();
  }

  if (terminalBody) {
    if (reduceMotion) {
      renderStatic();
    } else {
      typeTerminal();
    }
  }

  /* ---------------------------------------------------------
     Scroll reveal for sections
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".section .section-inner > *, .skill-card, .project-card, .log-entry"
  );

  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if (reduceMotion) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
