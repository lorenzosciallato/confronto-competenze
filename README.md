# Confronto competenze

Scheda di lavoro guidata per il confronto tra le 13 competenze professionali del Québec, le Indicazioni Nazionali 2025 e il CCNL (LM-85bis, Tirocinio II, UniMC).

Sito: https://lorenzosciallato.github.io/confronto-competenze/

## Cosa fa

- Una domanda alla volta: per ogni competenza si sceglie il tipo di corrispondenza (E, P, I, NR) nelle Indicazioni Nazionali e nel CCNL, si riporta l’evidenza testuale e si scrive la motivazione.
- I tre testi di riferimento sono sempre accanto, sfogliabili a pagine. Si tocca un paragrafo e con «Cita» finisce nell’evidenza, con la fonte; dal CCNL l’articolo si segna da solo.
- Il lavoro è del gruppo: si crea con nome del gruppo, tutor e password, e ogni componente lo riapre da qualsiasi dispositivo. I salvataggi di più persone si uniscono campo per campo.
- Alla fine si scarica il PDF da consegnare.

## Struttura

- `index.html` — il sito (generato, non modificarlo a mano).
- `sorgente/app.tpl.html` — la pagina da modificare.
- `sorgente/testi.json` — i testi delle tre fonti, riportati parola per parola dai PDF del corso.
- `sorgente/fonti/` — il carattere Figtree (licenza SIL Open Font License) incorporato nel PDF.
- `sorgente/build.py` — ricostruisce `index.html`: `python3 sorgente/build.py`.
- `worker/` — il programma su Cloudflare che salva il lavoro dei gruppi (spazio dati R2 `confronto-competenze`). Si pubblica con `npx wrangler@4 deploy` dalla cartella `worker`. La frase segreta PEPE è salvata solo su Cloudflare e non va mai scritta qui.
