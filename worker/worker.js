/* Confronto competenze — salvataggio del lavoro dei gruppi su Cloudflare R2.
   Un gruppo si ritrova con: nome del gruppo + tutor + password.
   Nello spazio dati il nome del gruppo e il tutor non compaiono in chiaro: ogni lavoro
   è salvato sotto un codice ricavato da nome, tutor e da una frase segreta (PEPE)
   che conosce solo il Worker. La password non viene mai salvata così com'è. */

const MAX_TESTO = 600 * 1024;
const CHIAVI = new Set(["meta", "members", "c", "sint", "chk", "timbri"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
const risposta = (corpo, stato = 200) =>
  new Response(JSON.stringify(corpo), { status: stato, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

const pulisci = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
async function sha(testo){
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(testo));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const casuale = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");

/* applica una modifica: percorso come ["c","3","in_evid"] */
function applica(dati, percorso, valore){
  if (!Array.isArray(percorso) || !percorso.length || percorso.length > 3 || !CHIAVI.has(percorso[0])) return;
  if (percorso.some(p => typeof p !== "string" || !/^[A-Za-z0-9_]{1,24}$/.test(p))) return;
  let o = dati;
  for (let i = 0; i < percorso.length - 1; i++){
    if (typeof o[percorso[i]] !== "object" || o[percorso[i]] === null || Array.isArray(o[percorso[i]])) o[percorso[i]] = {};
    o = o[percorso[i]];
  }
  o[percorso[percorso.length - 1]] = valore;
}

export default {
  async fetch(req, env){
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (!env.DATI || !env.PEPE) return risposta({ errore: "configurazione" }, 500);
    const azione = new URL(req.url).pathname.replace(/\//g, "");
    if (!azione) return risposta({ ok: true, servizio: "confronto-competenze" });
    if (req.method !== "POST") return risposta({ errore: "richiesta" }, 405);

    const testo = await req.text();
    if (testo.length > MAX_TESTO) return risposta({ errore: "troppo grande" }, 413);
    let b; try { b = JSON.parse(testo); } catch(e){ return risposta({ errore: "formato" }, 400); }
    const gruppo = pulisci(b.gruppo), tutor = pulisci(b.tutor), password = String(b.password || "");
    if (!gruppo || !tutor) return risposta({ errore: "gruppo" }, 400);
    if (password.length < 4) return risposta({ errore: "password" }, 400);

    const chiave = `gruppi/${await sha(`${env.PEPE}|${gruppo}|${tutor}`)}.json`;
    const o = await env.DATI.get(chiave);

    if (azione === "crea"){
      if (o) return risposta({ errore: "esiste" }, 409);
      const sale = casuale();
      const dati = b.dati && typeof b.dati === "object" ? b.dati : {};
      const rec = { sale, pw: await sha(`${env.PEPE}|${sale}|${password}`), dati, versione: 1, aggiornato: Date.now() };
      await env.DATI.put(chiave, JSON.stringify(rec), { httpMetadata: { contentType: "application/json" } });
      return risposta({ ok: true, dati, versione: 1 });
    }

    if (!o) return risposta({ errore: "assente" }, 404);
    let rec = JSON.parse(await o.text());
    if (await sha(`${env.PEPE}|${rec.sale}|${password}`) !== rec.pw) return risposta({ errore: "password" }, 401);

    if (azione === "entra") return risposta({ ok: true, dati: rec.dati, versione: rec.versione });

    if (azione === "elimina"){
      await env.DATI.delete(chiave);
      return risposta({ ok: true });
    }

    if (azione === "salva"){
      const modifiche = Array.isArray(b.modifiche) ? b.modifiche.slice(0, 400) : [];
      if (!modifiche.length) return risposta({ ok: true, dati: rec.dati, versione: rec.versione });
      // fino a 3 tentativi se due persone salvano nello stesso istante
      let etag = o.etag;
      for (let t = 0; t < 3; t++){
        modifiche.forEach(([p, v]) => applica(rec.dati, p, v));
        rec.versione++; rec.aggiornato = Date.now();
        const ok = await env.DATI.put(chiave, JSON.stringify(rec), { onlyIf: { etagMatches: etag }, httpMetadata: { contentType: "application/json" } });
        if (ok) return risposta({ ok: true, dati: rec.dati, versione: rec.versione });
        const o2 = await env.DATI.get(chiave);
        rec = JSON.parse(await o2.text()); etag = o2.etag;
      }
      return risposta({ errore: "occupato" }, 503);
    }
    return risposta({ errore: "richiesta" }, 404);
  }
};
