# Relationship AI Setup

## Feature

`/#/relationship-ai` lets users paste chat records and relationship context, then pay to unlock a relationship-stage analysis.

The feature is connected in both directions:

- Home page links to AI relationship analysis.
- Attachment result links to AI relationship analysis.
- Synastry result links to AI relationship analysis.
- AI relationship analysis links back to attachment, synastry, and tarot tests.

## Backend

API endpoint:

```text
POST /api/relationship/analyze
```

The frontend calls this after payment unlock and passes the paid `orderId`. The backend enforces a server-verifiable paid order by default, so direct API calls without a paid order return `402 RELATIONSHIP_AI_PAYMENT_REQUIRED`.

For local testing only, this gate can be disabled:

```ini
RELATIONSHIP_AI_REQUIRE_PAYMENT=false
```

The backend uses Gemini first, then OpenAI, then a local fallback analysis so the product flow remains usable when no AI provider key is configured.

The relationship page should keep a low-pressure tone: users can start with partial information such as chat snippets, zodiac signs, MBTI guesses, or attachment tendencies. Extra tests are optional enhancement signals, not required prerequisites.

## Paid Test AI Reports

Paid test reports can request a server-generated AI personal analysis:

```text
POST /api/tests/:type/ai-analysis
```

The endpoint requires a server-verifiable `paid` order that unlocks the requested test. Generated AI analyses are cached under the order result payload, so reopening a report does not repeatedly call Gemini. If Gemini is unavailable, the frontend shows the original fixed deep report with a retry-friendly fallback note.

## AI Configuration

Set these in `/opt/northstar/server/.env` for live AI output:

```ini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Optional fallback provider:
OPENAI_API_KEY=sk-...
RELATIONSHIP_AI_MODEL=gpt-5.5
```

`GEMINI_MODEL` is optional. If omitted, the backend uses `gemini-2.5-flash`.
`RELATIONSHIP_AI_MODEL` is optional and only used by the OpenAI fallback. If omitted, the backend uses `gpt-5.5`.

## Privacy Copy

The frontend asks users to remove real names, phone numbers, addresses, and other sensitive identifiers before pasting chat records.

## Verification

Local verification screenshots:

- `verification/relationship-ai-desktop.png`
- `verification/relationship-ai-mobile.png`

Commands:

```bash
npm run check:syntax
npm run build:static
npm --prefix server audit --omit=dev
```
