# Getlate's Solution/Platform Page Strategy

## Overview
Each platform page (Instagram, YouTube, Reddit, X, Snapchat) sells the same core product (Late API) through a platform-specific lens. Unlike tool pages that offer free utilities as lead magnets, solution pages position the paid product directly as the answer to a specific platform's API pain points. Same template, swapped platform context. Zero to $40K MRR — these pages are the primary conversion pages for developer-focused paid ads and organic SEO.

## Core Principle
Platform-specific pain → unified solution → "one API, 13 platforms" expansion. Every page says: "We already solved [Platform]'s hardest problems so you don't have to."

---

# Part 1: Section Order

Every solution page follows this exact sequence:

### 1. Hero Section
- Big bold title (identical formula across all pages)
- One-line subtitle addressing platform-specific pain
- Two CTAs: "Start Free Trial" (yellow, primary) + "View API Docs" (white, secondary)
- Sub-text: "No credit card required • 20 free posts/month"
- **No tool/input** — this is a product page, not a free tool

### 2. "Why Late vs [Platform API]" Comparison
- Two-column comparison table
- Left column: Platform's native API pain points (5 items with ✕ icons)
- Right column: Late API benefits (5 items with ✓ icons)
- Closing line with quantified savings
- **Position is critical** — appears immediately after hero, before any features

### 3. Platform-Specific Warning/Requirement Box
- Colored callout box with warning icon
- Addresses the #1 platform-specific gotcha upfront
- Shows product sophistication + builds trust through honesty
- **Every platform has one unique constraint they surface here**

### 4. Content Types Supported
- Headline: "Every [Platform] Format Supported"
- 3-5 format cards with emoji icons
- Lists all content types the API handles for that platform

### 5. How It Works (3 Steps)
- Headline: "Three Steps to [Platform] Automation"
- Step 1: Connect (OAuth/account linking)
- Step 2: Build (REST API integration)
- Step 3: Publish (scheduling, retries, webhooks)

### 6. Features Section
- Headline: "Why 10,000+ Developers Choose Late"
- 3-4 feature cards with benefit-driven titles
- Mix of universal benefits + 1 platform-specific feature

### 7. Code Example
- Headline: "Get Started in Minutes"
- Sub-headline: "Schedule a [Platform Content Type]"
- Syntax-highlighted JavaScript fetch() example
- Shows actual API endpoint and payload structure
- Link: "View [Platform] API Reference →"

### 8. Error Reference Callout
- Boxed callout promoting platform-specific error documentation
- "Comprehensive guide to [Platform] API error codes"
- CTA: "View Error Reference"

### 9. FAQ Section
- 5 questions in accordion format
- Mix of platform-specific and universal questions

### 10. "One API, 13 Platforms" Showcase
- Headline: "One API, 13 Platforms"
- Sub-headline: "Same integration pattern for all platforms"
- 12 clickable platform buttons (excludes current platform)

### 11. Final CTA Section
- Headline: "Ready to Ship Your [Platform] Integration?"
- Social proof line + value prop
- Two CTAs: "Start Free Trial" + "Read Documentation →"
- Sub-text: "No credit card required • 20 free posts per month • 99.97% uptime SLA"

### 12. Footer
- Standard site footer with links, GDPR badge, social links

---

# Part 2: Content Strategy

## Hero Copy Formulas

### Title Pattern
Identical template across ALL pages. Only the platform name changes.

| Page | Title |
|------|-------|
| Instagram | "Ship Your Instagram Integration In Minutes, Not Months" |
| YouTube | "Ship Your YouTube Integration In Minutes, Not Months" |
| Reddit | "Ship Your Reddit Integration In Minutes, Not Months" |
| X | "Ship Your X Integration In Minutes, Not Months" |
| Snapchat | "Ship Your Snapchat Integration In Minutes, Not Months" |

**Formula**: `Ship Your [Platform] Integration In Minutes, Not Months`

**Key insight**: Identical structure = brand consistency. The platform name is the only variable. Title targets "[Platform] API" and "[Platform] integration" keywords.

### Subtitle Pattern
Same opening, platform-specific pain points swapped in.

| Page | Subtitle |
|------|----------|
| Instagram | "Stop wrestling with Instagram's Graph API. Late handles OAuth, rate limits, media hosting, and API changes..." |
| YouTube | "Stop wrestling with YouTube's Data API. Late handles OAuth, rate limits, video processing, and API changes..." |
| Reddit | "Stop wrestling with Reddit's API. Late handles OAuth, rate limits, subreddit rules, and API changes..." |
| X | "Stop wrestling with X's API pricing and complexity. Late gives you a single, simple endpoint..." |
| Snapchat | "Post Stories, Saved Stories, and Spotlight content to Snapchat Public Profiles. Skip the allowlist process, AES-256 encryption, and chunked uploads" |

**Formula**: `Stop wrestling with [Platform]'s [specific API name]. Late handles [pain point 1], [pain point 2], [pain point 3], and [pain point 4] — so you can focus on building your product.`

**Exception**: X page leads with pricing pain ($100+/month), Snapchat leads with content types. Adapt the hook to whatever hurts most for that platform's developers.

### Supporting Text
Identical across all pages:
- "No credit card required • 20 free posts/month"

**Purpose**: Removes two objections instantly — cost and commitment.

---

## Comparison Section Copy

### Headline Pattern
Platform-specific hook targeting the #1 frustration.

| Page | Headline |
|------|----------|
| Instagram | "Building directly with Instagram's Graph API means weeks..." |
| YouTube | "Skip the YouTube Data API headaches" |
| Reddit | "Skip the Reddit API headaches" |
| X | "Skip the expensive X API subscription" |
| Snapchat | "Snapchat's API is notoriously complex" |

**Formula**: `Skip the [Platform API] [headaches/complexity/cost]`

**X exception**: Leads with cost angle ("expensive") because X charges $100+/month for API access.

### Pain Points Column (5 items with ✕)
Each page lists 5 platform-specific developer frustrations:

**Universal pain points that appear on most pages:**
1. Complex OAuth setup (OAuth 2.0, PKCE, token management)
2. Strict rate limits / quota management
3. Complex media upload process
4. Breaking API changes / deprecations
5. Separate integrations per platform

**Platform-specific swaps:**
| Platform | Unique pain point |
|----------|------------------|
| Instagram | App review process, Graph API complexity |
| YouTube | Resumable uploads, Data API v3 quotas |
| Reddit | Subreddit rules compliance, Automoderator |
| X | $100+/month API pricing, OAuth 2.0 PKCE |
| Snapchat | AES-256 encryption, allowlist process, chunked uploads |

### Benefits Column (5 items with ✓)
Nearly identical across all pages:
1. Simple API key (no complex OAuth setup)
2. Automatic retries and rate limit handling
3. Direct/simple uploads (platform handles complexity)
4. Zero maintenance (platform changes handled)
5. One API for 13 platforms

### Closing Line
Quantified savings statement.

| Page | Closing |
|------|---------|
| Instagram | "Save 4-6 weeks of development. Ship today, not next month." |
| YouTube | "Save 4-6 weeks of development. Ship today, not next month." |
| Reddit | "Save 4-6 weeks of development. Ship today, not next month." |
| X | "Save $100+/month plus weeks of development. Ship today, not next month." |
| Snapchat | "Save 6-8 weeks of development." |

**Formula**: `Save [time/money]. Ship today, not next month.`

**Insight**: X adds cost savings. Snapchat uses longer timeframe (6-8 weeks) because its API is genuinely harder. The savings claim should match the actual platform difficulty.

---

## Platform-Specific Warning Box

Every page has ONE unique constraint callout. This is a trust-building pattern — showing honesty about limitations.

| Page | Warning Title | What it addresses |
|------|--------------|-------------------|
| Instagram | "Instagram Business Account Required" | Personal/Creator accounts can't use API |
| YouTube | "YouTube Channel Required" | Must link channel via OAuth; Shorts auto-detected by duration |
| Reddit | "Subreddit Rules Apply" | Link posts restricted in some communities; Late auto-retries as self post |
| X | "No Premium Subscription Required" | Flipped as a positive — saves $100+/month vs X's Basic API tier |
| Snapchat | "Public Profile Required" | Must enable Snapchat Public Profile to use API |

**Key insight**: X flips the warning into a benefit ("No Premium Subscription Required" + "Save $100+/month"). When the platform's constraint is actually Late's advantage, reframe it.

**Copy formula**: `[Requirement/Warning Title]` + 1-2 sentences explaining the constraint + how Late handles it or how the user can resolve it.

---

## Content Types Section

### Headline
Identical: `Every [Platform] Format Supported`

### Format Cards
3-5 cards per page with emoji + format name:

| Platform | Formats |
|----------|---------|
| Instagram | 📷 Photos, 🎬 Videos, 📱 Stories, 🎠 Carousels, 🎬 Reels |
| YouTube | 🎬 Long-form Videos, 📱 YouTube Shorts, 🔴 Live Announcements |
| Reddit | Text posts, Link posts, Media posts (implied in copy) |
| X | 💬 Tweets, 🧵 Threads, 📷 Photos, 🎬 Videos, GIFs |
| Snapchat | 📱 Stories, 💾 Saved Stories, ✨ Spotlight |

**Purpose**: Quick scannable proof that the API handles everything the platform supports. Developers checking "does it support [format]?" get instant confirmation.

---

## How It Works (3 Steps)

### Headline
`Three Steps to [Platform] Automation`

### Step Structure
Identical 3-step framework across all pages. Only labels and descriptions change slightly.

| Step | Universal Pattern | Variations |
|------|------------------|------------|
| **Step 1** | "Connect Your [Account/Channel]" | Instagram: "Connect Account", YouTube: "Connect Your Channel", X: "Get Your API Key" |
| **Step 2** | "Build Your Integration" | All pages: REST API, titles, descriptions, media |
| **Step 3** | "We Handle the Rest" | All pages: scheduling, uploads, retries, webhooks |

**Step 1 formula**: `[Connect/Link] Your [Account Type]` — emphasizes OAuth is handled
**Step 2 formula**: `Build Your Integration` — shows API simplicity
**Step 3 formula**: `We Handle the Rest` — Late does the hard work

**Descriptions**: 1 sentence each. Step 1 mentions OAuth. Step 2 mentions REST API. Step 3 mentions scheduling + webhooks.

---

## Features Section

### Headline
`Why 10,000+ Developers Choose Late` (identical across all pages)

### Card Structure
3-4 cards. First 3 are nearly identical across all pages. 4th card (when present) is platform-specific.

**Universal cards (appear on every page):**

| Card | Title | Description Pattern |
|------|-------|---------------------|
| 1 | "Ship Faster" | "Go from zero to [publishing/uploading] in under [30 seconds/an hour]. No [platform-specific approval] required." |
| 2 | "Official API, Zero Hassle" | "We use [Platform]'s official [API name] under the hood. You get [reliability/compliance] without [pain point]." |
| 3 | "We Handle the Hard Parts" | "[OAuth/rate limits/token refresh/media uploads] — all abstracted away." |

**Platform-specific 4th card:**
| Platform | 4th Card | Description |
|----------|----------|-------------|
| YouTube | "Shorts Auto-Detection" | YouTube detects Shorts by duration + aspect ratio |
| Snapchat | "Automatic Encryption" | AES-256-CBC handled automatically |
| Snapchat | "Large File Support" | Up to 500MB uploads |
| Instagram | (none — 3 cards only) | |
| Reddit | (none — 3 cards only) | |

**Copy style**: Benefit-first. Never starts with "Our API..." or "We provide...". Starts with outcome or action.

---

## Code Example Section

### Headline
`Get Started in Minutes` (all pages)

### Sub-headline
`Schedule a [Content Type]` — platform-specific

| Page | Sub-headline |
|------|-------------|
| Instagram | "Schedule an Instagram Post" |
| YouTube | "Schedule a YouTube Video" |
| Reddit | "Schedule a Reddit Post" |
| X | "Schedule a Tweet" |
| Snapchat | "Schedule a Snapchat Story" |

### Code Block
JavaScript `fetch()` example. All pages POST to the same endpoint (`/api/v1/posts`). Only the `platform` field and platform-specific payload fields change.

**Universal structure:**
```javascript
fetch('https://getlate.dev/api/v1/posts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    profileId: 'YOUR_PROFILE_ID',
    platform: '[platform]',
    // platform-specific fields
  })
})
```

**Purpose**: Proves the "simple API" claim. Developer sees ~10 lines of code and thinks "I can do this in 5 minutes."

### Links Below Code
- "View [Platform] API Reference →"
- "View Complete API Documentation →"

---

## Error Reference Callout

Identical structure across all pages. Only platform name swaps.

**Headline**: `[Platform] API Error Reference`
**Description**: "Comprehensive guide to [Platform] API error codes. Find solutions and troubleshoot common integration issues."
**CTA**: "View Error Reference"

**SEO purpose**: Targets "[Platform] API error codes" long-tail keywords. Developers searching for error help land on Late's documentation → trust → conversion.

---

## FAQ Content Strategy

### Structure
5 questions per page. Accordion format.

### Question Categories
Each page uses a mix from this pool:

| Category | Example Questions | Appears on |
|----------|------------------|------------|
| **Authentication** | "How do I connect my [Platform] account?" | All pages |
| **Platform requirements** | "Do I need a Business Account?" / "What about subreddit rules?" | Instagram, Reddit, Snapchat |
| **Content capabilities** | "Can I attach media?" / "Do you support threads?" | X, Reddit, YouTube |
| **Why Late** | "Why use Late instead of [Platform]'s API directly?" | All pages |
| **Cross-platform** | "Can I cross-post to other platforms?" | All pages |
| **Platform-specific** | "How do you handle Automoderator?" / "Can I schedule Stories?" | Reddit, Instagram |

### Answer Copy Style
- Start with direct answer: "Yes!", "No.", "Late handles this automatically..."
- Keep under 3 sentences for simple questions
- Mention the paid product naturally in 1-2 answers
- Technical enough for developers, simple enough for product managers

### FAQ Count
Exactly 5 questions on every solution page (compared to 4-10 on tool pages). Consistency across solution pages.

---

## "One API, 13 Platforms" Section

### Headline
`One API, 13 Platforms` (identical everywhere)

### Sub-headline
`Same integration pattern for all platforms`

### Platform Grid
12 clickable buttons (excludes the current page's platform). Each links to that platform's solution page.

**Platforms**: Facebook, Instagram, X, LinkedIn, YouTube, TikTok, Pinterest, Reddit, Threads, Bluesky, Google Business, Telegram, Snapchat

**Purpose**:
1. Internal linking for SEO (every page links to every other page)
2. "Halo effect" — seeing 13 platforms creates perception of completeness
3. Expansion upsell — developer who came for one platform sees they can add more

---

## Final CTA Section

### Headline
`Ready to Ship Your [Platform] Integration?` (only platform name changes)

### Body Copy
`Join 10,000+ developers who chose Late over building with [Platform]'s API directly. Same reliability, 10x less code.`

**X variation adds**: "fraction of the cost" (because cost is X's #1 pain point)

### CTAs
- Primary: "Start Free Trial" (yellow)
- Secondary: "Read Documentation →" (text link)

### Sub-text
`No credit card required • 20 free posts per month • 99.97% uptime SLA`

**Identical across all pages** except X which sometimes adds cost comparison.

---

# Part 3: Cross-Cutting Content Patterns

## Social Proof Elements

Same metrics across ALL solution pages (brand-level trust, not page-level):

| Metric | Value | Placement |
|--------|-------|-----------|
| Developer count | "10,000+ developers" | Features headline, final CTA |
| Posts delivered | "2.3M+ posts delivered" | Header/footer |
| Uptime | "99.97% uptime SLA" | Final CTA sub-text |
| Free tier | "20 free posts/month" | Hero, final CTA |
| Rating | "4.7/5" | Occasionally in header |

**Key insight**: No page-specific social proof. Same numbers everywhere. This builds brand trust, not tool trust. Consistency = credibility.

**Missing (intentionally)**: No customer logos, no testimonials on platform pages (one quote from X page is the exception). Developer audiences trust metrics and code over quotes.

## Copy Style Rules

1. **Developer-first vocabulary** — "OAuth", "rate limits", "webhooks", "REST API" used freely. No dumbing down.
2. **Problem-first positioning** — Every page opens with pain, not features. "Stop wrestling with..." not "Late is a..."
3. **Quantified claims** — "4-6 weeks", "$100+/month", "30 seconds", "10x less code". Never vague.
4. **Same reliability, less code** — The core value prop distilled into 6 words. Appears in final CTA of every page.
5. **"We handle" pattern** — Late's favorite phrase. Used 5+ times per page. Positions Late as infrastructure that absorbs complexity.
6. **Active voice** — "We handle OAuth" not "OAuth is handled"
7. **Second person** — "Your integration", "you can focus on building"
8. **Short sentences** — Most descriptions are 1 sentence. Max 2.

## Tone Progression Down the Page

| Position | Tone | Example |
|----------|------|---------|
| Hero | Empathetic + confident | "Stop wrestling with..." |
| Comparison | Factual, side-by-side | Pain points vs benefits with icons |
| Warning box | Honest, helpful | "Instagram Business Account Required" |
| Content types | Scannable, visual | Emoji + format name |
| How it works | Clear, instructional | "Connect → Build → Publish" |
| Features | Benefit-first, punchy | "Ship Faster", "Zero Hassle" |
| Code example | Technical, minimal | Raw JavaScript fetch() |
| FAQ | Helpful, direct | "Yes!" / "Late handles this automatically" |
| Final CTA | Aspirational + social proof | "Join 10,000+ developers..." |

## Template vs. Custom Content

**Identical across ALL pages (templated):**
- Hero title formula
- "Why 10,000+ Developers Choose Late" headline
- First 3 feature cards (Ship Faster, Official API, Hard Parts)
- Code example structure
- Error reference callout
- "One API, 13 Platforms" section
- Final CTA section
- Social proof metrics
- Sub-text ("No credit card required...")

**Custom per platform (swapped):**
- Subtitle pain points (platform-specific API issues)
- Comparison table content (5 pain points + 5 benefits)
- Warning/requirement box (unique constraint per platform)
- Content types list (platform formats)
- How it works step descriptions (slight variations)
- 4th feature card (when present)
- Code example payload fields
- FAQ questions (3 platform-specific + 2 universal)

**Ratio**: ~70% templated, ~30% custom per page. Maximum efficiency with minimum effort.

---

# Part 4: SEO Strategy

## Keyword Targeting Per Page

Each page targets a cluster of related keywords:

| Page | Primary Keywords | Long-tail Keywords |
|------|-----------------|-------------------|
| Instagram | "Instagram API", "Instagram API alternative", "Instagram scheduling API" | "Instagram Graph API alternative 2026", "post to Instagram via API" |
| YouTube | "YouTube API", "YouTube Data API alternative", "YouTube upload API" | "YouTube Shorts API", "schedule YouTube videos API" |
| Reddit | "Reddit API", "Reddit API alternative", "Reddit automation" | "post to Reddit via API", "Reddit scheduling tool" |
| X | "X API alternative", "Twitter API alternative", "tweet scheduling API" | "X API without subscription", "post tweets via API" |
| Snapchat | "Snapchat API", "Snapchat API alternative", "Snapchat posting API" | "Snapchat Public Profile API", "Snapchat Spotlight API" |

## SEO Architecture

**URL structure**: `/[platform]` — clean, keyword-rich, platform-specific
**Internal linking**: Every page links to all 12 other platform pages (massive internal link network)
**Error reference sub-pages**: `/[platform]/errors` — targets troubleshooting long-tail queries
**Title tag formula**: `[Platform] API | [Platform] API Alternative for Devs [Year]`

## Content Density

- Platform name appears 30-80+ times per page
- "API" appears 15-40+ times per page
- FAQ section targets question-based search queries
- Comparison section targets "vs" and "alternative" queries
- Error reference pages target troubleshooting queries

## Structured Data
- FAQ schema (JSON-LD) on all pages
- Organization schema in footer
- Open Graph + Twitter Cards for social sharing

---

# Part 5: Funnel Logic

## The 4-Stage Developer Funnel

### Stage 1: Awareness (Hero + Comparison)
**Goal**: Capture developer at moment of frustration with platform's native API
**Mechanism**: "Stop wrestling with..." validates their pain → comparison table proves Late is the answer
**SEO entry**: Developer searches "[Platform] API alternative" or "[Platform] API error [code]"

### Stage 2: Education (How It Works + Code Example)
**Goal**: Prove it's actually simple
**Mechanism**: 3-step process + working code example. Developer thinks "I could ship this today."
**Key moment**: Seeing ~10 lines of code that replace weeks of work

### Stage 3: Confidence (Features + FAQ + Error Docs)
**Goal**: Remove remaining objections
**Mechanism**: Official API compliance, error documentation, honest limitations
**Trust pattern**: Warning boxes show honesty → FAQ handles edge cases → error docs show maturity

### Stage 4: Conversion (Multiple CTAs + Free Tier)
**Goal**: Get developer to start free trial
**Mechanism**: "No credit card required" + "20 free posts/month" removes all friction
**Expansion hook**: "One API, 13 Platforms" plants seed for multi-platform usage (higher tier)

## Free → Paid Path
1. Free tier: 20 posts/month, 2 profiles (enough to validate)
2. Build tier: $19/month, 120 posts, 10 profiles (first real usage)
3. Accelerate/Unlimited: Growth scaling
4. Multi-platform expansion naturally pushes users to higher tiers

## Key Funnel Insight
**Documentation as marketing**: API docs, error references, and code examples are freely accessible without signup. This builds trust and lets developers evaluate before committing. The "View API Docs" CTA appears alongside "Start Free Trial" everywhere — equal prominence. This is unusual for SaaS but critical for developer audiences who need to verify before buying.

---

# Part 6: Solution Pages vs Tool Pages — Key Differences

| Dimension | Tool Pages (downloaders, checkers) | Solution Pages (platform integrations) |
|-----------|-----------------------------------|---------------------------------------|
| **Primary goal** | Free value → trust → upsell | Direct product sale |
| **Hero** | Tool input/upload in hero | No tool — just copy + CTAs |
| **Lead magnet** | The free tool IS the magnet | Documentation + free tier is the magnet |
| **Comparison** | Free tool vs paid product | Late API vs platform's native API |
| **Social proof** | Star ratings + review count | Developer count + posts delivered + uptime SLA |
| **Code examples** | None (consumer audience) | Yes (developer audience) |
| **Educational content** | Deep guides, tips, do's/don'ts | Minimal — FAQ handles education |
| **Personas section** | Yes (4 user personas) | No — single persona (developer) assumed |
| **Stats strip** | Yes (tool-specific metrics) | No — social proof baked into copy |
| **"Works Everywhere"** | Yes (device compatibility) | No — developers don't need this |
| **Warning/requirement box** | "Use Responsibly" disclaimer | Platform-specific technical requirement |
| **Cross-sell** | Links to other free tools | Links to other platform pages |
| **FAQ count** | 4-10 (varies by complexity) | Exactly 5 (consistent) |
| **CTA type** | "Try [Product] Free" | "Start Free Trial" + "View API Docs" |
| **Tone** | Consumer-friendly, conversational | Developer-first, technical |
| **Content volume** | Medium-high (SEO-heavy) | Medium (focused, scannable) |
| **Template ratio** | ~60% templated | ~70% templated |

---

# Part 7: Consistency Rules

These elements are IDENTICAL across every solution page:

1. Hero title formula: "Ship Your [Platform] Integration In Minutes, Not Months"
2. Features headline: "Why 10,000+ Developers Choose Late"
3. First 3 feature cards (Ship Faster, Official API, Hard Parts)
4. Code example structure and endpoint
5. Error reference callout format
6. "One API, 13 Platforms" section + platform grid
7. Final CTA headline formula: "Ready to Ship Your [Platform] Integration?"
8. Final CTA body: "Join 10,000+ developers..."
9. Sub-text: "No credit card required • 20 free posts per month • 99.97% uptime SLA"
10. Social proof numbers (10K+ developers, 2.3M+ posts, 99.97% uptime)
11. FAQ count (exactly 5)
12. How It Works step count (exactly 3)

**Why**: Brand consistency. Developers who visit multiple platform pages see the same trust signals. Reduces cognitive load. Also makes creating new platform pages trivial — swap the platform name and 5-6 custom sections.
