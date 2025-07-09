#!/bin/bash

# NFCテスト用Android環境セットアップスクリプト

echo "=== NFC テスト用 Android 環境セットアップ ==="

# 1. 必要な環境変数を設定
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 2. 環境をzshrcに永続化
echo "export ANDROID_HOME=~/Android/Sdk" >> ~/.zshrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> ~/.zshrc

echo "環境変数を設定しました"

# 3. EAS Buildでテスト用APKを作成
echo "EAS Buildでテスト用APKを作成します..."
echo "コマンド: eas build --platform android --profile development --non-interactive"

# 4. 使用方法を表示
echo ""
echo "=== 使用方法 ==="
echo "1. 'source ~/.zshrc' で環境変数を読み込み"
echo "2. 'eas build --platform android --profile development --non-interactive' でAPK作成"
echo "3. 生成されたQRコードまたはURLから実機にインストール"
echo "4. 実機でNFCテストを実行"
echo ""
echo "=== 必要なもの ==="
echo "- Android端末（NFC対応）"
echo "- NFCタグ（MIFARE Classic、NTAG213等）"
echo "- 端末でのNFC機能ON"
echo ""