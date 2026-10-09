# printemps-tokyo.github.io

The source of <https://printemps-tokyo.github.io/>: one page listing every
public printemps.tokyo repository with a one-line summary, in English
(`/`) and Japanese (`/ja/`).

## Layout

- `data/repos.json`: the list. Each entry has a name, category, kind,
  language, release date and an English (`en`) and Japanese (`ja`) summary.
- `build.mjs`: writes `index.html` and `ja/index.html` from the list.
  No dependencies; Node.js >= 20.
- `index.html`, `ja/index.html`: the generated pages, committed so GitHub
  Pages serves them as they are (`.nojekyll` turns off Jekyll).

## Adding a repository

1. Add an entry to `data/repos.json`.
2. Run `node build.mjs --check`. It rebuilds both pages and compares the list
   with the organization's public repositories on GitHub (forks aside,
   archived ones included), exiting 1 if a repository is missing or no
   longer public.
3. Commit the data and the generated pages together.

## License

[MIT](./LICENSE) (c) printemps.tokyo
