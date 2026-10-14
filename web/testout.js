// The test-out page: a short multiple-choice test a learner can take instead
// of working through a part. Scoring rules are in testout-logic.js; this file
// only draws the page and remembers the result in the browser.

import * as progress from "./progress.js";
import { md, esc, inline } from "./markdown.js";
import * as L from "./testout-logic.js";

const main = document.getElementById("test");
const params = new URLSearchParams(location.search);
const letter = (params.get("part") || "").toUpperCase();

function fail(msg) {
  main.innerHTML = `<p class="testout-note">${esc(msg)}</p>
    <p><a href="./index.html">Back to the course</a></p>`;
}

async function getJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; }
  catch { return null; }
}

async function main_() {
  if (!/^[A-Z]$/.test(letter)) return fail("No part was chosen for the test.");
  const bank = await getJSON(`./testout/${letter.toLowerCase()}.json`);
  if (!bank) return fail(`There's no test-out for Part ${letter} yet.`);
  const outline = (await getJSON("./outline.json")) ?? [];
  const part = outline.find((p) => p.part === letter);
  const firstOf = (p) => p?.modules?.[0]?.id ?? null;
  const titleOf = (id) => outline.flatMap((p) => p.modules).find((m) => m.id === id)?.title ?? id;
  const moduleOrder = outline.flatMap((p) => p.modules.map((m) => m.id));
  const key = `testout:${bank.part}`;

  document.title = `Test out of Part ${bank.part}`;
  document.getElementById("back").href = firstOf(part) ? `./chapter.html?ch=${firstOf(part)}` : "./index.html";

  // Where the learner is with this test, kept in their browser.
  const prior = progress.get(key);

  function intro() {
    const passedBefore = prior.passed;
    main.innerHTML = `
      <h1>Test out of Part ${esc(bank.part)}</h1>
      <p class="lead">${bank.items_total} questions. Get ${bank.pass_mark} right on your
        first try and you can go straight on to the next part.${passedBefore
          ? ` <strong>You've already passed this test.</strong>` : ""}</p>
      <section class="crib">
        <h2>${esc(bank.crib_title)}</h2>
        ${md(bank.crib)}
      </section>
      ${bank.context ? `<section class="context"><h2>The data</h2>${md(bank.context)}</section>` : ""}
      <p class="startrow"><button class="act" id="start">Start the test</button>
        <span class="sub">Feedback comes after each answer. Your answers are kept only in this browser.</span></p>`;
    main.querySelector("#start").onclick = start;
  }

  function start() {
    progress.record(key, { attempts: (progress.get(key).attempts || 0) + 1 });
    const answers = new Map();
    main.innerHTML = `
      <h1>Test out of Part ${esc(bank.part)}</h1>
      <p class="lead" id="count">0 of ${bank.items_total} answered</p>
      ${bank.context ? `<section class="context"><h2>The data</h2>${md(bank.context)}</section>` : ""}
      <div id="items"></div>`;
    const list = main.querySelector("#items");

    bank.items.forEach((it, i) => {
      const box = document.createElement("article");
      box.className = "tq";
      box.innerHTML = `
        <h3>Question ${i + 1} of ${bank.items.length}</h3>
        <div class="prompt">${md(it.prompt)}</div>
        <div class="tq-options"></div>
        <div class="tq-fb" aria-live="polite"></div>`;
      const opts = box.querySelector(".tq-options");
      for (const o of L.shuffled(it.options)) {
        const b = document.createElement("button");
        b.className = "tq-opt";
        b.dataset.id = o.id;
        b.innerHTML = inline(o.text);
        b.onclick = () => answer(it, o, box, answers);
        opts.append(b);
      }
      list.append(box);
    });
  }

  function answer(it, chosen, box, answers) {
    if (answers.has(it.id)) return;                 // first attempt only
    answers.set(it.id, chosen.id);
    const right = it.options.find((o) => o.correct);
    box.classList.add("answered", chosen.correct ? "right" : "wrong");
    box.querySelectorAll(".tq-opt").forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === chosen.id) b.classList.add("picked");
      if (b.dataset.id === right.id) b.classList.add("correct");
    });
    const fb = box.querySelector(".tq-fb");
    fb.innerHTML = `<div class="verdict ${chosen.correct ? "pass" : "fail"}">
      ${chosen.correct ? "Correct" : "Not yet"}</div>${md(chosen.feedback)}`;

    const n = answers.size;
    main.querySelector("#count").textContent = `${n} of ${bank.items_total} answered`;
    if (n === bank.items_total) finish(answers);
  }

  function finish(answers) {
    const result = L.score(bank.items, answers);
    const ok = L.passed(result.correct, bank.pass_mark);
    const revisit = L.modulesToRevisit(result.missed, moduleOrder);
    const next = L.firstModuleAfter(outline, letter);

    progress.record(key, { passed: ok || prior.passed, score: result.correct,
                           total: result.total, date: Date.now() });

    const nextLink = ok && next
      ? `<p><a class="act-link" href="./chapter.html?ch=${esc(next)}">Continue to ${esc(titleOf(next))} &rarr;</a></p>`
      : ok
        ? `<p>There's no later part, so you've reached the end of the course.</p>`
        : "";
    const revisitBlock = !ok && revisit.length
      ? `<p>Before you try again, it's worth revisiting:</p>
         <ul class="revisit">${revisit.map((m) =>
            `<li><a href="./chapter.html?ch=${esc(m)}">${esc(titleOf(m))}</a></li>`).join("")}</ul>`
      : "";

    main.insertAdjacentHTML("beforeend", `
      <section class="result ${ok ? "pass" : "fail"}">
        <h2>${ok ? "You've passed" : "Not quite yet"}</h2>
        <p>You got ${result.correct} of ${result.total} right on your first try.
          ${ok ? `The pass mark is ${bank.pass_mark}.`
               : `You need ${bank.pass_mark} to pass.`}</p>
        ${nextLink}
        ${revisitBlock}
        ${ok ? "" : `<p><button class="act" id="retake">Try again</button></p>`}
      </section>`);
    main.querySelector("#retake")?.addEventListener("click", start);
    main.querySelector(".result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  intro();
  if (params.get("start") === "1") start();
}

main_();
