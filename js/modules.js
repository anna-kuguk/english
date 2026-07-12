/* English Daily - модули вкладок: Слова, Чтение, Грамматика, Письмо, Речь */
"use strict";

/* ================= СЛОВА ================= */
(() => {
  let mode = "auto"; // review | new | browse | favs
  let queue = [], sessionDone = 0;

  const topicName = (t) => (window.TOPICS && window.TOPICS[t]) || t;

  const pronTest = (word, box) => {
    if (!App.recogSupported()) { box.innerHTML = '<div class="fb warn small">Распознавание речи не поддерживается этим браузером. Открой в Chrome.</div>'; return; }
    box.innerHTML = '<div class="fb info small">🎙 Слушаю... скажи слово вслух</div>';
    const r = App.recog();
    let got = false;
    r.onresult = (e) => {
      got = true;
      const alts = Array.from(e.results[0]).map((a) => a.transcript);
      const best = Math.max(...alts.map((a) => Math.max(...a.split(" ").map((t) => App.sim(t, word)), App.sim(a, word))));
      const heard = alts[0];
      box.innerHTML = best >= 0.72
        ? `<div class="fb ok small">✓ Отлично! Я услышала: «${App.esc(heard)}»</div>`
        : `<div class="fb no small">Похоже на «${App.esc(heard)}». Послушай ещё раз 🔊 и повтори - следи за ударением.</div>`;
    };
    r.onerror = () => { if (!got) box.innerHTML = '<div class="fb warn small">Не расслышала. Проверь доступ к микрофону и попробуй ещё.</div>'; };
    r.onend = () => { if (!got && !box.querySelector(".no,.warn,.ok")) box.innerHTML = '<div class="fb warn small">Тишина. Попробуй ещё раз.</div>'; };
    try { r.start(); } catch (e) { box.innerHTML = '<div class="fb warn small">Микрофон занят, попробуй ещё раз.</div>'; }
  };

  const wordCard = (w, full) => {
    const fav = App.state.favs.includes(w.id);
    const c = App.el(`<div class="card">
      <div class="spread">
        <div><span class="word-hero">${App.esc(w.w)}</span><span class="ipa">${App.esc(w.ipa || "")}</span><span class="pos">${App.esc(w.pos || "")}</span></div>
        <div class="row">
          <button class="star ${fav ? "on" : ""}" title="В избранное">⭐</button>
          <button class="speak">🔊</button>
        </div>
      </div>
      <div class="body"></div>
      <div class="pron" style="margin-top:8px"></div>
      <div class="row" style="margin-top:8px">
        <button class="btn soft small say">🎙 Произнести самой</button>
        <span class="badge">${App.esc(topicName(w.topic))}${w.lvl ? " · " + App.esc(w.lvl) : ""}</span>
      </div></div>`);
    App.$(".speak", c).onclick = () => App.speak(w.w);
    App.$(".star", c).onclick = (e) => e.target.classList.toggle("on", App.fav(w.id));
    App.$(".say", c).onclick = () => pronTest(w.w, App.$(".pron", c));
    if (full) App.$(".body", c).innerHTML = wordBody(w);
    return c;
  };

  const wordBody = (w) => `
    <div class="wsec"><b>Перевод</b>${App.esc(w.ru)}</div>
    ${w.def ? `<div class="wsec"><b>Definition</b>${App.esc(w.def)}</div>` : ""}
    ${(w.ex || []).map((e) => `<div class="ex">${App.esc(e)}</div>`).join("")}
    ${w.col && w.col.length ? `<div class="wsec"><b>Collocations</b><div class="tagline">${w.col.map((x) => `<span class="tag">${App.esc(x)}</span>`).join("")}</div></div>` : ""}
    ${w.syn && w.syn.length ? `<div class="wsec"><b>Синонимы</b><div class="tagline">${w.syn.map((x) => `<span class="tag">${App.esc(x)}</span>`).join("")}</div></div>` : ""}
    ${w.ant && w.ant.length ? `<div class="wsec"><b>Антонимы</b><div class="tagline">${w.ant.map((x) => `<span class="tag anti">${App.esc(x)}</span>`).join("")}</div></div>` : ""}`;

  const distractors = (w, n, field) => {
    const pool = (window.WORDS || []).filter((x) => x.id !== w.id && x.pos === w.pos);
    const src = pool.length >= n ? pool : (window.WORDS || []).filter((x) => x.id !== w.id);
    return App.shuffle(src, Date.now() % 99991).slice(0, n).map((x) => x[field]);
  };

  const gradeButtons = (id, after) => {
    const g = App.el(`<div class="grades">
      <button class="g0">Снова<small>через 10 мин</small></button>
      <button class="g1">Трудно<small>меньший шаг</small></button>
      <button class="g2">Хорошо<small>по плану</small></button>
      <button class="g3">Легко<small>больший шаг</small></button></div>`);
    [0, 1, 2, 3].forEach((q) => { App.$(".g" + q, g).onclick = () => { App.grade(id, q); after(q); }; });
    return g;
  };

  const renderReview = (root) => {
    if (!queue.length) {
      root.appendChild(App.el(`<div class="card"><h2>Повторения на сегодня закрыты 🎉</h2>
        <p class="muted">Повторено: ${sessionDone}. Интервалы подобраны так, чтобы слово всплывало прямо перед тем, как забудется.</p>
        <button class="btn primary" id="toNew">К новым словам</button></div>`));
      App.$("#toNew", root).onclick = () => { mode = "new"; render(); };
      return;
    }
    const id = queue[0], w = App.pool[id], s = App.state.srs[id] || { reps: 0 };
    root.appendChild(App.el(`<div class="spread"><span class="qcount">Осталось: ${queue.length}</span><span class="qcount">Повторено: ${sessionDone}</span></div>`));
    const kind = s.reps % 3; // 0 карточка, 1 выбор перевода, 2 пропуск в примере
    const next = () => { queue.shift(); sessionDone++; render(); };
    const retry = () => { queue.push(queue.shift()); render(); };

    if (kind === 1) { // RU -> EN выбор
      const opts = App.shuffle([w.w, ...distractors(w, 3, "w")], Date.now() % 7777);
      const c = App.el(`<div class="card"><div class="eyebrow">Как это по-английски?</div>
        <h2>${App.esc(w.ru)}</h2><div class="opts"></div><div class="after"></div></div>`);
      const box = App.$(".opts", c);
      opts.forEach((o) => {
        const b = App.el(`<button>${App.esc(o)}</button>`);
        b.onclick = () => {
          App.$$("button", box).forEach((x) => (x.disabled = true));
          if (o === w.w) { b.classList.add("right"); App.grade(id, 2); App.speak(w.w); setTimeout(next, 900); }
          else {
            b.classList.add("wrong");
            App.$$("button", box).find((x) => x.textContent === w.w).classList.add("right");
            App.grade(id, 0); App.$(".after", c).innerHTML = wordBody(w);
            c.appendChild(App.el('<button class="btn primary" style="margin-top:10px">Дальше</button>')).onclick = retry;
          }
        };
        box.appendChild(b);
      });
      root.appendChild(c);
    } else if (kind === 2 && w.ex && w.ex[0] && App.norm(w.ex[0]).includes(App.norm(w.w).split(" ")[0])) {
      const stem = w.w.split(" ")[0];
      const gapped = w.ex[0].replace(new RegExp(stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*", "i"), "_____");
      const opts = App.shuffle([w.w, ...distractors(w, 3, "w")], Date.now() % 5555);
      const c = App.el(`<div class="card"><div class="eyebrow">Какое слово пропущено?</div>
        <p class="reading-text" style="font-style:italic">${App.esc(gapped)}</p>
        <p class="muted small">${App.esc(w.ru)}</p><div class="opts"></div><div class="after"></div></div>`);
      const box = App.$(".opts", c);
      opts.forEach((o) => {
        const b = App.el(`<button>${App.esc(o)}</button>`);
        b.onclick = () => {
          App.$$("button", box).forEach((x) => (x.disabled = true));
          if (o === w.w) { b.classList.add("right"); App.grade(id, 2); App.speak(w.ex[0]); setTimeout(next, 1100); }
          else {
            b.classList.add("wrong");
            App.$$("button", box).find((x) => x.textContent === w.w).classList.add("right");
            App.grade(id, 0); App.$(".after", c).innerHTML = wordBody(w);
            c.appendChild(App.el('<button class="btn primary" style="margin-top:10px">Дальше</button>')).onclick = retry;
          }
        };
        box.appendChild(b);
      });
      root.appendChild(c);
    } else { // классическая карточка
      const c = App.el(`<div class="card"><div class="eyebrow">Вспомни перевод</div>
        <div class="spread"><div><span class="word-hero">${App.esc(w.w)}</span><span class="ipa">${App.esc(w.ipa || "")}</span><span class="pos">${App.esc(w.pos || "")}</span></div>
        <button class="speak">🔊</button></div><div class="hid"></div></div>`);
      App.$(".speak", c).onclick = () => App.speak(w.w);
      const show = App.el('<button class="btn primary" style="margin-top:12px">Показать ответ</button>');
      show.onclick = () => {
        show.remove();
        App.$(".hid", c).innerHTML = wordBody(w);
        c.appendChild(gradeButtons(id, (q) => (q === 0 ? retry() : next())));
      };
      c.appendChild(show);
      root.appendChild(c);
    }
  };

  const renderNew = (root) => {
    const ids = App.newIdsToday().filter((id) => !App.state.srs[id] || App.state.srs[id].reps === 0);
    const l = App.todayLog();
    const goal = Math.min(App.state.settings.newPerDay, App.newIdsToday().length);
    root.appendChild(App.el(`<div class="spread"><span class="qcount">Сегодня выучено: ${l.newCount} из ${goal}</span></div>`));
    if (!ids.length) {
      root.appendChild(App.el(`<div class="card"><h2>Новые слова на сегодня разобраны ✨</h2>
        <p class="muted">Завтра подборка обновится: слова по темам чередуются сами - повседневные, бизнес и живая лексика.</p></div>`));
      return;
    }
    const w = App.pool[ids[0]];
    const c = wordCard(w, true);
    c.classList.add("accent");
    c.prepend(App.el(`<div class="eyebrow">Новое слово · ${App.esc(topicName(w.topic))}</div>`));
    const row = App.el(`<div class="grades" style="grid-template-columns:repeat(3,1fr)">
      <button class="g1">Позже<small>вернётся в конец</small></button>
      <button class="g2">Выучила ✓<small>повтор завтра</small></button>
      <button class="g3">Уже знаю<small>повтор через 4 дня</small></button></div>`);
    App.$(".g1", row).onclick = () => { const lg = App.todayLog(); lg.newIds.push(lg.newIds.shift()); App.save(); render(); };
    App.$(".g2", row).onclick = () => { App.grade(w.id, 2); render(); };
    App.$(".g3", row).onclick = () => { App.grade(w.id, 3); render(); };
    c.appendChild(row);
    root.appendChild(c);
    App.speak(w.w);
  };

  const renderBrowse = (root, favOnly) => {
    const c = App.el(`<div class="card">
      <div class="searchrow"><input type="search" placeholder="Поиск слова или перевода" aria-label="Поиск">
      <select><option value="">Все темы</option></select></div><ul class="wlist"></ul></div>`);
    const sel = App.$("select", c);
    Object.keys(window.TOPICS || {}).forEach((t) => sel.appendChild(App.el(`<option value="${t}">${App.esc(topicName(t))}</option>`)));
    const list = App.$("ul", c);
    const draw = () => {
      const q = App.norm(App.$("input", c).value), t = sel.value;
      list.innerHTML = "";
      let items = Object.values(App.pool);
      if (favOnly) items = items.filter((w) => App.state.favs.includes(w.id));
      if (t) items = items.filter((w) => w.topic === t);
      if (q) items = items.filter((w) => App.norm(w.w).includes(q) || App.norm(w.ru).includes(q));
      if (!items.length) { list.appendChild(App.el(`<li class="muted">${favOnly ? "Пока пусто. Отмечай сложные слова звёздочкой ⭐" : "Ничего не нашлось"}</li>`)); return; }
      items.slice(0, 200).forEach((w) => {
        const s = App.state.srs[w.id];
        const li = App.el(`<li><span class="w">${App.esc(w.w)}</span><span class="ru">${App.esc(w.ru)}</span>
          <span class="badge ${s && s.ivl >= 21 ? "done" : ""}" style="margin-left:auto">${s ? (s.ivl >= 21 ? "закреплено" : "учится") : "новое"}</span></li>`);
        li.style.cursor = "pointer";
        li.onclick = () => {
          const old = App.$(".card.detail", list.parentElement);
          if (old) old.remove();
          const d = wordCard(w, true); d.classList.add("detail");
          li.after(d);
        };
        list.appendChild(li);
      });
    };
    App.$("input", c).oninput = draw; sel.onchange = draw;
    draw();
    root.appendChild(c);
  };

  const render = () => {
    const root = App.$("#tab-words"); root.innerHTML = "";
    const due = App.due().length;
    if (mode === "auto") mode = due ? "review" : "new";
    const chips = App.el(`<div class="chips">
      <button class="chip" data-m="review">Повторить <span class="n">${due}</span></button>
      <button class="chip" data-m="new">Новые</button>
      <button class="chip" data-m="browse">Все слова <span class="n">${Object.keys(App.pool).length}</span></button>
      <button class="chip" data-m="favs">⭐ Избранное <span class="n">${App.state.favs.length}</span></button></div>`);
    App.$$(".chip", chips).forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.m === mode ? "true" : "false");
      b.onclick = () => { mode = b.dataset.m; if (mode === "review") { queue = App.due(); sessionDone = 0; } render(); };
    });
    root.appendChild(chips);
    if (mode === "review") { if (!queue.length && due) { queue = App.due(); sessionDone = 0; } renderReview(root); }
    else if (mode === "new") renderNew(root);
    else if (mode === "browse") renderBrowse(root, false);
    else renderBrowse(root, true);
  };
  App.tabs.words = () => { mode = "auto"; queue = []; sessionDone = 0; render(); };
})();

/* ================= ЧТЕНИЕ ================= */
(() => {
  let open = null, tStart = 0;

  const list = (root) => {
    const dn = App.dayNum();
    const texts = window.READING || [];
    const nextIdx = texts.findIndex((r) => !App.state.readingDone[r.id]);
    root.appendChild(App.el(`<div class="card"><div class="eyebrow">Чтение</div>
      <h2>Тексты с вопросами</h2>
      <p class="muted small" style="margin:0">Читай с таймером - приложение считает твою скорость (слов/мин) и понимание. Это главная тренировка для Reading.</p></div>`));
    texts.forEach((r, i) => {
      const done = App.state.readingDone[r.id];
      const c = App.el(`<div class="card"><div class="spread">
        <div><div class="eyebrow">${App.esc(r.topicName || r.topic)} · ${App.esc(r.lvl || "B2")} · ~${Math.round(r.wcount / 180)} мин${i === nextIdx ? " · текст дня 📌" : ""}</div>
        <h3 style="margin:0">${App.esc(r.title)}</h3>
        ${done ? `<span class="badge done">прочитано · ${done.score}/${done.total} · ${done.wpm} слов/мин</span>` : ""}</div>
        <button class="btn ${i === nextIdx && !done ? "primary" : "soft"}">${done ? "Перечитать" : "Читать"}</button></div></div>`);
      App.$("button", c).onclick = () => { open = r; render(); };
      root.appendChild(c);
    });
  };

  const reader = (root) => {
    const r = open;
    const c = App.el(`<div class="card"><div class="eyebrow">${App.esc(r.topicName || r.topic)} · ${r.wcount} слов</div>
      <h2>${App.esc(r.title)}</h2><div class="stage"></div></div>`);
    const stage = App.$(".stage", c);
    const back = App.el('<button class="btn ghost" style="margin-bottom:4px">← К списку текстов</button>');
    back.onclick = () => { open = null; render(); };
    root.appendChild(back); root.appendChild(c);

    const showQs = () => {
      const mins = (Date.now() - tStart) / 60000;
      const wpm = Math.max(40, Math.min(600, Math.round(r.wcount / mins))); // скорость фиксируется в момент «дочитала»
      stage.innerHTML = `<div class="fb info">Скорость чтения: <b>${wpm} слов/мин</b> ${wpm >= 220 ? "- отличный темп для Band 7+ 🎯" : wpm >= 160 ? "- хороший темп, продолжаем разгонять" : "- пока медленно, это нормально: скорость растёт вместе со словарём"}</div>`;
      const answers = new Array(r.qs.length).fill(-1);
      r.qs.forEach((q, qi) => {
        const qc = App.el(`<div style="margin:14px 0"><p style="margin:0 0 6px"><b>${qi + 1}.</b> ${App.esc(q.q)}</p><div class="opts"></div><div class="why"></div></div>`);
        q.opts.forEach((o, oi) => {
          const b = App.el(`<button>${App.esc(o)}</button>`);
          b.onclick = () => { answers[qi] = oi; App.$$("button", App.$(".opts", qc)).forEach((x, xi) => x.style.borderColor = xi === oi ? "var(--acc)" : ""); };
          App.$(".opts", qc).appendChild(b);
        });
        qc.dataset.qi = qi; stage.appendChild(qc);
      });
      const submit = App.el('<button class="btn primary">Проверить ответы</button>');
      submit.onclick = () => {
        if (answers.includes(-1)) return App.toast("Ответь на все вопросы");
        let score = 0;
        App.$$("[data-qi]", stage).forEach((qc) => {
          const qi = +qc.dataset.qi, q = r.qs[qi];
          App.$$(".opts button", qc).forEach((b, oi) => {
            b.disabled = true;
            if (oi === q.a) b.classList.add("right");
            else if (oi === answers[qi]) b.classList.add("wrong");
          });
          if (answers[qi] === q.a) score++;
          else App.$(".why", qc).innerHTML = `<div class="fb info small">${App.esc(q.why || "")}</div>`;
        });
        submit.remove();
        App.state.readingDone[r.id] = { score, total: r.qs.length, wpm, date: App.dayStr() };
        App.save(); App.markBlock("reading");
        stage.prepend(App.el(`<div class="fb ${score >= r.qs.length - 1 ? "ok" : "info"}"><b>${score} из ${r.qs.length}</b> ${score === r.qs.length ? "- идеально! 🏆" : score >= r.qs.length - 1 ? "- отлично!" : "- разбор ошибок под вопросами"}</div>`));
        stage.appendChild(vocabBlock(r));
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      stage.appendChild(submit);
    };

    stage.innerHTML = "";
    const startBtn = App.el(`<div><p class="muted">Читай в своём темпе, но не отвлекайся: по кнопке ниже запустится таймер. После текста будут ${r.qs.length} вопроса(ов) на понимание.</p>
      <button class="btn primary">Начать чтение</button></div>`);
    App.$("button", startBtn).onclick = () => {
      tStart = Date.now();
      stage.innerHTML = `<div class="reading-text">${r.text.map((p) => `<p>${App.esc(p)}</p>`).join("")}</div>`;
      const toQ = App.el('<button class="btn primary">Я дочитала - к вопросам</button>');
      toQ.onclick = () => { stage.querySelector(".reading-text").remove(); toQ.remove(); showQs(); };
      stage.appendChild(toQ);
    };
    stage.appendChild(startBtn);
  };

  const vocabBlock = (r) => {
    const box = App.el(`<div><h3>Слова и выражения из текста</h3><ul class="wlist"></ul></div>`);
    const ul = App.$("ul", box);
    (r.vocab || []).forEach((v) => {
      const learned = App.state.srs[v.id] && App.state.srs[v.id].reps > 0;
      const li = App.el(`<li><div style="flex:1"><span class="w">${App.esc(v.w)}</span> <span class="ipa small">${App.esc(v.ipa || "")}</span><br>
        <span class="ru small">${App.esc(v.ru)}${v.def ? " · " + App.esc(v.def) : ""}</span></div>
        <button class="speak">🔊</button>
        <button class="btn soft small add">${learned ? "в повторениях ✓" : "+ учить"}</button></li>`);
      App.$(".speak", li).onclick = () => App.speak(v.w);
      const add = App.$(".add", li);
      add.onclick = () => {
        if (App.state.srs[v.id] && App.state.srs[v.id].reps > 0) return;
        App.grade(v.id, 2); add.textContent = "в повторениях ✓"; App.toast("Добавлено в интервальные повторения");
      };
      ul.appendChild(li);
    });
    (r.notes || []).forEach((n) => ul.appendChild(App.el(`<li><div><span class="w">${App.esc(n.phrase)}</span><br><span class="ru small">${App.esc(n.expl)}</span></div></li>`)));
    return box;
  };

  const render = () => { const root = App.$("#tab-reading"); root.innerHTML = ""; open ? reader(root) : list(root); };
  App.tabs.reading = () => { open = null; render(); };
})();

/* ================= ГРАММАТИКА ================= */
(() => {
  let topic = null, exQueue = [], right = 0, wrong = 0;

  const start = (t, mix) => {
    topic = t;
    exQueue = mix ? App.shuffle(t.ex, App.dayNum()).slice(0, 5) : t.ex.slice();
    right = 0; wrong = 0; render();
  };

  const renderTopics = (root) => {
    const today = App.grammarTopicOfDay();
    root.appendChild(App.el(`<div class="card"><div class="eyebrow">Грамматика</div><h2>Короткая теория + практика</h2>
      <p class="muted small" style="margin:0">Каждый день - одна тема, 5 заданий. Ошибки сразу разбираются. Для блока дня хватит «Темы дня».</p></div>`));
    (window.GRAMMAR || []).forEach((g) => {
      const st = App.state.grammarStats[g.id];
      const acc = st && st.right + st.wrong ? Math.round(st.right / (st.right + st.wrong) * 100) + "%" : "";
      const isToday = today && today.id === g.id;
      const c = App.el(`<div class="card"><div class="spread">
        <div><h3 style="margin:0">${App.esc(g.title)} ${isToday ? "📌" : ""}</h3>
        <span class="small muted">${App.esc(g.blurb || "")}${acc ? " · точность " + acc : ""}</span></div>
        <div class="row">${isToday ? '<button class="btn primary day">Тема дня · 5 заданий</button>' : ""}<button class="btn soft all">Вся тема</button></div></div></div>`);
      if (isToday) App.$(".day", c).onclick = () => start(g, true);
      App.$(".all", c).onclick = () => start(g, false);
      root.appendChild(c);
    });
  };

  const renderEx = (root) => {
    const back = App.el('<button class="btn ghost" style="margin-bottom:4px">← К темам</button>');
    back.onclick = () => { topic = null; render(); };
    root.appendChild(back);
    const th = App.el(`<div class="card"><div class="eyebrow">${App.esc(topic.title)}</div>
      <details ${right + wrong === 0 ? "open" : ""}><summary style="cursor:pointer;font-weight:600">Мини-теория</summary>
      ${topic.theory.map((p) => `<p class="small">${p}</p>`).join("")}</details></div>`);
    root.appendChild(th);
    if (!exQueue.length) {
      const total = right + wrong;
      root.appendChild(App.el(`<div class="card"><h2>${right} из ${total} ${right === total ? "🏆" : right / total >= 0.7 ? "- хорошо!" : "- перечитай теорию и попробуй ещё"}</h2>
        <button class="btn primary again">Ещё раз</button></div>`));
      App.$(".again", root).onclick = () => start(topic, right + wrong <= 5);
      return;
    }
    const ex = exQueue[0];
    const c = App.el(`<div class="card"><div class="spread"><div class="eyebrow">Задание</div>
      <span class="qcount">осталось ${exQueue.length} · верно ${right}</span></div>
      <p class="reading-text">${App.esc(ex.q)}</p><div class="zone"></div><div class="why"></div></div>`);
    const zone = App.$(".zone", c);
    const finish = (ok) => {
      const l = App.todayLog();
      const st = App.state.grammarStats[topic.id] || { right: 0, wrong: 0 };
      ok ? (st.right++, right++) : (st.wrong++, wrong++);
      App.state.grammarStats[topic.id] = st;
      l.gCount++; if (l.gCount >= 5) App.markBlock("grammar");
      App.save();
      App.$(".why", c).innerHTML = `<div class="fb ${ok ? "ok" : "no"}">${ok ? "✓ Верно!" : "✗ Правильно: <b>" + App.esc(ex.opts ? ex.opts[ex.a] : ex.accepted[0]) + "</b>"}${ex.why ? "<br><span class='small'>" + App.esc(ex.why) + "</span>" : ""}</div>`;
      const nx = App.el('<button class="btn primary">Дальше</button>');
      nx.onclick = () => { exQueue.shift(); render(); };
      c.appendChild(nx); nx.focus();
    };
    if (ex.opts) {
      const box = App.el('<div class="opts"></div>');
      ex.opts.forEach((o, oi) => {
        const b = App.el(`<button>${App.esc(o)}</button>`);
        b.onclick = () => {
          App.$$("button", box).forEach((x) => (x.disabled = true));
          b.classList.add(oi === ex.a ? "right" : "wrong");
          if (oi !== ex.a) App.$$("button", box)[ex.a].classList.add("right");
          finish(oi === ex.a);
        };
        box.appendChild(b);
      });
      zone.appendChild(box);
    } else {
      const row = App.el(`<div class="row"><input class="gap-in" style="flex:1;max-width:260px" placeholder="Впиши ответ" autocapitalize="off"><button class="btn primary">Проверить</button></div>`);
      const inp = App.$("input", row);
      const check = () => {
        if (!inp.value.trim()) return;
        inp.disabled = true; App.$("button", row).disabled = true;
        finish(ex.accepted.some((a) => App.norm(a) === App.norm(inp.value)));
      };
      App.$("button", row).onclick = check;
      inp.onkeydown = (e) => { if (e.key === "Enter") check(); };
      zone.appendChild(row); setTimeout(() => inp.focus(), 50);
    }
    root.appendChild(c);
  };

  const render = () => { const root = App.$("#tab-grammar"); root.innerHTML = ""; topic ? renderEx(root) : renderTopics(root); };
  App.tabs.grammar = () => { topic = null; render(); };
})();

/* ================= ПИСЬМО ================= */
(() => {
  let open = null;
  const TYPES = {
    para: "Перефразируй", upgrade: "Замени на естественное", combine: "Соедини предложения",
    fix: "Исправь ошибку", finish: "Закончи абзац", short: "Короткий ответ"
  };

  const nextTaskId = () => {
    const dn = App.dayNum(), all = window.WRITING || [];
    for (let i = 0; i < all.length; i++) { const t = all[(dn + i) % all.length]; if (!App.state.writingDone[t.id]) return t.id; }
    return all.length ? all[dn % all.length].id : null;
  };

  const renderList = (root) => {
    root.appendChild(App.el(`<div class="card"><div class="eyebrow">Письмо</div><h2>Мини-упражнения</h2>
      <p class="muted small" style="margin:0">Не эссе, а точечная прокачка: перефразирование, естественная лексика, исправление ошибок. Задание дня отмечено 📌.</p></div>`));
    const nid = nextTaskId();
    Object.keys(TYPES).forEach((tp) => {
      const tasks = (window.WRITING || []).filter((t) => t.type === tp);
      if (!tasks.length) return;
      const done = tasks.filter((t) => App.state.writingDone[t.id]).length;
      const c = App.el(`<div class="card"><div class="spread"><div><h3 style="margin:0">${TYPES[tp]}</h3>
        <span class="small muted">${done} из ${tasks.length} сделано</span></div></div><ul class="wlist"></ul></div>`);
      const ul = App.$("ul", c);
      tasks.forEach((t) => {
        const isDone = App.state.writingDone[t.id];
        const li = App.el(`<li style="cursor:pointer"><span>${isDone ? "✓" : t.id === nid ? "📌" : "·"}</span>
          <span class="${isDone ? "muted" : ""}" style="flex:1">${App.esc(t.title)}</span>
          <button class="btn soft small">${isDone ? "Ещё раз" : "Делать"}</button></li>`);
        App.$("button", li).onclick = () => { open = t; render(); };
        ul.appendChild(li);
      });
      root.appendChild(c);
    });
  };

  const renderTask = (root) => {
    const t = open;
    const back = App.el('<button class="btn ghost" style="margin-bottom:4px">← К заданиям</button>');
    back.onclick = () => { open = null; render(); };
    root.appendChild(back);
    const c = App.el(`<div class="card"><div class="eyebrow">${TYPES[t.type]}</div>
      <h3 style="margin-top:0">${App.esc(t.title)}</h3>
      <p>${App.esc(t.prompt)}</p>
      ${t.src ? `<div class="ex">${App.esc(t.src)}</div>` : ""}
      ${t.hint ? `<p class="small muted">💡 ${App.esc(t.hint)}</p>` : ""}
      <textarea placeholder="Пиши здесь по-английски..."></textarea>
      <div class="small muted wc" style="margin:4px 0 10px"></div>
      <div class="row"><button class="btn primary chk">Проверить</button></div>
      <div class="res"></div></div>`);
    const ta = App.$("textarea", c), wc = App.$(".wc", c), res = App.$(".res", c);
    const count = () => { const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; wc.textContent = n + " слов" + (t.minW ? " · нужно " + t.minW + "-" + t.maxW : ""); return n; };
    ta.oninput = count; count();
    App.$(".chk", c).onclick = () => {
      const n = count(), val = ta.value;
      if (!val.trim()) return App.toast("Сначала напиши свой вариант");
      let html = "";
      if (t.minW && n < t.minW) html += `<div class="fb warn small">Пока ${n} слов - добери до ${t.minW}.</div>`;
      if (t.maxW && n > t.maxW) html += `<div class="fb warn small">Длинновато (${n} слов) - попробуй уложиться в ${t.maxW}.</div>`;
      if (t.must && t.must.length) {
        html += '<div class="fb info small"><b>Чек-лист:</b><br>' + t.must.map((m) => {
          const ok = new RegExp(m.re, "i").test(val);
          return (ok ? "✓ " : "✗ ") + App.esc(m.label);
        }).join("<br>") + "</div>";
      }
      html += `<div class="wsec"><b>Образцовые варианты</b>${t.model.map((m) => `<div class="ex">${App.esc(m)}</div>`).join("")}</div>
        <p class="small muted">Сравни со своим: что в образце короче, точнее, естественнее? Возьми одну находку в свой ответ.</p>`;
      res.innerHTML = html;
      const doneBtn = App.el(`<button class="btn primary">${App.state.writingDone[t.id] ? "Готово" : "Засчитать выполненным"}</button>`);
      doneBtn.onclick = () => {
        App.state.writingDone[t.id] = App.dayStr(); App.save();
        App.markBlock("writing"); open = null; render();
      };
      res.appendChild(doneBtn);
    };
    root.appendChild(c);
  };

  const render = () => { const root = App.$("#tab-writing"); root.innerHTML = ""; open ? renderTask(root) : renderList(root); };
  App.tabs.writing = () => { open = null; render(); };
})();

/* ================= РЕЧЬ ================= */
(() => {
  let media = null, rec = null, chunks = [], finalTxt = "", t0 = 0, timerI = null;
  const FILLER = /\b(um+|uh+|er+|hm+|you know|i mean|kind of|sort of|basically|literally)\b/gi;

  const stopAll = () => {
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
    if (media && media.state !== "inactive") media.stop();
    clearInterval(timerI);
  };

  const analyse = (secs, box, phrases) => {
    const words = finalTxt.trim() ? finalTxt.trim().split(/\s+/) : [];
    const wpm = secs > 3 ? Math.round(words.length / secs * 60) : 0;
    const fillers = (finalTxt.match(FILLER) || []).length;
    const uniq = words.length ? Math.round(new Set(words.map(App.norm)).size / words.length * 100) : 0;
    let html = `<h3>Разбор ответа</h3><div class="statgrid">
      <div class="stat"><b>${Math.round(secs)}с</b><span>длительность</span></div>
      <div class="stat"><b>${words.length}</b><span>слов сказано</span></div>
      <div class="stat"><b>${wpm || "-"}</b><span>темп, слов/мин</span></div>
      <div class="stat"><b>${fillers}</b><span>слов-паразитов</span></div></div>`;
    const tips = [];
    if (secs < 20) tips.push("Ответ короткий - на IELTS Speaking Part 1 хорошо звучат ответы 20-40 секунд: мысль + причина + пример.");
    if (wpm && wpm < 95) tips.push("Темп медленный (" + wpm + "). Не гонись за скоростью, но избегай долгих пауз: лучше простое слово сразу, чем идеальное через 5 секунд.");
    if (wpm >= 95 && wpm <= 165 && secs >= 20) tips.push("Темп отличный - естественный разговорный диапазон ✓");
    if (wpm > 175) tips.push("Очень быстро (" + wpm + ") - на экзамене чуть медленнее звучит увереннее и чище.");
    if (fillers >= 3) tips.push("Много звуков-заполнителей (" + fillers + "). Вместо «um» держи паузу молча или используй Well... / Let me think...");
    if (uniq && uniq < 55 && words.length > 40) tips.push("Много повторов одних и тех же слов - попробуй синонимы из раздела «Слова».");
    if (phrases && phrases.length && words.length) {
      const used = phrases.filter((p) => App.norm(finalTxt).includes(App.norm(p)));
      html += `<div class="wsec"><b>Фразы темы</b><div class="tagline">${phrases.map((p) => `<span class="tag ${used.includes(p) ? "" : "anti"}">${used.includes(p) ? "✓ " : ""}${App.esc(p)}</span>`).join("")}</div>
        <span class="small muted">Зелёные - прозвучали. Попробуй в следующем ответе вставить 2-3 красные.</span></div>`;
    }
    if (tips.length) html += '<div class="fb info small">' + tips.map((t) => "• " + t).join("<br>") + "</div>";
    else if (words.length) html += '<div class="fb ok small">Ровный, уверенный ответ - так держать! Запишись ещё раз и попробуй добавить пример из жизни.</div>';
    box.innerHTML = html;
    if (secs >= 20) {
      App.state.speakLog.push({ date: App.dayStr(), secs: Math.round(secs), words: words.length, wpm, fillers });
      App.save(); App.markBlock("speaking");
    } else box.appendChild(App.el('<p class="small muted">Запись от 20 секунд засчитывает блок дня.</p>'));
  };

  const recorderCard = (question, phrases) => {
    const c = App.el(`<div class="card accent"><div class="eyebrow">Вопрос дня</div>
      <h2 style="font-size:1.25rem">${App.esc(question)}</h2>
      <div class="row"><button class="speak">🔊 Озвучить вопрос</button><span class="qcount time" style="display:none">0:00</span></div>
      <p class="small muted">Подумай 10 секунд, потом говори 30-60 секунд: мысль → причина → пример.</p>
      <div class="row"><button class="btn rec">🎙 Записать ответ</button></div>
      <div class="transcript" style="display:none;margin-top:10px"></div>
      <div class="playback" style="margin-top:10px"></div>
      <div class="analysis"></div></div>`);
    App.$(".speak", c).onclick = () => App.speak(question);
    const btn = App.$(".btn.rec", c), tr = App.$(".transcript", c), time = App.$(".time", c);
    let recording = false;
    btn.onclick = async () => {
      if (recording) { stopAll(); return; }
      finalTxt = ""; chunks = [];
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) { return App.toast("Нет доступа к микрофону - разреши в настройках браузера"); }
      recording = true; btn.textContent = "⏹ Стоп"; btn.classList.add("live");
      tr.style.display = "block"; tr.textContent = "..."; time.style.display = "inline";
      t0 = Date.now();
      timerI = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); time.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 500);
      try {
        media = new MediaRecorder(stream);
        media.ondataavailable = (e) => chunks.push(e.data);
        media.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const secs = (Date.now() - t0) / 1000;
          recording = false; btn.textContent = "🎙 Записать ещё раз"; btn.classList.remove("live");
          clearInterval(timerI);
          if (chunks.length) {
            const url = URL.createObjectURL(new Blob(chunks, { type: media.mimeType || "audio/webm" }));
            App.$(".playback", c).innerHTML = `<audio controls src="${url}" style="width:100%"></audio><div class="small muted">Послушай себя со стороны - это половина тренировки произношения.</div>`;
          }
          analyse(secs, App.$(".analysis", c), phrases);
        };
        media.start();
      } catch (e) { media = null; }
      if (App.recogSupported()) {
        rec = App.recog({ interim: true, continuous: true });
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalTxt += e.results[i][0].transcript + " ";
            else interim += e.results[i][0].transcript;
          }
          tr.textContent = (finalTxt + interim).trim() || "...";
        };
        rec.onend = () => { if (recording && rec) { try { rec.start(); } catch (e) {} } };
        try { rec.start(); } catch (e) {}
      } else tr.textContent = "Распознавание речи не поддерживается в этом браузере (лучше всего - Chrome). Запись и таймер работают.";
      if (!media) { // MediaRecorder нет, но SR есть - остановка вручную
        btn.onclick = () => { const secs = (Date.now() - t0) / 1000; stopAll(); recording = false; btn.classList.remove("live"); analyse(secs, App.$(".analysis", c), phrases); };
      }
    };
    return c;
  };

  const drillCard = () => {
    const l = App.todayLog();
    const ids = (l.newIds || []).slice(0, 5);
    const pool = ids.length ? ids : App.shuffle(Object.keys(App.state.srs), App.dayNum()).slice(0, 5);
    if (!pool.length) return null;
    const c = App.el(`<div class="card"><div class="eyebrow">Дриль произношения</div>
      <h3 style="margin-top:0">Сегодняшние слова вслух</h3>
      <p class="small muted">Послушай 🔊 → повтори в микрофон 🎙. Проверяю, узнаётся ли слово.</p><div class="dz"></div></div>`);
    const dz = App.$(".dz", c);
    let i = 0, okCount = 0;
    const step = () => {
      if (i >= pool.length) {
        dz.innerHTML = `<div class="fb ${okCount >= 4 ? "ok" : "info"}"><b>${okCount} из ${pool.length}</b> распознано чисто. ${okCount >= 4 ? "Отличная артикуляция! 🎯" : "Слова, которые не узнались, послушай ещё пару раз."}</div>`;
        App.markBlock("speaking");
        return;
      }
      const w = App.pool[pool[i]];
      if (!w) { i++; step(); return; }
      dz.innerHTML = "";
      const row = App.el(`<div><div class="spread"><div><span class="word-hero" style="font-size:1.5rem">${App.esc(w.w)}</span><span class="ipa">${App.esc(w.ipa || "")}</span></div>
        <span class="qcount">${i + 1} / ${pool.length}</span></div>
        <div class="row" style="margin-top:8px"><button class="speak">🔊</button><button class="btn rec small say">🎙 Говорю</button><button class="btn ghost small skip">Пропустить</button></div>
        <div class="pr" style="margin-top:8px"></div></div>`);
      App.$(".speak", row).onclick = () => App.speak(w.w);
      App.$(".skip", row).onclick = () => { i++; step(); };
      App.$(".say", row).onclick = () => {
        const box = App.$(".pr", row);
        if (!App.recogSupported()) { box.innerHTML = '<div class="fb warn small">Нужен Chrome для распознавания.</div>'; return; }
        box.innerHTML = '<div class="fb info small">🎙 Слушаю...</div>';
        const r = App.recog(); let done = false;
        r.onresult = (e) => {
          done = true;
          const alts = Array.from(e.results[0]).map((a) => a.transcript);
          const best = Math.max(...alts.map((a) => Math.max(...a.split(" ").map((t) => App.sim(t, w.w)), App.sim(a, w.w))));
          if (best >= 0.72) { okCount++; box.innerHTML = '<div class="fb ok small">✓ Чисто!</div>'; setTimeout(() => { i++; step(); }, 800); }
          else { box.innerHTML = `<div class="fb no small">Услышала «${App.esc(alts[0])}». Ещё раз?</div>`; }
        };
        r.onend = () => { if (!done) box.innerHTML = '<div class="fb warn small">Не расслышала, попробуй ещё.</div>'; };
        try { r.start(); } catch (e) {}
      };
      dz.appendChild(row);
    };
    step();
    return c;
  };

  const render = () => {
    const root = App.$("#tab-speaking"); root.innerHTML = "";
    stopAll();
    root.appendChild(recorderCard(App.qotd(), null));
    const drill = drillCard();
    if (drill) root.appendChild(drill);
    const packs = (window.SPEAKING && window.SPEAKING.topics) || [];
    if (packs.length) {
      root.appendChild(App.el('<div class="card"><div class="eyebrow">Разговорные темы</div><h3 style="margin:0">Потренируй тему целиком</h3><p class="small muted" style="margin:6px 0 0">Открой тему, выбери вопрос, запиши ответ через «Вопрос дня» выше - и постарайся вставить фразы темы.</p></div>'));
      packs.forEach((p) => {
        const c = App.el(`<div class="card"><details><summary style="cursor:pointer;font-weight:600">${App.esc(p.t)}</summary>
          <div class="wsec"><b>Вопросы</b>${p.qs.map((q) => `<div class="ex" style="font-style:normal">${App.esc(q)} <button class="speak small" data-q="${App.esc(q)}" style="padding:2px 9px">🎙 отвечать</button></div>`).join("")}</div>
          <div class="wsec"><b>Полезные фразы</b><div class="tagline">${p.phrases.map((f) => `<span class="tag">${App.esc(f)}</span>`).join("")}</div></div>
          ${p.sample ? `<div class="wsec"><b>Пример сильного ответа</b><div class="ex">${App.esc(p.sample)}</div><button class="speak splay">🔊 Послушать</button></div>` : ""}
        </details></div>`);
        App.$$("[data-q]", c).forEach((b) => b.onclick = () => {
          root.replaceChild(recorderCard(b.dataset.q, p.phrases), root.firstElementChild);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
        const sp = App.$(".splay", c);
        if (sp) sp.onclick = () => App.speak(p.sample);
        root.appendChild(c);
      });
    }
  };
  App.tabs.speaking = render;
})();
