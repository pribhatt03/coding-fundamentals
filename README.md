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


## Measured, not guessed

Chrome, laptop, cache disabled. Re-measure with a private window if these
ever look wrong — a normal reload will quietly serve you cached files.

Day 1 — dplyr only
  cold transfer      21.4 MB
  webR init          1138 ms
  install dplyr      1453 ms
  first eval         1228 ms
  warm eval          2 ms

Day 2 — dplyr + ggplot2
  cold transfer      27.9 MB
  install both       2742 ms

So ggplot2 costs about 6.5 MB and 1.3 s on top of dplyr.

The LLM judge adds nothing to these. It runs on the server; none of its
code reaches the browser.


## Open questions for day 2

- Does ggplot2 install, and how long does it add?
- Plot capture: webr::canvas() returns ImageBitmap, needs a canvas element.
- Cancelling a runaway submission needs SharedArrayBuffer + interrupt.
- Judge for prose exercises: unbuilt. Ships as self-assessment.


## Start of day

1. Go to the folder
cd ~/Downloads/rcourse

cd means "change directory." Terminal always has one folder it's pointed at, and commands only work on files there. This points it at your project.

If you're not sure it worked, type pwd — it prints where you are, and should end in /rcourse.

2. Rebuild the exercises
npm run build

This reads every .yml file in content/, checks each one against the schema, and writes the combined result into web/exercises/. That folder is what the website actually reads — the YAML files are for you, the JSON is for the browser.

You should see 33 exercise(s) valid. If it says FAIL, something in a YAML file is malformed and nothing gets written; fix it and run again.

Run this every time you change a .yml file. Editing YAML doesn't change what the site shows until you rebuild.

3. Start the server
npm run dev

This starts a small program that serves your web folder to your browser, with the two special headers webR needs. It'll print http://localhost:8080 and then sit there looking like it's frozen — that's correct. It's waiting to serve pages.

4. Open the page

Go to http://localhost:8080/test.html in Chrome.

Not / — that's the old webR spike with no sidebar. /test.html is the harness.
