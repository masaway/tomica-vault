import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { router } from 'expo-router';

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
}

function QuickAction({ title, icon, onPress, color }: QuickActionProps) {
  const textColor = useThemeColor({}, 'text');
  
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={[styles.actionText, { color: textColor + '99' }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function QuickActions() {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const actions = [
    {
      title: 'おもちゃ追加',
      icon: 'add-circle' as const,
      onPress: () => router.push('/(tabs)/add'),
      color: '#4ECDC4',
    },
    {
      title: '一覧表示',
      icon: 'list' as const,
      onPress: () => router.push('/(tabs)/list'),
      color: '#FF6B6B',
    },
    {
      title: '設定',
      icon: 'settings' as const,
      onPress: () => router.push('/(tabs)/settings'),
      color: '#F093FB',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Ionicons name="flash" size={20} color={tintColor} />
        <Text style={[styles.headerText, { color: textColor }]}>クイックアクション</Text>
      </View>
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <QuickAction
            key={index}
            title={action.title}
            icon={action.icon}
            onPress={action.onPress}
            color={action.color}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});