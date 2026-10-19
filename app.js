"use strict";
const CATS = [
  { id: "animales", name: "Animales", em: "🦁", c: "#f59e0b" },
  { id: "videojuegos", name: "Videojuegos", em: "🎮", c: "#8b5cf6" },
  { id: "pokemon", name: "Pokémon", em: "⚡", c: "#facc15" },
  { id: "ciencia", name: "Ciencia", em: "🔬", c: "#06b6d4" },
  { id: "comida", name: "Comida", em: "🍕", c: "#ef4444" },
  { id: "cine", name: "Cine y series", em: "🎬", c: "#ec4899" },
  { id: "mezcla", name: "Mezcla total", em: "🌀", c: "#10b981", wide: true },
];
const COLORS = ["#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#ef4444","#6366f1","#84cc16","#f97316","#14b8a6","#d946ef","#3b82f6"];
const $app = document.getElementById("app");
const bg = document.querySelector(".bg");

// ---------- palabras ----------
const parsed = {};
function entries(id) {
  if (parsed[id]) return parsed[id];
  const out = [], seen = new Set();
  for (const line of (WORDS[id] || "").split("\n")) {
    const [w, h] = line.split("|").map(s => s && s.trim());
    if (!w || !h) continue;
    const lw = w.toLowerCase(), lh = h.toLowerCase();
    if (seen.has(lw) || lh.includes(lw) || lw.includes(lh)) continue; // la pista no puede delatar la palabra
    seen.add(lw); out.push({ w, h });
  }
  return (parsed[id] = out);
}
function pool(id) {
  if (id !== "mezcla") return entries(id);
  const seen = new Set();
  return CATS.filter(c => c.id !== "mezcla" && !S.veto.includes(c.id)).flatMap(c => entries(c.id)).filter(e => !seen.has(e.w) && seen.add(e.w));
}
function recent() { try { return JSON.parse(localStorage.getItem("imp_recent") || "[]"); } catch { return []; } }
function pickWord(id) {
  const all = pool(id), rec = new Set(recent());
  const fresh = all.filter(e => !rec.has(e.w));
  const list = fresh.length > 20 ? fresh : all;
  const e = list[Math.floor(Math.random() * list.length)];
  try { localStorage.setItem("imp_recent", JSON.stringify([e.w, ...recent()].slice(0, 400))); } catch {}
  return e;
}

// ---------- estado ----------
const S = {
  n: 4, names: [], cat: null, knows: true,
  veto: [], starter: 0, impostor: 0, entry: null, step: 0, alive: [], pick: null,
};
try {
  const sv = JSON.parse(localStorage.getItem("imp_save") || "{}");
  if (sv.n) S.n = sv.n; if (sv.names) S.names = sv.names; if (Array.isArray(sv.veto)) S.veto = sv.veto; if (typeof sv.knows === "boolean") S.knows = sv.knows;
} catch {}
function save() { try { localStorage.setItem("imp_save", JSON.stringify({ n: S.n, names: S.names, knows: S.knows, veto: S.veto })); } catch {} }
const nm = i => S.names[i] || `Jugador ${i + 1}`;
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const av = (i, big) => `<div class="av${big ? " big" : ""}" style="background:${COLORS[i % 12]};color:${COLORS[i % 12]}"><span style="color:#fff">${esc(nm(i).trim()[0] || "?").toUpperCase()}</span></div>`;
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
function toast(t) { const el = document.getElementById("toast"); el.textContent = t; el.classList.add("on"); setTimeout(() => el.classList.remove("on"), 1800); }
function mood(m) { bg.className = "bg " + (m || ""); }
function show(html, after) { $app.innerHTML = `<section class="screen">${html}</section>`; after && after($app.firstChild); }
function confetti() {
  const d = document.createElement("div"); d.className = "confetti";
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.cssText = `left:${Math.random() * 100}%;background:${COLORS[i % 12]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .8}s`;
    d.appendChild(p);
  }
  document.body.appendChild(d); setTimeout(() => d.remove(), 5500);
}

// ---------- pantallas ----------
function home() {
  mood();
  show(`
    <div class="center">
      <svg class="logo" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
        <path d="M50 8c-20 0-34 15-34 36v34c0 4 4 6 7 4l7-5 7 6c2 2 5 2 7 0l5-5 5 5c2 2 5 2 7 0l7-6 7 5c3 2 7 0 7-4V44C84 23 70 8 50 8z" fill="url(#g)"/>
        <path d="M30 40q20-10 40 0 0 14-8 18-12 4-24 0-8-4-8-18z" fill="#0d0a1f"/><circle cx="41" cy="46" r="4" fill="#fff"/><circle cx="59" cy="46" r="4" fill="#fff"/></svg>
      <h1><span class="grad">IMPOSTOR</span></h1>
      <p class="sub">Un móvil. Un secreto.<br>Un traidor entre vosotros.</p>
    </div>
    <button class="btn" id="go">Jugar</button>`, s => s.querySelector("#go").onclick = count);
}

function count() {
  show(`
    <button class="back" id="b">← Inicio</button>
    <div class="center">
      <h2>¿Cuántos jugáis?</h2><p class="sub">De 3 a 12 jugadores</p>
      <div class="stepper"><button id="m">−</button><b id="v">${S.n}</b><button id="p">+</button></div>
      <div class="dots" id="d"></div>
    </div>
    <button class="btn" id="ok">Continuar</button>`, s => {
    const upd = () => { s.querySelector("#v").textContent = S.n; s.querySelector("#d").innerHTML = "<i></i>".repeat(S.n); };
    upd();
    s.querySelector("#m").onclick = () => { if (S.n > 3) { S.n--; upd(); vib(8); } else toast("Mínimo 3 jugadores"); };
    s.querySelector("#p").onclick = () => { if (S.n < 12) { S.n++; upd(); vib(8); } else toast("Máximo 12 jugadores"); };
    s.querySelector("#b").onclick = home;
    s.querySelector("#ok").onclick = () => { save(); names(); };
  });
}

function names() {
  const fields = Array.from({ length: S.n }, (_, i) => `
    <label class="field">${av(i)}<input data-i="${i}" maxlength="14" placeholder="Jugador ${i + 1}" value="${esc(S.names[i] || "")}" autocomplete="off" enterkeyhint="next"></label>`).join("");
  show(`
    <button class="back" id="b">← Atrás</button>
    <h2>¿Cómo os llamáis?</h2><p class="sub" style="margin-bottom:14px">El orden de los nombres es el orden de juego.</p>
    <div class="scroll">${fields}</div>
    <div class="gap"></div><button class="btn" id="ok">Elegir categoría</button>`, s => {
    const ins = [...s.querySelectorAll("input")];
    ins.forEach((inp, k) => {
      inp.oninput = () => { S.names[+inp.dataset.i] = inp.value.trim(); const a = inp.parentNode.querySelector(".av span"); a.textContent = (inp.value.trim()[0] || "?").toUpperCase(); };
      inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); (ins[k + 1] || inp).focus(); if (!ins[k + 1]) inp.blur(); } };
    });
    s.querySelector("#b").onclick = count;
    s.querySelector("#ok").onclick = () => {
      S.names = S.names.slice(0, S.n);
      for (let i = 0; i < S.n; i++) S.names[i] = (S.names[i] || "").trim();
      const low = S.names.map((x, i) => (x || `Jugador ${i + 1}`).toLowerCase());
      if (new Set(low).size < low.length) return toast("Hay nombres repetidos");
      save(); categories();
    };
  });
}

function mixInfo() { return S.veto.length ? `${CATS.length - 1 - S.veto.length} de ${CATS.length - 1} categorías` : "Todas las categorías juntas"; }
function categories() {
  const cards = CATS.map(c => `
    <button class="cat${c.wide ? " wide" : ""}${S.cat === c.id ? " sel" : ""}" data-id="${c.id}" style="--c:${c.c}">
      <span class="em">${c.em}</span><div><b>${c.name}</b><small>${c.id === "mezcla" ? mixInfo() : pool(c.id).length + " palabras"}</small></div></button>`).join("");
  const chips = CATS.filter(c => c.id !== "mezcla").map(c => `<button class="chip${S.veto.includes(c.id) ? " off" : ""}" data-v="${c.id}">${c.em} ${c.name}</button>`).join("");
  show(`
    <button class="back" id="b">← Atrás</button>
    <h2>Elige categoría</h2>
    <div class="scroll">
      <div class="modes">
        <button class="mode${S.knows ? " sel" : ""}" data-k="1"><span class="em">😈</span><b>Sabe que es impostor</b><small>Ve “IMPOSTOR” y una pista</small></button>
        <button class="mode${!S.knows ? " sel" : ""}" data-k="0"><span class="em">🎭</span><b>No lo sabe</b><small>Cree ser inocente. Sin presión</small></button>
      </div>
      <div class="cats">${cards}</div>
      <div class="vetobox"><button class="vetotab" id="vt">🚫 Vetar categorías de la mezcla <i id="vc">${S.veto.length ? S.veto.length + " vetadas" : ""}</i><span>▾</span></button>
        <div class="vetopanel" id="vp"><p class="sub">Toca para vetar. Las vetadas no saldrán en “Mezcla total”.</p><div class="chips">${chips}</div></div></div>
    </div>
    <button class="btn" id="ok" ${S.cat ? "" : "disabled"}>¡Empezar partida!</button>`, s => {
    s.querySelectorAll(".cat").forEach(b => b.onclick = () => {
      S.cat = b.dataset.id; vib(10);
      s.querySelectorAll(".cat").forEach(x => x.classList.toggle("sel", x === b));
      s.querySelector("#ok").disabled = false;
    });
    s.querySelectorAll(".mode").forEach(b => b.onclick = () => {
      S.knows = b.dataset.k === "1"; save();
      s.querySelectorAll(".mode").forEach(x => x.classList.toggle("sel", x === b));
    });
    s.querySelector("#vt").onclick = () => s.querySelector(".vetobox").classList.toggle("open");
    s.querySelectorAll(".chip").forEach(b => b.onclick = () => {
      const id = b.dataset.v, on = S.veto.includes(id);
      if (!on && S.veto.length >= CATS.length - 2) return toast("Deja al menos 1 categoría en la mezcla");
      S.veto = on ? S.veto.filter(x => x !== id) : [...S.veto, id]; save();
      b.classList.toggle("off", !on);
      s.querySelector("#vc").textContent = S.veto.length ? S.veto.length + " vetadas" : "";
      s.querySelector('.cat[data-id="mezcla"] small').textContent = mixInfo();
    });
    s.querySelector("#b").onclick = names;
    s.querySelector("#ok").onclick = startGame;
  });
}

function startGame() {
  S.entry = pickWord(S.cat);
  S.impostor = Math.floor(Math.random() * S.n);
  S.starter = Math.floor(Math.random() * S.n);
  S.step = 0; S.alive = [...Array(S.n).keys()]; S.pick = null;
  passScreen();
}
const seat = k => (S.starter + k) % S.n;

function intro() {
  mood();
  show(`
    <div class="center">
      <p class="pill">Empieza</p>
      ${av(S.starter, true)}
      <div class="name-big grad">${esc(nm(S.starter))}</div>
      <p class="sub">Después seguirá el orden de la lista.<br>Pasaos el móvil uno a uno.</p>
    </div>
    <button class="btn" id="ok">Entendido</button>`, s => s.querySelector("#ok").onclick = passScreen);
}

function passScreen() {
  const p = seat(S.step);
  mood();
  show(`
    <div class="center">
      <p class="pill">Jugador ${S.step + 1} de ${S.n}</p>
      <p class="bignum">Pásale el móvil a</p>
      ${av(p, true)}
      <div class="name-big">${esc(nm(p))}</div>
      <p class="sub">Que nadie más mire la pantalla 👀</p>
    </div>
    <button class="btn" id="ok">Soy ${esc(nm(p))}</button>`, s => s.querySelector("#ok").onclick = () => revealScreen(p));
}

function revealScreen(p) {
  const isImp = p === S.impostor;
  let body;
  if (isImp && S.knows) body = `<span class="role imp">Impostor</span><div class="lbl">Tu pista</div><div class="word">${esc(S.entry.h)}</div><p class="sub" style="margin-top:10px">Descubre la palabra sin que te pillen</p>`;
  else if (isImp) body = `<span class="role unk">Inocente</span><div class="lbl">Tu palabra</div><div class="word">${esc(S.entry.h)}</div>`;
  else body = `<span class="role inn">Inocente</span><div class="lbl">La palabra es</div><div class="word">${esc(S.entry.w)}</div><p class="sub" style="margin-top:10px">Da pistas sin delatarte</p>`;
  const cls = isImp && S.knows ? "imp" : "inn";
  show(`
    <div class="center" style="flex:none;gap:2px"><p class="bignum">Turno de</p><div class="name-big" style="font-size:34px">${esc(nm(p))}</div></div>
    <div class="stage" id="st">
      <div class="reveal ${cls}">${body}</div>
      <div class="curtain" id="cu"><span class="arrow">☝️</span><b>Desliza hacia arriba</b><span class="hint">para ver tu palabra</span></div>
    </div>
    <button class="btn" id="ok" disabled>Ocultar y pasar</button>`, s => {
    const cu = s.querySelector("#cu"), st = s.querySelector("#st"), ok = s.querySelector("#ok");
    let y0 = null, dy = 0, open = false;
    cu.onpointerdown = e => { if (open) return; y0 = e.clientY; cu.classList.remove("snap"); cu.setPointerCapture(e.pointerId); };
    cu.onpointermove = e => { if (y0 === null) return; dy = Math.min(0, e.clientY - y0); cu.style.transform = `translateY(${dy}px)`; };
    const end = () => {
      if (y0 === null) return; y0 = null; cu.classList.add("snap");
      if (-dy > st.clientHeight * .4) { open = true; cu.style.transform = "translateY(-105%)"; ok.disabled = false; vib(25); }
      else { cu.style.transform = ""; }
      dy = 0;
    };
    cu.onpointerup = cu.onpointercancel = end;
    ok.onclick = () => {
      S.step++;
      if (S.step < S.n) passScreen(); else round();
    };
  });
}

function round() {
  mood();
  const rows = S.alive.slice().sort((a, b) => ((a - S.starter + S.n) % S.n) - ((b - S.starter + S.n) % S.n)).map((p, k) => `
    <div class="ord${k === 0 ? " first" : ""}"><span class="n">${k + 1}</span>${av(p)}<span>${esc(nm(p))}</span>${k === 0 ? '<i class="tag">EMPIEZA</i>' : ""}</div>`).join("");
  show(`
    <h2>¡A debatir!</h2>
    <p class="sub" style="margin-bottom:14px">Cada uno dice una palabra o frase relacionada. Cuando queráis, pasad a votar.</p>
    <div class="scroll"><div class="order">${rows}</div></div>
    <div class="gap"></div><button class="btn" id="ok">🗳️ Votar</button>`, s => s.querySelector("#ok").onclick = () => { S.pick = null; vote(); });
}

function vote() {
  mood();
  const rows = S.alive.map(p => `<button class="vote${S.pick === p ? " sel" : ""}" data-p="${p}">${av(p)}<span>${esc(nm(p))}</span></button>`).join("");
  show(`
    <h2>¿Quién es el impostor?</h2><p class="sub" style="margin-bottom:14px">Votad entre todos y tocad al elegido.</p>
    <div class="scroll">${rows}</div>
    <div class="gap"></div><button class="btn bad" id="ok" ${S.pick === null ? "disabled" : ""}>Expulsar</button><div class="gap"></div><button class="btn ghost" id="fin">🏁 Terminar partida</button>`, s => {
    s.querySelector("#fin").onclick = giveUp;
    s.querySelectorAll(".vote").forEach(b => b.onclick = () => {
      S.pick = +b.dataset.p; vib(10);
      s.querySelectorAll(".vote").forEach(x => x.classList.toggle("sel", x === b));
      const ok = s.querySelector("#ok"); ok.disabled = false; ok.textContent = `Expulsar a ${nm(S.pick)}`;
    });
    s.querySelector("#ok").onclick = resolve;
  });
}

function resolve() {
  const p = S.pick;
  if (p === S.impostor) return win(p);
  S.alive = S.alive.filter(x => x !== p);
  vib([60, 40, 60]); mood("danger");
  const last = S.alive.length <= 2;
  show(`
    <div class="center shake">
      <div class="emoji">💀</div>
      <h2>¡Habéis matado a un inocente!</h2>
      ${av(p, true)}
      <div class="name-big">${esc(nm(p))}</div>
      <p class="sub">${last ? "Solo quedáis dos… el impostor se sale con la suya." : `Quedan ${S.alive.length} jugadores. El impostor sigue entre vosotros.`}</p>
    </div>
    <button class="btn" id="ok">${last ? "Ver resultado" : "Seguir jugando"}</button>`, s => s.querySelector("#ok").onclick = last ? lose : round);
}

function summary() {
  return `<div class="box"><span class="sub">El impostor era</span><b>${esc(nm(S.impostor))}</b></div>
    <div class="box"><span class="sub">La palabra era</span><b class="grad">${esc(S.entry.w)}</b><span class="sub">pista del impostor: ${esc(S.entry.h)}</span></div>`;
}
function endButtons() {
  return `<button class="btn" id="again">Otra ronda</button><div class="gap"></div><button class="btn ghost" id="menu">Cambiar jugadores</button>`;
}
function bindEnd(s) {
  s.querySelector("#again").onclick = categories;
  s.querySelector("#menu").onclick = count;
}
function giveUp() {
  mood();
  show(`
    <div class="center">
      <div class="emoji">🏁</div>
      <h2>Partida terminada</h2>
      ${av(S.impostor, true)}
      ${summary()}
    </div>${endButtons()}`, bindEnd);
}
function win(p) {
  mood("good"); vib([80, 50, 80, 50, 160]); confetti();
  show(`
    <div class="center">
      <div class="emoji">🎉</div>
      <h2>¡Habéis pillado al impostor!</h2>
      ${av(p, true)}
      ${summary()}
    </div>${endButtons()}`, bindEnd);
}
function lose() {
  mood("danger");
  show(`
    <div class="center">
      <div class="emoji">😈</div>
      <h2>¡Gana el impostor!</h2>
      ${av(S.impostor, true)}
      ${summary()}
    </div>${endButtons()}`, bindEnd);
}

// ---------- arranque ----------
document.addEventListener("contextmenu", e => e.preventDefault());
home();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
