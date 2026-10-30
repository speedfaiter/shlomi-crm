// שאלון לידים בתוך ההודעות הפרטיות: שאלה אחת בכל פעם, חלקן עם כפתורי בחירה מהירה.

export const INTRO = 'היי! 👋 אנחנו בנתניה ובאור עקיבא, ויש גם ליווי אונליין צמוד. כדי להתאים לכם בדיוק, כמה שאלות קצרות 🙂';

export const QUESTIONS = [
  { key: 'child', label: 'שם הילד/ה', text: 'מה השם של הילד/ה? 😊' },
  { key: 'age', label: 'גיל', text: 'בן/בת כמה?', options: ['4-6', '7-9', '10-13', '14+'] },
  { key: 'goal', label: 'מטרה', text: 'מה הכי חשוב לכם להשיג?', options: ['ביטחון עצמי', 'כושר ומשקל', 'משמעת וריכוז', 'אחר'] },
  { key: 'area', label: 'אזור', text: 'מאיפה אתם בארץ?', options: ['נתניה והסביבה', 'אור עקיבא והסביבה', 'אזור אחר'] },
  { key: 'tried', label: 'ניסו לפני', text: 'ניסיתם משהו לפני?', options: ['כן', 'לא'] },
];

const CHOICES = {
  intro: { title: 'אימון היכרות 119₪', link: 'pay_intro', button: 'לתשלום ותיאום',
    text: 'מעולה! 🎉 אימון היכרות (119₪) בנתניה או באור עקיבא. לחצו לתשלום ותיאום:' },
  consult: { title: 'שיחת ייעוץ 49₪', link: 'pay_consult', button: 'לתשלום ותיאום',
    text: 'מעולה! 📹 שיחת ייעוץ בווידאו עם שלומי (49₪): היכרות, אבחון ושיחה עם ההורים והילד. לחצו לתשלום ותיאום:' },
  online: { title: 'ליווי אונליין', link: 'online_url', button: 'לפרטים',
    text: 'מעולה! 💻 ליווי אונליין צמוד, מכל מקום בארץ. הנה כל הפרטים:' },
};
const NO_LINK = 'ניצור איתכם קשר בקרוב לתיאום 🙏';

export const CHOICE_STEP = QUESTIONS.length;

function choicesFor(answers) {
  const local = /נתניה|אור עקיבא/.test(answers.area || '');
  return local ? ['intro', 'consult'] : ['consult', 'online'];
}

// ההודעה של שלב מסוים: שאלה (עם כפתורי בחירה אם יש) או בחירת המסלול בסוף
export function stepMessage(step, answers) {
  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    return { text: q.text, options: q.options || null };
  }
  return { text: 'תודה! 🙏 מה מתאים לכם?', options: choicesFor(answers).map((k) => CHOICES[k].title) };
}

// מקבלים תשובה ומחזירים את השלב הבא, או את ההודעה האחרונה כשהשאלון נגמר
export function answer(step, answers, text, settings) {
  const next = { ...answers };
  if (step < QUESTIONS.length) {
    next[QUESTIONS[step].key] = text.slice(0, 200);
    return { step: step + 1, answers: next, done: false };
  }
  const keys = choicesFor(answers);
  const key = keys.find((k) => text.includes(CHOICES[k].title) || text.includes(CHOICES[k].title.split(' ')[0])) || keys[0];
  const c = CHOICES[key];
  next.choice = c.title;
  const url = settings[c.link];
  const final = url ? { text: c.text, button: { url, title: c.button } } : { text: `${c.text.replace(/:$/, '.')} ${NO_LINK}` };
  return { step: step + 1, answers: next, done: true, final };
}

export function quickReplyMessage({ text, options }) {
  if (!options) return { text };
  return {
    text,
    quick_replies: options.map((title) => ({ content_type: 'text', title: title.slice(0, 20), payload: title })),
  };
}
