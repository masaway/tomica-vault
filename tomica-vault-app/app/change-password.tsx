import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { updatePassword, signIn, user, getAuthProvider, hasPassword } = useAuth();
  const authProvider = getAuthProvider();
  const userHasPassword = hasPassword();
  const isPasswordSetup = authProvider === 'google' && !userHasPassword;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  const validateInputs = (): string | null => {
    // パスワード設定の場合（Googleログインユーザー）
    if (isPasswordSetup) {
      if (!newPassword.trim()) {
        return '新しいパスワードを入力してください';
      }
      if (newPassword.length < 6) {
        return '新しいパスワードは6文字以上で入力してください';
      }
      if (newPassword !== confirmPassword) {
        return '新しいパスワードが確認用と一致しません';
      }
      return null;
    }

    // パスワード変更の場合（Email認証ユーザー）
    if (!currentPassword.trim()) {
      return '現在のパスワードを入力してください';
    }
    if (!newPassword.trim()) {
      return '新しいパスワードを入力してください';
    }
    if (newPassword.length < 6) {
      return '新しいパスワードは6文字以上で入力してください';
    }
    if (newPassword !== confirmPassword) {
      return '新しいパスワードが確認用と一致しません';
    }
    if (currentPassword === newPassword) {
      return '現在のパスワードと新しいパスワードが同じです';
    }
    return null;
  };

  const handleChangePassword = async () => {
    const validationError = validateInputs();
    if (validationError) {
      Alert.alert('入力エラー', validationError);
      return;
    }

    if (!user?.email) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }

    setLoading(true);

    try {
      // パスワード設定の場合（Googleログインユーザー）
      if (isPasswordSetup) {
        // 再認証なしでパスワード設定
        const { error: updateError } = await updatePassword(newPassword);

        if (updateError) {
          Alert.alert('設定エラー', `パスワードの設定に失敗しました: ${updateError.message}`);
          return;
        }

        Alert.alert(
          'パスワード設定完了', 
          'パスワードが正常に設定されました。\n\n今後は以下の2つの方法でログインできます：\n\n①Googleログイン（従来通り）\n②メールアドレス＋パスワード（新規追加）\n\nどちらの方法でも同じアカウントにアクセスできます。',
          [
            {
              text: 'OK',
              onPress: () => {
                // フォームをクリア
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // 設定画面に戻る
                router.back();
              },
            },
          ]
        );
      } else {
        // パスワード変更の場合（Email認証ユーザー）
        // 現在のパスワードで再認証
        const { error: signInError } = await signIn({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          Alert.alert('認証エラー', '現在のパスワードが間違っています');
          return;
        }

        // パスワード更新
        const { error: updateError } = await updatePassword(newPassword);

        if (updateError) {
          Alert.alert('更新エラー', `パスワードの更新に失敗しました: ${updateError.message}`);
          return;
        }

        Alert.alert(
          'パスワード変更完了', 
          'パスワードが正常に変更されました',
          [
            {
              text: 'OK',
              onPress: () => {
                // フォームをクリア
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // 設定画面に戻る
                router.back();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('パスワード処理エラー:', error);
      Alert.alert('エラー', `パスワード${isPasswordSetup ? '設定' : '変更'}中にエラーが発生しました`);
    } finally {
      setLoading(false);
    }
  };

  // カスタムヘッダー
  const CustomHeader = () => (
    <SafeAreaView edges={['top']} style={{ backgroundColor: gradientStart }}>
      <LinearGradient
        colors={[gradientStart, tintColor, gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPasswordSetup ? 'パスワード設定' : 'パスワード変更'}
        </Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>
    </SafeAreaView>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={gradientStart} 
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <CustomHeader />
        
        <View style={styles.content}>
          {!isPasswordSetup && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                現在のパスワード <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: borderColor,
                    backgroundColor: cardColor,
                    color: textColor,
                  },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="現在のパスワードを入力"
                placeholderTextColor={borderColor}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              新しいパスワード <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: borderColor,
                  backgroundColor: cardColor,
                  color: textColor,
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="新しいパスワードを入力（6文字以上）"
              placeholderTextColor={borderColor}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textColor }]}>
              新しいパスワード（確認） <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: borderColor,
                  backgroundColor: cardColor,
                  color: textColor,
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="新しいパスワードをもう一度入力"
              placeholderTextColor={borderColor}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: loading ? borderColor : tintColor,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? (isPasswordSetup ? '設定中...' : '変更中...')
                : (isPasswordSetup ? 'パスワードを設定する' : 'パスワードを変更する')
              }
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: textColor }]}>
              {isPasswordSetup ? (
                // パスワード設定の場合（Googleログインユーザー）
                `• パスワードは6文字以上で設定してください${'\n'}• 設定後はメールアドレスとパスワードでもログインできます${'\n'}• Googleログインも引き続き利用できます`
              ) : (
                // パスワード変更の場合（Email認証ユーザー）
                `• パスワードは6文字以上で設定してください${'\n'}• 現在のパスワードが必要です${'\n'}• 変更後は再度ログインが必要な場合があります`
              )}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
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
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});