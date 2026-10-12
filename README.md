# Fashion of Splendor

Website for **Fashion of Splendor** — a premium foreday morning band in the Barbados Crop Over festival ("Champagne & Soca").

Built and maintained by [Tech Nova](https://technovabb.com).

## Working on it

Edit the source, never the built HTML at the top of the folder:

- `src/pages/*.html` — page content (`<!--meta {…} -->` header + sections)
- `src/layout.html`, `src/partials/*.html` — the shared shell
- `assets/css/site.css` — the design system
- `assets/js/site.js` — nav, scroll reveal, gallery lightbox
- `assets/img/` — images

Then rebuild:

```
npm run build
```

`tools/build.js` assembles the top-level HTML, cache-busts CSS/JS, checks links/images, and lists any `[BRACKETED]` placeholders still to fill.

## Preview mode

`PREVIEW = true` in `tools/build.js` adds a "design preview" bar and a `noindex` tag (plus `robots.txt` blocks crawlers). Flip `PREVIEW` to `false` and remove the `Disallow` in `robots.txt` at launch.

## Still to confirm for 2027

Theme, exact date, section names, and pricing (Band ID / Section / VIP) — currently shown as `[BRACKETED]` placeholders.
