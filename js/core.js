/* English Daily - ядро: состояние, SRS, план дня, прогресс, настройки */
"use strict";
const App = {};

/* ---------- утилиты ---------- */
App.$ = (s, root) => (root || document).querySelector(s);
App.$$ = (s, root) => Array.from((root || document).querySelectorAll(s));
App.el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
App.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
App.norm = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
App.dayStr = (d) => {
  const x = d || new Date();
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
};
App.dayNum = () => Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 864e5);
App.shuffle = (arr, seed) => {
  const a = arr.slice(); let s = seed || 42;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
App.toast = (msg) => {
  const t = App.$("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(App._toastT); App._toastT = setTimeout(() => t.classList.remove("show"), 2600);
};
App.sim = (a, b) => { // похожесть двух слов 0..1 (для проверки произношения)
  a = App.norm(a); b = App.norm(b);
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
};

/* ---------- состояние ---------- */
const DEFAULTS = {
  v: 1, srs: {}, favs: [], log: {}, readingDone: {}, grammarStats: {},
  writingDone: {}, speakLog: [],
  settings: { newPerDay: 10, accent: "en-GB", remindTime: "19:00", notif: false, theme: "auto" }
};
App.load = () => {
  try {
    const raw = localStorage.getItem("eng.v1");
    App.state = raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULTS));
    App.state.settings = Object.assign({}, DEFAULTS.settings, App.state.settings);
  } catch (e) { App.state = JSON.parse(JSON.stringify(DEFAULTS)); }
};
App.save = () => { try { localStorage.setItem("eng.v1", JSON.stringify(App.state)); } catch (e) { App.toast("Не удалось сохранить прогресс"); } };

App.todayLog = () => {
  const d = App.dayStr();
  if (!App.state.log[d]) App.state.log[d] = { review: 0, new: 0, reading: 0, grammar: 0, writing: 0, speaking: 0, newCount: 0, gCount: 0, revCount: 0, newIds: null };
  return App.state.log[d];
};
App.points = (d) => {
  const l = App.state.log[d]; if (!l) return 0;
  return ["review", "new", "reading", "grammar", "writing", "speaking"].reduce((s, k) => s + (l[k] ? 1 : 0), 0);
};
App.streak = () => {
  let n = 0; const today = new Date();
  if (App.points(App.dayStr(today)) < 4) today.setDate(today.getDate() - 1); // сегодня ещё не закрыт - не рвём серию
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (App.points(App.dayStr(d)) >= 4) n++; else break;
  }
  return n;
};
App.bestStreak = () => {
  const days = Object.keys(App.state.log).filter((d) => App.points(d) >= 4).sort();
  let best = 0, cur = 0, prev = null;
  for (const d of days) {
    if (prev) { const diff = (new Date(d) - new Date(prev)) / 864e5; cur = diff === 1 ? cur + 1 : 1; }
    else cur = 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
};
App.markBlock = (name) => {
  const l = App.todayLog();
  if (l[name]) return;
  l[name] = 1; App.save();
  App.$("#streakN").textContent = App.streak();
  const p = App.points(App.dayStr());
  if (p === 6) { App.confetti(); App.toast("🏆 Идеальный день! Все 6 блоков закрыты"); }
  else if (p === 4) App.toast("🔥 День в зачёте! Серия продолжается");
  else App.toast("✓ Блок закрыт: " + p + " из 6");
};
App.confetti = () => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#14532D", "#B45309", "#2F7D4F", "#E2A62F", "#7FC79A"];
  for (let i = 0; i < 44; i++) {
    const c = document.createElement("div"); c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.9 + "s";
    c.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    document.body.appendChild(c); setTimeout(() => c.remove(), 3600);
  }
};

/* ---------- пул слов и SRS (упрощённый SM-2) ---------- */
App.buildPool = () => {
  App.pool = {};
  (window.WORDS || []).forEach((w) => { App.pool[w.id] = w; });
  (window.READING || []).forEach((r) => (r.vocab || []).forEach((v) => {
    if (!App.pool[v.id]) App.pool[v.id] = Object.assign({ topic: "reading", lvl: r.lvl || "B2" }, v);
  }));
};
App.due = () => {
  const now = Date.now();
  return Object.keys(App.state.srs).filter((id) => App.pool[id] && App.state.srs[id].reps > 0 && App.state.srs[id].due <= now);
};
App.newIdsToday = () => {
  const l = App.todayLog();
  if (l.newIds) return l.newIds.filter((id) => App.pool[id]);
  const seen = new Set(Object.keys(App.state.srs));
  const groups = window.DECKS || {};
  const per = App.state.settings.newPerDay;
  const dn = App.dayNum();
  const pickFrom = (topics, count, rotIdx) => {
    const out = [];
    for (let t = 0; t < topics.length && out.length < count; t++) {
      const topic = topics[(rotIdx + t) % topics.length];
      const cand = (window.WORDS || []).filter((w) => w.topic === topic && !seen.has(w.id) && !out.includes(w.id));
      for (const w of cand) { if (out.length < count) out.push(w.id); else break; }
    }
    return out;
  };
  const nCore = Math.max(1, Math.round(per * 0.6)), nBiz = Math.max(1, Math.round(per * 0.2));
  const nLex = Math.max(1, per - nCore - nBiz);
  let ids = [
    ...pickFrom(groups.core || [], nCore, dn % (groups.core || [1]).length),
    ...pickFrom(groups.biz || [], nBiz, dn % (groups.biz || [1]).length),
    ...pickFrom(groups.lexis || [], nLex, dn % (groups.lexis || [1]).length)
  ];
  if (ids.length < per) { // добираем из любых непройденных
    const rest = (window.WORDS || []).filter((w) => !seen.has(w.id) && !ids.includes(w.id)).map((w) => w.id);
    ids = ids.concat(rest.slice(0, per - ids.length));
  }
  l.newIds = ids; App.save();
  return ids;
};
App.grade = (id, q) => { // q: 0 снова, 1 трудно, 2 хорошо, 3 легко
  const s = App.state.srs[id] || { ef: 2.5, ivl: 0, reps: 0, lapses: 0 };
  const l = App.todayLog();
  const isNew = s.reps === 0;
  if (q === 0) {
    s.lapses++; s.reps = Math.min(s.reps, 1); s.ivl = 0;
    s.due = Date.now() + 10 * 60 * 1000; // вернётся через 10 минут
  } else {
    if (s.reps === 0) s.ivl = q === 3 ? 4 : 1;
    else if (s.reps === 1) s.ivl = q === 3 ? 6 : 3;
    else s.ivl = Math.max(s.ivl + 1, Math.round(s.ivl * (q === 1 ? 1.2 : q === 2 ? s.ef : s.ef * 1.35)));
    if (q === 1) s.ef = Math.max(1.3, s.ef - 0.15);
    if (q === 3) s.ef = Math.min(3, s.ef + 0.1);
    s.reps++;
    const d = new Date(); d.setHours(3, 0, 0, 0); d.setDate(d.getDate() + s.ivl);
    s.due = d.getTime();
  }
  App.state.srs[id] = s;
  if (isNew && q > 0) {
    l.newCount++;
    if (l.newCount >= Math.min(App.state.settings.newPerDay, App.newIdsToday().length)) App.markBlock("new");
  }
  if (!isNew) { l.revCount++; if (App.due().length === 0) App.markBlock("review"); }
  App.save();
};
App.srsStats = () => {
  let learning = 0, mature = 0;
  Object.keys(App.state.srs).forEach((id) => {
    const s = App.state.srs[id];
    if (s.reps > 0) { if (s.ivl >= 21) mature++; else learning++; }
  });
  return { learning, mature, total: learning + mature };
};
App.fav = (id) => {
  const i = App.state.favs.indexOf(id);
  if (i >= 0) App.state.favs.splice(i, 1); else App.state.favs.push(id);
  App.save();
  return i < 0;
};

/* ---------- озвучка и распознавание ---------- */
App.speak = (text, rate) => {
  if (!("speechSynthesis" in window)) return App.toast("Озвучка не поддерживается в этом браузере");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const want = App.state.settings.accent;
  const vs = speechSynthesis.getVoices();
  u.voice = vs.find((v) => v.lang.replace("_", "-") === want) || vs.find((v) => v.lang.startsWith("en")) || null;
  u.lang = want; u.rate = rate || 0.95;
  speechSynthesis.speak(u);
};
App.recogSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
App.isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
App.srAdvice = () => {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (App.isIOS()) return standalone
    ? "На iPhone распознавание не работает из иконки на главном экране - открой сайт в Safari (сама запись работает и здесь)."
    : "На iPhone распознавание работает в Safari при включённой «Siri и Диктовка» (Настройки → Siri). Иногда отвечает с задержкой - подожди пару секунд.";
  return "Распознавание речи лучше всего работает в Chrome (Android или компьютер).";
};
App.recog = (opts) => {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return null;
  const r = new R();
  r.lang = "en-US"; r.interimResults = !!(opts && opts.interim); r.continuous = !!(opts && opts.continuous);
  r.maxAlternatives = 3;
  return r;
};

/* ---------- вкладка «Сегодня» ---------- */
App.PLAN = [
  { key: "review", icon: "🔁", t: "Повторить слова", tab: "words", d: () => { const n = App.due().length; return n ? n + " к повторению" : "на сегодня повторений нет"; } },
  { key: "new", icon: "✨", t: "Выучить новые слова", tab: "words", d: () => { const l = App.todayLog(); return l.newCount + " из " + Math.min(App.state.settings.newPerDay, App.newIdsToday().length); } },
  { key: "reading", icon: "📖", t: "Прочитать текст дня", tab: "reading", d: () => "5-7 минут + вопросы" },
  { key: "grammar", icon: "🧩", t: "Грамматика дня", tab: "grammar", d: () => { const g = App.grammarTopicOfDay(); return g ? g.title + " · 5 заданий" : ""; } },
  { key: "writing", icon: "✍️", t: "Мини-письмо", tab: "writing", d: () => "одно короткое упражнение" },
  { key: "speaking", icon: "🎙", t: "Вопрос дня вслух", tab: "speaking", d: () => "запиши ответ 30-60 секунд" }
];
App.grammarTopicOfDay = () => {
  const g = window.GRAMMAR || [];
  return g.length ? g[App.dayNum() % g.length] : null;
};
App.qotd = () => {
  const q = (window.SPEAKING && window.SPEAKING.daily) || [];
  return q.length ? q[App.dayNum() % q.length] : "";
};
App.wordOfDay = () => {
  const ws = window.WORDS || [];
  return ws.length ? ws[App.dayNum() * 7 % ws.length] : null;
};
App.renderToday = () => {
  const root = App.$("#tab-today"); root.innerHTML = "";
  const l = App.todayLog();
  if (App.due().length === 0 && !l.review && l.revCount === 0 && Object.keys(App.state.srs).length > 0) l.review = 1; // нечего повторять - блок закрыт
  const p = App.points(App.dayStr());
  const head = App.el(`<div class="card accent">
    <div class="eyebrow">План на сегодня · ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })}</div>
    <div class="spread"><h2 style="margin:0">${p >= 6 ? "Идеальный день 🏆" : p >= 4 ? "День в зачёте 🔥" : "20-30 минут - и день в зачёте"}</h2>
    <span class="qcount">${p} / 6</span></div>
    <div class="pbar"><i style="width:${Math.round(p / 6 * 100)}%"></i></div>
    <div class="small muted">Серия засчитывается от 4 закрытых блоков. Все 6 - идеальный день.</div>
    <div id="planList"></div></div>`);
  root.appendChild(head);
  const list = App.$("#planList", head);
  App.PLAN.forEach((b) => {
    const done = !!l[b.key];
    const it = App.el(`<div class="plan-item ${done ? "done" : ""}">
      <div class="st">${done ? "✓" : b.icon}</div>
      <div><div class="t">${b.t}</div><div class="small muted">${b.d()}</div></div>
      <button class="btn soft go">${done ? "Ещё" : "Начать"}</button></div>`);
    App.$(".go", it).onclick = () => App.go(b.tab);
    list.appendChild(it);
  });
  const w = App.wordOfDay();
  if (w) {
    const wc = App.el(`<div class="card"><div class="eyebrow">Слово дня</div>
      <div class="spread"><div><span class="word-hero">${App.esc(w.w)}</span><span class="ipa">${App.esc(w.ipa || "")}</span><span class="pos">${App.esc(w.pos || "")}</span>
      <div class="muted">${App.esc(w.ru)}</div></div>
      <button class="speak">🔊 Послушать</button></div>
      <div class="ex">${App.esc(w.ex && w.ex[0] || "")}</div></div>`);
    App.$(".speak", wc).onclick = () => App.speak(w.w + ". " + (w.ex && w.ex[0] || ""));
    root.appendChild(wc);
  }
  const st = App.srsStats();
  root.appendChild(App.el(`<div class="card"><div class="eyebrow">Мотивация</div>
    <p class="small" style="margin:0">В активном словаре уже <b>${st.total}</b> слов (${st.mature} закреплено).
    10 новых слов в день - это ~300 в месяц и ~1800 к следующему IELTS. Разрыв между Band 6 и Band 7 - это в первую очередь лексика и скорость чтения.</p></div>`));
};

/* ---------- вкладка «Прогресс» ---------- */
App.renderProgress = () => {
  const root = App.$("#tab-progress"); root.innerHTML = "";
  const st = App.srsStats();
  const perfect = Object.keys(App.state.log).filter((d) => App.points(d) === 6).length;
  const active = Object.keys(App.state.log).filter((d) => App.points(d) > 0).length;
  const reads = Object.keys(App.state.readingDone).length;
  const rd = Object.values(App.state.readingDone);
  const avgWpm = rd.length ? Math.round(rd.reduce((s, r) => s + (r.wpm || 0), 0) / rd.length) : 0;
  const avgScore = rd.length ? Math.round(rd.reduce((s, r) => s + r.score / r.total * 100, 0) / rd.length) : 0;
  let gr = 0, gw = 0;
  Object.values(App.state.grammarStats).forEach((g) => { gr += g.right; gw += g.wrong; });
  const spk = App.state.speakLog.length;
  root.appendChild(App.el(`<div class="card">
    <div class="eyebrow">Статистика</div><h2>Твой прогресс</h2>
    <div class="statgrid">
      <div class="stat"><b>${App.streak()}</b><span>🔥 серия сейчас</span></div>
      <div class="stat"><b>${App.bestStreak()}</b><span>лучшая серия</span></div>
      <div class="stat"><b>${perfect}</b><span>🏆 идеальных дней</span></div>
      <div class="stat"><b>${active}</b><span>дней с занятиями</span></div>
      <div class="stat"><b>${st.total}</b><span>слов в работе</span></div>
      <div class="stat"><b>${st.mature}</b><span>слов закреплено</span></div>
      <div class="stat"><b>${reads}</b><span>текстов прочитано</span></div>
      <div class="stat"><b>${avgWpm || "-"}</b><span>скорость чтения, слов/мин</span></div>
      <div class="stat"><b>${avgScore ? avgScore + "%" : "-"}</b><span>понимание текстов</span></div>
      <div class="stat"><b>${gr + gw ? Math.round(gr / (gr + gw) * 100) + "%" : "-"}</b><span>грамматика верно</span></div>
      <div class="stat"><b>${Object.keys(App.state.writingDone).length}</b><span>письменных заданий</span></div>
      <div class="stat"><b>${spk}</b><span>записей речи</span></div>
    </div></div>`));
  // график 28 дней
  const bars = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    bars.push({ d: App.dayStr(d), p: App.points(App.dayStr(d)) });
  }
  const chart = App.el(`<div class="card"><div class="eyebrow">Последние 4 недели</div>
    <div class="chart">${bars.map((b) => `<i class="${b.p === 0 ? "zero" : b.p === 6 ? "full" : ""}" style="height:${Math.max(4, b.p / 6 * 100)}%" title="${b.d}: ${b.p}/6"></i>`).join("")}</div>
    <div class="chartlbl"><span>4 недели назад</span><span>сегодня</span></div>
    <p class="small muted" style="margin-top:8px">Высота столбика - закрытые блоки дня. Янтарный - идеальный день (6/6).</p></div>`);
  root.appendChild(chart);
  // цель
  const target = 1500;
  root.appendChild(App.el(`<div class="card"><div class="eyebrow">Путь к Band 7.0</div>
    <div class="spread"><span>Словарь: <b>${st.total}</b> из ~${target} новых слов к экзамену</span><span class="qcount">${Math.min(100, Math.round(st.total / target * 100))}%</span></div>
    <div class="pbar"><i style="width:${Math.min(100, Math.round(st.total / target * 100))}%"></i></div>
    <p class="small muted" style="margin:6px 0 0">Ориентир: полгода по 10 слов в день. Плюс скорость чтения: для Band 7 в Reading комфортно ~220-250 слов/мин по несложному тексту.</p></div>`));
};

/* ---------- вкладки, настройки, тема ---------- */
App.tabs = { today: () => App.renderToday(), progress: () => App.renderProgress() };
App.go = (name) => {
  App.$$("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"));
  App.$$("main section.tab").forEach((s) => s.classList.toggle("on", s.id === "tab-" + name));
  if (App.tabs[name]) App.tabs[name]();
  window.scrollTo({ top: 0 });
};
App.initTheme = () => {
  const t = App.state.settings.theme;
  if (t !== "auto") document.documentElement.dataset.theme = t;
  App.$("#themeBtn").onclick = () => {
    const cur = document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    App.state.settings.theme = next; App.save();
  };
};
App.initSettings = () => {
  const dlg = App.$("#settings");
  App.$("#setBtn").onclick = () => {
    App.$("#setNew").value = App.state.settings.newPerDay;
    App.$("#setAccent").value = App.state.settings.accent;
    App.$("#setTime").value = App.state.settings.remindTime;
    App.$("#setNotif").textContent = App.state.settings.notif ? "Включено ✓" : "Включить";
    dlg.showModal();
  };
  App.$("#setClose").onclick = () => {
    App.state.settings.newPerDay = +App.$("#setNew").value;
    App.state.settings.accent = App.$("#setAccent").value;
    App.state.settings.remindTime = App.$("#setTime").value || "19:00";
    App.save(); dlg.close(); App.renderToday(); App.scheduleReminder();
  };
  App.$("#setNotif").onclick = async () => {
    if (!("Notification" in window)) return App.toast("Уведомления не поддерживаются");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      App.state.settings.notif = true;
      App.state.settings.remindTime = App.$("#setTime").value || "19:00";
      App.save(); App.$("#setNotif").textContent = "Включено ✓";
      App.toast("Напоминания включены"); App.scheduleReminder();
    } else App.toast("Разрешение не выдано");
  };
  App.$("#icsBtn").onclick = () => {
    const t = App.$("#setTime").value || "19:00";
    const [hh, mm] = t.split(":").map(Number);
    const pad = (n) => String(n).padStart(2, "0");
    const start = new Date();
    if (start.getHours() > hh || (start.getHours() === hh && start.getMinutes() >= mm)) start.setDate(start.getDate() + 1);
    const d = start.getFullYear() + pad(start.getMonth() + 1) + pad(start.getDate());
    // время без таймзоны (floating) - календарь напомнит в 19:00 по местному, где бы ты ни была
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//English Daily//RU", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:english-daily@anna-kuguk.github.io",
      "DTSTAMP:" + d + "T000000Z",
      "DTSTART:" + d + "T" + pad(hh) + pad(mm) + "00",
      "DURATION:PT20M",
      "RRULE:FREQ=DAILY",
      "SUMMARY:🇬🇧 English Daily - 20 минут английского",
      "DESCRIPTION:План дня ждёт: https://anna-kuguk.github.io/english/",
      "URL:https://anna-kuguk.github.io/english/",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:English Daily - день в зачёт!", "TRIGGER:PT0S", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = "english-daily.ics";
    document.body.appendChild(a); a.click(); a.remove();
    App.toast("Файл скачан - открой его и подтверди добавление в календарь");
  };
  App.$("#expBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(App.state)); App.toast("Прогресс скопирован в буфер"); }
    catch (e) { prompt("Скопируй вручную:", JSON.stringify(App.state)); }
  };
  App.$("#impBtn").onclick = () => {
    const raw = prompt("Вставь сохранённый прогресс (JSON):");
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object" || !obj.srs) throw new Error("bad");
      App.state = Object.assign({}, DEFAULTS, obj); App.save();
      App.toast("Прогресс восстановлен"); App.go("today");
    } catch (e) { App.toast("Не похоже на сохранённый прогресс"); }
  };
  App.$("#resetBtn").onclick = () => {
    if (confirm("Точно сбросить весь прогресс? Это необратимо.")) {
      localStorage.removeItem("eng.v1"); App.load(); App.toast("Прогресс сброшен"); App.go("today");
      App.$("#streakN").textContent = "0";
    }
  };
};
App.scheduleReminder = () => {
  clearTimeout(App._remT);
  if (!App.state.settings.notif || !("Notification" in window) || Notification.permission !== "granted") return;
  const [h, m] = App.state.settings.remindTime.split(":").map(Number);
  const t = new Date(); t.setHours(h, m, 0, 0);
  if (t <= new Date()) t.setDate(t.getDate() + 1);
  App._remT = setTimeout(() => {
    if (App.points(App.dayStr()) < 4) {
      const msg = "20 минут английского - и день в зачёте. Серия: " + App.streak() + " 🔥";
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((r) => r.showNotification("English Daily", { body: msg, icon: "icon.svg" })).catch(() => new Notification("English Daily", { body: msg }));
      } else new Notification("English Daily", { body: msg });
    }
    App.scheduleReminder();
  }, t - new Date());
};

/* ---------- запуск ---------- */
document.addEventListener("DOMContentLoaded", () => {
  App.load(); App.buildPool();
  App.$("#streakN").textContent = App.streak();
  App.$$("#tabs button").forEach((b) => (b.onclick = () => App.go(b.dataset.tab)));
  App.initTheme(); App.initSettings(); App.scheduleReminder();
  if ("speechSynthesis" in window) speechSynthesis.getVoices(); // прогрев списка голосов
  App.go("today");
  if ("serviceWorker" in navigator && location.protocol === "https:")
    navigator.serviceWorker.register("sw.js").catch(() => {});
});
