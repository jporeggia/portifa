"""Servidor local sem cache, para conferir o site durante o desenvolvimento.

Uso:  py build/serve.py [porta]

Atende Range (206), senão o navegador não consegue pular para um ponto do vídeo: o
SimpleHTTPRequestHandler devolve o arquivo inteiro e o currentTime fica preso no zero.
Em produção quem serve os arquivos é o próprio artifact, que já faz isso.
"""
import functools
import http.server
import os
import re
import sys
from pathlib import Path


class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_message(self, *a):
        pass

    def send_head(self):
        faixa = self.headers.get("Range")
        if not faixa:
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", faixa.strip())
        caminho = self.translate_path(self.path)
        if not m or not os.path.isfile(caminho):
            return super().send_head()
        tamanho = os.path.getsize(caminho)
        inicio, fim = m.group(1), m.group(2)
        if inicio == "":                      # bytes=-N: os N últimos
            inicio, fim = max(0, tamanho - int(fim)), tamanho - 1
        else:
            inicio = int(inicio)
            fim = int(fim) if fim else tamanho - 1
        fim = min(fim, tamanho - 1)
        if inicio > fim:
            self.send_error(416)
            return None
        f = open(caminho, "rb")
        f.seek(inicio)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(caminho))
        self.send_header("Content-Range", f"bytes {inicio}-{fim}/{tamanho}")
        self.send_header("Content-Length", str(fim - inicio + 1))
        self.end_headers()
        # o copyfile padrão mandaria o arquivo até o fim; aqui só o pedaço pedido
        resto = fim - inicio + 1
        while resto > 0:
            bloco = f.read(min(64 * 1024, resto))
            if not bloco:
                break
            self.wfile.write(bloco)
            resto -= len(bloco)
        f.close()
        return None


porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
raiz = str(Path(__file__).resolve().parent.parent)
print(f"servindo {raiz} em http://localhost:{porta}")
http.server.ThreadingHTTPServer(("127.0.0.1", porta), functools.partial(H, directory=raiz)).serve_forever()
