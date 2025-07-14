import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTomica } from '../hooks/useTomica';
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
  const { updateTomica } = useTomica();
  const [isLoading, setIsLoading] = useState(false);

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
      const result = await updateTomica(tomica.id, { name, situation, notes });
      if (result) {
        Alert.alert('成功', '保存しました', [
          {
            text: 'OK',
            onPress: () => navigateToLatestDetails(router, tomica.id)
          }
        ]);
      } else {
        Alert.alert('エラー', '保存に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={styles.title}>おもちゃ編集</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.saveButtonContainer}>
          <Text style={styles.saveButton}>{isLoading ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>
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
        </View>
      </ScrollView>
    </SafeAreaView>
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
}); 