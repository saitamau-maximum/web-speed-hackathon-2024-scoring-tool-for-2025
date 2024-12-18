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

export async function calculateScrollComicViewerAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  console.debug('ScrollComicViewerAction - install service worker');
  try {
    await installServiceWorker({ baseUrl, playwrightPage, puppeteerPage });
  } catch (err) {
    throw new Error('Service Worker のインストールに失敗しました', { cause: err });
  }

  console.debug('ScrollComicViewerAction - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/books/e998ff8e-0f15-4260-9969-f519c15836a4/episodes/ff143a53-faed-4da0-a6a5-795e8b4956fe', baseUrl)
        .href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  console.debug('ScrollComicViewerAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  console.debug('ScrollComicViewerAction - scroll');
  await flow.startTimespan();
  {
    const viewer = playwrightPage.getByRole('region', { name: '漫画ビューアー' });

    try {
      await waitFor(
        async () => {
          await expect(viewer.getByRole('img').nth(0)).toBeInViewport({ ratio: 0.9 });
          await expect(viewer.getByRole('img').nth(1)).not.toBeInViewport({ ratio: 0.1 });
        },
        { timeout: 60 * 1000 },
      );
    } catch (err) {
      throw new Error('漫画ビューアーの初期表示が正しくありません', { cause: err });
    }

    const viewerBoundingBox = (await viewer.boundingBox())!;
    const touchStartPosition = { x: viewerBoundingBox.x + 10, y: viewerBoundingBox.y + 100 };

    try {
      await playwrightPage.mouse.move(touchStartPosition.x, touchStartPosition.y);
      await playwrightPage.mouse.down();
      await playwrightPage.mouse.move(touchStartPosition.x + viewerBoundingBox.width / 2, 0, { steps: 10 });
      await playwrightPage.mouse.up();
    } catch (err) {
      throw new Error('漫画ビューアーのスクロールに失敗しました', { cause: err });
    }

    try {
      await waitFor(
        async () => {
          await expect(viewer.getByRole('img').nth(0)).not.toBeInViewport({ ratio: 0.1 });
          await expect(viewer.getByRole('img').nth(1)).toBeInViewport({ ratio: 0.9 });
        },
        { timeout: 60 * 1000 },
      );
    } catch (err) {
      throw new Error('漫画ビューアーのスクロールのあと、画像の表示位置が正しくありません', { cause: err });
    }
  }
  await flow.endTimespan();
  console.debug('ScrollComicViewerAction - scroll end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
