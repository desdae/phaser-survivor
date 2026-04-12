# Survivor Spear Barrage Visual Design

## Goal

Upgrade Spear Barrage from a marker-only strike into a visually legible falling-lance attack. The barrage should feel like large spears are crashing down into the targeted area, with strong downward momentum and a clear pre-impact warning that still reads well during dense fights.

## Scope

This spec only covers the visual presentation of Spear Barrage:

- spear fall telegraph and descent effect
- procedural or runtime-generated visuals needed for the barrage
- pooling or reuse strategy if new temporary sprites are introduced
- focused regression coverage for barrage visual state and any helper math

This spec does not change:

- Spear Barrage damage values
- cooldown, count, or radius balance
- enemy hit detection rules
- ability unlock progression
- audio behavior

## Approved Visual Direction

The chosen direction is:

- heavy diagonal sky-drop rather than a straight vertical stab
- large spear silhouettes that visibly descend toward the target area
- a readable warning ring on the ground before impact
- readability-first combat presentation rather than a fully cinematic, clutter-heavy volley

The effect should feel like thrown war-lances rather than magical sparkles:

- long dark shafts
- bright steel spearheads
- visible motion streak or shadow trail during descent
- a short impact burst when the spear lands

## Rendering Approach

### Telegraph

Each queued strike should spawn a ground warning immediately:

- thin circular ring centered on the strike point
- light warm tint so it stands apart from grass and enemy crowds
- modest alpha and line weight so it warns without dominating the screen

The ring should remain visible during the warning window and disappear on impact.

### Falling Spear

Each strike should own one large spear visual that:

- starts above the landing point
- is angled diagonally, matching the approved heavy sky-drop direction
- moves rapidly toward the target during the warning window
- slightly scales or brightens as it nears impact so the fall reads as forward motion

The spear should be substantially larger than current projectile-scale visuals. It needs to read as a real lance-sized strike rather than a small icon dropped over the marker.

### Impact

When the strike lands:

- remove the warning ring
- remove the falling spear visual
- spawn a short-lived impact flash or dust/spark burst at the landing point

The impact should reinforce the hit without lingering long enough to hide enemies.

## Asset Strategy

The fastest path is to keep the barrage effect mostly procedural and runtime-local:

- add a dedicated spear texture or composite spear visual for the falling lance
- continue using code-driven positioning and timing inside `SpearBarrageManager`
- avoid introducing a new global effect system just for this weapon

If a custom spear texture is generated in `GameScene.createTextures()`, it should be visibly different from the current generic marker:

- long shaft
- metallic head
- strong silhouette at game scale

If the spear is assembled from existing primitives instead, the final on-screen result must still look like one coherent large spear.

## Runtime Ownership

`SpearBarrageManager` should continue owning the strike lifecycle because the barrage timing already lives there.

For each queued strike, the manager should track:

- landing position
- damage
- radius
- lands-at timestamp
- warning ring visual
- falling spear visual

Lifecycle:

1. Queue strike at the cursor target plus any radial offsets.
2. Spawn warning ring and falling spear visual immediately.
3. Update the spear visual over the warning window so it visibly descends.
4. On `landsAt`, resolve damage exactly as today.
5. Clean up strike visuals and spawn a very short impact burst.

This preserves current gameplay timing while upgrading only presentation.

## Performance Constraints

The barrage may fire several spears at once, so the visuals must stay bounded:

- reuse inactive visuals where practical instead of creating unlimited new sprites
- keep impact effects very short-lived
- avoid per-frame allocations for derived animation state
- keep the warning ring and spear update logic simple enough to scale with multiple strikes

The implementation should remain cheap compared with enemy update cost.

## Testing

Add focused regression coverage for:

- queued spear barrage strikes creating both a warning ring and a falling spear visual
- strike cleanup destroying or deactivating those visuals after impact
- any extracted helper math used for descent positioning or scaling

Do not over-test frame-by-frame rendering details. The tests should lock in:

- visual objects are created when a strike queues
- visual objects are removed when a strike lands
- helper behavior stays stable if pure functions are introduced

## Success Criteria

- Spear Barrage clearly shows large spears falling into the targeted area.
- The barrage reads as a heavy physical strike, not a reused meteor marker.
- The warning ring gives enough time to read the landing zone during active combat.
- Impact visuals feel satisfying without obscuring enemies.
- Existing Spear Barrage damage behavior remains unchanged.
