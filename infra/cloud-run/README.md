# Cloud Run 実行基盤プロビジョニング（コード化）

議会データ取り込み・トピック分析・意見再抽出を実行する **Cloud Run Job** のGCPリソースを、
冪等な gcloud スクリプト [`provision.sh`](./provision.sh) で構築する。

手順の背景・各リソースの意味は
[docs/20260609_1230_トピック分析CloudRunプロビジョニング手順.md](../../docs/20260609_1230_トピック分析CloudRunプロビジョニング手順.md)
を参照（このスクリプトは同手順をコード化したもの）。

## 何を作るか

| リソース | 内容 |
| --- | --- |
| API | run / artifactregistry / secretmanager / cloudscheduler / logging / monitoring を有効化 |
| Artifact Registry | docker リポジトリ（既定 `topic-analysis`） |
| Secret Manager | `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `AI_GATEWAY_API_KEY` / `OPENAI_API_KEY` に **環境サフィックス**を付けたもの（例 `SUPABASE_URL_STAGING`）。**コンテナのみ**・値は別途 |
| SA: runtime | Job 実行用。secret 読み取り権限 |
| SA: invoker | admin が `jobs:run` を呼ぶ用。custom invoker role + runtime への actAs |
| SA: scheduler | Cloud Scheduler が `jobs:run` を呼ぶ用。custom invoker role + runtime への actAs（**鍵は発行しない**） |
| SA: deployer | CI（`deploy_worker.yml`）用。AR writer + run.developer + actAs + Worker用Supabase secretのversion管理（値の読み取り不可） |
| Cloud Run Job | `topic-analysis-worker-<DEPLOY_ENV>`（batch 向け設定）。**無ければ作成**、以後の image 更新は CI |
| Cloud Scheduler | 分析用1件と、軽量・会議録取り込み用2件を**作成 or 設定更新**（冪等） |
| Cloud Monitoring | 取り込み失敗と、各取り込み系統で所定時間成功がない状態のalert policy |

## 環境（staging / production）の分離

Secret Manager は **プロジェクトでグローバル（名前が一意）** なため、同一プロジェクトに
複数環境を置く場合は **Secret 名と Job 名を環境ごとに分離**する必要がある。
本スクリプトは必須の `DEPLOY_ENV`（例 `staging` / `production`）から自動で分離する。

- Secret 名: `SUPABASE_URL` → `SUPABASE_URL_<DEPLOY_ENV 大文字>`（例 `SUPABASE_URL_STAGING`）
- Job 名（既定）: `topic-analysis-worker-<DEPLOY_ENV>`
- worker が読む **環境変数名は固定**（`SUPABASE_URL` 等）。Job の `--set-secrets` が
  「`SUPABASE_URL=SUPABASE_URL_STAGING:latest`」のように環境別 Secret へマッピングする。

> ⚠️ `DEPLOY_ENV` を指定しないとエラーで停止する（環境を跨いで Secret を上書きする事故を防ぐため）。

**CI（`deploy_worker.yml`）との対応**: ワークフローは `main`→`topic-analysis-worker-production` /
`develop`→`topic-analysis-worker-staging` を既定 Job 名として更新する。provision 時に別名の Job を
作った場合は、各 GitHub Environment の Secret `GCP_TOPIC_ANALYSIS_JOB` を**その Job 名に合わせて**設定すること
（不一致だと `gcloud run jobs update` が `NOT_FOUND` で失敗する）。

`main`のWorkerデプロイでは、Vercel Web production環境の
`NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY`を正本として、対応するGCP Secretへ
新しいversionを追加し、2つのversionをCloud Run Jobへまとめて固定する。途中失敗時は
Jobを旧ペアへ戻してから新versionを無効化するため、URLとkeyの片方だけが切り替わる
ことはない。成功時は現行と直前の2世代だけを有効なまま保持する。これによりWebとWorkerの
接続先がずれることを防ぐ。GitHubの
production Environmentには`VERCEL_TOKEN` / `VERCEL_ORG_ID` /
`VERCEL_PROJECT_ID_WEB`も設定する。

Secret名を`SECRET_SUFFIX`等で変更した環境では、GitHub Environment variablesの
`GCP_SUPABASE_URL_SECRET` / `GCP_SUPABASE_SECRET_KEY_SECRET`に実際の名前を設定する。
`workflow_dispatch`をmain branchで実行すれば、Vercel側の値だけを変更した場合も
Workerの再デプロイとSecret再同期を明示的に行える。

**サービスアカウントの分離（任意）**: 既定では runtime / invoker / deployer SA は環境間で**共有**される
（runtime SA は `*_STAGING` と `*_PRODUCTION` の両 Secret にアクセス可能）。環境ごとに IAM を完全分離したい場合は
`RUNTIME_SA_NAME` / `INVOKER_SA_NAME` / `DEPLOYER_SA_NAME` を環境別の名前（例 `topic-analysis-runtime-staging`）で
上書きして実行する。

## 前提

- `gcloud` と `jq` がインストール済みで、`gcloud auth login` によりプロジェクトへの
  権限がある。
- 初回 Job 作成でイメージをビルドする場合は `docker` が必要（`WORKER_IMAGE` を渡せば不要）。

## 使い方

```bash
# 1. 設定（実値は config.env に。config.env* は gitignore 済み）
cp infra/cloud-run/config.example.env infra/cloud-run/config.env
$EDITOR infra/cloud-run/config.env        # GCP_PROJECT_ID と DEPLOY_ENV は必須

# 2. 実行（冪等。何度実行しても安全）
bash infra/cloud-run/provision.sh
```

環境を分けて運用する場合は、環境別の設定ファイルを `CONFIG_FILE` で指定する（いずれも gitignore 対象）:

```bash
cp infra/cloud-run/config.example.env infra/cloud-run/config.env.staging      # DEPLOY_ENV=staging + staging 値
cp infra/cloud-run/config.example.env infra/cloud-run/config.env.production    # DEPLOY_ENV=production + 本番値

CONFIG_FILE=infra/cloud-run/config.env.staging    bash infra/cloud-run/provision.sh
CONFIG_FILE=infra/cloud-run/config.env.production bash infra/cloud-run/provision.sh
```

## OSS・セキュリティ上の約束

- **project ID・secret 値・SA キーはコミットしない**。すべて `config.env`（gitignore 済み）や
  env 経由で注入する。スクリプト本体には汎用のリソース名のデフォルトしか書かない。
- **secret の値**は既定では投入しない（空コンテナだけ作る）。一括投入したい場合のみ
  `SECRET_VALUE_<NAME>` を `config.env` に設定する。
- **SA キーの発行**は既定で無効。`GENERATE_KEYS=1` のときだけ発行し、Vercel/GitHub へ登録後に
  ローカルの鍵ファイル（`*-key.json`・gitignore 済み）を必ず削除する。

## 定期実行（Cloud Scheduler）

次の3つのCloud Schedulerジョブを作成する。

| ジョブ | 既定スケジュール | worker引数 |
| --- | --- | --- |
| トピック分析 | 毎日6:00 JST | `--mode=analyze-all` |
| 会期・提出議案 | 毎日6:30・18:30 JST | `--mode=ingest --target=frequent` |
| 議決結果・会議録・AmiVoice・AIタグ付け | 毎日20:30 JST | `--mode=maintain-bills` |

取り込みは負荷に応じて2系統に分ける。`frequent`は会期予定、開会中の提出議案と
議案本文リンク、開会中ページの議事報告（委員会付託・委員会審査の結果）を6:30と18:30に
取得し、`daily`は期の索引にある議案審議結果、会議録、AmiVoiceを20:30に取得し、
未分類の議案を既存のテーマ定義に基づいてAIでタグ付けする。
全結果PDFの走査とテキスト化、AIタグ付けは1日1回に限定する。
新しい議案は`draft`で作成し、自動公開しない。管理画面で内容を確認して公開状態を変更する。
取得元の内容ハッシュが同じ場合は解析・DB更新を省略する。

既存議案を同じAI基準で再分類する初回バックフィルは、workerイメージ更新後に
Cloud Run Jobを`--mode=bill-tags --force`で一度だけ手動実行する。通常実行ではタグが
未設定の議案だけを対象にするため、日次処理が既存の分類を毎回上書きすることはない。

分析用は`SCHEDULER_*`、軽量取り込み用は`INGEST_SCHEDULER_*`、会議録取り込み用は
`INGEST_DAILY_SCHEDULER_*`で時刻・タイムゾーン・一時停止を個別に調整する
（`config.example.env`参照）。いずれも失敗時は1回だけ再試行する。

プロビジョニングはCloud Run Jobの実行失敗、取り込みSchedulerの起動失敗、軽量系統で
23時間30分、日次系統で25時間成功がない状態を検知するCloud Monitoring alert policyも
作成・更新する。日次系統は毎日20:30の実行間隔より長い25時間で判定し、定刻どおりの
成功を誤検知しない。通常のmetric-absenceは23時間30分が上限のため、日次系統だけは
25時間を扱えるPromQLの`absent_over_time`を使用する。productionでは通知先となる
`MONITORING_NOTIFICATION_CHANNELS`が必須であり、未設定なら処理を停止する。
設計の背景・動作確認・運用は
[docs/20260715_1043_トピック分析スケジューラー化.md](../../docs/20260715_1043_トピック分析スケジューラー化.md)
を参照。

## 冪等性

- 既存リソースは `describe` で検知して skip（API 有効化・IAM binding は元来冪等）。
- Cloud Run Job は「無ければ作成」のみ。**イメージ差し替えは CI（`deploy_worker.yml`）**が担うため、
  既存 Job には触れない。
- Cloud Scheduler は provision.sh が設定のオーナー。既存なら **設定を更新**し、
  有効/一時停止も各Schedulerの設定値に揃える。

## 運用確認

プロビジョニング後は、取り込みジョブを手動実行し、Cloud RunとDBの両方を確認する。

```bash
gcloud scheduler jobs run "numazu-ingest-cron-${DEPLOY_ENV}" \
  --location "$GCP_REGION" \
  --project "$GCP_PROJECT_ID"

gcloud scheduler jobs run "numazu-ingest-daily-cron-${DEPLOY_ENV}" \
  --location "$GCP_REGION" \
  --project "$GCP_PROJECT_ID"

gcloud run jobs executions list \
  --job "topic-analysis-worker-${DEPLOY_ENV}" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --limit 5
```

DBでは`ingestion_runs.source = 'frequent'`と`'daily'`の最新行が`completed`であること、
`frequent`の`stats.currentBills.billCount`が公式ページの提出議案件数と一致することを
確認する。内容に変更がなく`skipped = true`の場合も、解析した掲載件数を`billCount`に返す。
あわせて`frequent`の`stats.sessionProgress`を見て、`reportCount`が議事報告の公開件数と
一致し、委員会審査の結果が公開されていれば`referredCount`/`committeeResultCount`が
動いていることを確認する。この2つは累計ではなく、その実行で新しく書き込んだ件数である。
すでに同じ状態が入っている間は0のままで、`skipped = true`のときも0になる。
提出議案が0件または一部でも解析不能ならジョブを失敗させるため、Cloud Run Job失敗の
alertで検知される。Schedulerの認証・起動失敗は別のalert、軽量系統で23時間30分、
日次系統で25時間成功がなければ対応するabsence alertで通知される。

## 関連

- イメージの build/push と Job 更新の CI: [`.github/workflows/deploy_worker.yml`](../../.github/workflows/deploy_worker.yml)
- worker 本体: [`worker/`](../../worker)
