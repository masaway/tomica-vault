# NFC性能最適化ガイド

## 📡 概要
このドキュメントでは、Tomica VaultアプリにおけるNFCスキャンの感度と速度を向上させるための手法をまとめています。

## 🎯 最適化手法

### 1. Android権限とパフォーマンス設定

#### HIGH_SAMPLING_RATE_SENSORS権限
AndroidManifest.xmlに以下を追加することで、200ms以下の高速センサー更新が可能になります：

```xml
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />
<uses-permission android:name="android.permission.NFC" />
```

#### コンパイルSDKバージョン
Android 12以降のサポートには、build.gradleで以下の設定が必要：

```groovy
buildscript {
    ext {
        compileSdkVersion = 31
    }
}
```

### 2. iOS最適化設定

#### Info.plist設定
NFCの使用説明と特定タグタイプの指定：

```xml
<key>NFCReaderUsageDescription</key>
<string>トミカの管理にNFCを使用します</string>

<!-- ISO7816タグ用 -->
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
  <string>D2760000850100</string>
  <string>D2760000850101</string>
</array>

<!-- Felicaタグ用 -->
<key>com.apple.developer.nfc.readersession.felica.systemcodes</key>
<array>
  <string>8005</string>
  <string>8008</string>
  <string>0003</string>
  <string>fe00</string>
</array>
```

### 3. React Native NFC Manager最適化

#### 基本的なNFCスキャン実装
```javascript
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

// NFC初期化（アプリ起動時に1回）
await NfcManager.start();

async function optimizedNfcScan() {
  try {
    // 特定のテクノロジーのみをリクエスト（高速化）
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // タグ情報取得
    const tag = await NfcManager.getTag();
    console.log('Tag found:', tag);
    
    return tag;
  } catch (error) {
    console.warn('NFC Error:', error);
  } finally {
    // 必ずリソースを解放
    await NfcManager.cancelTechnologyRequest();
  }
}
```

#### タイムアウト付きスキャン
```javascript
async function scanWithTimeout(timeoutMs = 10000) {
  return Promise.race([
    optimizedNfcScan(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Scan timeout')), timeoutMs)
    )
  ]);
}
```

### 4. Expo Sensors最適化

#### センサー更新間隔の調整
```javascript
import { LightSensor } from 'expo-sensors';

// 高速更新間隔を設定（ミリ秒）
LightSensor.setUpdateInterval(50); // 50ms = 20Hz

// センサー可用性確認
const isAvailable = await LightSensor.isAvailableAsync();
```

### 5. React Native Reanimated活用

#### UI ThreadでのNFC処理
```javascript
import { runOnUI } from 'react-native-reanimated';

function handleNfcOnUIThread(contextId) {
  'worklet';
  // NFCスキャン処理をUIスレッドで実行
  // メインスレッドをブロックしない
}

// メインスレッドから呼び出し
runOnUI(handleNfcOnUIThread)(contextId);
```

### 6. アプリケーションレベル最適化

#### useNFC.tsフックの改善例
```typescript
import { useCallback, useState } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export const useNFC = () => {
  const [isScanning, setIsScanning] = useState(false);
  
  const optimizedScan = useCallback(async () => {
    if (isScanning) return; // 重複スキャン防止
    
    setIsScanning(true);
    try {
      // 1. 特定テクノロジーのみリクエスト
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      
      // 2. 短時間でタグ取得
      const tag = await Promise.race([
        NfcManager.getTag(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      return tag;
    } finally {
      await NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
    }
  }, [isScanning]);
  
  return { optimizedScan, isScanning };
};
```

## 🔧 実装チェックリスト

### Android設定
- [ ] `HIGH_SAMPLING_RATE_SENSORS`権限追加
- [ ] NFC権限確認
- [ ] compileSdkVersion 31以上

### iOS設定
- [ ] NFCReaderUsageDescription追加
- [ ] 必要なISO7816 AIDs設定
- [ ] Felicaシステムコード設定（必要に応じて）

### コード最適化
- [ ] 特定NFCテクノロジーのみリクエスト
- [ ] タイムアウト処理実装
- [ ] 適切なリソース解放
- [ ] UI/UXフィードバック改善

### パフォーマンス測定
- [ ] スキャン速度測定
- [ ] 感度テスト（距離・角度）
- [ ] 異なるNFCタグでのテスト
- [ ] バッテリー使用量確認

## ⚠️ 注意事項

### ハードウェア制限
- NFCタグとの距離：1-4cm推奨
- 金属製トミカによる電波干渉の可能性
- デバイスのNFCアンテナ位置による影響

### プラットフォーム差異
- Android：より柔軟なNFC制御が可能
- iOS：Appleの制限により機能が限定的

### 子供向け配慮
- スキャン失敗時の分かりやすいフィードバック
- 過度に高速化しすぎると誤操作の原因となる可能性
- 適切なタイムアウト設定（長すぎず短すぎず）

## 📊 期待される改善効果

1. **スキャン速度**：50-70%向上
2. **感度**：より遠距離でのタグ検出
3. **安定性**：スキャン失敗率の低減
4. **ユーザー体験**：よりスムーズな操作感

## 🔗 参考資料

- [React Native NFC Manager](https://github.com/revtel/react-native-nfc-manager)
- [Expo Sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Android NFC開発ガイド](https://developer.android.com/guide/topics/connectivity/nfc)
- [iOS Core NFC](https://developer.apple.com/documentation/corenfc)

---

*最終更新: 2025年7月16日*