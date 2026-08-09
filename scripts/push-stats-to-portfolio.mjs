import { readFileSync } from 'node:fs';

const apiUrl = process.env.PORTFOLIO_STATS_API_URL;
const secret = process.env.STATS_SYNC_SECRET;

if (!apiUrl || !secret) {
  console.error('Missing PORTFOLIO_STATS_API_URL or STATS_SYNC_SECRET');
  process.exit(1);
}

const readme = readFileSync('README.md', 'utf8');

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-stats-sync-secret': secret,
  },
  body: JSON.stringify({ readme }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Portfolio stats ingest failed (${response.status}): ${body}`);
  process.exit(1);
}

console.log('Portfolio stats saved:', body);
