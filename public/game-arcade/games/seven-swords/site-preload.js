/* Only the opening selection's seven portraits and first standing image.
 * The shared arcade loader observes these real Image requests; later artwork
 * remains demand-loaded by the game's existing SVG renderer. */
(() => {
  'use strict';
  const stages = window.SevenArtData?.stages;
  if (!stages) return;
  const heroes = ['hongmao', 'lantu', 'sali', 'doudou', 'daben', 'tiaotiao', 'dada'];
  const files = new Set();
  for (const hero of heroes) {
    const stage = Object.values(stages).find(item => item.hero === hero);
    if (stage?.portrait) files.add(stage.portrait);
  }
  const standing = stages['hongmao:changhong']?.standing;
  if (standing) files.add(standing);
  for (const src of files) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
  }
})();
