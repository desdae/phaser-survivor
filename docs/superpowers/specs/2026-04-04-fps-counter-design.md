# FPS Counter Design

## Goal

Add a lightweight always-on FPS counter for performance tuning.

## Behavior

- Show a small `FPS <value>` label in the top-right corner.
- Keep it visible during gameplay, pause overlays, and game over.
- Update on a short cadence instead of every frame to reduce flicker and overhead.

## Wiring

- Add a small UI helper in `src/game/ui/overlayFactory.js`.
- Create it from `src/game/scenes/GameScene.js`.
- Update it from the scene using Phaser's loop FPS reading.
- Re-layout it on resize so it stays pinned to the corner.

## Guardrails

- Only update text when the displayed value changes.
- Keep formatting simple: `FPS 58`.
- Add one focused UI test for layout and update behavior.
