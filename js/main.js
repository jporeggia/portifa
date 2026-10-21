/* Portfólio v3 — monta o site a partir do estado (JSON no index.html) e liga os efeitos.

   São 4 partes (início, works, about, contact), cada uma do tamanho da tela. No desktop a roda
   do mouse passa de uma para a outra com uma rolagem animada; no celular a rolagem é normal.
   Um único requestAnimationFrame move tudo que é contínuo (rolagem suave, letreiro, trilho,
   molas das letras, cursor), para nada brigar por quadro. */
(() => {
  const E = JSON.parse(document.getElementById('estado').textContent);
  const P = E.perfil;
  const raiz = document.documentElement;
  const app = document.getElementById('app');
  const busca = new URLSearchParams(location.search);
  const ESTATICO = busca.has('estatico');
  const REDUZ = ESTATICO || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINO = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const movel = () => matchMedia('(max-width: 760px)').matches;
  if (ESTATICO) raiz.classList.add('estatico');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const limita = (v, a, b) => Math.min(b, Math.max(a, v));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  // Divide um texto em letras (cada uma num span) para animar a entrada e as molas
  // (palavras ficam inteiras num bloco, para a quebra de linha nunca cortar no meio)
  const letras = (txt, d = 0) => {
    let i = d;
    return txt.split(' ').map((pal) => `<span class="palavra">${[...pal].map((ch) => `<span class="letra" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`)
      .join('<span class="letra" style="white-space:pre"> </span>');
  };

  /* ---------- Língua (EN / PT) ---------- */
  // Escolha guardada no navegador; na primeira visita segue a língua do navegador.
  let LANG = (() => {
    try { const l = localStorage.getItem('jpo-lingua'); if (l === 'pt' || l === 'en') return l; } catch (e) {}
    return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  })();
  // Junta os textos da língua atual por cima do estado (o inglês é a base)
  function L() {
    if (LANG === 'en') return { perfil: P, menu: E.menu.map((m) => m.rotulo), trabalhos: E.trabalhos, sobre: E.sobre, contato: E.contato, ui: E.ui.en, proj: (p) => p };
    const pt = E.pt;
    return {
      perfil: { ...P, ...pt.perfil }, menu: pt.menu, trabalhos: pt.trabalhos, sobre: { ...E.sobre, ...pt.sobre },
      contato: { ...E.contato, ...pt.contato }, ui: E.ui.pt, proj: (p) => mesclarProjeto(p, pt.projetos[p.slug] || {}),
    };
  }
  // por cima do projeto em inglês entram os textos em PT; nos setores, item a item (as imagens ficam)
  function mesclarProjeto(p, q) {
    const r = { ...p, ...q };
    if (p.setores) r.setores = p.setores.map((st, i) => {
      const qs = (q.setores || [])[i] || {};
      const m = { ...st, ...qs };
      if (st.posts) m.posts = st.posts.map((po, j) => ({ ...po, ...((qs.posts || [])[j] || {}) }));
      if (st.emails) m.emails = st.emails.map((em, j) => ({ ...em, ...((qs.emails || [])[j] || {}) }));
      if (st.pecas) m.pecas = st.pecas.map((pc, j) => ({ ...pc, ...((qs.pecas || [])[j] || {}) }));
      if (st.paginas) m.paginas = st.paginas.map((pg, j) => ({ ...pg, ...((qs.paginas || [])[j] || {}) }));
      return m;
    });
    return r;
  }
  let T = L();
  raiz.lang = LANG === 'pt' ? 'pt-BR' : 'en';
  // pedaços de marcação que mudam com a língua (usados na montagem e na troca)
  const H = {
    tag: (t) => esc(t.perfil.tag).replace('•', '<span class="ponto">•</span>'),
    desde: (t) => t.sobre.desde.replace(/(\d{4})/, '<span class="ano">$1</span>'),
    lista: (arr, base) => arr.map((x, i) => `<li style="--d:${i * 90 + base}">${esc(x)}</li>`).join(''),
    // áreas de atuação: título de cada grupo + itens com bolinha
    grupos: (t) => t.sobre.grupos.map((g, k) => `<div class="grupo"><h3 class="grupo-titulo rv" style="--d:${450 + k * 80}">${esc(g.titulo)}</h3>
            <ul class="lista rv" style="--d:${480 + k * 80}">${g.itens.map((x, i) => `<li style="--d:${i * 90 + k * 120}">${esc(x)}</li>`).join('')}</ul></div>`).join(''),
    exp: (t) => t.sobre.experiencia.map((x, i) => `
              <li class="exp-item rv visto" style="--d:${500 + i * 110}">
                <span class="exp-anos">${esc(x.anos)}</span>
                <div><h4 class="exp-cargo">${esc(x.cargo)}</h4><p class="exp-empresa">${esc(x.empresa)}</p><p class="exp-destaque">${esc(x.destaque)}</p></div>
              </li>`).join(''),
    esteira: (t) => `${FINO ? t.ui.esteira : t.ui.esteiraToque} →`,
  };

  /* ---------- Marcação ---------- */
  const cardHTML = (p0, i, p = T.proj(p0)) => `
    <article class="card" tabindex="0" role="button" data-slug="${p.slug}" style="--i:${Math.min(i, 8)}" aria-label="${esc(p.sobretitulo ? p.sobretitulo + ' — ' + p.titulo : p.titulo)}">
      <div class="card-img"><img src="${p.card.img}" alt="" draggable="false" decoding="async" ${i > 7 ? 'loading="lazy"' : ''}></div>
      <h3 class="card-titulo">${p.sobretitulo ? `<span class="card-sobre">${esc(p.sobretitulo)}</span>` : ''}${esc(p.titulo)}<small>${esc(p.cliente)} · ${esc(p.ano)}</small></h3>
    </article>`;

  app.innerHTML = `
  <div class="pagina topo-pag">
    <header class="topo">
      <a class="marca" href="#top">${esc(P.curto)}</a>
      <div class="letreiro" role="marquee" aria-label="${esc(T.perfil.papeis.join(' • '))}"><div class="letreiro-faixa"></div></div>
      <div class="lingua" role="group" aria-label="Language"><button type="button" data-l="en">EN</button><button type="button" data-l="pt">PT</button></div>
      <span class="hora" aria-label="${T.ui.hora}"></span>
    </header>
  </div>
  <main class="secoes">
    <section class="secao secao-top" id="top" aria-label="Intro">
      <div class="pagina">
        <div class="hero">
          <h1 class="nome" aria-label="${esc(P.nome.join(' '))}">
            ${P.nome.map((l, k) => `<span class="linha"><span class="linha-in linha-up" aria-hidden="true" style="--d:${k * 120}">${letras(l)}</span></span>`).join('')}
          </h1>
          <div class="hero-texto">
            <p class="hero-frase rv" style="--d:500">${esc(T.perfil.frase)}</p>
            <p class="hero-tag rv" style="--d:650">${H.tag(T)}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="secao secao-works" id="works" aria-label="Selected work">
      <div class="pagina">
        <div class="trabalhos">
          <h2 class="rotulo rv" style="--d:600">${T.trabalhos.rotulo}</h2>
          <div class="trilho"><div class="trilho-faixa"></div></div>
        </div>
      </div>
    </section>
    <section class="secao secao-about" id="about" aria-label="About">
      <div class="pagina sobre">
        <p class="desde rv">${H.desde(T)}</p>
        <div class="foto"><img src="img/foto-jp.webp" alt="${T.ui.foto}" draggable="false"></div>
        <div class="sobre-texto">
          <h2 class="sobre-titulo rv" style="--d:250">${esc(T.sobre.titulo)}</h2>
          <p class="sobre-corpo rv" style="--d:350">${esc(T.sobre.texto)}</p>
          <div class="grupos">${H.grupos(T)}</div>
          <a class="botao rv" style="--d:600" href="${T.perfil.curriculo}" target="_blank" rel="noopener">${esc(T.sobre.botao)}</a>
        </div>
        <div class="experiencia">
          <svg aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" pathLength="1"/></svg>
          <div class="exp-topo"><h3 class="rotulo">${T.sobre.rotuloExperiencia}</h3><span class="exp-contador">01 / ${String(E.sobre.experiencia.length).padStart(2, '0')}</span></div>
          <ol class="exp-lista" data-lenis-prevent tabindex="0" aria-label="Work experience">
            ${H.exp(T).replace(/ visto/g, '')}
          </ol>
          <span class="exp-dica" aria-hidden="true">scroll <span>↓</span></span>
        </div>
      </div>
    </section>
    <section class="secao secao-contact" id="contact" aria-label="Contact">
      <div class="pagina rodape-in">
        <h2 class="falar"><a href="mailto:${P.email}" class="copiar" aria-label="${esc(T.contato.titulo)} — ${P.email}"><span class="linha-in linha-up" aria-hidden="true">${letras(T.contato.titulo)}</span></a></h2>
        <div class="contatos rv" style="--d:450">
          <a class="sublinha copiar" href="mailto:${P.email}">${esc(P.email)}</a>
          <a class="sublinha" href="${P.linkedin}" target="_blank" rel="noopener">linkedin</a>
          <a class="sublinha" href="tel:${P.telefone.replace(/[^\d+]/g, '')}">${esc(P.telefone)}</a>
        </div>
        <p class="base rv" style="--d:550">${T.contato.base}</p>
        <span class="aviso" role="status" aria-live="polite"></span>
      </div>
    </section>
  </main>
  <nav class="menu" aria-label="Pages">${E.menu.map((m, i) => `<a href="#${m.alvo}" data-ir="${m.alvo}"><span>${esc(T.menu[i])}</span></a>`).join('')}</nav>
  <div class="caso" role="dialog" aria-modal="true" aria-hidden="true" data-lenis-prevent>
    <div class="caso-topo">
      <h2 class="caso-titulo"></h2>
      <div class="caso-info"></div>
      <div class="caso-acoes">
        <button class="caso-fechar" type="button"><b>${T.ui.fechar}</b> <span class="x" aria-hidden="true">✕</span></button>
        <button class="caso-prox" type="button"><b>${T.ui.proximo}</b> <span aria-hidden="true">→</span></button>
      </div>
    </div>
    <div class="caso-esteira">
      <div class="caso-faixa"></div>
      <div class="caso-rodape"><span class="caso-cont"></span><nav class="caso-setores" aria-label="Sections"></nav><span class="caso-barra"><i></i></span><span class="caso-dica">${H.esteira(T)}</span></div>
    </div>
  </div>
  <div class="leitor" hidden data-lenis-prevent><button type="button" class="leitor-fechar" aria-label="Close">✕</button><div class="leitor-rolo" tabindex="0"><img alt=""></div></div>
  <div class="cursor" aria-hidden="true"><span class="seta-c"></span></div>
  <div class="cursor-dica" aria-hidden="true">${T.ui.dica}</div>
  <button class="limpar" type="button" hidden>${T.ui.limpar}</button>`;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const menu = $('.menu');
  const secoes = $$('.secao');
  // desktop com mouse: uma parte por vez; celular, toque e "menos movimento": rolagem normal
  const paginado = () => !REDUZ && FINO && !movel();

  /* ---------- Unidade do Figma ---------- */
  let U = 1;
  function medir() {
    U = movel() ? 1 : Math.min(raiz.clientWidth, 1680) / 1424;
    raiz.style.setProperty('--u', U + 'px');
  }
  medir();

  /* ---------- Rolagem suave ---------- */
  // (sem Lenis: no desktop a rolagem é por partes e no celular o toque nativo já é suave)
  const lenis = null;

  /* ---------- Hora local do visitante ---------- */
  const hora = $('.hora');
  const tic = () => {
    const d = new Date();
    hora.innerHTML = `${String(d.getHours()).padStart(2, '0')}<i>:</i>${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tic(); setInterval(tic, 15000);

  /* ---------- Letreiro rotativo ---------- */
  const letreiro = $('.letreiro'), lFaixa = $('.letreiro-faixa');
  let lSet = 0, lX = 0, lVel = 1, lAlvo = 1;
  function montarLetreiro() {
    const um = T.perfil.papeis.map((t) => `<span>${esc(t)}</span>`).join('');
    lFaixa.innerHTML = um;
    lSet = lFaixa.scrollWidth;
    const n = Math.max(2, Math.ceil(letreiro.clientWidth / Math.max(1, lSet)) + 1);
    lFaixa.innerHTML = um.repeat(n);
  }
  letreiro.addEventListener('pointerenter', () => (lAlvo = 0.25));
  letreiro.addEventListener('pointerleave', () => (lAlvo = 1));

  /* ---------- Trilho de trabalhos ---------- */
  const trilho = $('.trilho'), tFaixa = $('.trilho-faixa');
  const N = E.projetos.length;
  let cardW = 285, tSet = 0, tX = 0, tV = 0, tCopias = 0, tCards = [];
  let mouseNoTrilho = false, mX = 0, arrasto = null, arrastou = false, tVisivel = true, trilhoW = 0;
  function montarTrilho() {
    // largura inteira em px: com fração os cards não encostam igual e a linha entre eles variava
    cardW = Math.round(movel() ? innerWidth * 0.62 : 285 * U);
    trilhoW = trilho.clientWidth;
    raiz.style.setProperty('--card-w', cardW + 'px');
    tSet = cardW * N;
    const copias = Math.max(2, Math.ceil(trilho.clientWidth / tSet) + 1);
    if (copias !== tCopias) {
      tCopias = copias;
      let h = '';
      for (let c = 0; c < copias; c++) E.projetos.forEach((p, i) => (h += cardHTML(p, c * N + i)));
      tFaixa.innerHTML = h;
      tCards = $$('.card', tFaixa).map((el) => ({ el, img: $('img', el) }));
      tCards.forEach(({ el }) => {
        el.addEventListener('click', () => { if (!arrastou) abrirCaso(el.dataset.slug); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirCaso(el.dataset.slug); } });
      });
    }
  }
  // Velocidades em px/s, proporcionais à unidade do Figma
  const AUTO = () => -38 * (movel() ? 1 : U);
  const VMAX = () => 820 * (movel() ? 0.8 : U);
  const ZONA_MORTA = 0.13;
  const posCursor = () => { const r = trilho.getBoundingClientRect(); return (mX - r.left - r.width / 2) / (r.width / 2); };
  function alvoTrilho() {
    if (arrasto) return null;
    if (mouseNoTrilho && FINO) {
      const d = posCursor();                                   // -1 (esquerda) … 1 (direita)
      if (Math.abs(d) < ZONA_MORTA) return 0;                  // faixa do meio: para de vez
      // cursor à direita puxa os trabalhos para a esquerda (e vice-versa), mais rápido perto da borda
      return -Math.sign(d) * Math.pow((Math.abs(d) - ZONA_MORTA) / (1 - ZONA_MORTA), 1.6) * VMAX();
    }
    return AUTO() - (lenis ? limita(lenis.velocity, -60, 60) * 6 * U : 0);
  }
  trilho.addEventListener('pointerenter', (e) => { mouseNoTrilho = e.pointerType === 'mouse'; mX = e.clientX; });
  trilho.addEventListener('pointermove', (e) => {
    mX = e.clientX;
    if (arrasto) {
      const dx = e.clientX - arrasto.x;
      if (Math.abs(e.clientX - arrasto.x0) > 6) arrastou = true;
      const t = performance.now();
      tX += dx; tV = dx / Math.max(1, t - arrasto.t) * 1000 * 0.9;
      arrasto.x = e.clientX; arrasto.t = t;
    }
  });
  trilho.addEventListener('pointerleave', () => { mouseNoTrilho = false; });
  trilho.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    arrastou = false;
    if (e.pointerType === 'mouse' && FINO) return; // no desktop quem guia é a posição do cursor
    arrasto = { x: e.clientX, x0: e.clientX, t: performance.now() };
    trilho.setPointerCapture(e.pointerId);
  });
  const soltar = () => { arrasto = null; setTimeout(() => (arrastou = false), 0); };
  trilho.addEventListener('pointerup', soltar);
  trilho.addEventListener('pointercancel', soltar);

  new IntersectionObserver(([en]) => (tVisivel = en.isIntersecting), { rootMargin: '100px' }).observe(trilho);
  const dpr = () => window.devicePixelRatio || 1;
  function passoTrilho(dt) {
    if (!tSet || !tVisivel || casoAberto) return;
    if (!REDUZ) {
      const alvo = alvoTrilho();
      if (alvo !== null) tV += (alvo - tV) * (1 - Math.exp(-dt * (mouseNoTrilho ? 3.2 : 1.6)));
      if (!arrasto) tX += tV * dt;
    }
    tX = ((tX % tSet) + tSet) % tSet - tSet;                     // laço infinito: tX em (-tSet, 0]
    // arredonda no pixel do aparelho: as linhas entre os cards ficam sempre com a mesma espessura
    const px = Math.round(tX * dpr()) / dpr();
    tFaixa.style.transform = `translate3d(${px}px,0,0)`;
    // parallax da foto dentro de cada card, limitado à sobra da imagem (10% de cada lado)
    const vw = trilhoW, folga = cardW * 0.09;
    for (let i = 0; i < tCards.length; i++) {
      const cx = tX + i * cardW + cardW / 2;
      if (cx < -cardW || cx > vw + cardW) continue;
      const off = (cx - vw / 2) / vw;
      tCards[i].img.style.transform = `translate3d(${limita(-off * cardW * 0.16, -folga, folga).toFixed(2)}px,0,0)`;
    }
  }

  /* ---------- Molas das letras (nome do hero e "LETS TALK?") ---------- */
  // Letra perto do cursor estica para cima (scaleY) com física de mola; as vizinhas acompanham
  // numa gaussiana. Usa a propriedade `scale`, separada do `transform` da entrada.
  const molas = [];
  function elastico(grupo, amp = 0.24) {
    let ms = [];
    // (re)lê as letras do grupo: a troca de língua refaz o "LETS TALK?"
    grupo._refazer = () => {
      ms.forEach((m) => (m.morta = true));
      ms = $$('.letra', grupo).filter((l) => l.textContent.trim()).map((el) => ({ el, v: 0, vel: 0, alvo: 0, cx: 0, w: 1 }));
      molas.push(...ms);
    };
    grupo._refazer();
    const mede = () => ms.forEach((m) => { const r = m.el.getBoundingClientRect(); m.cx = r.left + r.width / 2; m.w = r.width; });
    grupo.addEventListener('pointerenter', mede);
    grupo.addEventListener('pointermove', (e) => {
      if (REDUZ || e.pointerType !== 'mouse') return;
      ms.forEach((m) => { const d = (e.clientX - m.cx) / (m.w * 1.25); m.alvo = amp * Math.exp(-d * d); });
    });
    grupo.addEventListener('pointerleave', () => ms.forEach((m) => (m.alvo = 0)));
  }
  function passoMolas(dt) {
    const h = Math.min(dt, 1 / 30) / 2;
    for (let i = molas.length - 1; i >= 0; i--) if (molas[i].morta) molas.splice(i, 1);
    for (const m of molas) {
      if (!m.alvo && !m.v && !m.vel) continue;
      for (let k = 0; k < 2; k++) { const a = 240 * (m.alvo - m.v) - 15 * m.vel; m.vel += a * h; m.v += m.vel * h; }
      if (Math.abs(m.alvo - m.v) < 1e-4 && Math.abs(m.vel) < 1e-4) { m.v = m.alvo; m.vel = 0; }
      m.el.style.scale = m.v ? `${(1 - m.v * 0.12).toFixed(4)} ${(1 + m.v).toFixed(4)}` : '';
    }
  }
  $$('.nome .linha-in').forEach((g) => elastico(g, 0.22));
  elastico($('.falar .linha-in'), 0.2);

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor'), cTxt = $('.seta-c'), dica = $('.cursor-dica');
  let cx = -100, cy = -100, cAlvoX = -100, cAlvoY = -100;
  // onde clicar e segurar NÃO desenha (links, trabalhos, lista que rola, menu, topo, projeto aberto)
  const INTERATIVO = 'a, button, .card, .trilho, .exp-lista, .caso, .menu, .topo, input, textarea';
  // o aviso volta a cada visita; some depois do primeiro risco e reaparece por 2 s aos 35 s
  let jaDesenhou = false, lembrete = false;
  setTimeout(() => { lembrete = true; setTimeout(() => (lembrete = false), 2000); }, 35000);
  let sobreFundo = false;
  if (FINO) {
    raiz.classList.add('cursor-proprio'); // esconde a seta do navegador (CSS)
    addEventListener('pointermove', (e) => {
      cAlvoX = e.clientX; cAlvoY = e.clientY; cursor.classList.add('visivel');
      const sobreLink = e.target.closest('a, button, .exp-lista');
      cursor.classList.toggle('link', !!sobreLink && !e.target.closest('.trilho'));
      sobreFundo = !e.target.closest(INTERATIVO) && !!e.target.closest('.secao');
      cursor.classList.toggle('escondido', !!e.target.closest('.poster')); // a lupa já é o cursor ali
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cursor.classList.remove('visivel'); sobreFundo = false; });
    document.addEventListener('pointerover', (e) => { if (e.target.tagName === 'IFRAME') cursor.classList.remove('visivel'); });
  }
  function passoCursor(dt) {
    if (!FINO) return;
    const k = 1 - Math.exp(-dt * 18);
    cx += (cAlvoX - cx) * k; cy += (cAlvoY - cy) * k;
    cursor.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    const noTrilho = mouseNoTrilho && !casoAberto;
    cursor.classList.toggle('trilho-on', noTrilho || (casoAberto && naEsteira));
    cursor.classList.toggle('desenhando', !!traco);
    if (casoAberto && naEsteira) cTxt.textContent = T.ui.arraste;
    else if (noTrilho) cTxt.textContent = T.ui.ver;
    // aviso "click to draw" ao lado do cursor, até a pessoa desenhar a primeira vez
    dica.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    dica.classList.toggle('on', ((!jaDesenhou && sobreFundo) || lembrete) && !casoAberto && !traco && cursor.classList.contains('visivel'));
  }

  /* ---------- Desenhar no fundo ---------- */
  // Cada parte tem um canvas atrás do conteúdo. Clicar e segurar no fundo risca com a cor do
  // texto daquela parte (grafite no creme, creme no contato). Os traços ficam guardados em
  // unidades do Figma, então sobrevivem a redimensionar a janela.
  const telas = secoes.map((sc) => {
    const c = document.createElement('canvas');
    c.className = 'desenho'; c.setAttribute('aria-hidden', 'true');
    sc.prepend(c);
    return { sc, c, ctx: c.getContext('2d'), tracos: [] };
  });
  let traco = null;
  // risco creme com mix-blend difference: preto no creme, negativo sobre textos e fotos (como o menu)
  const corTraco = getComputedStyle(raiz).getPropertyValue('--papel').trim() || '#FEF7E3';
  const limpar = $('.limpar');
  const dprD = () => Math.min(window.devicePixelRatio || 1, 1.5);
  function prepararTela(t) {
    const r = t.sc.getBoundingClientRect(), d = dprD();
    t.c.width = Math.round(r.width * d); t.c.height = Math.round(r.height * d);
    t.ctx.setTransform(d, 0, 0, d, 0, 0);
    t.ctx.lineCap = 'round'; t.ctx.lineJoin = 'round';
    t.tracos.forEach((tr) => desenharTraco(t, tr));
  }
  function desenharTraco(t, tr, desde = 0) {
    const p = tr.pts, ctx = t.ctx;
    ctx.strokeStyle = tr.cor; ctx.lineWidth = tr.w * U;
    ctx.beginPath();
    if (p.length === 1) { ctx.arc(p[0][0] * U, p[0][1] * U, tr.w * U / 2, 0, Math.PI * 2); ctx.fillStyle = tr.cor; ctx.fill(); return; }
    // curva pelos pontos médios: o risco sai liso mesmo com o mouse rápido
    const i0 = Math.max(1, desde);
    const m = (a, b) => [(a[0] + b[0]) / 2 * U, (a[1] + b[1]) / 2 * U];
    let ini = i0 === 1 ? [p[0][0] * U, p[0][1] * U] : m(p[i0 - 2], p[i0 - 1]);
    ctx.moveTo(ini[0], ini[1]);
    for (let i = i0; i < p.length; i++) {
      const fim = m(p[i - 1], p[i]);
      ctx.quadraticCurveTo(p[i - 1][0] * U, p[i - 1][1] * U, fim[0], fim[1]);
    }
    ctx.stroke();
  }
  const ponto = (t, e) => { const r = t.sc.getBoundingClientRect(); return [(e.clientX - r.left) / U, (e.clientY - r.top) / U]; };
  if (FINO && !ESTATICO) {
    telas.forEach(prepararTela);
    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || casoAberto || e.target.closest(INTERATIVO)) return;
      const sc = e.target.closest('.secao'); if (!sc) return;
      const t = telas.find((x) => x.sc === sc);
      e.preventDefault(); // não seleciona texto enquanto risca
      traco = { t, tr: { cor: corTraco, w: 3, pts: [ponto(t, e)] } };
      t.tracos.push(traco.tr);
      t.c.classList.add('tem'); // só agora o canvas entra na tela (vazio, o blend pesava na rolagem)
      desenharTraco(t, traco.tr);
      jaDesenhou = true;
      limpar.hidden = false; requestAnimationFrame(() => limpar.classList.add('on'));
    });
    addEventListener('pointermove', (e) => {
      if (!traco) return;
      const { t, tr } = traco, p = ponto(t, e), u = tr.pts[tr.pts.length - 1];
      if (Math.hypot(p[0] - u[0], p[1] - u[1]) < 1.5) return;
      tr.pts.push(p);
      desenharTraco(t, tr, tr.pts.length - 1);
    });
    // Limpar: os riscos esmaecem e desfocam antes de sumir, em vez de apagar de uma vez
    limpar.addEventListener('click', () => {
      limpar.classList.remove('on');
      telas.forEach((t) => t.c.classList.add('apagando'));
      setTimeout(() => {
        telas.forEach((t) => { t.tracos = []; t.ctx.clearRect(0, 0, t.c.width, t.c.height); t.c.classList.remove('apagando', 'tem'); });
        limpar.hidden = true;
      }, 750);
    });
    const parar = () => { traco = null; };
    addEventListener('pointerup', parar);
    addEventListener('pointercancel', parar);
    addEventListener('blur', parar);
  }

  /* ---------- Partes: navegação, transição e menu ---------- */
  let atual = 0, animando = false, bloqueado = false, ultimaRoda = 0;
  const topoDe = (i) => secoes[i].getBoundingClientRect().top + scrollY;
  const suave = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2); // easeInOutQuart
  // Rolagem animada até a parte i (desktop) ou rolagem suave comum (celular)
  function irSecao(i, instantaneo = false) {
    i = limita(i, 0, secoes.length - 1);
    const destino = Math.min(topoDe(i), document.documentElement.scrollHeight - innerHeight);
    atual = i;
    if (instantaneo || REDUZ) { scrollTo(0, destino); return; }
    if (!paginado()) { lenis ? lenis.scrollTo(destino, { duration: 1.3 }) : scrollTo({ top: destino, behavior: 'smooth' }); return; }
    animando = true; bloqueado = true;
    const ini = scrollY, dist = destino - ini, t0 = performance.now(), dur = 1150;
    const passo = (t) => {
      const k = limita((t - t0) / dur, 0, 1);
      scrollTo(0, ini + dist * suave(k));
      if (k < 1) requestAnimationFrame(passo); else animando = false;
    };
    requestAnimationFrame(passo);
  }
  const idPara = { top: 0, works: 1, about: 2, contact: 3 };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); irSecao(idPara[a.getAttribute('href').slice(1)] ?? 0); }));

  // Roda do mouse (desktop): um gesto = uma parte. A inércia do trackpad continua mandando eventos
  // depois da troca; o próximo gesto só vale quando a roda fica parada por um instante.
  addEventListener('wheel', (e) => {
    if (!paginado() || casoAberto) return;
    const lista = e.target.closest('.exp-lista');         // a lista da experiência rola por dentro…
    if (lista && (e.deltaY > 0 ? lista.scrollTop + lista.clientHeight < lista.scrollHeight - 1 : lista.scrollTop > 0)) return;
    e.preventDefault();
    const agora = performance.now(), pausa = agora - ultimaRoda;
    ultimaRoda = agora;
    if (animando) return;
    if (bloqueado) { if (pausa < 160) return; bloqueado = false; }
    if (Math.abs(e.deltaY) < 4) return;
    irSecao(atual + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });
  addEventListener('keydown', (e) => {
    if (!paginado() || casoAberto || animando || e.target.closest('input, textarea, .exp-lista')) return;
    if (e.key === ' ' && e.target.closest('a, button, [role="button"]')) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); irSecao(atual + 1); }
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); irSecao(atual - 1); }
    else if (k === 'Home') { e.preventDefault(); irSecao(0); }
    else if (k === 'End') { e.preventDefault(); irSecao(secoes.length - 1); }
  });

  // Durante a troca o conteúdo de cada parte anda um pouco mais devagar que a página (profundidade)
  const linhas = $$('.nome .linha'), internos = secoes.map((sc) => sc.querySelector(':scope > .pagina')), menuLinks = $$('.menu a');
  const ultTransf = [];
  function passoRolagem() {
    if (casoAberto) return;
    const y = scrollY, vh = innerHeight;
    let ativa = 0;
    secoes.forEach((sc, i) => {
      const r = sc.getBoundingClientRect();
      if (r.top < vh * 0.5) ativa = i;
      const off = paginado() ? limita(r.top / vh, -1, 1) : 0;
      const tr = Math.abs(off) < 0.001 ? '' : `translate3d(0,${(off * -14).toFixed(2)}vh,0)`;
      if (tr !== ultTransf[i]) { internos[i].style.transform = tr; ultTransf[i] = tr; }
    });
    if (!animando) atual = ativa;
    menuLinks.forEach((a) => a.classList.toggle('ativo', idPara[a.dataset.ir] === ativa));
    compactarMenu(!movel() && ativa >= 1);
    if (!movel() && !REDUZ && !paginado() && y < 764 * U * 1.2) {
      linhas[0].style.transform = `translate3d(${(-y * 0.14).toFixed(1)}px,0,0)`;
      linhas[1].style.transform = `translate3d(${(y * 0.09).toFixed(1)}px,0,0)`;
    }
  }

  // Menu vertical no início, horizontal abaixo do topo nas outras partes. A troca usa FLIP: mede
  // onde cada link está, muda o layout, e anima cada um do lugar antigo até o novo.
  let menuCompacto = false;
  // no modo horizontal o menu ocupa exatamente a largura de "EN PT 00:00", logo abaixo deles
  function medirMenu() {
    const l = $('.lingua').getBoundingClientRect(), h = $('.hora').getBoundingClientRect();
    raiz.style.setProperty('--menu-w', Math.max(0, h.right - l.left) + 'px');
  }
  function compactarMenu(sim) {
    if (sim === menuCompacto) return;
    menuCompacto = sim;
    const antes = menuLinks.map((a) => a.getBoundingClientRect());
    menu.classList.toggle('compacto', sim);
    if (REDUZ) return;
    menuLinks.forEach((a, i) => {
      const r = a.getBoundingClientRect(), k = antes[i].height / r.height; // o compacto é menor: escala junto
      a.style.transition = 'none';
      a.style.transformOrigin = '0 0';
      a.style.transform = `translate(${antes[i].left - r.left}px, ${antes[i].top - r.top}px) scale(${k})`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => menuLinks.forEach((a, i) => {
      a.style.transition = `transform .8s cubic-bezier(.76,0,.24,1) ${i * 45}ms`;
      a.style.transform = '';
    })));
  }

  /* ---------- Revelar ao entrar na tela ---------- */
  const io = new IntersectionObserver((ens) => ens.forEach((en) => {
    if (!en.isIntersecting) return;
    const sc = en.target;
    $$('.rv, .linha-up, .foto, .experiencia, .lista', sc).forEach((el) => el.classList.add('visto'));
    if (sc.id === 'works') trilho.classList.add('entrou');
    if (sc.id === 'about') contarAno();
    io.unobserve(sc);
  }), { threshold: 0.3 });

  // "since 2017": o ano volta no tempo de hoje até 2017 quando a parte aparece
  const anoFim = +$('.desde .ano').textContent;
  function contarAno() {
    const anoEl = $('.desde .ano');
    if (REDUZ || !anoEl) return;
    const ini = new Date().getFullYear(), t0 = performance.now() + 300, dur = 1400;
    const f = (t) => {
      const k = limita((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      anoEl.textContent = Math.round(ini + (anoFim - ini) * e);
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  /* ---------- Experiência: contador e dica de rolagem ---------- */
  const expLista = $('.exp-lista'), expCont = $('.exp-contador'), expItens = () => $$('.exp-item');
  function expAtualiza() {
    const fimLista = expLista.scrollTop + expLista.clientHeight >= expLista.scrollHeight - 4;
    expLista.classList.toggle('no-fim', fimLista);
    const topoL = expLista.getBoundingClientRect().top;
    let at = 0;
    const its = expItens();
    its.forEach((it, i) => { if (it.getBoundingClientRect().top - topoL < 30) at = i; });
    if (fimLista) at = its.length - 1;
    expCont.textContent = `${String(at + 1).padStart(2, '0')} / ${String(its.length).padStart(2, '0')}`;
  }
  expLista.addEventListener('scroll', expAtualiza, { passive: true });

  /* ---------- Copiar e-mail ---------- */
  const aviso = $('.aviso');
  $$('.copiar').forEach((a) => a.addEventListener('click', () => {
    const ok = () => { aviso.textContent = `${P.email} — ${T.contato.copiado}`; aviso.classList.add('on'); clearTimeout(aviso._t); aviso._t = setTimeout(() => aviso.classList.remove('on'), 2600); };
    const reserva = () => { const t = document.createElement('textarea'); t.value = P.email; document.body.append(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) {} t.remove(); };
    if (navigator.clipboard) navigator.clipboard.writeText(P.email).then(ok, reserva); else reserva();
  }));

  /* ---------- Projeto aberto ---------- */
  const caso = $('.caso'), cFaixa = $('.caso-faixa'), cEsteira = $('.caso-esteira'), cBarra = $('.caso-barra i'), cCont = $('.caso-cont');
  let casoAberto = false, casoIdx = 0, naEsteira = false, eX = 0, eAlvo = 0, eMin = 0, eArr = null, ultimoFoco = null;
  function abrirCaso(slug) {
    casoIdx = Math.max(0, E.projetos.findIndex((p) => p.slug === slug));
    const p = T.proj(E.projetos[casoIdx]), u = T.ui;
    caso.setAttribute('aria-label', p.sobretitulo ? `${p.sobretitulo} — ${p.titulo}` : p.titulo);
    const t = $('.caso-titulo');
    // sobretítulo pequeno em cima (ex.: "Canal de Ofertas"), o nome do cliente em destaque
    t.innerHTML = `${p.sobretitulo ? `<span class="caso-sobre">${esc(p.sobretitulo)}</span>` : ''}<span class="linha-in linha-up">${letras(p.titulo)}</span>`;
    caso.classList.toggle('juntas', !!p.juntas);
    $('.caso-info').innerHTML = `<p>${esc(p.resumo)}</p><dl class="caso-ficha">
      ${p.slug === 'redes-sociais' ? '' : `<dt>${u.cliente}</dt><dd>${esc(p.cliente)}</dd><dt>${u.agencia}</dt><dd>${esc(p.agencia)}</dd>`}
      <dt>${u.papel}</dt><dd>${esc(p.papel)}</dd><dt>${u.ano}</dt><dd>${esc(p.ano)}</dd></dl>`;
    cFaixa.innerHTML = p.setores ? setoresHTML(p) : p.galeria.map((g, i) => pecaHTML(g, p.titulo, i)).join('');
    caso.classList.toggle('com-setores', !!p.setores);
    cSetores.innerHTML = p.setores ? p.setores.map((st, i) => `<button type="button" data-i="${i}">${esc(st.titulo)}</button>`).join('') : '';
    eX = eAlvo = 0;
    medirEsteira();
    if (!casoAberto) { ultimoFoco = document.activeElement; lenis && lenis.stop(); raiz.style.overflow = 'hidden'; }
    casoAberto = true;
    caso.classList.add('aberto'); caso.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $('.linha-up', t).classList.add('visto');
      $$('.peca, .setor-info', cFaixa).forEach((f) => f.classList.add('visto'));
      setTimeout(() => $$('.disco', cFaixa).forEach((f) => f.classList.add('aberto')), 900);
    }));
    setTimeout(() => $('.caso-fechar').focus({ preventScroll: true }), 400);
  }
  function fecharCaso() {
    if (!casoAberto) return;
    casoAberto = false;
    caso.classList.remove('aberto'); caso.setAttribute('aria-hidden', 'true');
    raiz.style.overflow = ''; lenis && lenis.start();
    $$('video', cFaixa).forEach((v) => v.pause());
    ultimoFoco && ultimoFoco.focus && ultimoFoco.focus({ preventScroll: true });
  }
  // Peça comum da esteira (imagem ou vídeo), na proporção real (limitada para não virar fiapo)
  function pecaHTML(g, titulo, i, maxProp = 2.6) {
    const prop = g.w / g.h, longa = prop < 0.56;
    const midia = g.video
      ? `<video src="${g.video}" poster="${g.poster}" muted loop playsinline autoplay></video>`
      : `<img src="${g.src}" alt="${esc(titulo)} — ${i + 1}" draggable="false" decoding="async" ${i > 3 ? 'loading="lazy"' : ''}>`;
    return `<figure class="peca rv${longa ? ' longa' : ''}" style="--d:${Math.min(i, 6) * 80 + 250};--prop:${limita(prop, 0.56, maxProp)}">${midia}${g.t ? `<figcaption class="chip peca-leg">${esc(g.t)}</figcaption>` : ''}</figure>`;
  }
  const dois = (n) => String(n).padStart(2, '0');
  // Projeto com setores: cada segmento abre com uma coluna de texto e segue com as peças dele.
  // Carrossel = um card por vez com setas e pontos; e-mail = coluna que rola por dentro.
  function setoresHTML(p) {
    const u = T.ui, n = p.setores.length;
    return p.setores.map((st, si) => {
      let pecas = '';
      if (st.tipo === 'carrossel') pecas = st.posts.map((po) => `
        <figure class="peca carrossel rv" style="--d:300;--prop:${(po.pecas[0].w / po.pecas[0].h).toFixed(3)}" data-i="0" data-n="${po.pecas.length}">
          <div class="car-palco"><div class="car-trilho">${po.pecas.map((x, k) => `<img src="${x.src}" alt="${esc(po.titulo)} — ${k + 1}" draggable="false" loading="lazy">`).join('')}</div></div>
          <figcaption class="chip car-titulo">${esc(po.titulo)}</figcaption>
          <span class="chip car-cont">1 / ${po.pecas.length}</span>
          <button type="button" class="car-seta car-ant" aria-label="${u.anterior}" disabled>←</button>
          <button type="button" class="car-seta car-prox" aria-label="${u.seguinte}">→</button>
          <div class="car-pontos">${po.pecas.map((x, k) => `<button type="button" data-k="${k}" aria-label="${k + 1}"${k ? '' : ' aria-current="true"'}></button>`).join('')}</div>
          <span class="chip car-dica" aria-hidden="true">← ${u.deslize} →</span>
        </figure>`).join('');
      else if (st.tipo === 'email') pecas = st.emails.map((em, k) => `
        <figure class="peca email rv" style="--d:${300 + k * 60};--prop:.62">
          <button type="button" class="email-abrir" data-src="${em.src}" aria-label="${esc(em.remetente)} — ${u.ler}"><img src="${em.src}" alt="${esc(em.remetente)}" draggable="false" loading="lazy"></button>
          <figcaption class="chip email-de">${esc(em.remetente)} · ${esc(em.data)}</figcaption>
          <span class="chip email-dica" aria-hidden="true">${u.ler} ↗</span>
        </figure>`).join('');
      else if (st.tipo === 'navegador') pecas = navegadorHTML(st);
      else if (st.tipo === 'disco') pecas = discoHTML(st) + pecaHTML(st.mockup, st.titulo, 1, 2.6);
      // pôster com lupa que segue o mouse
      else if (st.tipo === 'poster') pecas = `<figure class="peca poster rv" style="--d:300;--prop:${(st.poster.w / st.poster.h).toFixed(4)}">
          <img src="${st.poster.src}" alt="${esc(st.titulo)}" draggable="false">
          <span class="lupa" aria-hidden="true" style="background-image:url('${st.poster.src}')"></span></figure>`;
      // vídeo de stories dentro de um celular
      else if (st.tipo === 'stories') pecas = `<figure class="peca celular rv" style="--d:300;--prop:.52">
          <div class="cel-tela"><video src="${st.video}" poster="${st.poster}" muted loop playsinline autoplay></video></div>
          <span class="chip cel-dur">${esc(st.duracao || '')}</span></figure>`;
      else pecas = st.pecas.map((g, k) => pecaHTML(g, st.titulo, k, 3.6)).join('');
      const dica = st.tipo === 'carrossel' ? u.dicaCarrossel : st.tipo === 'email' ? u.dicaEmail
        : st.tipo === 'navegador' ? (st.vivo ? u.dicaVivo : u.dicaNavegador)
        : st.tipo === 'disco' ? (st.encarte ? u.dicaDisco : u.dicaCapa)
        : st.tipo === 'poster' ? (FINO ? u.dicaPoster : '') : st.tipo === 'stories' ? u.dicaStories : '';
      return `<div class="setor" data-i="${si}">
        <div class="setor-info rv" style="--d:200">
          <span class="setor-n">${dois(si + 1)} / ${dois(n)}</span>
          <h3 class="setor-titulo">${esc(st.titulo)}</h3>
          ${st.ano ? `<span class="setor-ano">${esc(st.ano)}</span>` : ''}
          ${st.artista ? `<span class="setor-meta"><b>${esc(st.artista)}</b><br>${esc(st.selo || '')}</span>` : ''}
          <p class="setor-texto">${esc(st.texto)}</p>
          ${dica ? `<p class="setor-dica">${dica}</p>` : ''}
        </div>${pecas}</div>`;
    }).join('');
  }
  // Janela de navegador: abas = páginas do site. Com "vivo", o site de verdade roda num iframe
  // (mesma origem, 1440 px escalado para caber); sem ele, a página inteira rola dentro da janela.
  function navegadorHTML(st) {
    const abas = st.paginas.map((pg, k) => `<button type="button" data-k="${k}"${k ? '' : ' aria-current="true"'}>${esc(pg.titulo)}</button>`).join('');
    const tela = st.vivo
      ? `<iframe src="${st.vivo}" title="${esc(st.titulo)}" loading="lazy"></iframe>`
      : `<div class="email-rolo nav-rolo" data-lenis-prevent tabindex="0"><img src="${st.paginas[0].src}" alt="${esc(st.titulo)} — ${esc(st.paginas[0].titulo)}" draggable="false" loading="lazy"></div>`;
    return `<figure class="peca navegador rv${st.vivo ? ' vivo' : ''}" style="--d:300;--prop:1.6" data-setor="${esc(st.id)}">
      <div class="nav-barra"><span class="nav-bolas" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="nav-abas">${abas}</div>
        <span class="nav-url">${esc(st.url)}${st.paginas[0].hash || ''}</span></div>
      <div class="nav-tela">${tela}</div>
      ${st.vivo ? '' : `<span class="chip email-dica" aria-hidden="true">${T.ui.role} ↓</span>`}
    </figure>`;
  }
  function trocarPagina(fig, k) {
    const proj = T.proj(E.projetos[casoIdx]), st = proj.setores.find((x) => x.id === fig.dataset.setor), pg = st.paginas[k];
    $$('.nav-abas button', fig).forEach((b, j) => (j === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    $('.nav-url', fig).textContent = st.url + (pg.hash || '');
    const ifr = $('iframe', fig);
    if (ifr) { try { ifr.contentWindow.location.hash = pg.hash || ''; } catch (er) { ifr.src = st.vivo + (pg.hash || ''); } return; }
    const rolo = $('.nav-rolo', fig), img = $('img', rolo);
    rolo.classList.add('trocando');
    setTimeout(() => { img.src = pg.src; img.alt = `${st.titulo} — ${pg.titulo}`; rolo.scrollTop = 0; rolo.classList.remove('trocando'); }, 220);
  }
  // iframe do site vivo: 1440 px de largura, escalado para a largura da janela
  function escalarIframes() {
    $$('.nav-tela iframe', cFaixa).forEach((ifr) => {
      const tela = ifr.parentElement, k = tela.clientWidth / 1440;
      ifr.style.transform = `scale(${k})`; ifr.style.height = (tela.clientHeight / k) + 'px';
    });
  }
  // lupa do pôster: círculo com a imagem ampliada 2,6x no ponto do cursor
  cFaixa.addEventListener('pointermove', (e) => {
    const fig = e.target.closest('.poster'); if (!fig || e.pointerType !== 'mouse') return;
    const r = fig.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, z = 2.6, lupa = $('.lupa', fig);
    lupa.style.left = x + 'px'; lupa.style.top = y + 'px';
    lupa.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
    lupa.style.backgroundPosition = `${-(x * z - lupa.offsetWidth / 2)}px ${-(y * z - lupa.offsetHeight / 2)}px`;
  });
  // Disco: capa que vira (frente/verso), vinil que sai girando com o selo do lado A ou B
  // e, quando há encarte, o encarte (frente/verso) sai no lugar do vinil.
  function discoHTML(st) {
    const u = T.ui;
    const sel = (src, k) => `<img class="${k ? 'lb' : 'la'}" src="${src}" alt="" draggable="false" style="--lc:${st.labelCentro || 50}%;--ld:${st.labelDiam || 1}">`;
    const selo = st.labels ? st.labels.map(sel).join('') : sel(st.frente, 0) + sel(st.verso, 1);
    return `<figure class="peca disco rv" style="--d:300;--prop:${st.encarte ? 1.78 : 1.5}" data-capa="0" data-vinil="0" data-enc="0" data-modo="disco">
      <div class="disco-vinil" role="button" tabindex="0" aria-label="${u.virar}"><span class="vinil-aviso" aria-live="polite"></span><div class="vinil-vira"><div class="vinil-gira"><span class="vinil-selo"${st.furo ? ` style="--furo:${st.furo}%"` : ''}>${selo}</span></div></div></div>
      ${st.encarte ? `<div class="disco-encarte" role="button" tabindex="0" aria-label="${u.virar}"><span class="vinil-aviso enc-aviso" aria-live="polite"></span><div class="flip"><img class="f" src="${st.encarte[0]}" alt="${esc(st.titulo)} — ${u.encarte} 1" draggable="false"><img class="v" src="${st.encarte[1]}" alt="${esc(st.titulo)} — ${u.encarte} 2" draggable="false"></div></div>` : ''}
      <div class="disco-capa" role="button" tabindex="0" aria-label="${u.virar}"><span class="vinil-aviso capa-aviso" aria-live="polite"></span><div class="flip"><img class="f" src="${st.frente}" alt="${esc(st.titulo)} — ${u.frente}" draggable="false"><img class="v" src="${st.verso}" alt="${esc(st.titulo)} — ${u.verso}" draggable="false"></div></div>
      <div class="disco-botoes">
        <button type="button" class="d-virar">↻ ${u.virar}</button>
        ${st.encarte ? `<span class="d-seg"><button type="button" class="d-modo" data-m="disco" aria-pressed="true">${u.disco}</button><button type="button" class="d-modo" data-m="encarte" aria-pressed="false">${u.encarte}</button></span>` : ''}
        <span class="d-lado" data-lados='${esc(JSON.stringify(st.lados || []))}'>${discoLegenda(st.lados, 0)}</span>
      </div>
    </figure>`;
  }
  // capa e encarte: viram em 3D e mostram um aviso grande "Frente"/"Verso" no centro, como o vinil
  function virarPeca(dsc, qual, k, aviso = true) {
    if (String(k) === dsc.dataset[qual]) return;
    dsc.dataset[qual] = k;
    const cls = 'virando-' + qual;
    dsc.classList.remove(cls); void dsc.offsetWidth; dsc.classList.add(cls);
    clearTimeout(dsc['_' + cls]); dsc['_' + cls] = setTimeout(() => dsc.classList.remove(cls), 700);
    if (!aviso) return;
    const el = $(qual === 'capa' ? '.capa-aviso' : '.enc-aviso', dsc);
    el.textContent = k ? T.ui.verso : T.ui.frente;
    el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1700);
  }
  function virarVinil(dsc, k) {
    if (String(k) === dsc.dataset.vinil) return;
    dsc.dataset.vinil = k;
    dsc.classList.remove('virando'); void dsc.offsetWidth; dsc.classList.add('virando');
    clearTimeout(dsc._vira); dsc._vira = setTimeout(() => dsc.classList.remove('virando'), 700);
    const leg = $('.d-lado', dsc);
    leg.innerHTML = discoLegenda(JSON.parse(leg.dataset.lados || '[]'), k);
    // os selos A e B são parecidos: um aviso grande deixa claro qual lado ficou para cima
    $('.vinil-aviso', dsc).textContent = `${T.ui.lado} ${'AB'[k]}`;
    dsc.classList.add('mostra-lado'); clearTimeout(dsc._aviso);
    dsc._aviso = setTimeout(() => dsc.classList.remove('mostra-lado'), 1500);
  }
  // leitor de e-mail: por cima do projeto, a roda só rola o e-mail (a esteira fica parada)
  const leitor = $('.leitor'), leitorRolo = $('.leitor-rolo');
  function abrirLeitor(src, nome) {
    const img = $('img', leitorRolo); img.src = src; img.alt = nome || '';
    leitorRolo.scrollTop = 0; leitor.hidden = false;
    requestAnimationFrame(() => leitor.classList.add('on'));
    leitorRolo.focus({ preventScroll: true });
  }
  function fecharLeitor() { leitor.classList.remove('on'); setTimeout(() => (leitor.hidden = true), 300); }
  $('.leitor-fechar').addEventListener('click', fecharLeitor);
  leitor.addEventListener('click', (e) => { if (e.target === leitor) fecharLeitor(); });
  // roda em qualquer ponto do leitor (inclusive no fundo escuro) rola o e-mail
  leitor.addEventListener('wheel', (e) => { if (e.target.closest('.leitor-rolo')) return; e.preventDefault(); leitorRolo.scrollTop += e.deltaY; }, { passive: false });
  const discoLegenda = (lados, k) => lados && lados.length ? `${T.ui.lado} ${'AB'[k]} · ${esc(lados[k])}` : (k ? T.ui.verso : T.ui.frente);
  let setorX = [], esteiraW = 0, abaAtiva = -1;
  function medirEsteira() {
    const h = cFaixa.clientHeight || (cEsteira.clientHeight - 76 * U);
    $$('.peca', cFaixa).forEach((f) => (f.style.width = (h * parseFloat(f.style.getPropertyValue('--prop'))).toFixed(1) + 'px'));
    eMin = Math.min(0, cEsteira.clientWidth - cFaixa.scrollWidth);
    eAlvo = limita(eAlvo, eMin, 0);
    setorX = $$('.setor', cFaixa).map((st) => st.offsetLeft);
    esteiraW = cEsteira.clientWidth; abaAtiva = -1;
    escalarIframes();
  }
  const cSetores = $('.caso-setores');
  cSetores.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    eAlvo = limita(-(setorX[+b.dataset.i] - 13 * U), eMin, 0);
  });
  // carrossel: setas, pontos e arraste dentro do card (sem mover a esteira)
  function irCard(fig, k) {
    const n = +fig.dataset.n; k = limita(k, 0, n - 1);
    fig.dataset.i = k; fig.classList.add('usado');
    $('.car-trilho', fig).style.transform = `translate3d(${-k * 100}%,0,0)`;
    $('.car-cont', fig).textContent = `${k + 1} / ${n}`;
    $('.car-ant', fig).disabled = k === 0; $('.car-prox', fig).disabled = k === n - 1;
    $$('.car-pontos button', fig).forEach((b, j) => (j === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  }
  cFaixa.addEventListener('click', (e) => {
    const dsc = e.target.closest('.disco');
    if (dsc && e.target.closest('.d-virar')) { const k = dsc.dataset.capa === '0' ? 1 : 0; virarPeca(dsc, 'capa', k); virarVinil(dsc, k); virarPeca(dsc, 'enc', k, false); return; }
    if (dsc && e.target.closest('.disco-vinil')) { virarVinil(dsc, dsc.dataset.vinil === '0' ? 1 : 0); return; }
    if (dsc && e.target.closest('.disco-encarte')) { virarPeca(dsc, 'enc', dsc.dataset.enc === '0' ? 1 : 0); return; }
    if (dsc && e.target.closest('.disco-capa')) { virarPeca(dsc, 'capa', dsc.dataset.capa === '0' ? 1 : 0); return; }
    const ab = e.target.closest('.email-abrir');
    if (ab) { abrirLeitor(ab.dataset.src, ab.getAttribute('aria-label')); return; }
    if (dsc && e.target.closest('.d-modo')) {
      const mo = e.target.closest('.d-modo').dataset.m;
      dsc.dataset.modo = mo;
      $$('.d-modo', dsc).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mo)));
      return;
    }
    const aba = e.target.closest('.nav-abas button');
    if (aba) { trocarPagina(aba.closest('.navegador'), +aba.dataset.k); return; }
    const fig = e.target.closest('.carrossel'); if (!fig) return;
    const i = +fig.dataset.i;
    if (e.target.closest('.car-ant')) irCard(fig, i - 1);
    else if (e.target.closest('.car-prox')) irCard(fig, i + 1);
    else if (e.target.closest('.car-pontos button')) irCard(fig, +e.target.closest('button').dataset.k);
  });
  let carArr = null;
  cFaixa.addEventListener('pointerdown', (e) => {
    const palco = e.target.closest('.car-palco'); if (!palco) return;
    carArr = { fig: palco.closest('.carrossel'), x: e.clientX };
  });
  addEventListener('pointerup', (e) => {
    if (!carArr) return;
    const dx = e.clientX - carArr.x;
    if (Math.abs(dx) > 30) irCard(carArr.fig, +carArr.fig.dataset.i + (dx < 0 ? 1 : -1));
    carArr = null;
  });
  // e-mail: a dica "role" some quando a pessoa rola
  cFaixa.addEventListener('scroll', (e) => { const f = e.target.closest && e.target.closest('.email, .navegador'); if (f) f.classList.add('usado'); }, true);
  $('.caso-fechar').addEventListener('click', fecharCaso);
  $('.caso-prox').addEventListener('click', () => abrirCaso(E.projetos[(casoIdx + 1) % N].slug));
  addEventListener('keydown', (e) => {
    if (!casoAberto) return;
    if (e.key === 'Escape') { if (!leitor.hidden) fecharLeitor(); else fecharCaso(); }
    if (e.key === 'ArrowRight') eAlvo = limita(eAlvo - cEsteira.clientWidth * 0.5, eMin, 0);
    if (e.key === 'ArrowLeft') eAlvo = limita(eAlvo + cEsteira.clientWidth * 0.5, eMin, 0);
  });
  cEsteira.addEventListener('wheel', (e) => {
    const rolo = e.target.closest('.email-rolo');
    if (rolo && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const pode = e.deltaY > 0 ? rolo.scrollTop + rolo.clientHeight < rolo.scrollHeight - 1 : rolo.scrollTop > 0;
      if (pode) return; // rolagem nativa do e-mail
    }
    e.preventDefault(); eAlvo = limita(eAlvo - (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 1.1, eMin, 0); }, { passive: false });
  cEsteira.addEventListener('pointerenter', () => (naEsteira = true));
  cEsteira.addEventListener('pointerleave', () => (naEsteira = false));
  cEsteira.addEventListener('pointerdown', (e) => { if (e.target.closest('button, .car-palco, .email-rolo, .nav-tela, .disco-vinil, .disco-encarte, .disco-capa')) return; eArr = { x: e.clientX, a: eAlvo, t: performance.now(), v: 0 }; cEsteira.setPointerCapture(e.pointerId); });
  cEsteira.addEventListener('pointermove', (e) => {
    if (!eArr) return;
    const novo = limita(eArr.a + (e.clientX - eArr.x), eMin - 80, 80), t = performance.now();
    eArr.v = (novo - eAlvo) / Math.max(1, t - eArr.t); eArr.t = t;
    eAlvo = novo; eX = novo;
  });
  const eSolta = () => { if (!eArr) return; eAlvo = limita(eAlvo + eArr.v * 320, eMin, 0); eArr = null; };
  cEsteira.addEventListener('pointerup', eSolta);
  cEsteira.addEventListener('pointercancel', eSolta);
  function passoEsteira(dt) {
    if (!casoAberto) return;
    if (!eArr) eX += (eAlvo - eX) * (1 - Math.exp(-dt * (REDUZ ? 60 : 7)));
    cFaixa.style.transform = `translate3d(${eX.toFixed(2)}px,0,0)`;
    const prog = eMin ? limita(eX / eMin, 0, 1) : 1;
    cBarra.style.transform = `scaleX(${prog.toFixed(4)})`;
    if (setorX.length) {
      let ativo = 0;
      setorX.forEach((x, i) => { if (x + eX < esteiraW * 0.4) ativo = i; });
      if (eX <= eMin + 2) ativo = setorX.length - 1;
      if (ativo !== abaAtiva) { abaAtiva = ativo; $$('button', cSetores).forEach((b, i) => b.classList.toggle('ativo', i === ativo)); }
      return;
    }
    const n = cFaixa.children.length;
    cCont.textContent = `${String(Math.min(n, 1 + Math.round(prog * (n - 1)))).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
  }

  /* ---------- Troca de língua ---------- */
  const falar = $('.falar'), falarIn = $('.falar .linha-in');
  // título do contato cabe sempre na largura do Figma (1265 px): frases maiores encolhem
  function ajustarFalar() {
    falar.style.fontSize = '';
    if (movel()) return; // no celular o título quebra em linhas
    const alvo = falar.clientWidth, w = falarIn.scrollWidth;
    if (w > alvo) falar.style.fontSize = (parseFloat(getComputedStyle(falar).fontSize) * alvo / w * 0.98) + 'px';
  }
  const botoesLingua = $$('.lingua button');
  const marcarLingua = () => botoesLingua.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === LANG)));
  function aplicarLingua() {
    T = L();
    raiz.lang = LANG === 'pt' ? 'pt-BR' : 'en';
    marcarLingua();
    $('.letreiro').setAttribute('aria-label', T.perfil.papeis.join(' • '));
    montarLetreiro();
    $('.hora').setAttribute('aria-label', T.ui.hora);
    $('.hero-frase').textContent = T.perfil.frase;
    $('.hero-tag').innerHTML = H.tag(T);
    $('.trabalhos .rotulo').innerHTML = T.trabalhos.rotulo;
    tCopias = 0; montarTrilho(); trilho.classList.add('entrou');
    $('.desde').innerHTML = H.desde(T);
    $('.foto img').alt = T.ui.foto;
    $('.sobre-titulo').textContent = T.sobre.titulo;
    $('.sobre-corpo').textContent = T.sobre.texto;
    $('.grupos').innerHTML = H.grupos(T);
    $$('.grupos .rv, .grupos .lista').forEach((el) => el.classList.add('visto'));
    const bt = $('.botao'); bt.textContent = T.sobre.botao; bt.href = T.perfil.curriculo;
    $('.exp-topo .rotulo').innerHTML = T.sobre.rotuloExperiencia;
    expLista.innerHTML = H.exp(T); expLista.scrollTop = 0; expAtualiza();
    falarIn.innerHTML = letras(T.contato.titulo); falarIn._refazer(); ajustarFalar();
    $('.falar a').setAttribute('aria-label', `${T.contato.titulo} — ${P.email}`);
    $('.base').innerHTML = T.contato.base;
    menuLinks.forEach((a, i) => { $('span', a).textContent = T.menu[i]; });
    medirMenu();
    dica.textContent = T.ui.dica; limpar.textContent = T.ui.limpar;
    $('.caso-fechar b').textContent = T.ui.fechar; $('.caso-prox b').textContent = T.ui.proximo;
    $('.caso-dica').textContent = H.esteira(T);
    if (casoAberto) abrirCaso(E.projetos[casoIdx].slug);
  }
  marcarLingua();
  botoesLingua.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.l === LANG) return;
    LANG = b.dataset.l;
    try { localStorage.setItem('jpo-lingua', LANG); } catch (e) {}
    // os textos somem rápido, trocam e voltam (sem pular a página)
    app.classList.add('trocando-lingua');
    setTimeout(() => { aplicarLingua(); requestAnimationFrame(() => app.classList.remove('trocando-lingua')); }, REDUZ ? 0 : 260);
  }));

  /* ---------- Laço principal ---------- */
  let tAnt = 0;
  function quadro(t) {
    const dt = Math.min(0.05, (t - (tAnt || t)) / 1000); tAnt = t;
    lenis && lenis.raf(t);
    if (lSet && !REDUZ) {
      lVel += (lAlvo - lVel) * (1 - Math.exp(-dt * 4));
      lX -= 42 * (movel() ? 0.8 : U) * lVel * dt;
      if (lX <= -lSet) lX += lSet;
      lFaixa.style.transform = `translate3d(${lX.toFixed(2)}px,0,0)`;
    }
    passoTrilho(dt);
    passoMolas(dt);
    passoCursor(dt);
    passoRolagem();
    passoEsteira(dt);
    requestAnimationFrame(quadro);
  }

  /* ---------- Partida ---------- */
  let rz = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => { medir(); ajustarFalar(); medirMenu(); montarLetreiro(); montarTrilho(); expAtualiza(); casoAberto && medirEsteira(); lenis && lenis.resize && lenis.resize(); if (paginado()) irSecao(atual, true); if (FINO && !ESTATICO) telas.forEach(prepararTela); });
  });

  function partir() {
    medir(); ajustarFalar(); montarLetreiro(); montarTrilho(); expAtualiza(); medirMenu();
    app.classList.add('pronto');
    setTimeout(() => menu.classList.add('pronto'), REDUZ ? 0 : 500);
    // abre direto na parte do endereço (#works, #about, #contact)
    const h = location.hash.slice(1);
    if (idPara[h]) irSecao(idPara[h], true);
    if (ESTATICO || REDUZ) { $$('.rv, .linha-up, .foto, .experiencia, .lista').forEach((el) => el.classList.add('visto')); trilho.classList.add('entrou'); }
    else secoes.forEach((sc) => io.observe(sc));
    requestAnimationFrame(quadro);
  }
  // espera as fontes (no máximo 1,5 s) para medir letreiro e trilho com a fonte certa
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(partir);
})();
