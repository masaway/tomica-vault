# WSL2でのAndroid実機テスト手順書

## 概要
WSL2環境でExpoアプリをAndroid実機にインストールしてテストするための完全な手順書です。

## 目次
1. [ADBとは](#adbとは)
2. [環境準備](#環境準備)
3. [ADBセットアップ](#adbセットアップ)
4. [USBデバイス接続](#usbデバイス接続)
5. [Expoアプリのビルド・インストール](#expoアプリのビルド・インストール)
6. [トラブルシューティング](#トラブルシューティング)

---

## ADBとは

**ADB（Android Debug Bridge）**は、Androidデバイスとコンピューターを接続するためのコマンドラインツールです。

### 主な機能
- Androidデバイスとの通信
- アプリのインストール・デバッグ
- ファイル転送
- デバイス情報の取得
- シェルコマンドの実行

---

## 環境準備

### 必要なもの
- Windows 10/11（WSL2ホスト）
- WSL2（Ubuntu推奨）
- Android実機（開発者オプション有効）
- USBケーブル

### Android端末の準備

1. **開発者オプションを有効化**
   ```
   設定 → 端末情報 → ビルド番号を7回タップ
   ```

2. **USBデバッグを有効化**
   ```
   設定 → 開発者オプション → USBデバッグ → ON
   ```

3. **ワイヤレスデバッグを有効化（オプション）**
   ```
   設定 → 開発者オプション → ワイヤレスデバッグ → ON
   ```

---

## ADBセットアップ

### Windows側（ホスト）

#### 方法1: Android SDK Platform Toolsを使用
1. [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools)をダウンロード
2. 任意のフォルダに解凍（例：`C:\platform-tools\`）
3. 環境変数PATHに追加
   ```powershell
   # PowerShellで環境変数を設定
   $env:PATH += ";C:\platform-tools"
   ```

#### 方法2: wingetを使用
```powershell
# wingetでインストール
winget install Google.AndroidStudio
```

### WSL2側

#### 方法1: apt経由でインストール
```bash
# パッケージリストを更新
sudo apt update

# ADBツールをインストール
sudo apt install android-tools-adb android-tools-fastboot

# インストール確認
adb --version
```

#### 方法2: 最新版を手動インストール
```bash
# 最新版をダウンロード
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip

# 解凍
unzip platform-tools-latest-linux.zip

# システムパスにコピー
sudo cp platform-tools/adb /usr/local/bin/
sudo cp platform-tools/fastboot /usr/local/bin/

# 実行権限を付与
sudo chmod +x /usr/local/bin/adb
sudo chmod +x /usr/local/bin/fastboot

# インストール確認
adb --version
```

---

## USBデバイス接続

### 方法1: ワイヤレスデバッグ（推奨）

#### Android端末の設定
1. **ワイヤレスデバッグを有効化**
   ```
   設定 → 開発者オプション → ワイヤレスデバッグ → ON
   ```

2. **ペア設定コードを取得**
   ```
   ワイヤレスデバッグ → ペア設定コードによるデバイスのペア設定
   ```
   - 6桁のコードとIPアドレス:ポート番号が表示されます
   - 例：コード: 123456、IP: 192.168.1.100:37831

#### WSL2側の設定
1. **ペア設定を実行**
   ```bash
   # ペア設定（初回のみ）
   adb pair <IP_ADDRESS>:<PORT>
   
   # 例：
   adb pair 192.168.1.100:37831
   
   # 6桁のコードを入力
   ```

2. **デバイスに接続**
   ```bash
   # 通常のワイヤレスデバッグIPアドレスで接続
   # 設定 → 開発者オプション → ワイヤレスデバッグ で表示されるIPアドレス:ポート
   adb connect <ANDROID_IP>:5555
   
   # 例：
   adb connect 192.168.1.100:5555
   
   # 接続確認
   adb devices
   ```

3. **接続が成功した場合の表示**
   ```bash
   # 正常に接続されていれば以下のように表示
   List of devices attached
   192.168.1.100:5555    device
   ```

---

## その他の接続方法（参考）

以下の方法も試しましたが、ワイヤレスデバッグが最も安定して動作しました。

### 方法2: usbipd-win

#### Windows側の設定
1. **usbipd-winをインストール**
   ```powershell
   # wingetでインストール
   winget install usbipd

   # 再起動が必要な場合があります
   ```

2. **接続可能なUSBデバイスを確認**
   ```powershell
   # PowerShellで実行
   usbipd list
   ```

3. **デバイスをバインド（管理者権限必要）**
   ```powershell
   # 管理者権限でPowerShellを実行
   usbipd bind --busid 4-4
   
   # 4-4のところはlistで表示されたBUSIDを指定
   ```

4. **Android端末をUSBで接続**
   - 端末で「USBデバッグを許可しますか？」→「常に許可」を選択

5. **デバイスをWSL2に転送**
   ```powershell
   # BUS-IDは usbipd wsl list で確認したID
   usbipd wsl attach --busid <BUS-ID> --distribution Ubuntu

   # 例：
   usbipd wsl attach --busid 1-4 --distribution Ubuntu
   ```

#### WSL2側の設定
1. **usbipツールをインストール**
   ```bash
   # 必要なパッケージをインストール
   sudo apt install linux-tools-virtual hwdata
   sudo update-alternatives --install /usr/local/bin/usbip usbip /usr/lib/linux-tools/*/usbip 20
   ```

2. **デバイス接続確認**
   ```bash
   # 接続されたデバイスを確認
   adb devices
   
   # 正常に接続されていれば以下のように表示
   # List of devices attached
   # XXXXXXXXXX    device
   ```

---

## Expoアプリのビルド・インストール

### 事前準備

1. **プロジェクトディレクトリに移動**
   ```bash
   cd /home/yoshiaki/work/tomica-vault/tomica-vault-app
   ```

2. **環境変数の確認**
   ```bash
   # 必要な環境変数が設定されているか確認
   echo $EXPO_PUBLIC_SUPABASE_URL
   echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **デバイス接続確認**
   ```bash
   # Android端末が認識されているか確認
   adb devices
   
   # 期待される出力：
   # List of devices attached
   # XXXXXXXXXX    device
   ```

### 方法1: Development Build（推奨）

#### Android Development Buildを作成
```bash
# Development buildを作成・インストール
npx expo run:android

# または分割して実行
npx expo prebuild --platform android
npx expo run:android --device
```

#### 開発サーバーを起動
```bash
# 開発サーバーを起動
npm start

npx expo start --dev-client --clear --tunnel

# Metro bundlerが起動し、QRコードが表示されます
# 実機のExpo Goアプリでスキャンしてアクセス
```

### 方法2: APKビルド

#### APKファイルを作成
```bash
# APKファイルを作成（EAS Build使用）
npx eas build --platform android --profile preview

# ローカルビルドの場合
eas build --platform android --profile preview --local
```

#### APKファイルをインストール
```bash
# 作成されたAPKファイルを端末にインストール
adb install path/to/your-app.apk

# 例：
adb install ./android/app/build/outputs/apk/debug/app-debug.apk

adb install ./tomica-vault-app/android/app/build/outputs/apk/debug/app-debug.apk

adb install /home/yoshiaki/work/tomica-vault/tomica-vault-app/build-1751992603609.apk

# adb接続できた端末でアプリを起動する
adb shell am start -n com.masaway2525.tomicavaultapp/.MainActivity


# これを別のターミナルで実行して、リアルタイムでログを監視
adb logcat -v time | grep -E "tomicavaultapp|ERROR|FATAL|EXCEPTION|ReactNative|BridgelessReact"

```

### 方法3: Expo Go経由

#### Expo Goアプリを使用
```bash
# 開発サーバーを起動
npm start

# 端末のExpo Goアプリでプロジェクトを開く
# 1. QRコードをスキャン
# 2. または直接URL入力
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. デバイスが認識されない

**問題**: `adb devices`で端末が表示されない

**解決方法**:
```bash
# ADBサーバーを再起動
adb kill-server
adb start-server

# デバイスを再確認
adb devices
```

**その他の確認点**:
- USBケーブルの接続確認
- Android端末でUSBデバッグの許可
- USBドライバーの確認（Windows）

#### 2. "unauthorized" エラー

**問題**: デバイスが"unauthorized"として表示される

**解決方法**:
1. Android端末で「USBデバッグを許可しますか？」ダイアログを確認
2. 「このコンピュータを常に許可」にチェック
3. 「許可」を選択

#### 3. WSL2でUSBデバイスが見えない

**問題**: WSL2でUSBデバイスが認識されない

**解決方法**:
```powershell
# Windows PowerShellで実行
usbipd wsl list
usbipd wsl attach --busid <BUS-ID> --distribution Ubuntu
```

#### 4. Metro bundlerの接続エラー

**問題**: 開発サーバーに接続できない

**解決方法**:
```bash
# ファイアウォールでポート19000を開放
# またはトンネルモードを使用
npx expo start --tunnel
```

#### 5. ビルドエラー

**問題**: `npx expo run:android`でビルドエラー

**解決方法**:
```bash
# キャッシュをクリア
npx expo r -c

# node_modulesを再インストール
rm -rf node_modules
npm install

# Android gradleキャッシュをクリア
cd android
./gradlew clean
cd ..
```

### エラーコード別対処法

#### INSTALL_FAILED_OLDER_SDK
```bash
# Android APIレベルが低い場合
# app.json の android.minSdkVersion を確認・調整
```

#### INSTALL_FAILED_INSUFFICIENT_STORAGE
```bash
# ストレージ不足
# Android端末の空き容量を確認
```

#### device offline
```bash
# デバイスがオフライン状態
adb disconnect
adb connect <device_ip>:5555
```

### 便利なコマンド

```bash
# 接続されたデバイスの詳細情報
adb shell getprop

# 端末の画面をキャプチャ
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png

# アプリのログを確認
adb logcat | grep -i "expo\|react"

# 特定のアプリをアンインストール
adb uninstall com.yourcompany.yourapp

# 端末にファイルを転送
adb push local_file.txt /sdcard/

# 端末からファイルを取得
adb pull /sdcard/remote_file.txt ./
```

---

## まとめ

1. **usbipd-winを使用**してUSBデバイスをWSL2に転送
2. **Development Build**でリアルタイム開発
3. **APKビルド**で本番テスト
4. **トラブル時**はADBサーバーの再起動を試す

この手順に従うことで、WSL2環境でもAndroid実機での開発・テストが可能になります。

---

## 参考リンク

- [Android Debug Bridge (adb)](https://developer.android.com/tools/adb)
- [usbipd-win](https://github.com/dorssel/usbipd-win)
- [Expo Development Build](https://docs.expo.dev/development/build/)
- [EAS Build](https://docs.expo.dev/build/introduction/)