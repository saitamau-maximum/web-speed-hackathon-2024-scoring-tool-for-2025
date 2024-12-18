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

export async function calculateAdminEditBookAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  console.debug('AdminSearchBookEditAction - navigate to signin page');
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
  console.debug('AdminSearchBookEditAction - navigate to signin page end');

  console.debug('AdminSearchBookEditAction - signin');
  {
    await signinAction({ playwrightPage });
  }
  console.debug('AdminSearchBookEditAction - signin end');

  console.debug('AdminSearchBookEditAction - navigate to signin page');
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
  console.debug('AdminSearchBookEditAction - navigate to signin page end');

  console.debug('AdminSearchBookEditAction - search book');
  const flow = await startFlow(puppeteerPage);
  await flow.startTimespan();
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
  console.debug('AdminSearchBookEditAction - search book end');
  console.debug('AdminSearchBookEditAction - edit book');
  {
    try {
      const bodyRows = playwrightPage.getByRole('table').locator('tbody > tr');
      await bodyRows.first().getByRole('button', { name: '詳細' }).click();
      await playwrightPage.getByRole('dialog').getByRole('region', { name: '作品詳細' }).waitFor();
    } catch (err) {
      throw new Error('作品の詳細を開けませんでした', { cause: err });
    }
  }
  {
    try {
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .waitFor();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .click();
      const fileChooserPromise = playwrightPage.waitForEvent('filechooser');
      const [, fileChooser] = await Promise.all([
        playwrightPage.getByRole('dialog').getByRole('button', { name: '作品の画像を選択' }).click(),
        fileChooserPromise,
      ]);
      await fileChooser.setFiles(path.join(__dirname, './assets/image.jpg'));
      await playwrightPage.getByRole('dialog').getByRole('button', { name: '決定' }).click();

      const img = playwrightPage.getByRole('dialog').getByRole('region', { name: '作品詳細' }).getByRole('img');
      await expect(img).toBeVisible();
    } catch (err) {
      // 画像のアップロードが失敗した場合、エラーを出力して処理を続行する
      console.error('作品の画像のアップロードができませんでした', err);
    }
  }
  {
    try {
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .waitFor();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('textbox', { exact: true, name: '作品名' })
        .pressSequentially('やがてあなたになる');
      await playwrightPage.getByRole('dialog').getByRole('button', { name: '決定' }).click();
      await expect(playwrightPage.getByRole('dialog').getByRole('region', { name: '作品詳細' })).toContainText(
        'やがてあなたになる',
      );
    } catch (err) {
      throw new Error('作品名の編集ができませんでした', { cause: err });
    }
  }
  {
    try {
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .waitFor();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('region', { name: '作品詳細' })
        .getByRole('button', { name: '編集' })
        .click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('textbox', { name: '概要' })
        .pressSequentially(
          '図書館は、基本的人権のひとつとして知る自由をもつ国民に、資料と施設を提供することをもっとも重要な任務とする。',
        );
      await playwrightPage.getByRole('dialog').getByRole('button', { name: '決定' }).click();
      await expect(playwrightPage.getByRole('dialog').getByRole('region', { name: '作品詳細' })).toContainText(
        '図書館は、基本的人権のひとつとして知る自由をもつ国民に、資料と施設を提供することをもっとも重要な任務とする。',
      );
    } catch (err) {
      throw new Error('作品の概要の編集ができませんでした', { cause: err });
    }
  }
  await flow.endTimespan();
  console.debug('AdminSearchBookEditAction - edit book end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
