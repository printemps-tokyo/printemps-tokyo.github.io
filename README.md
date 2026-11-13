# printemps-tokyo.github.io

The source of <https://printemps-tokyo.github.io/>: one page listing every
public printemps.tokyo repository with a one-line summary, in English
(`/`) and Japanese (`/ja/`).

## Layout

- `data/repos.json`: the list. Each entry has a name, category, kind,
  language, release date and an English (`en`) and Japanese (`ja`) summary.
- `data/releases.json`: the latest release tag of each repository, shown on
  its card. Written by `node build.mjs --releases`, not by hand.
- `build.mjs`: writes `index.html` and `ja/index.html` from the list.
  No dependencies; Node.js >= 22.
- `index.html`, `ja/index.html`: the generated pages, committed so GitHub
  Pages serves them as they are (`.nojekyll` turns off Jekyll).

## Analytics

Both pages load the Google Analytics 4 tag (`GA_ID` in `build.mjs`) to count
visits. The page itself sets no other cookies and loads no other third-party
scripts.

## Adding a repository

1. Add an entry to `data/repos.json`.
2. Run `node build.mjs --check`. It rebuilds both pages and compares the list
   with the organization's public repositories on GitHub (forks aside,
   archived ones included), exiting 1 if a repository is missing or no
   longer public.
3. Commit the data and the generated pages together.

## After a release

Run `GITHUB_TOKEN=... node build.mjs --releases --check` (the token is
optional, but the release lookups are one request per repository), then
commit `data/releases.json` with the pages.

`.github/workflows/check.yml` runs `--check` weekly and on every push, so a
new repository or release that the data does not have yet shows up as a
failed run. It never commits anything itself.

## License

[MIT](./LICENSE) (c) printemps.tokyo
