





// Tabs sliding: the library card's own script, from library.html.
(function () {
  function findCard(el) { return el.closest("[data-proto-card]"); }

  function readMs(name, fallback) {
    var raw = getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim();
    if (!raw) return fallback;
    if (raw.slice(-2) === "ms") return parseFloat(raw);
    if (raw.slice(-1) === "s")  return parseFloat(raw) * 1000;
    var n = parseFloat(raw);
    return isNaN(n) ? fallback : n;
  }

  (function initP16() {
    var roots = document.querySelectorAll("[data-proto-tabs]");
    if (!roots.length) return;
    roots.forEach(function (root) {
      var indicator = root.querySelector(".p16-indicator");
      var tabs = Array.prototype.slice.call(
        root.querySelectorAll(".p16-tab")
      );
      if (!indicator || !tabs.length) return;

      function moveTo(tab, animate) {
        var left = tab.offsetLeft;
        var width = tab.offsetWidth;
        if (!animate) {
          var prev = indicator.style.transition;
          indicator.style.transition = "none";
          indicator.style.transform = "translateX(" + left + "px)";
          indicator.style.width = width + "px";
          // eslint-disable-next-line no-unused-expressions
          indicator.offsetWidth;
          indicator.style.transition = prev;
        } else {
          indicator.style.transform = "translateX(" + left + "px)";
          indicator.style.width = width + "px";
        }
      }
      function getActive() {
        return tabs.find(function (t) {
          return t.getAttribute("aria-selected") === "true";
        }) || tabs[0];
      }
      tabs.forEach(function (t) {
        t.addEventListener("click", function () {
          tabs.forEach(function (other) {
            other.setAttribute(
              "aria-selected", other === t ? "true" : "false"
            );
          });
          moveTo(t, true);
        });
      });
      // Wait one frame so layout has settled and offsetLeft is stable.
      window.requestAnimationFrame(function () {
        moveTo(getActive(), false);
      });
      window.addEventListener("resize", function () {
        moveTo(getActive(), false);
      });
    });
  })();
})();
/* 
async function API() {
    try {
        const URLapi = await fetch(`https://www.adadiamonds.com/api/v1`) // não precisa de chave
        const res = await URLapi.json()
        console.log(res)
    }
    catch (erro) {
        console.log(erro)
    }
}
API()
*/