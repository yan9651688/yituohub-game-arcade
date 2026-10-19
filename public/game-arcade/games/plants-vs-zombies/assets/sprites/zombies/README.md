# Native v06 zombie prerenders

All 26 zombie definitions, including Zomboss, have their own native production model. There is no normal-zombie replacement fallback. The original v06 model factory remains unchanged; the exporter calls `PVZRenderer.createZombieModel` with a CPU-only Three.js instance and exports actual indexed meshes, normals, materials, and hierarchical pose matrices. Browser runtime uses only Canvas2D atlases.

## Build

From the project directory, with the original `../pvz-classic-v06` present:

```
node tools/export-zombie-models.cjs /tmp/pvz-v07-zombies-source
blender -b -t 4 -P tools/render-zombie-sheets.py -- /tmp/pvz-v07-zombies-source /tmp/pvz-v07-zombies-frames
python tools/pack-zombie-sheets.py /tmp/pvz-v07-zombies-frames assets/sprites/zombies
python tools/verify-zombie-sprites.py
```

Blender Cycles CPU, 8 samples, transparent RGBA, AgX, fixed orthographic camera offset `(4.4,12.8,14.8)`. Every kind is fitted against the union of all its animated mesh bounds with 14% margin. Normal cells are 128px; balloon/bungee/gargantuar 160px; Zomboss 224px. Use each record's `pixelsPerWorldUnit` and `anchor`; do not normalize every species to the same screen size.

`manifest-zombies.js` defines `window.PVZ_ZOMBIE_SPRITES`, using the laboratory atlas schema. `manifest-zombies.json` is the identical machine-readable manifest. PNG is the compatibility image; lossless WebP is a smaller equivalent. State aliases reuse frame rectangles rather than duplicating pixels.

All kinds have walk, eat, attack alias, death, and headless. Armor-bearing species additionally have armor-loss, damaged-walk, damaged-eat, damaged-death. Special actions describe pole/dolphin jumps, digger tunnel/emergence/reverse, snorkel submergence/surface, balloon air/pop/ground, Gargantuar smash/Imp throw/unladen, thrown Imp, bungee drop/steal/rise, pogo, dance/summon, jack windup/explode, ladder placement, catapult launch, vehicle movement, and boss exposures/attacks. Standard walk/eat/death follow production equations; additional semantic poses articulate the same production meshes.

Static caveat inherited from v06: Zomboss is the original stylized enlarged blue-headed clay model, not a replacement robotic model. Its spells, targeting indicators, projectiles, and vehicle-drop effects are runtime Canvas2D effects layered separately by the renderer.

## Verification

`verification.json` records 26 species, 788 frames, 191 actions including aliases. All frames are nonempty, have transparent margins, avoid clipping, and every action contains changing frames. Runtime PNGs total 6,569,863 bytes; WebP alternatives total 3,063,998 bytes. All decoded atlases total 64,028,672 bytes, so a renderer should load only needed species or evict unused atlases on level transitions.

`species-contact.jpg` and `specials-contact.jpg` were visually reviewed. The full `sprite-contact-sheet.jpg` includes the first frame of every action. These JPEGs are build review artifacts, not runtime dependencies.
