(function () {
  'use strict';

  // Hand-drawn, resolution-independent UI art. All ids are local to an instance.
  // The liquid is a real clipped rectangle, not a decorative, fixed-height image.
  let serial = 0;
  const C = 80, R = 54, TOP = C - R, BOTTOM = C + R;
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const rounded = value => Math.round(value * 1000) / 1000;

  function markup() {
    const id = 'ss-hp-orb-' + (++serial);
    const paint = name => 'url(#' + id + '-' + name + ')';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="ss-c-health-orb" viewBox="0 0 160 180" width="160" height="180" fill="none" aria-hidden="true" focusable="false" data-hp-ratio="1">
  <defs>
    <linearGradient id="${id}-gold" x1="33" y1="21" x2="122" y2="144" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f9e9b2"/><stop offset=".15" stop-color="#bca56c"/><stop offset=".29" stop-color="#6b5228"/><stop offset=".42" stop-color="#dfc58a"/><stop offset=".58" stop-color="#9a773c"/><stop offset=".75" stop-color="#e4cc8b"/><stop offset=".89" stop-color="#715527"/><stop offset="1" stop-color="#b99b5b"/>
    </linearGradient>
    <linearGradient id="${id}-edge" x1="35" y1="26" x2="121" y2="134" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff4ce"/><stop offset=".36" stop-color="#d6b56c"/><stop offset=".6" stop-color="#685020"/><stop offset=".83" stop-color="#f1d69a"/><stop offset="1" stop-color="#8d6831"/>
    </linearGradient>
    <linearGradient id="${id}-carve" x1="0" y1="0" x2=".8" y2="1">
      <stop stop-color="#fff1be"/><stop offset=".22" stop-color="#d1ad60"/><stop offset=".54" stop-color="#84602e"/><stop offset=".75" stop-color="#e2c484"/><stop offset="1" stop-color="#59431f"/>
    </linearGradient>
    <linearGradient id="${id}-jade" x1="36" y1="32" x2="119" y2="138" gradientUnits="userSpaceOnUse">
      <stop stop-color="#45665a"/><stop offset=".25" stop-color="#193e36"/><stop offset=".6" stop-color="#16352e"/><stop offset=".85" stop-color="#305142"/><stop offset="1" stop-color="#0a2826"/>
    </linearGradient>
    <radialGradient id="${id}-glass" cx=".32" cy=".2" r=".93">
      <stop stop-color="#3c3c38"/><stop offset=".42" stop-color="#22292a"/><stop offset=".78" stop-color="#111b20"/><stop offset="1" stop-color="#020d13"/>
    </radialGradient>
    <radialGradient id="${id}-blood" cx=".34" cy=".25" r=".86">
      <stop stop-color="#d52b30"/><stop offset=".23" stop-color="#bd1725"/><stop offset=".56" stop-color="#890c1b"/><stop offset=".8" stop-color="#5b0715"/><stop offset="1" stop-color="#210813"/>
    </radialGradient>
    <radialGradient id="${id}-ember" cx=".57" cy=".83" r=".58">
      <stop stop-color="#ee3e3b" stop-opacity=".45"/><stop offset=".52" stop-color="#c91c28" stop-opacity=".16"/><stop offset="1" stop-color="#b01021" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-surface" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#f9a89a"/><stop offset=".3" stop-color="#d94d50"/><stop offset=".65" stop-color="#a01926"/><stop offset="1" stop-color="#f66c65"/>
    </linearGradient>
    <linearGradient id="${id}-glint" x1="40" y1="37" x2="65" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffdf4" stop-opacity=".88"/><stop offset=".45" stop-color="#e6e9dd" stop-opacity=".42"/><stop offset="1" stop-color="#c8e2e7" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-vignette" cx=".5" cy=".46" r=".53">
      <stop offset=".67" stop-color="#041018" stop-opacity="0"/><stop offset=".88" stop-color="#020c14" stop-opacity=".12"/><stop offset="1" stop-color="#02070c" stop-opacity=".8"/>
    </radialGradient>
    <linearGradient id="${id}-plaque" x1="80" y1="143" x2="80" y2="169" gradientUnits="userSpaceOnUse">
      <stop stop-color="#305146"/><stop offset=".3" stop-color="#16382f"/><stop offset="1" stop-color="#0b2524"/>
    </linearGradient>
    <clipPath id="${id}-sphere"><circle cx="80" cy="80" r="54"/></clipPath>
    <clipPath id="${id}-liquid"><rect class="ss-c-hpfluid-clip" x="26" y="26" width="108" height="108"/></clipPath>
    <g id="${id}-scroll">
      <path d="M37 27c-9-4-17 2-15 9 1 5 7 7 10 3 2-3 0-6-3-5 1 3-2 4-4 1-3-5 4-9 9-6 7 4 4 14-4 18-7 4-13 3-17 0 2 7 10 10 18 6 11-5 16-19 6-26Z" fill="#3e321e" stroke="#0c2523" stroke-width="1.5"/>
      <path d="M37 26c-9-4-17 2-15 9 1 5 7 7 10 3 2-3 0-6-3-5 1 3-2 4-4 1-3-5 4-9 9-6 7 4 4 14-4 18-7 4-13 3-17 0 2 7 10 10 18 6 11-5 16-19 6-26Z" fill="${paint('carve')}" stroke="#d4b878" stroke-width=".55"/>
      <path d="M23 31c2-5 9-6 13-3 9 7 0 20-9 22-4 1-8 0-10-1" stroke="#fff0b5" stroke-opacity=".7" stroke-width=".65" stroke-linecap="round"/>
      <path d="M32 42c6-2 8-9 3-13M30 52c-5 2-10 2-13-1" stroke="#4a3519" stroke-width=".7" stroke-linecap="round"/>
    </g>
    <g id="${id}-leaf">
      <path d="M0 0c-7-3-10-10-6-16 4 2 6 6 4 10 4-4 8-4 11-3C7-4 4-1 0 0Z" fill="${paint('gold')}" stroke="#4f401f" stroke-width=".7"/>
      <path d="M0-2c-3-4-4-8-4-11M0-2l6-5" stroke="#f0d69a" stroke-width=".7"/>
    </g>
  </defs>

  <!-- Cast metal body, jade inset and three separately bevelled lips. -->
  <circle cx="80" cy="83" r="64" fill="#061214" fill-opacity=".66"/>
  <path d="M58 26 80 5l22 21-6 12H64Z" fill="${paint('jade')}" stroke="#503d21" stroke-width="3"/>
  <path d="M62 24 80 9l18 15" stroke="${paint('edge')}" stroke-width="1.1"/>
  <circle cx="80" cy="80" r="63" fill="${paint('gold')}" stroke="#2c251a" stroke-width="1.4"/>
  <circle cx="80" cy="80" r="61.4" stroke="#f6df9e" stroke-opacity=".75" stroke-width=".75"/>
  <circle cx="80" cy="80" r="59.5" fill="${paint('jade')}" stroke="#493c20" stroke-width="1.3"/>
  <circle cx="80" cy="80" r="58.2" stroke="#b7b38a" stroke-opacity=".22" stroke-width=".55"/>
  <path d="M30 58c1 9-8 11-7 23m10 22c-5 1-8-2-9-6m20 25c-2 5 1 8 7 10m59-100c3 7 12 4 16 11m3 58c-6 2-6 9-10 11m-9 18c-6 0-7 6-13 7" stroke="#8bad83" stroke-width=".65" stroke-opacity=".28"/>
  <path d="M27 64l3-4-1-7m2 57 5-1 3 4m79-72-4 1-1-4m17 65-4-1-4 7" stroke="#ced6a2" stroke-width=".4" stroke-opacity=".32"/>
  <circle cx="80" cy="80" r="56.5" fill="#0c171b" stroke="${paint('edge')}" stroke-width="2.4"/>
  <circle cx="80" cy="80" r="54.9" stroke="#080c10" stroke-width="1.4"/>

  <g clip-path="${paint('sphere')}">
    <circle cx="80" cy="80" r="54" fill="${paint('glass')}"/>
    <path d="M35 91c-5-31 8-53 36-59 27-7 47 4 58 27" stroke="#bed9db" stroke-opacity=".06" stroke-width="7"/>
    <g clip-path="${paint('liquid')}">
      <rect class="ss-c-hpfill" x="26" y="26" width="108" height="108" fill="${paint('blood')}"/>
      <circle cx="80" cy="80" r="54" fill="${paint('ember')}"/>
      <path d="M31 97c13 36 54 50 84 22 8-8 12-18 15-29" stroke="#f45953" stroke-opacity=".28" stroke-width="2.3"/>
      <path d="M35 103c14 26 39 34 61 23M117 104c6-14 5-25 2-34" stroke="#ff9890" stroke-opacity=".16" stroke-width=".7" stroke-linecap="round"/>
      <path d="M39 80c8 7 15 10 28 8 20-3 26-11 45-6M40 111c9-10 17-10 31-7 13 3 26 1 37-8" stroke="#ed4549" stroke-opacity=".1" stroke-width="1.1"/>
      <g class="ss-c-hpbubbles" fill="#590918" stroke="#e57572" stroke-opacity=".62" stroke-width=".6">
        <circle class="ss-c-hpbubble" data-depth=".28" cx="43" cy="56.24" r="1.7"/>
        <circle class="ss-c-hpbubble" data-depth=".48" cx="49" cy="77.84" r=".85"/>
        <circle class="ss-c-hpbubble" data-depth=".7" cx="56" cy="101.6" r="1.3"/>
        <circle class="ss-c-hpbubble" data-depth=".37" cx="116" cy="65.96" r="1.05"/>
        <circle class="ss-c-hpbubble" data-depth=".63" cx="109" cy="94.04" r=".7"/>
      </g>
    </g>
    <g class="ss-c-hpsurface" opacity="0">
      <ellipse class="ss-c-hpmeniscus" cx="80" cy="26" rx="0" ry="2.5" fill="${paint('surface')}" fill-opacity=".8" stroke="#f2a29b" stroke-opacity=".65" stroke-width=".45"/>
      <path class="ss-c-hpwave" d="M80 26H80" stroke="#ffc5b7" stroke-width=".8" stroke-linecap="round" stroke-opacity=".8"/>
      <path class="ss-c-hpripple" d="M80 26H80" stroke="#6d071b" stroke-width=".8" stroke-opacity=".75"/>
    </g>
    <circle cx="80" cy="80" r="54" fill="${paint('vignette')}"/>
    <!-- Specular reflections stay fixed while the fluid falls behind the glass. -->
    <path d="M33 64c5-18 20-30 37-32-11 6-20 15-26 27-4 7-8 11-11 5Z" fill="${paint('glint')}"/>
    <path d="M36 58c7-14 17-22 29-25" stroke="#ffffed" stroke-opacity=".72" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M32 71c-2 8-2 16 0 23" stroke="#e7d7d0" stroke-opacity=".23" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M112 38c11 9 17 23 17 36" stroke="#c5dfed" stroke-opacity=".2" stroke-width="1.25" stroke-linecap="round"/>
    <path d="M119 108c-7 11-17 19-29 21" stroke="#efc9b2" stroke-opacity=".32" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="80" cy="80" r="52.8" stroke="#d4d3c0" stroke-opacity=".22" stroke-width=".6"/>
  </g>

  <!-- Restrained scrollwork follows the bezel instead of broad decorative wings. -->
  <use href="#${id}-scroll" transform="translate(22 -8) scale(.82)"/>
  <use href="#${id}-scroll" transform="translate(138 -8) scale(-.82 .82)"/>
  <use href="#${id}-leaf" transform="translate(27 56) rotate(-26) scale(.65)"/>
  <use href="#${id}-leaf" transform="translate(133 56) rotate(26) scale(-.65 .65)"/>
  <use href="#${id}-leaf" transform="translate(37 123) rotate(-74) scale(.7)"/>
  <use href="#${id}-leaf" transform="translate(123 123) rotate(74) scale(-.7 .7)"/>
  <path d="M20 75c-6-4-10 0-9 4 1 3 5 4 6 1-1-2-3-1-2 0-2-1-1-3 1-3 4 0 5 5 1 8-3 2-6 1-8-1 1 5 5 7 10 4l4-8Z" fill="${paint('carve')}" stroke="#594421" stroke-width=".7"/>
  <path d="M140 75c6-4 10 0 9 4-1 3-5 4-6 1 1-2 3-1 2 0 2-1 1-3-1-3-4 0-5 5-1 8 3 2 6 1 8-1-1 5-5 7-10 4l-4-8Z" fill="${paint('carve')}" stroke="#594421" stroke-width=".7"/>
  <circle cx="21" cy="79" r="2.2" fill="${paint('gold')}" stroke="#f1db9b" stroke-width=".4"/>
  <circle cx="139" cy="79" r="2.2" fill="${paint('gold')}" stroke="#f1db9b" stroke-width=".4"/>

  <!-- Sword crest: dark cut line, gold facets, jade pommel. -->
  <path d="m80 2 5 9-3 7v7c4 3 8 2 10-1 2 6-2 8-8 7l-1 12-3 7-3-7-1-12c-6 1-10-1-8-7 2 3 6 4 10 1v-7l-3-7Z" fill="#2d2a1b" stroke="#162821" stroke-width="2" stroke-linejoin="round"/>
  <path d="m80 2 5 9-3 6h-4l-3-6Z" fill="${paint('carve')}" stroke="#e0c78e" stroke-width=".65"/>
  <path d="m80 6 2 5-2 3-2-3Z" fill="#234f43" stroke="#f4dfa7" stroke-width=".55"/>
  <path d="M78 17h4v11h-4Z" fill="${paint('carve')}" stroke="#634b24" stroke-width=".6"/>
  <path d="m78 18 4 2-4 1 4 2-4 1 4 2" stroke="#f4dfaa" stroke-width=".55"/>
  <path d="M68 24c3 4 7 3 12 1 5 2 9 3 12-1 1 6-3 8-9 6l-3 3-3-3c-6 2-10 0-9-6Z" fill="${paint('carve')}" stroke="#dfbf79" stroke-width=".7" stroke-linejoin="round"/>
  <path d="m77.5 30 2.5 1.5 2.5-1.5-1 13-1.5 5-1.5-5Z" fill="${paint('edge')}" stroke="#6e542c" stroke-width=".6"/>
  <path d="M80 32v14" stroke="#fff1c8" stroke-width=".7"/>

  <!-- Wide enough for the real values at a 120px rendered orb width. -->
  <path d="M80 172c-7-6-16-3-21-9h42c-5 6-14 3-21 9Z" fill="${paint('gold')}" stroke="#4f3b1e" stroke-width=".8"/>
  <path d="m80 165 0 5" stroke="#f2daa1" stroke-width=".8"/>
  <path d="M32 143c7 0 8-5 13-5h24l11-5 11 5h24c5 0 6 5 13 5l-4 10 4 9c-7 0-8 6-14 6H46c-6 0-7-6-14-6l4-9Z" fill="${paint('gold')}" stroke="#372d1a" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M43 143h74l7 8-7 12H43l-7-12Z" fill="${paint('plaque')}" stroke="#ebce8a" stroke-width=".85"/>
  <path d="M46 145h68M45 161h70" stroke="#8eae87" stroke-opacity=".3" stroke-width=".45"/>
  <path d="M42 139c-8-1-12 4-10 9 1 4 5 4 7 2-4 0-4-4-1-5 4-2 6 2 4 6-2 3-7 5-6 9 1 4 7 6 12 4-6 0-9-2-8-5 0-2 6-4 7-9 1-5-1-8-5-11Z" fill="${paint('carve')}" stroke="#d6b774" stroke-width=".55"/>
  <path d="M118 139c8-1 12 4 10 9-1 4-5 4-7 2 4 0 4-4 1-5-4-2-6 2-4 6 2 3 7 5 6 9-1 4-7 6-12 4 6 0 9-2 8-5 0-2-6-4-7-9-1-5 1-8 5-11Z" fill="${paint('carve')}" stroke="#d6b774" stroke-width=".55"/>
  <text class="ss-c-hpcaption" x="80" y="148.5" text-anchor="middle" fill="#c9bb8d" font-family="'Songti SC','STSong',serif" font-size="7.5" letter-spacing="2">气血</text>
  <text class="ss-c-hpnum" x="80" y="159.7" text-anchor="middle" fill="#fff1c8" font-family="Georgia,'Times New Roman',serif" font-size="12" font-weight="bold" letter-spacing=".2" textLength="70" lengthAdjust="spacingAndGlyphs">100 / 100</text>
</svg>`;
  }

  function update(root, hp, maxHp) {
    if (!root || typeof root.querySelector !== 'function') return null;
    const svg = root.matches && root.matches('.ss-c-health-orb') ? root : root.querySelector('.ss-c-health-orb');
    if (!svg) return null;
    const max = Math.max(0, finite(maxHp, 0));
    const current = Math.min(max, Math.max(0, finite(hp, 0)));
    const ratio = max > 0 ? current / max : 0;
    // SVG y is measured from the top: 0 HP is genuinely empty, 100% fills it.
    const height = 2 * R * ratio;
    const y = BOTTOM - height;
    svg.setAttribute('data-hp-ratio', String(rounded(ratio)));
    for (const selector of ['.ss-c-hpfill', '.ss-c-hpfluid-clip']) {
      const rect = svg.querySelector(selector);
      if (rect) {
        rect.setAttribute('y', String(rounded(y)));
        rect.setAttribute('height', String(rounded(height)));
      }
    }
    const halfWidth = Math.sqrt(Math.max(0, R * R - (y - C) * (y - C)));
    const depth = Math.min(2.5, halfWidth * .08, height * .25);
    const surface = svg.querySelector('.ss-c-hpsurface');
    if (surface) surface.setAttribute('opacity', ratio > 0 && ratio < 1 ? '1' : '0');
    const meniscus = svg.querySelector('.ss-c-hpmeniscus');
    if (meniscus) {
      meniscus.setAttribute('cy', String(rounded(y)));
      meniscus.setAttribute('rx', String(rounded(halfWidth)));
      meniscus.setAttribute('ry', String(rounded(depth)));
    }
    const wave = svg.querySelector('.ss-c-hpwave');
    if (wave) wave.setAttribute('d', `M${rounded(C - halfWidth * .95)} ${rounded(y)} C${rounded(C - halfWidth * .5)} ${rounded(y - depth * 1.15)} ${rounded(C + halfWidth * .15)} ${rounded(y + depth * 1.65)} ${rounded(C + halfWidth * .9)} ${rounded(y - depth * .35)}`);
    const ripple = svg.querySelector('.ss-c-hpripple');
    if (ripple) ripple.setAttribute('d', `M${rounded(C - halfWidth * .8)} ${rounded(y + depth * .7)} Q80 ${rounded(y + depth * 2)} ${rounded(C + halfWidth * .8)} ${rounded(y + depth * .5)}`);
    for (const bubble of svg.querySelectorAll('.ss-c-hpbubble')) {
      const bubbleY = y + height * finite(bubble.getAttribute('data-depth'), .5);
      bubble.setAttribute('cy', String(rounded(bubbleY)));
    }
    const label = svg.querySelector('.ss-c-hpnum');
    if (label) {
      const text = `${Math.ceil(current)} / ${Math.ceil(max)}`;
      label.textContent = text;
      label.setAttribute('font-size', text.length > 13 ? '9' : text.length > 11 ? '10' : '12');
    }
    return ratio;
  }

  window.HealthOrb = Object.freeze({ markup, update });
})();
