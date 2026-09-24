/* The small interactives of «یادگیری آخر هفته».
 *
 * Plain JavaScript, no library and no network request. The measured data
 * sits in the page itself, in <script type="application/json"
 * id="lesson-data">, which build.py fills from data.json; so the page works
 * the same from GitHub Pages, from a slow connection and from file://.
 *
 * - [data-lab="next-piece"]: pick a prompt, see the model's top candidates
 *   for the next piece as bars on one 0 to 100% scale.
 * - [data-lab="bigram"]: count which words follow a word in any text the
 *   reader types, and build a sentence by always taking a follower.
 */
(function () {
  "use strict";

  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function faNum(value) {
    return String(value)
      .replace(/[0-9]/g, function (d) { return FA_DIGITS.charAt(+d); })
      .replace(".", "٫");
  }

  // A model probability, as the newsletter prints one (VOICE.md): one
  // decimal from 99.5% up, otherwise a whole percent. Rounding to «۰٪» or
  // «۱۰۰٪» would claim impossible or certain, so those two ends get words.
  function percent(p) {
    if (p >= 0.995) {
      var one = (p * 100).toFixed(1);
      return one === "100.0" ? "بیش از ۹۹٪" : faNum(one) + "٪";
    }
    var whole = Math.round(p * 100);
    return whole < 1 ? "کمتر از ۱٪" : faNum(whole) + "٪";
  }

  // A count share is exact, so 3 of 3 is «۱۰۰٪». Only a share that rounds
  // to 0 or 100 without being none or all gets words.
  function countPercent(count, total) {
    if (count === total) return faNum(100) + "٪";
    var whole = Math.round(100 * count / total);
    if (whole >= 100) return "بیش از ۹۹٪";
    return whole < 1 ? "کمتر از ۱٪" : faNum(whole) + "٪";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        if (key === "text") node.textContent = attrs[key];
        else if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      }
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // One row of a bar chart: label, bar on the shared 0 to 100% scale, value.
  // The value starts with an invisible Arabic letter mark (U+061C): the .pct
  // cell has no Persian letter before the number, so without it the digits
  // run left to right and «٪» lands on their right («٪۶» instead of «۶٪»).
  function barRow(label, share, value) {
    var fill = el("span", { className: "fill" });
    fill.style.width = (Math.max(0, Math.min(1, share)) * 100).toFixed(2) + "%";
    return el("li", null, [
      label,
      el("span", { className: "track", "aria-hidden": "true" }, [fill]),
      el("span", { className: "pct", text: "\u061C" + value })
    ]);
  }

  function readData() {
    var tag = document.getElementById("lesson-data");
    if (!tag) return null;
    try {
      return JSON.parse(tag.textContent);
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------
   * Next piece
   * ------------------------------------------------------------------ */

  var LETTER = /[ء-غف-يٮٯٱ-ۓەۺ-ۿ]/;
  var MARK = /^[ً-ٰٟ]/;

  function lastWord(prompt) {
    var m = prompt.match(/\S+$/);
    return m ? m[0] : "";
  }

  // How to show one candidate. A leading space means the piece starts a new
  // word; without one it sticks to what came before, and the joined word is
  // shown under it («مال» after «یک دست» makes «دستمال»).
  function describePiece(token, prompt) {
    var newWord = /^\s/.test(token);
    var core = token.replace(/^\s+/, "");
    if (core === "") return { text: "فاصله", desc: true };
    if (core === "‌") return { text: "نیم‌فاصله", desc: true };
    if (newWord) return { text: core };
    var sticks = LETTER.test(core.charAt(0)) || MARK.test(core);
    if (!sticks) return { text: core };
    var shown = MARK.test(core) ? { text: "همزه‌ی کوچک", desc: true } : { text: core };
    if (LETTER.test(prompt.charAt(prompt.length - 1))) {
      shown.joined = lastWord(prompt) + core;
      shown.word = true;
    } else {
      shown.joined = "بدون فاصله";
    }
    return shown;
  }

  function pieceLabel(token, prompt) {
    var d = describePiece(token, prompt);
    var main = d.desc ? el("span", { className: "desc", text: d.text }) : "«" + d.text + "»";
    var label = el("span", { className: "piece" }, [
      main,
      d.joined ? el("small", { text: d.joined }) : null
    ]);
    if (d.word) label.setAttribute("data-joined", "");
    return label;
  }

  // The prompt followed by an ending, the ending in the accent colour. Only
  // the colour changes, so letters still join across the two spans.
  function withEnding(prompt, ending, glue) {
    return el("span", null, [prompt, el("span", { className: "end", text: glue + ending })]);
  }

  function nextPiece(root, data) {
    var prompts = data.prompts || [];
    var picker = root.querySelector("[data-picker]");
    var result = root.querySelector("[data-result]");
    if (!picker || !result || !prompts.length) return;

    var groups = [
      { kind: "proverb", label: "نیمه‌ی اول ضرب‌المثل‌ها" },
      { kind: "open", label: "جمله‌های نیمه‌تمام" }
    ];
    var buttons = [];

    function show(index) {
      var row = prompts[index];
      buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === index)); });
      clear(result);

      result.appendChild(el("p", { className: "prompt-line" }, [
        row.prompt,
        el("span", { className: "blank", "aria-hidden": "true" })
      ]));

      var list = el("ol", { className: "bars", "aria-label": "ده تکه‌ی محتمل بعدی و احتمال هر کدام" });
      var joins = false;
      row.top10.forEach(function (t) {
        var label = pieceLabel(t.token, row.prompt);
        // Only a joined word needs the note; «بدون فاصله» explains itself.
        if (label.hasAttribute("data-joined")) joins = true;
        list.appendChild(barRow(label, t.p, percent(t.p)));
      });
      result.appendChild(list);

      var facts = el("div", { className: "facts" });
      if (joins) {
        facts.appendChild(el("p", {
          className: "note",
          text: "زیر تکه‌هایی که بدون فاصله می‌آیند، کلمه‌ای را نوشته‌ام که با کلمه‌ی قبل می‌سازند."
        }));
      }
      if (row.kind === "proverb") {
        facts.appendChild(el("p", null, [
          el("span", { className: "said", text: "ما می‌گوییم: " }),
          withEnding(row.prompt, row.usual_ending, " ")
        ]));
      }
      if (row.continuation) {
        facts.appendChild(el("p", null, [
          el("span", { className: "said", text: "مدل نوشت: " }),
          withEnding(row.prompt, row.continuation.replace(/^\s+/, ""),
                     /^\s/.test(row.continuation) ? " " : "")
        ]));
      }
      if (row.kind === "proverb") {
        facts.appendChild(el("p", {
          className: "note",
          text: row.model_wrote_usual_ending
            ? "مدل این ضرب‌المثل را همان‌طور تمام کرد که ما می‌گوییم."
            : "مدل این ضرب‌المثل را آن‌طور که ما می‌گوییم تمام نکرد."
        }));
      } else {
        facts.appendChild(el("p", {
          className: "note",
          text: "این جمله ادامه‌ی ثابتی ندارد؛ هر کس چیزی می‌گوید."
        }));
      }
      result.appendChild(facts);
    }

    groups.forEach(function (g) {
      var items = [];
      prompts.forEach(function (row, index) {
        if (row.kind !== g.kind) return;
        var b = el("button", { type: "button", className: "chip", "aria-pressed": "false", text: row.prompt });
        b.addEventListener("click", function () { show(index); });
        buttons[index] = b;
        items.push(el("li", null, [b]));
      });
      if (!items.length) return;
      picker.appendChild(el("p", { className: "lab-label", text: g.label }));
      picker.appendChild(el("ul", { className: "picker" }, items));
    });
    show(0);
  }

  /* ------------------------------------------------------------------
   * Which word comes next: a bigram count over the reader's own text
   * ------------------------------------------------------------------ */

  // A word is a run of letters, marks, digits or ZWNJ. «،» «؛» «؟» «٪» and
  // the other punctuation split words; ZWNJ never does («می‌روم» is one word).
  var WORD = /[A-Za-z0-9ء-غف-ٟ٠-٩ٮ-ۓە۰-ۿ‌]+/g;
  var SENTENCE_END = /[.!?؟؛۔\n]+/;
  var MAX_ROWS = 10;

  function normalise(text) {
    return text.replace(/ي/g, "ی").replace(/ى/g, "ی").replace(/ك/g, "ک");
  }

  function wordsOf(sentence) {
    return (normalise(sentence).match(WORD) || [])
      .map(function (w) { return w.replace(/^‌+|‌+$/g, "").toLowerCase(); })
      .filter(Boolean);
  }

  function followers(text, word) {
    var counts = {};
    var order = [];
    var seen = 0;
    text.split(SENTENCE_END).forEach(function (sentence) {
      var words = wordsOf(sentence);
      for (var i = 0; i < words.length; i++) {
        if (words[i] !== word) continue;
        seen++;
        var next = words[i + 1];
        if (!next) continue;
        if (!counts[next]) { counts[next] = 0; order.push(next); }
        counts[next]++;
      }
    });
    var list = order.map(function (w, i) { return { word: w, count: counts[w], first: i }; });
    list.sort(function (a, b) { return b.count - a.count || a.first - b.first; });
    return { seen: seen, list: list };
  }

  function bigram(root) {
    var textBox = root.querySelector("[data-text]");
    var wordBox = root.querySelector("[data-word]");
    var out = root.querySelector("[data-counts]");
    var chainOut = root.querySelector("[data-chain]");
    var addTop = root.querySelector("[data-add-top]");
    var restart = root.querySelector("[data-restart]");
    if (!textBox || !wordBox || !out) return;

    var chain = [];
    var nextTop = "";

    function current() {
      var w = wordsOf(wordBox.value);
      return w.length ? w[w.length - 1] : "";
    }

    function render() {
      var word = current();
      clear(out);
      if (chainOut) chainOut.textContent = chain.join(" ");
      if (!word) {
        out.appendChild(el("p", { className: "note", text: "یک کلمه بنویسید." }));
        nextTop = "";
        if (addTop) addTop.disabled = true;
        return;
      }
      var r = followers(textBox.value, word);
      if (!r.seen) {
        out.appendChild(el("p", { className: "note", text: "«" + word + "» در این متن نیامده است." }));
      } else if (!r.list.length) {
        out.appendChild(el("p", { className: "note",
          text: "«" + word + "» " + faNum(r.seen) + " بار آمده، ولی هر بار آخر جمله بوده و بعدش کلمه‌ای نیامده است." }));
      } else {
        var total = r.list.reduce(function (s, x) { return s + x.count; }, 0);
        out.appendChild(el("p", null, [
          "«" + word + "» " + faNum(r.seen) + (r.list.length === 1
            ? " بار آمده است. بعد از آن این کلمه آمده است:"
            : " بار آمده است. بعد از آن این کلمه‌ها آمده‌اند:")
        ]));
        // At most ten rows; a pasted article can give «و» hundreds of followers.
        var list = el("ol", { className: "bars" });
        r.list.slice(0, MAX_ROWS).forEach(function (x) {
          var b = el("button", { type: "button", className: "word", text: x.word });
          b.addEventListener("click", function () { step(x.word); });
          list.appendChild(barRow(el("span", { className: "piece" }, [b]), x.count / total,
            faNum(x.count) + " بار، " + countPercent(x.count, total)));
        });
        out.appendChild(list);
        if (r.list.length > MAX_ROWS) {
          out.appendChild(el("p", { className: "note",
            text: faNum(r.list.length - MAX_ROWS) + " کلمه‌ی دیگر هم آمده است." }));
        }
      }
      nextTop = r.list.length ? r.list[0].word : "";
      if (addTop) addTop.disabled = !nextTop;
    }

    function step(word) {
      if (!chain.length) chain.push(current());
      chain.push(word);
      wordBox.value = word;
      render();
    }

    function reset() {
      var w = current();
      chain = w ? [w] : [];
      render();
    }

    wordBox.addEventListener("input", reset);
    textBox.addEventListener("input", render);
    if (addTop) addTop.addEventListener("click", function () { if (nextTop) step(nextTop); });
    if (restart) restart.addEventListener("click", function () {
      if (chain.length) wordBox.value = chain[0];
      reset();
    });
    reset();
  }

  function start() {
    var data = readData();
    Array.prototype.forEach.call(document.querySelectorAll("[data-lab]"), function (root) {
      var kind = root.getAttribute("data-lab");
      if (kind === "next-piece" && data) nextPiece(root, data);
      if (kind === "bigram") bigram(root);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
