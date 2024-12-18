import { expect as _expect } from '@playwright/test';
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

export async function calculateOpenTermModal({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  console.debug('OpenTermModal - install service worker');
  try {
    await installServiceWorker({ baseUrl, playwrightPage, puppeteerPage });
  } catch (err) {
    throw new Error('Service Worker のインストールに失敗しました', { cause: err });
  }

  console.debug('OpenTermModal - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/search', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  console.debug('OpenTermModal - navigate end');

  const flow = await startFlow(puppeteerPage);

  console.debug('OpenTermModal - open modal');
  await flow.startTimespan();
  {
    try {
      const footer = playwrightPage.getByRole('contentinfo');
      await footer.getByRole('button', { name: '利用規約' }).click();
      const modal = playwrightPage.getByRole('dialog', { name: '利用規約' });
      await expect(modal).toBeVisible();
    } catch (err) {
      throw new Error('利用規約のモーダルの表示に失敗しました', { cause: err });
    }
  }
  await flow.endTimespan();
  console.debug('OpenTermModal - open modal end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
