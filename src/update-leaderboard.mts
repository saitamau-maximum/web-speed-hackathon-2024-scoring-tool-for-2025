import { appendFile, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parse as parseCSV } from "csv-parse/sync";
import { stringify as stringifyCSV } from "csv-stringify/sync";
import { execSync } from "node:child_process";

type CSVRow = {
  rank: number;
  score: number;
  competitorId: string;
  url: string;
};

export async function updateLeaderboard(id: string, score: number, url: string) {
  const LOG_CSV_PATH = resolve(import.meta.filename, "..", "..", "log.csv")
  const SCORE_CSV_PATH = resolve(import.meta.filename, "..", "..", "score.csv")
  const README_PATH = resolve(import.meta.filename, "..", "..", "README.md")

  execSync("git pull origin main");

  await appendFile(
    LOG_CSV_PATH,
    `${new Date().toISOString()},${id},${score},${url}\n`
  );

  const result: CSVRow = {
    rank: 0,
    score,
    competitorId: id,
    url,
  };

  const scoreList = parseCSV(await readFile(SCORE_CSV_PATH, "utf-8"), {
    columns: true,
    cast: (value, context) => {
      if (context.header) {
        return value;
      }
      if (["rank", "score"].includes(context.column as string)) return Number(value);
      return String(value);
    },
  }) as CSVRow[];

  const scoreMap = new Map(scoreList.map((s) => [s.competitorId, s]));
  scoreMap.set(result.competitorId, result);

  const sortedScoreList = Array.from(scoreMap.values()).sort(
    (a, b) => b.score - a.score
  );

  for (let idx = 0; idx < sortedScoreList.length; idx++) {
    const item = sortedScoreList[idx];
    const prevItem = sortedScoreList[idx - 1];

    if (prevItem && item && item.score === prevItem.score) {
      item.rank = prevItem.rank;
    } else if (item) {
      item.rank = idx + 1;
    }
  }

  const leaderBoardMarkdown = [
    "<!-- leaderboard:start -->",
    "",
    "|Rank|Score||CompetitorId|URL|",
    "|:--:|:--:|:--:|:--|:--:|",
    ...sortedScoreList
      .map((item) => {
        const inner = [
          `${item.rank}`,
          `**${Number(item.score).toFixed(2)}**`,
          `<img alt="" width="50" height="50" src="https://github.com/${item.competitorId}.png?size=100"/>`,
          `[@${item.competitorId}](https://github.com/${item.competitorId})`,
          `[:link:](${item.url})`,
        ].join("|");
        return `|${inner}|`;
      }),
    "",
    "<!-- leaderboard:end -->",
  ].join("\n");

  const markdown = await readFile(README_PATH, "utf-8");
  await writeFile(
    README_PATH,
    markdown.replace(
      /<!-- leaderboard:start -->.*<!-- leaderboard:end -->/ms,
      leaderBoardMarkdown
    ),
    "utf-8"
  );

  const csv = stringifyCSV(sortedScoreList, {
    columns: ["rank", "score", "competitorId", "url"],
    header: true,
  });
  await writeFile(SCORE_CSV_PATH, csv, "utf-8");

  if (process.env.DISCORD_WEBHOOK_URL) {
    const discordMessage = `
**Leaderboard updated!**
${sortedScoreList.map(
      (item) =>
        `${item.rank}. \`${item.competitorId}\` ${Number(item.score).toFixed(2)}`
    ).join("\n")}
    `.trim();
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: discordMessage,
      }),
    });
  } else {
    console.log("DISCORD_WEBHOOK_URL is not set, skip notifying to Discord");
  }

  return result
}
