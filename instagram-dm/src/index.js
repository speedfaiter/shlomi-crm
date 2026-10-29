import { findRule, fillTemplate, pickVariant } from './match.js';
import * as meta from './meta.js';
import { adminPage } from './admin.js';
import { privacyPage, deletionPage } from './pages.js';
import { esc } from './util.js';

const HOUR = 3600;
const TOKEN_REFRESH_AFTER = 20 * 24 * HOUR; // הטוקן תקף 60 יום; מחדשים כל 20
const MAX_ATTEMPTS = 3;
const DRAIN_BATCH = 20; // מגבלת קריאות חיצוניות לבקשה בתוכנית החינמית

const now = () => Math.floor(Date.now() / 1000);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/webhook' && request.method === 'GET') return verifyWebhook(url, env);
    if (path === '/webhook' && request.method === 'POST') return receiveWebhook(request, env, ctx);
    if (path === '/privacy') return html(privacyPage(env));
    if (path === '/data-deletion') return html(deletionPage(env));
    if (path === '/callback') return oauthCallback(url, env);

    if (path === '/' || path.startsWith('/admin') || path === '/connect') {
      if (!isAdmin(request, env)) {
        return new Response('נדרשת סיסמה', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"' },
        });
      }
      if (path === '/connect') return connect(url, env);
      if (request.method === 'POST') {
        if (!sameOrigin(request, url)) return new Response('bad origin', { status: 403 });
        return adminAction(request, env);
      }
      return renderAdmin(url, env);
    }
    return new Response('Not found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([drainQueue(env), maybeRefreshToken(env), purgeOld(env)]));
  },
};

// ---------- Webhook ----------

function verifyWebhook(url, env) {
  const ok = url.searchParams.get('hub.mode') === 'subscribe'
    && url.searchParams.get('hub.verify_token') === env.VERIFY_TOKEN;
  return ok
    ? new Response(url.searchParams.get('hub.challenge'))
    : new Response('forbidden', { status: 403 });
}

async function receiveWebhook(request, env, ctx) {
  const raw = await request.text();
  const valid = await meta.verifySignature(env.IG_APP_SECRET, raw, request.headers.get('X-Hub-Signature-256'));
  if (!valid) return new Response('bad signature', { status: 401 });
  // עונים למטא מיד, והעבודה ממשיכה ברקע
  ctx.waitUntil(handleEvents(JSON.parse(raw), env).catch((e) => console.error('webhook', e)));
  return new Response('ok');
}

async function handleEvents(payload, env) {
  const s = await getSettings(env);
  if (!s.token) return;
  const { results: rules } = await env.DB.prepare('SELECT * FROM rules WHERE active = 1').all();
  if (!rules.length) return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'comments') continue;
      const v = change.value || {};
      if (!v.id || v.from?.id === s.ig_user_id) continue; // לא עונים לתגובות של עצמנו
      const rule = findRule(rules, 'comment', v.media?.id, v.text);
      if (rule) await enqueue(env, {
        event_id: v.id, source: 'comment', rule, recipient_id: null,
        username: v.from?.username || '', text: v.text,
      });
    }

    for (const m of entry.messaging || []) {
      const msg = m.message;
      if (!msg?.mid || msg.is_echo || msg.is_deleted || !msg.text) continue;
      if (m.sender?.id === s.ig_user_id) continue;
      const source = msg.reply_to?.story ? 'story' : 'dm';
      const rule = findRule(rules, source, null, msg.text);
      if (rule) await enqueue(env, {
        event_id: msg.mid, source, rule, recipient_id: m.sender.id, username: '', text: msg.text,
      });
    }
  }
  await drainQueue(env, s);
}

async function enqueue(env, e) {
  // INSERT OR IGNORE: אם מטא שולחת את אותו אירוע פעמיים, נשלחת רק הודעה אחת
  await env.DB.prepare(
    `INSERT OR IGNORE INTO sends (event_id, source, rule_id, recipient_id, username, incoming_text, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
  ).bind(e.event_id, e.source, e.rule.id, e.recipient_id, e.username, (e.text || '').slice(0, 500), now()).run();
}

// ---------- שליחה ----------

async function drainQueue(env, settings) {
  const s = settings || (await getSettings(env));
  if (!s.token) return;
  const sentLastHour = await env.DB.prepare('SELECT COUNT(*) AS n FROM sends WHERE sent_at > ?')
    .bind(now() - HOUR).first('n');
  // שורה שנתקעה באמצע שליחה (נדיר): לא מנסים שוב כדי לא לשלוח כפול
  await env.DB.prepare(
    `UPDATE sends SET status = 'failed', error = 'נקטע באמצע שליחה' WHERE status = 'sending' AND sent_at < ?`,
  ).bind(now() - 900).run();
  const room = Math.min(DRAIN_BATCH, Number(env.MAX_PER_HOUR || 150) - sentLastHour);
  if (room <= 0) return;

  const { results } = await env.DB.prepare(
    `SELECT sends.*, rules.message, rules.public_reply, rules.button_text, rules.button_url FROM sends
     LEFT JOIN rules ON rules.id = sends.rule_id
     WHERE sends.status = 'pending' ORDER BY sends.created_at LIMIT ?`,
  ).bind(room).all();

  for (const row of results) await sendOne(env, s, row);
}

async function sendOne(env, s, row) {
  if (!row.message) return mark(env, row, 'failed', 'החוק נמחק');
  // תופסים את השורה לפני השליחה, כדי ששתי ריצות במקביל לא ישלחו את אותה הודעה פעמיים
  const claim = await env.DB.prepare(
    `UPDATE sends SET status = 'sending', sent_at = ? WHERE event_id = ? AND status = 'pending'`,
  ).bind(now(), row.event_id).run();
  if (!claim.meta.changes) return;
  try {
    let username = row.username;
    if (row.source === 'comment') {
      const text = fillTemplate(row.message, { username });
      await sendWithButton(row, text, (msg) => meta.sendPrivateReply(env, s.token, s.ig_user_id, row.event_id, msg));
      const pub = pickVariant(row.public_reply);
      if (pub) {
        await meta.replyPublicly(env, s.token, row.event_id, fillTemplate(pub, { username }))
          .catch((e) => console.error('public reply', e.message)); // ההודעה הפרטית כבר נשלחה; לא נכשלים בגלל זה
      }
    } else {
      if (!username && row.message.includes('{username}')) {
        username = await meta.getUsername(env, s.token, row.recipient_id).catch(() => '');
      }
      const text = fillTemplate(row.message, { username }).replace(/\s*@?\{username\}/g, '');
      await sendWithButton(row, text, (msg) => meta.sendMessage(env, s.token, s.ig_user_id, row.recipient_id, msg));
    }
    await mark(env, { ...row, username }, 'sent');
  } catch (e) {
    const attempts = row.attempts + 1;
    await mark(env, { ...row, attempts }, attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', e.message);
  }
}

// אם מטא דוחה את הכפתור, שולחים טקסט רגיל עם הקישור בסוף כדי שהאדם יקבל את מה שביקש
async function sendWithButton(row, text, send) {
  const button = row.button_url ? { url: row.button_url, title: row.button_text } : null;
  try {
    await send(meta.buildMessage(text, button));
  } catch (e) {
    if (!button) throw e;
    console.error('button template failed, sending plain text', e.message);
    await send({ text: `${text}\n${button.url}` });
  }
}

function mark(env, row, status, error = null) {
  return env.DB.prepare(
    'UPDATE sends SET status = ?, error = ?, attempts = ?, username = ?, sent_at = ? WHERE event_id = ?',
  ).bind(status, error, row.attempts || 0, row.username || '', status === 'sent' ? now() : null, row.event_id).run();
}

// מדיניות הפרטיות מבטיחה מחיקה אחרי 90 יום
function purgeOld(env) {
  return env.DB.prepare('DELETE FROM sends WHERE created_at < ?').bind(now() - 90 * 24 * HOUR).run();
}

// ---------- טוקן וחיבור ----------

async function maybeRefreshToken(env) {
  const s = await getSettings(env);
  if (!s.token || now() - Number(s.token_at || 0) < TOKEN_REFRESH_AFTER) return;
  try {
    const token = await meta.refreshToken(s.token);
    await setSettings(env, { token, token_at: String(now()) });
  } catch (e) {
    await setSettings(env, { token_error: e.message });
  }
}

async function connect(url, env) {
  const state = crypto.randomUUID();
  await setSettings(env, { oauth_state: state });
  return Response.redirect(meta.authorizeUrl(env, `${url.origin}/callback`, state), 302);
}

async function oauthCallback(url, env) {
  const s = await getSettings(env);
  const state = url.searchParams.get('state');
  if (!state || state !== s.oauth_state) return html('<p dir="rtl">הקישור פג תוקף. חוזרים לדף הניהול ומנסים שוב.</p>', 400);
  if (url.searchParams.get('error')) return Response.redirect(`${url.origin}/admin?msg=cancelled`, 302);
  try {
    const token = await meta.exchangeCode(env, url.searchParams.get('code'), `${url.origin}/callback`);
    const me = await meta.getMe(env, token);
    await meta.subscribe(env, token);
    await setSettings(env, {
      token, token_at: String(now()), ig_user_id: String(me.user_id), username: me.username,
      oauth_state: '', token_error: '',
    });
    return Response.redirect(`${url.origin}/admin?msg=connected`, 302);
  } catch (e) {
    return html(`<p dir="rtl">החיבור נכשל: ${esc(e.message)}</p><p dir="rtl"><a href="/admin">חזרה</a></p>`, 500);
  }
}

// ---------- דף ניהול ----------

async function renderAdmin(url, env) {
  const s = await getSettings(env);
  const { results: rules } = await env.DB.prepare('SELECT * FROM rules ORDER BY created_at DESC').all();
  const { results: recent } = await env.DB.prepare('SELECT * FROM sends ORDER BY created_at DESC LIMIT 40').all();
  const counts = await env.DB.prepare(
    `SELECT rule_id, COUNT(*) AS n FROM sends WHERE status = 'sent' GROUP BY rule_id`,
  ).all();
  const pending = await env.DB.prepare(`SELECT COUNT(*) AS n FROM sends WHERE status = 'pending'`).first('n');
  let media = [];
  let mediaError = null;
  if (s.token) {
    try { media = await meta.listMedia(env, s.token); } catch (e) { mediaError = e.message; }
  }
  const sentByRule = Object.fromEntries(counts.results.map((r) => [r.rule_id, r.n]));
  return html(adminPage({ s, rules, recent, sentByRule, pending, media, mediaError, msg: url.searchParams.get('msg'), env }));
}

async function adminAction(request, env) {
  const f = await request.formData();
  const action = f.get('action');
  const back = (msg) => Response.redirect(new URL(`/admin?msg=${msg}`, request.url).toString(), 303);

  if (action === 'add') {
    const source = ['comment', 'story', 'dm'].includes(f.get('source')) ? f.get('source') : 'comment';
    const keyword = (f.get('keyword') || '').trim();
    const message = (f.get('message') || '').trim();
    if (!keyword || !message) return back('missing');
    let mediaId = null, label = null, thumb = null;
    if (source === 'comment' && f.get('media')) {
      [mediaId, thumb, label] = JSON.parse(f.get('media'));
    }
    const pub = source === 'comment' ? (f.get('public_reply') || '').trim() || null : null;
    const buttonUrl = (f.get('button_url') || '').trim() || null;
    const buttonText = buttonUrl ? (f.get('button_text') || '').trim() || 'לפתיחה' : null;
    if (buttonUrl && !/^https:\/\//.test(buttonUrl)) return back('badurl');
    await env.DB.prepare(
      `INSERT INTO rules (source, keyword, media_id, media_label, media_thumb, message, public_reply, button_text, button_url, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).bind(source, keyword, mediaId, label, thumb, message, pub, buttonText, buttonUrl, now()).run();
    return back('added');
  }
  const id = Number(f.get('id'));
  if (action === 'toggle') {
    await env.DB.prepare('UPDATE rules SET active = 1 - active WHERE id = ?').bind(id).run();
    return back('saved');
  }
  if (action === 'delete') {
    await env.DB.prepare('DELETE FROM rules WHERE id = ?').bind(id).run();
    return back('deleted');
  }
  if (action === 'disconnect') {
    await setSettings(env, { token: '', ig_user_id: '', username: '' });
    return back('disconnected');
  }
  return back('unknown');
}

// ---------- עזרים ----------

async function getSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

async function setSettings(env, obj) {
  const stmt = env.DB.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  await env.DB.batch(Object.entries(obj).map(([k, v]) => stmt.bind(k, v)));
}

function isAdmin(request, env) {
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ') || !env.ADMIN_PASSWORD) return false;
  let decoded = '';
  try { decoded = new TextDecoder().decode(Uint8Array.from(atob(h.slice(6)), (c) => c.charCodeAt(0))); } catch { return false; }
  const password = decoded.slice(decoded.indexOf(':') + 1);
  return meta.timingSafeEqual(password, env.ADMIN_PASSWORD);
}

function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  return !origin || origin === url.origin;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
