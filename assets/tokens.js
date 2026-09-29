/* Lesson 02: how two tokenizers cut the same text into pieces.
 *
 * Reads the lesson data from <script type="application/json" id="lesson-data">,
 * which build.py fills from data.json, so the page makes no request and works
 * straight from the disk. No tokenizer ships with the page: the pieces were
 * computed once, offline, and are only drawn here.
 *
 * [data-lab="tokens"]: pick a text and a tokenizer, see its pieces and count.
 * [data-lab="ratios"]: the Persian/English token ratio over the whole corpus.
 */
(function () {
  "use strict";

  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function faNum(value) {
    return String(value)
      .replace(/[0-9]/g, function (d) { return FA_DIGITS.charAt(+d); })
      .replace(/\./g, "٫");
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== null && attrs[key] !== undefined) node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function readData() {
    var tag = document.getElementById("lesson-data");
    if (!tag) return null;
    try { return JSON.parse(tag.textContent); } catch (e) { return null; }
  }

  // A byte piece such as "<0xD8>" is half of a Persian letter: the old
  // tokenizer sometimes cuts one letter's two UTF-8 bytes apart.
  var BYTE = /^\s?<0x[0-9A-F]{2}>$/;

  function pieceNode(piece) {
    var isByte = BYTE.test(piece);
    var startsWord = piece.charAt(0) === " ";
    var shown = isByte ? "نیم‌حرف" : piece.replace(/^ /, "");
    var cls = "tok" + (isByte ? " half" : "") + (startsWord ? " sp" : "");
    return el("li", { className: cls, title: isByte ? piece.trim() : null, text: shown });
  }

  function tokensLab(root, data) {
    var textPicker = root.querySelector("[data-texts]");
    var tokPicker = root.querySelector("[data-tokenizers]");
    var out = root.querySelector("[data-pieces]");
    var state = { text: 0, tok: 0 };
    var textButtons = [];
    var tokButtons = [];

    function render() {
      textButtons.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.text)); });
      tokButtons.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.tok)); });
      var t = data.texts[state.text];
      var tk = data.tokenizers[state.tok];
      var pieces = t.by[tk.id];
      while (out.firstChild) out.removeChild(out.firstChild);
      out.appendChild(el("p", { className: "count" }, [
        el("b", { text: faNum(pieces.length) + " توکن" }),
        " برای " + (t.lang === "en" ? "همان جمله به انگلیسی" : "«" + t.text + "»") + "، با " + tk.label
      ]));
      var list = el("ul", { className: "pieces", dir: t.lang === "en" ? "ltr" : "rtl",
                             lang: t.lang, "aria-label": "تکه‌ها به ترتیب" });
      pieces.forEach(function (p) { list.appendChild(pieceNode(p)); });
      out.appendChild(list);
      var halves = pieces.filter(function (p) { return BYTE.test(p); }).length;
      if (halves) {
        out.appendChild(el("p", { className: "note",
          text: "«نیم‌حرف» یعنی این توکن‌ساز یک حرف فارسی را از وسط بریده است: هر حرف فارسی در حافظه‌ی کامپیوتر دو بایت است و این توکن‌ساز " + faNum(halves) + " بار فقط یکی از آن دو بایت را یک تکه حساب کرده." }));
      }
    }

    data.texts.forEach(function (t, i) {
      var b = el("button", { type: "button", className: "chip", "aria-pressed": "false", text: t.label });
      b.addEventListener("click", function () { state.text = i; render(); });
      textButtons.push(b);
      textPicker.appendChild(el("li", null, [b]));
    });
    data.tokenizers.forEach(function (tk, i) {
      var b = el("button", { type: "button", className: "chip", "aria-pressed": "false", text: tk.label });
      b.addEventListener("click", function () { state.tok = i; render(); });
      tokButtons.push(b);
      tokPicker.appendChild(el("li", null, [b]));
    });
    render();
  }

  function ratiosLab(root, data) {
    var out = root.querySelector("[data-ratios]");
    var max = Math.max.apply(null, data.tokenizers.map(function (tk) { return data.corpus[tk.id].ratio; }));
    var list = el("ol", { className: "bars", "aria-label": "توکن فارسی به ازای هر توکن انگلیسی" });
    var rows = data.tokenizers.map(function (tk) {
      return { label: tk.label, ratio: data.corpus[tk.id].ratio };
    });
    rows.push({ label: "انگلیسی", ratio: 1 });
    rows.forEach(function (r) {
      var fill = el("span", { className: "fill" });
      fill.style.width = (100 * r.ratio / max).toFixed(2) + "%";
      list.appendChild(el("li", null, [
        el("span", { className: "piece", text: r.label }),
        el("span", { className: "track", "aria-hidden": "true" }, [fill]),
        el("span", { className: "pct", text: "؜" + faNum(r.ratio.toFixed(2)) + " برابر" })
      ]));
    });
    out.appendChild(list);
  }

  var data = readData();
  if (!data) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-lab="tokens"]'), function (root) { tokensLab(root, data); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-lab="ratios"]'), function (root) { ratiosLab(root, data); });
})();
