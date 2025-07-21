import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  
  // カスタムヘッダーコンポーネント
  const CustomHeader = ({ title }: { title: string }) => (
    <LinearGradient
      colors={[gradientStart, tintColor, gradientEnd]}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingTop: 50, // ステータスバー分の余白
      }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={{ 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#fff',
        textAlign: 'center'
      }}>
        {title}
      </Text>
    </LinearGradient>
  );

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: tintColor,
      tabBarStyle: {
        paddingHorizontal: 0,
        height: 100,
        paddingBottom: 10,
        paddingTop: 10,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500',
      },
      tabBarItemStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 4,
      },
      // タブ遷移アニメーション設定
      animation: 'shift',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: '一覧',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={28} color={color} />,
          header: () => <CustomHeader title="おもちゃ一覧" />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '追加',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="plus-circle" size={28} color={color} />
          ),
          tabBarLabel: '追加',
          header: () => <CustomHeader title="新規登録" />,
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
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={28} color={color} />,
          header: () => <CustomHeader title="設定" />,
        }}
      />
    </Tabs>
  );
}
