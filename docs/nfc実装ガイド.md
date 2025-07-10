# NFC実装ガイド - チーム開発版

## 概要

トミカボルトプロジェクトでNFC機能を実装する際の**チーム開発手順**とExpo Go/Development Buildの併用方法をまとめたドキュメントです。

## 実装方針

### 基本戦略
- **環境判定による機能切り替え**：フィーチャーフラグは使用せず、シンプルな環境判定で実装
- **チーム分担開発**：Expo Goで基本機能、Development BuildでNFC機能を並行開発
- **段階的統合**：最終的にDevelopment Buildで全機能統合

### 開発環境の役割分担

| 環境 | 担当機能 | 対象メンバー |
|------|----------|-------------|
| **Expo Go** | 基本機能（UI、データ管理、ナビゲーション） | 実機テスト環境なしのメンバー |
| **Development Build** | NFC機能 + 全機能統合 | 実機テスト可能なメンバー |

## 環境判定システム

### 基本的な環境判定

```typescript
// constants/Environment.ts
import Constants from 'expo-constants';

export const IS_EXPO_GO = Constants.appOwnership === 'expo';
export const IS_DEVELOPMENT_BUILD = Constants.appOwnership === 'standalone';
export const IS_DEV = __DEV__;

// 環境情報の取得
export const getEnvironmentInfo = () => {
  return {
    isExpoGo: IS_EXPO_GO,
    isDevelopmentBuild: IS_DEVELOPMENT_BUILD,
    platform: Platform.OS,
    buildType: IS_EXPO_GO ? 'Expo Go' : 'Development Build',
  };
};
```

### NFC機能の環境判定

```typescript
// hooks/useNFCEnvironment.ts
import { getEnvironmentInfo } from '@/constants/Environment';

export const useNFCEnvironment = () => {
  const envInfo = getEnvironmentInfo();
  
  return {
    // NFC機能が利用可能か
    isNFCAvailable: envInfo.isDevelopmentBuild,
    
    // モック実装を使用するか
    shouldUseMockNFC: envInfo.isExpoGo,
    
    // 環境名
    environmentName: envInfo.buildType,
  };
};
```

## 条件分岐実装

### NFC機能の条件分岐

```typescript
// hooks/useNFC.ts
import { useNFCEnvironment } from './useNFCEnvironment';

// Development Build用の実装
const useNFCReal = () => {
  // react-native-nfc-managerを使用した実装
  const NfcManager = require('react-native-nfc-manager').default;
  
  const readNfcTag = async (): Promise<string | null> => {
    try {
      await NfcManager.requestTechnology([NfcManager.NfcTech.Ndef]);
      const tag = await NfcManager.getTag();
      return tag?.id || null;
    } catch (error) {
      console.error('NFC読み取りエラー:', error);
      return null;
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  };

  return { readNfcTag, isNFCSupported: true };
};

// Expo Go用のモック実装
const useNFCMock = () => {
  const readNfcTag = async (): Promise<string | null> => {
    // 開発用のモックデータを返す
    return 'MOCK_NFC_' + Math.random().toString(36).substring(7);
  };

  return { readNfcTag, isNFCSupported: false };
};

// 環境に応じた実装を返す
export const useNFC = () => {
  const { isNFCAvailable } = useNFCEnvironment();
  
  if (isNFCAvailable) {
    return useNFCReal();
  } else {
    return useNFCMock();
  }
};
```

### NFC Reader コンポーネント

```typescript
// components/NFCReader.tsx
import React from 'react';
import { View, Button, Alert, Text } from 'react-native';
import { useNFC } from '@/hooks/useNFC';
import { useNFCEnvironment } from '@/hooks/useNFCEnvironment';

export const NFCReader: React.FC<{ onRead: (tagId: string) => void }> = ({ onRead }) => {
  const { readNfcTag, isNFCSupported } = useNFC();
  const { environmentName } = useNFCEnvironment();

  const handleScan = async () => {
    try {
      const tagId = await readNfcTag();
      if (tagId) {
        onRead(tagId);
      } else {
        Alert.alert('エラー', 'NFCタグの読み取りに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'NFC読み取り中にエラーが発生しました');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
        環境: {environmentName}
      </Text>
      
      <Button
        title={isNFCSupported ? 'NFCタグをスキャン' : 'NFCタグをスキャン（モック）'}
        onPress={handleScan}
      />
      
      {!isNFCSupported && (
        <Text style={{ fontSize: 12, color: '#orange', marginTop: 5 }}>
          ※ Development Buildでのみ実際のNFC機能が利用できます
        </Text>
      )}
    </View>
  );
};
```

## チーム開発フロー

### 1. 基本機能開発フェーズ（Expo Go）

```bash
# Expo Go環境で開発
cd tomica-vault-app
npm start
```

**担当機能**
- UI/UXコンポーネント
- データ管理（useTomica）
- ナビゲーション
- 基本的なCRUD操作

**開発メンバー**
- 実機テスト環境がないメンバー
- UI/UX担当
- データ管理担当

### 2. NFC機能開発フェーズ（Development Build）

```bash
# Development Build環境の構築
cd tomica-vault-app
npm install react-native-nfc-manager

# Development Build作成
npx expo run:android  # Android実機用
npx expo run:ios      # iOS実機用
```

**担当機能**
- NFC読み取り機能
- NFC書き込み機能
- 実機テスト・デバッグ

**開発メンバー**
- Android実機（Pixel 3a OS 12）担当
- iOS実機担当

### 3. 統合テストフェーズ（Development Build）

```bash
# 全機能統合テスト
cd tomica-vault-app
npm run start:dev-build  # Development Build用起動
```

**統合内容**
- NFC機能 + 基本機能の統合
- 実機での動作確認
- バグ修正・最適化

## 設定ファイル

### app.json/app.config.js 設定

```javascript
// app.config.js
const IS_DEVELOPMENT_BUILD = process.env.BUILD_TYPE === 'development';

export default {
  expo: {
    name: 'Tomica Vault',
    slug: 'tomica-vault-app',
    version: '1.0.0',
    platforms: ['ios', 'android'],
    
    // Development Buildでのみ有効化
    plugins: [
      'expo-router',
      ...(IS_DEVELOPMENT_BUILD ? ['react-native-nfc-manager'] : []),
    ],
    
    // Android設定
    android: {
      package: 'com.yourcompany.tomicavault',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    
    // iOS設定
    ios: {
      bundleIdentifier: 'com.yourcompany.tomicavault',
    },
  },
};
```

### package.json スクリプト

```json
{
  "scripts": {
    "start": "expo start",
    "start:expo-go": "expo start --clear",
    "start:dev-build": "expo start --dev-client --clear",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:dev-android": "eas build --platform android --profile development",
    "build:dev-ios": "eas build --platform ios --profile development"
  }
}
```

### EAS Build設定

```javascript
// eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "BUILD_TYPE": "development"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 実機テスト手順

### Android実機テスト（Pixel 3a OS 12）

#### 1. 環境準備
```bash
# USBデバッグ有効化
# 開発者オプション > USBデバッグ

# Development Build インストール
cd tomica-vault-app
npx expo run:android
```

#### 2. NFC機能テスト
```bash
# NFC設定確認
# 設定 > 機器接続 > NFC > 有効化

# テスト項目
1. NFCタグ読み取り
2. トミカデータとの連携
3. チェックイン/チェックアウト
4. エラーハンドリング
```

#### 3. デバッグ手順
```bash
# ログ確認
npx expo logs --platform android

# 問題発生時
1. NFC機能が有効か確認
2. 権限設定の確認
3. NFCタグの距離・位置調整
4. 金属製品の影響を避ける
```

### iOS実機テスト

#### 1. 環境準備
```bash
# Development Build インストール
cd tomica-vault-app
npx expo run:ios
```

#### 2. NFC機能テスト
```bash
# NFC設定確認（iPhone 7以降）
# 設定 > 一般 > NFC > 有効化

# テスト項目
1. NFCタグ読み取り
2. Core NFCの動作確認
3. バックグラウンド動作テスト
4. 権限ダイアログの確認
```

#### 3. デバッグ手順
```bash
# ログ確認
npx expo logs --platform ios

# 問題発生時
1. Apple Developer Program登録確認
2. NFC Entitlement設定確認
3. Info.plist設定確認
4. 実機のNFC対応確認
```

## トラブルシューティング

### よくある問題と解決法

#### 1. 環境判定が正しく動作しない
```typescript
// デバッグ用のログ出力
console.log('Environment Info:', getEnvironmentInfo());
console.log('Constants.appOwnership:', Constants.appOwnership);
```

#### 2. NFC機能が動作しない
```typescript
// NFC対応確認
const checkNFCSupport = async () => {
  try {
    const supported = await NfcManager.isSupported();
    console.log('NFC Supported:', supported);
    
    const enabled = await NfcManager.isEnabled();
    console.log('NFC Enabled:', enabled);
  } catch (error) {
    console.error('NFC Check Error:', error);
  }
};
```

#### 3. Development Buildでの起動に失敗
```bash
# キャッシュクリア
npx expo start --clear

# node_modules再インストール
rm -rf node_modules
npm install

# Development Build再作成
npx expo run:android --clear
```

#### 4. Expo Goで意図しない動作
```typescript
// 環境チェック用のデバッグ画面
const DebugInfo = () => {
  const envInfo = getEnvironmentInfo();
  
  return (
    <View style={{ padding: 20 }}>
      <Text>環境: {envInfo.buildType}</Text>
      <Text>プラットフォーム: {envInfo.platform}</Text>
      <Text>NFC利用可能: {envInfo.isDevelopmentBuild ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

## 開発スケジュール例

### Week 1: 基本機能開発
- **Expo Goチーム**: UI/UXコンポーネント作成
- **Development Buildチーム**: 環境構築・NFC基本実装

### Week 2: 機能拡張
- **Expo Goチーム**: データ管理・ナビゲーション
- **Development Buildチーム**: NFC読み取り・書き込み機能

### Week 3: 統合テスト
- **全チーム**: Development Buildでの統合テスト
- **実機テスト**: Android/iOS実機での動作確認

### Week 4: 最適化・リリース準備
- **全チーム**: バグ修正・最適化
- **QA**: 本番環境での動作確認

## まとめ

このガイドに従って開発を進めることで、チーム全体が効率的にNFC機能を実装できます。

### 重要なポイント
1. **環境判定による機能切り替え**でシンプルに実装
2. **チーム分担**により並行開発が可能
3. **段階的統合**でリスクを最小化
4. **実機テスト**を重視した開発プロセス

### 次のステップ
1. 環境判定システムの実装
2. チーム分担の決定
3. 開発スケジュールの確定
4. 実機テスト環境の準備

このドキュメントは開発進行に応じて随時更新し、チーム全体で共有してください。