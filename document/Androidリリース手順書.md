# Androidリリース手順書

## 概要
おもちゃパトロールアプリのAndroidリリースまでの完全な手順書です。開発完了からGoogle Play Storeでの公開まで、すべてのステップを網羅しています。

## 目次
1. [リリース前チェックリスト](#リリース前チェックリスト)
2. [ビルド設定確認](#ビルド設定確認)
3. [本番ビルド手順](#本番ビルド手順)
4. [Google Play Console準備](#google-play-console準備)
5. [リリース後対応](#リリース後対応)
6. [トラブルシューティング](#トラブルシューティング)

---

## リリース前チェックリスト

### 1. コード品質確認
```bash
# プロジェクトディレクトリに移動
cd /home/yoshiaki/work/tomica-vault/tomica-vault-app

# Lintチェック実行
npm run lint

# TypeScript型チェック
npx tsc --noEmit

# テスト実行（テストがある場合）
npm test
```

### 2. 機能テスト
- [ ] すべての主要機能が正常動作
- [ ] NFCタグの読み取り/書き込み
- [ ] データベース操作（CRUD）
- [ ] トミカのチェックイン/チェックアウト
- [ ] 検索機能
- [ ] ダッシュボード統計表示
- [ ] ダークモード/ライトモード切り替え

### 3. バージョン管理
- [ ] `app.json`のversionを更新
- [ ] 変更履歴の記録
- [ ] プライバシーポリシーの更新（必要に応じて）

### 4. 環境設定確認
```bash
# 環境変数の確認
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# EAS CLIの確認
npx eas --version
```

---

## ビルド設定確認

### EAS Build設定（eas.json）

**現在の設定**:
```json
{
  "cli": {
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### アプリ設定（app.json）

**重要な設定項目**:
- **アプリ名**: "おもちゃパトロール"
- **パッケージ名**: `com.masaway2525.tomicavaultapp`
- **バージョン**: "1.0.0"
- **プロジェクトID**: `2cd809a6-7f93-4d86-a4e1-92fa70e1a1dc`

---

## 本番ビルド手順

### 1. プリビルド確認
```bash
# Androidプロジェクトの事前ビルド
npx expo prebuild --platform android --clear

# 生成されたAndroidプロジェクトの確認
ls -la android/
```

### 2. 本番ビルド実行
```bash
# EAS Buildでプロダクションビルド（app-bundle形式）
npx eas build --platform android --profile production

# ビルド進行状況の確認
npx eas build:list

# ビルド詳細の確認
npx eas build:view [BUILD_ID]
```

### 3. ローカルビルド（代替手順）
```bash
# ローカルでのプロダクションビルド
npx eas build --platform android --profile production --local

# 生成されたAABファイルの確認
ls -la *.aab
```

### 4. ビルド成果物の確認
- **AAB（Android App Bundle）ファイル**がGoogle Play Store用
- **APKファイル**は内部テスト・配布用
- ビルドログでエラーがないことを確認

---

## Google Play Console準備

### 1. Google Play Console設定

#### アプリ基本情報
- **アプリ名**: おもちゃパトロール
- **パッケージ名**: `com.masaway2525.tomicavaultapp`
- **カテゴリ**: ライフスタイル / ツール
- **対象年齢**: 全年齢対象
- **連絡先情報**: 開発者メールアドレス

#### アプリの説明
```markdown
【短い説明】
NFCタグでトミカの管理ができる子ども向けアプリ

【詳しい説明】
おもちゃパトロールは、NFCタグを使ってトミカの管理を楽しく行えるアプリです。

主な機能：
• NFCタグでトミカのチェックイン/チェックアウト
• コレクションの統計表示
• トミカの検索・一覧表示
• 家出中（48時間以上外出）の自動検知
• 子ども向けの直感的なUI

対象年齢：3歳以上
```

### 2. 必要な素材準備

#### アプリアイコン
- **512x512px**: Google Play Store用
- **現在**: `./assets/images/icon.png`

#### スクリーンショット
**必要な画面**:
- ダッシュボード画面
- トミカ一覧画面
- NFC読み取り画面
- 詳細画面
- 設定画面

**サイズ要件**:
- 最小: 320px
- 最大: 3840px
- アスペクト比: 16:9 または 9:16

#### フィーチャーグラフィック
- **サイズ**: 1024x500px
- Google Play Storeのトップに表示される画像

### 3. プライバシーポリシー

**必要な記載事項**:
- 収集するデータの種類
- データの使用目的
- サードパーティサービス（Supabase）
- 子ども向けアプリの注意事項
- 連絡先情報

### 4. アプリの権限

**使用している権限**:
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.NFC"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

**権限の説明**:
- `NFC`: NFCタグの読み取り・書き込み
- `INTERNET`: Supabaseとの通信
- `VIBRATE`: フィードバック機能

---

## リリース手順（詳細）

### Phase 1: 最終確認とビルド

1. **バージョン更新**
   ```bash
   # app.jsonのバージョンを更新
   # "version": "1.0.0" → "1.1.0" (例)
   ```

2. **最終テスト**
   ```bash
   # 実機でのテスト実行
   npx expo run:android --device
   
   # 機能テストの実施
   # - NFC機能
   # - データベース操作
   # - UI/UX確認
   ```

3. **プロダクションビルド**
   ```bash
   # AABファイルの生成
   npx eas build --platform android --profile production
   
   # ビルド完了まで待機（通常10-20分）
   npx eas build:view [BUILD_ID]
   ```

### Phase 2: Google Play Console設定

1. **新しいリリースの作成**
   - Google Play Console → アプリ → リリース → 本番環境
   - 「新しいリリースを作成」をクリック

2. **AABファイルのアップロード**
   - EAS Buildで生成されたAABファイルをダウンロード
   - Google Play Consoleにアップロード

3. **リリースノートの記入**
   ```markdown
   バージョン 1.0.0
   
   • NFCタグを使ったトミカ管理機能
   • ダッシュボードでの統計表示
   • 検索・一覧表示機能
   • 家出中トミカの自動検知
   ```

### Phase 3: 審査とリリース

1. **審査提出前の最終確認**
   - [ ] プライバシーポリシーURL設定
   - [ ] アプリの説明文
   - [ ] スクリーンショット（5枚以上）
   - [ ] フィーチャーグラフィック
   - [ ] 対象年齢の設定

2. **審査提出**
   - 「審査に送信」ボタンをクリック
   - 審査期間: 通常1-3日

3. **リリース**
   - 審査承認後、「リリース」をクリック
   - 段階的ロールアウト（推奨：20% → 50% → 100%）

---

## リリース後対応

### 1. 監視体制
```bash
# EAS Build履歴の確認
npx eas build:list --limit 10

# 使用状況の監視
# Google Play Console → 統計情報で確認
```

### 2. フィードバック対応
- Google Play Consoleのレビュー監視
- クラッシュレポートの確認
- ユーザーフィードバックの収集

### 3. アップデート手順
```bash
# バージョンアップ時
# 1. app.jsonのバージョン更新
# 2. 変更内容のテスト
# 3. 新しいビルド作成
npx eas build --platform android --profile production

# 4. Google Play Consoleで新リリース作成
```

---

## トラブルシューティング

### ビルドエラー

#### 署名エラー
```bash
# 認証情報の確認
npx eas credentials

# 新しいキーストアの生成
npx eas credentials --platform android
```

#### 依存関係エラー
```bash
# node_modulesのクリーンインストール
rm -rf node_modules package-lock.json
npm install

# キャッシュクリア
npx expo r -c
```

### Google Play Console関連

#### 「アプリが見つかりません」エラー
- パッケージ名の確認
- 署名証明書の確認
- ビルド設定の見直し

#### 審査拒否の対応
- 拒否理由の詳細確認
- 必要な修正の実施
- 再審査の提出

---

## 重要なファイル・設定

### 設定ファイル
- `eas.json`: EAS Build設定
- `app.json`: アプリ基本設定
- `android/app/src/main/AndroidManifest.xml`: 権限設定

### 認証関連
- `credentials.json`: ローカル認証情報
- Google Play Console: アプリ署名設定

### 環境変数
```bash
# 必須の環境変数
EXPO_PUBLIC_SUPABASE_URL=https://dacspxbsjipzwebnrzcy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

---

## チェックリスト（リリース時）

### リリース前
- [ ] コードレビュー完了
- [ ] 全機能のテスト完了
- [ ] パフォーマンステスト完了
- [ ] バージョン番号更新
- [ ] 変更履歴作成
- [ ] プライバシーポリシー更新

### ビルド
- [ ] プロダクションビルド成功
- [ ] AABファイル生成確認
- [ ] ビルドサイズ確認
- [ ] 署名証明書確認

### Google Play Console
- [ ] アプリ情報入力完了
- [ ] スクリーンショット5枚以上
- [ ] フィーチャーグラフィック設定
- [ ] プライバシーポリシーURL設定
- [ ] 対象年齢設定
- [ ] コンテンツレーティング取得

### リリース後
- [ ] ストアでの表示確認
- [ ] インストール・起動テスト
- [ ] クラッシュレポート監視
- [ ] ユーザーレビュー監視
- [ ] 使用状況分析

---

## 参考コマンド

### EAS Build関連
```bash
# ビルド状況確認
npx eas build:list --limit 5

# 特定ビルドの詳細
npx eas build:view [BUILD_ID]

# 認証情報管理
npx eas credentials

# プロジェクト情報確認
npx eas project:info
```

### Android関連
```bash
# 実機接続確認
adb devices

# アプリのインストール確認
adb shell pm list packages | grep tomicavault

# アプリの起動
adb shell am start -n com.masaway2525.tomicavaultapp/.MainActivity

# ログ監視
adb logcat | grep -E "tomicavaultapp|ERROR|FATAL"
```

---

## 注意事項

### セキュリティ
- 本番環境では環境変数を適切に管理
- 認証情報をリポジトリにコミットしない
- APIキーの権限を最小限に設定

### パフォーマンス
- アプリサイズの最適化（不要なアセットの削除）
- 起動時間の最適化
- メモリ使用量の監視

### コンプライアンス
- プライバシーポリシーの遵守
- Google Playポリシーの確認
- 子ども向けアプリのガイドライン遵守

---

## 関連ドキュメント

- [WSL2でのAndroid実機テスト手順書](./WSL2でのAndroid実機テスト手順書.md)
- [WSL2ワイヤレスデバッグ環境構築手順](./WSL2_ワイヤレスデバッグ環境構築手順.md)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

このドキュメントに従うことで、品質の高いAndroidアプリを安全にリリースできます。