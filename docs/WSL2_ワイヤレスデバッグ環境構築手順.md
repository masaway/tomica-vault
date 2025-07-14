# WSL2 + React Native Expo ワイヤレスデバッグ環境構築手順

## 概要
WSL2環境でReact Native Expoアプリを開発し、Android実機でワイヤレスデバッグを行うための環境構築手順です。

## 1. 環境要件

### 必要な環境
- **Windows 10/11** (WSL2ホスト)
- **WSL2** (Ubuntu推奨)
- **Android実機** (Android 11以上推奨)
- **同一WiFiネットワーク** (PC/WSL2とAndroid端末が同じネットワーク)

### 必要なソフトウェア
- Node.js 22.15.1 (Volta管理)
- npm 10.9.2
- Expo CLI
- Android Debug Bridge (ADB)

## 2. Android端末の設定

### 開発者オプションの有効化
```
1. 設定 → 端末情報 → ビルド番号を7回タップ
2. 「開発者向けオプション」が表示されることを確認
```

### デバッグ機能の有効化
```
設定 → 開発者オプション で以下を有効化：
- USBデバッグ → ON
- ワイヤレスデバッグ → ON
```

## 3. WSL2側のADBセットアップ

### ADBツールのインストール
```bash
# パッケージリストを更新
sudo apt update

# ADBツールをインストール
sudo apt install android-tools-adb android-tools-fastboot

# インストール確認
adb --version
```

### 最新版の手動インストール（オプション）
```bash
# 最新版をダウンロード
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip

# 解凍してインストール
unzip platform-tools-latest-linux.zip
sudo cp platform-tools/adb /usr/local/bin/
sudo cp platform-tools/fastboot /usr/local/bin/
sudo chmod +x /usr/local/bin/adb /usr/local/bin/fastboot
```

## 4. ワイヤレス接続手順

### 初回ペアリング
```bash
# 1. Android端末で設定
# 設定 → 開発者オプション → ワイヤレスデバッグ → ペア設定コードによるデバイスのペア設定

# 2. 表示されたIPアドレス:ポート番号をメモ
# 例: 192.168.1.100:37831

# 3. WSL2でペアリング実行
adb pair <IP_ADDRESS>:<PORT>
# 例: adb pair 192.168.1.100:37831

# 4. Android端末に表示された6桁のコードを入力
```

### デバイス接続
```bash
# 1. Android端末でワイヤレスデバッグのIPアドレスを確認
# 設定 → 開発者オプション → ワイヤレスデバッグ

# 2. WSL2で接続
adb connect <ANDROID_IP>:5555
# 例: adb connect 192.168.1.100:5555

# 3. 接続確認
adb devices
```

### 期待される出力
```bash
$ adb devices
List of devices attached
192.168.1.100:5555    device
```

## 5. プロジェクト環境の準備

### プロジェクトディレクトリに移動
```bash
cd /home/yoshiaki/work/tomica-vault/tomica-vault-app
```

### 環境変数の確認
```bash
# Supabase設定の確認
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 依存関係のインストール
```bash
# node_modulesが最新であることを確認
npm install
```

## 6. 開発サーバーの起動

### 基本的な起動方法
```bash
# 標準モード
npm start

# Expo Go用
npm run start:expo-go

# Development Build用
npm run start:dev-build

# トンネルモード（ネットワーク問題時）
npx expo start --dev-client --clear --tunnel
```

## 7. アプリのビルド・インストール

### 方法A: Development Build（推奨）
```bash
# Development buildを作成してデバイスにインストール
npx expo run:android

# または分割実行
npx expo prebuild --platform android
npx expo run:android --device
```

### 方法B: APKビルド
```bash
# APKファイルをローカルビルド
eas build --platform android --profile preview --local

# カスタムスクリプトで最新ビルドをインストール
/install-latest-build
```

### 方法C: Expo Go経由
```bash
# 開発サーバー起動後、Expo GoアプリでQRコードスキャン
npm start
```

## 8. 便利なコマンド

### デバイス管理
```bash
# 接続されたデバイス一覧
adb devices

# デバイス情報取得
adb shell getprop

# 接続切断
adb disconnect
```

### アプリ管理
```bash
# アプリインストール
adb install path/to/app.apk

# アプリアンインストール
adb uninstall com.masaway2525.tomicavault

# アプリ起動
adb shell am start -n com.masaway2525.tomicavault/com.tomicavault.MainActivity
```

### ログ・デバッグ
```bash
# アプリのログ監視
adb logcat -v time | grep -E "tomicavaultapp|ERROR|FATAL|EXCEPTION|ReactNative"

# 画面キャプチャ
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

## 9. トラブルシューティング

### デバイスが認識されない
```bash
# ADBサーバーの再起動
adb kill-server
adb start-server

# デバイスの再接続
adb disconnect
adb connect <device_ip>:5555
```

### "unauthorized"エラー
1. Android端末で「USBデバッグを許可しますか？」ダイアログを確認
2. 「このコンピュータを常に許可」にチェック
3. 「許可」を選択

### Metro bundlerの接続エラー
```bash
# トンネルモードで起動
npx expo start --tunnel

# キャッシュクリア
npx expo r -c
```

### ワイヤレス接続が不安定な場合
1. Android端末とPCが同じWiFiネットワークに接続されているか確認
2. ファイアウォール設定を確認
3. ルーターのAP分離機能が無効になっているか確認

## 10. ワークフロー例

### 日常的な開発フロー
```bash
# 1. デバイス接続確認
adb devices

# 2. 開発サーバー起動
cd /home/yoshiaki/work/tomica-vault/tomica-vault-app
npm run start:dev-build

# 3. コード変更後の再読み込み
# Android端末でExpoアプリを振る（shake）またはr+Enterキー

# 4. ログ確認（別ターミナル）
adb logcat -v time | grep -E "tomicavaultapp|ERROR|FATAL"
```

### 新しいビルドのテスト
```bash
# 1. APKビルド
eas build --platform android --profile preview --local

# 2. 最新ビルドをインストール
/install-latest-build

# 3. アプリ起動
adb shell am start -n com.masaway2525.tomicavault/com.tomicavault.MainActivity
```

## 参考リンク

- [Android Debug Bridge (adb)](https://developer.android.com/tools/adb)
- [Expo Development Build](https://docs.expo.dev/development/build/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [WSL2でのAndroid実機テスト手順書（詳細版）](./WSL2でのAndroid実機テスト手順書.md)