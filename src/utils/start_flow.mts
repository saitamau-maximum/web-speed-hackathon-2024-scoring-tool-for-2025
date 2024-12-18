import { startFlow as startFlowOrig } from 'lighthouse';
import * as constants from 'lighthouse/core/config/constants.js';
import type { Page } from 'puppeteer';

export async function startFlow(page: Page) {
  return startFlowOrig(page, {
    config: {
      extends: 'lighthouse:default',
      settings: {
        disableFullPageScreenshot: true,
        disableStorageReset: true,
        formFactor: 'mobile',
        maxWaitForFcp: 120 * 1000,
        maxWaitForLoad: 180 * 1000,
        onlyAudits: [
          'first-contentful-paint',
          'speed-index',
          'largest-contentful-paint',
          'total-blocking-time',
          'cumulative-layout-shift',
          'interaction-to-next-paint',
        ],
        screenEmulation: {
          disabled: true,
        },
        throttling: constants.throttling.mobileSlow4G,
        throttlingMethod: 'simulate',
      },
    },
  }).catch(() => Promise.reject(new Error('Lighthouse がタイムアウトしました')));
}
