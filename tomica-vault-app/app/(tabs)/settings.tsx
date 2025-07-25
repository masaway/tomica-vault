import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, Switch, Platform, TextInput } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAuth } from '../../hooks/useAuth';
import { useAudio } from '../../hooks/useAudio';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'tint');
  const { user, profile, signOut, getAuthProvider, hasPassword, updateUserProfile, fetchProfile, setProfile } = useAuth();
  const { audioState, setEnabled, playSuccessSound } = useAudio();
  
  const authProvider = getAuthProvider();
  const userHasPassword = hasPassword();
  const isPasswordSetup = authProvider === 'google' && !userHasPassword;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile?.display_name || '');
  const [savingName, setSavingName] = useState(false);

  // 設定ページにアクセス時にプロファイルを取得
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id && !profile) {
        try {
          const fetchedProfile = await fetchProfile(user.id);
          if (fetchedProfile) {
            setProfile(fetchedProfile);
          }
        } catch (error) {
          console.error('プロファイル取得エラー:', error);
        }
      }
    };

    loadProfile();
  }, [user?.id, profile]);

  const handleEditName = () => {
    setEditName(profile?.display_name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateUserProfile({ display_name: editName });
      setIsEditingName(false);
    } catch (e) {
      alert('保存に失敗しました');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      '本当にログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('エラー', `ログアウトに失敗しました: ${error.message}`);
            }
            // AuthProviderが自動的にログイン画面に遷移します
          },
        },
      ]
    );
  };

  const handleProfileEdit = () => {
    // TODO: プロフィール編集画面の実装
    Alert.alert('準備中', 'プロフィール編集機能は準備中です');
  };

  const handlePasswordChange = () => {
    router.push('/change-password');
  };

  const handleAbout = () => {
    Alert.alert(
      'トイパトについて',
      'バージョン: 1.0.0\n\nおもちゃの収納管理アプリです。NFCタグを使っておもちゃの出し入れを記録できます。\n\n開発者: Toy Patrol Team',
      [{ text: 'OK' }]
    );
  };

  const handleAudioToggle = (value: boolean) => {
    setEnabled(value);
    if (value) {
      // 音声が有効になった時にテスト音を再生
      playSuccessSound().catch(error => {
        console.error('テスト音の再生に失敗:', error);
      });
    }
  };



  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* ユーザー情報セクション */}
        <View style={[styles.section, { borderBottomColor: borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>アカウント</Text>
          
          <View style={[styles.userInfo, { borderBottomColor: borderColor }]}>
            <FontAwesome name="user-circle" size={24} color={textColor} />
            <View style={styles.userDetails}>
              <Text style={[styles.userEmail, { color: textColor }]}>  
                {isEditingName ? (
                  <>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      style={{ color: textColor, borderBottomWidth: 1, borderColor: borderColor, minWidth: 120 }}
                      editable={!savingName}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={{ marginLeft: 8 }}>
                      <Text style={{ color: savingName ? '#aaa' : textColor }}>保存</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingName(false)} disabled={savingName} style={{ marginLeft: 8 }}>
                      <Text style={{ color: '#aaa' }}>キャンセル</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {profile?.display_name || 'ゲストユーザー'}
                    <TouchableOpacity onPress={handleEditName} style={{ marginLeft: 8 }}>
                      <FontAwesome name="edit" size={14} color={textColor} />
                    </TouchableOpacity>
                  </>
                )}
              </Text>
              <Text style={[styles.userSubtext, { color: textColor }]}>  
                メールアドレス: {user?.email || '未登録'}
              </Text>
              <Text style={[styles.authMethodText, { color: textColor }]}>
                🔐 利用可能な認証方法: {authProvider === 'google' ? 'Google' : 'Email'}
                {authProvider === 'google' && userHasPassword && ' + パスワード'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={handleProfileEdit}
          >
            <FontAwesome name="edit" size={16} color={textColor} style={styles.icon} />
            <Text style={[styles.settingText, { color: textColor }]}>プロフィール設定</Text>
            <FontAwesome name="chevron-right" size={12} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={handlePasswordChange}
          >
            <FontAwesome 
              name={isPasswordSetup ? "plus-circle" : "lock"} 
              size={16} 
              color={textColor} 
              style={styles.icon} 
            />
            <Text style={[styles.settingText, { color: textColor }]}>
              {isPasswordSetup ? 'パスワード設定' : 'パスワード変更'}
            </Text>
            <FontAwesome name="chevron-right" size={12} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* アプリ設定セクション */}
        <View style={[styles.section, { borderBottomColor: borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>アプリ設定</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
            <FontAwesome name="volume-up" size={16} color={textColor} style={styles.icon} />
            <Text style={[styles.settingText, { color: textColor }]}>音声効果</Text>
            <Switch
              value={audioState.isEnabled}
              onValueChange={handleAudioToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={audioState.isEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>




          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={handleAbout}
          >
            <FontAwesome name="info-circle" size={16} color={textColor} style={styles.icon} />
            <Text style={[styles.settingText, { color: textColor }]}>アプリについて</Text>
            <FontAwesome name="chevron-right" size={12} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* ログアウトセクション */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutButton]}
            onPress={handleLogout}
          >
            <FontAwesome name="sign-out" size={16} color="#ff4444" style={styles.icon} />
            <Text style={[styles.logoutText]}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  authMethodText: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  icon: {
    width: 20,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 