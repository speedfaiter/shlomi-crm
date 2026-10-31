# העברה לשיחה מקומית: אוטומציית אינסטגרם של שלומי חן

## מה זה
Cloudflare Worker שמקבל webhooks מאינסטגרם ושולח הודעות פרטיות אוטומטיות (תגובה על ריל/פוסט, תשובה לסטורי, הודעה ישירה).
- קוד: ריפו `speedfaiter/shlomi-crm`, ענף `claude/bold-rubin-9vnmaa`, תיקייה `instagram-dm/`.
- עותק מקומי במק: `~/Downloads/shlomi-crm-claude-bold-rubin-9vnmaa/instagram-dm` (נפרש מ-ZIP, אינו git clone).
- כתובת: https://instagram-dm.shlomichen.workers.dev (דף ניהול: `/admin`, סיסמה ב-`secrets.local.txt` באותה תיקייה).
- D1: `instagram-dm` (id 4de607f3-ab64-4729-a347-d37cd8c0564a). wrangler כבר מחובר.
- אפליקציית מטא: **MBTM Message Assistant** (App ID 2660370694411057, Instagram app ID 1084026314479439), מסלול "API setup with Instagram login" (legacy). האפליקציה Published. החשבון shlomichen1 (ig_user_id 17841400357423049) מחובר עם טוקן שהוכנס ידנית ל-settings (ה-OAuth של /connect נכשל בשגיאת redirect_uri, לא ללחוץ "חיבור מחדש").
- Webhook: callback `/webhook`, שדות comments, messages, messaging_postbacks מנויים, והמתג "מינוי ל-Webhook" ליד shlomichen1 דלוק.

## מה עובד
- 15 חוקים ב-D1: מדריך התפרצויות (עוקבים בלבד + הודעה מקדימה, קישור https://claude.ai/artifact/C3yJsSLacgVUqVnSeyMSsP), מתכון, לחם, סדנה, ושאלון לידים (flow.js) לכל המקורות.
- דף ניהול עם לידים וקישורי תשלום.

## הבעיה הפתוחה (לפתור קודם)
`npx wrangler tail` מראה `bad signature: check IG_APP_SECRET / META_APP_SECRET` על כל webhook.
הקוד בודק X-Hub-Signature-256 מול IG_APP_SECRET ו-META_APP_SECRET (index.js, receiveWebhook).
צריך להגדיר מחדש את הסודות בלי רווחים/שורה חדשה (המשתמש מעתיק את הסוד, ואז):
```
pbpaste | tr -d ' \n' | npx wrangler secret put META_APP_SECRET   # App settings ← Basic ← App secret
pbpaste | tr -d ' \n' | npx wrangler secret put IG_APP_SECRET     # API setup with Instagram login ← Instagram app secret
```
ואז `npx wrangler tail` ותגובה "מדריך" מחשבון אחר. אם עדיין bad signature, לבדוק את החישוב (אפשר להדפיס זמנית את ה-hex המחושב מול ה-header, בלי להדפיס את הסוד).

## כללי עבודה עם המשתמש
- עברית, גובה העיניים, צעד אחד ואז עוצרים ומחכים ל"המשך". לכל צעד: למה, איפה ללחוץ, איך יודעים שהצליח.
- לעולם לא לבקש להדביק סוד בצ'אט. סודות רק דרך פקודה בטרמינל.
- לפני שינוי עיצוב דף הניהול: להראות הדמיה ולחכות לאישור.
- לפרוס עם `npx wrangler deploy` מתוך התיקייה. לשמור שינויים גם ב-git של הענף אם יש clone.

## מה נשאר מהרשימה המקורית
- ג. תשובה פומבית מתחלפת: קיים (public_reply, כמה שורות). לוודא, ולהוסיף אפשרות "רק פומבי בלי הודעה".
- ד. מצב "כל תגובה מפעילה" בלי מילה, פעם אחת לאדם בכל ריל.
- ה. לא לענות לתגובות של שלומי עצמו ולתגובות שהמערכת כתבה (קיים חלקית: from.id === ig_user_id).
- ו. דף ניהול לפי שלבים (טריגר, תשובה פומבית, הודעה מקדימה, עוקבים בלבד, לינק), עריכת כל טקסט, תצוגת טלפון.
- ז. עיצוב בעברית RTL בצבעים, גופן ותמונה של שלומי (לשאול).
- בסוף: מסמך קצר בעברית איך מוסיפים אוטומציה ומה בודקים כשמשהו לא עובד.
- קופות חולים: לשאול את שלומי על הפרטים (ההודעה שלו נקטעה).
