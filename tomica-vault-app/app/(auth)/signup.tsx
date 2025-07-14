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
import { Image } from 'react-native';

export default function SignupScreen() {
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await signUp({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        let errorMessage = '新規登録に失敗しました';
        
        switch (error.message) {
          case 'User already registered':
            errorMessage = 'このメールアドレスは既に登録済みです';
            break;
          case 'Password should be at least 6 characters':
            errorMessage = 'パスワードは6文字以上で設定してください';
            break;
          case 'Invalid email':
            errorMessage = '有効なメールアドレスを入力してください';
            break;
          case 'Signup is disabled':
            errorMessage = '現在新規登録は停止しています';
            break;
          default:
            errorMessage = `登録エラー: ${error.message}`;
        }
        
        Alert.alert('登録失敗', errorMessage);
      } else {
        // 登録成功時の処理
        Alert.alert(
          '登録完了',
          'アカウントが作成されました。確認メールを送信しましたので、メールの確認をお願いします。',
          [
            {
              text: 'OK',
              onPress: () => {
                if (data.user) {
                  // 自動ログインされた場合はメイン画面に遷移
                  router.replace('/(tabs)');
                } else {
                  // 確認待ちの場合はログイン画面に戻る
                  router.replace('/(auth)/login');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('サインアップ処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        let errorMessage = 'Googleログインに失敗しました';
        
        switch (error.message) {
          case 'User cancelled':
            errorMessage = 'ログインがキャンセルされました';
            break;
          case 'Network error':
            errorMessage = 'ネットワークエラーが発生しました';
            break;
          default:
            errorMessage = `Googleログインエラー: ${error.message}`;
        }
        
        Alert.alert('Googleログイン失敗', errorMessage);
      }
      // OAuth認証の場合、リダイレクトが処理されるため、ここでの成功処理は不要
    } catch (error) {
      console.error('Googleログイン処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
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
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: 64, height: 64 }} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>トイパト</Text>
            <Text style={styles.subtitle}>新規アカウント作成</Text>
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
                placeholder="パスワード（6文字以上）"
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

            <View style={styles.inputContainer}>
              <FontAwesome name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="パスワード確認"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, (isSubmitting || loading) && styles.disabledButton]}
              onPress={handleSignup}
              disabled={isSubmitting || loading}
            >
              <Text style={styles.signupButtonText}>
                {isSubmitting ? '登録中...' : '新規登録'}
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
                {isGoogleSigningIn ? 'Googleで登録中...' : 'Googleで登録'}
              </Text>
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                登録することで、利用規約とプライバシーポリシーに同意したものとみなします
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.loginText}>既にアカウントをお持ちの方</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={navigateToLogin}
              disabled={isSubmitting || isGoogleSigningIn}
            >
              <Text style={styles.loginButtonText}>ログイン</Text>
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
  signupButton: {
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
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'white',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});