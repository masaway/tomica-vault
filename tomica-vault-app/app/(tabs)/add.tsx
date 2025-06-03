import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '新規登録' }} />
      <Text style={styles.title}>新規登録</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 