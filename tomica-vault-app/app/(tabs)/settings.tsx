import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>設定</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={[styles.settingText, { color: textColor }]}>プロフィール設定</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={[styles.settingText, { color: textColor }]}>通知設定</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]}>
          <Text style={[styles.settingText, { color: textColor }]}>アプリについて</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
  },
}); 