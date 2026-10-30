import { esc } from './util.js';
import { QUESTIONS } from './flow.js';

const SOURCE_LABEL = { comment: 'תגובה על פוסט/ריל', story: 'תגובה לסטורי', dm: 'הודעה פרטית' };
const STATUS_LABEL = { sent: 'נשלח', pending: 'בתור', sending: 'בשליחה', failed: 'נכשל' };
const MSG = {
  connected: 'החשבון חובר בהצלחה 🎉',
  added: 'החוק נוסף',
  saved: 'נשמר',
  deleted: 'החוק נמחק',
  disconnected: 'החשבון נותק',
  cancelled: 'החיבור בוטל',
  missing: 'חסרה מילת מפתח או הודעה',
  badurl: 'הקישור של הכפתור צריך להתחיל ב-https://',
};

export function adminPage({ s, rules, recent, sentByRule, pending, media, mediaError, leads = [], msg }) {
  const connected = Boolean(s.token);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>תגובה ← הודעה</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #faf7f2; --card: #ffffff; --ink: #1f1d1a; --muted: #6f6a62; --line: #e8e2d8;
    --accent: #d9456b; --accent-soft: #fde8ee; --ok: #1f8a5b; --ok-soft: #e3f4ec; --warn: #b25e09; --bad: #c0362c;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 Assistant, system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 20px; margin: 0 0 12px; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .flash { background: var(--ok-soft); color: var(--ok); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-weight: 600; }
  .status { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 14px; font-weight: 600; }
  .pill.ok { background: var(--ok-soft); color: var(--ok); }
  .pill.off { background: #f1ede6; color: var(--muted); }
  .pill.bad { background: #fbe7e5; color: var(--bad); }
  .pill.wait { background: #fdf0e1; color: var(--warn); }
  label { display: block; font-weight: 600; margin: 14px 0 6px; }
  .hint { color: var(--muted); font-size: 14px; font-weight: 400; }
  .two { display: grid; grid-template-columns: 1fr 1.6fr; gap: 8px; }
  @media (max-width: 520px) { .two { grid-template-columns: 1fr; } }
  input[type=text], input[type=url], textarea { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; font: inherit; background: #fff; }
  textarea { min-height: 90px; resize: vertical; }
  .seg { display: flex; gap: 8px; flex-wrap: wrap; }
  .seg label { margin: 0; font-weight: 400; }
  .seg input { display: none; }
  .seg span { display: inline-block; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; cursor: pointer; background: #fff; }
  .seg input:checked + span { background: var(--accent); border-color: var(--accent); color: #fff; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; max-height: 330px; overflow-y: auto; padding: 2px; }
  .grid label { margin: 0; position: relative; cursor: pointer; }
  .grid input { position: absolute; opacity: 0; }
  .grid img, .grid .all { width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 10px; border: 3px solid transparent; display: block; background: #eee; }
  .grid .all { display: flex; align-items: center; justify-content: center; text-align: center; font-size: 14px; padding: 6px; background: var(--accent-soft); }
  .grid input:checked + img, .grid input:checked + .all { border-color: var(--accent); }
  button, .btn { display: inline-block; border: 0; border-radius: 10px; padding: 10px 18px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
  .primary { background: var(--accent); color: #fff; }
  .ghost { background: transparent; color: var(--muted); padding: 6px 10px; font-weight: 600; }
  .rule { display: flex; gap: 12px; padding: 14px 0; border-top: 1px solid var(--line); }
  .rule:first-of-type { border-top: 0; }
  .rule img { width: 48px; height: 64px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .rule .body { flex: 1; min-width: 0; }
  .kw { font-weight: 700; font-size: 18px; }
  .msg { color: var(--muted); white-space: pre-wrap; word-break: break-word; font-size: 15px; margin-top: 4px; }
  .actions { display: flex; flex-direction: column; gap: 4px; }
  .actions form { margin: 0; }
  .off-rule { opacity: .5; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 8px 4px; border-top: 1px solid var(--line); vertical-align: top; }
  .err { color: var(--bad); font-size: 13px; }
  .check { display: flex; gap: 8px; align-items: baseline; font-weight: 600; }
  .card table { display: block; overflow-x: auto; }
  .empty { color: var(--muted); }
  @media (max-width: 520px) { .rule { flex-wrap: wrap; } .actions { flex-direction: row; } }
</style>
</head>
<body>
<main>
  <h1>תגובה ← הודעה</h1>
  <p class="sub">מישהו כותב מילת מפתח, ומקבל ממך הודעה פרטית אוטומטית.</p>

  ${msg && MSG[msg] ? `<div class="flash">${MSG[msg]}</div>` : ''}

  <div class="card status">
    <div>
      ${connected
        ? `<span class="pill ok">מחובר</span> <strong><bdi dir="ltr">@${esc(s.username)}</bdi></strong>`
        : `<span class="pill off">לא מחובר</span> צריך לחבר את חשבון האינסטגרם`}
      ${pending ? ` · <span class="pill wait">${pending} הודעות בתור</span>` : ''}
      ${s.token_error ? `<div class="err">חידוש הטוקן נכשל: ${esc(s.token_error)}. כדאי להתחבר מחדש.</div>` : ''}
    </div>
    ${connected
      ? `<div style="display:flex;gap:4px;align-items:center"><a class="btn ghost" href="/connect">חיבור מחדש</a><form method="post" style="margin:0"><input type="hidden" name="action" value="disconnect"><button class="ghost" onclick="return confirm('לנתק את החשבון?')">ניתוק</button></form></div>`
      : `<a class="btn primary" href="/connect">חיבור אינסטגרם</a>`}
  </div>

  <div class="card">
    <h2>חוק חדש</h2>
    <form method="post" id="add">
      <input type="hidden" name="action" value="add">
      <label>איפה כותבים את המילה?</label>
      <div class="seg">
        ${['comment', 'story', 'dm'].map((v, i) => `<label><input type="radio" name="source" value="${v}" ${i === 0 ? 'checked' : ''}><span>${SOURCE_LABEL[v]}</span></label>`).join('')}
      </div>

      <label for="keyword">מילת המפתח <span class="hint">(למשל: פרומפט. כמה מילים? מפרידים בפסיק)</span></label>
      <input type="text" id="keyword" name="keyword" required autocomplete="off">

      <div data-only="comment">
        <label>על איזה פוסט או ריל?</label>
        ${mediaError ? `<div class="err">לא הצלחתי לטעון את הפוסטים: ${esc(mediaError)}</div>` : ''}
        <div class="grid">
          <label><input type="radio" name="media" value="" checked><div class="all">כל הפוסטים והרילס</div></label>
          ${media.map((m) => {
            const thumb = m.thumbnail_url || m.media_url || '';
            const label = (m.caption || '').slice(0, 60);
            return `<label title="${esc(label)}"><input type="radio" name="media" value="${esc(JSON.stringify([m.id, thumb, label]))}"><img src="${esc(thumb)}" alt="${esc(label)}" loading="lazy"></label>`;
          }).join('')}
        </div>
      </div>
      <div data-only="story">
        <p class="hint">יעבוד על כל סטורי: מי שעונה לסטורי עם המילה יקבל את ההודעה.</p>
      </div>

      <label class="check"><input type="checkbox" name="flow" value="1" id="flowbox"> במקום הודעה אחת: להתחיל את שאלון הלידים <span class="hint">(שם, גיל, מטרה, אזור, ניסיון קודם, ואז הצעה ולינק לתשלום)</span></label>

      <div id="msgwrap">
      <label for="message">ההודעה הפרטית שנשלחת <span class="hint">({username} יוחלף בשם המשתמש)</span></label>
      <textarea id="message" name="message" placeholder="היי {username}! הנה הפרומפט שביקשת 👇"></textarea>

      <label>כפתור בהודעה <span class="hint">(לא חובה. במקום קישור ארוך, יופיע כפתור לחיץ מתחת להודעה)</span></label>
      <div class="two">
        <input type="text" name="button_text" maxlength="20" placeholder="טקסט הכפתור, למשל: לפרומפט 👈">
        <input type="url" name="button_url" placeholder="https://..." dir="ltr">
      </div>
      </div>

      <div data-only="comment">
        <label for="public_reply">תגובה פומבית מתחת לתגובה שלו <span class="hint">(לא חובה. כמה נוסחים, אחד בכל שורה, ונבחר אחד באקראי)</span></label>
        <textarea id="public_reply" name="public_reply" placeholder="שלחתי לך בפרטי 💌&#10;בדוק/י את ההודעות 😉"></textarea>
      </div>

      <p><button class="primary">הוספה</button></p>
    </form>
  </div>

  <div class="card">
    <h2>החוקים שלי</h2>
    ${rules.length ? rules.map((r) => `
      <div class="rule ${r.active ? '' : 'off-rule'}">
        ${r.media_thumb ? `<img src="${esc(r.media_thumb)}" alt="">` : ''}
        <div class="body">
          <div><span class="kw">${esc(r.keyword)}</span> · <span class="hint">${SOURCE_LABEL[r.source] || ''}${r.source === 'comment' ? (r.media_id ? ` · ${esc(r.media_label || 'ריל ספציפי')}` : ' · כל הפוסטים') : ''}</span></div>
          <div class="msg">${r.flow ? '📋 מתחיל את שאלון הלידים' : esc(r.message)}</div>
          ${r.button_url ? `<div class="hint">כפתור: <strong>${esc(r.button_text)}</strong> ← <bdi dir="ltr">${esc(r.button_url)}</bdi></div>` : ''}
          <div class="hint">נשלחו: ${sentByRule[r.id] || 0}${r.active ? '' : ' · כבוי'}</div>
        </div>
        <div class="actions">
          <form method="post"><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="${r.id}"><button class="ghost">${r.active ? 'כיבוי' : 'הפעלה'}</button></form>
          <form method="post"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="${r.id}"><button class="ghost" onclick="return confirm('למחוק את החוק?')">מחיקה</button></form>
        </div>
      </div>`).join('') : '<p class="empty">עוד אין חוקים. מוסיפים את הראשון למעלה.</p>'}
  </div>

  <div class="card">
    <h2>לידים מהשאלון</h2>
    ${leads.length ? `<table>
      <tr><td><strong>מי</strong></td>${QUESTIONS.map((q) => `<td><strong>${q.label}</strong></td>`).join('')}<td><strong>בחירה</strong></td><td></td></tr>
      ${leads.map((l) => {
        const a = JSON.parse(l.answers || '{}');
        return `<tr>
          <td>${l.username ? '<bdi dir="ltr">@' + esc(l.username) + '</bdi>' : '—'}<div class="hint">${l.status === 'done' ? 'הושלם' : 'באמצע'}</div></td>
          ${QUESTIONS.map((q) => `<td>${esc(a[q.key] || '')}</td>`).join('')}
          <td>${esc(a.choice || '')}</td>
          <td><form method="post"><input type="hidden" name="action" value="delete_lead"><input type="hidden" name="user_id" value="${esc(l.user_id)}"><button class="ghost" onclick="return confirm('למחוק את הליד?')">מחיקה</button></form></td>
        </tr>`;
      }).join('')}</table>` : '<p class="empty">עוד אין לידים.</p>'}
  </div>

  <div class="card">
    <h2>קישורים לסוף השאלון</h2>
    <form method="post">
      <input type="hidden" name="action" value="links">
      <label>תשלום לאימון היכרות (119₪)</label>
      <input type="url" name="pay_intro" value="${esc(s.pay_intro || '')}" placeholder="https://..." dir="ltr">
      <label>תשלום לשיחת ייעוץ בווידאו (49₪)</label>
      <input type="url" name="pay_consult" value="${esc(s.pay_consult || '')}" placeholder="https://..." dir="ltr">
      <label>פרטים על ליווי אונליין</label>
      <input type="url" name="online_url" value="${esc(s.online_url || '')}" placeholder="https://..." dir="ltr">
      <p class="hint">קישור ריק: האדם יקבל "ניצור איתכם קשר בקרוב" במקום כפתור.</p>
      <p><button class="primary">שמירה</button></p>
    </form>
  </div>

  <div class="card">
    <h2>פעילות אחרונה</h2>
    ${recent.length ? `<table>${recent.map((e) => `
      <tr>
        <td>${e.username ? '<bdi dir="ltr">@' + esc(e.username) + '</bdi>' : '—'}<div class="hint">${SOURCE_LABEL[e.source] || ''}</div></td>
        <td>${esc((e.incoming_text || '').slice(0, 80))}${e.error ? `<div class="err">${esc(e.error)}</div>` : ''}</td>
        <td><span class="pill ${e.status === 'sent' ? 'ok' : e.status === 'failed' ? 'bad' : 'wait'}">${STATUS_LABEL[e.status] || e.status}</span></td>
      </tr>`).join('')}</table>` : '<p class="empty">עוד לא נשלחו הודעות.</p>'}
  </div>
</main>
<script>
  const form = document.getElementById('add');
  function sync() {
    const src = form.querySelector('input[name=source]:checked').value;
    form.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== src; });
    document.getElementById('msgwrap').hidden = document.getElementById('flowbox').checked;
  }
  form.addEventListener('change', sync);
  sync();
</script>
</body>
</html>`;
}
