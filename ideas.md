# Medicare Advantage Quote Engine — Design Brainstorm

<response>
<idea>
**Design Movement**: Clinical Modernism — Inspired by healthcare UX leaders like Oscar Health and Devoted Health. Clean, trustworthy, data-forward.

**Core Principles**:
1. Trust through clarity — every element earns its place, no clutter
2. Hierarchy through scale — plan cards use size and weight to guide the eye
3. Brand authority — dark forest green (#006B3F) anchors the interface
4. Action-forward — orange (#F47920) CTAs are impossible to miss

**Color Philosophy**:
- Primary: #006B3F (dark forest green) — evokes health, trust, stability
- CTA: #F47920 (warm orange) — urgency, action, warmth against green
- Background: #F8FAF9 (near-white with green tint) — clean, medical
- Cards: pure white with subtle green-tinted borders
- Muted text: #6B7280

**Layout Paradigm**:
- Landing page: Left-aligned asymmetric hero with large ZIP input block on the right
- Results page: Fixed left filter sidebar (280px) + scrollable right plan grid
- Plan cards: 2-column grid, generous padding, clear benefit chips

**Signature Elements**:
1. Green top nav bar with white logo text and subtle shadow
2. Star ratings rendered as filled/half/empty SVG stars in amber
3. Benefit chips: small pill badges (Dental, Vision, OTC, Rx) in green/teal tones

**Interaction Philosophy**:
- Hover on plan cards lifts with shadow + border highlight
- Filter changes animate plan count with fade transitions
- Expandable "See more details" accordion with smooth height animation

**Animation**:
- Page load: cards stagger-fade in from below (50ms delay each)
- Filter apply: cards fade out/in with 150ms transition
- Modal open: scale-up from center with backdrop blur
- Favorite toggle: heart icon scale bounce + color fill

**Typography System**:
- Display: "Merriweather" (serif) — for hero headline, conveys authority
- Body/UI: "Inter" — clean, readable for plan details and data
- Hierarchy: 36px hero → 20px card titles → 14px benefit text → 12px fine print
</idea>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement**: Bold Civic Design — Inspired by government health portals reimagined with modern SaaS aesthetics (HealthSherpa, GetCoveredNJ)

**Core Principles**:
1. Accessibility first — WCAG AA contrast everywhere
2. Data density with breathing room — pack info without overwhelm
3. Color as navigation — green = primary actions, orange = CTAs, gray = secondary
4. Progressive disclosure — show key info first, details on demand

**Color Philosophy**:
- Primary: #006B3F — authoritative green
- CTA: #F47920 — high-contrast orange
- Surface: #FFFFFF cards on #EEF2EF background
- Accent: #E8F5EE (light green tint) for selected/active states
- Warning/highlight: #FFF3E0 (light orange) for featured plans

**Layout Paradigm**:
- Horizontal filter bar pinned below nav (not sidebar)
- Quick filter tabs as pill buttons above the grid
- 2-column plan card grid with sticky comparison bar at bottom

**Signature Elements**:
1. "Best Match" ribbon on top plans
2. Horizontal benefit bar showing coverage icons in a row
3. Premium price displayed in large bold type with "$0/mo" in green

**Interaction Philosophy**:
- Sticky comparison tray that fills as users favorite plans
- Inline Rx drug search within plan cards
- Doctor network check with green checkmark/red X per plan

**Animation**:
- Filter tabs: sliding underline indicator
- Card grid: masonry-style reflow on filter change
- Comparison tray: slides up from bottom

**Typography System**:
- Headlines: "DM Serif Display" — editorial authority
- UI: "DM Sans" — geometric, modern, pairs perfectly
- Numbers: tabular figures for price alignment
</idea>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement**: Warm Institutional — Blending the trustworthiness of traditional insurance brands with the warmth of consumer health apps

**Core Principles**:
1. Human-centered — photos, warm tones, approachable language
2. Structured clarity — tables and cards with clear visual hierarchy
3. Green as health — pervasive but not overwhelming
4. Orange as energy — used sparingly for maximum impact

**Color Philosophy**:
- Primary: #006B3F
- CTA: #F47920
- Background: #FAFAFA
- Card hover: #F0F9F4 (very light green)
- Section dividers: 1px #E5E7EB

**Layout Paradigm**:
- Landing: Full-width hero with centered search, statistics row below
- Results: Top filter bar + 2-col grid, no sidebar (more horizontal space for cards)
- Cards: Carrier logo top-left, star rating top-right, benefits in icon grid

**Signature Elements**:
1. Carrier logo displayed prominently with colored brand border
2. "Most Popular" and "$0 Premium" badges on qualifying plans
3. Benefit grid: 2x3 icon grid showing coverage at a glance

**Interaction Philosophy**:
- One-click quick filters (All/PPO/$0/HMO) as pill tabs
- Expandable plan details with smooth accordion
- Add Rx / Add Doctors as prominent secondary actions

**Animation**:
- Hero search box: subtle pulse on load
- Plan cards: fade-in stagger
- Filter transitions: smooth reflow

**Typography System**:
- Headlines: "Playfair Display" — classic, trustworthy
- Body: "Source Sans Pro" — highly readable for dense data
</idea>
<probability>0.06</probability>
</response>

## Selected Approach

**Chosen: Bold Civic Design (Response 2)** — This approach best matches eHealth's Medicare quote tool aesthetic with its horizontal filter bar, quick filter tabs, data-dense plan cards, and strong brand colors. The DM Serif Display + DM Sans pairing gives authority without stuffiness, and the layout maximizes horizontal space for the 2-column plan grid.
