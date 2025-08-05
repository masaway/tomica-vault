import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, StatusBar, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';

export default function EditProfileScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  const { profile, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください。');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile({ display_name: displayName });
      Alert.alert('成功', 'プロフィールを更新しました。');
      router.back();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={gradientStart} />
      {/* Header with gradient */}
      <LinearGradient
        colors={[gradientStart, tintColor, gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeftSpacer} />
            <Text style={styles.title}>プロフィール設定</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main content area */}
      <SafeAreaView style={[styles.contentArea, { backgroundColor }]} edges={['left', 'right', 'bottom']}>
        <ScrollView style={styles.contentScroll}>
          <View style={styles.avatarContainer}>
            <Image 
              source={avatarUrl ? { uri: avatarUrl } : require('../assets/images/icon.png')} 
              style={styles.avatar}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>表示名</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: borderColor }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="表示名"
              placeholderTextColor={textColor + '80'}
            />
          </View>
        </ScrollView>
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[styles.bottomButton, styles.cancelButton]} 
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Text style={styles.bottomButtonText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomButton, styles.saveButton]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.bottomButtonText}>
              {isSaving ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    // No specific styles here, its height will be determined by its child (SafeAreaView)
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  headerSpacer: {
    width: 60,
  },
  headerLeftSpacer: {
    width: 60,
  },
  contentArea: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentScroll: {
    flexGrow: 1,
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
  },
  displayNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  displayNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
    input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
});
