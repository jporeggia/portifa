/*
  Monta as páginas a partir do JSON em <script id="estado"> e liga o que é vivo:
  o contador até o lançamento, o foco do título, o fade das fotos do merch e o grão do fundo.
  Uma página só, com rota pelo #endereço: assim o estado é um e o Artifact publica um arquivo.
  ?estatico na URL (ou "reduzir movimento" no sistema) deixa o grão parado e o título nítido.
*/
(function () {
  const S = JSON.parse(document.getElementById("estado").textContent);
  const url = new URLSearchParams(location.search);
  const ESTATICO = url.has("estatico") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ícones tirados do Figma (camada ICONS), na cor da tinta
  const I = {
    instagram: '<svg aria-hidden="true" viewBox="0 0 29 29" fill="currentColor"><path d="M14.5 2.418C11.219 2.418 10.808 2.439 9.519 2.492C8.233 2.551 7.356 2.752 6.588 3.051C5.793 3.359 5.117 3.774 4.445 4.446C3.773 5.118 3.362 5.791 3.054 6.585C2.755 7.354 2.55 8.234 2.491 9.52C2.432 10.809 2.417 11.221 2.417 14.502C2.417 17.784 2.432 18.195 2.491 19.484C2.55 20.77 2.755 21.647 3.054 22.415C3.362 23.21 3.773 23.883 4.445 24.555C5.117 25.226 5.793 25.641 6.588 25.95C7.356 26.248 8.233 26.454 9.519 26.512C10.808 26.571 11.219 26.583 14.5 26.583C17.782 26.583 18.193 26.564 19.482 26.512C20.768 26.454 21.648 26.248 22.416 25.95C23.211 25.641 23.884 25.226 24.556 24.555C25.227 23.883 25.638 23.21 25.947 22.415C26.246 21.647 26.451 20.77 26.51 19.484C26.569 18.195 26.584 17.784 26.584 14.502C26.584 11.221 26.569 10.809 26.51 9.52C26.451 8.234 26.246 7.354 25.947 6.585C25.638 5.791 25.227 5.118 24.556 4.446C23.884 3.774 23.211 3.359 22.416 3.051C21.648 2.752 20.768 2.551 19.482 2.492C18.193 2.433 17.782 2.418 14.5 2.418ZM14.5 4.594C17.726 4.594 18.108 4.613 19.382 4.664C20.56 4.717 21.202 4.917 21.628 5.083C22.192 5.302 22.593 5.563 23.016 5.986C23.439 6.408 23.7 6.81 23.919 7.374C24.084 7.799 24.283 8.442 24.337 9.62C24.395 10.894 24.407 11.276 24.407 14.502C24.407 17.728 24.394 18.11 24.337 19.384C24.283 20.562 24.084 21.201 23.919 21.627C23.7 22.191 23.439 22.595 23.016 23.018C22.593 23.441 22.192 23.702 21.628 23.921C21.202 24.086 20.56 24.282 19.382 24.336C18.108 24.395 17.727 24.406 14.5 24.406C11.274 24.406 10.893 24.387 9.619 24.336C8.441 24.283 7.802 24.087 7.376 23.921C6.812 23.702 6.407 23.441 5.985 23.018C5.562 22.595 5.301 22.191 5.082 21.627C4.916 21.201 4.721 20.562 4.667 19.384C4.609 18.11 4.597 17.728 4.597 14.502C4.597 11.276 4.61 10.894 4.667 9.62C4.721 8.442 4.916 7.799 5.082 7.374C5.301 6.81 5.562 6.408 5.985 5.986C6.407 5.563 6.812 5.302 7.376 5.083C7.802 4.918 8.441 4.718 9.619 4.664C10.893 4.606 11.274 4.594 14.5 4.594ZM20.951 6.6C20.15 6.6 19.5 7.25 19.5 8.051C19.5 8.852 20.15 9.502 20.951 9.502C21.752 9.502 22.402 8.852 22.402 8.051C22.402 7.25 21.752 6.6 20.951 6.6ZM14.5 8.295C11.074 8.295 8.298 11.075 8.298 14.502C8.298 17.929 11.074 20.705 14.5 20.705C17.927 20.705 20.707 17.929 20.707 14.502C20.707 11.075 17.927 8.295 14.5 8.295ZM14.5 10.475C16.725 10.475 18.527 12.278 18.527 14.502C18.527 16.727 16.725 18.529 14.5 18.529C12.276 18.529 10.474 16.727 10.474 14.502C10.474 12.278 12.276 10.475 14.5 10.475Z"/></svg>',
    spotify: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12.476 0.01C5.853 -0.254 0.272 4.901 0.01 11.524C-0.254 18.147 4.903 23.727 11.524 23.99C18.147 24.254 23.727 19.099 23.99 12.476C24.253 5.853 19.097 0.272 12.476 0.01ZM17.541 17.588C17.392 17.851 17.101 17.983 16.818 17.944C16.732 17.932 16.645 17.903 16.564 17.857C14.978 16.954 13.249 16.366 11.426 16.11C9.603 15.853 7.779 15.942 6.006 16.373C5.621 16.466 5.234 16.23 5.141 15.845C5.047 15.46 5.283 15.073 5.668 14.98C7.618 14.506 9.623 14.409 11.626 14.69C13.629 14.972 15.528 15.618 17.273 16.611C17.617 16.807 17.737 17.244 17.542 17.588L17.541 17.588ZM19.118 14.438C18.874 14.89 18.308 15.059 17.856 14.814C16 13.811 13.991 13.152 11.884 12.856C9.777 12.559 7.664 12.639 5.603 13.092C5.492 13.117 5.381 13.121 5.273 13.106C4.899 13.053 4.579 12.774 4.493 12.383C4.383 11.88 4.701 11.384 5.203 11.273C7.481 10.772 9.816 10.683 12.144 11.01C14.47 11.336 16.691 12.065 18.742 13.175C19.195 13.419 19.363 13.984 19.118 14.437L19.118 14.438ZM20.867 10.888C20.636 11.331 20.157 11.56 19.69 11.494C19.564 11.477 19.44 11.437 19.32 11.376C17.159 10.252 14.832 9.509 12.403 9.168C9.973 8.827 7.53 8.899 5.144 9.384C4.523 9.51 3.919 9.109 3.793 8.489C3.666 7.868 4.068 7.264 4.688 7.138C7.331 6.601 10.033 6.521 12.722 6.899C15.41 7.276 17.985 8.099 20.379 9.344C20.94 9.635 21.158 10.327 20.867 10.889L20.867 10.888Z"/></svg>',
    apple: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M23.934 7.487C23.934 7.201 23.934 6.915 23.932 6.629C23.931 6.388 23.928 6.148 23.922 5.907C23.908 5.382 23.876 4.854 23.783 4.335C23.689 3.809 23.534 3.319 23.291 2.84C23.051 2.37 22.739 1.941 22.366 1.568C21.993 1.195 21.563 0.882 21.093 0.643C20.615 0.4 20.125 0.245 19.599 0.15C19.08 0.057 18.551 0.026 18.027 0.012C17.786 0.005 17.545 0.003 17.305 0.001C17.019 0 16.733 0 16.447 0L7.487 0C7.201 0 6.915 0 6.629 0.001C6.388 0.003 6.148 0.005 5.907 0.012C5.382 0.027 4.853 0.057 4.335 0.151C3.808 0.245 3.319 0.4 2.841 0.644C2.371 0.883 1.941 1.195 1.568 1.568C1.195 1.941 0.882 2.371 0.643 2.841C0.4 3.319 0.245 3.809 0.15 4.336C0.057 4.855 0.026 5.384 0.012 5.908C0.005 6.148 0.003 6.389 0.001 6.63C0 6.915 0 7.201 0 7.487L0 16.446C0 16.732 0 17.018 0.001 17.304C0.003 17.545 0.005 17.785 0.012 18.026C0.026 18.55 0.057 19.079 0.15 19.598C0.245 20.124 0.4 20.614 0.643 21.093C0.882 21.563 1.195 21.992 1.568 22.365C1.941 22.738 2.371 23.051 2.841 23.29C3.319 23.533 3.809 23.688 4.335 23.783C4.853 23.876 5.382 23.907 5.907 23.921C6.148 23.928 6.388 23.93 6.629 23.932C6.915 23.934 7.201 23.933 7.487 23.933L16.446 23.933C16.732 23.933 17.018 23.933 17.304 23.932C17.545 23.93 17.785 23.928 18.026 23.921C18.55 23.907 19.08 23.876 19.598 23.783C20.125 23.688 20.614 23.533 21.092 23.29C21.562 23.051 21.992 22.738 22.365 22.365C22.738 21.992 23.051 21.563 23.29 21.093C23.533 20.614 23.688 20.124 23.783 19.598C23.876 19.079 23.907 18.55 23.921 18.026C23.928 17.785 23.93 17.545 23.932 17.304C23.934 17.018 23.933 16.732 23.933 16.446L23.933 7.487L23.934 7.487Z"/><path class="vazado" d="M16.919 3.657C16.861 3.662 16.347 3.753 16.286 3.766L9.172 5.201L9.169 5.202C8.984 5.241 8.838 5.307 8.726 5.401C8.59 5.515 8.515 5.676 8.487 5.863C8.481 5.903 8.471 5.984 8.471 6.104C8.471 6.104 8.471 13.372 8.471 15.007C8.471 15.215 8.454 15.418 8.313 15.59C8.172 15.762 7.998 15.814 7.794 15.855C7.639 15.886 7.484 15.918 7.329 15.949C6.742 16.067 6.359 16.148 6.013 16.282C5.682 16.41 5.434 16.574 5.236 16.781C4.845 17.191 4.686 17.748 4.74 18.269C4.787 18.714 4.987 19.139 5.331 19.454C5.563 19.666 5.853 19.828 6.194 19.896C6.549 19.968 6.926 19.943 7.478 19.831C7.772 19.772 8.047 19.68 8.309 19.525C8.568 19.372 8.79 19.168 8.964 18.919C9.138 18.67 9.251 18.393 9.312 18.098C9.376 17.794 9.391 17.52 9.391 17.217L9.391 9.495C9.391 9.081 9.508 8.972 9.842 8.891C9.842 8.891 15.755 7.698 16.031 7.645C16.416 7.571 16.597 7.68 16.597 8.084L16.597 13.355C16.597 13.564 16.595 13.775 16.453 13.948C16.312 14.121 16.138 14.172 15.934 14.214C15.779 14.245 15.624 14.276 15.469 14.307C14.882 14.426 14.499 14.506 14.153 14.64C13.822 14.769 13.574 14.932 13.376 15.14C12.985 15.55 12.812 16.106 12.866 16.628C12.913 17.072 13.127 17.498 13.471 17.812C13.703 18.025 13.993 18.182 14.334 18.251C14.689 18.322 15.066 18.297 15.618 18.186C15.912 18.127 16.187 18.038 16.449 17.883C16.708 17.73 16.931 17.526 17.104 17.278C17.278 17.028 17.391 16.751 17.452 16.457C17.516 16.153 17.519 15.878 17.519 15.575L17.519 4.286C17.52 3.876 17.304 3.624 16.919 3.657Z"/></svg>',
  };

  const link = (href, conteudo, extra = "") => {
    const fora = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${esc(href || "#")}"${fora}${extra}>${conteudo}</a>`;
  };

  // ───────── pedaços comuns ─────────
  // item do menu: o da página atual ganha aria-current; "destaque" sai sublinhado (pre-save);
  // "preSave" usa o link único do estado (o mesmo do título da front); sem link ainda,
  // fica pronto mas não leva a lugar nenhum (data-em-breve)
  const emBreve = (href) => (href ? "" : ' data-em-breve title="link em breve"');
  const item = (n, rota) => [
    n.href === "#" + rota ? ' aria-current="page"' : "",
    n.destaque ? ' class="destaque"' : "",
    emBreve(n.preSave ? S.preSave : n.href),
  ].join("");
  document.addEventListener("click", (e) => { if (e.target.closest("[data-em-breve]")) e.preventDefault(); });

  const topo = (rota) => `
      <header class="topo">
        ${link("#", `<img src="${esc(S.logo)}" alt="${esc(S.banda)}" width="900" height="167">`, ' class="logo"')}
        <nav class="menu">${S.nav.map((n) => link(n.preSave ? S.preSave : n.href, esc(n.rotulo), item(n, rota))).join("")}${iconeSacola(rota)}</nav>
      </header>`;

  const redes = () => `
      <footer class="redes">
        ${S.redes.map((r) => link(r.href, I[r.rede] || "", ` class="${esc(r.rede)}" aria-label="${esc(r.rotulo)}"`)).join("")}
      </footer>`;

  // ───────── páginas ─────────
  // cada página é um frame do Figma; a rota vem do #endereço (#merch, #comprar-camiseta), vazio é a front.
  // Só letras e hífen: o link do Artifact só repassa âncoras simples (sem barra)
  const PAGINAS = {
    front: () => `
      <section class="centro">
        <h1 class="titulo">${link(S.preSave, esc(S.disco.titulo), emBreve(S.preSave))}</h1>
        <p class="contador" role="timer"><span class="sr">Faltam para o lançamento: </span><span id="tempo" aria-hidden="true">00:00:00:00</span><span class="sr" id="tempo-falado"></span></p>
      </section>`,

    merch: () => `
      <section class="loja" data-rola>
        <h1 class="loja-titulo">${esc(S.merch.titulo)}</h1>
        <ul class="produtos">${S.merch.produtos.map(produto).join("")}</ul>
      </section>`,

    datas: () => {
      const D = S.datas;
      return `
      <section class="agenda">
        <h1 class="loja-titulo">${esc(D.titulo)}</h1>
        <div class="agenda-grade">
          <div class="agenda-placar" aria-hidden="true">
            <p class="placar">${rolos("00.00")}</p>
            <p class="placar-nota"></p>
          </div>
          <ol class="shows" data-rola tabindex="0" aria-label="próximos shows">${D.shows.map(show).join("")}</ol>
        </div>
      </section>`;
    },

    comprar: (slug) => {
      const p = produtoDe(slug);
      return p ? paginaProduto(p) : PAGINAS.merch();
    },

    sacola: () => paginaSacola(),
  };

  // produto com mais de uma foto vira um visualizador que troca as fotos em fade
  const visor = (p) => `<div class="visor${p.fotos.length > 1 ? " troca" : ""}">${p.fotos.map((f, i) =>
      `<img src="${esc(f.src)}" alt="${esc(f.alt)}" width="800" height="800"${i ? ' loading="lazy"' : ' class="ativa"'}>`).join("")}</div>`;

  const produto = (p) => `
        <li class="produto">
          <a href="#comprar-${esc(p.slug)}">
            <div class="visor-moldura">${visor(p)}<span class="etiqueta" aria-hidden="true">comprar</span></div>
            <p class="produto-nome">${esc(p.nome)}</p>
            <p class="produto-preco">${esc(p.preco)}</p>
          </a>
        </li>`;

  // ───────── datas ─────────
  // horário de Brasília, seja qual for o fuso de quem visita
  const quando = (iso, o) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...o }).format(new Date(iso)).replace(".", "");
  const hora = (iso) => quando(iso, { hour: "2-digit", minute: "2-digit" }).replace(/:00$/, "h").replace(":", "h");

  // cada algarismo do placar é uma fita de 0 a 9 dentro de uma janela de 1em; girar = subir a fita
  const rolos = (texto) => [...texto].map((c, i) => /[0-9]/.test(c)
    ? `<span class="rolo" style="--i:${i}"><span class="fita">${"0123456789".split("").map((n) => `<span>${n}</span>`).join("")}</span></span>`
    : `<span class="ponto">${c}</span>`).join("");

  function show(sh, i) {
    const passou = new Date(sh.data).getTime() < Date.now();
    const status = passou ? "já foi" : sh.status;
    const botao = status
      ? `<span class="ingresso ingresso-off">${esc(status)}</span>`
      : link(sh.ingresso, `${esc(S.datas.botao)} <span aria-hidden="true">→</span>`, ` class="ingresso" aria-label="${esc(S.datas.botao)} para ${esc(sh.local)}, ${esc(sh.cidade)}"`);
    return `
            <li class="show${passou ? " passou" : ""}" data-i="${i}" data-dia="${quando(sh.data, { day: "2-digit", month: "2-digit" }).replace("/", ".")}"
                data-nota="${esc(quando(sh.data, { weekday: "long" }))} · ${hora(sh.data)}">
              <p class="show-quando"><time datetime="${esc(sh.data)}">${quando(sh.data, { weekday: "short" })} ${quando(sh.data, { day: "2-digit", month: "short" }).replace(" de ", " ")}</time> · ${hora(sh.data)}</p>
              <h2 class="show-local">${esc(sh.local)}</h2>
              <p class="show-cidade">${esc(sh.cidade)}</p>
              <div class="show-acao">${botao}</div>
            </li>`;
  }

  // só a lista rola (topo, título e placar ficam parados); o show mais perto do meio
  // da lista fica em foco e o placar gira até a data dele
  let rolagemDatas = null;
  function ligarDatas() {
    const lista = document.querySelector(".shows");
    const shows = [...lista.querySelectorAll(".show")];
    const placar = document.querySelector(".placar");
    const nota = document.querySelector(".placar-nota");
    let ativo = -1, pedido = 0;

    function marcar() {
      pedido = 0;
      const caixa = lista.getBoundingClientRect();
      const meio = caixa.top + caixa.height / 2;
      let melhor = 0, dist = Infinity;
      shows.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - meio);
        if (d < dist) { dist = d; melhor = i; }
      });
      if (melhor === ativo) return;
      ativo = melhor;
      shows.forEach((el, i) => el.classList.toggle("ativo", i === ativo));
      const dia = shows[ativo].dataset.dia;
      placar.querySelectorAll(".rolo").forEach((rolo, k) => {
        const n = Number(dia.replace(".", "")[k]);
        rolo.firstElementChild.style.transform = `translateY(${-n * 10}%)`;
      });
      nota.textContent = shows[ativo].dataset.nota;
      nota.classList.remove("trocou"); void nota.offsetWidth; nota.classList.add("trocou");
    }
    rolagemDatas = () => { if (!pedido) pedido = requestAnimationFrame(marcar); };
    // clicar num show fora de foco traz ele para o meio
    lista.addEventListener("scroll", rolagemDatas, { passive: true });
    lista.addEventListener("click", (e) => {
      const li = e.target.closest(".show");
      if (li && !li.classList.contains("ativo") && !e.target.closest("a")) li.scrollIntoView({ behavior: ESTATICO ? "auto" : "smooth", block: "center" });
    });
    marcar();
  }
  addEventListener("resize", () => rolagemDatas && rolagemDatas());

  // ───────── sacola ─────────
  // itens { slug, opcao, qtd } guardados no navegador de quem visita (some numa janela privada,
  // e tudo bem: a sacola só começa vazia). Mesmo produto e mesma opção somam na mesma linha.
  const CHAVE = "capote-sacola";
  const produtoDe = (slug) => S.merch.produtos.find((x) => x.slug === slug);
  let sacola = (() => {
    try {
      const lida = JSON.parse(localStorage.getItem(CHAVE) || "[]");
      return Array.isArray(lida) ? lida.filter((i) => produtoDe(i.slug) && i.qtd > 0) : [];
    } catch (e) { return []; }
  })();
  function guardar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(sacola)); } catch (e) { /* janela privada */ }
    atualizarIcone();
  }
  const somaPecas = () => sacola.reduce((n, i) => n + i.qtd, 0);
  const subtotal = () => sacola.reduce((v, i) => v + produtoDe(i.slug).valor * i.qtd, 0);
  function adicionar(slug, opcao, qtd) {
    const igual = sacola.find((i) => i.slug === slug && (i.opcao || "") === (opcao || ""));
    if (igual) igual.qtd = Math.min(10, igual.qtd + qtd);
    else sacola.push({ slug, opcao: opcao || "", qtd });
    guardar();
  }

  const BOLSA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>';
  const iconeSacola = (rota) => {
    const n = somaPecas();
    return `<a href="#sacola" class="sacola-link${n ? " cheia" : ""}" aria-label="sacola, ${n} ${n === 1 ? "item" : "itens"}"${rota === "sacola" ? ' aria-current="page"' : ""}>${BOLSA}<span class="sacola-n">${n || ""}</span></a>`;
  };
  // troca só o número do topo, com um pulinho quando muda
  function atualizarIcone() {
    const a = document.querySelector(".sacola-link");
    if (!a) return;
    const n = somaPecas();
    a.querySelector(".sacola-n").textContent = n || "";
    a.classList.toggle("cheia", n > 0);
    a.setAttribute("aria-label", `sacola, ${n} ${n === 1 ? "item" : "itens"}`);
    a.classList.remove("pulou"); void a.offsetWidth; a.classList.add("pulou");
  }

  // ───────── formulários ─────────
  const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const campo = (nome, rotulo, extra = "", classe = "") =>
    `<label class="campo ${classe}"><span>${rotulo}</span><input name="${nome}" required ${extra}></label>`;
  const escolhas = (nome, itens, legenda) => `
          <fieldset class="escolhas">
            <legend>${legenda}</legend>
            ${itens.map((it, i) => `<label><input type="radio" name="${nome}" value="${esc(it)}" required${i === 0 && nome === "pagamento" ? " checked" : ""}><span>${esc(it)}</span></label>`).join("")}
          </fieldset>`;
  const quantidade = (valor, extra = "") => `
            <div class="quantidade"${extra}>
              <button type="button" data-qtd="-1" aria-label="menos um">−</button>
              <output>${valor}</output>
              <button type="button" data-qtd="1" aria-label="mais um">+</button>
            </div>`;

  // ───────── página do produto: escolher e pôr na sacola ─────────
  function paginaProduto(p) {
    return `
      <div class="compra">
        <a class="voltar" href="#merch">← merch</a>
        <section class="checkout" data-rola data-slug="${esc(p.slug)}">
          <div class="checkout-grade">
            <div class="checkout-foto">${visor(p)}</div>
            <form class="checkout-form produto-form" novalidate>
              <h1 class="checkout-nome">${esc(p.nome)}</h1>
              <p class="checkout-preco">${esc(p.preco)}</p>
              ${p.opcoes ? escolhas("opcao", p.opcoes.itens, p.opcoes.rotulo) : ""}
              <div class="linha-qtd"><span>quantidade</span>${quantidade(1)}</div>
              <button class="finalizar" type="submit">${esc(S.compra.adicionar)}</button>
              <p class="adicionado" aria-live="polite"></p>
            </form>
          </div>
        </section>
      </div>`;
  }

  function ligarProduto() {
    const sec = document.querySelector(".checkout[data-slug]");
    const p = produtoDe(sec.dataset.slug);
    const form = sec.querySelector("form");
    const saida = form.querySelector(".quantidade output");
    const aviso = form.querySelector(".adicionado");
    let qtd = 1;
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-qtd]");
      if (b) { qtd = Math.min(10, Math.max(1, qtd + Number(b.dataset.qtd))); saida.value = qtd; }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.classList.add("conferido");
      if (!form.checkValidity()) { form.querySelector("input:invalid").focus(); return; }
      const opcao = form.opcao ? form.opcao.value : "";
      adicionar(p.slug, opcao, qtd);
      aviso.innerHTML = `${qtd} × ${esc(p.nome)}${opcao ? " · " + esc(opcao) : ""} na sacola. <a href="#sacola">ver sacola →</a>`;
      aviso.classList.remove("surgiu"); void aviso.offsetWidth; aviso.classList.add("surgiu");
    });
  }

  // ───────── sacola: itens + entrega + pagamento, um pedido só ─────────
  function paginaSacola() {
    const C = S.compra;
    if (!sacola.length) return `
      <div class="compra">
        <a class="voltar" href="#merch">← merch</a>
        <section class="checkout" data-rola>
          <div class="sacola-vazia">
            <h1 class="checkout-nome">${esc(C.sacola)}</h1>
            <p class="obrigado-texto">${esc(C.vazia)}</p>
            <a class="finalizar" href="#merch">ver o merch</a>
          </div>
        </section>
      </div>`;
    return `
      <div class="compra">
        <a class="voltar" href="#merch">← continuar comprando</a>
        <section class="checkout" data-rola>
          <div class="checkout-grade sacola-grade">
            <div class="sacola-lado">
              <h1 class="checkout-nome">${esc(C.sacola)}</h1>
              <ul class="itens"></ul>
            </div>
            <form class="checkout-form" novalidate>
              <fieldset class="dados">
                <legend>entrega</legend>
                ${campo("nome", "nome completo", 'autocomplete="name"', "largo")}
                ${campo("email", "e-mail", 'type="email" autocomplete="email"', "largo")}
                ${campo("cep", "cep", 'inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{5}-?[0-9]{3}" placeholder="00000-000"')}
                ${campo("numero", "número", 'inputmode="numeric"')}
                ${campo("endereco", "endereço", 'autocomplete="street-address"', "largo")}
                ${campo("cidade", "cidade / uf", 'autocomplete="address-level2"', "largo")}
              </fieldset>

              ${escolhas("pagamento", C.pagamentos, "pagamento")}

              <dl class="resumo">
                <div><dt data-pecas></dt><dd data-subtotal></dd></div>
                <div><dt>frete</dt><dd>${reais(C.frete)}</dd></div>
                <div class="total"><dt>total</dt><dd data-total></dd></div>
              </dl>
              <button class="finalizar" type="submit">${esc(C.botao)}</button>
              <p class="aviso">${esc(C.aviso)}</p>
            </form>
          </div>
        </section>
      </div>`;
  }

  function ligarSacola() {
    const lista = document.querySelector(".itens");
    if (!lista) return; // sacola vazia
    const form = document.querySelector(".checkout-form");

    function desenharItens() {
      if (!sacola.length) { desenharPagina(); return; }
      lista.innerHTML = sacola.map((i, k) => {
        const p = produtoDe(i.slug);
        return `
                <li class="item" data-k="${k}">
                  <a class="item-foto" href="#comprar-${esc(p.slug)}"><img src="${esc(p.fotos[0].src)}" alt="" width="800" height="800"></a>
                  <div class="item-info">
                    <p class="item-nome">${esc(p.nome)}</p>
                    <p class="item-detalhe">${i.opcao ? `${esc(p.opcoes ? p.opcoes.rotulo : "opção")} ${esc(i.opcao)} · ` : ""}${esc(p.preco)}</p>
                    <button type="button" class="item-remover" data-remover>remover</button>
                  </div>
                  ${quantidade(i.qtd, ` aria-label="quantidade de ${esc(p.nome)}"`)}
                  <p class="item-total">${reais(p.valor * i.qtd)}</p>
                </li>`;
      }).join("");
      const n = somaPecas();
      form.querySelector("[data-pecas]").textContent = `${n} ${n === 1 ? "item" : "itens"}`;
      form.querySelector("[data-subtotal]").textContent = reais(subtotal());
      form.querySelector("[data-total]").textContent = reais(subtotal() + S.compra.frete);
    }

    lista.addEventListener("click", (e) => {
      const li = e.target.closest(".item");
      if (!li) return;
      const i = sacola[Number(li.dataset.k)];
      const b = e.target.closest("[data-qtd]");
      if (b) i.qtd = Math.min(10, Math.max(1, i.qtd + Number(b.dataset.qtd)));
      else if (e.target.closest("[data-remover]")) sacola.splice(Number(li.dataset.k), 1);
      else return;
      guardar();
      desenharItens();
    });

    // o navegador valida (required, e-mail, cep); com tudo certo vira a tela de obrigado e a sacola esvazia
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.classList.add("conferido");
      if (!form.checkValidity()) { form.querySelector("input:invalid").focus(); return; }
      const d = Object.fromEntries(new FormData(form));
      const numero = "NFCI-" + String(Math.floor(1000 + Math.random() * 9000));
      const linhas = sacola.map((i) => {
        const p = produtoDe(i.slug);
        return `<div><dt>${esc(p.nome)}${i.opcao ? " · " + esc(i.opcao) : ""} × ${i.qtd}</dt><dd>${reais(p.valor * i.qtd)}</dd></div>`;
      }).join("");
      const total = subtotal() + S.compra.frete;
      sacola = [];
      guardar();
      document.querySelector(".checkout").innerHTML = `
          <div class="obrigado" tabindex="-1">
            <p class="obrigado-numero">pedido ${numero}</p>
            <h1 class="checkout-nome">${esc(S.compra.obrigado)}</h1>
            <p class="obrigado-texto">${esc(S.compra.obrigadoTexto)}</p>
            <dl class="resumo">
              ${linhas}
              <div><dt>frete</dt><dd>${reais(S.compra.frete)}</dd></div>
              <div class="total"><dt>total · ${esc(d.pagamento)}</dt><dd>${reais(total)}</dd></div>
            </dl>
            <p class="obrigado-entrega">${esc(d.nome)}<br>${esc(d.endereco)}, ${esc(d.numero)} · ${esc(d.cidade)} · ${esc(d.cep)}</p>
            <a class="finalizar" href="#merch">voltar para o merch</a>
            <p class="aviso">${esc(S.compra.aviso)}</p>
          </div>`;
      document.querySelector(".checkout").scrollTop = 0;
      document.querySelector(".obrigado").focus({ preventScroll: true });
    });

    desenharItens();
  }

  const app = document.getElementById("app");
  function desenharPagina() {
    const [rota, ...resto] = location.hash.slice(1).split("-");
    const param = resto.join("-");
    const pagina = PAGINAS[rota] ? rota : "front";
    const menu = pagina === "comprar" ? "merch" : pagina; // o produto ainda é parte do merch
    app.innerHTML = `<main class="pagina pagina-${pagina}">${topo(menu)}${PAGINAS[pagina](decodeURIComponent(param || ""))}${redes()}</main>`;
    document.title = pagina === "front" ? S.banda : `${S.banda} · ${menu}`;
    if (pagina === "front") ligarFront();
    if (pagina === "comprar" && produtoDe(param)) ligarProduto();
    if (pagina === "sacola") ligarSacola();
    rolagemDatas = null;
    if (pagina === "datas") ligarDatas();
    scrollTo(0, 0);
    if (rolagemDatas) rolagemDatas();

    // páginas com topo fixo (merch, produto, sacola, datas): só a área [data-rola] rola; a roda do mouse
    // em cima do topo, do título ou dos ícones também a move
    const rola = app.querySelector("[data-rola]");
    if (rola) app.firstElementChild.addEventListener("wheel", (e) => {
      if (!rola.contains(e.target)) rola.scrollBy({ top: e.deltaY });
    }, { passive: true });
  }
  addEventListener("hashchange", desenharPagina);

  // ───────── contador ─────────
  // dias:horas:minutos:segundos até a data do estado (com fuso, para não depender do visitante)
  const alvo = new Date(S.disco.lancamento).getTime();
  const dois = (n) => String(n).padStart(2, "0");
  let ultimoMinuto = -1;

  function contar() {
    const tempo = document.getElementById("tempo");
    if (!tempo) return; // fora da front não há contador na tela
    const falado = document.getElementById("tempo-falado");
    const resta = Math.max(0, alvo - Date.now());
    if (resta === 0) {
      tempo.textContent = falado.textContent = S.disco.depois;
      return;
    }
    const s = Math.floor(resta / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    tempo.textContent = `${dois(d)}:${dois(h)}:${dois(m)}:${dois(s % 60)}`;
    // leitor de tela recebe a frase só uma vez por minuto, não a cada segundo
    if (m !== ultimoMinuto) { ultimoMinuto = m; falado.textContent = `${d} dias, ${h} horas e ${m} minutos`; }
  }
  // acerta no começo de cada segundo do relógio para não pular números
  const tique = () => { contar(); setTimeout(tique, 1000 - (Date.now() % 1000) + 5); };
  setTimeout(tique, 1000 - (Date.now() % 1000) + 5);

  function ligarFront() {
    ultimoMinuto = -1;
    contar();
    // foco do título: no mouse é só o :hover do CSS. No toque não existe hover: o primeiro
    // toque foca o título e o segundo segue o link do pre-save
    const titulo = document.querySelector(".titulo");
    if (matchMedia("(hover: none)").matches) titulo.addEventListener("click", (e) => {
      if (!titulo.classList.contains("foco")) { e.preventDefault(); titulo.classList.add("foco"); }
    });
  }

  // ───────── fade das fotos do produto ─────────
  // a foto ativa fica por cima; a troca é só a classe passando para a próxima (o CSS faz o fade)
  if (!ESTATICO) {
    setInterval(() => {
      for (const visor of document.querySelectorAll(".visor.troca")) {
        const fotos = visor.querySelectorAll("img");
        const atual = [...fotos].findIndex((f) => f.classList.contains("ativa"));
        fotos[atual].classList.remove("ativa");
        fotos[(atual + 1) % fotos.length].classList.add("ativa");
      }
    }, 3200);
  }

  desenharPagina();

  // ───────── grão ─────────
  // alguns quadros de ruído prontos numa peça de 256 px; a cada tique um deles cobre a tela
  // com deslocamento sorteado. Custa quase nada e parece estática de TV, só que leve.
  const tela = document.getElementById("grao");
  const ctx = tela.getContext("2d");
  const PECA = 256, QUADROS = 8, ESCALA = 1.5; // ESCALA = tamanho do grão em px de tela
  const pecas = [];
  for (let q = 0; q < QUADROS; q++) {
    const c = document.createElement("canvas");
    c.width = c.height = PECA;
    const cx = c.getContext("2d");
    const img = cx.createImageData(PECA, PECA);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    pecas.push(ctx.createPattern(c, "repeat"));
  }

  function medir() {
    tela.width = Math.ceil(innerWidth / ESCALA);
    tela.height = Math.ceil(innerHeight / ESCALA);
    desenhar();
  }
  function desenhar() {
    ctx.setTransform(1, 0, 0, 1, -Math.random() * PECA, -Math.random() * PECA);
    ctx.fillStyle = pecas[(Math.random() * QUADROS) | 0];
    ctx.fillRect(0, 0, tela.width + PECA, tela.height + PECA);
  }
  addEventListener("resize", medir);
  medir();

  if (!ESTATICO) {
    let antes = 0;
    const passo = (t) => {
      if (t - antes > 1000 / 14) { antes = t; desenhar(); } // ~14 quadros por segundo, ritmo de filme
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  } else {
    document.documentElement.classList.add("estatico");
  }
})();
