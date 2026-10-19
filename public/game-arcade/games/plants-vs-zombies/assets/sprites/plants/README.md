# Complete plant pre-render atlas

49 species / 328 transparent frames exported from the immutable v0.6 production mesh factories and production render poses. The source renderer SHA-256 is recorded in manifest-plants.json. No model is substituted by a generic stock sprite. Similar mushroom silhouettes are the actual production geometry.

Native Blender 4.3.2 Cycles CPU, 8 samples, fixed camera offset (4.4, 12.8, 14.8), 64 pixels/world-unit. Frames are 128×128, except two-cell Cob Cannon 160×160. PNG and lossless WebP contain the same rendered pixels. There is no Three.js/WebGL runtime dependency.

Each species has idle frames; applicable attackers also have shoot frames. Mushrooms have sleep; Scaredy-shroom hide; Chomper digest; Potato Mine armed/unarmed; Cob Cannon prepare/fire/reload. The original gray Imitater is included. Morphing into other species is an engine state and should use that species' image with a cached grayscale treatment when imitated=true. Sun-shroom growth and other engine-only visual cues can be handled by the Canvas runtime. Source geometry and animation limitations are preserved rather than advertised as new mesh animation.

Build from workspace containing untouched pvz-classic-v06:

    node tools/export-plant-models.cjs /tmp/pvz-full-plant-source
    blender -b -t 4 -P tools/render-plant-sheets.py -- /tmp/pvz-full-plant-source /tmp/pvz-full-plant-frames
    python tools/pack-plant-sheets.py /tmp/pvz-full-plant-frames assets/sprites/plants
    python tools/verify-plant-sprites.py

manifest-plants.js assigns window.PVZ_PLANT_SPRITES. Each sprite records image, anchor in source pixels, pixelsPerWorldUnit and atlas action rectangles. The ground anchor is calculated by the same orthographic camera. Contact sheet is QA only, not required at runtime. Frame verification checks all 49 kinds against content.js, alpha nonemptiness and no edge clipping.
