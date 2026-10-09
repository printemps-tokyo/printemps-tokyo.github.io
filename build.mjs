#!/usr/bin/env node
/**
 * Builds the two pages of https://printemps-tokyo.github.io/ from data/repos.json:
 *   index.html     English
 *   ja/index.html  Japanese
 *
 * Usage:
 *   node build.mjs          write both pages
 *   node build.mjs --check  also compare data/repos.json with the organization's
 *                           public repositories (forks aside) on GitHub; exit 1
 *                           on a mismatch
 *
 * No dependencies. Node.js >= 20.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const ORG = "printemps-tokyo";
const SITE = "https://printemps-tokyo.github.io";
const HOME = "https://printemps.tokyo/";

const TEXT = {
  en: {
    path: "/",
    file: "index.html",
    title: "printemps.tokyo open source",
    description: "Small, practical open-source tools by printemps.tokyo: command-line tools, browser extensions and more, each with a one-line summary.",
    heading: "Open source",
    lead: "Small, practical tools by printemps.tokyo for web analytics, AI, development, media and everyday work, each focused on one job.",
    count: (n) => `${n} projects`,
    filter: "Filter",
    filterPlaceholder: "Name, language or keyword",
    shown: (n, total) => `${n} of ${total} shown`,
    none: "No project matches.",
    released: "Released",
    switchLabel: "日本語",
    switchHint: "このページを日本語で見る",
    org: "GitHub organization",
    home: "printemps.tokyo",
    contents: "Categories",
    updated: "Updated",
    kinds: { CLI: "CLI", "Chrome extension": "Chrome extension", "Neovim plugin": "Neovim plugin", Template: "Template", Repository: "Repository" },
  },
  ja: {
    path: "/ja/",
    file: "ja/index.html",
    title: "プランタンのオープンソースツール・プログラム | printemps.tokyo",
    description: "printemps.tokyoが公開しているオープンソースの一覧。CLIツールやブラウザ拡張などを、それぞれ一言の説明付きでまとめています。",
    heading: "プランタンのオープンソースツール・プログラム",
    lead: "printemps.tokyoが公開している、Web解析・AI・開発・メディア・日々の仕事のための小さく実用的なツールです。どれも1つの仕事に絞っています。",
    count: (n) => `${n}件`,
    filter: "絞り込み",
    filterPlaceholder: "名前・言語・キーワード",
    shown: (n, total) => `${total}件中${n}件を表示`,
    none: "該当するプロジェクトはありません。",
    released: "公開",
    switchLabel: "English",
    switchHint: "View this page in English",
    org: "GitHub組織",
    home: "printemps.tokyo",
    contents: "カテゴリ",
    updated: "更新",
    kinds: { CLI: "CLI", "Chrome extension": "Chrome拡張", "Neovim plugin": "Neovimプラグイン", Template: "テンプレート", Repository: "リポジトリ" },
  },
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function load() {
  const data = JSON.parse(readFileSync(join(ROOT, "data/repos.json"), "utf8"));
  const errors = [];
  for (const c of data.categories) if (!/^[a-z0-9-]+$/.test(c.id)) errors.push(`category "${c.id}": id must be [a-z0-9-]`);
  const ids = new Set(data.categories.map((c) => c.id));
  const names = new Set();
  for (const r of data.repos) {
    if (!/^[A-Za-z0-9._-]+$/.test(r.name)) errors.push(`${r.name}: not a repository name`);
    if (names.has(r.name)) errors.push(`${r.name}: listed twice`);
    names.add(r.name);
    if (!ids.has(r.category)) errors.push(`${r.name}: unknown category "${r.category}"`);
    for (const k of ["kind", "language", "released", "en", "ja"]) if (!r[k]) errors.push(`${r.name}: missing "${k}"`);
    if (r.kind && !(r.kind in TEXT.en.kinds)) errors.push(`${r.name}: unknown kind "${r.kind}"`);
    if (r.released && !/^\d{4}-\d{2}-\d{2}$/.test(r.released)) errors.push(`${r.name}: released must be YYYY-MM-DD`);
  }
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  return data;
}

function todayJst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

const CSS = `
:root {
  --bg: #fbfaf7; --surface: #ffffff; --text: #1d1d1f; --muted: #5f6368; --line: #e4e1da;
  --accent: #c2185b; --accent-soft: #fce4ec; --chip: #f1eee8; --focus: #1a73e8; --field-line: #8a8580;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #15161a; --surface: #1d1f24; --text: #ececec; --muted: #a3a7ae; --line: #2e3138;
    --accent: #f06292; --accent-soft: #3a2230; --chip: #262930; --focus: #8ab4f8; --field-line: #6b7079;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #15161a; --surface: #1d1f24; --text: #ececec; --muted: #a3a7ae; --line: #2e3138;
  --accent: #f06292; --accent-soft: #3a2230; --chip: #262930; --focus: #8ab4f8; --field-line: #6b7079;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif;
  line-height: 1.65; -webkit-text-size-adjust: 100%;
}
a { color: inherit; }
a:focus-visible, input:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.wrap { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
header.site { border-bottom: 1px solid var(--line); }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; padding-bottom: 14px; }
.brand { font-weight: 700; letter-spacing: .01em; text-decoration: none; }
.brand span { color: var(--accent); }
.bar nav { display: flex; gap: 6px; flex-wrap: wrap; }
.bar nav a { font-size: .875rem; text-decoration: none; padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
.bar nav a:hover { border-color: var(--accent); }
.hero { padding-top: 40px; padding-bottom: 20px; }
.hero h1 { font-size: clamp(1.9rem, 4vw, 2.6rem); line-height: 1.2; margin: 0 0 12px; }
.hero p { margin: 0; color: var(--muted); max-width: 46em; }
.hero .count { display: inline-block; margin-top: 14px; font-size: .875rem; font-weight: 600; color: var(--accent); background: var(--accent-soft); padding: 2px 10px; border-radius: 999px; }
.tools { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--line); padding: 10px 0; }
.tools .wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.filter { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; }
.filter label { font-size: .875rem; color: var(--muted); white-space: nowrap; }
.filter input { flex: 1; min-width: 0; font: inherit; font-size: .95rem; padding: 7px 12px; border: 1px solid var(--field-line); border-radius: 8px; background: var(--surface); color: var(--text); }
.status { font-size: .8125rem; color: var(--muted); }
.toc { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0; scrollbar-width: thin; flex: 1 1 100%; }
.toc a { flex: none; font-size: .8125rem; text-decoration: none; padding: 3px 10px; border-radius: 999px; background: var(--chip); }
.toc a:hover { background: var(--accent-soft); }
main { padding-top: 8px; padding-bottom: 48px; }
section.cat { padding-top: 28px; scroll-margin-top: 110px; }
section.cat h2 { font-size: 1.15rem; margin: 0 0 12px; display: flex; align-items: baseline; gap: 8px; }
section.cat h2 small { font-size: .8125rem; font-weight: 500; color: var(--muted); }
ul.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
li.card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; transition: border-color .15s; }
li.card:hover { border-color: var(--accent); }
.card h3 { margin: 0; font-size: 1.05rem; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.card h3 a { text-decoration: none; }
.card h3 a:hover { color: var(--accent); text-decoration: underline; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: .75rem; color: var(--muted); }
.meta span { background: var(--chip); padding: 1px 8px; border-radius: 999px; }
.card p { margin: 0; font-size: .9rem; }
.card time { margin-top: auto; font-size: .75rem; color: var(--muted); }
.empty { padding: 32px 0; color: var(--muted); }
footer { border-top: 1px solid var(--line); padding: 20px 0 32px; font-size: .8125rem; color: var(--muted); }
footer .wrap { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
[hidden] { display: none !important; }
@media (max-width: 520px) {
  .hero { padding-top: 28px; }
  ul.grid { grid-template-columns: 1fr; }
  section.cat { scroll-margin-top: 140px; }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } li.card { transition: none; } }
`;

const SCRIPT = `
(() => {
  const input = document.getElementById("q");
  const status = document.getElementById("status");
  const empty = document.getElementById("empty");
  const cards = [...document.querySelectorAll("li.card")];
  const sections = [...document.querySelectorAll("section.cat")];
  const links = new Map([...document.querySelectorAll(".toc a")].map((a) => [a.hash.slice(1), a]));
  const total = cards.length;
  const fmt = status.dataset.format;
  const norm = (s) => s.normalize("NFKC").toLowerCase();
  const run = () => {
    const words = norm(input.value).split(/\\s+/).filter(Boolean);
    let shown = 0;
    for (const c of cards) {
      const hit = words.every((w) => c.dataset.search.includes(w));
      c.hidden = !hit;
      if (hit) shown++;
    }
    for (const s of sections) {
      s.hidden = !s.querySelector("li.card:not([hidden])");
      const link = links.get(s.id);
      if (link) link.hidden = s.hidden;
    }
    empty.hidden = shown > 0;
    status.textContent = words.length ? fmt.replace("{n}", shown).replace("{total}", total) : "";
  };
  input.addEventListener("input", run);
  document.querySelector(".tools").hidden = false;
})();
`;

function page(lang, data, updated) {
  const t = TEXT[lang];
  const other = lang === "en" ? "ja" : "en";
  const total = data.repos.length;
  const byCat = data.categories
    .map((c) => ({ ...c, repos: data.repos.filter((r) => r.category === c.id).sort((a, b) => b.released.localeCompare(a.released) || a.name.localeCompare(b.name)) }))
    .filter((c) => c.repos.length > 0);

  const cards = (repos) =>
    repos
      .map((r) => {
        const url = `https://github.com/${ORG}/${encodeURIComponent(r.name)}`;
        const search = [r.name, r.language, t.kinds[r.kind], r.kind, r[lang]].join(" ").normalize("NFKC").toLowerCase();
        return `<li class="card" data-search="${esc(search)}">
  <h3><a href="${esc(url)}">${esc(r.name)}</a></h3>
  <div class="meta"><span>${esc(t.kinds[r.kind])}</span><span>${esc(r.language)}</span></div>
  <p>${esc(r[lang])}</p>
  <time datetime="${esc(r.released)}">${esc(t.released)} ${esc(r.released)}</time>
</li>`;
      })
      .join("\n");

  const sections = byCat
    .map(
      (c) => `<section class="cat" id="${esc(c.id)}" aria-labelledby="h-${esc(c.id)}">
<h2 id="h-${esc(c.id)}">${esc(c[lang])} <small>${esc(t.count(c.repos.length))}</small></h2>
<ul class="grid">
${cards(c.repos)}
</ul>
</section>`,
    )
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.description,
    url: `${SITE}${t.path}`,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: "printemps.tokyo", url: HOME },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
      itemListElement: byCat
        .flatMap((c) => c.repos)
        .map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `https://github.com/${ORG}/${r.name}`, name: r.name })),
    },
  };

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<link rel="canonical" href="${SITE}${t.path}">
<link rel="alternate" hreflang="en" href="${SITE}${TEXT.en.path}">
<link rel="alternate" hreflang="ja" href="${SITE}${TEXT.ja.path}">
<link rel="alternate" hreflang="x-default" href="${SITE}${TEXT.en.path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="printemps.tokyo">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:url" content="${SITE}${t.path}">
<meta property="og:locale" content="${lang === "en" ? "en_US" : "ja_JP"}">
<meta property="og:locale:alternate" content="${lang === "en" ? "ja_JP" : "en_US"}">
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#c2185b"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">p</text></svg>')}">
<style>${CSS.trim()}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
<header class="site">
<div class="wrap bar">
<a class="brand" href="${HOME}">printemps<span>.</span>tokyo</a>
<nav aria-label="${lang === "en" ? "Links" : "リンク"}">
<a href="https://github.com/${ORG}">${esc(t.org)}</a>
<a href="${t.path === "/" ? "ja/" : "../"}" hreflang="${other}" lang="${other}" title="${esc(t.switchHint)}">${esc(t.switchLabel)}</a>
</nav>
</div>
</header>
<div class="wrap hero">
<h1>${esc(t.heading)}</h1>
<p>${esc(t.lead)}</p>
<span class="count">${esc(t.count(total))}</span>
</div>
<div class="tools" hidden>
<div class="wrap">
<div class="filter" role="search">
<label for="q">${esc(t.filter)}</label>
<input id="q" type="search" placeholder="${esc(t.filterPlaceholder)}" autocomplete="off">
</div>
<span class="status" id="status" role="status" aria-live="polite" data-format="${esc(t.shown("{n}", "{total}"))}"></span>
<nav class="toc" aria-label="${esc(t.contents)}">
${byCat.map((c) => `<a href="#${esc(c.id)}">${esc(c[lang])}</a>`).join("\n")}
</nav>
</div>
</div>
<main class="wrap">
${sections}
<p class="empty" id="empty" hidden>${esc(t.none)}</p>
</main>
<footer>
<div class="wrap">
<span>&copy; printemps.tokyo</span>
<span>${esc(t.updated)} <time datetime="${updated}">${updated}</time></span>
</div>
</footer>
<script>${SCRIPT.trim()}</script>
</body>
</html>
`;
}

async function check(data) {
  const names = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&page=${page}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "printemps-tokyo-site-build" },
    });
    if (!res.ok) throw new Error(`GitHub API: HTTP ${res.status}`);
    const batch = await res.json();
    names.push(...batch.filter((r) => !r.fork).map((r) => r.name));
    if (batch.length < 100) break;
  }
  const self = `${ORG}.github.io`;
  const listed = new Set(data.repos.map((r) => r.name));
  const missing = names.filter((n) => !listed.has(n) && n !== self);
  const stale = [...listed].filter((n) => !names.includes(n));
  for (const n of missing) console.error(`missing from data/repos.json: ${n}`);
  for (const n of stale) console.error(`not a public repository: ${n}`);
  return missing.length === 0 && stale.length === 0;
}

const data = load();
const updated = todayJst();
for (const lang of ["en", "ja"]) {
  const file = join(ROOT, TEXT[lang].file);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(lang, data, updated));
  console.log(`wrote ${TEXT[lang].file} (${data.repos.length} projects)`);
}
if (process.argv.includes("--check")) {
  const ok = await check(data);
  console.log(ok ? "data/repos.json matches the public repositories" : "data/repos.json is out of date");
  if (!ok) process.exitCode = 1;
}
