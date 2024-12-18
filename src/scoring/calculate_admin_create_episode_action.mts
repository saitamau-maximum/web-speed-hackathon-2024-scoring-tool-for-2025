import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect as _expect } from '@playwright/test';
import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { goTo } from '../utils/go_to.mjs';
import { signinAction } from '../utils/signin_action.mjs';
import { startFlow } from '../utils/start_flow.mjs';

import { calculateHackathonScore } from './utils/calculate_hackathon_score.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateAdminCreateEpisodeAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  console.debug('AdminCreateEpisodeAction - navigate to signin page');
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
  console.debug('AdminCreateEpisodeAction - navigate to signin page end');

  console.debug('AdminCreateEpisodeAction - signin');
  {
    await signinAction({ playwrightPage });
  }
  console.debug('AdminCreateEpisodeAction - signin end');

  console.debug('AdminCreateEpisodeAction - navigate to signin page');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/admin/books', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  console.debug('AdminCreateEpisodeAction - navigate to signin page end');

  console.debug('AdminCreateEpisodeAction - search book');
  {
    try {
      const radio = playwrightPage.getByRole('radiogroup').getByText('作品名');
      await radio.click();
      const searchbox = playwrightPage.getByRole('textbox', { name: '条件を入力' });
      await searchbox.pressSequentially('コノアドケナイ');
      const bodyRows = playwrightPage.getByRole('table').locator('tbody > tr');
      await expect(bodyRows.first()).toContainText('このあどけない');
    } catch (err) {
      throw new Error('作品を検索できませんでした', { cause: err });
    }
  }
  {
    try {
      const bodyRows = playwrightPage.getByRole('table').locator('tbody > tr');
      await bodyRows.first().getByRole('button', { name: '詳細' }).click();
      await playwrightPage.getByRole('dialog').waitFor();
      await playwrightPage.getByRole('dialog').getByRole('button', { name: '編集' }).first().waitFor();
    } catch (err) {
      throw (new Error('作品の詳細を開けませんでした'), { cause: err });
    }
  }
  console.debug('AdminCreateEpisodeAction - search book end');

  const flow = await startFlow(puppeteerPage);
  await flow.startTimespan();
  console.debug('AdminCreateEpisodeAction - create episode');
  {
    try {
      await playwrightPage.getByRole('dialog').getByRole('button', { name: 'エピソードを追加' }).click();
    } catch (err) {
      throw new Error('作品詳細モーダルからエピソード追加画面に遷移できません', { cause: err });
    }
  }
  {
    try {
      const fileChooserPromise = playwrightPage.waitForEvent('filechooser');
      const [, fileChooser] = await Promise.all([
        playwrightPage.getByRole('button', { name: 'サムネイルの画像を選択' }).click(),
        fileChooserPromise,
      ]);
      await fileChooser.setFiles(path.resolve(__dirname, './assets/image.jpg'));

      await playwrightPage
        .getByRole('textbox', { exact: true, name: 'エピソード名' })
        .pressSequentially('私は夜空に届かない');
      await playwrightPage
        .getByRole('textbox', { name: 'エピソード名（ふりがな）' })
        .pressSequentially('わたしはよぞらにとどかない');
      await playwrightPage
        .getByRole('textbox', { name: 'あらすじ' })
        .pressSequentially(
          '図書館は、基本的人権のひとつとして知る自由をもつ国民に、資料と施設を提供することをもっとも重要な任務とする。',
        );
      await playwrightPage.getByRole('spinbutton', { name: 'エピソードの章' }).pressSequentially('1');

      await playwrightPage.getByRole('button', { name: '作成' }).click();

      await expect(playwrightPage).toHaveURL(/\/admin\/books\/[a-z0-9-]+\/episodes\/[a-z0-9-]+$/);
    } catch (err) {
      throw new Error('エピソードの追加ができませんでした', { cause: err });
    }
  }
  await flow.endTimespan();
  console.debug('AdminCreateEpisodeAction - create episode end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
