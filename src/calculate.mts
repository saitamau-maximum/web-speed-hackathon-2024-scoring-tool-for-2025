import { setTimeout } from 'node:timers/promises';

import mergeErrorCause from 'merge-error-cause';
import * as playwright from 'playwright';

import { calculateAdminCreateEpisodeAction } from './scoring/calculate_admin_create_episode_action.mjs';
import { calculateAdminEditBookAction } from './scoring/calculate_admin_edit_book_action.mjs';
import { calculateAdminSigninAction } from './scoring/calculate_admin_signin_action.mjs';
import { calculateAuthorPage } from './scoring/calculate_author_page.mjs';
import { calculateBookPage } from './scoring/calculate_book_page.mjs';
import { calculateEpisodePage } from './scoring/calculate_episode_page.mjs';
import { calculateHomePage } from './scoring/calculate_home_page.mjs';
import { calculateOpenTermModal } from './scoring/calculate_open_term_modal_action.mjs';
import { calculateScrollComicViewerAction } from './scoring/calculate_scroll_comic_viewer_action.mjs';
import { calculateSearchBookAction } from './scoring/calculate_search_book_action.mjs';
import { createPage } from './utils/create_page.mjs';

const TARGET_LIST = [
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateHomePage,
    maxScore: 100,
    name: '[App] ホームを開く',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateAuthorPage,
    maxScore: 100,
    name: '[App] 作者詳細を開く',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateBookPage,
    maxScore: 100,
    name: '[App] 作品詳細を開く',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateEpisodePage,
    maxScore: 100,
    name: '[App] エピソード詳細を開く',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateSearchBookAction,
    maxScore: 50,
    name: '[App] 作品を検索する',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateScrollComicViewerAction,
    maxScore: 50,
    name: '[App] 漫画をスクロールして読む',
  },
  {
    device: playwright.devices['iPhone 14 Pro Max'],
    func: calculateOpenTermModal,
    maxScore: 50,
    name: '[App] 利用規約を開く',
  },
  {
    device: playwright.devices['Desktop Chrome HiDPI'],
    func: calculateAdminSigninAction,
    maxScore: 50,
    name: '[Admin] ログインする',
  },
  {
    device: playwright.devices['Desktop Chrome HiDPI'],
    func: calculateAdminEditBookAction,
    maxScore: 50,
    name: '[Admin] 作品の情報を編集する',
  },
  {
    device: playwright.devices['Desktop Chrome HiDPI'],
    func: calculateAdminCreateEpisodeAction,
    maxScore: 50,
    name: '[Admin] 作品に新しいエピソードを追加する',
  },
];

type Params = {
  baseUrl: string;
};

export async function* calculate({ baseUrl }: Params) {
  for (const target of TARGET_LIST) {
    const { playwrightContext, playwrightPage, puppeteerPage } = await createPage({
      device: target.device,
    });

    try {
      try {
        const res = await fetch(new URL('/api/v1/initialize', baseUrl), { method: 'POST' });
        if (!res.ok) {
          throw new Error(`Initialize error: ${res.status}`);
        }
      } catch {
        throw new Error('初期化 API `/api/v1/initialize` にアクセスできません');
      }

      const { audits, scoreX100 } = await target.func({ baseUrl, playwrightPage, puppeteerPage });
      yield { audits, scoreX100, target };
    } catch (err) {
      console.error(mergeErrorCause(err));
      yield { audits: null, error: err as Error, scoreX100: Number.NaN, target };
    } finally {
      await playwrightContext.close();
    }

    // サーバー負荷が落ち着くまで、30秒待つ
    await setTimeout(30 * 1000);
  }
}
