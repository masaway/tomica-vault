import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTomica } from '../hooks/useTomica';
import { useNFC } from '../hooks/useNFC';
import { Database } from '../types/supabase';

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tomica = JSON.parse(params.tomica as string) as Database['public']['Tables']['owned_tomica']['Row'];

  const [name, setName] = useState(tomica.name);
  const [situation, setSituation] = useState<'外出中' | '帰宅中'>(
    tomica.checked_out_at && (!tomica.check_in_at || new Date(tomica.checked_out_at) > new Date(tomica.check_in_at)) ? '外出中' : '帰宅中'
  );
  const [notes, setNotes] = useState(tomica.memo || '');
  const [isSleeping, setIsSleeping] = useState(tomica.is_sleeping === true);
  const { updateTomica, toggleSleepMode, updateTomicaNfcTag } = useTomica();
  const { readNfcTag, nfcState } = useNFC();
  const [isLoading, setIsLoading] = useState(false);
  const [isNfcReregistering, setIsNfcReregistering] = useState(false);

  // 編集後に最新詳細画面へ遷移するナビゲーション処理を関数化
  const navigateToLatestDetails = (router: ReturnType<typeof useRouter>, tomicaId: number) => {
    router.back(); // 編集画面pop
    setTimeout(() => {
      router.back(); // 古い詳細画面pop
      setTimeout(() => {
        router.push({ pathname: '/details', params: { id: tomicaId } });
      }, 100);
    }, 100);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }
    try {
      setIsLoading(true);
      
      // まず基本情報を更新
      const result = await updateTomica(tomica.id, { name, situation, notes });
      if (!result) {
        Alert.alert('エラー', '保存に失敗しました');
        return;
      }
      
      // おやすみモードの状態が変わった場合は更新
      if (isSleeping !== (tomica.is_sleeping === true)) {
        await toggleSleepMode(tomica.id, isSleeping);
      }
      
      Alert.alert('成功', '保存しました', [
        {
          text: 'OK',
          onPress: () => navigateToLatestDetails(router, tomica.id)
        }
      ]);
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNfcReregister = async () => {
    if (!nfcState.isSupported) {
      Alert.alert('エラー', 'この端末ではNFC機能がサポートされていません');
      return;
    }

    try {
      setIsNfcReregistering(true);
      
      Alert.alert(
        'NFCタグの再登録',
        '新しいNFCタグをスマートフォンの背面にかざしてください',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: () => setIsNfcReregistering(false)
          },
          {
            text: 'スキャン開始',
            onPress: async () => {
              const result = await readNfcTag();
              if (result) {
                Alert.alert(
                  '確認',
                  `新しいNFCタグ（ID: ${result.id}）を登録しますか？`,
                  [
                    {
                      text: 'キャンセル',
                      style: 'cancel'
                    },
                    {
                      text: '登録する',
                      onPress: async () => {
                        const updateResult = await updateTomicaNfcTag(tomica.id, result.id);
                        if (updateResult) {
                          Alert.alert('成功', 'NFCタグが再登録されました', [
                            {
                              text: 'OK',
                              onPress: () => navigateToLatestDetails(router, tomica.id)
                            }
                          ]);
                        } else {
                          Alert.alert('エラー', 'NFCタグの登録に失敗しました');
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('エラー', 'NFCタグの読み取りに失敗しました');
              }
              setIsNfcReregistering(false);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('エラー', 'NFCタグの読み取り中にエラーが発生しました');
      setIsNfcReregistering(false);
    }
  };

  // カスタムヘッダー
  const CustomHeader = () => (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          paddingHorizontal: 16,
          backgroundColor: '#000',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, paddingRight: 16 }}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>おもちゃ編集</Text>
        <View style={{ width: 60 }} />
      </View>
    </SafeAreaView>
  );

  return (
    <>
      <Stack.Screen options={{ header: () => <CustomHeader /> }} />
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>名前</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="おもちゃの名前"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>状況</Text>
              <View style={styles.situationButtons}>
                {([
                  { value: '外出中', label: '行ってきます' },
                  { value: '帰宅中', label: 'ただいま' }
                ] as const).map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.situationButton,
                      situation === value && styles.situationButtonActive,
                    ]}
                    onPress={() => setSituation(value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.situationButtonText,
                        situation === value && styles.situationButtonTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>メモ</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="メモを入力"
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
            
          <View style={styles.inputGroup}>
            <Text style={styles.label}>おやすみモード</Text>
            <View style={styles.switchContainer}>
              <Switch
                value={isSleeping}
                onValueChange={setIsSleeping}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isSleeping ? '#f5dd4b' : '#f4f3f4'}
                disabled={isLoading}
              />
              <Text style={styles.switchLabel}>
                {isSleeping ? 'おやすみ中' : '通常モード'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NFCタグ</Text>
          <View style={styles.nfcSection}>
            <Text style={styles.nfcInfo}>
              現在のNFCタグID: {tomica.nfc_tag_uid || '未登録'}
            </Text>
            <TouchableOpacity 
              style={[styles.nfcReregisterButton, isNfcReregistering && styles.nfcReregisterButtonDisabled]} 
              onPress={handleNfcReregister}
              disabled={isLoading || isNfcReregistering}
            >
              <Text style={styles.nfcReregisterButtonText}>
                {isNfcReregistering ? 'NFCタグ読み取り中...' : 'NFCタグを再登録'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={[styles.bottomButton, styles.cancelButton]} 
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.bottomButtonText}>キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bottomButton, styles.saveButton]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.bottomButtonText}>
            {isLoading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    flex: 1,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'center',
  },
  saveButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  situationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  situationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  situationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  situationButtonText: {
    fontSize: 16,
    color: '#666',
  },
  situationButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nfcSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nfcInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  nfcReregisterButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nfcReregisterButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  nfcReregisterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 