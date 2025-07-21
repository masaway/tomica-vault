import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTomica } from '../../hooks/useTomica';
import { useNFC } from '../../hooks/useNFC';
import { logEnvironmentInfo } from '../../constants/Environment';

export default function AddScreen() {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  });
  const [nfcTagId, setNfcTagId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const router = useRouter();
  const { nfcTagId: urlNfcTagId } = useLocalSearchParams();
  const { addTomica, getTomicaByNfcTagId, loading, error } = useTomica();
  const { readNfcTag, nfcState } = useNFC();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');

  // URLパラメータからNFCタグIDを取得
  useEffect(() => {
    if (urlNfcTagId && typeof urlNfcTagId === 'string') {
      setNfcTagId(urlNfcTagId);
    }
  }, [urlNfcTagId]);

  // 環境情報とNFC状態をログ出力
  useEffect(() => {
    logEnvironmentInfo();
    console.log('NFC状態:', {
      isSupported: nfcState.isSupported,
      isScanning: nfcState.isScanning,
      error: nfcState.error,
      lastResult: nfcState.lastResult,
    });
  }, [nfcState]);

  const handleNfcScan = async () => {
    if (!nfcState.isSupported) {
      Alert.alert('おもちゃタッチできないよ', 'このスマホはおもちゃタッチできないよ');
      return;
    }

    setIsScanning(true);
    try {
      const tagData = await readNfcTag();
      if (tagData?.id) {
        // 既に登録済みかチェック
        const existingTomica = await getTomicaByNfcTagId(tagData.id);
        
        if (existingTomica) {
          Alert.alert(
            'このおもちゃはもうなかまだよ', 
            `「${existingTomica.name}」になっているよ。\nべつのおもちゃをタッチしてみてね。`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        setNfcTagId(tagData.id);
        Alert.alert('おもちゃタッチできたよ', `おもちゃをタッチできたよ\nID: ${tagData.id}`);
      } else {
        Alert.alert('おもちゃタッチできなかった', 'おもちゃをもう一度タッチしてみてね');
      }
    } catch (err) {
      console.error('NFCスキャンエラー:', err);
      Alert.alert('おもちゃタッチできなかった', 'もう一度チャレンジしてみてね');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async () => {
    // 必須項目のバリデーション
    if (!formData.name.trim()) {
      Alert.alert('おもちゃのなまえをおしえて', 'おもちゃのなまえをいれてね');
      return;
    }

    if (!nfcTagId) {
      Alert.alert('おもちゃタッチしてね', 'おもちゃをスマホにタッチしてね');
      return;
    }

    try {
      const result = await addTomica({
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
        nfcTagUid: nfcTagId,
      });

      if (result) {
        Alert.alert('成功', 'おもちゃの登録が完了しました', [
          {
            text: 'OK',
            onPress: () => {
              // フォームをリセット
              setFormData({ name: '', notes: '' });
              setNfcTagId(null);
              // 一覧画面に戻る
              router.push('/(tabs)/list');
            },
          },
        ]);
      } else {
        Alert.alert('エラー', error || '登録に失敗しました');
      }
    } catch (err) {
      Alert.alert('エラー', '登録中にエラーが発生しました');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: '新規登録' }} />
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: textColor }]}>車名 <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: borderColor,
              backgroundColor: cardColor,
              color: textColor,
            },
          ]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="例: トヨタ クラウン"
          placeholderTextColor={borderColor}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: textColor }]}>メモ</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              borderColor: borderColor,
              backgroundColor: cardColor,
              color: textColor,
            },
          ]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="特記事項があれば入力してください"
          placeholderTextColor={borderColor}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: textColor }]}>NFCタグ <Text style={styles.required}>*</Text></Text>
        {nfcTagId ? (
          <View style={[styles.nfcTagDisplay, { backgroundColor: cardColor, borderColor: tintColor }]}>
            <Text style={[styles.nfcTagText, { color: textColor }]}>
              スキャン済み: {nfcTagId}
            </Text>
            <Pressable 
              style={[styles.nfcScanButton, { backgroundColor: borderColor }]}
              onPress={() => setNfcTagId(null)}
            >
              <Text style={styles.nfcScanButtonText}>クリア</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable 
            style={[
              styles.nfcScanButton, 
              { 
                backgroundColor: isScanning ? borderColor : tintColor,
                opacity: isScanning ? 0.6 : 1,
              }
            ]}
            onPress={handleNfcScan}
            disabled={isScanning || !nfcState.isSupported}
          >
            <Text style={styles.nfcScanButtonText}>
              {isScanning ? 'スキャン中...' : 'NFCタグをスキャン'}
            </Text>
          </Pressable>
        )}
        {!nfcState.isSupported && (
          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
            この端末はNFC機能をサポートしていません
          </Text>
        )}
        {nfcState.error && (
          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
            {nfcState.error}
          </Text>
        )}
      </View>

      <Pressable 
        style={[
          styles.submitButton, 
          { 
            backgroundColor: (loading || !nfcTagId) ? borderColor : tintColor,
            opacity: (loading || !nfcTagId) ? 0.6 : 1,
          }
        ]} 
        onPress={handleSubmit}
        disabled={loading || !nfcTagId}
      >
        <Text style={[styles.submitButtonText, { 
          color: (loading || !nfcTagId) ? '#999' : '#fff' 
        }]}>
          {loading ? '登録中...' : 'おもちゃを登録する'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  nfcTagDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  nfcTagText: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  nfcScanButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  nfcScanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 