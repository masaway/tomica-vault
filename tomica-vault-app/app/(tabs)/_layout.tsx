import { FontAwesome } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: tintColor,
      tabBarStyle: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
      },
      tabBarLabelStyle: {
        fontSize: 10,
      },
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
        name="list"
        options={{
          title: 'おもちゃ一覧',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '新規登録',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="plus-circle" size={32} color={color} />
          ),
          tabBarLabel: '新規登録',
        }}
        // もし「新規登録」タブ押下時に特別な遷移が必要な場合は、下記コメントアウトを参考にしてください
        // listeners={{
        //   tabPress: (e) => {
        //     e.preventDefault();
        //     router.push('/add');
        //   },
        // }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
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
