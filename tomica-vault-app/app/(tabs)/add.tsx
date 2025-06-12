import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert, Image } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';

export default function AddScreen() {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  });

  const handleSubmit = () => {
    // 必須項目のバリデーション
    if (!formData.name) {
      Alert.alert('エラー', '車名は必須項目です');
      return;
    }

    // TODO: データの保存処理を実装
    Alert.alert('成功', 'トミカの登録が完了しました');
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: '新規登録' }} />
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>車名 <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="例: トヨタ クラウン"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>メモ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="特記事項があれば入力してください"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>NFCを登録する</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
    color: '#333',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
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
}); 