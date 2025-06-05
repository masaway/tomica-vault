import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

type Tomica = {
  id: number;
  name: string;
  situation: string;
  lastUpdatedDate: string;
  updatedBy: string;
};

export default function EditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tomica = JSON.parse(params.tomica as string) as Tomica;

  const [name, setName] = useState(tomica.name);
  const [situation, setSituation] = useState(tomica.situation);
  const [notes, setNotes] = useState('特別な限定版のトミカです。状態は良好です。');

  const handleSave = () => {
    // TODO: 実際の保存処理を実装
    console.log('Save tomica:', {
      ...tomica,
      name,
      situation,
      notes,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'トミカ編集',
          headerLeft: () => (
            <Text 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              キャンセル
            </Text>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>保存</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>名前</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="トミカの名前"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>状況</Text>
            <View style={styles.situationButtons}>
              {['外出中', '帰宅中'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.situationButton,
                    situation === s && styles.situationButtonActive,
                  ]}
                  onPress={() => setSituation(s)}
                >
                  <Text
                    style={[
                      styles.situationButtonText,
                      situation === s && styles.situationButtonTextActive,
                    ]}
                  >
                    {s}
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
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    padding: 8,
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    padding: 8,
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