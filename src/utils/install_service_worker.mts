import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { waitFor } from '../scoring/utils/wait_for.mjs';

import { goTo } from './go_to.mjs';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function installServiceWorker({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  console.debug('Install service worker');

  await goTo({
    playwrightPage,
    puppeteerPage,
    url: new URL('/', baseUrl).href,
  }).catch(() => {});

  const target = await puppeteerPage.browser().waitForTarget(
    (target) => {
      return target.type() === 'service_worker' && target.url().includes(baseUrl);
    },
    { timeout: 60 * 1000 },
  );

  await goTo({
    playwrightPage,
    puppeteerPage,
    url: 'about:blank',
  }).catch(() => {});

  const worker = (await target.worker())!;
  await waitFor(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = await worker.evaluate(() => (self as any).registration.active?.state);
      if (state !== 'activated') {
        throw new Error('Service worker not activated');
      }
    },
    { timeout: 60 * 1000 },
  );
  await worker.close();

  const cdp = await puppeteerPage.createCDPSession();
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.clearBrowserCookies');
}
