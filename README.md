# Course scaffold — day 1

    npm install
    npm run build     # validate YAML -> dist/exercises/*.json
    npm run dev       # http://localhost:8080 with COOP/COEP set

## What's here

    schema/exercise.schema.json   the contract
    content/ch04/exercises/*.yml  hand-authored instances, one per response kind
    build/validate.mjs            schema + custom rules, emits runtime JSON
    build/serve.mjs               dev server with COOP/COEP
    web/                          the webR spike (diagnostics, not the course UI)

## Afternoon spike: what to write down

Open the page and record these. They are the numbers the whole project's UX
budget is built on.

- [ ] crossOriginIsolated true? If not, fix headers before anything else.
- [ ] webR init, cold cache (use a private window)
- [ ] install dplyr
- [ ] first eval vs warm eval
- [ ] total transferred bytes, from the network tab
- [ ] does the grading path return PASS for the correct answer?
- [ ] does it return the NA misconception for `mean(temp)`?

## Open questions for day 2

- Does ggplot2 install, and how long does it add?
- Plot capture: webr::canvas() returns ImageBitmap, needs a canvas element.
- Cancelling a runaway submission needs SharedArrayBuffer + interrupt.
- Judge for prose exercises: unbuilt. Ships as self-assessment.
