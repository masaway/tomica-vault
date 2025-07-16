import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesome } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await resetPassword(email.trim());
      
      if (error) {
        let errorMessage = 'パスワードリセットに失敗しました';
        
        switch (error.message) {
          case 'User not found':
            errorMessage = '指定されたメールアドレスのアカウントが見つかりません';
            break;
          case 'Invalid email':
            errorMessage = '有効なメールアドレスを入力してください';
            break;
          case 'Email rate limit exceeded':
            errorMessage = '短時間に多くのリクエストが送信されました。しばらく時間をおいてから再度お試しください';
            break;
          default:
            errorMessage = `リセットエラー: ${error.message}`;
        }
        
        Alert.alert('リセット失敗', errorMessage);
      } else {
        setIsEmailSent(true);
      }
    } catch (error) {
      console.error('パスワードリセット処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  if (isEmailSent) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.gradient}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.successContainer}>
              <FontAwesome name="check-circle" size={80} color="white" />
              <Text style={styles.successTitle}>メール送信完了</Text>
              <Text style={styles.successMessage}>
                パスワードリセット用のリンクを{email}に送信しました。
              </Text>
              <Text style={styles.successInstructions}>
                メールをご確認いただき、リンクをクリックしてパスワードをリセットしてください。
              </Text>
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={navigateToLogin}
              >
                <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <FontAwesome name="key" size={64} color="white" />
            <Text style={styles.title}>パスワードリセット</Text>
            <Text style={styles.subtitle}>
              登録されたメールアドレスにパスワードリセット用のリンクを送信します
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <FontAwesome name="envelope" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, (isSubmitting || loading) && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isSubmitting || loading}
            >
              <Text style={styles.resetButtonText}>
                {isSubmitting ? '送信中...' : 'リセットメール送信'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                • メールが届かない場合は、迷惑メールフォルダをご確認ください
              </Text>
              <Text style={styles.infoText}>
                • リセットリンクの有効期限は24時間です
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.backText}>ログイン画面に戻りますか？</Text>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={navigateToLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.backToLoginButtonText}>ログイン画面に戻る</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#4facfe',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 20,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  backToLoginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'white',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // 成功画面のスタイル
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  successInstructions: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#4facfe',
    fontSize: 18,
    fontWeight: 'bold',
  },
});