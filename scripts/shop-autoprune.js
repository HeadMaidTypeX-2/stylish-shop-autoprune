/**
 * Stylish Shop — Auto-prune categories at 0 stock
 * -----------------------------------------------
 * Adds a per-category checkbox to the Stylish Shop config UI: "Remove items at
 * 0 stock". When a flagged category has an item whose stock reaches a finite 0
 * (e.g. a sold-back item that fully sells through), that entry is removed from
 * the category instead of lingering as an out-of-stock listing.
 *
 * - The toggle is stored in THIS module's flag namespace (the shop's category
 *   data model would strip a custom field), keyed by category id.
 * - Pruning runs GM-side only (only a GM can edit the shop actor) and is
 *   re-entrancy guarded.
 * - Only finite stock <= 0 is pruned. Unlimited stock (null) is never touched.
 *   To prune at a different threshold, change the `<= 0` test in pruneShop().
 *
 * System-agnostic. Requires the Stylish Shop module to do anything.
 */

const MODULE_ID = "stylish-shop-autoprune";   // our flag namespace
const AUTOPRUNE_FLAG = "autoPrune";            // { [categoryId]: true }
const SHOP_ID = "stylish-shop";
const SHOP_FLAG = "shopConfig";

let pruning = false;

function isResponsibleGM() {
  const gm = game.users.activeGM ?? game.users.find(u => u.isGM && u.active);
  return gm ? gm === game.user : !!game.user.isGM;
}

async function pruneShop(actor) {
  if (!actor || pruning || !game.user.isGM) return;

  const flags = actor.getFlag(MODULE_ID, AUTOPRUNE_FLAG) ?? {};
  if (!Object.keys(flags).length) return;

  const config = actor.getFlag(SHOP_ID, SHOP_FLAG);
  if (!config?.categories?.length) return;

  const categories = foundry.utils.deepClone(config.categories);
  let changed = false;
  for (const cat of categories) {
    if (!flags[cat.id] || !Array.isArray(cat.items)) continue;
    const before = cat.items.length;
    cat.items = cat.items.filter(it => !(typeof it.stock === "number" && it.stock <= 0));
    if (cat.items.length !== before) changed = true;
  }
  if (!changed) return;

  pruning = true;
  try {
    await actor.setFlag(SHOP_ID, SHOP_FLAG, { ...config, categories });
    // Nudge any open shop views to refresh (our own listener is skipped by the guard).
    Hooks.callAll("stylishShop.shopUpdated", actor.id, {});
  } finally {
    pruning = false;
  }
}

// Prune after any shop change (a purchase that drains stock fires this on all clients).
Hooks.on("stylishShop.shopUpdated", (shopActorId) => {
  if (pruning || !isResponsibleGM()) return;
  pruneShop(game.actors.get(shopActorId));
});

// Inject the per-category toggle into the Stylish Shop config UI.
Hooks.on("renderShopConfigApp", (app, element, context) => {
  const actorId = context?.actorId;
  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!actorId || !root) return;

  const actor = game.actors.get(actorId);
  const flags = actor?.getFlag(MODULE_ID, AUTOPRUNE_FLAG) ?? {};

  for (const card of root.querySelectorAll(".ssc-category-card[data-category-id]")) {
    if (card.querySelector(".ptr-autoprune")) continue; // idempotent across re-renders
    const catId = card.dataset.categoryId;
    if (!catId) continue;

    const label = document.createElement("label");
    label.className = "ptr-autoprune";
    label.title = "When on, items in this category are removed once their stock hits 0.";
    label.style.cssText = "display:flex;align-items:center;gap:6px;margin:4px 8px;font-size:12px;opacity:.9;";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!flags[catId];
    cb.addEventListener("change", async () => {
      const a = game.actors.get(actorId);
      if (!a) return;
      if (cb.checked) {
        // setFlag merges, so adding a key works fine.
        await a.setFlag(MODULE_ID, `${AUTOPRUNE_FLAG}.${catId}`, true);
        await pruneShop(a); // clear any already-empty entries immediately
      } else {
        // setFlag MERGES, so it can't remove a key — use the "-=" deletion syntax.
        await a.update({ [`flags.${MODULE_ID}.${AUTOPRUNE_FLAG}.-=${catId}`]: null });
      }
    });

    label.append(cb, document.createTextNode("Remove items at 0 stock"));
    (card.querySelector(".ssc-cat-sellback") ?? card).appendChild(label);
  }
});

Hooks.once("ready", () => {
  if (!game.modules.get(SHOP_ID)?.active) {
    console.warn(`${MODULE_ID} | "${SHOP_ID}" is not active; this module has nothing to do without it.`);
  }
});