import { backOff } from 'exponential-backoff';
import { dev } from '$app/environment';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { kv } from '@vercel/kv';
import type { PageServerLoad } from './$types';

const CACHE_FILE = '/tmp/artisanal-repos.json';
const CACHE_TTL_MS = 60 * 60 * 1000;
const KV_KEY = 'artisanal:repos';
const KV_TTL_SECONDS = 24 * 60 * 60;

const QUERY = `
WITH
  ai_actors AS (
    SELECT 'claude[bot]' AS actor UNION ALL
    SELECT 'anthropic[bot]' UNION ALL
    SELECT 'chatgpt-codex-connector[bot]' UNION ALL
    SELECT 'copilot' UNION ALL
    SELECT 'github-copilot[bot]' UNION ALL
    SELECT 'copilot-workspace[bot]' UNION ALL
    SELECT 'google-labs-jules[bot]' UNION ALL
    SELECT 'gemini-code-assist[bot]' UNION ALL
    SELECT 'devin-ai-integration[bot]' UNION ALL
    SELECT 'devin[bot]' UNION ALL
    SELECT 'cursor[bot]' UNION ALL
    SELECT 'amazon-q-developer[bot]' UNION ALL
    SELECT 'lovable-dev[bot]' UNION ALL
    SELECT 'coderabbitai[bot]' UNION ALL
    SELECT 'sourcery-ai[bot]' UNION ALL
    SELECT 'qodo-merge-pro[bot]' UNION ALL
    SELECT 'codeflash-ai[bot]' UNION ALL
    SELECT 'sweep-ai[bot]' UNION ALL
    SELECT 'sweep[bot]' UNION ALL
    SELECT 'codegen-bot' UNION ALL
    SELECT 'aider-bot' UNION ALL
    SELECT 'gpt-pilot[bot]' UNION ALL
    SELECT 'tabnine[bot]' UNION ALL
    SELECT 'cody[bot]'
  ),
  ai_repos AS (
    SELECT DISTINCT repo_name
    FROM github_events
    WHERE created_at > now() - INTERVAL 6 MONTH
      AND actor_login IN (SELECT actor FROM ai_actors)
      AND event_type IN ('PushEvent', 'PullRequestEvent', 'IssueCommentEvent', 'PullRequestReviewCommentEvent')
  ),
  starred AS (
    SELECT repo_name, count() AS stars
    FROM github_events
    WHERE event_type = 'WatchEvent'
      AND created_at > now() - INTERVAL 3 YEAR
    GROUP BY repo_name
    HAVING stars >= 100
  ),
  active AS (
    SELECT repo_name, max(created_at) AS last_activity
    FROM github_events
    WHERE event_type = 'PushEvent'
      AND created_at > now() - INTERVAL 6 MONTH
    GROUP BY repo_name
  )
SELECT
  s.repo_name AS repo,
  s.stars,
  formatDateTime(a.last_activity, '%Y-%m-%d') AS last_active
FROM starred s
JOIN active a ON s.repo_name = a.repo_name
WHERE s.repo_name NOT IN (SELECT repo_name FROM ai_repos)
ORDER BY s.stars DESC
LIMIT 200
FORMAT JSON
`;

export const load: PageServerLoad = async ({ setHeaders }) => {
	if (dev) {
		try {
			const stat = statSync(CACHE_FILE);
			if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
				const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
				return { repos: cached };
			}
		} catch {}
	} else {
		try {
			const cached = await kv.get<{ repo: string; stars: number; last_active: string }[]>(KV_KEY);
			if (cached) {
				setHeaders({ 'cache-control': 'public, max-age=82800' });
				return { repos: cached };
			}
		} catch {}
	}

	const json = await backOff(
		async () => {
			const res = await fetch('https://play.clickhouse.com/?user=play', {
				method: 'POST',
				body: QUERY
			});
			if (!res.ok) throw new Error(`ClickHouse: ${res.status}`);
			return res.json();
		},
		{ numOfAttempts: 3, startingDelay: 1000, jitter: 'full' }
	);

	setHeaders({ 'cache-control': 'public, max-age=82800' });

	const repos = json.data as { repo: string; stars: number; last_active: string }[];

	if (dev) {
		writeFileSync(CACHE_FILE, JSON.stringify(repos));
	} else {
		try {
			await kv.set(KV_KEY, repos, { ex: KV_TTL_SECONDS });
		} catch {}
	}

	return { repos };
};
