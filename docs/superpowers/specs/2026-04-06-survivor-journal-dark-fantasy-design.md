# Survivor Journal Dark-Fantasy Redesign

Date: 2026-04-06

## Goal

Restyle the current Phaser in-canvas journal into a grim dark-fantasy bestiary interface inspired by a cursed codex. The redesign must preserve the existing journal behavior, data flow, and information architecture while replacing the current clean sci-fi presentation with a gothic, hand-crafted visual language.

The finished journal should feel like a weathered ritual book or demon-hunter compendium: worn stone, tarnished metal, bone-like ornamentation, parchment copy, ember-red accents, and deep shadowed surfaces.

## Scope

This redesign applies only to the journal overlay and related rendering helpers.

In scope:

- journal modal presentation
- journal-specific decorative layers and ambience
- journal-specific layout refactor into a dedicated component/class
- journal portrait frame / selected entry framing
- dark-fantasy styling for title, tabs, close button, list entries, and detail panel
- resize-safe layout and draw-order cleanup

Out of scope:

- gameplay logic
- journal data content changes
- keyboard and mouse behavior changes beyond preserving the same interactions
- DOM-based UI
- unrelated overlay redesigns

## Functional Requirements

The redesign must preserve the current journal functionality:

- `J` opens and closes the journal
- `Esc` closes the journal
- top-right close button closes the journal
- tabs switch between `Enemies` and `Abilities`
- left list entries remain selectable by pointer
- right detail panel updates from the selected entry
- discovery-state handling remains unchanged
- existing scene pause/resume behavior remains unchanged

The journal must keep the same core information architecture:

- title at top: `Journal`
- tabs under the title
- left column list for entries
- right column detail panel
- close button in the top-right

## Architecture

The journal should be refactored out of the generic overlay factory into a dedicated overlay component:

- `src/game/ui/JournalOverlay.js`

The component should expose an interface compatible with current scene usage:

- `show(payload)`
- `hide()`
- `update(payload)`
- `layout(width, height)`
- `handlePointer(pointerX, pointerY)`
- `isVisible()`

`GameScene` should continue to treat the journal as a pause overlay object, with minimal integration changes beyond importing the new component instead of building the journal inline in the generic overlay factory.

## Visual Design Direction

### Overall Mood

The journal should feel:

- gothic
- cursed
- old and hand-crafted
- heavy and atmospheric
- closer to Diablo-style grim fantasy than to sci-fi HUD

### Palette

Use centralized constants for colors and styling values. The core palette should be:

- near-black / blue-black backdrop
- charcoal stone and iron frame surfaces
- rusty brown grime and worn edge coloration
- muted bronze / bone trim
- parchment beige body copy
- dim ember red highlights for selection and button emphasis
- optional tiny touches of sickly green for monster portrait emphasis only

Avoid:

- bright cyan sci-fi borders
- flat neon strokes
- clean geometric minimalism
- pure white body copy

## Layout

Keep the existing broad layout proportions while upgrading the structure into layered sections:

1. Backdrop dimmer
2. Full modal root frame
3. Decorative title plaque
4. Tab row beneath title
5. Left navigation panel
6. Right content panel
7. Portrait frame area inside the detail panel
8. Decorative separators
9. Top-right close button
10. Ambient FX layer

The modal should remain resolution-independent and centered on resize.

## Component Breakdown

### Root Modal Container

Use a single root container for the journal and position all child elements relative to it. The root should own:

- backdrop
- main frame
- title plaque
- tab plaques
- left panel
- right panel
- text nodes
- portrait frame
- close button
- ambient effects group

### Outer Frame

The journal needs a thick ornamental border around the full modal.

Visual requirements:

- distressed edges
- bone/thorn/skull-inspired ornament suggestions
- heavier top and bottom weight than a plain rectangular frame
- layered highlights and shadows for depth
- uneven silhouette accents such as spikes, drips, chips, or horn-like corners

Implementation guidance:

- prefer reusable textures if suitable assets already exist
- otherwise generate a procedural frame texture or layered frame pieces using Phaser graphics and texture generation
- keep the center fill separate from the border treatment

### Title Plaque

The title should sit on a decorative header plate centered at the top.

Requirements:

- plaque behind the title
- `Journal` in large serif / ritualistic styling
- carved or engraved feel through stroke, shadow, and highlight treatment
- title should read as mounted, not floating

### Tabs

The tabs must remain directly below the title.

Requirements:

- inactive tabs appear muted and worn
- active tab appears brighter and more carved, with stronger plaque highlight or underline
- tabs should resemble small carved plaques or heavy stitched labels rather than flat buttons

### Left Navigation Panel

The left list should feel like an old framed ledger or coffin-plaque board.

Requirements:

- distressed panel frame
- textured background
- each row styled as an engraved strip or worn parchment bar
- selected row uses ember-red or muted gold emphasis
- unknown `???` entries appear dim and mysterious
- hover response remains subtle and atmospheric

### Right Detail Panel

The right panel should feel like aged parchment inset within cracked stone or iron framing.

Requirements:

- large enemy/ability name at top
- parchment-toned description beneath
- grouped stat rows with stronger spacing and alignment
- labels and values visually differentiated
- etched or carved separator rules between sections
- upgrade paths remain visible only when appropriate

### Portrait Frame

Add a framed portrait area for the selected entry if feasible using current texture keys.

Requirements:

- decorative frame around portrait
- can use current enemy texture key as a placeholder visual source
- should be easy to replace later with full enemy art
- must not require changing journal data flow beyond using already-available texture/icon keys

### Close Button

Replace the plain close presentation with a rune-like carved control.

Requirements:

- top-right placement preserved
- red rune / iron square feel
- pale crossed mark or carved sigil, not a modern flat icon
- hover can slightly brighten the red glow

## Texture and Rendering Strategy

Prefer existing suitable UI assets if present, but do not block on missing art.

If dark-fantasy assets are not already available, implement a strong procedural fallback using:

- generated textures
- layered graphics shapes
- alpha overlays
- shadow passes
- grime/crack/noise-style patterning
- frame corner ornaments
- parchment/stone tonal variation

Procedural fallback must still look intentional and atmospheric, not like placeholder rectangles.

All style values should be centralized in constants/config inside the journal component, including:

- palette
- panel sizes
- padding
- section spacing
- text styles
- glow strengths
- ambient FX settings

## Typography

Use in-canvas Phaser text only.

Styling requirements:

- serif or medieval-feeling font stack where practical
- title larger and more carved-looking
- body text warm parchment color
- subtle stroke and shadow for headings
- moderate letter spacing only where it helps the fantasy tone

## Ambient Effects

Keep ambient FX subtle and tasteful.

Allowed effects:

- candle flames in lower corners
- slow candle flicker
- faint smoke or drifting dust
- low-strength vignette
- sparse ember motes if they do not clutter readability

Not allowed:

- flashy arcade particle spam
- large animated loops that distract from reading
- effects that obscure text or hit targets

These effects should be layered into the journal component and remain lightweight.

## Input and Interaction Rules

Mouse and keyboard behavior must remain intact:

- pointer hit-testing for tabs, rows, and close button
- `J` toggle behavior preserved
- `Esc` close behavior preserved
- scene-level pause routing preserved

The redesign may improve hitbox structure internally, but behavior visible to the player must remain the same.

## Resize and Anchoring

The journal must remain correctly centered and readable across window sizes.

Requirements:

- all sections anchored relative to the root container
- no absolute screen-space child drift
- portrait frame, tabs, and close button reposition correctly on resize
- ambient FX stay visually attached to the journal modal rather than the world

## Testing

Add or update tests for:

- journal overlay hit-testing still working for tabs, rows, and close button
- journal layout expectations that matter structurally
- scene routing for `J` and `Esc`
- no regression in current journal pause behavior

Existing gameplay tests should not need functional changes beyond adapting to the dedicated journal component seam if required.

## Success Criteria

The redesign is successful if:

- the journal still works exactly as before mechanically
- the interface now reads as a grim dark-fantasy codex instead of a sci-fi overlay
- the new journal visuals are built from reusable layered pieces, not fragile one-off drawing
- styling values are centralized and easy to tune
- ambient effects are atmospheric but restrained
- resize behavior remains stable

## Implementation Notes

- Touch only the files needed for the journal redesign
- Reuse existing architecture where possible
- Add comments only for non-obvious rendering choices
- Clearly separate procedural placeholders from any asset-driven portions so future art swaps are straightforward
