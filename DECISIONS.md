# Decisions

Why this project is built the way it is. Written so that coming back after a
few months away doesn't mean re-deriving everything. Add to it whenever you
make a call you'd otherwise have to remember.

---

## Start of day

```
cd ~/Downloads/rcourse
npm run build      # validate YAML, write web/exercises/, copy prose
npm run dev        # serve web/ with the headers webR needs
```

- `http://localhost:8080/chapter.html` — prose with exercises inline. Use this.
- `http://localhost:8080/test.html` — one exercise at a time, with a sidebar.
- `http://localhost:8080/` — the original webR diagnostics page.

Run `npm run build` after editing any `.yml` or `.md`. Editing them changes
nothing on the page until you do. `npm install` is once per folder, not daily.

---

## Where things live

```
content/chNN/chNN.md              prose, with ::: exercise {#id} markers
content/chNN/exercises/*.yml      one exercise per file, hand-written
schema/exercise.schema.json       the contract every exercise must satisfy
build/validate.mjs                validates, hashes, emits web/exercises/*.json
build/serve.mjs                   dev server with COOP/COEP
web/exercise.js                   renders and grades all four response kinds
web/chapter.js                    assembles a chapter from prose + exercises
web/progress.js                   what's done, in localStorage
web/reference.js                  the Functions panel
content/reference.yml             every function a student is shown
web/events.js                     append-only event log
web/course.css                    shared styling
netlify/functions/judge.mjs       LLM check for prose answers
CONCEPTS.md                       which ideas appear where
```

You edit YAML and markdown. The build writes JSON into `web/`. Never edit
anything in `web/exercises/` or `web/chapters/` — it's regenerated.

---

## The big decisions

**One long scrolling chapter, not one exercise per screen.** R loads once per
page (about 4 seconds, 28 MB), so a single page means one wait instead of a
repeated one. Students can also scroll back to the explanation above an
exercise, which is exactly what someone does when stuck.

**Prose and exercises live in separate files.** An exercise gets reused in
review sections and later modules; duplicating it would mean two copies
drifting apart. Also, prompts and feedback already contain fenced R code, and
nesting that inside a chapter file causes backtick collisions.

**`type` and `response.kind` are separate fields.** `type` is the
pedagogical label (predict, debug, fix-the-llm, fill-blank, write-prompt) and
drives chapter mix and UI copy. `response.kind` drives the grader and nothing
else. A debug exercise might be answered by picking a span in one chapter and
by rewriting code in another.

**Misconception feedback is the highest-value field.** The validator refuses
to build without `feedback` on every option, and warns when an r-code
exercise has no misconceptions. Misconceptions are matched *before* checks,
because a specific wrong answer beats a generic failure.

**Wrong answers show only their own feedback; the full review comes after
getting it right.** Showing everything on a wrong answer ends the thinking.
The full review — every option, right and wrong, with explanations — is the
reward for arriving. This is the UWorld model, which every med student
already knows.

**Solutions are never locked.** "Show me the answer" is always available,
because locking it just makes people skip the exercise. It's recorded
instead: an exercise revealed by half the cohort is unclear, not a lazy
cohort.

**Setup code runs once per exercise; each attempt gets a fresh child
environment.** So a broken submission can't corrupt the data for the next
attempt, and attempts don't pay to rebuild it.

**Code is passed into R as bound data, never interpolated into a string.**
`webR.objs.globalEnv.bind(".submitted", code)` then
`eval(parse(text = .submitted))`. Escaping R source into an R string literal
works until someone types a backslash.

**R's type names are used only in their R sense.** Never call a vector "a
list" in passing, even before module 10: once "list" means something
specific, the loose use becomes a mistake. Italicise *list*, *vector*,
*character*, *logical* and *numeric* where they could be read as ordinary
English.

**Say "missing value", never "gap".** In prose, feedback, titles and the
reference alike.

**Refer to exercises by their number on screen**, not their id. Ids are
stable and never renumbered, so once an exercise is inserted mid-module the
two drift apart — ch08-ex13 is the second exercise a student sees.

**Don't call a data frame a "2x2 table".** For medical students that means
the contingency table from sensitivity and specificity. Say "a table of rows
and columns".

**Four themes, chosen by the student.** Paper, Night, Sepia and High
contrast. Every theme sets the same CSS variables and nothing elsewhere in
`course.css` refers to a literal colour, so a fifth theme is one block. Each
theme decides for itself whether code sits on a different surface from the
prose — Night puts everything on one dark surface; the light themes tint code
slightly and rely on a hairline border.

The Night theme's palette exists because the audience has never seen a code
editor, and bright syntax on near-black is the thing that makes people want
to keep going. That reason beat an earlier "surgical green" palette grounded
in medical vernacular — delight for a first-time audience is a better
justification than a clever metaphor.

**High contrast uses the Okabe-Ito palette**, which stays distinguishable
under deuteranopia, protanopia and tritanopia. More important than the theme
itself: no information is carried by colour alone anywhere. Verdicts say
"Correct" and "Not yet" in words, and completion shows a checkmark as well as
a green rule.

**Prose holds a 42rem measure; exercises and code break out wider.** Past
roughly 80 characters a line, reading degrades because the eye loses the line
return. Code has no such constraint, so it uses the extra width.

**Discovery for what's derivable; show-first for what's arbitrary.** A blank
can ask students to reason their way to an answer — put the question inside
the brackets. It must never ask them to recall a function name they haven't
been shown, because nobody can derive `c()` or `sum()`. Name it in the
prompt, or make it a choice between several functions so each wrong answer
teaches what that function does. The build enforces this: it warns when a
solution uses a function that isn't in `content/reference.yml`, or that the
reference introduces in a later chapter.

**"Module", never "chapter", in anything a student sees.** It matches the
outline and the pitch. Internally everything is still keyed `ch05`, because
those ids are stable and recorded in analytics — the interface translates.

**The function reference is the course's help page.** `?function` doesn't
display usefully inside webR, so the reference plays that role until module
18 introduces RStudio's real Help pane. It lists only functions introduced up
to the current chapter, and search matches descriptions as well as names —
typing "count" finds `sum()`. That's the describe-what-you-want skill,
practised inside the course. Write `does` in the words a beginner would
search with.

Exercises never tell students to type `?function`, because it doesn't work
where they are. Module 4's prose explains once that help pages exist in a
full R setup, and exercises quote the part that matters as "the usage line
for `x()`".

**Reference notes can be held back with `note_from`.** Two exercises in
module 4 are built on a surprise — `log()` defaulting to base *e*, and
`round(0.5)` being 0. A reference that states those plainly gives the answer
before the lesson. Gate a note when the surprise *is* the pedagogy. Don't
gate it when looking it up is the intended path: ch05-ex06 is meant to be
solved by finding `sum()` in the panel.

**Function names are one colour everywhere** — editors, the panel, and
inline code in prose and feedback. It's the theme's call colour, so purple
in Paper and mint in Night.

**Code in an exercise's prompt runs against that exercise's data**, in its
Run workspace. Prose code runs in a shared scratch space per module, which
has no `patients` in it.

**Data panel columns appear when they're built.** `after:` in a module's
`data.yml` holds a column back until the exercise that creates it is done.

**Every output a student sees should come from R, not from memory.** Printed
output in prompts, expected values in checks, and examples in the Functions
panel. From module 10 on, exercises are written against R's actual output.
`npm run check-examples` runs every reference example through R and flags
any mismatch — it caught a p-value I'd written as 0.0347 that R gives as
0.0797.

**Part E has four modules, and comes before RStudio.** 15 Asking well
(specifying the task), 16 Data you can't show (data handling), 17 Long
sessions (managing context, including compaction), 18 Trusting the result
(validation and reproducibility). RStudio and getting data in move to 19 and
20; the close to 21. Part E's skills don't need an IDE, and this is the part
the course is for.

**Parts D and E stand alone.** Students will be able to test out of earlier
modules, so nothing here relies on remembering an earlier exercise. Earlier
ideas get a short explanation where they're used.

**Written answers are graded by a real AI, and nothing is stored.** The
grader sends only the answer and the rubric — no student ID — and keeps no
log of the text. Course analytics record only which criteria passed. Cost is
cents per student (Haiku 4.5). Before the pilot: set a monthly spending cap,
add a rate limit, and ask whether Mayo has an approved AI agreement this
should run under.

**The grader never follows a student's answer.** In the prompting modules
the answer *is* a prompt ("Write R code that…"). It goes to the grader inside
`<student_answer>` tags, with an explicit instruction that it is text to
judge, never instructions to act on. Criteria are judged in parallel.

**The check is the student's, not the AI's.** Have and want go in the
prompt. The check is worked out independently — pen and paper, by hand, or
in the console — ideally before seeing the AI's result, so it can't anchor
you, though afterwards is fine. Placeholder names are fine for protecting an
idea, as long as names are mapped back carefully. Asking the code to print a count is fine — R computes
it. The AI saying it worked is not a check, and telling it the expected
answer makes the check no longer independent.

**A grader needs testing like any other check.** After deploying a
write-prompt exercise, paste in the exemplar (every criterion should pass),
then the weak original prompt (every criterion should fail). A rubric that
can't fail isn't checking anything.

**Run prints errors the way RStudio does.** webR on its own showed only the
message — `Error: non-numeric argument…` — dropping the *where*. Run now wraps
code in `.course_run()`, which prints `Error in height * height : …` exactly as
RStudio would, so what students learn to read here is what they'll see there.
Syntax errors keep R's extra line with a `^` under the spot where it got
stuck, which RStudio doesn't show but which helps.

**Run and Check never share a workspace.** Run evaluates in its own space
on top of the exercise's data, so anything a student creates while
experimenting persists between Runs, like the RStudio console. Check always
starts fresh from the original data. When they shared one, a `crp` created
with Run was quietly used by Check, and a wrong answer got the wrong
feedback.

**Run behaves like the R console.** Every top-level line that produces a
visible value prints it. Evaluating a block as a single expression printed
only the last line, which taught students something false about R. Grading
still evaluates as one expression, because it needs the final value.

**Warnings are shown.** `options(warn = 1)` makes R print warnings as they
happen, so Run displays them. "It ran but warned" is one of the course's
central failure modes, and R was silently holding them back.

**Prompt code is runnable from the start.** Every R code block becomes a
scratchpad, including ones inside a predict exercise's prompt. That means a
student can run the code before predicting. We tried locking it until the
exercise was answered, and decided against it: checking by running is a
habit worth having, and a student who runs first still has to read the
output and choose. ```` ```rtry ```` fences behave the same as ```` ```r ````.

**Check the middle step as its own exercise.** In RStudio, one-off checks
happen in the console rather than the script. Rather than asking students to
juggle a scratchpad and an answer box at once, the check becomes a short
exercise of its own immediately before the one that uses it — ch06-ex12
asks what `!is.na(sbp)` returns, then ch06-ex09 uses it. One idea per
exercise. Module 18 can name the console.

**A fifth response kind: `table`.** A clickable data frame, laid out like
RStudio's `View()` — row numbers, `NA` in italics, numbers right-aligned.
Students click a column, a row or a cell, depending on `select`. It's span
over a grid, so it reuses the same grading: option ids, feedback on every
option, a full review after the right answer. Cells have too many targets to
give each one feedback, so `other` catches clicks with no option of their
own, and the build refuses a table that has neither full coverage nor
`other`.

**Spacing: compact is the default.** A roomier version exists behind
`?space=open` but didn't feel right in practice. A heading sits close to what it introduces and
far from what came before it, like a nested list; the big gaps go between
sections and between exercises.

**The grid deliberately shows no types.** A viewer shows `142` and `"142"`
identically, which is exactly why `str()` matters. ch07-ex08 is built on
that gap.

**The module menu is grouped by part.** `content/outline.yml` lists the parts
and which modules belong to each; the build pulls every module's title from
its `# N. Title` heading. Twenty modules stay scannable as "Part B — Working
with data › 7 · Shape and inspection". Non-module chapters like `demo` only
appear with `?dev`.

**Parts open with their own page.** A `::: part` block in a chapter's
markdown isn't shown inline. It becomes a full-screen page that fades in the
first time the module is opened, with very little on it, and fades away into
the module when the student continues. It shows again whenever the student
walks into the part from the previous module's "next" link, and a small label
at the top of the module brings it back any time. Make it
specific to what the student has actually done — "you caught a number that
was secretly text" — not generic encouragement, which students learn to skip.

**A Data panel, like RStudio's Environment pane.** Every data frame used in
a module is listed in `content/chNN/data.yml` and shown in a side panel, so
students can keep it in view while writing code about it rather than
scrolling back to find a column name. These must match the data frames each
exercise's `setup` builds; nothing checks that automatically yet.

**Catch-all answers stay last.** Options are shuffled, but an option marked
`last: true` — "Neither", "None", "You can't tell" — stays at the end, where
it reads naturally. Only true catch-alls: an answer that's a real prediction
keeps shuffling even if it says "Nothing", or its position would give it
away.

**Prose understands numbered lists** as well as bullets, with indented lines
continuing the item above.

**A wrong prediction points at the code above it.** On a multiple-choice
exercise whose prompt has runnable code, a wrong answer adds a line saying
the code runs and the student can check it themselves. Predicting, being
wrong, then running it to see why is exactly the loop the course is built
on.

**The Data panel shows more than tables.** An entry with `print:` shows a
vector or a list the way R prints it — module 10 uses it for `result`. Like
RStudio's Environment pane, which lists every object, not just data frames.

**Two wrong code answers in a row point at the Functions panel.** A repeated
miss usually means a missing piece of knowledge rather than a slip. Only for
code exercises, and it never gives the answer — it says where to look.

**Side panels keep their head pinned.** Title, search, Close and the count
stay put while the list scrolls. Only one panel is open at a time.

**Attempt counts are recorded but never shown to students.** Seeing "6
attempts" is discouraging and tells them nothing useful.

**Desktop-only for code exercises.** Typing `<-`, quotes and brackets on a
phone keyboard is miserable, and webR is a 28 MB download. Reading,
multiple-choice and span exercises work fine on a phone. This is one CSS rule
and one check in `exercise.js`, so it's reversible if analytics show people
trying.

**CodeMirror 5, not 6.** Version 5 is three script tags and wraps an existing
textarea in one line. Version 6 is current and modular but needs a module
graph. Reliability beat modernity here. The swap later touches one function.

---

## Measurements (Chrome, laptop, cache disabled)

```
cold transfer, dplyr only     21.4 MB
cold transfer, + ggplot2      27.9 MB
webR init                     ~1.1 s
install dplyr                 ~1.5 s
install dplyr + ggplot2       ~2.7 s
warm eval                     2 ms
```

Consequences: install packages per chapter, not all upfront. One R session
per chapter page, never one per exercise. Warm eval is instant, so pages must
be readable while R loads — prose and multiple-choice render immediately;
only code exercises wait.

The LLM judge adds nothing to these. It runs on the server.

---

## Research and data

**Two separate layers, by design.**

*Anonymous:* everyone. A random participant id created on first visit, tied
to no person, no email, no account. Records exercise attempts, which option
or misconception fired, reveals, and active time. No consent needed because
there is no person in it.

*Consenting:* the pilot cohort only. Adds free-text answers. Separate store,
separate opt-in, covered by the IRB protocol.

**Never let an email address into the analytics store.** Once it's there,
everything in that store is identifiable and the whole thing becomes
human-subjects data.

**Events, not state.** `progress.js` stores "passed: true"; `events.js`
stores the sequence that led there. Current state can be derived from events;
events can't be recovered from state, and there's no way to add them
retrospectively.

**"Pseudonymous", not "anonymous".** The participant id is random but
persistent, and links one person's events together. In a cohort of twenty
classmates, timestamps and completion patterns could plausibly identify
someone. Use the accurate word in the IRB submission.

**Content hashes.** Every exercise carries a hash of its content, recorded
with each event. Editing an exercise after students have seen it would
otherwise merge two different versions under one id and silently break item
analysis.

**The `arm` field is null on every event.** It exists so that adding
randomisation later needs no schema change.

**Misconceptions have explicit ids.** Without them, analytics falls back to
list position, so reordering a list silently renames things in your data.
The schema now requires them.

### Open with the IRB
- Reliance agreement / SMART IRB across participating schools, rather than
  separate submissions at each.
- Does approval cover the public phase, where participants are at
  institutions you have no relationship with?
- Senior students recruiting juniors for a credit-bearing course is a
  voluntariness question. Address it in the submission rather than waiting.
- Whether analytics data may be processed in third-party AI tools.

---

## Course design

13.25 hours of instruction across 20 modules, none over 45 minutes, plus a
~3 hour required capstone. An optional tutored project sits outside the
course.

**Session length matters more than course length.** Nobody completes a
14-hour course; they complete twenty 40-minute sessions.

**What was cut and why:** writing functions (they'll delegate it), writing
loops (same — recognition only, 30 minutes), and Part E shrank from 4.5 to
2.25 hours because critical appraisal belongs in the margins of every module,
not quarantined at the end.

**Each module's exercises should bring back at least two concepts from
earlier modules.** In the exercises, where retrieval happens, not the prose.
See `CONCEPTS.md` for what's thin.

---

## Traps already hit

- **`esc` must be a function declaration, not `const`.** Arrow functions
  assigned to `const` don't hoist, and it's used before its definition.
- **YAML reads bare `false`, `true`, `yes`, `no`, `on`, `off` as booleans.**
  An option with `id: false` fails validation with confusing errors.
- **Ajv's default export is draft-07.** Import from `ajv/dist/2020.js`.
- **Span markers and `>`.** `<<c|>>>` needs a negative lookahead so the
  closing `>>` isn't followed by another `>`. The validator rejects any span
  that captures empty text.
- **Never swallow an error in a grader.** An empty `catch` hid a real bug for
  an hour. Same failure mode the course teaches about.
- **`on_fail` must be true for every wrong answer**, not just the one you
  pictured. Specific wrong answers belong in `misconceptions`.
- **Compute every expected value before committing it.** A wrong expected
  value marks a correct student wrong.
- **Test shared URLs in a private window.** Netlify sites can be behind a
  login wall that your own browser waves you through.
- **Zips can't carry `.git`.** Unpacking one over the folder disconnects the
  repo. Extract individual files instead.
- **Never renumber exercise ids to match reading order.** They are stable
  slugs recorded in every analytics event; renaming one silently merges two
  different exercises in the data. The chapter shows position ("6 of 9")
  instead, so prose order and file order can differ freely.
- **Scope layout rules to `main`.** CodeMirror draws every line of code as
  its own `<pre>`, so a bare `pre { margin }` rule spreads code apart line by
  line. And a bare `h2` rule reaches the side panels' titles. Anything about
  the module's spacing belongs under `main`.
- **Unzipping over the folder lost the grading function.** Early archives
  didn't contain `netlify/functions/`, so replacing the folder deleted
  `judge.mjs`, before git history was restarted. It was missing for weeks
  without anything failing loudly, because no module has used a prose
  exercise since. Restored from the original code. Safer habit: commit
  before extracting anything, then `git status` shows exactly what changed.
- **PyYAML accepts duplicate keys; the build's js-yaml rejects them.** A
  script of mine added a second `follows:` line to three files, and my
  Python check passed them. Check YAML with js-yaml — the same parser the
  build uses — or better, run the real build.
- **`captureConditions: false` swallows R errors.** webR's own code, with
  that setting, catches the error itself, prints "Error: ..." to stderr and
  reports success. So in Check, every error was treated as "it ran", grading
  carried on against the unchanged data, and no `on: error` misconception in
  the course ever fired. Students got whichever other feedback happened to
  match — the "capital letters" message for a wrong-length column, "still
  character" for `labs$crp <- crp`. Check now uses `captureConditions: true`,
  which throws the error to us. Run keeps it off, so errors print like the
  console, and recognises them by the "Error" prefix.
- **I misdiagnosed this twice.** First I blamed quote marks, then leftover
  state from Run. Both fixes were harmless but neither was the cause. The
  lesson: when feedback is wrong, test the failing case directly rather than
  reasoning about it — and read the library's source when behaviour doesn't
  match what its option names suggest.
- **Don't match R error messages on their quote marks.** R prints straight
  or curly quotes around names depending on the system, so `'crp' not found`
  silently never matched. Error patterns use `crp\W+not found` instead.
- **A broken reference used to ship an empty Functions panel.** A YAML error
  in `reference.yml` only warned, then wrote an empty file. It now fails the
  build. Multi-line example output needs an explicit indentation indicator,
  `|2-`, or leading spaces on the first line confuse the parser.
- **A CSS `display` rule overrides the `hidden` attribute.** `hidden` is
  just a default `display: none`, and any stylesheet rule setting `display`
  beats it. The course stylesheet now forces `[hidden]` to stay hidden.
- **A `str_replace` that matches nothing fails silently.** One wrong space of
  indentation in a schema edit produced 238 confusing validation errors
  pointing at the wrong thing. Same failure mode as the swallowed `catch`.

---

## Not built yet

- **An orientation for the site itself.** Should also explain that
  `______` in an answer box means "replace this" — code won't run until it's
  gone. Students also need to be shown, once,
  that they can switch colour themes, sync progress across devices, reveal an
  answer without penalty, run and edit any code block in the prose, and use
  Cmd/Ctrl+Enter. This belongs in module 1, after the objectives — the course
  currently explains R but never explains its own interface, and a student who
  doesn't know the scratchpads are editable will never edit one. Keep it
  short and show rather than tell: let them change the theme inside the
  tutorial rather than reading that they can.
- Analytics endpoint. Events buffer in localStorage; nothing is uploaded.
- Cross-device progress: a random sync code, no account, no email. Union
  merge — passed anywhere means passed.
- Modules 1, 5–20, and the capstone.
- Plot display. `webr::canvas()` returns an ImageBitmap and needs a canvas
  element. ~15 lines, untested.
- Whether a plot can be auto-graded at all. No return value, no stdout.
  Pedagogy decision, not technical.
- Stopping a runaway submission. An infinite loop hangs the page.
- A privacy notice for the public site.
