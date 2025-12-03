-- Artisanal repos: 100+ stars, active in last 6 months, zero AI bot involvement
-- Run against: clickhouse client --host play.clickhouse.com --user play --secure

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
