import { expect as _expect } from '@playwright/test';
import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { goTo } from '../utils/go_to.mjs';
import { installServiceWorker } from '../utils/install_service_worker.mjs';
import { startFlow } from '../utils/start_flow.mjs';

import { calculateHackathonScore } from './utils/calculate_hackathon_score.mjs';
import { waitFor } from './utils/wait_for.mjs';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateSearchBookAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  console.debug('SearchBookAction - install service worker');
  try {
    await installServiceWorker({ baseUrl, playwrightPage, puppeteerPage });
  } catch (err) {
    throw new Error('Service Worker のインストールに失敗しました', { cause: err });
  }

  console.debug('SearchBookAction - navigate');
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
  console.debug('SearchBookAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  console.debug('SearchBookAction - search');
  await flow.startTimespan();
  {
    try {
      const textbox = playwrightPage.getByRole('textbox', { name: '作品名を入力' });
      await textbox.click();
      await textbox.pressSequentially('コノアドケナイ');
      await textbox.blur();
    } catch (err) {
      throw new Error('検索ボックスに入力できません', { cause: err });
    }

    try {
      const section = playwrightPage.getByRole('region', { name: '検索結果' });
      const list = section.getByRole('list');
      const items = list.getByRole('listitem');

      await waitFor(() => expect(items.nth(0)).toBeVisible(), {
        timeout: 60 * 1000,
      });
    } catch (err) {
      throw new Error('検索クエリに該当する作品がありません', { cause: err });
    }

    try {
      const section = playwrightPage.getByRole('region', { name: '検索結果' });
      const list = section.getByRole('list');
      const items = list.getByRole('listitem');

      await expect(items.nth(0)).toContainText('このあどけない');
    } catch (err) {
      throw new Error('検索結果が正しく表示されていません', { cause: err });
    }

    try {
      const section = playwrightPage.getByRole('region', { name: '検索結果' });
      const list = section.getByRole('list');
      const items = list.getByRole('listitem');

      await waitFor(() => expect(items.nth(0).getByRole('img', { name: /このあどけない/ })).toBeVisible(), {
        timeout: 60 * 1000,
      });
    } catch (err) {
      throw new Error('検索結果の画像が正しく表示されていません', { cause: err });
    }
  }
  await flow.endTimespan();
  console.debug('SearchBookAction - search end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
