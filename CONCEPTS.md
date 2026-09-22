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
| Argument order matters | ch02-ex06 | ch04-ex05 | 2 | ch07 |
| Syntax: brackets must close | ch02-ex09 | ch05-ex11 (misconception) | 2 | ch07 |
| Variables and `<-` | ch03-ex01 | ch03-ex02/03/04, ch04-ex09, ch05-ex01, ch05-ex04 | 7 | — |
| Assignment prints nothing | ch03-ex01 | ch04 prose | 2 | ch06 |
| Reassignment overwrites silently | ch03-ex03 | ch05-ex04 | 2 | ch07 |
| Names are exact and case-sensitive | ch03-ex04 | — | **1** | **ch06** |
| Multi-line, read top to bottom | ch03 prose, ch03-ex02 | ch03-ex03, ch04-ex09 | 3 | — |
| Type: numeric | ch03 prose | ch03-ex06, ch05-ex07, ch05-ex09 | 4 | — |
| Type: character, and quotes | ch03-ex05 | ch03-ex09, ch03-ex10, ch05-ex07, ch05-ex08, ch05-ex09 | 6 | — |
| Type: logical | ch03-ex07 | ch03-ex08, ch05-ex05, ch05-ex10, ch05-ex11 | 5 | — |
| `TRUE` behaves as 1 in arithmetic | ch03-ex08 | ch05-ex06 | 2 | ch08 |
| `class()` | ch03-ex06 | ch05-ex07, ch05-ex08 (hint) | 3 | ch07 |
| Function vs call (the words) | ch04 prose, ch04-ex01 | — | 1 | **ch07** |
| Defaults exist and are invisible | ch04-ex02 | ch04-ex03/06/07/08, ch05-ex10 | 6 | — |
| Help page, `?function` | ch04-ex03 | ch05-ex10 | 2 | ch07 |
| Named arguments with `=` | ch04-ex04 | ch04-ex05, ch04-ex07, ch04-ex10, ch05-ex10 | 5 | — |
| `=` in a call is not `<-` | ch04 prose | — | **1** | **ch06** |
| Naming lets you reorder | ch04-ex05 | — | **1** | ch06 |
| Return values are ordinary values | ch04-ex09 | ch05-ex04, ch05-ex09 | 3 | — |
| Decoding an unfamiliar call | ch04-ex10 | ch05-ex10 (`sort`) | 2 | ch07 |

### Introduced in module 5

| Concept | Intro | Returns in | n | Needs to return by |
|---|---|---|---|---|
| `c()` makes a vector | ch05-ex01 | ch05-ex03/04/07/08 | 5 | — |
| A vector holds one type only | ch05 prose, ch05-ex07 | ch05-ex08 | 2 | **ch07** |
| Indexing by position, from 1 | ch05-ex02 | ch05-ex11 | 2 | ch07 |
| Arithmetic applies to every value | ch05-ex03 | ch05-ex04 | 2 | **ch06** |
| Returned vs stored | ch05-ex04 | ch05-ex09 | 2 | ch07 |
| Comparison gives a logical vector | ch05-ex05 | ch05-ex06, ch05-ex11 | 3 | ch08 |
| `sum()` of logicals counts TRUEs | ch05-ex06 (choice) | — | **1** | **ch08** |
| `length()`, `mean()`, `max()` on logicals | ch05-ex06 (as distractors) | — | 1 | ch07 |
| Coercion: one text value turns all to text | ch05-ex07 | ch05-ex08, ch05-ex09 | 3 | **ch07** |
| `as.numeric()` | ch03-ex10 (mentioned), ch05-ex09 | — | 1 | **ch07** |
| Nested calls run inside out | ch05-ex09 (explained in prompt) | — | **1** | **ch07** |
| Filtering with a logical vector | ch05-ex11 | — | **1** | **ch08** |

`sum()` of logicals and filtering both have natural homes in module 8, where
you filter data frames. Coercion belongs in module 7 — a data frame column
arriving as character is the most common real form of it.

### Design rule learned in module 5

**Discovery for what's derivable; show-first for what's arbitrary.** A blank
can ask students to *reason* their way to an answer (ch05-ex11: put the
question inside the brackets). It should never ask them to *recall* a
function name they've never been shown. Nobody can derive `c()` or `sum()`.
Name the function in the prompt or the preceding prose, or make it a choice
between several so each wrong answer teaches what that function does.

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
