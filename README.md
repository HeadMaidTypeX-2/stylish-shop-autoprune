#OUTDATED

Function was recently added natively to Stylish Shops, there for this module is no longer necessary. 
Still functions as written, so perhaps has some use if you'd like more control over categories that
auto-prune.

No further updates or compatibility checks will be made.

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
https://github.com/HeadMaidTypeX-2/stylish-shop-autoprune/releases/latest/download/module.json
```
