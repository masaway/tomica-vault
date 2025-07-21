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

export default function LoginScreen() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await signIn({ email: email.trim(), password });
      
      if (error) {
        let errorMessage = 'ログインに失敗しました';
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'メールアドレスまたはパスワードが正しくありません';
            break;
          case 'Email not confirmed':
            errorMessage = 'メールアドレスの確認が完了していません';
            break;
          case 'Too many requests':
            errorMessage = 'しばらく時間をおいて再度お試しください';
            break;
          default:
            errorMessage = `ログインエラー: ${error.message}`;
        }
        
        Alert.alert('ログイン失敗', errorMessage);
      } else if (data.user) {
        // ログイン成功時は自動的にメイン画面に遷移
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('ログイン処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        let errorMessage = 'Googleログインに失敗しました';
        
        switch (error.message) {
          case 'User cancelled':
            errorMessage = 'ログインがキャンセルされました';
            break;
          case 'Authentication dismissed':
            errorMessage = '認証画面が閉じられました。もう一度お試しください';
            break;
          case 'Network error':
            errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
            break;
          case '認証トークンが見つかりません':
            errorMessage = '認証が完了しませんでした。もう一度お試しください';
            break;
          case 'OAuth認証URLが取得できませんでした':
            errorMessage = 'Googleサーバーに接続できませんでした。しばらく時間をおいて再度お試しください';
            break;
          case '認証がタイムアウトしました':
            errorMessage = '認証に時間がかかりすぎました。もう一度お試しください';
            break;
          default:
            errorMessage = `Googleログインエラー: ${error.message}`;
        }
        
        Alert.alert('Googleログイン失敗', errorMessage);
      } else if (data?.user) {
        // 認証成功時は自動的にメイン画面に遷移
        console.log('Googleログイン成功:', data.user.email);
        console.log('手動で画面遷移を実行');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Googleログイン処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました。アプリを再起動してお試しください');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/(auth)/signup');
  };

  const navigateToResetPassword = () => {
    router.push('/(auth)/reset-password');
  };

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
            <Text style={styles.title}>トイパト</Text>
            <Text style={styles.subtitle}>アカウントにログイン</Text>
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

            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="パスワード"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, (isSubmitting || loading) && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isSubmitting || loading}
            >
              <Text style={styles.loginButtonText}>
                {isSubmitting ? 'ログイン中...' : 'ログイン'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, (isGoogleSigningIn || loading) && styles.disabledButton]}
              onPress={handleGoogleLogin}
              disabled={isGoogleSigningIn || loading}
            >
              <FontAwesome name="google" size={20} color="#4285f4" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>
                {isGoogleSigningIn ? 'Googleでログイン中...' : 'Googleでログイン'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={navigateToResetPassword}
              disabled={isSubmitting || isGoogleSigningIn}
            >
              <Text style={styles.forgotPasswordText}>パスワードを忘れた方</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.signupText}>アカウントをお持ちでない方</Text>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={navigateToSignup}
              disabled={isSubmitting || isGoogleSigningIn}
            >
              <Text style={styles.signupButtonText}>新規登録</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 16,
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
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#4facfe',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#4facfe',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 0,
    paddingVertical: 8,
  },
  signupText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  signupButton: {
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
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});