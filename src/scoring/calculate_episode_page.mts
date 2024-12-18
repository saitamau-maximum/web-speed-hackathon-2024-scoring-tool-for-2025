import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { goTo } from '../utils/go_to.mjs';
import { installServiceWorker } from '../utils/install_service_worker.mjs';
import { startFlow } from '../utils/start_flow.mjs';

import { calculateHackathonScore } from './utils/calculate_hackathon_score.mjs';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateEpisodePage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  console.debug('EpisodePage - install service worker');
  try {
    await installServiceWorker({ baseUrl, playwrightPage, puppeteerPage });
  } catch (err) {
    throw new Error('Service Worker のインストールに失敗しました', { cause: err });
  }

  const flow = await startFlow(puppeteerPage);

  console.debug('EpisodePage - navigate');
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/books/7d552a43-e45f-421d-92b1-c17f602a6c10/episodes/fee12718-8bad-4c98-b6f7-04bbc3c79957', baseUrl)
        .href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  await flow.endNavigation();

  console.debug('EpisodePage - navigate end');
  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: false }),
  };
}
