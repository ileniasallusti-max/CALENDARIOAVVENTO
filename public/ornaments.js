/* Palline di Natale GUA — versione moderna: sfere lucide, glitter fitto, riflesso che scorre */
(function () {
  const PALETTE = {
    rose:      { a: "#FBD6E1", b: "#D77E99", c: "#93405D" },
    blush:     { a: "#FFF2F6", b: "#F2B6C7", c: "#BF7189" },
    berry:     { a: "#F5A3C4", b: "#B8326E", c: "#560B31" },
    champagne: { a: "#FFF5EF", b: "#EBBDAE", c: "#A36B5C" },
    pearl:     { a: "#FFFFFF", b: "#F2D5DF", c: "#B07D93" },
    mauve:     { a: "#F0C7D6", b: "#A86783", c: "#55233A" },
    fuchsia:   { a: "#FFC9E0", b: "#E2508F", c: "#8C1A53" },
    ballet:    { a: "#FFE8EF", b: "#E59AB1", c: "#A44D6C" },
  };


  // forma, colore, logo
  const DAYS = {
    1: ["ball", "rose", 1],    2: ["heart", "blush", 1],   3: ["tree", "berry"],     4: ["ball", "pearl", 1],     5: ["star", "champagne"],
    6: ["heart", "fuchsia", 1], 7: ["drop", "mauve"],      8: ["ball", "champagne", 1], 9: ["tree", "ballet"],    10: ["ball", "berry", 1],
    11: ["star", "rose"],      12: ["heart", "mauve", 1],  13: ["ball", "blush", 1],  14: ["drop", "fuchsia"],    15: ["tree", "pearl"],
    16: ["ball", "fuchsia", 1], 17: ["heart", "pearl", 1], 18: ["star", "berry"],     19: ["ball", "ballet", 1],  20: ["drop", "champagne"],
    21: ["tree", "rose"],      22: ["ball", "mauve", 1],   23: ["heart", "rose", 1],  24: ["star", "blush"],      25: ["ball", "berry", 1],
  };


  function roundPoly(pts, r) {
    let d = "";
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
      const rr = Math.min(r, l1 / 2.2, l2 / 2.2);
      const a = [p1[0] + v1[0] / l1 * rr, p1[1] + v1[1] / l1 * rr];
      const b = [p1[0] + v2[0] / l2 * rr, p1[1] + v2[1] / l2 * rr];
      d += (i ? "L" : "M") + a[0].toFixed(1) + " " + a[1].toFixed(1) + "Q" + p1[0] + " " + p1[1] + " " + b[0].toFixed(1) + " " + b[1].toFixed(1);
    }
    return d + "Z";
  }
  const starPts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 36 : 84;
    starPts.push([+(100 + Math.cos(ang) * rad).toFixed(1), +(150 + Math.sin(ang) * rad).toFixed(1)]);
  }

  const SHAPES = {
    ball:  { d: "M100 70a80 80 0 1 0 0.01 0Z", top: 70, cx: 100, cy: 150 },
    heart: { d: "M100 226C46 190 22 158 22 120C22 90 44 70 70 70C85 70 95 78 100 90C105 78 115 70 130 70C156 70 178 90 178 120C178 158 154 190 100 226Z", top: 74, cx: 100, cy: 138 },
    tree:  { d: roundPoly([[100, 60], [140, 114], [124, 114], [160, 164], [142, 164], [178, 216], [22, 216], [58, 164], [40, 164], [76, 114], [60, 114]], 7), top: 60, cx: 100, cy: 168 },
    star:  { d: roundPoly(starPts, 9), top: 66, cx: 100, cy: 152 },
    drop:  { d: "M100 66C122 104 160 140 160 178C160 212 133 232 100 232C67 232 40 212 40 178C40 140 78 104 100 66Z", top: 66, cx: 100, cy: 180 },
  };

  // texture di glitter disegnate una volta sola e riusate da tutte le palline
  let TEX = null;
  function textures() {
    if (TEX) return TEX;
    TEX = [];
    const cols = ["255,255,255", "255,255,255", "255,236,244", "255,245,220", "246,225,255", "255,214,230"];
    for (let t = 0; t < 2; t++) {
      const S = 320, cv = document.createElement("canvas");
      cv.width = cv.height = S;
      const g = cv.getContext("2d");
      let seed = 11 + t * 97;
      const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 4200; i++) {
        const x = r() * S, y = r() * S, s = 1 + r() * r() * 3;
        const dark = r() < 0.38;
        g.fillStyle = dark ? `rgba(70,10,35,${0.22 + r() * 0.3})` : `rgba(${cols[Math.floor(r() * cols.length)]},${0.55 + r() * 0.45})`;
        g.save(); g.translate(x, y); g.rotate(r() * 3.14);
        if (r() < 0.6) g.fillRect(-s / 2, -s / 2, s, s * (0.6 + r() * 0.6));
        else { g.beginPath(); g.arc(0, 0, s / 2, 0, 6.29); g.fill(); }
        g.restore();
      }
      // punti di luce forti
      for (let i = 0; i < 28; i++) {
        const x = r() * S, y = r() * S, s = 1.2 + r() * 1.6;
        const grd = g.createRadialGradient(x, y, 0, x, y, s * 2.4);
        grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd; g.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
      }
      TEX.push(cv.toDataURL("image/png"));
    }
    return TEX;
  }

  function spark(x, y, s, delay, dur) {
    return `<path class="spk" style="animation-delay:${delay}s;animation-duration:${dur}s;transform-origin:${x}px ${y}px" d="M${x} ${y - s}C${x + s * .1} ${y - s * .1} ${x + s * .1} ${y - s * .1} ${x + s} ${y}C${x + s * .1} ${y + s * .1} ${x + s * .1} ${y + s * .1} ${x} ${y + s}C${x - s * .1} ${y + s * .1} ${x - s * .1} ${y + s * .1} ${x - s} ${y}C${x - s * .1} ${y - s * .1} ${x - s * .1} ${y - s * .1} ${x} ${y - s}Z" fill="#fff"/>`;
  }

  window.GUAOrnament = function (day, opts = {}) {
    const [shapeKey, colKey, logo] = DAYS[day] || DAYS[1];
    const sh = SHAPES[shapeKey], p = PALETTE[colKey];
    const id = "g" + day + (opts.suffix || "");
    const [tA, tB] = textures();
    let seed = day * 37 + 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const off = Math.floor(r() * 120);

    let sparks = "";
    for (let i = 0; i < 4; i++) {
      sparks += spark(+(28 + r() * 144).toFixed(1), +(sh.top + 18 + r() * 140).toFixed(1), +(4 + r() * 9).toFixed(1), +(r() * 4).toFixed(2), +(2.2 + r() * 2).toFixed(2));
    }

    const light = ["pearl", "blush", "champagne", "ballet"].includes(colKey);
    const lw = shapeKey === "heart" ? 122 : 138, lh = lw * 0.554;
    const ly = shapeKey === "heart" ? sh.cy - lh / 2 + 2 : sh.cy - lh / 2 + 4;
    const logoImg = logo
      ? `<image href="${light ? "logo-gua-prugna.png" : "logo-gua-bianco.png"}" x="${sh.cx - lw / 2}" y="${ly}" width="${lw}" height="${lh}" preserveAspectRatio="xMidYMid meet" style="filter:drop-shadow(0 1px 2px rgba(${light ? '255,255,255,.6' : '70,15,40,.4'}))"/>`
      : "";
    return `<svg class="orn-svg" viewBox="0 24 200 214" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
  <radialGradient id="${id}b" cx="0.36" cy="0.3" r="0.85">
    <stop offset="0" stop-color="${p.a}"/><stop offset="0.42" stop-color="${p.b}"/><stop offset="1" stop-color="${p.c}"/>
  </radialGradient>
  <radialGradient id="${id}rim" cx="0.5" cy="0.5" r="0.55">
    <stop offset="0.72" stop-color="${p.c}" stop-opacity="0"/><stop offset="1" stop-color="${p.c}" stop-opacity="0.55"/>
  </radialGradient>
  <radialGradient id="${id}hl" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${id}sheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id}cap" x1="0" x2="1">
    <stop offset="0" stop-color="#B98274"/><stop offset="0.35" stop-color="#FFF1EA"/><stop offset="0.65" stop-color="#E2B4A6"/><stop offset="1" stop-color="#9E6A5D"/>
  </linearGradient>
  <clipPath id="${id}c"><path d="${sh.d}"/></clipPath>
</defs>
<path d="M100 ${sh.top - 30} v12" stroke="#D9A698" stroke-width="1.4"/>
<ellipse cx="100" cy="${sh.top - 32}" rx="5" ry="5" fill="none" stroke="#D9A698" stroke-width="1.6"/>
<rect x="88" y="${sh.top - 19}" width="24" height="${shapeKey === "ball" ? 22 : 17}" rx="5" fill="url(#${id}cap)"/>
<path d="M90 ${sh.top - 12}h20M90 ${sh.top - 8}h20" stroke="#9E6A5D" stroke-opacity=".35" stroke-width=".8"/>
<g clip-path="url(#${id}c)">
  <path d="${sh.d}" fill="url(#${id}b)"/>
  <image class="gl" href="${tA}" x="${-off}" y="${-off + 20}" width="320" height="320" style="mix-blend-mode:screen" opacity=".85"/>
  <image class="gl gl2" href="${tB}" x="${-120 + off / 2}" y="${-off / 2}" width="320" height="320" style="mix-blend-mode:screen"/>
  <path d="${sh.d}" fill="url(#${id}rim)"/>
  <ellipse cx="${sh.cx - 30}" cy="${sh.cy - 42}" rx="34" ry="22" fill="url(#${id}hl)" transform="rotate(-32 ${sh.cx - 30} ${sh.cy - 42})"/>
  <ellipse cx="${sh.cx - 40}" cy="${sh.cy - 48}" rx="9" ry="4.5" fill="#fff" opacity=".9" transform="rotate(-32 ${sh.cx - 40} ${sh.cy - 48})"/>
  <rect class="sheen" x="-80" y="0" width="70" height="250" fill="url(#${id}sheen)" style="animation-delay:${(-day * 0.7) % 6}s"/>
  ${logoImg}
</g>
${sparks}
</svg>`;
  };
})();
