# Nachweis MVP - Claude Code Instructions

## Product goal

We are building a high-fidelity demo version of a Bausoll-aware Nachtragsakte builder for DACH construction contractors.

The purpose of this MVP is not to process real construction documents yet.

The purpose is to create a convincing, clickable, demo-quality prototype that we can show to Bauleiter, kaufmännische Bauleiter, Projektleiter, Nachtragsmanager and potential design partners to get feedback on:

* whether the workflow feels valuable,
* whether the screens match their real Nachtragsmanagement process,
* whether the output looks like something they would use,
* whether the evidence and pricing logic is credible,
* whether they would test this with real historical cases later.

This MVP should show how the product would look and behave if it were already working.

The MVP should be an interactive demo prototype, not only a static screen mockup.

The user should be able to click through the workflow and feel how the product would work, but the app does not need to actually capture photos, record audio, process files, ingest emails, run AI models or generate real PDFs.

Use preloaded demo assets, scripted UI states and realistic transitions.

## What this MVP is

This MVP is:

* a polished product demo,
* a realistic Nachtragsakte builder interface,
* a clickable workflow prototype,
* based on one strong synthetic example case,
* designed for user interviews and design partner conversations,
* focused on showing the product vision clearly,
* an interactive simulation of the future workflow.

The synthetic case should feel realistic and concrete. It should not feel like placeholder lorem ipsum or generic mock data.

## What this MVP is not

This MVP is not yet:

* a real document-processing system,
* a real AI extraction pipeline,
* a production application,
* a legal advice engine,
* an ERP/AVA/CDE integration,
* a GAEB parser,
* a PDF parser,
* an OCR system,
* a database-backed SaaS product,
* a full Bauablauf/delay-claim engine,
* a real mobile app,
* a real camera or voice recording tool,
* a real notification system,
* a real email ingestion system.

Do not build backend infrastructure unless explicitly requested.

Do not build real file processing.

Do not build real AI API calls.

Do not build authentication.

Do not build multi-user functionality.

Do not build real camera access.

Do not build real voice recording.

Do not build real upload infrastructure.

Do not build real GPS or device metadata extraction.

## Product focus

Focus on technical/scope Nachträge first:

* additional or changed work,
* quantity deviations,
* simple Bestand discoveries,
* LV/OZ-linked deviations,
* evidence collection,
* pricing completeness,
* exportable Nachtragsakte.

Do not focus on complex Bauablauf/delay Nachträge in this first demo.

Bauablauf/delay claims can appear as a future module, but they should not drive the MVP architecture or UI complexity.

## Core UX logic

Every claim must clearly separate two dimensions:

### 1. Dem Grunde nach

The product should help the user understand and document:

* What was the original Bausoll?
* What changed in the Bau-Ist?
* What triggered the deviation?
* Was there an Anordnung, changed plan, unexpected condition, quantity deviation or other trigger?
* What evidence supports the claim basis?
* What notice or process risks may exist?

### 2. Der Höhe nach

The product should help the user understand and document:

* What quantity or Aufmaß supports the claimed amount?
* What pricing basis is used?
* Is the pricing based on LV unit prices, Urkalkulation, actual costs or a hybrid?
* Which cost categories are involved?
* What pricing evidence is missing?
* Is the calculation prüffähig and commercially defensible enough?

The UI should make this distinction obvious.

## Demo experience we want to create

The demo should let a potential user experience the following flow:

1. A site event happens.
2. A Bauleiter or Polier captures the event in a mobile-style demo screen.
3. The event is submitted and added to the project evidence graph.
4. The system simulates AI classification of the evidence.
5. The KBL or Nachtragsmanager receives a simulated notification.
6. The KBL opens or creates a specific Claim ID.
7. The KBL sees a clear claim overview.
8. The KBL understands the Bausoll/Bau-Ist deviation.
9. The KBL sees linked LV/OZ references.
10. The KBL reviews uploaded or linked evidence.
11. The KBL sees which evidence is complete and which evidence is missing.
12. The KBL reviews gap radar / readiness logic split into dem Grunde nach and der Höhe nach.
13. The KBL reviews a pricing evidence map.
14. The KBL previews an exportable Nachtragsakte.

The user should feel:

“This is how a real Nachtrag workflow could look if the tool connected Bausoll, Bau-Ist, evidence and pricing.”

## Demo workflow / user journey

The demo should show the future end-to-end workflow of the product.

Important: this is a high-fidelity clickable demo, not a functional production system.

Do not build real mobile capture, GPS extraction, voice transcription, email ingestion, AI classification, file processing, or backend infrastructure.

Instead, simulate these capabilities through polished screens, prefilled realistic data, and clickable demo interactions.

The goal is that potential users understand how the product would work if fully implemented.

The workflow has seven major stages:

1. Site event capture
2. Evidence graph
3. KBL notification and Claim ID creation
4. Bausoll/Bau-Ist deviation builder
5. Gap radar and evidence requests
6. Pricing evidence map
7. Nachtragsakte export preview

## Stage 1: Site event capture

The workflow starts when something happens on site.

The demo should show a mobile-style capture screen for a Bauleiter or Polier.

The site user captures:

* project,
* location or Bauteil,
* photo of the site event,
* short voice memo or text note,
* date and time,
* responsible person,
* suspected category, for example additional work, changed work, quantity deviation, Bestand issue or unclear.

The UI should imply that project metadata, timestamp and location context are automatically attached.

The user-facing story:

A Bauleiter sees a deviation on site, takes a photo, adds a short voice memo, and submits the event in under one minute.

### Simulated mobile photo capture

Final product vision:

A Bauleiter or Polier takes a real photo on site.

MVP demo behavior:

Show a mobile-style screen with a preloaded demo photo.

The user can click a button such as:

“Foto aufnehmen”

After clicking, the screen should visually show that the demo photo has been captured.

No real camera access is needed.

### Simulated voice memo

Final product vision:

The Bauleiter records a short voice memo describing the site situation.

MVP demo behavior:

Show a microphone button or voice memo card.

The user can click:

“Sprachnotiz aufnehmen”

After clicking, show a fake recording state, a waveform or a short generated transcript.

Example transcript:

“Beim Aushub wurde unerwartet Fels angetroffen. Die Leistung ist im LV so nicht beschrieben. Bagger und Kolonne mussten umdisponiert werden.”

No real audio recording or speech-to-text is needed.

### Simulated automatic metadata

Final product vision:

The system attaches project, timestamp, location, responsible person and project context automatically.

MVP demo behavior:

Show prefilled metadata fields:

* Project ID,
* Claim ID or event ID,
* location / Bauteil,
* timestamp,
* captured by,
* suspected Nachtrag type.

No real GPS or device metadata is needed.

### Simulated site event submission

Final product vision:

The captured event is uploaded and linked to the project evidence system.

MVP demo behavior:

The user clicks:

“Ereignis einreichen”

Then show a transition such as:

“Ereignis wurde dem Projekt zugeordnet”

or:

“Nachweis wurde dem Evidence Graph hinzugefügt.”

The submitted demo photo, transcript and metadata should then appear as evidence cards in the evidence graph.

No real upload or backend is needed.

## Stage 2: Evidence graph

After capture, the event appears in the project evidence graph.

The evidence graph is the central product object.

The evidence graph should show all relevant artifacts linked to a Project ID and Claim ID.

Evidence should be grouped by its role in the Nachtrag logic:

* Bausoll evidence,
* Bau-Ist evidence,
* Trigger / Anordnung evidence,
* Chronology evidence,
* Aufmaß / quantity evidence,
* pricing evidence,
* communication evidence,
* open or missing evidence.

Each evidence item should have:

* artifact type,
* title,
* date,
* source,
* linked role,
* confidence or classification status,
* related Claim ID,
* whether it supports dem Grunde nach, der Höhe nach, or both.

The demo should show that the product is not just a file folder.

It is an evidence graph that connects project reality to claim logic.

### Simulated AI evidence classification

Final product vision:

AI classifies evidence by role in the Nachtrag logic.

MVP demo behavior:

After submit, show a short simulated processing state:

“AI analysiert Nachweis…”

Then assign labels to the demo artifacts, for example:

* Bau-Ist evidence,
* Trigger evidence,
* Chronology evidence,
* Pricing relevance,
* Supports dem Grunde nach,
* Supports der Höhe nach.

No real AI model or API call is needed.

## Stage 3: KBL notification and Claim ID creation

When the site event is captured, the KBL or Nachtragsmanager receives a notification.

The notification should say that a potentially Nachtrag-relevant deviation was detected.

The KBL can open the event and decide whether to create or link a Claim ID.

The claim should then appear in the Nachtragsregister.

The register should show:

* Claim ID,
* project,
* claim title,
* Nachtrag type,
* status,
* claimed amount,
* responsible person,
* evidence completeness,
* pricing completeness,
* next required action.

The demo should show that the product connects field capture with commercial claim preparation.

### Simulated KBL notification

Final product vision:

The KBL receives a notification when a potentially Nachtrag-relevant site event is captured.

MVP demo behavior:

Show a desktop notification, inbox card or alert:

“Neues potenziell nachtragsrelevantes Ereignis erkannt.”

The user can click it to open the Claim Workspace.

No real notification infrastructure is needed.

## Stage 4: Nachtragsregister

The demo should include a claim pipeline/register.

Show a claim pipeline/register with:

* Claim ID,
* title,
* project,
* Nachtrag type,
* status,
* claimed amount,
* completeness score,
* risk level,
* responsible person,
* next action.

This should feel like a better version of an Excel Nachtragsregister.

The register should show several claims in different statuses, but one highlighted demo claim should drive the main workflow.

Example statuses:

* Ereignis erfasst,
* in Prüfung,
* Nachweise offen,
* Kalkulation offen,
* bereit zur Einreichung,
* eingereicht,
* akzeptiert,
* gekürzt,
* abgelehnt.

## Stage 5: Claim Detail Workspace

The user opens a detailed workspace for one claim.

The Claim Detail Workspace should have tabs or sections:

* Überblick,
* Bausoll/Bau-Ist,
* Nachweise,
* Kalkulation,
* Risiken,
* Export.

The claim overview should immediately answer:

* What happened?
* Why is this potentially Nachtrag-relevant?
* What is the current status?
* What is the claimed amount?
* What is complete?
* What is still missing?

The page should show separate summary cards for:

* dem Grunde nach,
* der Höhe nach,
* Nachweise,
* Export readiness.

## Stage 6: Bausoll/Bau-Ist deviation builder

One of the main hero screens should be the Bausoll/Bau-Ist deviation builder.

This screen should visually explain:

* what was originally owed under the Bausoll,
* what is actually happening in the Bau-Ist,
* which LV/OZ position is affected,
* which plan, instruction or site condition triggered the deviation,
* why the difference may be Nachtrag-relevant.

The screen should be highly visual and easy to understand.

Possible layout:

* left column: Bausoll,
* right column: Bau-Ist,
* center: deviation explanation,
* bottom: linked evidence,
* side panel: claim logic dem Grunde nach.

The purpose of this screen is to help the KBL quickly understand the deviation.

The demo should make the before/after logic very clear.

## Stage 7: Evidence / Nachweise

Show a realistic evidence bundle:

* photos,
* LV excerpt,
* Aufmaß,
* Regiebericht,
* Bautagebuch entry,
* email or Anordnung,
* calculation sheet,
* material or subcontractor record.

The evidence does not need to be real uploaded files yet. It can be represented as realistic cards, rows or document previews.

Each evidence item should show:

* evidence type,
* date,
* source/person,
* linked claim logic,
* whether it supports dem Grunde nach, der Höhe nach, or both.

The user should understand that the product is building an evidence-backed Nachtragsakte, not just generating text.

## Stage 8: Gap radar and missing evidence checklist

The next screen should be a gap radar.

The gap radar shows how complete the Nachtrag is before submission.

The score should be framed as:

* Prüf-Readiness,
* evidence completeness,
* attackability,
* missing-proof risk.

Do not frame it as a guaranteed legal acceptance probability.

The gap radar must separate:

### Dem Grunde nach

Questions:

* Is the original Bausoll clear?
* Is the Bau-Ist deviation documented?
* Is there a clear trigger?
* Is there an Anordnung or equivalent instruction?
* Is the chronology clear?
* Are process or notice risks visible?

Examples of missing or weak evidence dem Grunde nach:

* missing explicit Anordnung,
* missing photo before execution,
* unclear trigger,
* unclear Bausoll reference,
* missing confirmation by AG,
* unclear causality,
* missing notice.

### Der Höhe nach

Questions:

* Is the quantity basis documented?
* Is the Aufmaß sufficient?
* Is the pricing route clear?
* Are cost rows backed by evidence?
* Is Urkalkulation, actual cost or unit-price logic documented?
* Are pricing assumptions attackable?

Examples of missing or weak evidence der Höhe nach:

* missing signed Aufmaß,
* missing pricing backup,
* missing Urkalkulation reference,
* missing material invoice,
* missing labour or equipment record,
* unclear quantity basis,
* missing subcontractor quote.

For every missing item, the KBL should be able to request evidence.

### Simulated evidence request

Final product vision:

The KBL can request missing evidence from the Bauleiter or another team member.

MVP demo behavior:

When the KBL clicks:

“Nachweis anfordern”

Show a prepared request message or modal.

Example:

“Bitte ergänze ein bestätigtes Aufmaß und ein Foto vor Ausführung für Claim NT-004.”

Then show a simulated sent state:

“Anfrage an Bauleiter gesendet.”

No real messaging functionality is needed.

## Stage 9: Pricing completeness and pricing evidence map

The pricing section should not only show a total claim amount.

It should show how the amount is built up and how each pricing row is evidenced.

Use a P&L-like table or calculation table.

Each row should include:

* cost category,
* description,
* quantity,
* unit,
* unit price or cost basis,
* amount,
* pricing route,
* linked evidence,
* evidence strength,
* open risk.

Cost categories may include:

* labour,
* material,
* equipment,
* subcontractor,
* BGK,
* AGK,
* Wagnis/Gewinn.

Each row should show whether it is sufficiently supported.

Example logic:

* Row: Additional excavation
* Quantity basis: Aufmaß A-17
* Price basis: LV/OZ 03.02.015 or Urkalkulation reference
* Evidence: photo, Aufmaß, Regiebericht, site memo
* Risk: AG confirmation missing

The purpose is to show that the product helps defend the Nachtrag der Höhe nach.

Every important number should be linked to evidence.

This should not pretend to calculate everything automatically.

It should show how the product would structure a defensible calculation.

## Stage 10: Nachtragsakte export preview

The final stage is a button:

“Nachtragsakte erstellen”

This opens an export preview.

The export preview should show a realistic Nachtragsakte structure:

* Deckblatt,
* Claim summary,
* project and Claim ID,
* Bausoll,
* Bau-Ist / Abweichung,
* trigger / Anordnung,
* chronology,
* Anspruchslogik dem Grunde nach,
* evidence bundle,
* quantity / Aufmaß section,
* pricing calculation der Höhe nach,
* risk and missing-proof section,
* Anlagenverzeichnis.

The export preview should include a readiness summary.

The readiness summary should show:

* dem Grunde nach completeness,
* der Höhe nach completeness,
* missing evidence,
* pricing risks,
* recommended next actions before submission.

This is the final “wow moment” of the demo.

The user should understand that the product turns scattered field events, project communication and pricing evidence into a prüffähige, commercially defensible Nachtragsakte.

### Simulated Nachtragsakte export

Final product vision:

The system generates an exportable Nachtragsakte.

MVP demo behavior:

Show a polished export preview in the browser.

It can include a button:

“Nachtragsakte erstellen”

After clicking, show a preview with the sections listed above.

No real PDF generation is needed in this MVP.

## Data approach

Use a synthetic but realistic case.

The synthetic case should be detailed enough to feel like a real construction scenario.

It should include:

* project name,
* contractor role,
* Project ID,
* Claim ID,
* technical Nachtrag type,
* LV/OZ reference,
* Bausoll description,
* Bau-Ist deviation,
* trigger / Anordnung context,
* evidence list,
* missing evidence list,
* pricing basis,
* claimed amount,
* status in the claim pipeline,
* responsible people,
* timestamps,
* simulated photo,
* simulated voice memo transcript.

Do not describe the data as “mock data” in the user-facing UI.

Use terms like:

* Beispielprojekt,
* Demo-Nachtrag,
* synthetischer Fall,
* Demonstrationsfall.

## Simulated vs real functionality summary

The following features should be simulated in the MVP:

| Final product feature    | MVP demo behavior                                                                 |
| ------------------------ | --------------------------------------------------------------------------------- |
| Camera capture           | Show mobile capture screen with preloaded demo photo                              |
| Voice memo               | Show voice memo button / waveform / transcript after click, but no real recording |
| Upload to evidence graph | On submit, visually move or add demo evidence card to graph                       |
| GPS / metadata           | Show prefilled project, location, timestamp, user                                 |
| AI classification        | Show “AI analysiert…” then assign evidence role labels                            |
| KBL notification         | Show simulated notification or inbox item                                         |
| Evidence request         | Show prepared request message, not real sending                                   |
| Nachtragsakte export     | Show export preview, not real PDF generation                                      |

## Required demo screens

Build a polished interface with these core screens:

1. Mobile-style site capture
2. Evidence graph
3. KBL notification / inbox or alert
4. Nachtragsregister
5. Claim Detail Workspace
6. Bausoll/Bau-Ist Deviation Builder
7. Evidence / Nachweise
8. Gap Radar / Missing Evidence Checklist
9. Pricing Completeness / Pricing Evidence Map
10. Export Preview

The strongest visual screens should be:

* Bausoll/Bau-Ist Deviation Builder,
* Gap Radar split into dem Grunde nach and der Höhe nach,
* Pricing Evidence Map,
* Nachtragsakte Export Preview.

## Technical rules

* Keep the app frontend-only.
* Keep the app easy to run locally.
* Prefer simple HTML, CSS and JavaScript unless there is a clear reason to add a framework.
* Preserve the current working prototype until the new demo screens work.
* Make small, reviewable changes.
* Do not add unnecessary complexity.
* Do not create backend services.
* Do not add real AI calls.
* Do not add real file upload processing.
* Do not over-engineer state management.
* Prioritize visual clarity and demo quality.
* Use scripted UI states for simulated interactions.
* Keep the interaction path understandable in a user interview.
* The demo should be usable without explanation, but also easy to narrate live.

## Interaction style

The demo should feel interactive and product-like.

Use simple scripted states such as:

* before photo capture,
* photo captured,
* voice memo captured,
* submitted,
* AI classification in progress,
* evidence graph updated,
* KBL notification shown,
* Claim ID created,
* gap radar updated,
* evidence request sent,
* export preview created.

The goal is not technical completeness.

The goal is to let potential users experience the workflow and react to whether this would solve a real Nachtragsmanagement problem.

## Design principles

* The demo should feel like serious B2B software, not a student presentation.
* Use German AECO terminology where appropriate.
* Make the workflow easy to explain in a user interview.
* Make the difference between dem Grunde nach and der Höhe nach highly visible.
* Make technical Nachträge the center of the first demo.
* Make the output feel commercially defensible.
* Avoid legal overclaiming.
* Avoid generic AI chatbot UX.
* Avoid anything that feels like a thin document generator.
* Show the workflow as if the system already works.
* Simulate advanced functionality instead of building it.
* Do not call synthetic data “mock data” in the UI.
* Make the product feel like a claims-first workflow layer, not a generic document folder.

## Acceptance criteria

The demo is successful if a potential user can look at it and understand:

* what problem the product solves,
* how a Nachtrag moves from deviation to Nachtragsakte,
* how a site event becomes structured evidence,
* how evidence is organized in an evidence graph,
* how Bausoll and Bau-Ist are compared,
* how missing evidence is identified,
* how missing evidence can be requested from the site team,
* how pricing defensibility der Höhe nach is supported,
* how each pricing row can be backed by evidence,
* what is missing before submission,
* what the final Nachtragsakte could look like.

The demo should be strong enough to support user interviews and design partner conversations.

The goal is not technical completeness.

The goal is learning from potential users.

## Claude Code working rules

Before making large edits, explain the implementation plan.

Prefer small, reviewable changes.

Do not rewrite the entire app unless necessary.

Preserve the existing working state until the new demo screens work.

After each meaningful implementation step, make sure the app still runs locally.

Do not introduce dependencies unless there is a clear benefit.

Do not overbuild.

Do not turn this into a production SaaS app.

Do not build features that are invisible in a user interview.

Optimize for demo clarity, user feedback, and speed of iteration.
