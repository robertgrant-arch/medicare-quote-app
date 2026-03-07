# Medicare Quote Engine TODO

## Completed Features
- [x] Landing page with ZIP code hero search
- [x] Stats bar (24 plans, $0 premium, 6 carriers, 4.5★)
- [x] Carrier logo strip
- [x] Features grid section
- [x] Doctor network CTA section
- [x] Footer with links
- [x] Plans results page with 2-column grid
- [x] 24 mock MA plans for Jackson County MO (ZIP 64106)
- [x] Plan cards with carrier logo, plan name, star rating, premium, copays, Rx tiers, extra benefits
- [x] Filter sidebar (plan type, carrier, premium range, must-have benefits)
- [x] Quick filter tabs (All Plans, PPO, $0 Premium, HMO)
- [x] Sort by (Best Match, Premium, Star Rating, MOOP)
- [x] Expandable plan details (full copays, benefit details, plan info)
- [x] Enroll Now modal
- [x] Add Rx Drugs modal
- [x] Add Doctors modal
- [x] Favorites/save functionality with toast notifications
- [x] Mobile-responsive filter drawer
- [x] View mode toggle (grid/list)
- [x] Personalization banner when drugs/doctors added
- [x] Full-stack upgrade (web-db-user) for backend API routes

## AI Plan Compare Feature
- [x] AI Plan Compare page accessible from navigation
- [x] Plan selection dropdowns (current plan + new plan) grouped by carrier
- [x] tRPC compare router with Claude claude-sonnet-4-20250514 via Anthropic API
- [x] ANTHROPIC_API_KEY secret configuration and validation
- [x] Loading spinner while Claude is thinking (animated steps)
- [x] Markdown rendering of AI comparison output via Streamdown
- [x] Side-by-side summary cards and comparison table at top of results
- [x] Navigation bar link to AI Plan Compare page (highlighted in orange)
- [x] AI Compare button in Plans page results header
- [x] New Comparison reset button
- [x] Vitest for the compare endpoint and API key validation

## Plan Lookup Tool
- [x] Add "Plan Lookup" nav link to Header
- [x] Create /plan-lookup page route in App.tsx
- [x] tRPC pverify.lookup procedure (stubbed, 1.2s delay, mock response)
- [x] tRPC pverify.compare procedure (stubbed, returns structured comparison JSON)
- [x] Eligibility form: First Name, Last Name, DOB, Member ID, Payer dropdown, Consent checkbox
- [x] "pVerify Powered" badge with shield icon on the form
- [x] Mock current plan card with green checkmark header and two-column field grid
- [x] Potential plan dropdown with 3 mock MA plans
- [x] "Compare with AI" button (orange)
- [x] Loading spinner "Analyzing your plans..."
- [x] Side-by-side comparison table with color coding (green=better, red=worse)
- [x] AI Analysis summary card
- [x] Pros/Cons two-column layout for current vs potential plan
- [x] Estimated Annual Cost comparison with "You could save $X" callout
- [x] Recommendation box (orange border)
- [x] "Save This Comparison" and "Talk to an Agent" action buttons
- [x] Disclaimer at bottom
- [x] Mobile-responsive layout
- [x] Vitest for pverify router procedures (12 tests total, all passing)

## Plan Lookup Simplification (v3.1)
- [ ] Backend: accept only medicareId (remove firstName, lastName, dob, payerId)
- [ ] Backend: add PRIVACY comment block and null the ID after use
- [ ] Backend: confirm no DB storage of medicareId
- [ ] Frontend: remove firstName, lastName, dob, payerId state variables
- [ ] Frontend: single Medicare ID input (full-width, placeholder "e.g. 1EG4-TE5-MK72")
- [ ] Frontend: privacy note below input (shield icon + "Never stored · Purged after lookup")
- [ ] Frontend: clear medicareId field immediately after lookup completes
- [ ] Frontend: update subheading text
- [ ] Frontend: update disclaimer text
- [ ] Update vitest to match new single-field signature

## Inline Compare to My Current Plan (Plan Cards)
- [ ] InlineCompare component: checkbox "Compare to my current plan" on each plan card
- [ ] Only one card selectable at a time (Plans page state controls activeCompareId)
- [ ] Slide-down green-tinted panel with lock icon, Medicare ID input, consent checkbox
- [ ] Medicare ID auto-cleared from state immediately after pVerify response (privacy)
- [ ] Loading state: "Looking up your plan..." spinner
- [ ] Loading state: "Analyzing plans with AI..." spinner
- [ ] InlineCompareResult component: green checkmark banner "Comparison Complete" with X to close
- [ ] Side-by-side color-coded table (Premium, Deductible, MOOP, PCP, Specialist, Drugs)
- [ ] AI summary paragraph rendered inline
- [ ] Pros/cons two-column layout
- [ ] Estimated annual cost with orange savings callout
- [ ] Orange-bordered recommendation box
- [ ] Save Comparison and Talk to an Agent buttons
- [ ] Reuse existing pverify.lookup and pverify.compare tRPC routes
- [ ] Medicare ID never stored in DB or logs (privacy comment in component)
- [ ] Vitest updated for new inline compare flow

## AI Compare Performance Optimizations
- [x] Switch compareRouter to claude-3-5-haiku-20241022
- [x] Add streaming SSE endpoint at /api/compare-stream (Express route, not tRPC)
- [x] Shorten prompt to 3 sections: Quick Summary, Key Differences, Recommendation
- [x] AICompare.tsx: instant client-side comparison table (no API wait)
- [x] AICompare.tsx: streaming AI text with token-by-token rendering
- [x] AICompare.tsx: localStorage cache keyed by sorted plan IDs
- [x] AICompare.tsx: progressive loading UX (table instant, AI streams below)
- [x] AICompare.tsx: Refresh Analysis button for cached results
- [x] InlineCompare.tsx: same instant table + streaming optimizations (fixed schema mismatch + SSE parsing)
- [x] InlineCompare.tsx: localStorage cache with Refresh Analysis button
- [x] InlineCompare.tsx: Streamdown markdown rendering for AI analysis
- [x] Update vitest for streaming endpoint

## Header Navigation Dropdowns
- [x] Medicare Advantage dropdown (MA HMO, MA PPO, MA SNP, MA with Drug Coverage)
- [x] Medicare Supplement dropdown (Plan F, Plan G, Plan N, Compare Supplement Plans)
- [x] Part D Drug Plans dropdown (Compare Drug Plans, Formulary Search, Extra Help, Enrollment)
- [x] Resources dropdown (Medicare 101, Enrollment Periods, Star Ratings Guide, FAQ)
- [x] Outside-click dismissal via useEffect + mousedown listener
- [x] Escape key closes open dropdown
- [x] Chevron rotates 180deg when open
- [x] Green top border accent on dropdown panel
- [x] Mobile accordion sections with indent + left border

## Active Nav Highlighting
- [x] Map each nav dropdown to activeRoutes (path prefixes)
- [x] Medicare Advantage active on /plans and /medicare-advantage
- [x] Medicare Supplement active on /medicare-supplement and /medigap
- [x] Part D Drug Plans active on /part-d and /drug-plans
- [x] Resources active on /resources, /medicare-101, /faq
- [x] Bold font-weight + green color + green bg when active
- [x] Hover styles only apply when NOT active (no flicker)

## Deep-Content Pages for Nav & Footer Links
- [x] InfoPage shared layout component (breadcrumb, hero, content card, CTA)
- [x] /medicare-advantage/hmo-plans — MA HMO Plans (deep content)
- [x] /medicare-advantage/ppo-plans — MA PPO Plans (deep content)
- [x] /medicare-advantage/special-needs-plans — MA Special Needs Plans (deep content)
- [x] /medicare-advantage/drug-coverage — MA with Drug Coverage (deep content)
- [x] /medicare-supplement/plan-f — Medigap Plan F (deep content)
- [x] /medicare-supplement/plan-g — Medigap Plan G (deep content)
- [x] /medicare-supplement/plan-n — Medigap Plan N (deep content)
- [x] /medicare-supplement/compare — Compare Supplement Plans (deep content)
- [x] /part-d/compare — Compare Drug Plans (deep content)
- [x] /part-d/formulary-search — Drug Formulary Search (deep content)
- [x] /part-d/extra-help — Extra Help Programs (deep content)
- [x] /part-d/enrollment — Part D Enrollment (deep content)
- [x] /resources/medicare-101 — Medicare 101 (deep content)
- [x] /resources/enrollment-periods — Enrollment Periods (deep content)
- [x] /resources/star-ratings — Star Ratings Guide (deep content)
- [x] /resources/faq — FAQ (10 Q&As with accordion)
- [x] /about — About Us (deep content)
- [x] /agents — Licensed Agents (deep content)
- [x] /contact — Contact Us (deep content)
- [x] /privacy — Privacy Policy (deep content)
- [x] /dual-eligible — Dual Eligible / D-SNP (deep content)
- [x] Header NAV_DROPDOWNS hrefs updated to real routes
- [x] Home.tsx footer links updated to real routes with Link components
- [x] All 28 routes registered in App.tsx

## Medicare Guide Page
- [x] Create /resources/medicare-guide page with two-section accordion (Complete Medicare Guide + Extra Help)
- [x] Complete Medicare Guide section expanded by default, Extra Help collapsed by default
- [x] Both sections toggle independently (click to open/close each)
- [x] Add to Resources dropdown nav
- [x] Register route in App.tsx

## AI Compare 3-Plan Update
- [x] Update plan selector from 2 to 3 plans ("Select Three Plans to Compare")
- [x] Add third plan dropdown "ANOTHER PLAN YOU'RE CONSIDERING"
- [x] Update comparison table to 3 columns (Current Plan, New Plan 1, New Plan 2) — remove CHANGE column
- [x] Update plan summary cards to show 3 cards
- [x] Update localStorage cache key to use 3 sorted plan IDs
- [x] Update compare-stream endpoint to accept 3 plans and compare all three
- [x] Update AI prompt to compare all 3 plans (no better/worse column, AI handles analysis)

## Plan Recommender Page
- [x] Create /plan-recommender route and nav link (purple accent in header)
- [x] Section 1: General Health Profile (health status, chronic conditions, planned surgery)
- [x] Section 2: Expected Utilization (PCP, specialist, ER, urgent care visits/year)
- [x] Section 3: Prescription Drug Needs (Rx count, brand/specialty drugs, monthly spend)
- [x] Section 4: Benefits Priorities (dental, vision, hearing, transport, OTC, fitness)
- [x] Section 5: Provider & Plan Preferences (keep doctors, HMO vs PPO, what matters most)
- [x] Cost calculation engine: premium×12 + copay×visits + drug cost estimate per plan
- [x] Rank all 24 plans and show top 3 recommended with estimated annual cost breakdown
- [x] /api/recommend-stream SSE endpoint using Claude Haiku for personalized narrative
- [x] Results page: top-3 cards with cost breakdown, why recommended, AI narrative streaming
- [x] Match existing app styling (green header, card layouts, orange accents)

## Plan Recommender → AI Compare Integration
- [x] Add "Compare These 3 Plans with AI" button to Plan Recommender results
- [x] Button navigates to /ai-compare?plan1=ID&plan2=ID&plan3=ID with top 3 plan IDs
- [x] AI Compare page reads URL params on mount and pre-selects the three plans

## Save & Compare to My Current Plan Button
- [x] Add "Save & Compare to My Current Plan" button to each RankedPlanCard
- [x] Button navigates to /ai-compare?plan2=ID leaving plan1 empty for user to select

## CMS Real Medicare Data Integration
- [x] Download CMS CY2026 Landscape CSV and parse structure
- [x] Build /api/plans endpoint: ZIP→county via CMS Marketplace API, CSV lookup, Claude Haiku transform
- [x] Update Plans.tsx to fetch from /api/plans instead of MOCK_PLANS
- [x] Update Home.tsx to fetch from /api/plans for ZIP search
- [x] Update AICompare.tsx to fetch from /api/plans
- [x] Update PlanRecommender.tsx to fetch from /api/plans
- [x] Use Forge API (built-in LLM) instead of direct Anthropic API calls
- [x] Update compareStream.ts to use Forge API with OpenAI-compatible streaming
- [x] Update recommendStream.ts to use Forge API with OpenAI-compatible streaming
- [x] FilterSidebar: dynamic carriers from real plan data (not hardcoded)
- [x] Fix county name display to use Title Case
- [x] Verify end-to-end with real ZIP codes (24 plans for ZIP 64106 Jackson County, MO)

## Security & Code Quality Review
- [x] Add rate limiting (express-rate-limit) — 3 tiers by endpoint sensitivity
- [x] Add security headers (helmet) — X-Frame-Options, X-Content-Type-Options, etc.
- [x] Fix request body size limit — reduced from 50 MB to 1 MB
- [x] Move hardcoded CMS API key to env var with documented fallback
- [x] Fix compareRouter.ts to use Forge API instead of direct Anthropic API
- [x] Add AbortSignal.timeout(120s) to compareStream.ts and recommendStream.ts
- [x] Add ZIP cache eviction guard (ZIP_CACHE_MAX = 5000)
- [x] Set Express trust proxy = 1 for accurate IP detection behind gateway
- [x] Write SECURITY_REVIEW.md documenting all findings and fixes
- [x] All 13 tests passing, zero TypeScript errors

## Claude claude-3-5-sonnet Code Review
- [x] Send all 12 specified files to Claude claude-3-5-sonnet-20241022 via API
- [x] C1: Extract hardcoded CMS API key to named constant (CMS_PUBLIC_KEY)
- [x] C2: Implement LRU eviction semantics on zipCache (delete + re-insert on hit)
- [x] C3: Add doneSent flag to prevent duplicate SSE done events (compareStream + recommendStream)
- [x] C4: Add console.warn for malformed JSON lines in SSE stream (compareStream + recommendStream)
- [x] C5: Rewrite compareRouter.ts to use Forge API (was calling broken Anthropic direct API)
- [x] C6: Replace double Map.has+get lookup with single Map.get in CSV index builder
- [x] H1: Extract findPlansByCounty() helper function from inline route handler logic
- [x] H2: Convert QUICK_FILTERS to useMemo with dynamic counts from loaded plans
- [x] H3: Memoize availableCarriers with useMemo in Plans.tsx
- [x] H4: Remove cachedResult from handleCompare useCallback deps — call loadCache() directly
- [x] H5: Move inline <style> tag from AICompare.tsx render to index.css
- [x] H6: Add Zod .max() input length constraints on compareRouter.ts plan schema
- [x] H7: Add AbortSignal.timeout(120s) to Forge API fetch in streaming endpoints
- [x] M4: Export FilterSidebarProps interface from FilterSidebar.tsx
- [x] Write CLAUDE_CODE_REVIEW.md with full findings (38 issues, 26 fixed)
- [x] All 13 tests passing, zero TypeScript errors after all fixes

## Full UI/UX Redesign — Chapter Medicare Style (Red/White/Blue)
- [x] Global CSS: Navy (#1B365D), Red (#C41E3A), Light blue (#E8F0FE) color palette
- [x] Google Fonts: Inter or DM Sans loaded in index.html
- [x] Header: white sticky nav, navy text, red CTA button, clean minimal layout
- [x] Home hero: split layout (text left, image right), white/light bg, red highlight word
- [x] Home stats: light blue card grid, navy numbers, hover animations
- [x] Home feature cards: white cards, 32px padding, 16px radius, colored icon circles
- [x] Home carrier logos: clean horizontal row on white (no colored buttons)
- [x] Home trust section: badges, security icons, social proof
- [x] Plan cards: white rounded cards, red badges, navy headers, gold stars
- [x] FilterSidebar: navy/red accent, updated checkboxes and sliders
- [x] AICompare page: navy/red palette
- [x] PlanRecommender page: navy/red palette
- [x] PlanLookup page: navy/red palette
- [x] Footer: navy background, white text, red hover links
- [x] InfoPage: navy/red palette
- [x] CarrierLogo: navy/red palette
- [x] Scroll animations: fade-in-up on sections
- [x] Buttons: 8px radius, red primary, navy outline secondary
- [x] Inputs: rounded, blue focus glow
- [x] Consistent 80-100px section padding throughout
- [x] Fix duplicate location display (ZIP + county, not county twice)

## Plan Loading Overhaul (Re-applied after sandbox reset — v2)
- [x] Pre-process CMS CSV into 51 per-state JSON files (116,065 plans)
- [x] Upload all 51 state files to CDN (new URLs after sandbox reset)
- [x] Rewrite plansRouter.ts to use CDN JSON files (no CSV parsing, no LLM)
- [x] Add server-side in-memory LRU cache per state (STATE_CACHE_MAX=20)
- [x] Add ZIP cache with LRU eviction (ZIP_CACHE_MAX=5000)
- [x] Pre-warm 10 common states on server startup (MO, KS, FL, TX, CA, NY, OH, PA, IL, GA)
- [x] Fix toTitleCase (lowercase first, then title case)
- [x] ZIP 64086 → 30 plans, Jackson County, MO ✓ (13ms)
- [x] ZIP 64106 → 30 plans, Jackson County, MO ✓ (601ms first load, instant after)
- [x] ZIP 10001 → 30 plans, New York County, NY ✓ (138ms)
- [x] ZIP 33101 → 30 plans, Miami-Dade County, FL ✓ (160ms)
- [x] ZIP 90210 → 30 plans, Los Angeles County, CA ✓ (147ms)
- [x] All 13 tests passing

## Feature: pVerify Eligibility Verification
- [ ] Add PVERIFY_API_KEY, PVERIFY_CLIENT_ID, PVERIFY_CLIENT_SECRET env vars
- [ ] Create server/pverifyRouter.ts with POST /api/pverify/eligibility
- [ ] pVerify auth: POST https://api.pverify.com/Token with client_id + client_secret
- [ ] pVerify eligibility call with MBI or Enhanced MBI Lookup (name + DOB)
- [ ] Return: coverage status, Part A/B dates, current MA plan, copays, deductibles, MOOP
- [ ] Create client/src/pages/VerifyCoverage.tsx with form + results card
- [ ] Add "Verify Coverage" nav link in Header.tsx
- [ ] Register route in App.tsx

## Feature: Health Profile Plan Recommender
- [ ] Create server/recommendRouter.ts with POST /api/recommend
- [ ] Fetch plans for ZIP using existing plan loading logic
- [ ] Use Forge API (Claude) to score/rank plans against health profile
- [ ] Return top 5 plans with match score and personalized reasons
- [ ] Create client/src/pages/FindBestPlan.tsx with 5-step wizard
- [ ] Step 1: ZIP, age, gender
- [ ] Step 2: Health conditions checkboxes
- [ ] Step 3: Medications text input
- [ ] Step 4: Care preferences
- [ ] Step 5: Current coverage
- [ ] Results: ranked plan cards with match score, reasons, estimated annual cost
- [ ] Add "Find Your Best Plan" nav link in Header.tsx
- [ ] Register route in App.tsx

## pVerify MBI Modal in ZIP Search Flow
- [x] MBIVerifyModal component: optional Medicare Beneficiary ID entry before plan results
- [x] Modal appears after ZIP validation but before navigating to /plans
- [x] Privacy messaging: "Immediately purged from our database" with shield icon
- [x] Skip button (prominent) and Verify & Continue button
- [x] Calls trpc.pverify.lookup with MBI via tRPC mutation
- [x] On success: stores eligibility data in sessionStorage and navigates to /plans
- [x] On skip: navigates directly to /plans without eligibility data
- [x] Popular ZIP buttons also go through the MBI modal flow
- [x] Plans.tsx reads eligibility from sessionStorage on mount
- [x] Current plan banner in Plans.tsx when eligibility data is available
- [x] Comparison badges on plan cards: "Save $X/mo vs current" or "Lower max OOP"
- [x] TrendingDown icon imported and used in comparison badges

## Health Profile Recommendation Engine (Find Best Plan)
- [x] healthProfileRouter.ts: tRPC mutation with 20-question health profile schema
- [x] Rule-based scoring engine: 15+ scoring dimensions (premium, OOP, copays, benefits, star rating)
- [x] AI narrative via invokeLLM: personalized 3-section recommendation (profile summary, why selected, top pick)
- [x] Graceful degradation: AI narrative returns empty string on LLM failure
- [x] FindBestPlan.tsx: 5-step wizard with ZIP entry, health profile questions, results
- [x] Step indicators with icons and progress tracking
- [x] Ranked results cards: match score %, match reasons, watch-outs, estimated annual cost
- [x] AI Advisor Analysis section rendered via Streamdown
- [x] /find-best-plan route registered in App.tsx
- [x] "Find Best Plan" nav link in Header (desktop + mobile, red accent)
- [x] 10 vitest tests for healthProfile.recommend (all passing)
- [x] TypeScript clean (0 errors)

## Navigation Restructure
- [x] Replace 4 content dropdowns + 5 standalone tool links with 2 dropdowns
- [x] "Medicare Information" dropdown: Medicare Advantage, Medicare Supplement, Medicare Part D, Resources & Guides
- [x] "Plan Tools" dropdown: AI Plan Compare, AI Plan Recommender, Verify Current Coverage, Find Best Plan
- [x] Each dropdown item includes a short description subtitle
- [x] Dropdown panels use accent color top border and hover highlight matching their category
- [x] Desktop nav: BookOpen icon for Medicare Information, Sparkles icon for Plan Tools
- [x] Mobile accordion: same 2 sections with icons, description subtitles, and divider rows
- [x] Mobile CTA row: Sign In + Talk to an Agent (updated label from "Call an Agent")
- [x] Zero TypeScript errors, dev server running cleanly

## Bug Fixes
- [x] Remove MAX_PLANS=30 cap in plansRouter.ts — now returns all available plans (56 for ZIP 64106)

## Extra Help / LIS Integration
- [ ] Add "Skip to View All Plans" button at top of Health Status section in FindBestPlan
- [ ] Add Extra Help question with 4 radio options to Health Status section
- [ ] Add helper text below Extra Help question
- [ ] Pass extraHelp value through to Plans page via URL param
- [ ] Filter plans based on Extra Help selection (No = filter LIS-only plans)
- [ ] Show banner on Plans page when "Not Sure" is selected
- [ ] Show all plans when "Skip" or "Yes" is selected
- [ ] Generate Episode Alert API Integration Guide PDF
- [ ] Upload PDF to CDN and add download link to app footer

## Extra Help / LIS Integration (March 2026)
- [x] Add "Skip to View All Plans" button at top of Health Status step in FindBestPlan wizard
- [x] Add Extra Help (LIS) question to Health Status step with 4 options: Full, Partial, No, Not Sure
- [x] Add helper text below Extra Help question explaining the program
- [x] Pass extraHelp param through to Plans page URL from FindBestPlan wizard
- [x] Implement D-SNP filtering in Plans.tsx when extraHelp=no
- [x] Show "Not Sure" informational banner in Plans.tsx when extraHelp=not-sure
- [x] Show all plans when extraHelp=full, partial, or skip
- [x] Generate Episode Alert API Integration Guide PDF (392KB)
- [x] Upload PDF to CDN
- [x] Add PDF download link to Home.tsx footer under "Technical Resources" section
