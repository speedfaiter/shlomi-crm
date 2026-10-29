import { esc } from './util.js';

// דפים ציבוריים שמטא דורשת לאישור האפליקציה. באנגלית (הבודקים במטא) ובעברית.

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { --bg: #faf7f2; --ink: #1f1d1a; --muted: #6f6a62; --line: #e8e2d8; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, sans-serif; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 28px; } h2 { font-size: 19px; margin-top: 28px; }
  .he { direction: rtl; text-align: right; border-top: 1px solid var(--line); margin-top: 40px; padding-top: 8px; }
  .muted { color: var(--muted); }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export function privacyPage(env) {
  const brand = esc(env.BRAND_NAME);
  const email = esc(env.CONTACT_EMAIL);
  return layout(`Privacy Policy · ${brand}`, `
<h1>Privacy Policy</h1>
<p class="muted">${brand} · Instagram auto-reply tool</p>

<p>This tool is used only by ${brand} to automatically send a private message on Instagram to people who ask for it,
by commenting a keyword on one of our posts or reels, replying to one of our stories with a keyword, or sending us a keyword in a direct message.</p>

<h2>What we receive</h2>
<p>When you comment on our posts, reply to our stories or message our Instagram account, Instagram notifies this tool and shares:
your Instagram-scoped user ID, your username, the text you wrote, and the ID of the post, comment or message.</p>

<h2>How we use it</h2>
<p>Only to check whether your text contains a keyword we set up, and if it does, to send you the single message you asked for
(for example, a link to a guide), and optionally reply publicly to your comment saying we sent it.
We do not sell, share or use this information for advertising, and we do not send unrequested messages.</p>

<h2>What we keep</h2>
<p>We keep a log of matched comments and messages (ID, username, text, and whether the reply was sent) so that each person receives
the message only once. Comments and messages that don't contain a keyword are not stored. Logs are deleted after 90 days.</p>

<h2>Deleting your data</h2>
<p>See <a href="/data-deletion">data deletion instructions</a>, or email <a href="mailto:${email}">${email}</a>.</p>

<h2>Contact</h2>
<p><a href="mailto:${email}">${email}</a></p>

<section class="he">
<h1>מדיניות פרטיות</h1>
<p>הכלי הזה משמש רק את ${brand} כדי לשלוח הודעה פרטית באינסטגרם למי שביקש אותה: מי שהגיב מילת מפתח על פוסט או ריל, ענה לסטורי עם מילת מפתח, או שלח מילת מפתח בהודעה.</p>
<p>אנחנו מקבלים מאינסטגרם את מזהה המשתמש, שם המשתמש והטקסט שכתבת, ומשתמשים בהם רק כדי לבדוק אם יש בו מילת מפתח ולשלוח לך את ההודעה שביקשת.
לא מוכרים, לא משתפים ולא שולחים הודעות שלא ביקשת. תגובות והודעות בלי מילת מפתח לא נשמרות. היומן נמחק אחרי 90 יום.</p>
<p>למחיקת המידע שלך: <a href="mailto:${email}">${email}</a></p>
</section>`);
}

export function deletionPage(env) {
  const brand = esc(env.BRAND_NAME);
  const email = esc(env.CONTACT_EMAIL);
  return layout(`Data Deletion · ${brand}`, `
<h1>Data Deletion Instructions</h1>
<p>To delete any data this tool stored about you, email <a href="mailto:${email}">${email}</a> with your Instagram username
and the subject "Data deletion". We will delete all records related to your username within 7 days and confirm by email.</p>
<p>Records are also deleted automatically 90 days after they were created.</p>

<section class="he">
<h1>מחיקת מידע</h1>
<p>כדי למחוק את המידע שנשמר, אפשר לשלוח מייל ל-<a href="mailto:${email}">${email}</a> עם שם המשתמש שלך באינסטגרם. נמחק הכול תוך 7 ימים ונאשר במייל.
המידע נמחק אוטומטית גם 90 יום אחרי שנשמר.</p>
</section>`);
}
