import * as github from '@actions/github';
import { stripIndents } from 'common-tags';
import _ from 'lodash';

import { calculate } from './calculate.mjs';
import { Reporter } from './reporting/reporter.js';
import { updateLeaderboard } from './update-leaderboard.mjs';

const reporter = new Reporter({
  github,
  octokit: github.getOctokit(process.env.GITHUB_TOKEN!),
});

main().catch(async (err) => {
  console.error(err);
  await reporter.appendArea('fatalError', '❌ 計測に失敗しました、運営にご連絡ください');
  process.abort();
});

const issue = github.context.payload.issue!;

async function main() {
  await reporter.init();

  const now = new Date();
  const startAt = new Date("2025-03-01T10:00:00+09:00");
  const endAt = new Date("2025-03-20T23:59:59+09:00");

  if (now < startAt || now > endAt) {
    await reporter.appendArea('fatalError', '❌ 開催期間外です');
    return;
  }

  const [, BASE_URL] = issue?.body?.match(/###.*?\{\{url\}\}[\s\n]*?([\S]+)/m) ?? [];

  if (BASE_URL == null || BASE_URL === '') {
    await reporter.appendArea('fatalError', '❌ issue が読み込めませんでした、issue を作り直してください');
    return;
  }

  try {
    const res = await fetch(new URL('/api/v1/initialize', BASE_URL), { method: 'POST' });
    if (res.status !== 200 && res.status !== 204) {
      throw new Error(`Initialize error: ${res.status}`);
    }
  } catch (err) {
    console.error(err);
    await reporter.appendArea('fatalError', '❌ 初期化 API `/api/v1/initialize` にアクセスできません');
    return;
  }

  const results: Array<{
    error?: Error;
    scoreX100: number;
    target: { maxScore: number; name: string };
  }> = [];

  for await (const result of calculate({ baseUrl: BASE_URL })) {
    results.push(result);

    if (result.error != null) {
      await reporter.appendArea(
        'errorList',
        `- **${result.target.name}** | ${result.error.message.replaceAll('\n', '').slice(0, 100)}`,
      );
    }

    const scoreTable = [
      '|テスト項目|スコア|',
      '|:---|---:|',
      ...results.map(({ scoreX100, target }) => {
        const scoreText = Number.isNaN(scoreX100)
          ? '計測できません'
          : `${(scoreX100 / 100).toFixed(2)} / ${target.maxScore.toFixed(2)}`;
        return `| ${target.name} | ${scoreText} |`;
      }),
    ].join('\n');

    await reporter.setArea('scoreTable', scoreTable);
  }

  const totalScore = _.round(_.sum(_.map(results, ({ scoreX100 }) => scoreX100 || 0)) / 100, 2);
  const totalMaxScore = _.sum(_.map(results, ({ target }) => target.maxScore));

  const res = await updateLeaderboard(github.context.payload.issue!['user'].login, totalScore, BASE_URL);

  await reporter.setArea(
    'result',
    stripIndents`
          **合計 ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}**

          現在、**${res.rank} 位**です
        `,
  );
}
