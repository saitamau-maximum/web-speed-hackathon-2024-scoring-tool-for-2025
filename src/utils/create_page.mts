import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import * as playwright from 'playwright';
import * as puppeteer from 'puppeteer';

type Params = {
  device: (typeof playwright.devices)[keyof typeof playwright.devices];
};

export async function createPage({ device }: Params) {
  const userDataDir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'playwright-'));

  const playwrightContext = await playwright['chromium'].launchPersistentContext(userDataDir, {
    args: ['--remote-debugging-port=9222'],
    devtools: process.env['CI'] !== 'true',
    headless: process.env['CI'] === 'true',
    ...device,
  });

  const playwrightPage = playwrightContext.pages()[0]!;
  await playwrightPage.goto('about:blank');

  const puppeteerBrowser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: {
      deviceScaleFactor: device.deviceScaleFactor,
      hasTouch: device.hasTouch,
      height: device.viewport.height,
      isMobile: device.isMobile,
      width: device.viewport.width,
    },
  });
  const puppeteerPage = (await puppeteerBrowser.pages())[0]!;

  return { playwrightContext, playwrightPage, puppeteerPage };
}
