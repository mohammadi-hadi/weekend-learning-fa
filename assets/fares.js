/* Lesson 03: fit a taxi fare's two parameters by hand, then see the best pair.
 *
 * Reads the lesson data from <script type="application/json" id="lesson-data">,
 * which build.py fills from data.json, so the page makes no request and works
 * straight from the disk.
 *
 * [data-lab="fit"]: two sliders, base fare and rate per kilometre. The plot
 * shows the six invented trips, the line those two numbers draw and each
 * trip's error; the readout gives the sum of squared errors, the largest
 * error and the seventh trip's fare. "Best line" moves both sliders to the
 * least-squares fit that build.py copied from the newsletter's data.
 */
(function () {
  "use strict";

  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  var SVG = "http://www.w3.org/2000/svg";
  var clipCount = 0;

  function faNum(value) {
    return String(value)
      .replace(/[0-9]/g, function (d) { return FA_DIGITS.charAt(+d); })
      .replace(/\./g, "٫");
  }

  // One decimal at most, and none when it is zero: 12 not 12.0.
  function short(x) {
    var r = Math.round(x * 10) / 10;
    return faNum(r % 1 === 0 ? r.toFixed(0) : r.toFixed(1));
  }

  function readData() {
    var tag = document.getElementById("lesson-data");
    if (!tag) return null;
    try { return JSON.parse(tag.textContent); } catch (e) { return null; }
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function fitLab(root, data) {
    var baseIn = root.querySelector("[data-base]");
    var rateIn = root.querySelector("[data-rate]");
    var baseOut = root.querySelector("[data-base-out]");
    var rateOut = root.querySelector("[data-rate-out]");
    var plot = root.querySelector("[data-plot]");
    var readout = root.querySelector("[data-readout]");
    var best = root.querySelector("[data-best]");
    var reset = root.querySelector("[data-reset]");
    var trips = data.trips;
    var seventh = data.seventh_km;

    var W = 400, H = 280, L = 44, B = 36, T = 12, R = 12;
    var xmax = 11, ymax = 130;
    function sx(km) { return L + km / xmax * (W - L - R); }
    function sy(f) { return H - B - f / ymax * (H - B - T); }

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
                             "aria-label": "شش سفر و خطی که دو عدد انتخابی شما می‌کشد" });
    [0, 30, 60, 90, 120].forEach(function (f) {
      svg.appendChild(svgEl("line", { x1: L, x2: W - R, y1: sy(f), y2: sy(f), "class": "grid" }));
      var t = svgEl("text", { x: L - 8, y: sy(f) + 5, "text-anchor": "end" });
      t.textContent = faNum(f);
      svg.appendChild(t);
    });
    [0, 2, 4, 6, 8, 10].forEach(function (km) {
      var t = svgEl("text", { x: sx(km), y: H - B + 22, "text-anchor": "middle" });
      t.textContent = faNum(km);
      svg.appendChild(t);
    });
    // The line, the errors and the seventh trip can run past the top of the
    // plot (base 60, rate 16 reaches 236). Clip them there instead of
    // flattening them, so the drawn slope always matches the two numbers.
    var clipId = "fit-clip-" + (++clipCount);
    var clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("rect", { x: L - 7, y: T - 7, width: W - L - R + 14, height: H - B - T + 14 }));
    var defs = svgEl("defs", {});
    defs.appendChild(clip);
    svg.appendChild(defs);
    var moving = svgEl("g", { "clip-path": "url(#" + clipId + ")" });
    svg.appendChild(moving);
    var residuals = trips.map(function () {
      var r = svgEl("line", { "class": "res" });
      moving.appendChild(r);
      return r;
    });
    var line = svgEl("line", { "class": "line" });
    moving.appendChild(line);
    var guess7 = svgEl("circle", { r: 6, "class": "seventh" });
    moving.appendChild(guess7);
    trips.forEach(function (tr) {
      svg.appendChild(svgEl("circle", { cx: sx(tr.km), cy: sy(tr.fare), r: 6, "class": "pt" }));
    });
    plot.appendChild(svg);

    function render() {
      var base = +baseIn.value, rate = +rateIn.value;
      baseOut.textContent = short(base);
      rateOut.textContent = short(rate);
      line.setAttribute("x1", sx(0));
      line.setAttribute("y1", sy(base));
      line.setAttribute("x2", sx(xmax));
      line.setAttribute("y2", sy(base + rate * xmax));
      var sse = 0, worst = 0;
      trips.forEach(function (tr, i) {
        var pred = base + rate * tr.km, err = pred - tr.fare;
        sse += err * err;
        worst = Math.max(worst, Math.abs(err));
        residuals[i].setAttribute("x1", sx(tr.km));
        residuals[i].setAttribute("x2", sx(tr.km));
        residuals[i].setAttribute("y1", sy(tr.fare));
        residuals[i].setAttribute("y2", sy(pred));
      });
      var p7 = base + rate * seventh;
      guess7.setAttribute("cx", sx(seventh));
      guess7.setAttribute("cy", sy(p7));
      var atBest = Math.abs(sse - data.fit.sum_squared_error) < 1e-9;
      readout.textContent = "";
      [
        ["جمع مربع خطاها", short(sse) + (atBest ? "، کمتر از این نمی‌شود" : "")],
        ["بزرگ‌ترین خطا", short(worst) + " هزار تومان"],
        ["کرایه‌ی سفر هفتم (" + faNum(seventh) + " کیلومتر)", short(p7) + " هزار تومان"]
      ].forEach(function (row) {
        var p = document.createElement("p");
        var b = document.createElement("b");
        b.textContent = row[0] + ": ";
        p.appendChild(b);
        p.appendChild(document.createTextNode(row[1]));
        readout.appendChild(p);
      });
    }

    function set(base, rate) {
      baseIn.value = base;
      rateIn.value = rate;
      render();
    }

    baseIn.addEventListener("input", render);
    rateIn.addEventListener("input", render);
    best.addEventListener("click", function () { set(data.fit.base, data.fit.rate); });
    reset.addEventListener("click", function () { set(data.guess.base, data.guess.rate); });
    set(data.guess.base, data.guess.rate);
  }

  var data = readData();
  if (!data) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-lab="fit"]'), function (root) { fitLab(root, data); });
})();
