"""
Gera a versão do site para publicar como Artifact do claude.ai.

Uso:  py build/artifact.py
Saída: build/artifact.html

O Artifact embrulha o arquivo publicado num esqueleto próprio (doctype, html, head e
body são dele), então aqui saem essas tags e sobra: <title>, os <link> de fonte e de
CSS e o conteúdo do body. O css/, o js/ e o media/ sobem como arquivos publicados ao
lado da página, nos mesmos caminhos relativos que o index.html local usa.
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
h = (RAIZ / "index.html").read_text(encoding="utf-8")

titulo = re.search(r"<title>(.*?)</title>", h, re.S).group(1)
links = re.findall(r'<link [^>]*rel="(?:stylesheet|preconnect)"[^>]*>', h)
corpo = re.search(r"<body[^>]*>(.*)</body>", h, re.S).group(1).strip()
# Scripts inline do <head> (ex.: a classe pre-carregando que esconde o nome antes do preloader)
cabeca = re.search(r"<head>(.*?)</head>", h, re.S).group(1)
scripts = re.findall(r"<script>.*?</script>", cabeca, re.S)

saida = RAIZ / "build" / "artifact.html"
saida.write_text(f"<title>{titulo}</title>\n" + "\n".join(scripts + links) + "\n\n" + corpo + "\n", encoding="utf-8")
print(saida.relative_to(RAIZ), saida.stat().st_size, "bytes")
print("título:", titulo)
