# 財政データ契約

- 作成日: 2026-09-04
- 対象: みらい議会＠沼津市の予算・決算可視化
- 実装計画: [沼津市の予算・決算可視化 実装計画](./20260903_1555_予算決算可視化実装計画.md)

## この文書の範囲

予算・決算可視化の基盤として、DBで保持する安定ID、訂正版、出典、金額の意味と、
公開前の解析候補を確認するstaging契約を定義する。構造化した金額の公開反映、公開API、
公開画面は後続PRで追加する。

共通の取得版・解析履歴は
`20260903231500_add_common_ingestion_audit_foundation.sql`を利用し、財政側で
再定義しない。

## 混同してはいけない軸

| 軸 | 正本 | 例 |
| :-- | :-- | :-- |
| 法定会計 | `fiscal_accounts` | 一般会計、国民健康保険事業特別会計 |
| 集計範囲 | `fiscal_reporting_scopes` | 一般会計、全会計合計、普通会計 |
| 金額イベント | `fiscal_events.event_kind` | 当初予算、補正予算、予算現額、決算 |
| 議決段階 | `fiscal_amount_sets.decision_stage` | 提案、可決、該当なし |
| 公開版 | 各revisionの`publication_state` | draft、reviewed、published、superseded |
| 議会の判断 | `fiscal_event_bill_link_revisions`と`bills` | 可決、認定、不認定 |

普通会計は統計上の集計範囲であり、法定の一般会計とは別物である。
決算額は議会の認定状態が変わっても複製せず、議案リンク側で認定状態を表す。

## 年度と会計

`fiscal_year`は年度が始まる西暦年を整数で保持する。令和8年度は`2026`である。
会計には有効開始年度と終了年度を持たせ、同じ`code`の期間重複と、有効期間外の
membership・eventをDBで拒否する。
会計を持つeventは、同じ年度・集計範囲・会計のmembershipを必須参照とし、
存在しない構成や別集計範囲のmembershipを使った記録を拒否する。
会計期間は通常のアプリケーション操作では変更しない。将来の法的な廃止や期間訂正は、
影響する参照年度を検査し、既存履歴を残す専用migrationでのみ行う。

初期値として次の安定IDを登録する。

- 会計: `general`（一般会計）
- 集計範囲: `general_account`（一般会計）
- 集計範囲: `all_accounts`（公式資料の全会計合計）
- 集計範囲: `ordinary_account`（自治体比較用の普通会計）

## 金額と欠損

正規金額は`bigint`の円単位で保持する。表示用の億円・万円への丸めは保存しない。
APIではJavaScriptの数値精度に依存しないよう10進文字列へ変換する。

- `amount_yen = 0`: 原資料が明示した0円。
- `amount_yen is null`: 値を確定できない状態。`null_reason`を必須にする。
- 負値: 補正減額等の有効な値。欠損にはしない。

欠損理由は`not_published`、`not_applicable`、`unreadable`、`suppressed`、
`unknown_dash`のいずれかとする。

## 版と出典

安定IDには、資料差し替えで変わらない意味だけを置く。値、表示名、QA判断は
revisionまたはobservationへ追記し、公開版を1件だけ選択する。
安定IDとsource occurrenceはUPDATE・DELETE・TRUNCATEを禁止する。最初の基盤PRでは
revision、observation、evidenceも追記専用として凍結し、後続の公開ワークフローPRで
監査対象列を変えずに状態だけを進める専用関数へ置き換える。

出典は次の順にたどれることを必須とする。

```text
正規金額
  -> 金額revision
  -> 原表内の金額出現
  -> 金額セット出典
  -> 資料edition観測
  -> 共通source version
  -> 共通parse run（parser由来の場合）
```

原表記、原単位、ページ・表・セル、円換算値を根拠行に残す。取得URLだけを版IDに
せず、共通source versionのSHA-256と取得日時で差し替えを識別する。
同じsource occurrence・source version・parse run・evidence revisionは別の対象revisionへ
再割当しない。parser再解析は新しいparse run、人手による再解釈は増分したevidence
revisionとして追記する。

## Coverageと年度間分類

`fiscal_data_coverage`は金額の欠損とは別に、資料、membership、金額セット、分類、
年度間mapping、指標、議案リンクが収集対象として存在するかを保持する。
未公表、取得不能、部分取得、解析失敗、確認済み0件を別の観測として追記し、
未確認を0件へ丸めない。nullableな会計と基準日も生成identity keyを介した複合外部キーで
正本・資料内出現・観測・根拠の全階層へ固定する。

分類の原コード・原名称・担当部局は版別根拠へ保存する。年度間の改称、分割、統合、
比較上の同等関係は分類IDへ暗黙に寄せず、`fiscal_classification_mappings`と
そのrevision・member・根拠へ記録する。議案リンクにも資料内出現と版別根拠を持たせ、
候補生成後の手動確定を取得版まで追跡できるようにする。

## 公開とアクセス

財政テーブルはすべてRLSを有効にし、ポリシーを定義しない。公開・管理アクセスは
既存方針どおりサーバー側の`createAdminClient()`を経由する。

parser根拠の公開では、共通registryのconsumer type `fiscal_data`を使用し、保持中の
非公開原本にだけactive referenceを作る。公開版とactive referenceの双方向差分を
遅延constraint triggerで拒否する。財政の各revisionはdraftから開始し、内容と子根拠を
凍結したままreviewed、published、supersededの順方向へだけ遷移できる。
`cross_source`検算をpassedまたはreviewedへ進める場合は、baselineとcomparedを含む
verifiedな別ingestion sourceの根拠を2件以上必須とする。

## 取込staging

`fiscal_import_batches`は一つの取得版・parse run・source profileを固定し、発見件数、
staging件数、hard error・warning件数を保存する。parserの出力は
`fiscal_staging_records`へ資料内の安定キー、fingerprint、変更種別、構造化候補、
検算結果とともに置く。公開用の財政正本はstagingを直接読まない。

初期source profileは、令和6年度の決算概要・主要施策報告と、令和8年度の一般会計・
議会費予算概要の公式PDFを対象とする。PDF原本は公開配布せず、共通の非公開
`source-artifacts` bucketへSHA-256別に保存する。同じ取得版・parser版・profile設定は
再解析せず、hashまたはparser設定が変わった場合は新しいparse runとして追記する。

令和6年度の決算概要parserは、一般会計の歳入・歳出決算額を千円精度の比較用根拠として
抽出する。市政報告書第1章財政parserは、一般会計と議会費の当初予算、予算現額、
歳出決算を円単位で抽出し、本文の一般会計合計および公表執行率と突合する。資料見出し、
列構造、単位、年度のいずれかが想定外ならhard errorとして値の公開反映を止める。
執行率は公表値と円単位金額からの再計算値をvalidation summaryへ併記する。

令和8年度予算概要parserは、一般会計比較表の歳入23款・歳出13款を検算し、
歳入・歳出総額と議会費を千円から円へ変換する。議会費詳細表は款・項・目を重複計上せず、
一般経費と事業費の内訳を検算して比較根拠1件を作る。年度印字のない詳細表は
公式URLに固定したprofileを年度根拠とし、公開前の資料間照合を促すQA警告を残す。
議決結果の確定は後続工程のため、いずれも `decisionStage=proposed` で保持する。
原金額表記と公表構成比・増減率を保持し、列・単位・ページ・集計の不整合はhard errorにする。

管理画面の「財政データQA」は取得版、原本保持状態、parser/profile版、候補数、
検算警告を表示する。QA情報以外のstaging出力は上書きできず、確認済み行も再編集しない。
訂正は新しい取得版またはparse runの候補として追加する。
改訂版の差分は同じsource profileで最後に`applied`となったstagingを基準にし、
`matched_target_id`には直前に適用したstaging record IDを保持する。確定先との接続は
後続の適用ワークフローで別途追跡する。同じ資料内キーが複数候補へ解釈された場合は、全候補値を
`parsed_payload.candidates`へ残し、hard errorとして公開反映を止める。

## 後続PR

1. 財政イベントと議案の候補生成・手動確定を追加する。
2. 検算・人手QAを経て初期基準値を投入する。
3. 公開repository/APIと表中心の`/finance`を追加する。
4. 議案詳細との双方向リンク、グラフ、アクセシビリティE2Eを追加する。
