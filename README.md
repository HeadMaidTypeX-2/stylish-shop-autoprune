# Stylish Shop Auto-Prune

Adds a per-category **"Remove items at 0 stock"** toggle to the
[Stylish Shop](https://github.com/) config UI. When a flagged category has an
item whose stock reaches a finite `0` (for example a sold-back item that fully
sells through), that entry is removed from the category instead of lingering as
a dead "out of stock" listing.

System-agnostic. Does nothing unless the **Stylish Shop** module is active.

## Behaviour

- Open a shop's config; each category card gains a checkbox. Tick it on the
  categories you want to self-clean (e.g. a Junk / Used-goods sell-back section).
- Only **finite** stock of `0` is pruned. Unlimited stock (`null`) is left alone.
- Pruning runs **GM-side only** (via the single active GM) and is re-entrancy
  guarded; players trigger it simply by buying.
- The toggle is stored in this module's own flags, keyed by category id, so a
  Stylish Shop update can't strip it. (Deleting and recreating a category means
  re-ticking it.)

## Notes

- Threshold is `<= 0`; change the test in `scripts/shop-autoprune.js` to prune
  at a different stock level.
- The UI checkbox is injected against Stylish Shop's `.ssc-category-card` /
  `.ssc-cat-sellback` markup. If a future Stylish Shop release renames those,
  the checkbox may stop appearing (pruning of already-flagged categories keeps
  working regardless).

## Install

Manifest URL:

```
https://github.com/<YOUR-GITHUB-USERNAME>/stylish-shop-autoprune/releases/latest/download/module.json
```

## Update workflow

```bash
git add -A && git commit -m "..."
git tag v1.0.1
git push origin main --tags
```

The included GitHub Action stamps the version/URLs, zips the module, and
publishes a release that Foundry's "Check for Updates" can see.
