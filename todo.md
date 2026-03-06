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
