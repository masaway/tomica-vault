# NFC機能の実装ガイド

## 概要

トミカコレクションアプリにNFC機能を実装する際の技術的制約、要件、実装手順をまとめたドキュメントです。

## Expo GoとNFCの制約

### Expo Goの制限事項

**NFC機能はExpo Goでは使用できません。**

- Expo Goは事前に設定されたサンドボックスアプリで、Expo SDKに含まれているライブラリのみ使用可能
- NFCライブラリ（`react-native-nfc-manager`等）にはネイティブコードが含まれているため、Expo Goでは動作しない
- Expo Goアプリストアのバンドルに含まれていないネイティブコードは実行不可能

### Development Buildが必要な理由

```
Expo Go = 事前設定されたサンドボックス
Development Build = カスタマイズ可能な独自のExpo Go
```

- Development Buildは「独自版のExpo Go」として機能
- 任意のネイティブライブラリの使用が可能
- ネイティブ設定の変更が可能
- アプリ固有の設定（アイコン、名前、スプラッシュスクリーン等）の適用可能

## 技術要件

### 必要なパッケージ

```bash
npm install react-native-nfc-manager
```

### 最小システム要件

- **Android**: SDK バージョン 31以上（Config Pluginが自動設定）
- **iOS**: iOS 15.1以上
- **Xcode**: 16.0以上

## セットアップ手順

### 1. パッケージインストール

```bash
cd tomica-vault-app/
npm install react-native-nfc-manager
```

### 2. app.json設定

```json
{
  "expo": {
    "plugins": [
      "react-native-nfc-manager"
    ]
  }
}
```

### 3. Development Build作成

```bash
# EAS Buildを使用する場合
npm install -g @expo/cli
eas build --platform android
eas build --platform ios

# ローカルビルドの場合
npx expo run:android
npx expo run:ios
```

## プラットフォーム固有の設定

### Android設定

Config Pluginが自動的に以下を設定：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.NFC" />
<uses-feature
    android:name="android.hardware.nfc"
    android:required="false" />
```

### iOS設定

```xml
<!-- ios/アプリ名/Info.plist -->
<key>NFCReaderUsageDescription</key>
<string>このアプリはトミカのNFCタグを読み取るためにNFC機能を使用します</string>
```

## 実装例

### 基本的なNFC読み取り実装

```typescript
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export const useNFC = () => {
  const [isNfcEnabled, setIsNfcEnabled] = useState(false);

  // NFC初期化
  useEffect(() => {
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (supported) {
          await NfcManager.start();
          setIsNfcEnabled(true);
        }
      } catch (error) {
        console.warn('NFC初期化エラー:', error);
      }
    };

    initNfc();
    return () => {
      NfcManager.setEventListener(null);
      NfcManager.stop();
    };
  }, []);

  // NFCタグ読み取り
  const readNfcTag = async (): Promise<string | null> => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      
      if (tag && tag.id) {
        const tagId = tag.id;
        await NfcManager.cancelTechnologyRequest();
        return tagId;
      }
      
      await NfcManager.cancelTechnologyRequest();
      return null;
    } catch (error) {
      console.error('NFC読み取りエラー:', error);
      await NfcManager.cancelTechnologyRequest();
      return null;
    }
  };

  // NFCタグ書き込み
  const writeNfcTag = async (data: string): Promise<boolean> => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(data)
      ]);
      
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      await NfcManager.cancelTechnologyRequest();
      
      return true;
    } catch (error) {
      console.error('NFC書き込みエラー:', error);
      await NfcManager.cancelTechnologyRequest();
      return false;
    }
  };

  return {
    isNfcEnabled,
    readNfcTag,
    writeNfcTag
  };
};
```

### トミカコレクションアプリでの使用例

```typescript
// components/NFCReader.tsx
import React from 'react';
import { View, Button, Alert } from 'react-native';
import { useNFC } from '../hooks/useNFC';
import { useTomica } from '../hooks/useTomica';

export const NFCReader: React.FC = () => {
  const { readNfcTag, isNfcEnabled } = useNFC();
  const { checkOutTomica, checkInTomica } = useTomica();

  const handleNfcScan = async () => {
    if (!isNfcEnabled) {
      Alert.alert('エラー', 'NFC機能が利用できません');
      return;
    }

    try {
      const tagId = await readNfcTag();
      if (tagId) {
        // NFCタグIDでトミカを検索
        const tomica = await findTomicaByNfcTag(tagId);
        
        if (tomica) {
          if (tomica.checked_out_at) {
            // チェックイン処理
            await checkInTomica(tomica.id);
            Alert.alert('成功', `${tomica.name}をチェックインしました`);
          } else {
            // チェックアウト処理
            await checkOutTomica(tomica.id);
            Alert.alert('成功', `${tomica.name}をチェックアウトしました`);
          }
        } else {
          Alert.alert('エラー', '該当するトミカが見つかりません');
        }
      }
    } catch (error) {
      Alert.alert('エラー', 'NFC読み取りに失敗しました');
    }
  };

  return (
    <View>
      <Button
        title="NFCタグをスキャン"
        onPressed={handleNfcScan}
        disabled={!isNfcEnabled}
      />
    </View>
  );
};
```

## エラーハンドリング

### 一般的なエラーと対処法

```typescript
const handleNfcError = (error: any) => {
  if (error.message?.includes('NFC not supported')) {
    Alert.alert('エラー', 'この端末はNFC機能をサポートしていません');
  } else if (error.message?.includes('NFC not enabled')) {
    Alert.alert('設定確認', 'NFC機能を有効にしてください');
  } else if (error.message?.includes('Tag was lost')) {
    Alert.alert('再試行', 'NFCタグをもう一度近づけてください');
  } else {
    Alert.alert('エラー', 'NFC操作中にエラーが発生しました');
  }
};
```

## デバッグ方法

### Development Buildでのデバッグ

1. **実機での動作確認が必須**
   - NFCはシミュレーターでは動作しない
   - Android/iOS実機でのテストが必要

2. **ログ出力の活用**
   ```typescript
   console.log('NFC Tag ID:', tagId);
   console.log('NFC Tag Data:', tag);
   ```

3. **段階的な実装**
   - まずNFC読み取り機能のみ実装
   - 動作確認後、書き込み機能を追加
   - 最後にアプリロジックと統合

## 注意事項

### 開発時の注意

- **Config Plugin変更時は必ずリビルド**が必要
- **実機テスト環境の準備**が必須
- **NFC対応端末**での動作確認が必要

### セキュリティ考慮事項

- NFCタグのデータ検証を必ず実装
- 不正なタグによる予期しない動作を防ぐ
- ユーザーの同意なしにNFC機能を自動実行しない

## トラブルシューティング

### よくある問題

1. **「NFC not supported」エラー**
   - 端末がNFC非対応
   - Config Pluginの設定確認

2. **権限エラー**
   - AndroidManifest.xmlの権限設定確認
   - iOSのInfo.plistの設定確認

3. **タグ読み取り失敗**
   - NFCタグの距離・位置調整
   - 金属製品の近くでの使用を避ける

### デバッグコマンド

```bash
# ログ確認
npx expo logs --platform android
npx expo logs --platform ios

# ビルドログ確認
eas build:list
```

## まとめ

NFC機能の実装にはDevelopment Buildが必須であり、Expo Goでのデバッグは不可能です。実装時は段階的なアプローチを取り、実機での動作確認を重視することが重要です。
