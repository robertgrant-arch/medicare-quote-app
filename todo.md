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
