import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, matches, findRule, fillTemplate } from '../src/match.js';

test('normalize strips niqqud, punctuation and emoji', () => {
  assert.equal(normalize('  פְּרוֹמְפְּט!!! 🙏 '), 'פרומפט');
  assert.equal(normalize('PROMPT, please'), 'prompt please');
});

test('matches whole words only', () => {
  assert.ok(matches('פרומפט', 'פרומפט'));
  assert.ok(matches('פרומפט 🙏🙏', 'פרומפט'));
  assert.ok(matches('אפשר את הפרומפט?', 'פרומפט'));
  assert.ok(matches('Prompt!', 'prompt'));
  assert.ok(matches('תשלחי לי מדריך קלוד בבקשה', 'מדריך קלוד'));
  assert.ok(!matches('פרומפטים', 'פרומפט'));
  assert.ok(!matches('וואו מדהים', 'פרומפט'));
  assert.ok(!matches('anything', ''));
});

test('specific reel rule wins over general rule', () => {
  const rules = [
    { id: 1, keyword: 'פרומפט', media_id: null, active: 1 },
    { id: 2, keyword: 'פרומפט', media_id: 'reel1', active: 1 },
    { id: 3, keyword: 'קורס', media_id: 'reel2', active: 0 },
  ];
  assert.equal(findRule(rules, 'comment', 'reel1', 'פרומפט').id, 2);
  assert.equal(findRule(rules, 'comment', 'reel9', 'פרומפט').id, 1);
  assert.equal(findRule(rules, 'comment', 'reel2', 'קורס'), null);
});

test('rules only fire for their own source', () => {
  const rules = [
    { id: 1, source: 'comment', keyword: 'פרומפט', media_id: null, active: 1 },
    { id: 2, source: 'story', keyword: 'פרומפט', media_id: null, active: 1 },
  ];
  assert.equal(findRule(rules, 'story', null, 'פרומפט!').id, 2);
  assert.equal(findRule(rules, 'comment', 'x', 'פרומפט').id, 1);
  assert.equal(findRule(rules, 'dm', null, 'פרומפט'), null);
});

test('fillTemplate', () => {
  assert.equal(fillTemplate('היי {username}! {x}', { username: 'dana' }), 'היי dana! {x}');
});

test('comma separated keywords: any one matches', () => {
  const rules = [{ id: 1, source: 'comment', keyword: 'מנויים, מנוים, אשמח', media_id: null, active: 1 }];
  assert.equal(findRule(rules, 'comment', 'x', 'מנוים בבקשה').id, 1);
  assert.equal(findRule(rules, 'comment', 'x', 'אשמח!!').id, 1);
  assert.equal(findRule(rules, 'comment', 'x', 'וואו'), null);
});
