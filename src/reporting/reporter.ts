import { stripIndents } from 'common-tags';

type AreaKey = 'scoreTable' | 'errorList' | 'result' | 'fatalError';

type Options = {
  github: typeof import('@actions/github');
  octokit: ReturnType<typeof import('@actions/github').getOctokit>;
};

export class Reporter {
  private _options: Options;
  private _commentId: number | null = null;
  private _state = new Map<AreaKey, string[]>();

  constructor(options: Options) {
    this._options = options;
  }

  setArea(key: AreaKey, value: string) {
    this._state.set(key, [value]);
    return this._update();
  }

  appendArea(key: AreaKey, value: string) {
    const current = this._state.get(key) ?? [];
    this._state.set(key, [...current, value]);
    return this._update();
  }

  async init() {
    const { github, octokit } = this._options;

    await octokit.rest.issues.update({
      issue_number: github.context.payload.issue!.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: `[スコア] @${github.context.payload.issue!['user'].login}`,
    });

    await this._update();
  }

  private get _body(): string {
    if (this._state.has('fatalError')) {
      return stripIndents`
        # 🚀 **Web Speed Hackathon 2024 過去問へようこそ！**

        ${this._state.get('fatalError')?.join('\n') ?? ''}

        ---

        ℹ️ もう一度計測する場合は、 \`/retry\` とコメントしてください
      `;
    }

    if (this._state.has('result')) {
      return stripIndents`
        # 🚀 **Web Speed Hackathon 2024 過去問へようこそ！**

        ### スコア

        ${this._state.get('scoreTable')?.join('\n') ?? ''}

        ${this._state.get('result')?.join('\n') ?? ''}

        ### 計測できなかった原因

        ${this._state.get('errorList')?.join('\n') ?? '問題なく計測されました'}

        ---

        ℹ️ もう一度計測する場合は、 \`/retry\` とコメントしてください
      `;
    }

    return stripIndents`
      # 🚀 **Web Speed Hackathon 2024 過去問へようこそ！**

      ### スコア

      ${this._state.get('scoreTable')?.join('\n') ?? '⏳ 計測しています...'}

      ${this._state.get('result')?.join('\n') ?? ''}

      ### 計測できなかった原因

      ${this._state.get('errorList')?.join('\n') ?? '⏳ 順調に計測が進んでいます'}

      ---

      ⏳ 計測しています...
      ⚠️ 計測には最大 20 分かかります、計測中はデプロイしないでください
    `;
  }

  private async _update() {
    const { github, octokit } = this._options;

    if (this._commentId == null) {
      const { data: comment } = await octokit.rest.issues.createComment({
        body: this._body,
        issue_number: github.context.payload.issue!.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      });
      this._commentId = comment.id;
    } else {
      await octokit.rest.issues.updateComment({
        body: this._body,
        comment_id: this._commentId,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      });
    }
  }
}
