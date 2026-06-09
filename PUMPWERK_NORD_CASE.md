# Pumpwerk Nord N01 - Synthetic Demo Case

## Purpose

This is the canonical synthetic demo case for the Nachweis MVP.

The case is used to demonstrate a high-fidelity, clickable Nachtragsakte workflow for user interviews and design partner conversations.

The purpose is not to process real documents yet. The purpose is to show how the product would behave if it connected site capture, evidence graph, Bausoll/Bau-Ist deviation logic, missing evidence, pricing evidence and Nachtragsakte export.

## Case overview

Project: BV Pumpwerk Nord  
Claim ID: N01  
Claim title: Entfernen unerwarteter Stahlbetonfundamentrest  
Contractor: Keller & Sohn Tiefbau GmbH  
Client: Stadtwerke Falkenried GmbH  
Site supervision: Ingenieurbüro Hartmann & Partner  
Contract type: VOB/B Einheitspreisvertrag  
Claim type: Technical Nachtrag  
Claim amount: 4,973.70 EUR net  

## Core case story

The contractor was supposed to perform normal excavation works for a municipal pump station.

The relevant LV position describes excavation under normal expected soil conditions.

During excavation, the site team encounters an unexpected reinforced concrete foundation remnant in the excavation pit.

The site team exposes it, breaks it up, loads it, transports it and disposes of the concrete rubble.

The commercial question is not simply whether a Nachtrag can be written.

The KBL or Nachtragsmanager must decide whether the claim is plausible dem Grunde nach, whether the amount is defensible der Höhe nach, and which proof gaps must be closed before submission.

## Bausoll

OZ 01.02.0030 - Baugrubenaushub Pumpwerk  
Quantity: 450.000 m³  
Unit price: 42.80 EUR/m³  
Scope: normal excavation up to 1.20 m below existing ground level  
Expected condition: Homogenbereich B1/B2, natural soil  
Included work: loosen soil, load, stockpile or load for transport  
Not explicitly described: reinforced concrete obstruction removal, breaking, separate transport, concrete rubble disposal  

## Bau-Ist

Unexpected reinforced concrete foundation remnant found during excavation.

Location: axis B-C / inlet pipe area  
Dimensions: 3.20 m x 1.40 m x 0.75 m  
Volume: approx. 3.36 m³  
Weight: approx. 8.1 t  
Required work: expose, secure, break up, load, transport and dispose  
Equipment: 22t excavator, hydraulic breaker, wheel loader and truck  
Additional requirement: separate concrete rubble disposal  

## Core delta

Original Bausoll: normal excavation under OZ 01.02.0030.

Actual Bau-Ist: reinforced concrete obstruction had to be exposed, broken up, loaded, transported and disposed of.

Commercial implication: plausible technical Nachtrag, but not submission-ready because evidence gaps remain.

## Correct readiness conclusion

The correct professional conclusion for the demo is:

Plausible technical Nachtrag, but needs more evidence before submission.

Do not frame the product as guaranteeing acceptance.

Use terms such as:
- Prüf-Readiness
- evidence completeness
- attackability
- missing-proof risk

Do not use:
- guaranteed acceptance probability
- legal certainty
- automatic legal decision

## Synthetic artifacts

A01 Project Brief  
Role: context  
Supports: project, parties, role and scenario  

A02 LV Excerpt  
Role: Bausoll  
Supports: OZ 01.02.0030, normal excavation scope, quantity and unit price  
Weakness: concrete obstruction not explicitly excluded  

A03 Baugrund / Bestand Excerpt  
Role: Bausoll uncertainty  
Supports: no known foundation shown in available documents  
Weakness: absence of obstruction is not airtight proof  

A04 Urkalkulation / EFB Excerpt  
Role: pricing baseline  
Supports: cost structure and surcharge basis  
Weakness: only partially supports Zuschlag logic  

A05 Bautagebuch Entry  
Role: chronology / Bau-Ist  
Supports: event date, location, BÜ awareness  
Weakness: causality and instruction wording thin  

A06 Photo Set  
Role: Bau-Ist evidence  
Supports: obstruction, equipment, concrete rubble, transport  
Weakness: weak location/provenance metadata  

A07 Email / Protocol Chain  
Role: trigger evidence  
Supports: BÜ said "document and continue"  
Weakness: no clean formal written Anordnung  

A08 Mehrkostenhinweis Draft  
Role: notice / process  
Supports: potential notice exists  
Weakness: timing and status unclear  

A09 Regiebericht  
Role: effort evidence  
Supports: labour and equipment hours  
Weakness: not countersigned by AG/BÜ  

A10 Aufmaß Sheet  
Role: quantity proof  
Supports: dimensions, volume and tonnage  
Weakness: not AG-confirmed and location reference incomplete  

A11 Disposal Invoice / Wiegeschein  
Role: cost proof  
Supports: 8.1 t and disposal cost  
Weakness: not explicitly linked to Claim N01  

A12 Nachtragskalkulation  
Role: pricing  
Supports: pricing rows and 4,973.70 EUR net total  
Weakness: some rows plausible but not fully confirmed  

A13 Draft Nachtragsangebot  
Role: before output  
Supports: current generic manual claim draft  
Weakness: too generic and not prüffähig enough  

A14 Generated Nachtragsakte Preview  
Role: after output  
Supports: structured MVP-style output  
Weakness: still not final submission because gaps remain  

A15 AG Objection / Prüfer Note  
Role: opponent view  
Supports: likely review objections  
Weakness: only shown after participant decision to avoid anchoring  

## Key gaps

G01 No clean formal written Anordnung  
Severity: high  
Dimension: dem Grunde nach  

G02 Mehrkostenhinweis timing/status unclear  
Severity: high  
Dimension: dem Grunde nach  

G03 LV does not explicitly exclude concrete obstruction  
Severity: medium  
Dimension: dem Grunde nach  

G04 Obstruction absence not conclusively proven  
Severity: medium  
Dimension: dem Grunde nach  

G05 Photos have weak location metadata  
Severity: medium  
Dimension: dem Grunde nach  

G06 Bautagebuch causality wording thin  
Severity: low/medium  
Dimension: dem Grunde nach  

G07 Regiebericht not countersigned  
Severity: high  
Dimension: der Höhe nach  

G08 Aufmaß not AG-confirmed  
Severity: high  
Dimension: der Höhe nach  

G09 Aufmaß location reference incomplete  
Severity: medium  
Dimension: der Höhe nach  

G10 Disposal invoice not explicitly linked to N01  
Severity: medium  
Dimension: der Höhe nach  

G11 Zuschläge only partially linked to EFB  
Severity: medium/high  
Dimension: der Höhe nach  

G12 Draft Nachtragsangebot too generic  
Severity: medium  
Dimension: both  

## Pricing rows

P01 Freilegen / Sichern, Kolonne  
Quantity: 6.0 h  
Rate: 68.00 EUR/h  
Amount: 408.00 EUR  
Evidence: A09  
Risk: yellow  

P02 22t Bagger mit Hydraulikhammer  
Quantity: 5.5 h  
Rate: 215.00 EUR/h  
Amount: 1,182.50 EUR  
Evidence: A09 / A04  
Risk: yellow  

P03 Radlader / Ladegerät  
Quantity: 2.0 h  
Rate: 115.00 EUR/h  
Amount: 230.00 EUR  
Evidence: A09  
Risk: yellow  

P04 Laden und Abtransport Betonbruch  
Quantity: 8.1 t  
Rate: 58.00 EUR/t  
Amount: 469.80 EUR  
Evidence: A10 / A11  
Risk: yellow  

P05 Entsorgung Betonbruch  
Quantity: 8.1 t  
Rate: 165.00 EUR/t  
Amount: 1,336.50 EUR  
Evidence: A11  
Risk: yellow  

P06 Nebenarbeiten psch  
Quantity: 1.0  
Rate: 450.00 EUR  
Amount: 450.00 EUR  
Evidence: weak  
Risk: red  

P08 BGK / AGK / W+G Zuschlag  
Quantity: 22%  
Rate: on EKT  
Amount: 896.90 EUR  
Evidence: A04 / A12  
Risk: yellow  

Total: 4,973.70 EUR net

## Simulated site event

Captured by: Bauleiter  
Event: unexpected reinforced concrete foundation remnant found during excavation  
Voice memo transcript:

"Beim Aushub wurde unerwartet ein Stahlbetonfundamentrest angetroffen. Die Leistung ist im LV so nicht beschrieben. Wir mussten den Bereich freilegen, mit dem Hydraulikhammer zerkleinern, laden, abfahren und separat entsorgen."

## Demo hypotheses

H1 Bausoll/Bau-Ist clarity:
Users should correctly identify the delta between normal excavation and reinforced concrete obstruction removal.

H2 Missing evidence:
Users should agree that at least four flagged gaps are materially relevant before submission.

H3 Pricing defensibility:
Users should identify at least two attackable pricing rows or assumptions der Höhe nach.

H4 Nachtragsakte output:
Users should rate the structured Akte as materially better than the generic draft.

## Required product moments

1. Mobile-style site capture
2. Evidence graph
3. KBL notification
4. Nachtragsregister
5. Claim workspace
6. Bausoll/Bau-Ist deviation builder
7. Missing evidence radar
8. Pricing evidence map
9. Nachtragsakte preview
