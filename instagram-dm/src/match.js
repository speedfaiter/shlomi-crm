// התאמת מילות מפתח: בלי ניקוד, בלי סימני פיסוק ואימוג'י, בלי הבדל בין אותיות גדולות לקטנות.

const NIQQUD = /[֑-ׇ]/g;
const NON_WORD = /[^\p{L}\p{N}]+/gu;

export function normalize(text) {
  return (text || '')
    .normalize('NFKC')
    .replace(NIQQUD, '')
    .toLowerCase()
    .replace(NON_WORD, ' ')
    .trim();
}

// מילת המפתח צריכה להופיע כמילה שלמה ("פרומפט!" כן, "פרומפטים" לא).
// מותרת אות שימוש אחת לפניה בעברית: ו/ה/ל/ב/ש ("והפרומפט", "לפרומפט").
export function matches(commentText, keyword) {
  const kw = normalize(keyword);
  if (!kw) return false;
  const words = normalize(commentText).split(' ');
  const kwWords = kw.split(' ');
  for (let i = 0; i + kwWords.length <= words.length; i++) {
    let ok = true;
    for (let j = 0; j < kwWords.length; j++) {
      const w = words[i + j];
      const k = kwWords[j];
      if (w === k) continue;
      if (j === 0 && w.length === k.length + 1 && 'והלבש'.includes(w[0]) && w.slice(1) === k) continue;
      ok = false;
      break;
    }
    if (ok) return true;
  }
  return false;
}

// חוק שמוגדר לריל הספציפי קודם לחוק כללי.
export function findRule(rules, source, mediaId, text) {
  const active = rules.filter((r) => r.active && (r.source || 'comment') === source);
  const specific = active.filter((r) => r.media_id && r.media_id === mediaId);
  const general = active.filter((r) => !r.media_id);
  return [...specific, ...general].find((r) => keywords(r.keyword).some((k) => matches(text, k))) || null;
}

// כמה מילות מפתח בשדה אחד, מופרדות בפסיק: "מנויים, מנוים, אשמח"
export function keywords(field) {
  return (field || '').split(/[,،]/).map((k) => k.trim()).filter(Boolean);
}

export function fillTemplate(text, vars) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
}

export function pickVariant(text) {
  const lines = (text || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}
