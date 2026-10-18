// Sends all-time coding stats from CodeClock to the portfolio ingest endpoint.
const apiUrl = process.env.PORTFOLIO_STATS_API_URL;
const secret = process.env.STATS_SYNC_SECRET;
const sourceUrl = process.env.CODECLOCK_STATS_URL;

if (!apiUrl || !secret || !sourceUrl) {
  console.error('Missing PORTFOLIO_STATS_API_URL, STATS_SYNC_SECRET or CODECLOCK_STATS_URL');
  process.exit(1);
}

// The CodeClock API may be asleep on a free host, so retry for a while.
async function fetchStats() {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(90_000) });
      if (res.ok) return await res.json();
      console.error(`CodeClock responded ${res.status} (attempt ${attempt})`);
    } catch (err) {
      console.error(`CodeClock fetch failed (attempt ${attempt}): ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error('CodeClock stats unavailable');
}

const stats = await fetchStats();

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-stats-sync-secret': secret,
  },
  body: JSON.stringify({ stats }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Portfolio stats ingest failed (${response.status}): ${body}`);
  process.exit(1);
}

console.log('Portfolio stats saved:', body);
