import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { goTo } from '../utils/go_to.mjs';
import { signinAction } from '../utils/signin_action.mjs';
import { startFlow } from '../utils/start_flow.mjs';

import { calculateHackathonScore } from './utils/calculate_hackathon_score.mjs';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateAdminSigninAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  console.debug('AdminSigninAction - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/admin', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  console.debug('AdminSigninAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  console.debug('AdminSigninAction - signin');
  await flow.startTimespan();
  {
    await signinAction({ playwrightPage });
  }
  await flow.endTimespan();
  console.debug('AdminSigninAction - signin end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
