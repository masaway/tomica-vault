# Supabase CLI 使い方ガイド

## 概要
Supabase CLIは、Supabaseプロジェクトの管理、ローカル開発、データベースマイグレーション、Edge Functionsの開発・デプロイを行うためのコマンドラインツールです。

## インストール方法

### 推奨インストール方法

#### macOS (Homebrew)
```bash
# 安定版のインストール
brew install supabase/tap/supabase

# アップグレード
brew upgrade supabase

# ベータ版のインストール
brew install supabase/tap/supabase-beta
brew link --overwrite supabase-beta
```

#### Linux (Homebrew)
```bash
# Homebrewを使用（推奨）
brew install supabase/tap/supabase
brew upgrade supabase
```

#### Windows (Scoop)
```powershell
# Supabaseバケットを追加
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# インストール
scoop install supabase

# アップグレード
scoop update supabase
```

### その他のインストール方法

#### Go経由でのインストール
```bash
# Go 1.22以上が必要
go install github.com/supabase/cli@latest

# シンボリックリンクを作成（オプション）
ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
```

#### npm/yarn経由（開発依存関係として）
```bash
# npm
npm i supabase --save-dev

# yarn
npm i supabase@beta --save-dev

# yarn 4の場合（実験的fetchを無効化）
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

**注意**: npmでのグローバルインストール（`npm install -g supabase`）は公式にサポートされていません。

#### Linuxパッケージマネージャー
```bash
# APK（Alpine Linux）
sudo apk add --allow-untrusted <...>.apk

# DEB（Debian/Ubuntu）
sudo dpkg -i <...>.deb

# RPM（Red Hat/CentOS）
sudo rpm -i <...>.rpm

# Pacman（Arch Linux）
sudo pacman -U <...>.pkg.tar.zst
```

#### pkgx経由
```bash
pkgx install supabase
```

#### ソースからの実行
```bash
# Go 1.22以上が必要
go run . help
```

## 基本コマンド

### プロジェクト初期化

#### 新規プロジェクトの作成
```bash
# 対話式のプロジェクト作成
supabase bootstrap

# またはnpx経由
npx supabase bootstrap
```

#### 既存プロジェクトの初期化
```bash
# カレントディレクトリでSupabaseプロジェクトを初期化
supabase init
```

### ローカル開発環境

#### 開発サーバーの起動
```bash
# 全サービスを起動
supabase start

# 特定サービスを除外して起動
supabase start -x gotrue,storage-api,imgproxy
```

#### 開発サーバーの停止
```bash
supabase stop
```

## データベース管理

### マイグレーション

#### マイグレーション一覧の確認
```bash
supabase migration list
```

出力例：
```
        LOCAL      │     REMOTE     │     TIME (UTC)
  ─────────────────┼────────────────┼──────────────────────
    20240414044403 │ 20240414044403 │ 2024-04-14 04:44:03
```

#### リモートスキーマの取得
```bash
# リモートスキーマを新しいマイグレーションファイルとして取得
supabase db pull
```

#### マイグレーション履歴の修復
```bash
# 特定マイグレーションを「取り消し」としてマーク
supabase migration repair 20230103054303 --status reverted
```

### TypeScript型の生成
```bash
# Supabaseスキーマから型定義を生成
npm run generate-types
```

## Edge Functions

### 新しい関数の作成
```bash
# 新しいEdge Functionを作成
supabase functions new <function-name>
```

### ローカルでの実行
```bash
# 関数をローカルで実行
supabase functions serve
```

### デプロイ
```bash
# 関数をSupabaseにデプロイ
supabase functions deploy
```

### デバッグオプション
```bash
# インスペクターを有効にして実行
supabase functions serve --inspect

# ブレークポイントで停止
supabase functions serve --inspect-mode brk

# インスペクター接続を待機
supabase functions serve --inspect-mode wait

# メインワーカーのインスペクションを許可
supabase functions serve --inspect-main
```

## データベース診断・監視コマンド

### パフォーマンス分析

#### クエリパフォーマンス
```bash
# 最も時間のかかっているクエリ
supabase inspect db-outliers

# 最も呼び出し回数の多いクエリ
supabase inspect db-calls

# 長時間実行されているクエリ
supabase inspect db-long-running-queries
```

#### インデックス分析
```bash
# インデックス使用率
supabase inspect db-index-usage

# 未使用インデックス
supabase inspect db-unused-indexes

# インデックスサイズ
supabase inspect db-index-sizes

# テーブルインデックスサイズ
supabase inspect db-table-index-sizes

# 総インデックスサイズ
supabase inspect db-total-index-size
```

#### テーブル分析
```bash
# テーブルサイズ
supabase inspect db-table-sizes

# 総テーブルサイズ
supabase inspect db-total-table-sizes

# テーブル行数（推定）
supabase inspect db-table-record-counts

# シーケンシャルスキャン回数
supabase inspect db-seq-scans
```

### データベース統計

#### キャッシュ効率
```bash
# キャッシュヒット率
supabase inspect db-cache-hit
```

出力例：
```
         NAME      │  RATIO
  ─────────────────┼───────────────
    index hit rate │ 0.996621
    table hit rate │ 0.999341
```

#### ロック・ブロッキング
```bash
# ブロッキングクエリ
supabase inspect db-blocking

# データベースロック
supabase inspect db-locks
```

#### 接続・レプリケーション
```bash
# ロール別接続数
supabase inspect db-role-connections

# レプリケーションスロット
supabase inspect db-replication-slots
```

#### データベース状態
```bash
# バキューム統計
supabase inspect db-vacuum-stats

# データベースbloat
supabase inspect db-bloat
```

### 問題解決コマンド

#### PostgreSQLクエリの管理
```sql
-- ハングしたクエリのキャンセル
SELECT pg_cancel_backend(PID);

-- プロセスの強制終了
SELECT pg_terminate_backend(PID);
```

## 設定とカスタマイズ

### config.toml設定

#### Edge Runtime設定
```toml
[edge_runtime]
# インスペクターポート
inspector_port = 8083

# HTTPリクエスト転送ポリシー
policy = "per_worker"  # または "oneshot"
```

### 環境変数
```bash
# プロジェクト設定
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_ACCESS_TOKEN="your-access-token"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# PostgreSQL接続（マイグレーション用）
export PGHOST="db.your-project.supabase.co"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASS="your-password"
export PGDATABASE="postgres"
```

## プロジェクト例

### 関数のデプロイ例
```bash
# supabase/functions/ ディレクトリに関数を配置
export SUPABASE_PROJECT_ID="zeoxvqpvpyrxygmmatng"
export SUPABASE_ACCESS_TOKEN="sbp_..."
go run examples/deploy-functions/main.go
```

### データベースマイグレーション例
```bash
# supabase/migrations/ ディレクトリにスキーマを配置
export PGHOST="db.zeoxvqpvpyrxygmmatng.supabase.co"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASS="your-password"
export PGDATABASE="postgres"
go run examples/migrate-database/main.go
```

## WSL2環境での注意点

### 推奨インストール方法
WSL2環境では以下の方法を推奨：
1. Homebrew for Linux
2. Go経由でのインストール
3. 直接バイナリのダウンロード

### 避けるべき方法
- `npm install -g supabase`（公式未サポート）

## トラブルシューティング

### よくある問題

#### npmグローバルインストールエラー
```bash
npm error Installing Supabase CLI as a global module is not supported.
```

**解決策**: 上記の推奨インストール方法を使用してください。

#### 接続エラー
- 環境変数が正しく設定されているか確認
- ネットワーク接続を確認
- プロジェクトIDとトークンが有効か確認

#### マイグレーション同期エラー
```bash
# マイグレーション履歴の確認
supabase migration list

# 必要に応じて修復
supabase migration repair <migration-id> --status applied
```

## 開発ワークフロー

### 推奨ワークフロー
1. **プロジェクト初期化**: `supabase init`
2. **ローカル開発開始**: `supabase start`
3. **データベース変更**: マイグレーションファイル作成
4. **型生成**: `npm run generate-types`
5. **関数開発**: `supabase functions new` → `supabase functions serve`
6. **テスト**: ローカル環境でテスト
7. **デプロイ**: `supabase functions deploy`

### コード品質チェック
```bash
# Go テストの実行
go test ./... -race -v -count=1 -failfast
```

## 参考リンク
- [Supabase CLI 公式ドキュメント](https://github.com/supabase/cli)
- [Supabase 公式サイト](https://supabase.com)
- [インストール方法詳細](https://github.com/supabase/cli#install-the-cli)

## まとめ
Supabase CLIは強力な開発ツールで、ローカル開発からプロダクション環境での運用まで幅広くサポートしています。npmでのグローバルインストールは避け、公式推奨の方法でインストールすることが重要です。