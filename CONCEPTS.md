# Concept ledger

What has been introduced, and where it comes back. Fill this in as you write
each module — it's much harder to reconstruct later.

**The rule this exists to enforce:** every module's exercises should bring
back at least two concepts from earlier modules. Not in the prose, where a
reminder is just more reading, but in the exercises, where the student has
to retrieve the idea to get the answer.

Anything sitting at one appearance is at risk. A concept met once is a fact;
a concept met in four different situations becomes a reflex, and reflexes
are what you're actually building.

---

## The spine

The course's own argument. This one is repeating well — five appearances
across three modules, in five different disguises.

| Concept | Intro | Returns in | n |
|---|---|---|---|
| Code that runs but is wrong | ch02-ex02 | ch02-ex06, ch02-ex07, ch02-ex08, ch04-ex06, ch04-ex08 | 6 |
| Clinical knowledge as the check | ch02-ex02 | ch02-ex07, ch04-ex08 | 3 |
| Errors that stop, and are cheap | ch02-ex09 | ch03-ex04, ch03-ex05, ch03-ex09, ch03-ex10 | 5 |

The MAP calculation itself is a running thread: ch02-ex07/08 (wrong
formula), ch03-ex09/10 (right formula, wrong types), ch04-ex10 (`paste("MAP
is", 93.33)`). Worth keeping deliberate — one clinical anchor, three
different lessons.

## Mechanics

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| The run loop (write, answer, look) | ch02 prose | everywhere | — | — |
| Arithmetic | ch02-ex01 | ch02-ex02/03/04/08, ch03-ex02, ch03-ex08 | 7 | — |
| Order of operations | ch02-ex01 | ch02-ex02, ch02-ex03, ch02-ex04, ch03-ex02 | 5 | — |
| Parentheses to control order | ch02-ex04 | ch02-ex08, ch03-ex02 | 3 | — |
| Function call: name + parentheses | ch02-ex05 | ch03-ex06, ch04-ex01, all of ch04 | 8+ | — |
| Arguments, by position | ch02-ex05 | ch02-ex06, ch04-ex01, ch04-ex05 | 4 | — |
| Argument order matters | ch02-ex06 | ch04-ex05, ch06-ex04, ch09-ex06, ch09-ex10 | 5 | — |
| Syntax: brackets must close | ch02-ex09 | ch05-ex11, ch08-ex06 (misconceptions) | 3 | — |
| Variables and `<-` | ch03-ex01 | ch03-ex02/03/04, ch04-ex09, ch05-ex01, ch05-ex04 | 7 | — |
| Assignment prints nothing | ch03-ex01 | ch04 prose, ch06-ex11 | 3 | — |
| Reassignment overwrites silently | ch03-ex03 | ch05-ex04, ch07-ex09, ch09-ex06 | 4 | — |
| Names are exact and case-sensitive | ch03-ex04 | ch06-ex11, ch07-ex04, ch09-ex01 | 4 | — |
| Multi-line, read top to bottom | ch03 prose, ch03-ex02 | ch03-ex03, ch04-ex09 | 3 | — |
| Type: numeric | ch03 prose | ch03-ex06, ch05-ex07, ch05-ex09 | 4 | — |
| Type: character, and quotes | ch03-ex05 | ch03-ex09, ch03-ex10, ch05-ex07, ch05-ex08, ch05-ex09 | 6 | — |
| Type: logical | ch03-ex07 | ch03-ex08, ch05-ex05, ch05-ex10, ch05-ex11 | 5 | — |
| `TRUE` behaves as 1 in arithmetic | ch03-ex08 | ch05-ex06, ch06-ex07 | 3 | — |
| `class()` | ch03-ex06 | ch05-ex07, ch05-ex08 (hint), ch07-ex09 | 4 | — |
| Function vs call (the words) | ch04 prose, ch04-ex01 | — | 1 | **ch07** |
| Defaults exist and are invisible | ch04-ex02 | ch04-ex03/06/07/08, ch05-ex10 | 6 | — |
| Help page, `?function` | ch04-ex03 | ch05-ex10 | 2 | ch07 |
| Named arguments with `=` | ch04-ex04 | ch04-ex05, ch04-ex07, ch04-ex10, ch05-ex10 | 5 | — |
| `=` in a call is not `<-` | ch04 prose | ch06-ex04, ch09-ex11 | 3 | — |
| Naming lets you reorder | ch04-ex05 | ch06-ex04, ch09-ex11 | 3 | — |
| Return values are ordinary values | ch04-ex09 | ch05-ex04, ch05-ex09 | 3 | — |
| Decoding an unfamiliar call | ch04-ex10 | ch05-ex10 (`sort`) | 2 | ch07 |

### Introduced in module 5

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `c()` makes a vector | ch05-ex01 | ch05-ex03/04/07/08 | 5 | — |
| A vector holds one type only | ch05 prose, ch05-ex07 | ch05-ex08 | 2 | **ch07** |
| Indexing by position, from 1 | ch05-ex02 | ch05-ex11, ch08-ex01/02/04 | 5 | — |
| Arithmetic applies to every value | ch05-ex03 | ch05-ex04, ch06-ex02 | 3 | — |
| Returned vs stored | ch05-ex04 | ch05-ex09, ch08-ex11 | 3 | — |
| Comparison gives a logical vector | ch05-ex05 | ch05-ex06, ch05-ex11, ch08-ex07, ch08-ex09 | 5 | — |
| `sum()` of logicals counts TRUEs | ch05-ex06 (choice) | ch06-ex07 | 2 | ch08 |
| `length()`, `mean()`, `max()` on logicals | ch05-ex06 (as distractors) | — | 1 | ch07 |
| Coercion: one text value turns all to text | ch05-ex07 | ch05-ex08, ch05-ex09, ch07-ex08 | 4 | — |
| `as.numeric()` | ch03-ex10 (mentioned), ch05-ex09 | ch07-ex09 | 2 | ch09 |
| Nested calls run inside out | ch05-ex09 (explained in prompt) | ch06-ex07, ch07-ex06 (read aloud) | 3 | **ch08** |
| Filtering with a logical vector | ch05-ex11 | ch06-ex08, ch06-ex09 | 3 | — |

`sum()` of logicals and filtering both have natural homes in module 8, where
you filter data frames. Coercion belongs in module 7 — a data frame column
arriving as character is the most common real form of it.

### Introduced in module 6

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `NA` means unknown, not zero or text | ch06-ex01 | ch06-ex02/03/10 | 4 | — |
| `NA` spreads through calculations | ch06-ex02 | ch06-ex03, ch06-ex08 | 3 | **ch08** |
| `na.rm = TRUE` | ch06-ex04 | ch06-ex10, ch07-ex05, ch08-ex12, ch09-ex09 | 5 | — |
| `== NA` never works | ch06-ex05 | ch06-ex06, ch08-ex10 (misconceptions) | 3 | — |
| `is.na()` | ch06-ex06 | ch06-ex07, ch06-ex09, ch08-ex09, ch08-ex10 | 5 | — |
| `sum(is.na(x))` to check a strange result | ch06-ex07 | ch07-ex10 (via `summary`) | 2 | ch09 |
| `!` means not | ch06-ex12 | ch06-ex09, ch08-ex09/10/11 | 5 | — |
| A gap silently changes a filter | ch06-ex08 | ch06-ex09, ch08-ex08, ch08-ex10 | 4 | — |

### What module 6 brought back

- Vectorised arithmetic (ch05-ex03) → ch06-ex02
- Named arguments, and `=` not `<-` inside a call (ch04) → ch06-ex04, both
  as misconceptions
- Argument order matters (ch02-ex06, ch04-ex05) → ch06-ex04's `positional`
  misconception, where `mean(sbp, TRUE)` sets `trim` instead
- `sum()` of logicals (ch05-ex06) → ch06-ex07
- `class()` and coercion (ch03, ch05-ex07) → ch06-ex01, by contrast
- Filtering with a logical vector (ch05-ex11) → ch06-ex08, ch06-ex09
- Names are exact and case-sensitive (ch03-ex04) → ch06-ex11
- Assignment prints nothing (ch03-ex01) → ch06-ex11's feedback
- `length()` counts slots (ch05-ex06) → ch06-ex07's misconception, and
  ch06-ex08's feedback
- Write the question, not its answer (ch03-ex02's `hardcoded-numbers`) →
  ch06-ex09's `hardcoded-logicals`

### Design rule learned in module 5

**Discovery for what's derivable; show-first for what's arbitrary.** A blank
can ask students to *reason* their way to an answer (ch05-ex11: put the
question inside the brackets). It should never ask them to *recall* a
function name they've never been shown. Nobody can derive `c()` or `sum()`.
Name the function in the prompt or the preceding prose, or make it a choice
between several so each wrong answer teaches what that function does.

### Introduced in module 13

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| An error has a *what* and a *where* | ch13-ex01 | ch13-ex11 | 2 | ch17 |
| Syntax errors: "unexpected", and nothing runs | ch13-ex02 | ch13-ex03, ex04, ex05 | 4 | — |
| Curly quotes from documents break code | ch13-ex03 | — | 1 | ch18 |
| Fixing an error isn't fixing the code | ch13-ex05 | — | **1** | **ch14** |
| A script stops at the first error; earlier lines ran | ch13-ex06 | — | 1 | ch18 |
| The *where* is where R noticed, not always the cause | ch13-ex07 | — | **1** | **ch14** |
| A warning isn't an error — R carries on | ch13-ex08 | — | **1** | **ch14** |
| Ugly calls like `$<-.data.frame` are R's internals | ch13-ex11 | — | 1 | ch17 |
| "undefined columns selected" means a name mismatch | ch13-ex12 | — | 1 | ch16 |
| Ask for help with the error *and* the code — never the data | ch13-ex13 | — | **1** | **ch16** |

### What module 13 brought back

- The unclosed bracket (ch02-ex09) → ch13-ex05
- MAP's missing-brackets mistake (ch02-ex08, ch09-ex03) → ch13-ex05, where
  fixing the syntax in the wrong place gives it back silently
- Quotes make text (ch03-ex09/10) → ch13-ex06, ex07
- Names are exact (ch03-ex04, ch07-ex04) → ch13-ex12
- "No package called" versus "could not find function", and the misleading
  `filter()` error (ch12) → ch13-ex01, ex09
- `else` placement, `if` and `NA` (ch11) → ch13-ex04, ex10
- One value fills every row; several must match (ch09-ex02) → ch13-ex11
- `"<5"` becoming `NA` (ch07-ex09) → ch13-ex08
- `$` with a wrong name returns NULL (ch07, ch09, ch10) → ch13-ex12's
  `dollar-null` misconception, as a preview of module 14
- Describing data without sharing it (planned, ch16) → ch13-ex13

**Module 14 carries the quiet failures.** Everything that fails without
stopping — the phantom row, values dropped silently, a new column inheriting
missing values, a note turning a column to text, `$` returning `NULL`,
defaults nobody chose — moved from module 13 to 14, along with `str()`,
`summary()` and `nrow()` as the tools for catching them.

### Introduced in module 12

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| Install once; `library()` every session | ch12-ex01 | ch12-ex02, ex05 | 3 | ch18 |
| "No package called" vs "could not find function" | ch12-ex02 | ch13-ex01, ch13-ex09 | 2 | — |
| `install.packages()` needs quotes; `library()` doesn't | ch12-ex03 | — | 1 | ch18 |
| "Masked" is a message, not an error | ch12-ex04 | ch12-ex05, ch13-ex09 (feedback) | 3 | — |
| A forgotten `library()` can give a misleading error | ch12-ex05 | ch13-ex09 (feedback) | 2 | — |
| `package::function` | ch12-ex06 | — | 1 | ch14 |
| Bare column names inside dplyr functions | ch12-ex07 | ch12-ex08/09/10/11/12 | 6 | — |
| `filter()` drops `NA` rows; `[` adds one | ch12-ex08 | — | **1** | **ch14** |
| The pipe, `|>` and `%>%`, read as "and then" | ch12-ex10 | ch12-ex12 | 2 | ch15 |
| dplyr functions never change the original | ch12-ex11 | ch12-ex12 | 2 | ch14 |
| `select()` keeps named columns | ch12-ex12 | — | 1 | ch14 |
| **Meeting something new: name it, look it up, try it small, check it** | ch12-ex13 | — | **1** | **ch15** |
| "Sanity check", named as a term | ch10 prose, ch12-ex13 | — | 2 | ch14 |

### What module 12 brought back

- Quotes make text; a bare word is a variable (ch03, ch07) → ch12-ex03, ex09
- Errors that stop, and reading their messages (ch02, ch03) → ch12-ex01/02/05
- Two functions with one name — the defaults-are-decisions theme, now as
  "which function ran?" (ch04, ch10) → ch12-ex04, ex05
- Column names need `patients$` (ch07) → ch12-ex07, which says plainly where
  that rule does and doesn't apply
- The phantom row from square brackets (ch08-ex08) → ch12-ex08, as contrast
- Missing values dropped silently (ch10-ex08) → ch12-ex08
- Filtering on a logical column (ch08-ex06) → ch12-ex09, ex10
- MAP (ch02, ch09) → ch12-ex11, ex12
- Filtering never changes the original; returned vs stored (ch05, ch08,
  ch09) → ch12-ex11
- `!is.na()` (ch06) → ch12-ex12

**The routine for something unfamiliar is the course's most transferable
skill, and it has to recur.** Part C gave students vocabulary — lists, loops,
packages, pipes — but vocabulary runs out; the course can't cover every
function they'll meet. ch12-ex13 names the routine and practises it once,
with `arrange()`, which is deliberately left out of the Functions panel.
The feedback names it a *sanity check* and links it to earlier ones —
ch06-ex12 and ch09-ex04 — so the term carries forward as one idea: before
trusting something, try it on data you already know.
Plan: one never-seen-before exercise in each Part E module (15, 16, 17), each
using a function the course doesn't teach, and the routine as a core
requirement of the capstone. In module 18, add the steps RStudio makes
possible: `?function`, and asking an AI what something does — then checking
its answer by trying it.

**The tidyverse breaks two rules students have learned** — bare column names
and what happens to `NA` in a filter. Both are named explicitly in the
exercises rather than left as contradictions for students to trip over.

**`library()` loads a package for the whole page in webR.** Once one exercise
loads dplyr, a forgotten-`library()` error can't be reproduced live, so
ch12-ex01 and ex05 show their code as plain text, not runnable boxes.

### Introduced in module 11

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `for (x in values)` — the name takes each value in turn | ch11-ex01 | ch11-ex02/03/05/08/09 | 6 | — |
| The body runs once per value | ch11-ex01 | ch11-ex02 | 2 | — |
| Inside a loop, nothing shows unless printed | ch11-ex03 | — | **1** | **ch14** |
| `1:length(x)` and `x[i]` — counting through positions | ch11-ex04 | — | 1 | ch14 |
| A loop that could be one line | ch11-ex04 | ch11-ex05 | 2 | **ch17** |
| `if` runs one block; `else` the other | ch11-ex06 | ch11-ex07, ex08 | 3 | — |
| `if` needs exactly one TRUE or FALSE | ch11-ex07 | ch11-ex08, ch13-ex10 (feedback) | 3 | — |
| `if` stops on `NA` | ch11-ex08 | ch13-ex10 | 2 | — |
| `[[ ]]` takes a name stored in a variable | ch11-ex09 | — | 1 | ch14 |
| The loop variable survives the loop, holding the last value | ch11-ex01 | — | 1 | ch14 |
| Braces can be dropped around a one-line block | ch11-ex06 | ch11-ex05, ex07, ex08 | 4 | — |
| `else` must follow `}` on the same line | ch11-ex06 (feedback) | ch13-ex04 | 2 | — |
| `if` is not `ifelse()` | ch11 prose | ch11-ex07 | 2 | — |
| Each `print()` shows its own line, starting `[1]` | ch11-ex02 | — | 1 | ch14 |

**`[1]` is now explained in module 5**, keeping module 2's promise. It sits
in "Picking out one value", since `[1]` is a position, and uses `1:30` so
the second line visibly starts with a new position. That also previews `:`,
which module 11 then uses in `1:length(sbp)`.

**Module 11 was reordered** so `if` is introduced before any exercise uses
it. On screen: ex01, 02, 03, 06, 07, 08, 04, 05, 09.

### What module 11 brought back

- Arithmetic applies to every value (ch05-ex03) → ch11-ex02, ex04: the loop's
  output is `sbp - 10`, and the payoff deferred from module 6
- Returned vs stored (ch05-ex04) → ch11-ex03, a loop that throws its results
  away
- Indexing by position (ch05-ex02) → ch11-ex04's `sbp[i]`
- `mean()` of TRUE/FALSE gives a fraction (ch05-ex06, ch09-ex09) → ch11-ex05,
  with `sum()` and `length()` as its distractors
- `ifelse()` (ch09-ex10/11) → ch11-ex07, as the tool `if` isn't
- Missing values, and the three ways functions handle them (ch06, ch08-ex08,
  ch10-ex08) → ch11-ex08 names all three
- Lists, `$` giving `NULL` on a wrong name, and `names()` (ch10) → ch11-ex09
- `[[ ]]` (ch10-ex03, mentioned) → ch11-ex09, where it's actually needed

`attr(,...)` lines (due ch11) didn't fit a module about loops; carry to
module 13, where reading unfamiliar output is the theme.

### Introduced in module 10

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| A list: named pieces of any size and type | ch10-ex01 | ch10-ex06, ch11-ex09 | 3 | — |
| The printout is a report; the object is the list | ch10-ex01 | ch10-ex03 | 2 | **ch15** |
| `names()` shows what's inside | ch10-ex02 | ch11-ex09 (feedback) | 2 | ch14 |
| `$` takes a piece out of a list | ch10-ex03 | ch10-ex06 | 2 | — |
| `[[ ]]` does the same as `$` | ch10-ex03 (why) | ch11-ex09 | 2 | — |
| Printed numbers are rounded; the stored one isn't | ch10-ex03 | — | 1 | ch14 |
| Tests run with defaults you didn't choose (Welch) | ch10-ex04 | — | **1** | **ch14** |
| `x` and `y` in output are argument names | ch10-ex05 | — | **1** | **ch14** |
| `attr(,...)` lines are labels, not values | ch10-ex06 (why) | — | 1 | ch14 |
| Scientific notation, e.g. `5e-04` | ch10-ex07 | — | **1** | **ch14** |
| Never report p = 0 | ch10-ex07 | — | 1 | ch17 |
| Some functions drop missing values silently | ch10-ex08 | — | **1** | **ch14** |

### What module 10 brought back

- `$` with a wrong name returns NULL silently (ch07, ch09) → ch10-ex03,
  and `result$names` in ch10-ex02
- Defaults are decisions made for you, and the usage line (ch04) → ch10-ex04
- Argument order matters (ch02-ex06, ch04, ch09-ex10) → ch10-ex05
- Indexing a vector by position (ch05-ex02) → ch10-ex06
- `round()` (ch02, ch04, ch09-ex06) → ch10-ex07
- Missing values, and `mean()` returning `NA` (ch06) → ch10-ex08
- Different functions, different rules for missing values — a new twist on
  ch06: `t.test()` drops them where `mean()` refuses

Module 10 is a 30-minute module, so it carries less old material than the
45-minute ones by design.

### Introduced in module 9

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| Storing into a new column name creates it | ch09-ex01 | ch09-ex03, ex08, ex11 | 4 | — |
| One value fills every row; several must match | ch09-ex02 | ch13-ex11 | 2 | — |
| A formula runs down every row at once | ch09-ex03 | ch09-ex08 | 2 | ch14 |
| A new column inherits its ingredients' missing values | ch09-ex03, ch09-ex05 | — | 2 | **ch14** |
| Check a new column beside its ingredients | ch09-ex04 | — | **1** | **ch14** |
| Storing into an existing column replaces it | ch09-ex06 | — | **1** | **ch14** |
| `df[, "col"] <-` adds a column; `df["col", ] <-` adds a row | ch09-ex07 | — | **1** | **ch14** |
| `mean()` of a logical column gives a fraction | ch09-ex09 | ch11-ex05 | 2 | — |
| `ifelse(test, yes, no)` | ch09-ex10 | ch09-ex11, ch11-ex07 | 3 | — |
| Changing a filtered copy doesn't change the original | ch09-ex12 | — | **1** | ch14 |
| A note typed into a number column makes it text | ch09-ex13 | — | **1** | ch14 |

### What module 9 brought back

- Columns must be the same length (ch07-ex03) → ch09-ex02
- MAP, and all three wrong formulas from module 2 (ch02-ex07/08) → ch09-ex03
- `NA` spreads through calculations (ch06) → ch09-ex03, ex05, ex08
- `$` with a wrong name returns NULL silently (ch07-ex04) → ch09-ex01
- Names are exact and case-sensitive (ch03-ex04) → ch09-ex01
- Several columns with `c()` (ch08-ex05) → ch09-ex04
- `patients["age", ]` fails silently (ch08-ex03) → ch09-ex04, and again as
  assignment in ch09-ex07
- `df[, "col"]` is the same as `df$col` (ch08-ex03) → ch09-ex07
- Check the middle step (ch06 rule) → ch09-ex04
- `summary()` and `NA's` (ch07-ex10) → ch09-ex05
- Argument order matters, and `round()` (ch02-ex06, ch04) → ch09-ex06
- Reassignment overwrites silently (ch03-ex03) → ch09-ex06
- Comparison gives a logical vector (ch05-ex05) → ch09-ex08
- `mean()` of logicals, `na.rm`, and `nrow()` (ch05-ex06, ch06, ch08) →
  ch09-ex09, where `nrow()` appears as the reason 0.4 is wrong
- Reading a usage line, and an unfamiliar call (ch04) → ch09-ex10
- Naming lets you reorder; `=` not `<-` in a call (ch04) → ch09-ex11
- Filtering never changes the original (ch08-ex11) → ch09-ex12
- One type per vector, and the spreadsheet view hiding it (ch05, ch07) →
  ch09-ex13

**Operators introduced on first use, not before:** `>=` is explained in
ch09-ex08's prompt. `*` is only explained in a hint (ch02-ex08) and in
ch09-ex03's prompt — worth one sentence in module 2's prose. A short list of
comparison operators (`>`, `<`, `>=`, `<=`, `==`, `!=`) would sit naturally
in module 5's comparison section.

**Planned for module 18: what the editor does for you.** Once students are
in RStudio, show the typing help it gives, and why each matters:

- **Autocomplete.** Type `result$` and RStudio lists every name inside; Tab
  fills one in. That would have prevented both `result$p.val` and
  `result$p` in ch10-ex03 — the full name, spelled right, every time. The
  same works for column names after `patients$` and for function names.
- **Bracket pairing.** Type `(` and the `)` appears. Select some text and
  type `(` or `"`, and it's wrapped rather than replaced.
- **Matching-bracket highlight.** Put the cursor beside a bracket and its
  partner lights up — the fastest way to find the unclosed bracket from
  ch02-ex09.

The course's own editor already does the last one. Worth pointing that out
in module 18 as "you've been using this since module 2".

**Planned: `head()` for sanity checks on large data.** Pointless on five
rows, so it waits until data is bigger than a screen — module 19, when
students read a real file, and again in module 13's sanity-check theme.
`head(patients, 10)` is the same idea as `patients[1:10, ]`.

**Still owed:** `&` (due ch09) didn't fit naturally; carry to module 13 with
the other missing-value traps, where `TRUE & NA` versus `FALSE & NA` is
worth a second look. `str()` is named in ch09-ex13's feedback but not
retrieved — also module 13.

### Introduced in module 8

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `df[row, col]` — rows before the comma | ch08-ex01 | ch08-ex02 to ex13 | 13 | — |
| Columns by position as well as by name | ch08-ex13 | — | 1 | ch09 |
| A blank side means "all of them" | ch08-ex02 | ch08-ex03/04/06/07 | 5 | — |
| `patients["age", ]` fails silently | ch08-ex03 (distractor) | ch09-ex04, ch09-ex07 | 3 | — |
| `df[, "col"]` is the same as `df$col` | ch08-ex03 | ch08-ex12, ch09-ex07 | 3 | — |
| Several rows or columns with `c()` | ch08-ex04, ch08-ex05 | ch09-ex04 | 3 | — |
| Filtering rows with a logical vector | ch08-ex06 | ch08-ex07/08/10/11 | 5 | — |
| An `NA` in a filter adds a whole `NA` row | ch08-ex08 | ch08-ex10 | 2 | **ch14** |
| `&` means and; `FALSE & NA` is `FALSE` | ch08-ex09 | ch08-ex10 | 2 | **ch14** |
| `nrow()` | ch08-ex11 | ch09-ex09 (misconception) | 2 | ch14 |
| Filtering never changes the original | ch08-ex11 | ch09-ex12 | 2 | — |

### What module 8 brought back

- Indexing by position, from 1 (ch05-ex02) → ch08-ex01, ex02, ex04
- `c()` to make a vector of positions or names (ch05-ex01) → ch08-ex04, ex05
- Quotes make text; a bare name is a variable (ch03, ch07-ex09) → ch08-ex03,
  ex05, ex07
- Row = one patient (ch07) → ch08-ex02, ex08
- Filtering one column by another (ch07-ex11) → ch08-ex06
- Comparison gives a logical vector (ch05-ex05) → ch08-ex07, ex09
- `$` with a wrong name returns NULL silently (ch07-ex04) → ch08-ex07's
  `wrong-name` misconception, where a misspelt column keeps no rows
- A gap silently changes a filter (ch06-ex08) → ch08-ex08, now a whole row
- `is.na()` and `!` (ch06) → ch08-ex09, ex10, ex11
- `== NA` never works (ch06-ex05) → ch08-ex10's `equals-na` misconception
- Write the question, not its answer (ch03-ex02, ch06-ex09) → ch08-ex10
- Brackets must close (ch02-ex09) → ch08-ex06's `unclosed` misconception
- Returned vs stored (ch05-ex04) → ch08-ex11
- Nested calls read inside out (ch05-ex09, ch06 rule) → ch08-ex12
- `NA` spreads through calculations, and `na.rm` (ch06) → ch08-ex12

**Carried to module 9**, where they fit adding and changing columns:
argument order, reassignment overwriting silently, the help page, one type
per vector, and `data.frame()` itself.

### Introduced in module 7

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `data.frame()` from vectors | ch07 prose, ch07-ex03 | — | 1 | **ch08** |
| Row = one patient, column = one variable | ch07-ex01, ch07-ex02 | ch07-ex11 | 3 | ch08 |
| Columns must be the same length | ch07-ex03 | ch09-ex02 | 2 | — |
| `$` pulls out a column as a vector | ch07-ex04 | ch07-ex05/06/09/11 | 5 | — |
| `$` with a wrong name returns NULL silently | ch07-ex04 (misconception) | ch08-ex07 (misconception) | 2 | ch14 |
| `str()` shows shape and types | ch07-ex07 | ch07-ex08 | 2 | **ch14** |
| A spreadsheet view hides types | ch07-ex08 | ch09-ex13 | 2 | — |
| `summary()`, and `NA's` across every column | ch07-ex10 | ch09-ex05 | 2 | ch14 |
| Filtering one column by another | ch07-ex11 | ch08-ex06 | 2 | — |
| `"<5"` is not missing — a clinical judgement | ch07-ex09 | ch13-ex08 | 2 | — |

### What module 7 brought back

- Vectors, `NA` and `na.rm` (ch05, ch06) → ch07-ex01, ch07-ex02, ch07-ex05
- `sum()` of logicals, and `length()` as its distractor → ch07-ex06
- Reading a nested call inside out (ch06 rule) → ch07-ex06's explanation
- Coercion: one text value turns a column to text (ch05-ex07) → ch07-ex08
- `class()` and `as.numeric()` (ch03, ch05-ex09) → ch07-ex09
- Reassignment overwrites silently (ch03-ex03) → ch07-ex09's explanation
- `as.numeric()` turns unreadable text into `NA` → ch07-ex09
- Names are exact and case-sensitive (ch03-ex04) → ch07-ex04, ch07-ex09
- Errors that stop are cheap (ch02-ex09) → ch07-ex03
- Filtering with a logical vector (ch05-ex11) → ch07-ex11

Nested calls in the full sense — one function inside another — didn't
return here. Due by module 8.

**Module 8 should open with bracket indexing on data frames**:
`patients[3, "sbp"]`, `patients[2, ]`, `patients[, "age"]`. It's the direct
extension of `sbp[2]` from module 5, and the comma is one of the most common
things beginners misread in generated code. Then logical row selection,
`patients[patients$discharged, ]`, which generalises ch07-ex11.

### Design rules learned in module 8

**Fade the scaffolding.** A blank placed exactly where the answer goes turns
*where it goes* into a given. That's fine the first time a skill appears, and
wrong after that — especially when placement is the lesson, as the comma is
in module 8. Give the full structure once (`patients[______, ]`), then just
the brackets (`patients[______]`), then nothing (`______`).

**For two-slot answers, show the comma, not a blank.** `patients[______]`
reads as "one thing goes here", when the answer is two things with a comma
between them. `patients[ , ]` shows the shape without saying which side
anything goes on.

**When you remove scaffolding, accept every correct answer.** Without the
comma provided, `patients[c("age", "sbp")]` also works. Say so in the
explanation instead of marking valid R wrong.

**Check analogies for direction.** "Like x-y coordinates" and "like cell B3
in Excel" both put columns first — the opposite of `[row, col]`. A theatre
seat (row, then seat) gets it right.

### Design rules learned in module 6

**Read nested calls aloud, inside out.** Whenever an exercise wraps one
function around another, the explanation should give the plain-language
reading of each layer: `is.na(sbp)` asks *which values are missing?*;
`sum(is.na(sbp))` asks *how many are missing in total?* This is how
experienced people read code, and it's the skill that makes nesting
readable rather than intimidating.

**Describe how people actually work, not an ideal checklist.** "Run this on
every dataset before anything else" isn't what anyone does — they start
working, notice something odd, and go back to check. Same lesson as
`class()` in module 5. Frame diagnostic tools as what you reach for *after*
something looks wrong. Students who are told to check everything first, and
then don't, conclude they're doing it wrong.

**Teach checking the middle step.** Run the inner piece on its own line
before using it — `!is.na(sbp)` before `sbp[!is.na(sbp)]`. It's the most
transferable debugging habit there is, and it's exactly how you'd check what
an AI handed you. Worth prompting in any exercise where a question goes
inside brackets or a call goes inside another.

**Only announce review when an exercise is purely review.** Interleaving
works partly because the learner has to recognise which earlier idea
applies. Labelling every exercise that brings something back removes that.
So ch06-ex04, which mixes old and new, stays unannounced; ch06-ex11, which is
entirely old material, gets one framing line so it doesn't feel out of place.

**The grader's working is for authors.** Check logs appear only in the
harness or with `?dev`. Learners see feedback and R's own error messages.

## What module 5 was planned to carry

Vectors is a natural home for most of the thin entries above, and none of
this would be filler — it's how these ideas actually show up in real work.

- **`class()` on a vector**, where the answer is about the whole thing at
  once. Brings back `class()` and all three types.
- **A vector that is character when you expected numeric** — one `"12.4"`
  among the numbers turns the entire vector to character. This is the real
  version of ch03-ex09, and it is how lab data actually arrives.
- **`sum()` over a logical vector** to count TRUEs. Brings back ch03-ex08
  and pays off the "thousand TRUEs and FALSEs" line in ch03's prose.
- **A function with a default that changes what you get back** — `sort()`
  and `decreasing = FALSE`, or `mean()` and `na.rm`. Brings back defaults,
  named arguments, and the help page in one exercise.
- **`?` on a function they haven't met**, so looking things up becomes a
  habit rather than a thing they did once in module 4.
- **An unclosed bracket in a longer expression**, where it's harder to spot
  than in `round(3.14159, 2`.

## R versus programming in general

For module 20. Add to this every time you hit one.

| Thing | R | Elsewhere |
|---|---|---|
| Assignment | `<-` | `=` almost everywhere else |
| Rounding a half | to even: `round(0.5)` is 0 | Python the same; JavaScript rounds up; Excel rounds away from zero |
| Text type | character | string |
| True/false type | logical | boolean |
| Plain numbers | numeric (not integer) | many languages distinguish int and float by default |
| Indexing | starts at 1 | starts at 0 nearly everywhere else (flagged in ch05-ex02) |
| Arithmetic on a collection | applies to every value automatically | usually needs a loop, or a library like NumPy |
| Mixing types in one collection | silently converts everything to the widest type | many languages allow mixed lists, or refuse outright |
