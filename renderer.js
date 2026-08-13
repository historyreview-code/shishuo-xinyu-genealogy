// 世说新语谱系图 —— 渲染引擎（横版 landscape / 竖版 portrait，浅色 / 深色主题）
// 依赖 window.SHISHUO（data.js）。入口：window.initShishuo('landscape' | 'portrait')
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const D = window.SHISHUO;

  // —— 布局配置 ——
  const LAYOUTS = {
    landscape: {
      viewBox: [1560, 1440],
      title: { size: 44, y: 56, subY: 92 },
      divider: { y: 118, x1: 120, x2: 1440 },
      sections: [
        { y: 148, t: "竹林七贤", c: "#4f7a4f" },
        { y: 148, t: "琅琊王氏", c: "#3f5f8a" },
        { y: 148, t: "陈郡谢氏", c: "#a83a2f" },
        { y: 148, t: "名士·隐逸", c: "#8a7a5c" },
      ],
      sectionXs: [260, 600, 1000, 1340],
      auras: [
        { cx: 260, y1: 395, y2: 775, w: 360, color: "#4f7a4f", sub: "魏晋之交 · 越名教而任自然" },
        { cx: 1335, y1: 205, y2: 815, w: 150, color: "#8a7a5c", sub: "清谈 · 隐逸 · 割席" },
      ],
      legend: { y: 1080, y2: 1160, noteY: 1330, startX: 150, font: 14, lfont: 13.5 },
    },
    portrait: {
      viewBox: [1080, 1920],
      title: { size: 40, y: 50, subY: 84 },
      divider: { y: 106, x1: 60, x2: 1020 },
      sections: [
        { y: 138, t: "竹林七贤", c: "#4f7a4f" },
        { y: 610, t: "琅琊王氏", c: "#3f5f8a" },
        { y: 1085, t: "陈郡谢氏", c: "#a83a2f" },
        { y: 1505, t: "名士·隐逸", c: "#8a7a5c" },
      ],
      auras: [
        { cx: 540, y1: 160, y2: 555, w: 520, color: "#4f7a4f", sub: "魏晋之交 · 越名教而任自然" },
        { cx: 540, y1: 1500, y2: 1770, w: 520, color: "#8a7a5c", sub: "清谈 · 隐逸 · 割席" },
      ],
      legend: { y: 1832, y2: 1882, noteY: 1906, startX: 60, font: 12.5, lfont: 12.5 },
    },
  };

  // —— 主题配色 ——
  const PALETTE = {
    light: {
      ink: "#2b2622", subtitle: "#8a8072", divider: "#d8cfba",
      inkSoft: "#6b6457", inkFaint: "#9a9285", legendText: "#4a443a",
      nodeRing: "#f6f1e6", edgeLabelFill: "#7a5440", edgeLabelHalo: "#f6f1e6",
      lines: {
        parent: "#5a5147", distant: "#8a8072", sibling: "#6b6457",
        cousin: "#7a7263", couple: "#b0303c", social: "#7d8a7d", rupture: "#c04040",
      },
    },
    dark: {
      ink: "#e8e3d8", subtitle: "#a89f8c", divider: "#2b303c",
      inkSoft: "#b3aa99", inkFaint: "#8a8578", legendText: "#cbc4b5",
      nodeRing: "#15181f", edgeLabelFill: "#dcbf90", edgeLabelHalo: "#15181f",
      lines: {
        parent: "#b3a892", distant: "#9a917f", sibling: "#a09886",
        cousin: "#968d7c", couple: "#d6576a", social: "#8ea08e", rupture: "#e06565",
      },
    },
  };

  // —— 主入口 ——
  function initShishuo(layoutName) {
    const layout = LAYOUTS[layoutName];
    const svg = document.getElementById("board");
    const scene = document.createElementNS(NS, "g");
    svg.appendChild(scene);

    let dark = /dark/.test(location.search);
    let tx = 0, ty = 0, s = 1;

    const byId = {};
    D.people.forEach(p => (byId[p.id] = p));

    const coordX = p => (layoutName === "portrait" ? p.px : p.x);
    const coordY = p => (layoutName === "portrait" ? p.py : p.y);
    const bendOf = r => (layoutName === "portrait" ? r.pbend : r.bend);
    const radius = p => (p.ep ? 35 : 30);

    function el(tag, attrs) {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
      return e;
    }

    function render() {
      scene.innerHTML = "";
      const P = PALETTE[dark ? "dark" : "light"];
      const [W, H] = layout.viewBox;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      document.body.classList.toggle("dark", dark);

      drawHeader(P, layout, W);
      drawSections(P, layout, W);
      drawAuras(P, layout);
      D.relations.forEach(r => drawEdge(r, P, layout));
      D.people.forEach(p => drawNode(p, P, layout));
      drawLegend(P, layout, W);
      applyTransform();
    }

    // —— 标题 ——
    function drawHeader(P, L, W) {
      const t = el("text", {
        x: W / 2, y: L.title.y, "text-anchor": "middle",
        "font-family": '"Kaiti SC","STKaiti","Songti SC",serif',
        "font-size": L.title.size, fill: P.ink, "font-weight": "bold", "letter-spacing": 6,
      });
      t.textContent = D.meta.title;
      scene.appendChild(t);

      const sub = el("text", {
        x: W / 2, y: L.title.subY, "text-anchor": "middle",
        "font-family": '"Songti SC","STSong",serif', "font-size": 17, fill: P.subtitle, "letter-spacing": 3,
      });
      sub.textContent = D.meta.subtitle;
      scene.appendChild(sub);

      scene.appendChild(el("line", {
        x1: L.divider.x1, y1: L.divider.y, x2: L.divider.x2, y2: L.divider.y,
        stroke: P.divider, "stroke-width": 1,
      }));
    }

    // —— 分组标题（横版=列标题，竖版=区段标题）——
    function drawSections(P, L, W) {
      const xs = L.sectionXs || L.sections.map(() => W / 2);
      L.sections.forEach((sec, i) => {
        const t = el("text", {
          x: xs[i], y: sec.y, "text-anchor": "middle",
          "font-size": 20, fill: sec.c, "font-weight": "bold", "letter-spacing": 4,
        });
        t.textContent = sec.t;
        scene.appendChild(t);
      });
    }

    // —— 圈层背景 ——
    function drawAuras(P, L) {
      L.auras.forEach(a => {
        const g = el("g");
        g.appendChild(el("rect", {
          x: a.cx - a.w / 2, y: a.y1 - 22, width: a.w, height: (a.y2 - a.y1) + 44,
          rx: 14, fill: a.color, "fill-opacity": 0.05, stroke: a.color,
          "stroke-opacity": 0.35, "stroke-width": 1.2, "stroke-dasharray": "4 4",
        }));
        const s = el("text", {
          x: a.cx, y: a.y2 + 22, "text-anchor": "middle",
          "font-size": 11.5, fill: P.inkFaint, "letter-spacing": 1,
        });
        s.textContent = a.sub;
        g.appendChild(s);
        scene.appendChild(g);
      });
    }

    // —— 连线 ——
    function drawEdge(rel, P, L) {
      const a = byId[rel.from], b = byId[rel.to];
      const st = D.relTypes[rel.type];
      const lc = P.lines[st.color];
      const g = el("g", { "class": "edge" });
      g.setAttribute("data-from", rel.from);
      g.setAttribute("data-to", rel.to);

      const ax = coordX(a), ay = coordY(a), bx = coordX(b), by = coordY(b);
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const ra = radius(a), rb = radius(b), gap = 3;
      const p0 = { x: ax + ux * (ra + gap), y: ay + uy * (ra + gap) };
      const p2 = { x: bx - ux * (rb + gap), y: by - uy * (rb + gap) };
      const px = -uy, py = ux; // 弦法向
      const bend = bendOf(rel);

      if (bend) {
        const c = { x: bend[0], y: bend[1] };
        if (st.line === "double") {
          for (const off of [-2.6, 2.6]) {
            const s1 = { x: p0.x + px * off, y: p0.y + py * off };
            const e1 = { x: p2.x + px * off, y: p2.y + py * off };
            const c1 = { x: c.x + px * off, y: c.y + py * off };
            g.appendChild(el("path", {
              d: `M ${s1.x} ${s1.y} Q ${c1.x} ${c1.y} ${e1.x} ${e1.y}`,
              fill: "none", stroke: lc, "stroke-width": 1.6,
            }));
          }
        } else {
          g.appendChild(el("path", {
            d: `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p2.x} ${p2.y}`,
            fill: "none", stroke: lc, "stroke-width": 1.5,
            "stroke-dasharray": st.line === "dashed" ? "5 4" : null,
          }));
        }
      } else if (st.line === "double") {
        for (const off of [-2.6, 2.6]) {
          g.appendChild(el("line", {
            x1: p0.x + px * off, y1: p0.y + py * off,
            x2: p2.x + px * off, y2: p2.y + py * off,
            stroke: lc, "stroke-width": 1.6,
          }));
        }
      } else if (st.arrow) {
        const shorten = 11;
        const bx2 = p2.x - ux * shorten, by2 = p2.y - uy * shorten;
        g.appendChild(el("line", {
          x1: p0.x, y1: p0.y, x2: bx2, y2: by2,
          stroke: lc, "stroke-width": 2.1, "class": "arrow-line",
        }));
        const hw = 4.6;
        g.appendChild(el("polygon", {
          points: `${p2.x},${p2.y} ${bx2 + px * hw},${by2 + py * hw} ${bx2 - px * hw},${by2 - py * hw}`,
          fill: lc,
        }));
      } else {
        g.appendChild(el("line", {
          x1: p0.x, y1: p0.y, x2: p2.x, y2: p2.y,
          stroke: lc, "stroke-width": 1.5,
          "stroke-dasharray": st.line === "dashed" ? "5 4" : null,
        }));
      }

      // 关系标签
      if (rel.label) {
        const mx = bend ? (p0.x + 2 * bend[0] + p2.x) / 4 : (p0.x + p2.x) / 2;
        const my = bend ? (p0.y + 2 * bend[1] + p2.y) / 4 : (p0.y + p2.y) / 2;
        const t = el("text", {
          x: mx + px * 13, y: my + py * 13, "text-anchor": "middle",
          "class": "edge-label", stroke: P.edgeLabelHalo, "stroke-width": 4,
          "paint-order": "stroke", "stroke-linejoin": "round", fill: P.edgeLabelFill,
        });
        t.textContent = rel.label;
        g.appendChild(t);
      }
      scene.appendChild(g);
    }

    // —— 节点 ——
    function drawNode(p, P, L) {
      const g = el("g", { "class": "node", "data-id": p.id });
      const color = D.clans[p.clan];
      const x = coordX(p), y = coordY(p), r = radius(p);

      if (p.ep) {
        g.appendChild(el("circle", { cx: x, cy: y, r: r + 5, "class": "ring" }));
      }
      g.appendChild(el("circle", {
        cx: x, cy: y, r, fill: color, stroke: P.nodeRing, "stroke-width": 2, "class": "body",
      }));

      const name = el("text", {
        x, y: y + 6, "text-anchor": "middle", fill: "#fff",
        "font-size": p.name.length >= 3 ? 16 : 18, "font-weight": "bold",
        "font-family": '"Songti SC","STSong",serif',
      });
      name.textContent = p.name;
      g.appendChild(name);

      const zi = el("text", { x, y: y + r + 17, "text-anchor": "middle", "font-size": 12, fill: P.inkSoft });
      zi.textContent = "字" + p.zi.replace(/^字/, "");
      g.appendChild(zi);

      const yr = el("text", { x, y: y + r + 33, "text-anchor": "middle", "font-size": 10.5, fill: P.inkFaint });
      yr.textContent = p.years;
      g.appendChild(yr);

      if (p.ep) {
        const b = el("text", { x: x + r - 4, y: y - r + 6, "text-anchor": "middle", "class": "badge" });
        b.textContent = "剧";
        g.appendChild(b);
      }

      g.addEventListener("mouseenter", () => highlight(p.id));
      g.addEventListener("mouseleave", unhighlight);
      g.addEventListener("click", ev => { ev.stopPropagation(); showCard(p, ev); });
      scene.appendChild(g);
    }

    // —— 高亮 ——
    function highlight(id) {
      const neighbors = new Set([id]);
      D.relations.forEach(r => {
        if (r.from === id) neighbors.add(r.to);
        if (r.to === id) neighbors.add(r.from);
      });
      svg.querySelectorAll(".node").forEach(n => {
        n.style.opacity = neighbors.has(n.getAttribute("data-id")) ? 1 : 0.22;
      });
      svg.querySelectorAll(".edge").forEach(e => {
        const f = e.getAttribute("data-from"), t = e.getAttribute("data-to");
        e.style.opacity = (f === id || t === id) ? 1 : 0.12;
      });
    }
    function unhighlight() {
      svg.querySelectorAll(".node").forEach(n => (n.style.opacity = 1));
      svg.querySelectorAll(".edge").forEach(e => (e.style.opacity = ""));
    }

    // —— 图例 ——
    function drawLegend(P, L, W) {
      const g = el("g");
      scene.appendChild(g); // 先挂载，getComputedTextLength 才能测宽
      const Lg = L.legend;
      const fs = Lg.font;

      // 人物色块
      let x = Lg.startX;
      const swatches = [
        ["竹林七贤", "#4f7a4f"], ["琅琊王氏", "#3f5f8a"], ["陈郡谢氏", "#a83a2f"], ["名士·隐逸", "#8a7a5c"],
      ];
      swatches.forEach(([t, c]) => {
        g.appendChild(el("circle", { cx: x, cy: Lg.y, r: 9, fill: c, stroke: P.nodeRing, "stroke-width": 2 }));
        const tx = el("text", { x: x + 15, y: Lg.y + 5, "font-size": fs, fill: P.legendText });
        tx.textContent = t;
        g.appendChild(tx);
        x += 15 + tx.getComputedTextLength() + 28;
      });
      // 金环
      g.appendChild(el("circle", { cx: x, cy: Lg.y, r: 12, fill: "none", stroke: "#c9a24b", "stroke-width": 2, "stroke-dasharray": "3 2" }));
      const tx2 = el("text", { x: x + 17, y: Lg.y + 5, "font-size": fs, fill: P.legendText });
      tx2.textContent = "金环 = 短剧出场";
      g.appendChild(tx2);

      // 关系线
      const items = [
        ["父子·祖孙", { c: "parent", w: 2.1, arrow: true }],
        ["兄弟·叔侄", { c: "sibling", w: 1.5 }],
        ["夫妻(联姻)", { c: "couple", w: 1.6, double: true }],
        ["交游", { c: "social", w: 1.5, dash: true }],
        ["决裂", { c: "rupture", w: 1.5, dash: true }],
      ];
      let ix = Lg.startX;
      for (const [t, o] of items) {
        const gx = ix + 40;
        const lc = P.lines[o.c];
        if (o.double) {
          g.appendChild(el("line", { x1: ix, y1: Lg.y2 - 2, x2: gx, y2: Lg.y2 - 2, stroke: lc, "stroke-width": 1.4 }));
          g.appendChild(el("line", { x1: ix, y1: Lg.y2 + 2, x2: gx, y2: Lg.y2 + 2, stroke: lc, "stroke-width": 1.4 }));
        } else {
          g.appendChild(el("line", {
            x1: ix, y1: Lg.y2, x2: gx, y2: Lg.y2, stroke: lc, "stroke-width": o.w,
            "stroke-dasharray": o.dash ? "5 4" : null,
          }));
          if (o.arrow) {
            g.appendChild(el("polygon", { points: `${gx},${Lg.y2} ${gx - 8},${Lg.y2 - 4.2} ${gx - 8},${Lg.y2 + 4.2}`, fill: lc }));
          }
        }
        const tt = el("text", { x: gx + 12, y: Lg.y2 + 5, "font-size": Lg.lfont, fill: P.legendText });
        tt.textContent = t;
        g.appendChild(tt);
        ix = gx + 12 + tt.getComputedTextLength() + 34;
      }

      const n = el("text", {
        x: W / 2, y: Lg.noteY, "text-anchor": "middle", "font-size": 12.5, fill: P.inkFaint, "letter-spacing": 1,
      });
      n.textContent = D.meta.note;
      g.appendChild(n);
    }

    // —— 缩放平移 ——
    function applyTransform() { scene.setAttribute("transform", `translate(${tx} ${ty}) scale(${s})`); }
    svg.addEventListener("wheel", ev => {
      ev.preventDefault();
      s = Math.min(4, Math.max(0.4, s * (ev.deltaY < 0 ? 1.12 : 0.9)));
      applyTransform();
    }, { passive: false });
    let dragging = false, lx = 0, ly = 0;
    svg.addEventListener("mousedown", ev => { dragging = true; lx = ev.clientX; ly = ev.clientY; });
    window.addEventListener("mousemove", ev => {
      if (!dragging) return;
      tx += ev.clientX - lx; ty += ev.clientY - ly; lx = ev.clientX; ly = ev.clientY;
      applyTransform();
    });
    window.addEventListener("mouseup", () => (dragging = false));
    svg.addEventListener("dblclick", () => { tx = ty = 0; s = 1; applyTransform(); });
    window.addEventListener("click", closeCard);

    // —— 人物小传卡片 ——
    const card = document.getElementById("card");
    function showCard(p, ev) {
      const html =
        `<span class="close" onclick="window.__closeCard()">✕</span>` +
        `<h3>${p.name}<span style="font-size:13px;color:#9a9285">（字${p.zi.replace(/^字/, "")}）</span></h3>` +
        `<div class="meta">${p.clan} · ${p.title} · ${p.years}</div>` +
        `<div>${p.bio}</div>` +
        (p.ep ? `<div class="ep">🎬 出场：${p.ep.join("、")}</div>` : "");
      card.innerHTML = html;
      card.style.display = "block";
      const vw = window.innerWidth, vh = window.innerHeight;
      let x = ev.clientX + 14, y = ev.clientY - 20;
      if (x + 300 > vw) x = ev.clientX - 310;
      if (y + 260 > vh) y = vh - 270;
      card.style.left = Math.max(6, x) + "px";
      card.style.top = Math.max(6, y) + "px";
    }
    window.__closeCard = () => (card.style.display = "none");
    function closeCard() { card.style.display = "none"; }
    card.addEventListener("click", e => e.stopPropagation());

    // —— 主题切换 ——
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = dark ? "浅色" : "深色";
      btn.onclick = () => { dark = !dark; btn.textContent = dark ? "浅色" : "深色"; render(); };
    }

    render();
  }

  window.initShishuo = initShishuo;
})();
