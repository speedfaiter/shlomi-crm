-- חוקים התחלתיים: מילים ישירות (מתכון, לחם, סדנה) ושאלון הלידים, בתגובות, בסטורי ובהודעות
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('comment', 'מתכון, מתכונים, המתכון', 'היי {username}! 🍳 הנה כל המתכונים הבריאים מ"במטבח של שלומי וזינגי", בלי טיגון ובלי חומרים משמרים. בתיאבון!', 'למתכונים', 'https://shlomichen-mbtm.netlify.app/recipes/', 'שלחתי לך בפרטי 💌
בדקו את ההודעות 😉
מחכה לך בהודעות 🙌', 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('comment', 'לחם', 'היי {username}! 🍞 הנה המדריך "לחם בריא לילדים": מתכון בסיס, וריאציות וטיפים לילדים בררנים. חינם!', 'להורדה', 'https://mbtm.ravpage.co.il/lehem%20bari', 'שלחתי לך בפרטי 💌
בדקו את ההודעות 😉
מחכה לך בהודעות 🙌', 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('comment', 'סדנה, סדנת', 'היי {username}! 🙌 הנה הסדנה המקוונת להורים לילדים בעודף משקל ואכילה רגשית (4 מפגשים). במבצע: 199₪ במקום 350₪.', 'להרשמה', 'https://my.schooler.biz/s/113906/sadnakids', 'שלחתי לך בפרטי 💌
בדקו את ההודעות 😉
מחכה לך בהודעות 🙌', 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('story', 'מתכון, מתכונים, המתכון', 'היי {username}! 🍳 הנה כל המתכונים הבריאים מ"במטבח של שלומי וזינגי", בלי טיגון ובלי חומרים משמרים. בתיאבון!', 'למתכונים', 'https://shlomichen-mbtm.netlify.app/recipes/', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('story', 'לחם', 'היי {username}! 🍞 הנה המדריך "לחם בריא לילדים": מתכון בסיס, וריאציות וטיפים לילדים בררנים. חינם!', 'להורדה', 'https://mbtm.ravpage.co.il/lehem%20bari', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('story', 'סדנה, סדנת', 'היי {username}! 🙌 הנה הסדנה המקוונת להורים לילדים בעודף משקל ואכילה רגשית (4 מפגשים). במבצע: 199₪ במקום 350₪.', 'להרשמה', 'https://my.schooler.biz/s/113906/sadnakids', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('dm', 'מתכון, מתכונים, המתכון', 'היי {username}! 🍳 הנה כל המתכונים הבריאים מ"במטבח של שלומי וזינגי", בלי טיגון ובלי חומרים משמרים. בתיאבון!', 'למתכונים', 'https://shlomichen-mbtm.netlify.app/recipes/', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('dm', 'לחם', 'היי {username}! 🍞 הנה המדריך "לחם בריא לילדים": מתכון בסיס, וריאציות וטיפים לילדים בררנים. חינם!', 'להורדה', 'https://mbtm.ravpage.co.il/lehem%20bari', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, button_text, button_url, public_reply, flow, active, created_at) VALUES ('dm', 'סדנה, סדנת', 'היי {username}! 🙌 הנה הסדנה המקוונת להורים לילדים בעודף משקל ואכילה רגשית (4 מפגשים). במבצע: 199₪ במקום 350₪.', 'להרשמה', 'https://my.schooler.biz/s/113906/sadnakids', NULL, 0, 1, 1793442419);
INSERT INTO rules (source, keyword, message, public_reply, flow, active, created_at) VALUES ('comment', 'איפה, נמצאים, מיקום, כתובת, סניף, נתניה, אור עקיבא, אימון, אימונים, הכרות, היכרות, פרטים, הרשמה, מחיר, עולה, עלות, אונליין, ליווי', 'שאלון', 'שלחתי לך בפרטי 💌
בדקו את ההודעות 😉
מחכה לך בהודעות 🙌', 1, 1, 1793442419);
INSERT INTO rules (source, keyword, message, public_reply, flow, active, created_at) VALUES ('story', 'איפה, נמצאים, מיקום, כתובת, סניף, נתניה, אור עקיבא, אימון, אימונים, הכרות, היכרות, פרטים, הרשמה, מחיר, עולה, עלות, אונליין, ליווי', 'שאלון', NULL, 1, 1, 1793442419);
INSERT INTO rules (source, keyword, message, public_reply, flow, active, created_at) VALUES ('dm', 'איפה, נמצאים, מיקום, כתובת, סניף, נתניה, אור עקיבא, אימון, אימונים, הכרות, היכרות, פרטים, הרשמה, מחיר, עולה, עלות, אונליין, ליווי', 'שאלון', NULL, 1, 1, 1793442419);
