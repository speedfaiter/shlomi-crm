// קריאות ל-Instagram API with Instagram Login.

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
];

function graph(env, path) {
  return `https://graph.instagram.com/${env.GRAPH_VERSION}${path}`;
}

async function call(url, init = {}) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error || {};
    throw new Error(`${res.status} ${e.code || ''} ${e.message || JSON.stringify(body)}`.trim());
  }
  return body;
}

export function authorizeUrl(env, redirectUri, state) {
  const p = new URLSearchParams({
    enable_fb_login: '0',
    client_id: env.IG_APP_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(','),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

// קוד חד-פעמי ← טוקן קצר ← טוקן ל-60 יום
export async function exchangeCode(env, code, redirectUri) {
  const short = await call('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env.IG_APP_ID,
      client_secret: env.IG_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });
  const shortToken = short.access_token || short.data?.[0]?.access_token;
  const p = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: env.IG_APP_SECRET,
    access_token: shortToken,
  });
  const long = await call(`https://graph.instagram.com/access_token?${p}`);
  return long.access_token;
}

export async function refreshToken(token) {
  const p = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token });
  const res = await call(`https://graph.instagram.com/refresh_access_token?${p}`);
  return res.access_token;
}

export async function getMe(env, token) {
  const p = new URLSearchParams({ fields: 'user_id,username', access_token: token });
  return call(graph(env, `/me?${p}`));
}

// מפעיל קבלת webhooks של תגובות והודעות (כולל תגובות לסטורי) עבור החשבון
export async function subscribe(env, token) {
  const p = new URLSearchParams({ subscribed_fields: 'comments,messages', access_token: token });
  return call(graph(env, `/me/subscribed_apps?${p}`), { method: 'POST' });
}

export async function listMedia(env, token) {
  const p = new URLSearchParams({
    fields: 'id,caption,media_type,media_product_type,thumbnail_url,media_url,permalink,timestamp',
    limit: '30',
    access_token: token,
  });
  const res = await call(graph(env, `/me/media?${p}`));
  return res.data || [];
}

// Private Reply: הודעה פרטית אחת למי שהגיב, עד 7 ימים מהתגובה
// הודעה עם כפתור (Button Template) אם הוגדר כפתור, אחרת טקסט רגיל
export function buildMessage(text, button) {
  if (!button?.url) return { text };
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text.slice(0, 640),
        buttons: [{ type: 'web_url', url: button.url, title: (button.title || 'לפתיחה').slice(0, 20) }],
      },
    },
  };
}

export async function sendPrivateReply(env, token, igUserId, commentId, message) {
  return call(graph(env, `/${igUserId}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message }),
  });
}

// הודעה רגילה למי ששלח הודעה או הגיב לסטורי (מותר עד 24 שעות מההודעה שלו)
export async function sendMessage(env, token, igUserId, recipientId, message) {
  return call(graph(env, `/${igUserId}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { id: recipientId }, message }),
  });
}

// האם האדם עוקב אחרי החשבון. null = מטא לא החזירה תשובה (ואז שולחים בכל מקרה)
export async function isFollower(env, token, igsid) {
  try {
    const p = new URLSearchParams({ fields: 'is_user_follow_business', access_token: token });
    const res = await call(graph(env, `/${igsid}?${p}`));
    return typeof res.is_user_follow_business === 'boolean' ? res.is_user_follow_business : null;
  } catch (e) {
    console.error('follow check', e.message);
    return null;
  }
}

// הודעה עם כפתורים: { type: 'postback', title, payload } או { type: 'web_url', title, url }
export function buttonsMessage(text, buttons) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text.slice(0, 640),
        buttons: buttons.map((b) => ({ ...b, title: b.title.slice(0, 20) })),
      },
    },
  };
}

export async function getUsername(env, token, igsid) {
  const p = new URLSearchParams({ fields: 'username', access_token: token });
  const res = await call(graph(env, `/${igsid}?${p}`));
  return res.username || '';
}

export async function replyPublicly(env, token, commentId, text) {
  return call(graph(env, `/${commentId}/replies`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: text }),
  });
}

export async function verifySignature(secret, rawBody, header) {
  if (!header || !header.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, header.slice(7));
}

export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
