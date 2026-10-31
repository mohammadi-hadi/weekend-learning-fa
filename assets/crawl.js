/* Lesson 04: a thousand pages of a Common Crawl crawl, by language.
 *
 * Reads the lesson data from <script type="application/json" id="lesson-data">,
 * which build.py fills from data.json, so the page makes no request and works
 * straight from the disk.
 *
 * [data-lab="crawl"]: a grid of a thousand squares, one per page, coloured by
 * the page's language in the chosen crawl: Persian, Dutch, English, and every
 * other language together. Below it, one bar per crawl of 2026 with its
 * Persian pages per thousand; pressing a crawl's month shows that crawl in the
 * grid. Every number shown is computed here from the shares in the data:
 * pages per thousand is the percentage times ten, rounded to a whole page.
 */
(function () {
  "use strict";

  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  var SVG = "http://www.w3.org/2000/svg";
  var COLS = 40, ROWS = 25, PITCH = 10, SIZE = 7;

  function faNum(value) {
    return String(value)
      .replace(/[0-9]/g, function (d) { return FA_DIGITS.charAt(+d); })
      .replace(/\./g, "٫");
  }

  // Pages per thousand, to a whole page, as the lesson's text gives them.
  function perThousand(pct) {
    return Math.round(pct * 10);
  }

  // A ratio: a whole number from 10 up, else one decimal, none when it is zero.
  function ratio(x) {
    if (x >= 10) return faNum(Math.round(x));
    var r = Math.round(x * 10) / 10;
    return faNum(r % 1 === 0 ? r.toFixed(0) : r.toFixed(1));
  }

  function readData() {
    var tag = document.getElementById("lesson-data");
    if (!tag) return null;
    try { return JSON.parse(tag.textContent); } catch (e) { return null; }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function crawlLab(root, data) {
    var gridBox = root.querySelector("[data-grid]");
    var readout = root.querySelector("[data-readout]");
    var barsBox = root.querySelector("[data-bars]");
    var names = data.names;
    var series = data.series;

    // The grid fills from the top right, the way a Persian page is read.
    var svg = svgEl("svg", { viewBox: "0 0 " + (COLS * PITCH) + " " + (ROWS * PITCH), role: "img" });
    var cells = [];
    for (var k = 0; k < COLS * ROWS; k++) {
      var col = k % COLS, row = Math.floor(k / COLS);
      var cell = svgEl("rect", { x: (COLS - 1 - col) * PITCH + 1.5, y: row * PITCH + 1.5,
                                 width: SIZE, height: SIZE, "class": "cell" });
      svg.appendChild(cell);
      cells.push(cell);
    }
    gridBox.appendChild(svg);

    var max = Math.max.apply(null, series.map(function (s) { return s.fas_pct; }));
    var list = el("ol", { className: "bars cc-bars", "aria-label": "صفحه‌های فارسی از هر هزار صفحه، در هر جمع‌آوری" });
    var rows = series.map(function (s, i) {
      var button = el("button", { type: "button", className: "word", "aria-pressed": "false" }, [
        s.month, el("small", { text: faNum(s.year) })
      ]);
      button.addEventListener("click", function () { show(i); });
      var fill = el("span", { className: "fill" });
      fill.style.width = (100 * s.fas_pct / max).toFixed(2) + "%";
      var li = el("li", null, [
        el("span", { className: "piece" }, [button]),
        el("span", { className: "track", "aria-hidden": "true" }, [fill]),
        el("span", { className: "pct", text: faNum(perThousand(s.fas_pct)) })
      ]);
      list.appendChild(li);
      return { li: li, button: button };
    });
    barsBox.appendChild(list);

    function line(label, text) {
      return el("p", null, [el("b", { text: label }), " " + text]);
    }

    function show(i) {
      var s = series[i];
      var fa = perThousand(s.fas_pct), nl = perThousand(s.nld_pct), en = perThousand(s.eng_pct);
      cells.forEach(function (c, k) {
        var cls = k < fa ? "cell fa" : k < fa + nl ? "cell nl" : k < fa + nl + en ? "cell en" : "cell";
        c.setAttribute("class", cls);
      });
      svg.setAttribute("aria-label", "هزار مربع: " + faNum(fa) + " " + names.fas + "، " +
                       faNum(nl) + " " + names.nld + "، " + faNum(en) + " " + names.eng +
                       " و " + faNum(1000 - fa - nl - en) + " زبان‌های دیگر");
      readout.textContent = "";
      readout.appendChild(line("جمع‌آوری " + s.month + " " + faNum(s.year) + ":",
        "از هر هزار صفحه، حدود " + faNum(en) + " صفحه " + names.eng + " بود، " +
        faNum(nl) + " صفحه " + names.nld + " و " + faNum(fa) + " صفحه " + names.fas + "."));
      readout.appendChild(el("p", { text:
        "در برابر هر صفحه‌ی " + names.fas + "، حدود " + ratio(s.eng_pct / s.fas_pct) + " صفحه‌ی " +
        names.eng + " و " + ratio(s.nld_pct / s.fas_pct) + " صفحه‌ی " + names.nld + " بود." }));
      rows.forEach(function (r, j) {
        r.button.setAttribute("aria-pressed", String(j === i));
        r.li.className = j === i ? "on" : "";
      });
    }

    var start = 0;
    series.forEach(function (s, i) { if (s.id === data.crawl.id) start = i; });
    show(start);
  }

  var data = readData();
  if (!data) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-lab="crawl"]'), function (root) { crawlLab(root, data); });
})();
