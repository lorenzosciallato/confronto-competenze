"""Ricostruisce index.html partendo da app.tpl.html, testi.json, dai caratteri in fonti/ e dalle immagini in immagini/.
Uso: python3 sorgente/build.py  (dalla cartella principale del repository)"""
import json, base64, pathlib
qui = pathlib.Path(__file__).parent
d = json.loads((qui / "testi.json").read_text())
d["titoloQC"] = "Le 13 competenze professionali degli insegnanti"
d["titoloIN"] = "Dalle Indicazioni Nazionali 2025"
d["titoloCC"] = "Estratto dal CCNL vigente"
b64 = lambda f: base64.b64encode((qui / "fonti" / f).read_bytes()).decode()
s = (qui / "app.tpl.html").read_text().replace("/*DATA*/", json.dumps(d, ensure_ascii=False))
s = s.replace("/*FONT_R*/", b64("Figtree_400Regular.ttf")).replace("/*FONT_B*/", b64("Figtree_700Bold.ttf"))
img = {f.stem: "data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode() for f in sorted((qui / "immagini").glob("*.webp"))}
s = s.replace("/*IMG*/", json.dumps(img))
i = s.index("</style>") + len("</style>")
doc = ('<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
       '<meta name="theme-color" content="#faf8f4">\n' + s[:i] + '\n</head>\n<body>\n' + s[i:] + '\n</body>\n</html>\n')
(qui.parent / "index.html").write_text(doc)
print("index.html aggiornato")
