(() => {
  const course = window.COURSE;
  const parts = window.PARTS;
  const STORAGE_KEY = "parcours-citoyen-2026-v1";
  const ui = {
    fr: {
      study:"Parcours", report:"Mon bilan", menu:"Chapitres", close:"Fermer", progress:"Ma progression",
      chapters:"chapitres", questions:"questions", done:"maîtrisées", resume:"Reprendre mon parcours",
      begin:"Commencer le parcours", continue:"Continuer", open:"Ouvrir le chapitre", learn:"Apprendre",
      practice:"S’exercer", source:"Voir la page dans le livret", extracted:"Visuel extrait du livret",
      step:"Étape", of:"sur", previous:"Précédent", next:"Suivant", finishLesson:"Passer aux exercices",
      check:"Choisissez une réponse", correct:"Bonne réponse", incorrect:"À retenir", nextQuestion:"Question suivante",
      results:"Voir mon bilan", retry:"Réviser ce chapitre", all:"Tous les chapitres",
      pathTitle:"Un chemin clair vers la citoyenneté", pathSub:"Avancez à votre rythme, puis vérifiez ce que vous avez compris. Chaque notion reste accessible en français et en anglais.",
      part:"Partie", pages:"Pages", concepts:"notions", quiz:"questions", learned:"Notions lues",
      mastered:"Questions maîtrisées", toReview:"À revoir", continueHere:"Votre prochaine étape",
      noData:"Votre parcours commence ici.", local:"La progression est enregistrée sur cet appareil.",
      reportTitle:"Votre bilan de connaissances", reportSub:"Repérez les thèmes acquis et ceux à revoir. Une réponse juste après un nouvel essai compte comme maîtrisée.",
      strong:"Bien acquis", developing:"En cours", unstarted:"À découvrir", seeChapter:"Réviser",
      sourceNote:"Adaptation pédagogique du Livret du citoyen, édition mai 2026. Pour les démarches et règles en vigueur, consultez les sources officielles.",
      official:"Livret officiel", count:"sur", exerciseIntro:"Répondez pour vérifier la notion. Une explication suit chaque choix.",
      completed:"Chapitre terminé", completedSub:"Vous avez parcouru toutes les notions et les questions de ce chapitre.",
      nextChapter:"Chapitre suivant", imageAlt:"Illustration du livret du citoyen",
      started:"Commencé", masteredLabel:"Maîtrisé", newLabel:"À découvrir"
    },
    en: {
      study:"Learning path", report:"My progress", menu:"Chapters", close:"Close", progress:"My progress",
      chapters:"chapters", questions:"questions", done:"mastered", resume:"Continue learning",
      begin:"Start learning", continue:"Continue", open:"Open chapter", learn:"Learn",
      practice:"Practise", source:"See the page in the booklet", extracted:"Image from the booklet",
      step:"Step", of:"of", previous:"Previous", next:"Next", finishLesson:"Go to exercises",
      check:"Choose an answer", correct:"Correct answer", incorrect:"Key point", nextQuestion:"Next question",
      results:"See my progress", retry:"Review this chapter", all:"All chapters",
      pathTitle:"A clear path to French citizenship", pathSub:"Learn at your own pace, then check what you understand. Every lesson and exercise is available in French and English.",
      part:"Part", pages:"Pages", concepts:"concepts", quiz:"questions", learned:"Concepts read",
      mastered:"Questions mastered", toReview:"To review", continueHere:"Your next step",
      noData:"Your learning path starts here.", local:"Progress is saved on this device.",
      reportTitle:"Your knowledge overview", reportSub:"See what you know and what needs practice. A correct answer on a later attempt counts as mastered.",
      strong:"Well learned", developing:"In progress", unstarted:"Not started", seeChapter:"Review",
      sourceNote:"A learning adaptation of the May 2026 Livret du citoyen. For current procedures and rules, consult official sources.",
      official:"Official booklet", count:"of", exerciseIntro:"Answer to check your understanding. Each choice is followed by an explanation.",
      completed:"Chapter complete", completedSub:"You have gone through every concept and question in this chapter.",
      nextChapter:"Next chapter", imageAlt:"Illustration from the citizen booklet",
      started:"Started", masteredLabel:"Mastered", newLabel:"Not started"
    }
  };
  const app = document.getElementById("app");
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { saved = {}; }
  const state = {
    lang: saved.lang === "en" ? "en" : "fr",
    read: saved.read && typeof saved.read === "object" ? saved.read : {},
    quiz: saved.quiz && typeof saved.quiz === "object" ? saved.quiz : {},
    feedback: null,
    menuOpen: false
  };
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({lang:state.lang,read:state.read,quiz:state.quiz})); } catch {}
  }
  function t(key) { return ui[state.lang][key]; }
  function bi(pair) { return pair[state.lang === "fr" ? 0 : 1]; }
  function source(page) { return window.SOURCE_URL + "#page=" + page; }
  function qdata(m) {
    if (!state.quiz[m.id] || typeof state.quiz[m.id] !== "object") state.quiz[m.id] = {mastered:{},attempts:{}};
    return state.quiz[m.id];
  }
  function readCount(m) { return Object.keys(state.read[m.id] || {}).filter(k => Number(k) >= 0 && Number(k) < m.cards.length).length; }
  function masteredCount(m) { return m.quiz.filter((_,i) => !!qdata(m).mastered[i]).length; }
  function totalRead() { return course.reduce((n,m)=>n+readCount(m),0); }
  function totalCards() { return course.reduce((n,m)=>n+m.cards.length,0); }
  function totalMastered() { return course.reduce((n,m)=>n+masteredCount(m),0); }
  function totalQuestions() { return course.reduce((n,m)=>n+m.quiz.length,0); }
  function score(m) { return Math.round(100*masteredCount(m)/m.quiz.length); }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    const segments = h.split("/");
    if (segments[0] === "lesson" && course.some(m=>m.id===segments[1])) return {name:"lesson",m:course.find(m=>m.id===segments[1]),n:Math.max(0,Number(segments[2])||0)};
    if (segments[0] === "quiz" && course.some(m=>m.id===segments[1])) return {name:"quiz",m:course.find(m=>m.id===segments[1]),n:Math.max(0,Number(segments[2])||0)};
    if (segments[0] === "report") return {name:"report"};
    return {name:"home"};
  }
  function go(hash) { state.feedback = null; state.menuOpen = false; location.hash = hash; render(); window.scrollTo({top:0,behavior:"smooth"}); }
  function currentNext() {
    for (const m of course) {
      if (readCount(m)<m.cards.length) {
        const index = m.cards.findIndex((_,i)=>!(state.read[m.id]||{})[i]);
        return {m,hash:"lesson/"+m.id+"/"+Math.max(0,index)};
      }
      if (masteredCount(m)<m.quiz.length) {
        const index = m.quiz.findIndex((_,i)=>!qdata(m).mastered[i]);
        return {m,hash:"quiz/"+m.id+"/"+Math.max(0,index)};
      }
    }
    return {m:course[0],hash:"lesson/"+course[0].id+"/0"};
  }
  function sideNav(active) {
    return `<aside class="sidebar ${state.menuOpen?"is-open":""}" aria-label="${t("menu")}">
      <div class="sidebar-top"><span class="eyebrow">${t("menu")}</span><button class="icon-close" data-action="menu" aria-label="${t("close")}">×</button></div>
      <div class="nav-list">${parts.map((p,j)=>`<div class="nav-group"><div class="nav-part"><span class="part-number">0${j+1}</span><span>${bi(p)}</span></div>
      ${course.filter(m=>m.part===j+1).map(m=>`<a class="nav-item ${active===m.id?"active":""}" href="#lesson/${m.id}/0"><span class="nav-dot ${score(m)===100?"done":""}"></span><span>${bi(m.title)}</span><small>${score(m)}%</small></a>`).join("")}</div>`).join("")}</div>
      <div class="sidebar-foot"><span class="small-flower">✦</span><span>${t("local")}</span></div>
    </aside>`;
  }
  function shell(body,active) {
    const percent=Math.round(100*totalMastered()/totalQuestions());
    app.innerHTML = `<div class="app-shell">
      ${sideNav(active)}
      <div class="main-wrap">
        <header class="topbar">
          <div class="brand-area"><button class="menu-button" data-action="menu" aria-label="${t("menu")}">☰</button><a href="#home" class="brand"><span class="brand-mark"><i></i><i></i><i></i></span><span>PARCOURS <b>CITOYEN</b><small>LE LIVRET 2026, PAS À PAS</small></span></a></div>
          <nav class="top-links"><a class="${route().name==="home"?"selected":""}" href="#home">${t("study")}</a><a class="${route().name==="report"?"selected":""}" href="#report">${t("report")}</a></nav>
          <div class="top-actions"><div class="language-switch" role="group" aria-label="Language"><button data-lang="fr" aria-pressed="${state.lang==="fr"}" class="${state.lang==="fr"?"on":""}">FR</button><button data-lang="en" aria-pressed="${state.lang==="en"}" class="${state.lang==="en"?"on":""}">EN</button></div><a class="mini-progress" href="#report" aria-label="${t("progress")}: ${percent}%"><span class="mini-bar"><i style="width:${percent}%"></i></span><strong>${percent}%</strong></a></div>
        </header>
        <main id="main-content">${body}</main>
        <footer class="footer"><p>${t("sourceNote")}</p><a href="${window.SOURCE_URL}" target="_blank" rel="noopener noreferrer">${t("official")} ↗</a></footer>
      </div>
      <div class="scrim ${state.menuOpen?"visible":""}" data-action="menu"></div>
    </div>`;
    document.documentElement.lang=state.lang;
    document.title=(route().m?bi(route().m.title)+" · ":"")+"Parcours citoyen";
  }
  function chapterTile(m,index) {
    const pc=score(m), read=readCount(m), status=pc===100?t("masteredLabel"):read?t("started"):t("newLabel");
    return `<a class="chapter-card" href="#lesson/${m.id}/0"><div class="chapter-card-top"><span class="chapter-index">${String(index+1).padStart(2,"0")}</span><span class="chapter-icon">${m.icon}</span></div><div><p class="eyebrow">${t("part")} ${m.part} · ${t("pages")} ${m.pages}</p><h3>${bi(m.title)}</h3><p class="chapter-intro">${bi(m.intro)}</p></div><div class="chapter-card-foot"><span class="status ${pc===100?"complete":""}">${status}</span><span class="card-arrow">↗</span></div><div class="chapter-progress"><i style="width:${pc}%"></i></div></a>`;
  }
  function home() {
    const next=currentNext(), pc=Math.round(100*totalMastered()/totalQuestions());
    const body=`<section class="home-hero"><div class="home-copy"><div class="eyebrow accent"><span class="red-line"></span> LIVRET DU CITOYEN · 2026</div><h1>${t("pathTitle")}</h1><p>${t("pathSub")}</p><a class="primary-button" href="#${next.hash}">${totalRead()?t("resume"):t("begin")} <span>→</span></a><div class="hero-note"><span class="lock-icon">◇</span>${t("local")}</div></div><div class="hero-visual" aria-hidden="true"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-letter">C</div><div class="hero-french"><i></i><i></i><i></i></div><div class="hero-stamp">LIBERTÉ<br>ÉGALITÉ<br>FRATERNITÉ</div></div></section>
      <section class="summary-strip" aria-label="${t("progress")}"><div class="summary-main"><div class="ring" style="--value:${pc}"><span>${pc}<small>%</small></span></div><div><span class="eyebrow">${t("progress")}</span><h2>${totalMastered()} <small>/ ${totalQuestions()} ${t("questions")}</small></h2><p>${t("mastered")}</p></div></div><div class="summary-detail"><b>${totalRead()} / ${totalCards()}</b><span>${t("learned")}</span></div><div class="summary-detail"><b>${course.length}</b><span>${t("chapters")}</span></div><a class="summary-link" href="#report">↗</a></section>
      <section class="next-section"><div><span class="eyebrow">${t("continueHere")}</span><h2>${bi(next.m.title)}</h2><p>${bi(next.m.intro)}</p></div><a class="secondary-button" href="#${next.hash}">${t("continue")} <span>→</span></a></section>
      <section class="curriculum"><div class="section-heading"><div><span class="eyebrow">05 + 01 · ${t("part").toUpperCase()}</span><h2>${t("all")}</h2></div><span class="chapter-total">${course.length} ${t("chapters")}</span></div>
      ${parts.map((p,j)=>`<div class="part-block"><div class="part-heading"><span>0${j+1}</span><h3>${bi(p)}</h3></div><div class="chapter-grid">${course.filter(m=>m.part===j+1).map(m=>chapterTile(m,course.indexOf(m))).join("")}</div></div>`).join("")}</section>`;
    shell(body);
  }
  function visual(m,page) {
    return `<figure class="source-figure"><div class="source-image"><img src="assets/${m.image}" alt="${t("imageAlt")}" loading="lazy"></div><figcaption><span>${t("extracted")} · p. ${page}</span><a href="${source(page)}" target="_blank" rel="noopener noreferrer">↗</a></figcaption></figure>`;
  }
  function lesson(m,n) {
    n=Math.min(n,m.cards.length-1);
    if (!state.read[m.id]) state.read[m.id]={};
    state.read[m.id][n]=true; persist();
    const c=m.cards[n], page=c[6], pct=Math.round(100*(n+1)/m.cards.length);
    const body=`<div class="page-container"><div class="breadcrumbs"><a href="#home">${t("all")}</a><span>›</span><span>${t("part")} ${m.part}</span><span>›</span><strong>${bi(m.title)}</strong></div>
      <div class="lesson-head"><div><span class="eyebrow">${t("part")} ${m.part} · ${t("pages")} ${m.pages}</span><h1>${bi(m.title)}</h1><p>${bi(m.intro)}</p></div><span class="head-icon">${m.icon}</span></div>
      <div class="lesson-tabs"><span class="active">01 ${t("learn")}</span><span>02 ${t("practice")}</span></div>
      <div class="learning-layout"><div class="learning-main"><div class="step-line"><span>${t("step")} ${String(n+1).padStart(2,"0")} ${t("of")} ${String(m.cards.length).padStart(2,"0")}</span><span>${pct}%</span></div><div class="lesson-progress"><i style="width:${pct}%"></i></div>
      <article class="lesson-card"><span class="lesson-kicker">${m.icon} &nbsp; ${t("concepts").toUpperCase()} ${String(n+1).padStart(2,"0")}</span><h2>${bi(c.slice(0,2))}</h2><p class="lesson-text">${bi(c.slice(2,4))}</p><div class="example"><span class="example-icon">✦</span><p>${bi(c.slice(4,6))}</p></div><a class="source-link" href="${source(page)}" target="_blank" rel="noopener noreferrer">${t("source")} · p. ${page} <span>↗</span></a></article>
      <div class="lesson-controls">${n>0?`<a class="text-button" href="#lesson/${m.id}/${n-1}">← ${t("previous")}</a>`:"<span></span>"}<a class="primary-button" href="#${n<m.cards.length-1?"lesson/"+m.id+"/"+(n+1):"quiz/"+m.id+"/0"}">${n<m.cards.length-1?t("next"):t("finishLesson")} <span>→</span></a></div></div>
      <aside class="learning-aside">${visual(m,page)}<div class="side-tip"><span>✦</span><div><b>${t("source")}</b><p>${t("sourceNote")}</p></div></div></aside></div></div>`;
    shell(body,m.id);
  }
  function quiz(m,n) {
    n=Math.min(n,m.quiz.length-1);
    const q=m.quiz[n], key=m.id+"/"+n;
    const feedback=state.feedback&&state.feedback.key===key?state.feedback:null;
    const body=`<div class="page-container"><div class="breadcrumbs"><a href="#home">${t("all")}</a><span>›</span><a href="#lesson/${m.id}/0">${bi(m.title)}</a><span>›</span><strong>${t("practice")}</strong></div>
      <div class="lesson-head"><div><span class="eyebrow">${t("part")} ${m.part} · ${t("practice")}</span><h1>${bi(m.title)}</h1><p>${t("exerciseIntro")}</p></div><span class="head-icon">${m.icon}</span></div>
      <div class="lesson-tabs"><a href="#lesson/${m.id}/0">01 ${t("learn")}</a><span class="active">02 ${t("practice")}</span></div>
      <div class="quiz-shell"><div class="step-line"><span>${t("questions")} ${String(n+1).padStart(2,"0")} ${t("of")} ${String(m.quiz.length).padStart(2,"0")}</span><span>${masteredCount(m)}/${m.quiz.length} ${t("done")}</span></div><div class="lesson-progress"><i style="width:${100*(n+1)/m.quiz.length}%"></i></div>
      <div class="quiz-card"><div class="question-mark">?</div><h2>${bi(q.slice(0,2))}</h2><p class="quiz-hint">${t("check")}</p><div class="options" role="group" aria-label="${t("questions")}">${q[state.lang==="fr"?2:3].map((o,i)=>`<button class="option ${feedback?(i===q[4]?"right":i===feedback.choice?"wrong":""):""}" data-choice="${i}" ${feedback?"disabled":""}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${o}</span><span class="option-result">${feedback&&i===q[4]?"✓":feedback&&i===feedback.choice?"×":""}</span></button>`).join("")}</div>
      ${feedback?`<div class="feedback ${feedback.choice===q[4]?"success":"review"}" role="status"><strong>${feedback.choice===q[4]?t("correct"):t("incorrect")}</strong><p>${q[state.lang==="fr"?5:6]}</p></div>`:""}
      <div class="quiz-bottom">${n>0?`<a class="text-button" href="#quiz/${m.id}/${n-1}">← ${t("previous")}</a>`:"<span></span>"}${feedback?`<a class="primary-button" href="#${n<m.quiz.length-1?"quiz/"+m.id+"/"+(n+1):"complete/"+m.id}">${n<m.quiz.length-1?t("nextQuestion"):t("results")} <span>→</span></a>`:""}</div></div></div></div>`;
    shell(body,m.id);
  }
  function completion(m) {
    const index=course.indexOf(m), next=course[index+1], pct=score(m);
    const body=`<div class="completion-page"><span class="completion-symbol">✦</span><span class="eyebrow">${t("completed")}</span><h1>${bi(m.title)}</h1><p>${t("completedSub")}</p><div class="completion-score"><strong>${masteredCount(m)} / ${m.quiz.length}</strong><span>${t("mastered")}</span></div><div class="completion-actions"><a class="secondary-button" href="#lesson/${m.id}/0">${t("retry")} ↗</a><a class="primary-button" href="#${next?"lesson/"+next.id+"/0":"report"}">${next?t("nextChapter"):t("results")} <span>→</span></a></div></div>`;
    shell(body,m.id);
  }
  function report() {
    const pct=Math.round(100*totalMastered()/totalQuestions());
    const body=`<div class="page-container report-page"><div class="eyebrow accent"><span class="red-line"></span> ${t("progress").toUpperCase()}</div><h1>${t("reportTitle")}</h1><p class="report-lede">${t("reportSub")}</p><div class="report-stats"><div><span>${t("learned")}</span><strong>${totalRead()}<small> / ${totalCards()}</small></strong></div><div><span>${t("mastered")}</span><strong>${totalMastered()}<small> / ${totalQuestions()}</small></strong></div><div><span>${t("progress")}</span><strong>${pct}<small>%</small></strong></div></div>
      <div class="report-list">${parts.map((p,j)=>`<section class="report-part"><div class="report-part-title"><span class="part-number large">0${j+1}</span><h2>${bi(p)}</h2></div>${course.filter(m=>m.part===j+1).map(m=>{const n=masteredCount(m),pc=score(m),status=n===m.quiz.length?t("strong"):readCount(m)||n?t("developing"):t("unstarted");return `<div class="report-row"><div class="report-row-title"><span class="report-icon">${m.icon}</span><div><h3>${bi(m.title)}</h3><p>${readCount(m)}/${m.cards.length} ${t("concepts")} · ${n}/${m.quiz.length} ${t("questions")}</p></div></div><div class="report-row-end"><span class="report-status">${status}</span><div class="report-bar"><i style="width:${pc}%"></i></div><a href="#${readCount(m)===m.cards.length?"quiz":"lesson"}/${m.id}/0">${t("seeChapter")} ↗</a></div></div>`}).join("")}</section>`).join("")}</div><div class="report-note">◇ ${t("local")}</div></div>`;
    shell(body);
  }
  function render() {
    const r=route();
    if (r.name==="lesson") lesson(r.m,r.n);
    else if (r.name==="quiz") quiz(r.m,r.n);
    else if (r.name==="report") report();
    else {
      const h=location.hash.slice(1).split("/");
      if (h[0]==="complete" && course.some(m=>m.id===h[1])) completion(course.find(m=>m.id===h[1]));
      else home();
    }
  }
  app.addEventListener("click", e=>{
    const language=e.target.closest("[data-lang]");
    if (language) { state.lang=language.dataset.lang; persist(); render(); return; }
    const menu=e.target.closest("[data-action='menu']");
    if (menu) { state.menuOpen=!state.menuOpen; render(); return; }
    const choice=e.target.closest("[data-choice]");
    if (choice) {
      const r=route(); if (r.name!=="quiz") return;
      const key=r.m.id+"/"+r.n; if (state.feedback&&state.feedback.key===key) return;
      const picked=Number(choice.dataset.choice), data=qdata(r.m);
      data.attempts[r.n]=(Number(data.attempts[r.n])||0)+1;
      if (picked===r.m.quiz[r.n][4]) data.mastered[r.n]=true;
      state.feedback={key,choice:picked}; persist(); render(); return;
    }
    const anchor=e.target.closest("a[href^='#']");
    if (anchor) {
      const hash=anchor.getAttribute("href").slice(1);
      e.preventDefault(); go(hash);
    }
  });
  window.addEventListener("hashchange",()=>{state.feedback=null;render();});
  render();
})();
