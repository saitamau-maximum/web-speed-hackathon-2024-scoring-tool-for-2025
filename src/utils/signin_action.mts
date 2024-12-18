import { setTimeout } from 'node:timers/promises';

import { expect as _expect } from '@playwright/test';
import type * as playwright from 'playwright';

type Params = {
  playwrightPage: playwright.Page;
};

export async function signinAction({ playwrightPage }: Params) {
  const expect = _expect.configure({ timeout: 60 * 1000 });

  try {
    const emailTextbox = playwrightPage.getByRole('textbox', { name: 'メールアドレス' });
    await emailTextbox.pressSequentially('administrator@example.com');
  } catch (err) {
    throw new Error('メールアドレスの入力に失敗しました', { cause: err });
  }
  try {
    const passwordTextbox = playwrightPage.getByRole('textbox', { name: 'パスワード' });
    await passwordTextbox.pressSequentially('pa5sW0rd!');
  } catch (err) {
    throw new Error('パスワードの入力に失敗しました', { cause: err });
  }
  try {
    await setTimeout(10 * 1000);
    const button = playwrightPage.getByRole('button', { name: 'ログイン' });
    await button.click();
    const form = playwrightPage.getByRole('form', { name: 'ログアウト' });
    await expect(form).toBeVisible();
  } catch (err) {
    // ログインに失敗した場合、エラーを出力して処理を続行する
    console.log('ログインに失敗しました', err);
  }
}
