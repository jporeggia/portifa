# João Pedro Oreggia — portfólio

Diretor de arte e designer multidisciplinar. Site de portfólio em HTML, CSS e JavaScript puros,
sem framework e sem etapa de build: abre direto no navegador.

Layout desenhado no Figma e construído com IA (vibe coding). Versão em português e inglês.

## Estrutura

```
index.html        página + todo o conteúdo num JSON (<script id="estado">): textos PT/EN e projetos
css/style.css     estilos (medidas em "px do Figma" × --u, frame de 1424 px)
js/main.js        monta a página a partir do estado e liga os efeitos
fonts/            Big Shoulders e Instrument Sans (OFL), embutidas
img/ media/       imagens (webp) e vídeo já otimizados
arquivos/         currículos em PDF
sites-vivos/      site da Capote, que roda dentro da página de UX/UI
build/            scripts de apoio (Python)
```

## Rodar localmente

```bash
py build/serve.py 8105
```

Depois abra http://localhost:8105. (Também funciona com qualquer servidor estático, ou com o
GitHub Pages apontado para a raiz da branch `main`.)

## Scripts

- `build/serve.py` — servidor local sem cache e com suporte a vídeo (Range).
- `build/shot.py` — screenshot da página inteira com o Chrome headless.
- `build/artifact.py` — gera `build/artifact.html` para publicar como Artifact no claude.ai.
- `build/preparar_imagens.py` — recorta os cards e copia as galerias a partir da pasta de origem.
- `build/copiar_sites.py` — copia o site da Capote para `sites-vivos/`.
