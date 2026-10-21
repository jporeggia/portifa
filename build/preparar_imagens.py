"""
Prepara as imagens dos trabalhos a partir do portfolio-v2 (que nunca é alterado).

Uso:  py build/preparar_imagens.py

- Lê o estado (JSON) do index.html.
- Card de cada projeto: recorta card.src no formato do Figma (285x420) em torno do ponto
  card.pos ("x% y%") e grava img/cards/<slug>.webp em 2x (570x840).
- Galeria: copia cada arquivo de ../portfolio-v2/<caminho> para o mesmo caminho aqui e
  grava largura/altura no estado (o JS usa a proporção para montar a esteira sem pulo).
- Regrava o bloco do estado no index.html com as medidas.
"""
import json
import re
import shutil
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ.parent / "portfolio-v2"
CARD = (570, 840)  # 2x do card do Figma (285x420)

html = (RAIZ / "index.html").read_text(encoding="utf-8")
m = re.search(r'(<script type="application/json" id="estado">)(.*?)(</script>)', html, re.S)
estado = json.loads(m.group(2))


def copiar(rel):
    dst = RAIZ / rel
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ORIGEM / rel, dst)
    return dst


def recortar(src, pos, saida):
    im = Image.open(ORIGEM / src).convert("RGB")
    w, h = im.size
    alvo = CARD[0] / CARD[1]
    px, py = (float(v.strip("%")) / 100 for v in pos.split())
    if w / h > alvo:  # sobra largura: corta nas laterais
        nw = round(h * alvo)
        x = round((w - nw) * px)
        im = im.crop((x, 0, x + nw, h))
    else:             # sobra altura: corta em cima/embaixo
        nh = round(w / alvo)
        y = round((h - nh) * py)
        im = im.crop((0, y, w, y + nh))
    im = im.resize(CARD, Image.LANCZOS)
    saida.parent.mkdir(parents=True, exist_ok=True)
    im.save(saida, quality=82, method=6)
    return saida


total = 0
for p in estado["projetos"]:
    c = p["card"]
    out = recortar(c["src"], c.get("pos", "50% 50%"), RAIZ / "img" / "cards" / f"{p['slug']}.webp")
    c["img"] = out.relative_to(RAIZ).as_posix()
    total += out.stat().st_size
    print(f"card  {c['img']:42} {out.stat().st_size // 1024} KB")
    galeria = []
    for item in p["galeria"]:
        if isinstance(item, str):
            item = {"src": item}
        if "video" in item:
            copiar(item["video"])
            poster = copiar(item["poster"])
            item["w"], item["h"] = Image.open(poster).size
            total += (RAIZ / item["video"]).stat().st_size + poster.stat().st_size
        else:
            dst = copiar(item["src"])
            item["w"], item["h"] = Image.open(dst).size
            total += dst.stat().st_size
        galeria.append(item)
    p["galeria"] = galeria
    print(f"      {p['slug']}: {len(galeria)} peças")

bloco = json.dumps(estado, ensure_ascii=False, indent=1).replace("</", "<\\/")
html = html[: m.start(2)] + "\n" + bloco + "\n" + html[m.end(2):]
(RAIZ / "index.html").write_text(html, encoding="utf-8")
print(f"total de mídia: {total / 1024 / 1024:.1f} MB")
