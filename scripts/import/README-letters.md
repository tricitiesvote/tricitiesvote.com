# Tri-City Herald Letters to Editor Scraper

This script scrapes letters to the editor from the Tri-City Herald and uses AI to identify endorsements for local candidates.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

3. Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Usage

Run the scraper:
```bash
npm run import:letters
```

This will:
- Fetch all 2025 candidates from the database (City Council, School Board, Port Commissioner)
- Check database for the last processed letter (to avoid re-processing)
- Navigate to https://www.tri-cityherald.com/opinion/letters-to-the-editor/
- Extract NEW letter article URLs (since last processed, or since May 2025 on first run)
- For each article, use Claude AI to identify endorsements
- Output results to console and save to `scripts/import/letter-endorsements.csv`

## Output Format

The CSV will contain:
```
Candidate Name,Letter Writer,For/Against,Office Type,URL
Melissa Blasdel,Monty Huber,FOR,City Council,https://www.tri-cityherald.com/...
```

## Notes

- The script uses Playwright to bypass any site blocking
- It queries your local database for candidate names, so you don't need to hardcode them
- **Smart resumption**: Automatically detects the last processed letter and only scrapes new ones
- AI analysis looks for explicit endorsements (FOR) or opposition (AGAINST)
- Only candidates running for City Council, School Board, or Port Commissioner are included
- Rate limited to 1 request per second to be respectful to the Herald's servers
- Safe to run multiple times - won't re-process already-imported letters

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude
- `DATABASE_URL` - Your PostgreSQL database URL (should already be in `.env`)
