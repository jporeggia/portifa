"""
Copia os sites "ao vivo" para dentro do portfólio, para abrirem funcionando na janela de navegador
da página Sites UX/UI.

Uso:  py build/copiar_sites.py

Hoje: Sites IA/capote → portfolio/sites-vivos/capote (index.html, css/, js/, img/). Só lê da pasta
de origem; rode de novo sempre que o site da Capote mudar. Na publicação, os arquivos de
sites-vivos/ sobem junto, nos mesmos caminhos.
"""
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
RAIZ = Path(__file__).resolve().parent.parent
SITES = {"capote": RAIZ.parent / "capote"}

for nome, origem in SITES.items():
    destino = RAIZ / "sites-vivos" / nome
    if destino.exists():
        shutil.rmtree(destino)
    destino.mkdir(parents=True)
    shutil.copy2(origem / "index.html", destino / "index.html")
    for pasta in ("css", "js", "img"):
        if (origem / pasta).exists():
            shutil.copytree(origem / pasta, destino / pasta)
    arquivos = [p for p in destino.rglob("*") if p.is_file()]
    print(f"{nome}: {len(arquivos)} arquivos, {sum(p.stat().st_size for p in arquivos) // 1024} KB → {destino.relative_to(RAIZ)}")
