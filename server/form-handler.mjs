/* =====================================================================
   Gestore dei moduli → email via AWS SES (v2).
   Unico pezzo di logica, usato da due "porte":
   · server/index.mjs        — il server Node dell'immagine Docker (POST /api/form)
   · netlify/functions/…     — se un giorno il sito va su Netlify Functions
   Riceve lo stesso payload application/x-www-form-urlencoded che i form
   mandano oggi (campo `form-name` incluso) e manda a Irene un'email
   leggibile, con Reply-To già pronto per rispondere.

   Senza numero WhatsApp (src/config.ts) questa email è il canale del modulo
   "Scrivimi"; con il numero diventa la rete di sicurezza del flusso WhatsApp.

   Variabili d'ambiente (vedi .env.example):
     AWS_REGION              regione SES, es. eu-south-1 / eu-west-1
     AWS_ACCESS_KEY_ID       credenziali IAM con il solo permesso ses:SendEmail
     AWS_SECRET_ACCESS_KEY   (oppure un ruolo, se gira su AWS)
     SES_FROM                mittente VERIFICATO in SES, es. "Sito Ire & Luna <sito@ireandlunaslife.it>"
     SES_TO                  destinatari, separati da virgola
     SES_CONFIGURATION_SET   facoltativo (metriche/bounce in SES)
     SES_DRY_RUN=true        non invia: stampa l'email nei log (test/staging)
   ===================================================================== */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

/* I due moduli del sito: campi ammessi (con etichetta) e obbligatori. */
const FORMS = {
  scrivimi: {
    subject: (d) => `Contatto dal sito: ${d.nome || 'nuovo contatto'}${d.servizio ? ` (${d.servizio})` : ''}`,
    title: 'Nuovo messaggio dal sito',
    fields: {
      nome: 'Nome',
      servizio: 'Le serve',
      animale: 'Il suo cane',
      email: 'Email',
      telefono: 'Telefono',
    },
    required: ['nome', 'animale', 'email'],
    replyTo: 'email',
  },
};

const MAX_FIELD = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let client = null;
const ses = () => (client ??= new SESv2Client({ region: process.env.AWS_REGION }));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Numero italiano → link wa.me (es. "347 678 0938" → https://wa.me/393476780938). */
function waLinkFor(phone) {
  let n = String(phone).replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  else if (n.startsWith('00')) n = n.slice(2);
  else if (n.length === 10 && n.startsWith('3')) n = '39' + n;
  return n.length >= 8 ? `https://wa.me/${n}` : null;
}

/**
 * @param {string} rawBody  corpo urlencoded della richiesta
 * @param {{ ip?: string, userAgent?: string, referer?: string }} meta
 * @returns {Promise<{ status: number, body: { ok: boolean, error?: string } }>}
 */
export async function handleForm(rawBody, meta = {}) {
  const params = new URLSearchParams(rawBody || '');
  // Honeypot: i bot compilano il campo nascosto. Fingiamo che vada tutto bene.
  if ((params.get('bot-field') || '').trim()) return { status: 200, body: { ok: true } };

  const def = FORMS[params.get('form-name') || ''];
  if (!def) return { status: 400, body: { ok: false, error: 'form-sconosciuto' } };

  const data = {};
  for (const key of Object.keys(def.fields)) {
    data[key] = (params.get(key) || '').trim().slice(0, MAX_FIELD);
  }
  const missing = def.required.filter((k) => !data[k]);
  if (missing.length) return { status: 422, body: { ok: false, error: 'campi-mancanti' } };
  if (data.email && !EMAIL_RE.test(data.email)) return { status: 422, body: { ok: false, error: 'email-non-valida' } };

  const rows = Object.entries(def.fields).filter(([k]) => data[k]);
  const wa = data.telefono ? waLinkFor(data.telefono) : null;
  const when = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

  const text = [
    def.title,
    '',
    ...rows.map(([k, label]) => `${label}: ${data[k]}`),
    '',
    wa ? `Rispondi su WhatsApp: ${wa}` : '',
    data.email ? `Oppure rispondi a questa email (va a ${data.email}).` : '',
    '',
    `Inviato dal sito il ${when}${meta.referer ? ` — ${meta.referer}` : ''}`,
  ]
    .filter((l, i, a) => l || a[i - 1])
    .join('\n');

  const html = `<!doctype html><html lang="it"><body style="margin:0;background:#f1ebdf;font-family:Arial,Helvetica,sans-serif;color:#211a1c">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
  <p style="margin:0 0 6px;font-size:13px;color:#7a6c70">Ire &amp; Luna’s Life · sito</p>
  <h1 style="margin:0 0 18px;font-size:22px">${esc(def.title)}</h1>
  <table style="width:100%;border-collapse:collapse;background:#fff;border:2px solid #211a1c;border-radius:12px">
    ${rows
      .map(
        ([k, label]) =>
          `<tr><td style="padding:10px 14px;border-bottom:1px solid #e6dac6;font-size:13px;color:#7a6c70;vertical-align:top;width:38%">${esc(label)}</td><td style="padding:10px 14px;border-bottom:1px solid #e6dac6;font-size:15px;white-space:pre-wrap">${esc(data[k])}</td></tr>`
      )
      .join('')}
  </table>
  ${wa ? `<p style="margin:22px 0 0"><a href="${esc(wa)}" style="display:inline-block;background:#ff7d68;color:#211a1c;border:2px solid #211a1c;border-radius:999px;padding:12px 20px;font-weight:bold;text-decoration:none">Rispondi su WhatsApp</a></p>` : ''}
  <p style="margin:22px 0 0;font-size:12px;color:#7a6c70">Inviato il ${esc(when)}${meta.referer ? ` da ${esc(meta.referer)}` : ''}.</p>
</div></body></html>`;

  const to = (process.env.SES_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = process.env.SES_FROM;
  const subject = def.subject(data);
  const replyTo = def.replyTo && data[def.replyTo] ? [data[def.replyTo]] : undefined;

  if (process.env.SES_DRY_RUN === 'true') {
    console.log(`[form] DRY RUN → ${to.join(', ') || '(SES_TO vuoto)'} | ${subject}\n${text}`);
    return { status: 200, body: { ok: true } };
  }
  if (!from || !to.length || !process.env.AWS_REGION) {
    console.error('[form] SES non configurato: servono AWS_REGION, SES_FROM e SES_TO');
    return { status: 503, body: { ok: false, error: 'email-non-configurata' } };
  }

  try {
    await ses().send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        ReplyToAddresses: replyTo,
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Text: { Data: text, Charset: 'UTF-8' }, Html: { Data: html, Charset: 'UTF-8' } },
          },
        },
      })
    );
    console.log(`[form] inviata "${subject}" (${meta.ip || 'ip ?'})`);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error('[form] errore SES:', err?.name, err?.message);
    return { status: 502, body: { ok: false, error: 'invio-fallito' } };
  }
}
