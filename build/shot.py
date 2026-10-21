"""Screenshot da página inteira com o Chrome headless (perfil novo a cada vez, nada de cache).

Uso:  py build/shot.py <url> <saida.png> [largura x altura]
Ex.:  py build/shot.py "http://localhost:8099/index.html" tiros/todo.png 1440x4600
"""
import subprocess
import sys
import tempfile
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

url, saida = sys.argv[1], Path(sys.argv[2]).resolve()
w, h = (sys.argv[3] if len(sys.argv) > 3 else "1440x4600").split("x")
saida.parent.mkdir(parents=True, exist_ok=True)
subprocess.run([
    CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars", "--force-device-scale-factor=1",
    f"--window-size={w},{h}", f"--user-data-dir={tempfile.mkdtemp(prefix='pf_')}",
    "--virtual-time-budget=9000", f"--screenshot={saida}", url,
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
print(saida, saida.exists() and f"{saida.stat().st_size // 1024} KB")
