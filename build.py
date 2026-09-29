#!/usr/bin/env python3
"""Build the lessons of «یادگیری آخر هفته» (Weekend Learning in Persian).

    python3 build.py                   # every lesson
    python3 build.py 01-next-word      # one lesson
    python3 build.py --source DIR      # the newsletter's fa/ folder

For each lesson this

1. regenerates LESSON/data.json from the measured data in the newsletter's
   workspace (fa/data/), keeping only what may be published;
2. copies that data into the lesson page, between the lesson-data script
   tags, so the widget makes no network request, not even from file://;
3. writes LESSON/LESSON-offline.zip: one folder with the page, data.json,
   the notebook and the assets the page uses, the paths rewritten so it
   works when unzipped and opened straight from the disk;
4. reports which blocks of the newsletter issue appear word for word in
   the lesson page, so the two cannot drift apart unnoticed;
5. prints what a reader downloads, file by file.

The newsletter workspace is private. Without it (a fresh clone of this
repository) steps 1 and 4 are skipped and the committed data.json is used.
The workspace is found at --source, else $WL_FA_SOURCE, else the folder
Weekend-Learning/fa next to this repository.

Standard library only; the zip is byte-for-byte reproducible.
"""
from __future__ import annotations

import argparse
import html
import io
import json
import os
import re
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

REPO = Path(__file__).resolve().parent
SITE = "https://mohammadi.cv/weekend-learning-fa/"
FA_DIGITS = str.maketrans("0123456789.", "۰۱۲۳۴۵۶۷۸۹٫")
ZIP_TIME = (2026, 1, 1, 0, 0, 0)
STORED = (".woff2", ".png", ".jpg", ".zip")
DATA_TAG = re.compile(
    r'(<script type="application/json" id="lesson-data">)(.*?)(</script>)', re.S)


def fa_num(x) -> str:
    return str(x).translate(FA_DIGITS)


# --------------------------------------------------------------------------
# Lesson 01: the next word
# --------------------------------------------------------------------------

# The model's own continuation is published for these three prompts only,
# and only exactly as below. The others ran into news-site text, which a
# page for beginners is the wrong place to reprint. If the data is ever
# re-run and one of these three comes out different, the build stops, so a
# person reads the new text before it can be published.
CONTINUATION_EXPECTED = {
    "هر که بامش بیش،": " برفش بیشتر",
    "تا تنور گرم است،": " آشپزخانه سرد است",
    "یک دست": "اورد بزرگ دیگر در راه است",
}
CONTINUATION_ALLOWED = set(CONTINUATION_EXPECTED)
# Where a continuation turns into a site name: " - " or " | ", or a trailing
# " -" at the very end.
SEPARATOR = re.compile(r"\s[-|](?:\s|$)")


def cut_continuation(text: str) -> str:
    m = SEPARATOR.search(text)
    return (text[:m.start()] if m else text).rstrip()


def next_word_data(src: dict) -> dict:
    matched = set(src["summary"]["which"])
    prompts = []
    for kind, rows in (("proverb", src["proverbs"]), ("open", src["open"])):
        for row in rows:
            out = {"kind": kind, "prompt": row["prompt"]}
            if kind == "proverb":
                out["usual_ending"] = row["usual_ending"]
                out["model_wrote_usual_ending"] = row["prompt"] in matched
            out["top10"] = [{"token": t["token"], "p": t["p"]}
                            for t in row["next_token_top10"]]
            if row["prompt"] in CONTINUATION_ALLOWED:
                cont = cut_continuation(row["greedy_continuation"])
                if cont != CONTINUATION_EXPECTED[row["prompt"]]:
                    raise SystemExit(f"continuation of {row['prompt']!r} is now {cont!r}; "
                                     "read it before publishing, then update "
                                     "CONTINUATION_EXPECTED")
                out["continuation"] = cont
            prompts.append(out)
    kept = sum("continuation" in p for p in prompts)
    if kept != len(CONTINUATION_ALLOWED):
        raise SystemExit(f"expected {len(CONTINUATION_ALLOWED)} continuations, got {kept}")
    details = src["details"]
    return {
        "lesson": "01-next-word",
        "model": src["model"],
        "parameters": details["parameter_size"],
        "quantization": details["quantization_level"],
        "runner": src["ollama"].replace("ollama version is", "Ollama").strip(),
        "run_date": src["date"][:10],
        "settings": "offline, raw prompt with no chat template, temperature 0, seed 0",
        "about": (
            "p is the probability the model gave each of its top 10 candidates "
            "for the next token, right after the prompt. A token is a piece of "
            "text, often part of a word; a leading space means it starts a new "
            "word. The model's own continuation (temperature 0) is kept for "
            "three prompts only, cut before any ' - ' or ' | ' separator."),
        "summary": {
            "proverbs_tried": src["summary"]["proverbs_tried"],
            "model_wrote_usual_ending": src["summary"]["greedy_gives_usual_ending"],
        },
        "prompts": prompts,
    }


TOKENIZERS = {
    # Only the two tokenizers the issue talks about. qwen2_5 is in the source
    # file but matches a 2023 figure and is not mentioned in the text.
    "cl100k_base": "توکن‌ساز قدیمی چت‌جی‌پی‌تی",
    "o200k_base": "توکن‌ساز جدید چت‌جی‌پی‌تی",
}
WORDS = ["برفش", "هر که بامش بیش، برفش بیشتر"]


def pieces_of(entry: dict) -> list[str]:
    return list(entry["pieces"])


def tokens_data(src: dict) -> dict:
    ex = src["example"]
    texts = [
        {"id": "fa-sentence", "label": "جمله‌ی فارسی", "lang": "fa", "text": ex["fa"],
         "by": {k: pieces_of(ex[k]["fa"]) for k in TOKENIZERS}},
        {"id": "en-sentence", "label": "همان جمله به انگلیسی", "lang": "en", "text": ex["en"],
         "by": {k: pieces_of(ex[k]["en"]) for k in TOKENIZERS}},
    ]
    for w in WORDS:
        texts.append({"id": "word-" + str(len(texts)), "label": w, "lang": "fa", "text": w,
                      "by": {k: pieces_of(src["words"][w][k]) for k in TOKENIZERS}})
    for t in texts:
        for k, pcs in t["by"].items():
            if "".join(p for p in pcs if not p.startswith("<0x")) == "" or not pcs:
                raise SystemExit(f"no pieces for {t['label']} under {k}")
    corpus = {k: {"en_tokens": src["petrov_method"][k]["en_tokens"],
                  "fa_tokens": src["petrov_method"][k]["fa_tokens"],
                  "ratio": src["petrov_method"][k]["ratio"]} for k in TOKENIZERS}
    return {
        "lesson": "02-tokens",
        "tokenizers": [{"id": k, "label": v} for k, v in TOKENIZERS.items()],
        "about": (
            "Pieces are what each tokenizer produces for the text, taken from "
            "tiktoken. A piece that starts with a space begins a new word. A "
            "piece shown as <0xD8> is one byte, half of a Persian letter. The "
            "corpus ratio is Persian tokens over English tokens for the same "
            "2009 FLORES-200 sentences, each language joined and encoded once."),
        "example_source": "FLORES-200 devtest line " + str(ex["devtest_index_0_based"]),
        "chars": ex["chars"],
        "utf8_bytes": ex["utf8_bytes"],
        "corpus_sentences": 2009,
        "corpus": corpus,
        "texts": texts,
    }


@dataclass
class Lesson:
    slug: str
    issue: str                      # relative to the newsletter's fa/ folder
    data: str                       # relative to the newsletter's fa/ folder
    make_data: Callable[[dict], dict]

    @property
    def folder(self) -> Path:
        return REPO / self.slug

    @property
    def notebook(self) -> Path:
        return self.folder / f"{self.slug}.ipynb"

    @property
    def zip_name(self) -> str:
        return f"{self.slug}-offline.zip"


LESSONS = [
    Lesson("01-next-word", "issues/001-next-word.html",
           "data/001-proverbs.json", next_word_data),
    Lesson("02-tokens", "issues/002-tokens.html",
           "data/002-tokens.json", tokens_data),
]


# --------------------------------------------------------------------------
# Steps
# --------------------------------------------------------------------------

def write_if_changed(path: Path, data: bytes) -> bool:
    if path.exists() and path.read_bytes() == data:
        return False
    path.write_bytes(data)
    return True


def build_data(lesson: Lesson, source: Path | None) -> dict:
    target = lesson.folder / "data.json"
    raw = source / lesson.data if source else None
    if raw and raw.exists():
        data = lesson.make_data(json.loads(raw.read_text(encoding="utf-8")))
        text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
        changed = write_if_changed(target, text.encode("utf-8"))
        print(f"  data.json {'rewritten' if changed else 'unchanged'} from {lesson.data}")
        return data
    if not target.exists():
        raise SystemExit(f"{target} is missing and the newsletter data is not reachable")
    print("  data.json kept as it is (newsletter data not reachable)")
    return json.loads(target.read_text(encoding="utf-8"))


def inline_data(page: Path, data: dict) -> None:
    compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    compact = compact.replace("</", "<\\/").replace("<!--", "<\\!--")
    text = page.read_text(encoding="utf-8")
    if not DATA_TAG.search(text):
        raise SystemExit(f"{page} has no lesson-data script tag")
    text = DATA_TAG.sub(lambda m: m.group(1) + compact + m.group(3), text, count=1)
    write_if_changed(page, text.encode("utf-8"))


def asset_refs(page_text: str) -> list[str]:
    """Every file under assets/ the page loads, with what the CSS loads."""
    refs = set(re.findall(r'(?:href|src)="\.\./(assets/[^"#?]+)"', page_text))
    for css in [r for r in refs if r.endswith(".css")]:
        base = (REPO / css).parent
        for url in re.findall(r'url\("?([^")]+)"?\)', (REPO / css).read_text(encoding="utf-8")):
            ref = (base / url).resolve().relative_to(REPO).as_posix()
            refs.add(ref)
    for font_dir in {Path(r).parent for r in refs if r.endswith(".woff2")}:
        for extra in ("OFL.txt", "SOURCE.txt"):
            if (REPO / font_dir / extra).exists():
                refs.add((font_dir / extra).as_posix())
    return sorted(refs)


def offline_page(lesson: Lesson, text: str) -> str:
    """The lesson page as it must read inside the zip."""
    text = text.replace('"../assets/', '"assets/')
    text = text.replace('href="../index.html"', f'href="{SITE}"')
    text = text.replace(f'href="{lesson.zip_name}"',
                        f'href="{SITE}{lesson.slug}/{lesson.zip_name}"')
    text = re.sub(rf'\s*<span data-zip-size="{lesson.slug}">.*?</span>', "", text)
    leftover = re.findall(r'(?:href|src)="\.\./[^"]*"', text)
    if leftover:
        raise SystemExit(f"offline page still points outside its folder: {leftover}")
    return text


def zip_entry(zf: zipfile.ZipFile, name: str, data: bytes) -> None:
    info = zipfile.ZipInfo(name, date_time=ZIP_TIME)
    info.external_attr = 0o644 << 16
    info.compress_type = zipfile.ZIP_STORED if name.endswith(STORED) else zipfile.ZIP_DEFLATED
    zf.writestr(info, data, compresslevel=9)


def build_zip(lesson: Lesson) -> tuple[Path, list[str]]:
    page = (lesson.folder / "index.html").read_text(encoding="utf-8")
    files: list[tuple[str, bytes]] = [
        ("index.html", offline_page(lesson, page).encode("utf-8")),
        ("data.json", (lesson.folder / "data.json").read_bytes()),
    ]
    if lesson.notebook.exists():
        files.append((lesson.notebook.name, lesson.notebook.read_bytes()))
    else:
        print(f"  WARNING: {lesson.notebook.name} not found, the zip goes without it")
    # The zip is the copy that gets passed on, so it carries the licences:
    # MIT for the code, CC BY 4.0 for the text (the font's OFL comes with it).
    for lic in ("LICENSE", "LICENSE-CONTENT"):
        if (REPO / lic).exists():
            files.append((lic, (REPO / lic).read_bytes()))
    for ref in asset_refs(page):
        files.append((ref, (REPO / ref).read_bytes()))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, data in files:
            zip_entry(zf, f"{lesson.slug}/{name}", data)
    target = lesson.folder / lesson.zip_name
    changed = write_if_changed(target, buf.getvalue())
    print(f"  {lesson.zip_name} {'written' if changed else 'unchanged'}, "
          f"{len(files)} files")
    return target, [n for n, _ in files]


def set_zip_size(lesson: Lesson, size: int) -> None:
    label = f"(حدود {fa_num(max(1, round(size / 1024)))} کیلوبایت)"
    pattern = re.compile(rf'(<span data-zip-size="{lesson.slug}">)(.*?)(</span>)')
    for page in (REPO / "index.html", lesson.folder / "index.html"):
        if page.exists():
            text = page.read_text(encoding="utf-8")
            text = pattern.sub(lambda m: m.group(1) + label + m.group(3), text)
            write_if_changed(page, text.encode("utf-8"))


# Inline tags add no space, so «<span lang="en">(token)</span>:» in the page
# still reads «(token):» as in the issue.
INLINE_TAG = re.compile(r"</?(?:a|b|i|em|strong|span|small|code)\b[^>]*>")


def text_blocks(markup: str) -> list[str]:
    markup = re.sub(r"(?s)<!--.*?-->|<script.*?</script>|<style.*?</style>", " ", markup)
    out = []
    for _, inner in re.findall(r"(?s)<(p|li|h1|h2|h3)\b[^>]*>(.*?)</\1>", markup):
        inner = INLINE_TAG.sub("", inner)
        t = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", inner)).split())
        if t:
            out.append(t)
    return out


def drift_report(lesson: Lesson, source: Path | None) -> None:
    issue = source / lesson.issue if source else None
    if not (issue and issue.exists()):
        print("  drift check skipped (newsletter issue not reachable)")
        return
    page = " ".join(text_blocks((lesson.folder / "index.html").read_text(encoding="utf-8")))
    blocks = text_blocks(issue.read_text(encoding="utf-8"))
    missing = [b for b in blocks if b not in page]
    print(f"  word for word from {lesson.issue}: {len(blocks) - len(missing)} of {len(blocks)} blocks")
    for b in missing:
        print(f"    not in the page: {b[:70]}")


def weight_report(label: str, page: Path) -> None:
    text = page.read_text(encoding="utf-8")
    refs = [r for r in asset_refs(text.replace('"assets/', '"../assets/'))
            if not r.endswith(".txt") and not r.endswith("logo.png")]
    rows = [(page.relative_to(REPO).as_posix(), page.stat().st_size)]
    rows += [(r, (REPO / r).stat().st_size) for r in refs]
    total = sum(s for _, s in rows)
    print(f"  {label}: {total:,} bytes ({total / 1024:.0f} KB) on a first visit")
    for name, size in rows:
        print(f"    {size:>8,}  {name}")


# --------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("lessons", nargs="*", help="lesson folders, default all")
    ap.add_argument("--source", type=Path, help="the newsletter's fa/ folder")
    args = ap.parse_args()

    source = args.source or Path(os.environ.get(
        "WL_FA_SOURCE", REPO.parent / "Weekend-Learning" / "fa"))
    if not source.exists():
        print(f"newsletter workspace not found at {source}; using committed data")
        source = None

    chosen = [l for l in LESSONS if not args.lessons or l.slug in args.lessons]
    unknown = set(args.lessons) - {l.slug for l in LESSONS}
    if unknown:
        raise SystemExit(f"unknown lesson(s): {', '.join(sorted(unknown))}")

    for lesson in chosen:
        print(lesson.slug)
        data = build_data(lesson, source)
        inline_data(lesson.folder / "index.html", data)
        zip_path, _ = build_zip(lesson)
        set_zip_size(lesson, zip_path.stat().st_size)
        drift_report(lesson, source)
        weight_report("lesson page", lesson.folder / "index.html")
        print(f"    {(lesson.folder / 'data.json').stat().st_size:>8,}  "
              f"{lesson.slug}/data.json (also inlined in the page)")
        print(f"    {zip_path.stat().st_size:>8,}  {lesson.slug}/{lesson.zip_name}")
    hub = REPO / "index.html"
    if hub.exists():
        weight_report("hub", hub)


if __name__ == "__main__":
    sys.exit(main())
