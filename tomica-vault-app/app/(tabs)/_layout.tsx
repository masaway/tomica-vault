import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');

  const handleAddPress = () => {
    Alert.alert(
      '新規登録',
      '新しいトミカを登録しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '登録する',
          onPress: () => router.push('/add'),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: tintColor,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '新規登録',
          tabBarButton: (props) => (
            <Pressable
              onPress={handleAddPress}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                  alignItems: 'center',
                },
              ]}
            >
              <FontAwesome
                name="plus-circle"
                size={32}
                color={tintColor}
                style={{ marginBottom: 2 }}
              />
              <Text style={{ fontSize: 10, color: tintColor }}>新規登録</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'トミカ一覧',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
