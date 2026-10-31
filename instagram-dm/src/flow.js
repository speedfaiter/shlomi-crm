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
  courses: { title: '📚 קורסים ומדריכים' },
};
const NO_LINK = 'ניצור איתכם קשר בקרוב לתיאום 🙏';

// כשאין קישור תשלום בהגדרות: שולחים לוואטסאפ לתיאום
const WHATSAPP = 'https://wa.me/message/5ZJASLFLUQJUO1';
const DEFAULT_LINKS = { pay_intro: WHATSAPP, pay_consult: WHATSAPP, online_url: 'https://shlomichen-mbtm.netlify.app/coaching.html' };

export const COURSES_TEXT = 'הקורסים והמדריכים שלנו כבר עזרו לאלפי הורים וילדים 💪 מה מעניין אתכם?';
export const COURSES = [
  { title: 'סדנת הורים 199₪', button: 'להרשמה', url: 'https://my.schooler.biz/s/113906/sadnakids',
    text: 'סדנה מקוונת להורים לילדים בעודף משקל ואכילה רגשית (גילאי 5–14): 4 מפגשים עם כלים להתמודד עם נשנושים, אכילה מול מסכים, ואיך לדבר עם הילד על אוכל ומשקל. במבצע: 199₪ במקום 350₪ 🙌' },
  { title: 'הסופר של אמא 99₪', button: 'לתוכנית', url: 'https://my.schooler.biz/s/83678/1730061485262',
    text: '"הכוח אצלך": תוכנית דיגיטלית להורים שרוצים לשנות את הרגלי התזונה ואורח החיים של הילדים ושל כל המשפחה. במבצע: 99₪ במקום 149₪ 🛒' },
  { title: 'ליווי אישי אונליין', button: 'לפרטים', url: 'https://shlomichen-mbtm.netlify.app/coaching.html',
    text: 'ליווי אישי 1:1 אונליין בשיטת MBTM: תהליך אישי או משפחתי שבונה אמון, צמיחה רגשית וביטחון חברתי אצל הילד 💻' },
  { title: 'הרצאה לבית ספר', button: 'לתיאום בוואטסאפ', url: WHATSAPP,
    text: 'הרצאות לילדים ונוער ("מה שלומי?", "תופעת הקפוצ\'ון") לבתי ספר ומוסדות, פרונטלי או בזום. בואו נתאם 🎤' },
  { title: '🍞 מדריך לחם חינם', button: 'להורדה', url: 'https://mbtm.ravpage.co.il/lehem%20bari',
    text: 'מדריך "לחם בריא לילדים": מתכון בסיס, וריאציות וטיפים שעובדים גם עם ילדים בררנים. חינם, הורדה מיידית 🎁' },
  { title: '📝 שאלון הורות חינם', button: 'לשאלון', url: 'https://mbtmisrael.my.canva.site/c98mvvt1f0myjve4',
    text: 'שאלון "אמונות הורה": מזהה דפוסים שמשפיעים על ההורות, ובסופו ניתוח אישי. חינם 🎁' },
  { title: '🍳 מתכונים חינם', button: 'למתכונים', url: 'https://shlomichen-mbtm.netlify.app/recipes/',
    text: '"במטבח של שלומי וזינגי": מתכונים בריאים לילדים, בלי טיגון ובלי חומרים משמרים. חינם 🍳' },
];

export const CHOICE_STEP = QUESTIONS.length;
const COURSES_STEP = CHOICE_STEP + 1;

function choicesFor(answers) {
  const local = /נתניה|אור עקיבא/.test(answers.area || '');
  return local ? ['intro', 'consult', 'courses'] : ['consult', 'online', 'courses'];
}

const pickBy = (items, text) => items.find((i) => text.includes(i.title) || i.title.includes(text));

// ההודעה של שלב מסוים: שאלה (עם כפתורי בחירה אם יש) או בחירת המסלול בסוף
export function stepMessage(step, answers) {
  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    return { text: q.text, options: q.options || null };
  }
  if (step === CHOICE_STEP) {
    return { text: 'תודה! 🙏 מה מתאים לכם?', options: choicesFor(answers).map((k) => CHOICES[k].title) };
  }
  return { text: COURSES_TEXT, options: COURSES.map((c) => c.title) };
}

// מקבלים תשובה ומחזירים את השלב הבא, או את ההודעה האחרונה כשהשאלון נגמר
export function answer(step, answers, text, settings) {
  const next = { ...answers };
  if (step < QUESTIONS.length) {
    next[QUESTIONS[step].key] = text.slice(0, 200);
    return { step: step + 1, answers: next, done: false };
  }
  if (step === COURSES_STEP) {
    const c = pickBy(COURSES, text) || COURSES[COURSES.length - 1];
    next.choice = c.title;
    return { step: step + 1, answers: next, done: true, final: { text: c.text, button: { url: c.url, title: c.button } } };
  }
  const keys = choicesFor(answers);
  const key = keys.find((k) => text.includes(CHOICES[k].title) || /קורס|מדריך/.test(text) && k === 'courses'
    || text.includes(CHOICES[k].title.split(' ')[0])) || keys[0];
  if (key === 'courses') return { step: COURSES_STEP, answers: next, done: false };
  const c = CHOICES[key];
  next.choice = c.title;
  const url = settings[c.link] || DEFAULT_LINKS[c.link];
  const title = url === WHATSAPP ? 'לתיאום בוואטסאפ' : c.button;
  const final = url ? { text: c.text, button: { url, title } } : { text: `${c.text.replace(/:$/, '.')} ${NO_LINK}` };
  return { step: step + 1, answers: next, done: true, final };
}

export function quickReplyMessage({ text, options }) {
  if (!options) return { text };
  return {
    text,
    quick_replies: options.map((title) => ({ content_type: 'text', title: title.slice(0, 20), payload: title })),
  };
}
