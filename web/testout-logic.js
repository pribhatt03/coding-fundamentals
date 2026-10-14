// The rules of a test-out, with no page in them so they can be tested on
// their own. The page in testout.js only draws what these return.

/** A copy of the options in a random order. The ids and text are untouched. */
export function shuffled(options, rand = Math.random) {
  const a = [...options];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Score a test. `answers` maps item id -> the option id picked on the first
 * attempt. An item with no answer counts as wrong.
 */
export function score(items, answers) {
  const missed = items.filter((it) => {
    const picked = answers.get(it.id);
    const right = it.options.find((o) => o.correct);
    return picked !== right.id;
  });
  return { correct: items.length - missed.length, total: items.length, missed };
}

/** Pass when the score reaches the pass mark. */
export function passed(correct, passMark) {
  return correct >= passMark;
}

/** The modules a learner should revisit: each missed item's module, once, in course order. */
export function modulesToRevisit(missedItems, moduleOrder) {
  const wanted = new Set(missedItems.map((it) => it.module));
  return moduleOrder.filter((m) => wanted.has(m));
}

/**
 * The first module of the part after `part`, from outline.json, or null if
 * there isn't one. `outline` is the array the build writes.
 */
export function firstModuleAfter(outline, part) {
  const i = outline.findIndex((p) => p.part === part);
  const next = outline.slice(i + 1).find((p) => p.part && p.modules.length);
  return next ? next.modules[0].id : null;
}
