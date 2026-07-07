# Design Brief: Family Vacation Travel Planner

## What this is

A flight-deal-finding web app for families planning a vacation. One shared
trip (origin, destination, date range) feeds seven tools, each answering a
specific question a budget-minded traveler asks when shopping for flights.
A working functional version already exists (Node/Express + plain HTML/JS);
this brief is for redesigning the UI/UX, not the underlying logic.

## Target users

Parents/guardians planning a family trip who are price-sensitive and willing
to do some legwork to save money — comparing airports, carriers, and sites
rather than booking the first result. Likely on a laptop while planning, may
check price alerts from a phone later. Not frequent-flyer road warriors —
assume limited familiarity with travel-hacking jargon (explain terms like
"self-transfer" or "error fare" inline rather than assuming knowledge).

## Tone

Practical and reassuring, not hype-y. This is a money-saving tool, not a
gamified deal-chasing app — avoid countdown-timer urgency/dark-pattern
framing even where the underlying feature (e.g. flash deals) is time-limited.
Confident but plain language; light travel/vacation warmth is welcome
(family, plans, dates) without being twee.

## Overall structure

- **Persistent trip bar** at the top: origin airport, destination airport,
  depart date, return/range-end date. Shared across all seven tools below —
  changing it should visibly affect every tab's results, so it needs to read
  as "one control panel for everything," not a per-tab setting.
- **Seven tool tabs**, in this order (matches priority of a typical search):
  1. Cheapest Flights
  2. Hidden Carriers
  3. Layover Savings
  4. Error Fares & Deals
  5. Compare Sites
  6. Price Alerts
  7. Combo Optimizer
- Each tab is a self-contained screen: one-line explanation of what it does,
  a primary action button, and a results list/table below.

## Screens

### 1. Cheapest Flights
**Question it answers:** "What's the cheapest way to fly this route?"
**Controls:** toggle "include nearby airports," toggle "one-way only,"
primary "Search" button.
**Results:** ranked list of itineraries — origin/destination city+code,
date, carrier, trip type, price. Top (cheapest) result should read as
visually distinct ("best" state). Carriers that are book-direct-only get a
small "book direct" badge inline.
**Empty/error states:** no fares for that route/date range; unrecognized
airport code.

### 2. Hidden Carriers
**Question it answers:** "Am I missing a cheaper airline because it's not
on Kayak/Expedia?"
**Controls:** single "Check carriers" action (uses trip bar's origin/dest
only, no dates needed).
**Results:** two grouped lists — "Not reliably on major booking sites, book
direct" vs. "Also on major sites" — each carrier with a one-line note on why
(e.g., "Never distributes through OTAs or GDS").
**Design note:** the whole point of this screen is surfacing carriers a
user would otherwise never see — the "hidden" group should be the visual
focus, not an afterthought below the familiar-names list.

### 3. Layover Savings
**Question it answers:** "Would routing through a different city save
money?"
**Controls:** single "Find layover savings" action (uses depart date).
**Results:** the nonstop reference price shown up top for comparison, then
5 candidate hub cities ranked by estimated savings vs. that nonstop price,
each showing the two leg prices that sum to the combo total. Savings should
be signed (some hubs may cost more, not less) — make the losing cases
legible, not hidden.
**Design note:** include a persistent caveat about these being
separately-ticketed self-transfer itineraries (own risk on missed
connections/rechecking bags) — this is a real practical warning, not
boilerplate, so it shouldn't be buried in tiny print.

### 4. Error Fares & Deals
**Question it answers:** "Is there a deal or mistake fare from my home
airport right now?"
**Controls:** single "Scan for deals" action (uses origin only).
**Results:** a feed of deals, each with destination, date, source
attribution (e.g. "Secret Flying," "Airline flash sale"), a
classification tag ("possible error fare" vs. "flash deal"), percent off,
and a countdown-style "expires in ~Xh." Error-fare items carry an extra
caution note (airlines can cancel these; book cautiously).
**Design note:** distinguish error fares from ordinary flash deals visually
(they carry real risk and shouldn't look like an ordinary sale) — but avoid
manufactured urgency; the countdown is informational, not a pressure tactic.

### 5. Compare Sites
**Question it answers:** "Which shopping site actually has the lowest price
for this exact itinerary?"
**Controls:** single "Compare sites" action (uses depart date).
**Results:** a simple comparison table — Google Flights, Hopper,
Skyscanner, Airline direct — one row per site, cheapest row highlighted with
a clear winner marker. Include the price spread ("range across sites: $X")
as a supporting stat.
**Design note:** this should be scannable in under 2 seconds — a table,
not cards, since it's a like-for-like price comparison.

### 6. Price Alerts
**Question it answers:** "Tell me when this route drops below my price."
**Controls:** a dollar-threshold input, "Create 3-day alert" button.
**Results:** list of active/past alerts, each showing route, target price,
day count (e.g. "Day 2/3"), status (watching / triggered / expired), and a
per-day price history. Each "watching" alert has a manual "simulate next
day" action (stand-in for a real daily background check).
**Design note:** status should be glanceable via color/badge — watching
(neutral), triggered (positive/success), expired (muted, not an error).

### 7. Combo Optimizer
**Question it answers:** "Should I book a round trip, or two one-ways?"
**Controls:** single "Optimize combo" action (uses both depart and return
dates).
**Results:** three ranked options — round-trip (single carrier), two
one-ways (same carrier), mixed one-ways (best carrier each direction) —
each with total price and carrier(s) used. Recommended (cheapest) option
visually first/highlighted. A closing line stating the max savings between
best and worst option.

## Shared UI patterns to carry across all seven screens

- **Best/recommended item** gets consistent visual treatment (border,
  color, or badge) wherever a screen has a clear "winner" — flights,
  layover hubs, comparison rows, alert status, combo options.
- **Loading, empty, and error states** for every action — none of these
  screens should ever show a blank white box.
- **Prices** are the dominant visual element in any list item — largest/
  boldest text in each row.
- **Explanatory captions** — every screen opens with a one-sentence plain-
  language description of what it does before any controls, so a user
  landing on a tab cold understands it immediately.

## Explicit non-goals for this pass

- No booking/checkout flow — this tool finds and compares fares; it does
  not sell tickets.
- No user accounts/auth in this brief — assume a single anonymous session.
- No mobile-specific screens required, but layout should not assume a wide
  desktop-only viewport (the trip bar and tabs currently wrap on narrow
  widths).
