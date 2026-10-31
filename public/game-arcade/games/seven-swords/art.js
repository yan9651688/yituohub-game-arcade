/* Seven Swords · original vector illustrations, drawn for this fan game. */
(function () {
  'use strict';
  let serial = 0;
  const INK = '#35453f';
  const palettes = {
    hongmao: {fur:'#ee9652',light:'#ffe0a4',cloth:'#fcf7e9',shade:'#d8e5df',accent:'#b7523d',belt:'#6799a0',sword:'#e36645'},
    lantu:   {fur:'#95cbdc',light:'#e2f5f3',cloth:'#dfb4d6',shade:'#a680b1',accent:'#7086b1',belt:'#8e67a0',sword:'#72d7e2'},
    sali:    {fur:'#bc8bad',light:'#e7c6d4',cloth:'#bc80bb',shade:'#7f598d',accent:'#cf749c',belt:'#693f82',sword:'#bd89e0'},
    doudou:  {fur:'#b88b61',light:'#ead1a5',cloth:'#a8b894',shade:'#648a77',accent:'#aa7939',belt:'#345e58',sword:'#8fc493'},
    daben:   {fur:'#f4e9d6',light:'#fffaf0',cloth:'#719ea8',shade:'#416e7f',accent:'#b67c44',belt:'#a66352',sword:'#e1bc65'},
    tiaotiao:{fur:'#a28b5c',light:'#e2d5aa',cloth:'#8db69b',shade:'#436e63',accent:'#5c846c',belt:'#385a50',sword:'#8ad2a4'},
    dada:    {fur:'#fff9e9',light:'#ffffff',cloth:'#f3f4e8',shade:'#ccdcd8',accent:'#60878a',belt:'#6b9eaa',sword:'#b8dec2'}
  };
  function attr(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function sword(p, x, y, angle, length=109, broad=false) {
    return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M${broad?-8:-4} -16 L${broad?-8:-4} -${length-12} 0 -${length} ${broad?8:4} -${length-12} ${broad?8:4} -16Z" fill="url(#${p}blade)" stroke="${INK}" stroke-width="1.7"/><path d="M0 -22V-${length-9}" stroke="#fffef4" stroke-width="1.2" opacity=".92"/><path d="M-14 -18Q-7 -25 0 -22Q7 -25 14 -18L11 -13Q0 -18 -11 -13Z" fill="url(#${p}gold)"/><path d="M-4 -14H4V8H-4Z" fill="#695242"/><path d="M-4 -10L4 -6M-4 -3L4 1M-4 4L4 8" stroke="#e8c89a" stroke-width="1.4"/><circle cy="10" r="4.5" fill="url(#${p}gold)"/></g>`;
  }
  function eye(x,y,side=1,kind='bold',color='#674d36') {
    const soft = kind === 'soft';
    return `<g transform="translate(${x} ${y}) scale(${side} 1)"><path d="M-13 -3Q-3 ${soft?-11:-8} 10 -6Q14 -1 11 6Q0 13 -11 6Z" fill="#fffef4" stroke="${INK}" stroke-width="1.65"/><ellipse cx="0" cy="1" rx="${soft?5.7:5}" ry="8" fill="${color}" stroke="none"/><ellipse cx="1" cy="2" rx="2.9" ry="6.5" fill="#24382e" stroke="none"/><circle cx="-1.6" cy="-2.5" r="2.1" fill="#fff" stroke="none"/><path d="M-14 -4Q-4 -10 10 -6" fill="none" stroke-width="2.4"/>${soft?'<path d="M10 -6L14 -10M12 -3L16 -6" fill="none" stroke-width="1.6"/>':''}</g>`;
  }
  function heroSVG(id, options={}) {
    id = palettes[id] ? id : 'hongmao';
    const c=palettes[id], p=`qsHero${++serial}_`;
    let h='';
    if (id==='hongmao') h = `
      <path d="M88 187C48 178 52 146 25 155C8 161 20 185 38 185C16 185 12 164 26 158C46 150 40 192 86 201" fill="${c.fur}" stroke-width="2.5"/>
      <path d="M91 190L86 226 79 253Q94 258 105 251L114 211 125 211 139 252Q153 257 166 250L151 226 146 188" fill="#ececde"/>
      <path d="M88 231L82 245M87 238L100 241M142 234L156 232M145 242L161 239" fill="none" stroke="#9caaa0" stroke-width="1.8"/>
      <path d="M84 246Q68 255 72 260Q89 264 106 256L104 245ZM143 246L144 256Q161 263 176 259Q176 253 160 246Z" fill="#ac8050"/><path d="M76 258L104 253M149 253L171 258" fill="none" stroke="#e6c897"/>
      <path d="M91 116Q76 116 68 139L48 153 58 171 88 156 84 194Q97 204 121 199Q146 205 163 193L150 148 171 168 185 155 164 128 146 117Z" fill="url(#${p}cloth)"/>
      <path d="M85 153L90 128M67 140L80 144M147 151L141 132M162 138L160 148M90 190L101 166M150 190L139 166" fill="none" stroke="#a1b2a9" stroke-width="1.6"/>
      <path d="M100 118L119 145 139 118 127 115 119 130 109 115Z" fill="#83adb2"/><path d="M106 119L120 138 132 121M117 142L110 165" fill="none" stroke="#547880"/>
      <path d="M86 159Q119 166 150 157L153 170Q119 179 88 172Z" fill="#74a3ad"/><path d="M144 164Q158 169 176 171L206 159Q194 181 162 182L148 171Q163 181 182 206L162 198 150 178Z" fill="#83b1b6"/><path d="M93 166Q117 171 143 164" fill="none" stroke="#c0dedc"/>
      <path d="M45 154Q38 152 34 160L43 169Q49 174 57 167L56 157ZM172 155Q182 144 189 153L186 165Q180 174 172 166Z" fill="url(#${p}fur)"/>
      ${sword(p,181,156,21,123)}
      <path d="M174 155Q178 150 184 155L184 162Q180 166 175 162" fill="${c.fur}"/>
      <path d="M90 73L73 41 99 48Q118 36 139 48L164 39 153 77Q163 96 151 113Q140 130 117 131Q91 131 79 111Q73 94 90 73Z" fill="url(#${p}fur)"/>
      <path d="M82 51L91 72 97 56ZM143 56L153 49 149 71Z" fill="#db927b" stroke="none"/>
      <path d="M96 58L106 49 111 60 122 48 124 62 136 51 135 68" fill="#eea45e" stroke="#c17b3f" stroke-width="1.4"/>
      <path d="M87 90Q99 87 118 106Q137 88 151 89L155 105 146 116 128 126 110 126 87 115 80 105Z" fill="#fff4d8" stroke="none"/>
      ${eye(101,88,1,'bold','#936537')}${eye(137,88,-1,'bold','#936537')}
      <path d="M89 73L108 77M147 73L130 77" fill="none" stroke-width="2.6"/><path d="M112 104Q119 100 126 104L119 111Z" fill="#745040"/><path d="M119 111V115M106 117Q119 123 132 115" fill="none" stroke-width="1.6"/>
      <path d="M88 102L75 99M88 109L73 110M147 102L161 99M147 108L161 111" stroke="#765c48" stroke-width="1.1" fill="none"/>
      <path d="M108 46L108 37 117 44 125 34 130 48" fill="#ed9851"/>
    `;
    if (id==='lantu') h=`
      <path d="M91 130Q56 150 53 192Q33 199 24 218Q62 211 69 193L106 150M146 128Q160 159 187 166Q214 171 220 185Q214 149 184 146L160 119" fill="#b4d9df" stroke="#729fba" stroke-width="1.6"/>
      <path d="M92 191L91 238 82 253Q96 259 110 251L119 208 132 244 146 251 158 243 146 194Z" fill="#f4d3e6"/><path d="M84 249Q75 254 74 259Q94 265 111 255L108 246ZM141 243L147 255Q161 261 173 255L158 244Z" fill="#9580b2"/><path d="M78 258L107 252M151 253L165 255" fill="none" stroke="#d6b8d9"/>

      <path d="M98 118Q80 119 74 141L54 155 65 173 88 158 96 174Q84 199 78 220Q113 229 125 211Q141 223 166 209L144 173 150 153 171 163 180 146 151 125 140 119Z" fill="url(#${p}cloth)"/>
      <path d="M105 120L120 139 136 120 127 116 120 127 114 116Z" fill="#fff6e9"/><path d="M120 139L107 164M88 146L80 142M151 145L165 155" fill="none" stroke="#95779c" stroke-width="1.5"/>
      <path d="M96 166Q120 171 145 163L147 177Q121 184 95 177Z" fill="#9072aa"/><path d="M128 171Q124 190 132 206L142 211 139 198 139 173" fill="#8164a3"/>
      <path d="M112 185Q105 204 88 213M131 183Q141 202 157 206" fill="none" stroke="#eccbe1" stroke-width="2.4"/>
      <path d="M48 153Q42 151 40 161Q41 169 50 171L60 166 56 155ZM169 145Q176 137 182 144L185 156 178 163 170 157Z" fill="${c.light}"/>
      ${sword(p,49,157,-21,122)}
      <path d="M45 157Q49 151 54 157L54 163Q50 166 46 163" fill="#c4e8ed"/>
      
      <path d="M91 76Q72 42 77 18Q79 8 86 16Q102 38 106 75M126 73Q126 44 139 15Q146 3 152 13Q156 35 142 76" fill="url(#${p}fur)"/><path d="M88 61Q80 38 82 23Q91 37 96 63M135 59Q136 36 146 18Q147 39 139 63" fill="#d7b4cd" stroke="none"/>
      
      <path d="M89 68Q116 53 143 69Q161 81 155 104Q151 128 122 133Q94 133 82 113Q72 94 89 68Z" fill="url(#${p}fur)"/>
      <path d="M89 103Q103 99 120 111Q135 100 151 103Q151 123 123 129Q100 129 89 113Z" fill="#f7fbf0" stroke="none"/>
      
      <path d="M86 71L74 64 67 75 78 85 87 78 95 75 93 67Z" fill="#d1a6d4"/><circle cx="85" cy="74" r="4" fill="#e5ca85"/><path d="M78 84L71 98 83 91M87 82L90 93 93 81" fill="#cb9dce"/>
      ${eye(102,93,1,'soft','#745b98')}${eye(139,92,-1,'soft','#745b98')}
      <path d="M93 78Q102 75 111 80M129 79Q138 73 147 77" fill="none" stroke="#688c9e" stroke-width="1.8"/>
      <path d="M116 107Q120 104 124 107L120 111Z" fill="#ac7b89" stroke="none"/><path d="M120 111V114M111 117Q120 122 130 116" fill="none" stroke="#7a6776" stroke-width="1.3"/>
      <path d="M119 70L115 76 120 81 124 75Z" fill="#a6e6e3" stroke="#5b99ab" stroke-width="1"/><circle cx="89" cy="109" r="4" fill="#dba6b3" opacity=".45" stroke="none"/><circle cx="149" cy="109" r="4" fill="#dba6b3" opacity=".45" stroke="none"/>
    `;
    if(id==='sali') h=`
      <path d="M146 203Q194 214 211 185Q234 150 212 114Q200 93 181 109Q162 125 175 143Q181 154 192 151Q184 139 190 132Q202 123 206 141Q218 178 172 178L139 180Z" fill="url(#${p}fur)"/><path d="M173 197Q209 194 216 163Q220 130 202 119" fill="none" stroke="#e2b9cc" stroke-width="8"/><path d="M195 177Q211 163 203 146" fill="none" stroke="#9d6e98" stroke-width="2"/>
      <path d="M95 195L89 236 81 252 99 255 112 228 121 207 134 228 143 251 160 247 151 222 148 189" fill="#b589b2"/><path d="M84 247L75 256Q88 265 105 256L105 247ZM142 244L141 256Q154 261 172 254Q170 249 156 242Z" fill="#6e536f"/><path d="M82 257L99 253M146 252L166 253" fill="none" stroke="#c5a4b3"/>
      <path d="M98 120Q78 119 74 142L60 162 76 177 91 157 94 174 79 212Q105 223 122 210Q137 219 159 207L148 172 153 153 169 164 185 154 161 130 142 120Z" fill="url(#${p}cloth)"/>
      <path d="M108 121L120 140 132 121 124 116 119 127 115 117Z" fill="#f6d6e5"/><path d="M120 141L110 165M94 144L88 162M152 141L165 151M98 184L88 211M139 184L152 208" fill="none" stroke="#794e85" stroke-width="1.6"/>
      <path d="M95 165Q120 171 147 163L149 176Q123 183 93 177Z" fill="#70457f"/><path d="M114 172L105 208 114 203 120 213 126 175" fill="#e2b3d1"/><path d="M116 180L111 197" fill="none" stroke="#b878af"/>
      
      <path d="M66 159Q62 168 70 175L95 179 101 170 85 163Z" fill="#efe9d6"/><path d="M73 163L73 173M80 165L79 175M87 168L86 177M95 170L94 179" fill="none" stroke="#b6a89c" stroke-width="1.2"/><path d="M96 169Q108 166 111 172L106 180 96 178Z" fill="${c.light}"/>
      ${sword(p,179,155,20,122)}<path d="M171 151Q178 146 184 153L185 160 177 166 170 159Z" fill="${c.light}"/>

      <path d="M91 71L79 49Q78 40 86 43L102 55Q124 47 140 58L154 45Q162 40 163 49L157 82Q163 101 151 117Q137 135 116 132Q91 131 81 110Q75 93 91 71Z" fill="url(#${p}fur)"/>
      
      <path d="M85 50L94 60 92 69M153 52L148 68 156 67" fill="#d9a9ba" stroke="#966c93" stroke-width="1"/>
      <path d="M101 57Q117 39 135 51L130 61 145 62 131 70Q120 66 113 61L107 71 100 67Z" fill="#b078a5"/><path d="M139 63L144 53 154 59 151 71Z" fill="#8c4f91"/><circle cx="145" cy="64" r="3" fill="#e2c982"/>
      <path d="M87 99Q99 99 116 111Q134 100 153 102Q153 123 129 129Q104 133 91 116Z" fill="#f6dfd8" stroke="none"/>
      ${eye(102,91,1,'soft','#8a5c87')}${eye(140,92,-1,'soft','#8a5c87')}
      <path d="M92 77L110 80M129 79L147 76" fill="none" stroke="#76536d" stroke-width="2"/>
      <path d="M114 106Q119 103 125 107L119 113Z" fill="#8b566d" stroke-width="1"/><path d="M119 113V116M110 119Q121 123 131 117" fill="none" stroke-width="1.3"/><path d="M117 119L118 124H123L124 119" fill="#fffbed" stroke-width=".8"/>
    `;
    if(id==='doudou') h=`
      <g transform="translate(150 161) rotate(23)"><path d="M-5 0V-112L0 -121 5 -112V0Z" fill="#769f92"/><path d="M-11 -93H11V-85H-11Z" fill="#bfa265"/><path d="M-4 -96V-114H4V-96" fill="#5b6854"/></g>
      <path d="M87 204L86 237 77 249 104 253 116 220 130 246 155 248 147 204Z" fill="#596f62"/><path d="M81 244Q68 249 70 257Q90 263 108 255L105 244ZM131 243L131 255Q146 262 166 255Q168 249 152 243Z" fill="#47584b"/><path d="M75 255L104 252M136 253L162 254" fill="none" stroke="#e1d6af" stroke-width="2"/>
      <path d="M90 126Q65 130 64 157L51 186 74 196 82 183 79 218Q117 237 161 213L153 180 168 188 182 174 165 143 145 128Z" fill="url(#${p}cloth)"/>
      <path d="M101 125L118 149 135 128 125 124 118 137 110 123Z" fill="#e5dfbd"/><path d="M119 148L105 179 112 210M90 148L82 174M153 151L162 170" fill="none" stroke="#547464" stroke-width="1.7"/>
      <path d="M82 176Q122 189 155 175L158 190Q118 202 81 188Z" fill="#426d60"/><path d="M112 181L111 213 126 211 126 187" fill="#3c625a"/>
      <path d="M89 140Q128 158 155 203" fill="none" stroke="#9c784a" stroke-width="7"/><path d="M89 140Q128 158 155 203" fill="none" stroke="#cfb47d" stroke-width="2"/>
      <path d="M146 192L172 189 178 217Q165 227 147 220Z" fill="#b79761"/><path d="M145 193Q161 203 174 192L172 207 148 210Z" fill="#ceb682"/><circle cx="160" cy="208" r="2" fill="#6b6547"/>
      <path d="M51 180Q42 178 40 186Q41 195 53 199L65 193 65 183ZM168 172Q177 165 184 174L185 184Q178 192 171 187Z" fill="url(#${p}fur)"/>
      <g transform="translate(46 184) rotate(-12)"><path d="M-6 -2Q-14 -10 -8 -17Q-4 -23 1 -17Q7 -12 3 -4Q14 1 12 13Q10 25 -4 23Q-20 19 -15 7Z" fill="#d0a45b"/><path d="M-5 -2L3 -4M-6 -15L2 -16" fill="none" stroke="#7d6749"/><path d="M-3 -19L-4 -26 2 -27 3 -19Z" fill="#695c3d"/><path d="M-8 5Q-13 12 -7 17" fill="none" stroke="#ead7a3" stroke-width="2.5"/></g>
      <g transform="translate(179 170)"><path d="M0 6Q-9 -10 -4 -25M-2 -6Q11 -15 9 -28" fill="none" stroke="#5a7858" stroke-width="2"/><path d="M-4 -14Q-20 -28 -18 -11Q-10 -5 -4 -14M-5 -23Q-13 -38 -1 -35Q4 -29 -5 -23M5 -17Q17 -34 20 -20Q17 -13 5 -17M8 -24Q4 -39 14 -37Q18 -31 8 -24" fill="#759f69" stroke-width="1"/></g>
      
      <path d="M89 83Q73 70 65 85Q55 104 68 123L84 116M143 84Q158 71 167 87Q178 111 163 125L150 115" fill="#8d684a"/><path d="M74 91Q67 107 73 116M158 91Q167 109 160 118" fill="none" stroke="#b58a60" stroke-width="3"/>
      
      <path d="M88 77Q113 60 142 78Q160 94 155 113Q149 139 120 145Q91 141 79 121Q72 100 88 77Z" fill="url(#${p}fur)"/>
      <path d="M81 114Q91 102 110 110Q133 103 153 116Q153 139 122 141Q95 141 83 126Z" fill="#e8d2a8"/>

      <path d="M84 81L86 65Q91 51 113 50Q136 47 147 63L152 83Q120 70 84 81Z" fill="#426d61"/><path d="M81 79Q117 69 153 79L155 87Q118 78 80 88Z" fill="#527d6b"/><path d="M97 59Q111 54 135 58" fill="none" stroke="#83a48c" stroke-width="2"/><ellipse cx="118" cy="72" rx="9" ry="11" fill="#ddc784"/><path d="M118 62Q109 67 118 72Q127 77 118 82Q128 80 127 72Q127 65 118 62Z" fill="#60755b" stroke="none"/><circle cx="118" cy="67" r="1.7" fill="#60755b" stroke="none"/><circle cx="118" cy="77" r="1.7" fill="#ead495" stroke="none"/>
      <ellipse cx="99" cy="103" rx="9" ry="12" fill="#fff7e2"/><ellipse cx="140" cy="103" rx="9" ry="12" fill="#fff7e2"/><ellipse cx="102" cy="104" rx="4" ry="8" fill="#3d4e38" stroke="none"/><ellipse cx="137" cy="104" rx="4" ry="8" fill="#3d4e38" stroke="none"/><circle cx="100" cy="100" r="2" fill="#fff" stroke="none"/><circle cx="135" cy="100" r="2" fill="#fff" stroke="none"/>
      <path d="M90 89Q97 85 106 88M131 88Q140 83 148 89" fill="none" stroke-width="2.8"/><path d="M108 115Q119 109 130 115Q131 122 120 126Q109 122 108 115Z" fill="#705238"/><path d="M120 126L119 129M106 131Q119 138 132 130" fill="none" stroke-width="1.5"/><path d="M90 124L96 125M140 124L146 123" fill="none" stroke="#a27b50"/>
    `;
    if(id==='daben') h=`
      <path d="M78 187L70 222 65 249 94 254 108 226 117 209 129 228 139 252 170 249 159 218 153 188" fill="#577f8d"/>
      <path d="M73 230L95 235M70 239L91 244M139 235L163 231M142 244L167 240" fill="none" stroke="#d0ccb0" stroke-width="4"/>
      
      <path d="M66 245Q49 252 51 261Q70 268 96 259L96 247ZM139 247L141 260Q164 266 185 258Q182 251 169 246Z" fill="#977846"/><path d="M56 259L91 256M147 257L179 257" fill="none" stroke="#d3b780" stroke-width="2"/>
      <path d="M85 111Q63 108 53 133Q46 151 43 173L61 184 81 155 85 190 153 190 156 151 175 174 196 164Q190 125 158 113Z" fill="url(#${p}fur)"/>
      
      <path d="M87 111L78 135 76 183 65 204Q90 218 114 203Q139 217 164 199L156 175 160 132 146 111 131 116 117 155 102 117Z" fill="url(#${p}cloth)"/>
      <path d="M90 114L83 138 96 145 90 170M143 114L153 137 139 145 145 167" fill="none" stroke="#afd1cc" stroke-width="3"/>
      <path d="M79 174Q119 190 155 173L159 192Q115 208 76 192Z" fill="#b2735c"/><path d="M94 180L97 200M141 180L138 201" fill="none" stroke="#d7a079" stroke-width="2"/><path d="M111 180H130V201H111Z" fill="#ceb779"/><path d="M116 185H125V196H116Z" fill="#8b684d" stroke="none"/>
      <path d="M48 162L39 181Q41 196 58 196L72 179 64 170Z" fill="#f0e5ce"/><path d="M44 181L56 187M49 177L61 181" fill="none" stroke="#b7aa92" stroke-width="1.2"/>
      <g transform="translate(53 205) rotate(20)"><path d="M-4 -28H6V-17Q18 -11 16 2Q14 18 0 18Q-20 15 -17 0Q-15 -12 -4 -17Z" fill="#b88849"/><path d="M-7 -17L9 -17M-12 -4Q2 3 13 -4" fill="none" stroke="#664e35" stroke-width="2"/><path d="M-8 -2Q-13 7 -6 12" fill="none" stroke="#dbb56b" stroke-width="3"/><path d="M-5 -28H7V-23H-5Z" fill="#5e6e4b"/></g>
      ${sword(p,183,160,20,138,true)}
      <path d="M174 151Q181 145 190 152L195 165Q190 177 177 173L170 164Z" fill="#eee5d2"/><path d="M180 151L185 159M176 156L182 164" fill="none" stroke="#b7aa92" stroke-width="1.2"/>
      
      <circle cx="80" cy="67" r="16" fill="#e7dac2"/><circle cx="154" cy="65" r="16" fill="#e7dac2"/><circle cx="80" cy="68" r="9" fill="#b59779" stroke="none"/><circle cx="154" cy="66" r="9" fill="#b59779" stroke="none"/>
      
      <path d="M80 65Q102 43 135 51L145 58Q166 70 166 91Q171 112 150 129Q116 149 80 124Q63 105 70 85Z" fill="url(#${p}fur)"/>
      
      <path d="M95 57L101 45 113 51 124 42 133 55" fill="#f6ead2"/>
      <path d="M85 89L103 92 107 83 92 80ZM133 82L130 91 153 86 147 77Z" fill="#76674c" stroke="none"/>
      <path d="M89 97Q96 93 105 97M132 96Q141 90 151 95" fill="none" stroke-width="2.7"/>
      <path d="M91 105Q105 95 121 100Q141 96 152 109Q153 128 122 134Q96 133 87 118Z" fill="#d6c29e" stroke="#b5a181" stroke-width="1.1"/>
      <path d="M109 104Q121 99 133 104L133 110Q121 119 109 109Z" fill="#584e37"/><path d="M121 113V119" fill="none"/><path d="M98 120Q122 134 144 117Q133 138 116 133Z" fill="#866345"/><path d="M102 122Q121 129 139 120L136 126Q118 134 108 127Z" fill="#fff8e3" stroke="none"/>
    `;
    if(id==='tiaotiao') h=`
      <path d="M101 187Q69 210 48 196Q32 185 36 164Q40 147 27 145Q12 143 15 160Q18 171 26 167" fill="none" stroke="#61794f" stroke-width="12"/><path d="M101 187Q69 210 48 196Q32 185 36 164Q40 147 27 145Q12 143 15 160" fill="none" stroke="#a2ad76" stroke-width="7"/>
      <path d="M101 190L91 215 74 230 82 247 108 235 128 210 143 236 164 239 173 228 151 219 143 184Z" fill="#455d4e"/>
      <path d="M77 231L67 238 70 248Q86 252 100 238L93 227ZM160 226L154 241Q170 247 184 238Q181 231 170 225Z" fill="#675e3e"/><path d="M74 244L94 235M162 239L179 237" fill="none" stroke="#b4b889" stroke-width="2"/>
      <path d="M110 117Q92 115 80 132L60 147 68 163 99 147 98 174 81 203 104 208 124 190 145 202 165 192 144 164 151 144 176 135 173 118 150 124 140 115Z" fill="url(#${p}cloth)"/>
      <path d="M112 119L124 138 139 119 133 114 125 128 118 113Z" fill="#e7e7ca"/><path d="M124 138L112 165M95 139L79 154M139 165L132 149M102 179L90 201M141 179L155 193" fill="none" stroke="#4e7962" stroke-width="1.7"/>
      <path d="M99 162L144 157 148 171 98 178Z" fill="#38584b"/><path d="M118 162L127 178 139 180 129 169 144 164 150 153 134 157Z" fill="#b7c991"/>
      
      <path d="M63 148Q55 147 48 155L54 168Q66 168 70 158Z" fill="${c.light}"/>
      <g transform="translate(180 130) rotate(35)">${sword(p,0,0,0,96)}<path d="M-7 -4Q0 -11 7 -3L6 6Q-2 10 -7 4Z" fill="${c.light}"/></g>
      <path d="M174 118L186 120 184 139 173 137Z" fill="#496b58"/><path d="M176 121L185 124M175 127L185 130" fill="none" stroke="#bac397" stroke-width="1.4"/>
      <circle cx="86" cy="82" r="15" fill="#9d8b61"/><circle cx="155" cy="80" r="15" fill="#9d8b61"/><circle cx="86" cy="83" r="8" fill="#d8be91" stroke-width="1"/><circle cx="155" cy="81" r="8" fill="#d8be91" stroke-width="1"/>
      
      <path d="M89 70Q92 49 116 49Q139 46 151 66L151 101Q142 127 122 134Q101 127 88 109Z" fill="url(#${p}fur)"/>
      <path d="M100 72Q115 69 122 82Q132 68 145 75L149 104Q144 123 123 129Q103 124 91 107L94 85Z" fill="#e2d7b1" stroke="none"/>
      
      <path d="M88 76Q80 53 90 48Q84 35 101 43Q119 25 138 42Q153 43 157 60L150 78 141 62Q136 65 128 64L122 73 114 63 99 70Z" fill="#657347"/><path d="M96 51Q114 41 133 46M103 60Q121 49 146 59" fill="none" stroke="#98a566" stroke-width="1.6"/>
      ${eye(105,91,1,'bold','#5c966e')}${eye(138,90,-1,'bold','#5c966e')}
      
      <path d="M94 77L113 81M130 80L146 75" fill="none" stroke="#536342" stroke-width="2.4"/><path d="M116 107Q120 104 125 107L121 111Z" fill="#a08057" stroke-width=".8"/><path d="M111 117Q124 123 138 111" fill="none" stroke-width="1.5"/><path d="M137 110L140 114" fill="none" stroke-width="1.1"/>

      <path d="M146 60L169 49 165 61 173 66 151 73Z" fill="#71a389"/>
      <path d="M158 61L177 74 170 74 184 84Q164 80 151 68" fill="#8db699"/>
    `;
    if(id==='dada') h=`
      
      <path d="M88 70Q61 58 46 71L51 84Q65 70 85 84M86 82Q63 90 54 112L67 109 69 118 91 90" fill="#92bbc1" stroke="#638e9b" stroke-width="1.3"/>
      <g transform="translate(161 192) rotate(10)"><path d="M-5 -92H5V54L0 62 -5 54Z" fill="#9aa998"/><path d="M-3 -78L3 -72M-3 -65L3 -59" fill="none" stroke="#e2e6ce"/><path d="M-10 -90H10V-84H-10Z" fill="#beb483"/><path d="M-3 -112H3V-92H-3Z" fill="#3e6155"/></g>
      
      <path d="M101 229L90 249 101 258 119 244 137 256 157 253 144 228" fill="#38504a"/><path d="M93 247Q79 252 81 259Q99 265 117 257L115 246ZM131 248L133 257Q154 266 171 257Q168 251 151 247Z" fill="#38504a"/><path d="M88 259L113 254M139 255L165 258" fill="none" stroke="#c1d4c6" stroke-width="1.8"/>
      <path d="M96 120Q75 125 69 145L53 182 75 196 94 166 99 181 83 244Q103 253 124 242Q146 252 168 239L145 180 148 160 171 181 190 167 162 133 141 120Z" fill="url(#${p}cloth)"/>
      <path d="M101 123L120 150 139 124 130 119 121 134 111 119Z" fill="#8caeb1"/><path d="M105 128L118 148 109 177" fill="none" stroke="#55787b" stroke-width="1.5"/>
      <path d="M96 171Q119 179 145 170L148 183Q122 192 97 184Z" fill="#739ea6"/><path d="M122 180L130 218 139 228 140 211 133 181" fill="#86aeb6"/><path d="M115 194L99 241M137 194L157 240M92 144L81 171M156 145L179 170" fill="none" stroke="#aec3b9" stroke-width="1.6"/>
      
      <path d="M66 178Q71 170 80 178L84 190 76 196 60 190Z" fill="#3e5049"/><path d="M174 161Q179 153 187 162L193 171 184 180 174 174Z" fill="#3e5049"/>
      <g transform="translate(77 183) rotate(-9)"><rect x="-9" y="-4" width="105" height="8" rx="4" fill="#a8a879"/><path d="M7 -4V4M30 -4V4M55 -4V4M79 -4V4" fill="none" stroke="#687c57" stroke-width="1.3"/><circle cx="14" r="1.5" fill="#455943" stroke="none"/><circle cx="23" r="1.5" fill="#455943" stroke="none"/><circle cx="39" r="1.5" fill="#455943" stroke="none"/><circle cx="48" r="1.5" fill="#455943" stroke="none"/><circle cx="64" r="1.5" fill="#455943" stroke="none"/><path d="M88 4V16L83 26M88 16L92 28" fill="none" stroke="#829ba0" stroke-width="2"/></g>
      <circle cx="86" cy="61" r="17" fill="#3a4b43"/><circle cx="150" cy="60" r="17" fill="#3a4b43"/><circle cx="86" cy="61" r="9" fill="#59645a" stroke="none"/><circle cx="150" cy="60" r="9" fill="#59645a" stroke="none"/>
      
      <path d="M86 72Q96 50 119 54Q148 51 158 78Q170 104 150 124Q121 145 92 127Q71 115 76 92Z" fill="url(#${p}fur)"/>
      <path d="M84 72Q118 61 153 72L158 82Q122 73 80 83Z" fill="#85b0b7"/><path d="M88 75Q119 68 151 76" fill="none" stroke="#d3e5dc" stroke-width="1.5"/>
      <ellipse cx="99" cy="101" rx="13" ry="19" transform="rotate(21 99 101)" fill="#46554c" stroke="none"/><ellipse cx="143" cy="100" rx="13" ry="19" transform="rotate(-21 143 100)" fill="#46554c" stroke="none"/>
      <path d="M92 100Q100 95 109 99Q108 109 99 111Q93 109 92 100ZM132 99Q141 93 149 99Q149 108 142 110Q133 109 132 99Z" fill="#f7f5de" stroke-width="1.2"/><ellipse cx="101" cy="103" rx="3.7" ry="6" fill="#45604c" stroke="none"/><ellipse cx="140" cy="102" rx="3.7" ry="6" fill="#45604c" stroke="none"/><circle cx="100" cy="100" r="1.5" fill="#fff" stroke="none"/><circle cx="139" cy="99" r="1.5" fill="#fff" stroke="none"/>
      <path d="M114 113Q120 109 126 112L121 119Z" fill="#415348"/><path d="M121 118V121M111 123Q122 129 133 121" fill="none" stroke-width="1.3"/>
      <path d="M109 61L111 51 120 58 126 48 132 64" fill="#fcf5df" stroke-width="1.5"/>
    `;
    const pose=options.portrait?(id==='lantu'?'translate(-54 -2) scale(1.45)':'translate(-78 -49) scale(1.65)'):'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" class="${attr(options.className)}" role="img" aria-label="${{hongmao:'虹猫',lantu:'蓝兔',sali:'莎丽',doudou:'逗逗',daben:'大奔',tiaotiao:'跳跳',dada:'达达'}[id]}矢量肖像"><defs><linearGradient id="${p}fur" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${c.light}"/><stop offset=".45" stop-color="${c.fur}"/><stop offset="1" stop-color="${c.fur}"/></linearGradient><linearGradient id="${p}cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.cloth}"/><stop offset=".52" stop-color="${c.cloth}"/><stop offset="1" stop-color="${c.shade}"/></linearGradient><linearGradient id="${p}blade"><stop stop-color="${c.sword}"/><stop offset=".48" stop-color="#fffceb"/><stop offset=".52" stop-color="${c.sword}"/><stop offset="1" stop-color="${c.sword}"/></linearGradient><linearGradient id="${p}gold" x2="0" y2="1"><stop stop-color="#e6d69b"/><stop offset="1" stop-color="#ae8851"/></linearGradient></defs><g transform="${pose}" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="120" cy="262" rx="58" ry="7" fill="#496c54" opacity=".12" stroke="none"/>${h}</g></svg>`;
  }

  function drawHero(ctx,id,x,y,size=52,dir=0,t=0) {
    const c=palettes[id]||palettes.hongmao;
    const angle=typeof dir==='number'?dir:Math.atan2(dir&&dir.y||0,dir&&dir.x||1);
    const face=Math.cos(angle)<-.15?-1:1;
    const bob=Math.sin(t*5)*.5;
    const p=(d,fill,stroke=INK,lw=1.1)=>{const path=new Path2D(d);if(fill){ctx.fillStyle=fill;ctx.fill(path);}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke(path);}};
    const ellipse=(xx,yy,rx,ry,fill,stroke=INK,lw=1)=>{ctx.beginPath();ctx.ellipse(xx,yy,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
    ctx.save();ctx.translate(x,y);ctx.scale(size/68,size/68);ellipse(0,-1,18,5,'rgba(34,57,42,.22)',null);ctx.scale(face,1);ctx.translate(0,bob);
    if(id==='sali'){p('M12 -12 C34 -16 31 -44 19 -42 C8 -39 15 -30 22 -31 C28 -20 16 -24 9 -19Z',c.fur);p('M18 -17 Q30 -24 24 -36',null,c.light,3);}
    if(id==='tiaotiao'){p('M-6 -14 C-27 -9 -30 -24 -23 -31 Q-18 -35 -24 -41',null,c.fur,4);}
    if(id==='hongmao'){p('M-7 -13 Q-25 -8 -25 -24 Q-25 -32 -33 -27',null,c.fur,5);}
    p('M-10 -17 L-13 -4 -4 -3 0 -14 4 -3 14 -4 10 -19Z',id==='dada'?'#43574c':c.shade);
    ellipse(-9,-3,7,3,id==='dada'?'#344a41':'#83724b');ellipse(9,-3,7,3,id==='dada'?'#344a41':'#83724b');
    const wide=id==='daben'?19:id==='doudou'?16:13;
    p(`M-${wide-3} -36 Q-${wide+6} -32 -${wide+5} -20 L-${wide-2} -17 -${wide-4} -25 -${wide} -8 Q0 -2 ${wide} -9 L${wide-4} -24 ${wide+2} -19 ${wide+7} -24 Q${wide+2} -35 ${wide-3} -36Z`,c.cloth);
    p(`M-${wide-4} -18 Q0 -13 ${wide-4} -19 L${wide-3} -14 Q0 -8 -${wide-3} -14Z`,c.belt);
    p('M-5 -35 L0 -27 6 -35',null,id==='hongmao'?'#7fa5aa':'#e5e6cc',2.5);
    if(id==='lantu'||id==='dada'){p('M-12 -32 Q-24 -37 -30 -29 L-26 -22 Q-17 -32 -12 -26',c.belt,null);}
    if(id==='doudou'){p('M-12 -35 L14 -11',null,'#ac8d59',3);ellipse(15,-10,7,8,'#c3a368');}
    ellipse(-wide-1,-21,4.5,5,id==='dada'?'#354a40':c.light);
    ctx.save();ctx.translate(wide+1,-24);ctx.rotate(.7+Math.sin(t*3)*.035);p('M-2 -3 L-2 -30 0 -37 3 -30 2 -3Z',c.sword,INK,.7);p('M0 -7 V-32',null,'#fff9e5',.9);p('M-6 -5H6',null,'#bba767',2.5);p('M0 -4V3',null,'#635c40',3);ctx.restore();ellipse(wide+1,-23,4.2,4.6,id==='dada'?'#354a40':c.light);
    ctx.save();ctx.translate(0,-43);
    if(id==='lantu'){p('M-11 -4 Q-20 -25 -15 -28 Q-9 -26 -5 -6M4 -6 Q7 -29 13 -31 Q19 -30 13 -3',c.fur);p('M-12 -13L-15 -23M10 -13L13 -24',null,'#d4b5c7',2.2);}
    else if(id==='hongmao'){p('M-13 -7L-15 -23 -3 -15 8 -15 19 -24 16 -5Z',c.fur);}
    else if(id==='sali'){p('M-14 -6L-15 -20 -3 -13 7 -13 18 -21 16 -4Z',c.fur);}
    else if(id==='doudou'){ellipse(-15,0,6,12,'#8b6948');ellipse(15,0,6,12,'#8b6948');}
    else{ellipse(-13,-11,6,6,id==='dada'?'#384c43':c.fur);ellipse(14,-11,6,6,id==='dada'?'#384c43':c.fur);}
    const rw=id==='daben'?20:id==='doudou'?17:16;
    ellipse(0,0,rw,17,c.fur);
    if(id==='tiaotiao'){p('M-15 -5 Q-19 -20 -9 -19 Q-2 -30 10 -21 Q21 -16 15 -5 L9 -12 3 -8 -3 -14 -9 -6Z','#637347');p('M-11 -3Q-3 -9 1 -1Q8 -9 13 -2L13 9Q0 23 -13 10Z',c.light,null);}
    if(id==='doudou'){p('M-16 -9Q-19 -25 0 -24Q19 -25 17 -8Q0 -15 -16 -9Z','#547867');p('M-17 -8Q0 -14 18 -8',null,'#385d4f',4);ellipse(0,-17,4,5,'#dbc38c',null);}
    if(id==='dada'){ellipse(-8,-1,5.5,8,'#3e5046',null);ellipse(8,-1,5.5,8,'#3e5046',null);p('M-14 -10Q0 -15 14 -10',null,'#81b0b5',4);}
    if(id==='daben'){p('M-9 -14L-5 -21 1 -16 8 -22 12 -13',c.light);}
    if(id==='hongmao'||id==='sali'||id==='lantu'){p(`M-${rw-3} 6 Q-6 1 0 8 Q8 0 ${rw-3} 6 Q${rw-1} 16 0 17 Q-${rw-1} 15 -${rw-3} 6Z`,id==='lantu'?'#f3f9e8':'#fae7c9',null);}
    if(id==='daben'||id==='doudou')ellipse(1,9,12,7,c.light,'#a59876',.6);
    ellipse(-6,-1,3.4,4.5,'#f9f9e5',null);ellipse(8,-1,3.4,4.5,'#f9f9e5',null);ellipse(-5.2,-.5,1.7,3.2,'#304a37',null);ellipse(8.8,-.5,1.7,3.2,'#304a37',null);ellipse(-6,-2,1,1,'#fff',null);ellipse(8,-2,1,1,'#fff',null);
    p('M-10 -7L-3 -5M5 -5L12 -7',null,id==='lantu'||id==='sali'?'#8a7585':INK,1.2);
    p(id==='doudou'||id==='daben'?'M-3 7Q2 4 7 7L2 11Z':'M-2 7L4 7 1 10Z',id==='doudou'||id==='daben'?'#6b573c':'#7e6954',null);
    p('M-4 12Q2 15 7 11',null,INK,.9);
    if(id==='lantu'){ellipse(-15,-8,4,3,'#c39bc7',null);ellipse(-15,-8,1.3,1.3,'#ebd89f',null);}
    ctx.restore();ctx.restore();
  }

  function mapSVG() {
    const p=`qsMap${++serial}_`;
    const stone=(x,y,w,h,shade='#8caa91',variant=0)=>{
      const v=variant%4;
      const summits=[
        [[-.33,-.8],[-.3,-.91],[-.23,-.93],[-.2,-1],[-.12,-.98],[-.07,-.92],[.01,-.94],[.07,-.88],[.14,-.89],[.2,-.82]],
        [[-.35,-.78],[-.3,-.86],[-.29,-.97],[-.21,-1],[-.12,-.98],[-.1,-.87],[.01,-.86],[.02,-.94],[.12,-.97],[.2,-.89],[.25,-.81]],
        [[-.37,-.8],[-.31,-.91],[-.22,-.91],[-.15,-.95],[-.09,-.94],[-.02,-1],[.05,-.95],[.09,-.91],[.23,-.87],[.27,-.75]],
        [[-.33,-.78],[-.24,-.86],[-.23,-.96],[-.16,-1],[-.09,-.98],[0,-.88],[.07,-.92],[.13,-.9],[.19,-.84],[.25,-.8]]
      ][v];
      const summit=summits.map(([a,b])=>`${(a*w).toFixed(1)} ${(b*h).toFixed(1)}`).join('L');
      const left=summits[0],right=summits[summits.length-1];
      const contour=`M${-w*.58} 3Q${-w*.5} ${-h*.12} ${-w*.49} ${-h*.24}L${-w*.39} ${-h*.36} ${-w*.41} ${-h*.48} ${-w*.34} ${-h*.54}L${summit}L${w*.3} ${-h*.61} ${w*.27} ${-h*.52} ${w*.4} ${-h*.34}Q${w*.41} ${-h*.16} ${w*.54} 2Z`;
      let lines='';
      for(let k=0;k<5;k++){const a=(-.27+k*.105)*w, top=-(.72+(k*13%17)/100)*h;lines+=`<path d="M${a} ${top}q${w*.035} ${h*.12} ${w*.012} ${h*.23}l${w*.035} ${h*.065} ${-w*.018} ${h*.13}"/>`;}
      return `<g transform="translate(${x} ${y})"><path d="${contour}" fill="${shade}"/><path d="M${-w*.055} ${-h*.91}Q${w*.05} ${-h*.62} ${-w*.005} ${-h*.44}L${w*.1} ${-h*.34} ${w*.07} 2H${w*.54}Q${w*.41} ${-h*.16} ${w*.4} ${-h*.34}L${w*.27} ${-h*.52} ${w*.3} ${-h*.61} ${w*right[0]} ${h*right[1]}Z" fill="#4c837d" opacity=".2"/><path d="M${summit}L${w*.27} ${-h*.75}Q${w*.14} ${-h*.82} ${w*.01} ${-h*.78}Q${-w*.12} ${-h*.85} ${-w*.35} ${-h*.74}Z" fill="#72956e" opacity=".88"/><path d="M${w*left[0]} ${h*left[1]}L${-w*.31} ${-h*.64} ${-w*.34} ${-h*.49} ${-w*.3} ${-h*.43}" fill="none" stroke="#d5d6b3" stroke-width="2" opacity=".4"/><g fill="none" stroke="#43695a" stroke-width=".9" opacity=".18">${lines}</g><path d="M${-w*.25} ${-h*.9}q${w*.07} ${-h*.026} ${w*.1} 0m${w*.08} ${h*.047}q${w*.05} ${-h*.02} ${w*.095} ${h*.01}" fill="none" stroke="#a5ba8d" stroke-width="2" opacity=".58"/></g>`;
    };
    const pine=(x,y,s=1,light=false)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0Q-10 -32 -3 -61Q-2 -79 -12 -97M-3 -40L-27 -60 M-3 -65L23 -83" fill="none" stroke="${light?'#8e9270':'#73734f'}" stroke-width="5"/><path d="M-2 -41L-28 -59M-5 -65L19 -82" fill="none" stroke="${light?'#8e9270':'#73734f'}" stroke-width="3"/><path d="M-44 -65Q-48 -74 -32 -73Q-34 -83 -22 -81Q-14 -94 -4 -84Q7 -80 13 -70L5 -64 -7 -65 -16 -59Z" fill="${light?'#89a282':'#467861'}"/><path d="M-11 -86Q-21 -94 -7 -98Q-13 -107 1 -106Q9 -118 15 -108Q31 -110 32 -99Q45 -99 43 -89L34 -86 21 -89 11 -82Z" fill="${light?'#98ad8b':'#588666'}"/><path d="M-31 -69Q-18 -76 -7 -70M0 -96Q15 -102 31 -94" fill="none" stroke="${light?'#becba4':'#8aa277'}" stroke-width="3" opacity=".7"/></g>`;
    const bamboo=(x,y,s=1)=>{let q=`<g transform="translate(${x} ${y}) scale(${s})" stroke-linecap="round">`;[-18,-7,5,16,26].forEach((a,i)=>{let top=-(70+(i*19)%46);q+=`<path d="M${a} 0Q${a-4} -40 ${a+(i%2?5:-3)} ${top}" fill="none" stroke="#6f9475" stroke-width="2.4"/>`;[-25,-45,-65,-85].forEach((yy,j)=>{if(yy>top+8){q+=`<path d="M${a-2} ${yy}h5" stroke="#b4bc8b" stroke-width="1"/><path d="M${a} ${yy}q-12 -20 -27 -18q7 12 27 18q12 -17 27 -20q-8 15 -27 20" fill="${j%2?'#7e9f78':'#537f65'}" stroke="none"/>`;}});});return q+'</g>';};
    const blossom=(x,y,s=1)=>{const pts=[[-23,-61,17],[-42,-79,15],[-16,-89,19],[7,-104,16],[29,-88,18],[44,-68,14],[8,-68,22],[-44,-54,12],[24,-49,14]];return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0Q-5 -31 -8 -54L-24 -70M-8 -50Q15 -77 28 -80M-6 -43Q-28 -48 -40 -62" fill="none" stroke="#9b8270" stroke-width="4"/>${pts.map(([a,b,r],i)=>`<path d="M${a-r} ${b}q-${r*.2} -${r*.7} ${r*.55} -${r*.7}q${r*.1} -${r} ${r*.8} -${r*.7}q${r*.7} -${r*.45} ${r*.9} ${r*.4}q${r} ${r*.1} ${r*.55} ${r}q${r*.2} ${r} -${r*.8} ${r*.9}q-${r*.9} ${r*.7} -${r*.9} -${r*.1}q-${r*.9} ${r*.2} -${r*.9} -${r*.8}Z" fill="${['#dec0be','#e8cecb','#d5aeb6'][i%3]}"/>`).join('')}<path d="M-22 -84l2 2M12 -98l3 1M33 -70l2 2M-37 -64l2 1M6 -61l3 1M29 -51l2 2" stroke="#f8e9da" stroke-width="4" stroke-linecap="round"/></g>`;};
    const roof=(x,y,w,color='#5f817b')=>`<path d="M${x-w/2} ${y}Q${x-w*.36} ${y+2} ${x-w*.22} ${y-12}L${x} ${y-26} ${x+w*.23} ${y-12}Q${x+w*.4} ${y+2} ${x+w/2} ${y}L${x+w*.4} ${y+9}Q${x} ${y+3} ${x-w*.4} ${y+9}Z" fill="${color}" stroke="#64796b" stroke-width="1.4"/><path d="M${x-w*.38} ${y+3}Q${x} ${y-1} ${x+w*.38} ${y+3}" fill="none" stroke="#b5baa0" stroke-width="2"/>`;
    const house=(x,y,s=1,kind='temple')=>{
      let q=`<g transform="translate(${x} ${y}) scale(${s})">`;
      if(kind==='pagoda'){q+=`<path d="M-47 4Q0 -9 47 4L38 14H-39Z" fill="#acb19a"/>`;for(let i=0;i<3;i++){const yy=-i*31,w=66-i*15;q+=`<path d="M${-w*.31} ${yy}V${yy-29}H${w*.31}V${yy}" fill="#e0d7b5" stroke="#947f5f" stroke-width="2"/><path d="M-7 ${yy}V${yy-23}H7V${yy}" fill="#899581"/>${roof(0,yy-24,w+22)}`;}q+=`<path d="M0 -112V-127" stroke="#9f8b5d" stroke-width="2"/><circle cy="-126" r="3" fill="#c6ad71"/>`;}
      else if(kind==='hut'){q+=`<path d="M-50 4L50 4 42 11H-43Z" fill="#c3bd9b"/><path d="M-35 0V-36H34V0Z" fill="#c9b693" stroke="#8b8869" stroke-width="1.5"/><path d="M-8 0V-27H8V0Z" fill="#7c8270"/><path d="M-27 -23H-16V-10H-27ZM17 -23H28V-10H17Z" fill="#95a293"/><path d="M-50 -32L0 -65 51 -30 42 -24 0 -50 -43 -22Z" fill="#a7a27c" stroke="#818866" stroke-width="1.3"/><path d="M-35 -29L-4 -55M-22 -29L2 -54M-8 -31L7 -51M7 -31L12 -48M22 -30L19 -44M35 -29L26 -40" fill="none" stroke="#cfbf8d" stroke-width="2"/>`;}
      else{const inns=kind==='inn';q+=`<path d="M-71 6L70 6 58 16H-60Z" fill="#c6c3a4"/><path d="M-50 3V-55H50V3Z" fill="${inns?'#c3a887':'#e1d6b3'}" stroke="#8e8064" stroke-width="1.6"/><path d="M-50 -27H50M-40 3V-40M-17 3V-40M17 3V-40M40 3V-40" stroke="#927a58" stroke-width="2.5" fill="none"/><path d="M-10 3V-19H10V3Z" fill="#737b64"/><path d="M-36 -21H-22V-8H-36ZM22 -21H36V-8H22Z" fill="#839387"/><path d="M-31 -45H-16V-31H-31ZM16 -45H31V-31H16Z" fill="#9ba18a"/>`;q+=roof(0,-48,133,inns?'#937b5c':'#648984');q+=``;if(!inns){q+=`<path d="M-19 -66V-86H19V-66Z" fill="#ded2ad" stroke="#8e8064" stroke-width="1.4"/>${roof(0,-80,68)}<path d="M-7 -70V-80H7V-70Z" fill="#8d9f92"/>`;}}
      return q+'</g>';
    };
    let back='', middle='', detail='';
    back=`<path d="M-40 253Q14 207 67 221L96 192 118 151Q150 115 167 169L189 183 215 144Q225 120 241 143L272 119 293 143 312 117 326 78Q352 55 365 106L401 126Q443 160 490 157L519 128 543 141 565 103 587 73Q620 49 638 111L664 121 686 92 704 63 726 70 744 44Q772 21 791 56L825 87 851 72 875 30 909 18 932 43 949 86Q970 114 986 96L1008 58 1029 75 1049 102 1078 91Q1106 61 1128 86L1161 138 1198 154 1236 128 1261 131 1294 109 1317 124 1342 157 1398 184 1428 162 1451 188 1491 213Q1542 185 1640 234V400H-40Z" fill="#c6d2c2"/>

      <path d="M-40 298L8 270 36 279 70 232 105 247 139 229 167 263 201 235 235 250 262 214 286 202 316 225 341 184 367 175 390 192 421 188 444 207 482 181 521 197 549 177 577 190 616 151 646 177 677 167 719 128 753 147 786 139 824 160 858 140 893 164 926 131 947 149 979 162 1005 143 1039 157 1071 196 1110 188 1133 156 1162 183 1190 168 1226 198 1259 176 1296 211 1323 201 1360 228 1394 199 1422 208 1458 250 1484 232 1526 267 1565 255 1640 286V411H-40Z" fill="#b3c7b6"/>`;
    const ridges=[[-35,635,280,370],[85,600,230,351],[150,570,150,300],[220,590,195,273],[420,476,168,236],[484,464,122,300],[554,398,105,221],[574,463,118,265],[677,344,130,230],[790,320,150,205],[862,319,122,252],[970,310,113,192],[1162,498,130,290],[1260,475,160,227],[1448,438,180,269],[1530,476,190,258],[1612,573,225,325]];
    ridges.forEach(([x,y,w,h],i)=>middle+=stone(x,y,w,h,['#92ae97','#a0b59a','#aac0a6','#8cac98'][i%4],i));
    // Tree placements frame each location and leave its courtyard readable.
    const trees=[[159,519,.66],[253,537,.63],[430,522,.7],[468,376,.5],[630,338,.55],[730,336,.5],[804,378,.62],[902,293,.48],[968,427,.67],[1164,564,.73],[1468,355,.58],[1422,674,.66],[1557,630,.8],[956,836,.86],[1139,785,.63],[1177,840,.84],[154,831,1.2],[228,843,.95],[364,902,.65],[441,835,.56],[698,864,.74],[1431,854,1.04],[1388,927,.95]];
    trees.forEach(([x,y,s],i)=>detail+=pine(x,y,s,i%5===0));
    [[114,688,.8],[192,670,.8],[234,720,.72],[375,702,.75],[418,738,.6],[519,684,.57],[549,598,.5],[901,718,.6],[1080,812,.57],[1242,351,.63],[1434,333,.7],[1472,313,.65],[1519,371,.83],[1499,699,.78]].forEach(a=>detail+=bamboo(...a));
    [[232,347,.76],[281,323,.63],[409,339,.72],[448,309,.63],[366,378,.42],[580,686,.5],[729,660,.44],[1308,744,.67],[1360,740,.47]].forEach(a=>detail+=blossom(...a));
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="张家界七侠江湖青绿山水地图"><defs>
      <linearGradient id="${p}paper" x2="0" y2="1"><stop stop-color="#f7f1df"/><stop offset=".35" stop-color="#edf0dc"/><stop offset="1" stop-color="#e3e7ce"/></linearGradient>
      <linearGradient id="${p}river" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c3deda"/><stop offset=".44" stop-color="#9bbfba"/><stop offset="1" stop-color="#80aea8"/></linearGradient>
      <linearGradient id="${p}land" x2="0" y2="1"><stop stop-color="#d9dec0"/><stop offset="1" stop-color="#b1c49b"/></linearGradient>
      <linearGradient id="${p}cliff" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5c9a0"/><stop offset=".45" stop-color="#b6b28b"/><stop offset="1" stop-color="#7d9f88"/></linearGradient>
      <linearGradient id="${p}fall" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#a4cfcd"/><stop offset=".5" stop-color="#f7f5e1"/><stop offset="1" stop-color="#c0ded5"/></linearGradient>
      <linearGradient id="${p}mist"><stop stop-color="#f9f4e5" stop-opacity="0"/><stop offset=".35" stop-color="#f9f4e5" stop-opacity=".72"/><stop offset=".75" stop-color="#f9f4e5" stop-opacity=".67"/><stop offset="1" stop-color="#f9f4e5" stop-opacity="0"/></linearGradient>
      <pattern id="${p}grain" width="83" height="71" patternUnits="userSpaceOnUse"><circle cx="8" cy="13" r=".7" fill="#777d53" opacity=".1"/><circle cx="51" cy="45" r=".6" fill="#777d53" opacity=".1"/><path d="M21 63h3M67 9h2M31 31h1" stroke="#838664" stroke-width=".5" opacity=".15"/></pattern>
      </defs><rect width="1600" height="1000" fill="url(#${p}paper)"/>
      <circle cx="1330" cy="109" r="64" fill="#e8d6a4" opacity=".6"/><circle cx="1330" cy="109" r="72" fill="none" stroke="#d8c795" stroke-width=".8" opacity=".6"/>
      <g opacity=".74">${back}</g>
      <path d="M0 312Q150 280 302 311T585 286Q805 267 1008 299T1300 270Q1472 267 1600 291V390H0Z" fill="#f5f2df" opacity=".66"/>
      <path d="M-20 346Q214 350 363 390Q503 411 604 390Q824 365 1003 411Q1191 442 1296 377Q1439 340 1620 403V1020H-20Z" fill="url(#${p}land)"/>
      <path d="M-20 426Q125 432 226 407Q366 358 461 410Q573 481 706 445Q902 438 1069 500Q1211 515 1349 449Q1511 436 1620 486V635Q1453 591 1338 649Q1190 674 1118 599Q951 598 872 575Q756 554 598 597Q473 614 355 551Q178 520 -20 586Z" fill="#c9d5b4"/>
      <path d="M-20 701Q176 655 321 719Q467 754 628 711Q739 678 860 742Q1003 795 1161 737Q1305 694 1438 734Q1533 746 1620 720V1020H-20Z" fill="#bbcca6"/>
      <path d="M850 170C896 215 927 267 969 332C1019 387 1107 414 1126 474C1141 542 993 572 952 626C924 663 1003 681 970 727C933 784 758 772 690 817C629 860 761 891 653 938C578 972 470 944 429 1010H218C269 895 427 918 512 884C566 863 494 818 571 770C635 727 826 723 842 687C863 653 823 621 887 568C942 522 1055 526 1040 476C1027 435 959 414 939 375C899 315 884 255 850 170Z" fill="#a8ba98" opacity=".54"/>
      <path d="M850 170C896 215 933 285 969 339C1009 395 1094 420 1109 475C1127 533 979 562 940 618C908 661 982 683 949 721C906 770 743 761 673 809C606 855 731 881 637 923C567 954 452 940 409 1010H252C298 917 449 927 524 890C586 861 518 821 585 781C656 737 838 738 859 691C882 644 842 623 901 581C955 535 1076 525 1059 474C1041 422 971 409 950 371C904 294 881 237 850 170Z" fill="url(#${p}river)"/>
      <path d="M1105 487C1083 541 967 567 936 622M864 704C793 751 677 740 615 796M615 937C531 964 465 944 415 985M909 692C921 711 893 731 851 739M897 601Q912 573 982 553" fill="none" stroke="#e4e8cf" stroke-width="2" opacity=".65"/>
      <path d="M342 990Q415 944 465 955M594 911Q659 885 648 864M861 675Q865 649 877 636M1060 486Q1079 508 1030 526" fill="none" stroke="#729e95" stroke-width="1.5" opacity=".6"/>
      ${middle}
      <path d="M0 522Q195 487 330 519T642 521Q775 503 925 524" fill="none" stroke="url(#${p}mist)" stroke-width="47"/>
      <path d="M1070 391Q1189 366 1340 400T1610 382" fill="none" stroke="url(#${p}mist)" stroke-width="39"/>
      <!-- Jade Toad Palace, peach groves, and a quiet lotus pond. -->
      <path d="M242 332Q301 277 390 301Q434 312 452 343Q369 365 255 356Z" fill="#c4c8a2"/>
      <path d="M280 337Q341 329 404 343Q428 358 401 376Q356 393 305 378Q265 362 280 337Z" fill="#b4d4c2" stroke="#9aae8e" stroke-width="1.4"/>
      <path d="M288 346Q333 341 369 346M329 377Q365 386 400 369" fill="none" stroke="#edf0d8" stroke-width="2"/>
      <ellipse cx="329" cy="354" rx="10" ry="3" fill="#88aa80"/><ellipse cx="378" cy="366" rx="9" ry="3" fill="#96b08b"/><path d="M328 355Q318 349 325 346Q328 338 332 346Q340 347 328 355" fill="#dbb2bc"/>
      ${house(349,292,1.07,'temple')}${house(261,309,.53,'temple')}${house(442,298,.52,'temple')}
      <path d="M282 301L282 316M412 294V312M277 316H316M387 312H421" stroke="#8e9c81" stroke-width="2" fill="none"/>
      <!-- High stone shelves hold the Six Wonders pavilion. -->
      <path d="M690 281Q725 246 801 262L835 279 821 313 797 346 769 335 744 360 720 330 703 311Z" fill="url(#${p}cliff)"/><path d="M690 281Q755 271 835 279L823 289 706 294Z" fill="#95ac84"/><path d="M716 298L728 324M748 295L755 330M790 293L788 325M816 292L806 317" fill="none" stroke="#818c6c" stroke-width="2" opacity=".6"/>
      ${house(763,263,.84,'pagoda')}${pine(707,290,.55)}${pine(821,288,.5)}
      <!-- Inn roofs cluster around an open courtyard. -->
      <path d="M590 640Q646 616 735 636L763 658Q688 675 596 659Z" fill="#d7cfa8"/>
      ${house(670,612,1.1,'inn')}${house(586,630,.6,'hut')}${house(751,638,.6,'hut')}
      <path d="M604 625V653M608 626H631M610 630H628V642H610Z" fill="#be936d" stroke="#8f7b55" stroke-width="2"/>
      <path d="M600 667h15M631 657h9M706 664h15M737 651h9" stroke="#b1a985" stroke-width="2" stroke-linecap="round"/>
      <!-- Happy Forest and the old Thunder Sword estate. -->
      <path d="M914 785Q975 758 1056 774L1087 805Q1003 830 915 805Z" fill="#c8c39a"/>
      ${house(991,769,.94,'hut')}${house(1072,785,.52,'hut')}
      <path d="M903 804V783L907 779 911 783V804M917 811V792L921 788 925 792V811M935 813V796L939 792 943 796V813" fill="#a5ab8a" stroke="#8e987d" stroke-width="1"/>
      <path d="M1030 800L1062 805M966 797L980 798" stroke="#adae86" stroke-width="2"/>
      <!-- A cliff waterfall meets the winding Golden Whip Stream. -->
      <path d="M1004 406L1020 353 1042 322 1090 330 1128 363 1142 414 1124 450 1097 473 1050 461Z" fill="url(#${p}cliff)"/><path d="M1014 367Q1068 346 1128 363L1118 376Q1057 364 1010 380Z" fill="#8ca77f"/><path d="M1034 382L1028 425M1122 392L1125 431M1104 432L1115 453" stroke="#718b70" stroke-width="2" fill="none"/>
      <path d="M1054 366Q1071 362 1087 367Q1083 413 1095 453Q1113 480 1096 487L1064 480Q1084 468 1062 435Q1055 405 1054 366Z" fill="url(#${p}fall)"/><path d="M1061 371Q1062 418 1075 448M1077 371Q1066 416 1090 464M1067 438L1078 467" fill="none" stroke="#faf8e5" stroke-width="2" opacity=".9"/>
      <ellipse cx="1087" cy="479" rx="43" ry="10" fill="#dce9d6" opacity=".9"/><path d="M1046 481Q1082 493 1124 481M1065 469Q1060 481 1073 484M1099 468Q1117 479 1106 484" fill="none" stroke="#f8f7e5" stroke-width="2"/>
      ${pine(1022,393,.46)}${pine(1133,392,.52)}
      <!-- The Ten Mile Gallery: asymmetric sandstone fingers and verdant terraces. -->
      ${stone(1259,699,133,187,'#9aaa84',1)}${stone(1395,645,98,182,'#b7b38d',2)}${stone(1490,705,144,230,'#8fa580',0)}
      <path d="M1199 719Q1285 688 1382 715L1427 735 1364 760 1264 753Z" fill="#c5cca0"/><path d="M1240 719L1261 739 1328 749M1349 752L1393 733" fill="none" stroke="#8ba080" stroke-width="2"/>
      ${house(1310,707,.61,'temple')}${pine(1229,725,.59)}
      <!-- Herb Valley: bamboo, herb beds, and a modest scholar's cottage. -->
      <path d="M1264 316Q1295 280 1372 288Q1442 301 1438 334Q1354 352 1272 340Z" fill="#cfd3ab"/>
      ${house(1340,299,.85,'hut')}${house(1400,310,.48,'hut')}
      <path d="M1296 321L1331 323M1292 330L1328 332M1290 339L1322 341M1364 324L1394 323M1367 333L1399 331" stroke="#a5b28a" stroke-width="5" stroke-linecap="round"/>
      <path d="M1296 321l3 -5m5 5l3 -5m6 5l3 -5m7 5l3 -5M1294 330l3 -5m5 5l3 -5m6 5l3 -5m7 5l3 -5M1364 324l3 -5m6 5l3 -5m6 5l3 -5" stroke="#75986d" stroke-width="2" stroke-linecap="round"/>
      <!-- Tianzi summit sits above the cloud sea. -->
      
      <path d="M824 122L842 70 867 46 907 50 926 80 943 137 910 154 875 149 849 158Z" fill="#c0b99c"/><path d="M843 83Q879 68 924 82L932 104 839 102Z" fill="#a2af8c"/>
      ${house(881,98,.58,'temple')}${pine(933,130,.4)}
      <path d="M733 143Q850 121 999 148T1193 138" fill="none" stroke="url(#${p}mist)" stroke-width="32"/>
      <!-- Light stone footbridge; decorative geography, separate from the UI route network. -->
      <path d="M834 711Q882 683 939 708L940 721Q882 695 835 724Z" fill="#cbc7a2" stroke="#8ca08b" stroke-width="2"/><path d="M834 711Q882 683 939 708M837 705L838 716M852 699L853 709M869 694L870 705M889 694L889 704M909 698L909 708M930 704L930 715" fill="none" stroke="#aeb395" stroke-width="2.3"/>
      ${detail}
      <!-- Forest is a varied canopy, not a repeated triangular tile. -->
      ${pine(96,771,1.28)}${pine(182,778,1.04)}${pine(275,793,.84)}${pine(376,794,.76)}${bamboo(325,820,.86)}
      <path d="M258 757Q284 738 310 756L337 766 331 782Q278 793 243 780Z" fill="#a6b88f"/><path d="M265 771Q281 769 290 766M307 776h14" fill="none" stroke="#7f9c78" stroke-width="1.5"/>
      <path d="M72 999Q82 927 46 866Q12 818 -39 831" fill="none" stroke="#747853" stroke-width="18"/><path d="M51 900Q109 857 145 864M40 854Q13 811 -13 808" fill="none" stroke="#747853" stroke-width="9"/>
      <path d="M-22 829Q-38 800 -11 797Q-6 771 17 783Q35 762 54 783Q83 780 88 803Q108 809 96 825Q76 838 54 830Q27 846 13 831Z" fill="#59816a"/><path d="M69 878Q53 863 74 850Q74 833 96 839Q115 821 129 841Q152 835 164 849Q184 852 181 867Q169 878 144 874Q123 890 106 878Z" fill="#6b9071"/><path d="M3 810Q29 797 59 810M90 859Q123 847 152 858" fill="none" stroke="#98ad81" stroke-width="5"/>
      ${bamboo(1548,1008,1.68)}${bamboo(1472,1040,1.22)}
      <path d="M1087 965Q1145 911 1201 927Q1243 919 1264 942L1300 965Q1177 988 1087 965Z" fill="#8ba687"/><path d="M1168 935L1148 956M1221 940L1240 957M1162 966L1196 952" fill="none" stroke="#6b8c78" stroke-width="2"/>
      <g fill="none" stroke="#7e8d77" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M1078 93q9 -6 17 0q8 -7 17 -2M1119 70q7 -4 13 1q7 -6 14 -2M1150 104q7 -5 14 0q7 -5 13 -2"/></g>
      <path d="M-40 920Q195 867 399 928T763 902" fill="none" stroke="url(#${p}mist)" stroke-width="55" stroke-linecap="round" opacity=".4"/><path d="M1120 895Q1350 872 1620 918" fill="none" stroke="url(#${p}mist)" stroke-width="55" stroke-linecap="round" opacity=".4"/>
      <rect width="1600" height="1000" fill="url(#${p}grain)" pointer-events="none"/>
      </svg>`;
    return svg;
  }

  function icon(name) {
    const paths={
      sword:'<path d="m5 19 5-5m-4-3 7 7m-5-5L18 3h3v3L11 16M3 21l3-3"/>',
      map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3ZM9 3v15M15 6v15"/>',
      bag:'<path d="M6 8h12l3 11q0 3-9 3t-9-3ZM8 3q4 3 8 0l-2 5h-4ZM9 13q3-2 6 0m-5 3h4"/>',
      book:'<path d="M12 5Q7 2 3 4v15q5-2 9 1 4-3 9-1V4q-4-2-9 1ZM12 5v15M6 8h3m6 0h3M6 12h3m6 0h3"/>',
      volume:'<path d="M4 9h4l5-5v16l-5-5H4ZM17 8q4 4 0 8m3-11q7 7 0 14"/>',
      moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
      close:'<path d="m6 6 12 12M18 6 6 18"/>',
      chevron:'<path d="m9 5 7 7-7 7"/>',
      leaf:'<path d="M20 3Q5 1 4 12q-1 8 8 8 10-2 8-17ZM3 22 17 7M8 17v-6m0 6h6"/>',
      compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6ZM12 1v2m0 18v2M1 12h2m18 0h2"/>',
      shield:'<path d="M12 3 3 6v6q1 7 9 10 8-3 9-10V6ZM8 12l3 3 6-7"/>',
      heart:'<path d="M12 21Q-2 11 4 5q5-4 8 2 3-6 8-2 6 6-8 16Z"/>',
      arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
      check:'<path d="m5 12 5 5L20 6"/>',
      lotus:'<path d="M12 21Q3 13 12 3q9 10 0 18ZM12 21Q0 20 2 9q10 1 10 12Zm0 0Q24 20 22 9q-10 1-10 12Z"/>',
      spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
      flag:'<path d="M5 22V3q5-3 9 0t6 0v11q-3 3-7 0t-8 0"/>',
      scroll:'<path d="M7 4h13v13q0 4-4 4H5q-4 0-3-4h12q-1 4 2 4M7 4q-4-4-5 0v3h5v10M10 7h7m-7 4h7"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;
  }
  window.GameArt={heroSVG,drawHero,mapSVG,icon};
})();
