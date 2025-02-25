# Web Speed Hackathon 2024 Scoring Tool (for 2025 practice)

**"Web Speed Hackathon 2024" は、非常に重たい Web アプリをチューニングして、いかに高速にするかを競う競技です。**

今回のテーマは、架空の漫画サイト「Cyber TOON」です。
「Cyber TOON」のパフォーマンスを改善してください。

- 課題レポジトリ: <https://github.com/CyberAgentHack/web-speed-hackathon-2024>

## 開催期間

2025/03/01 10:00 JST - 2025/03/20 23:59 JST

## 参加登録

### リポジトリ準備

まず、 GitHub 上で新しくリポジトリを作ってください。
開催期間中は Private にして終了後 Public にしてもらったほうが良いですが、強制はしません。
以下、 `wsh2024-practice-2025` という名前で作成したと仮定します。

次に、上記課題レポジトリを clone しましょう。

```bash
git clone https://github.com/CyberAgentHack/web-speed-hackathon-2024.git
```

`web-speed-hackathon-2024` ディレクトリが生成されるはずです。
`git remote` を変更するための以下のコマンドを実行します。
適宜新しく作り変えたレポジトリ名に変更してください。

```bash
cd web-speed-hackathon-2024
git remote set-url origin https://github.com/<username>/<repo>.git
# 例: https://github.com/a01sa01to/wsh2024-practice-2025.git
```

念のため、リモートリポジトリが変更されたか確認しておきます。

```bash
git remote -v
# どちらも以下のような表示になれば OK
# origin  https://github.com/<username>/<repo>.git
```

最後に、リモートリポジトリに push します。

```bash
git push origin main
```

以下の表示が出ても無視で大丈夫です。

```plaintext
remote: warning: See https://gh.io/lfs for more information.
remote: warning: File workspaces/server/seeds/episodePage.json is 73.36 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB
remote: warning: File workspaces/server/seeds/database.sqlite is 78.79 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB
remote: warning: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
```

これで、リポジトリの準備が整いました。

### 開発方法

課題リポジトリの README を参照してください。

### デプロイ方法

Koyeb にデプロイする場合を例に説明します。
`docs/deployment.md` に書かれてはいますが、 UI が変わってしまっているため、以下の手順を参考にしてください。

(該当者のみ)
Free に収めたい場合は、 Koyeb 上で wsh2023 のインスタンスをまず消してから試してみてください (リポジトリは消す必要はありません)

1. Koyeb にログインし、左サイドバーの Create Service をクリック
2. Web service -> GitHub
3. (もし表示されている場合は) Install GitHub App をクリックして GitHub と連携
4. リポジトリを選択
5. Free にしておく　 Region はなんでも
6. Builder に Dockerfile を指定
7. Exposed ports は `8000` を指定

これで Deploy 押してしばらくすると完了していると思います

### 計測

デプロイできたら、次のリンクから参加登録してください。

<https://github.com/saitamau-maximum/web-speed-hackathon-2024-scoring-tool-for-2025/issues/new/choose>

## リーダーボード

<!-- leaderboard:start -->
<!-- leaderboard:end -->

---

Forked from [CyberAgentHack/web-speed-hackathon-2024-scoring-tool](https://github.com/CyberAgentHack/web-speed-hackathon-2024-scoring-tool).
