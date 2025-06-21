import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { TomicaStats } from '../hooks/useTomica';

interface RecentActivityProps {
  activities: TomicaStats['recentActivity'];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'たった今';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}日前`;
    }
  };

  const renderActivity = ({ item }: { item: TomicaStats['recentActivity'][0] }) => (
    <View style={[styles.activityItem, { borderBottomColor: tintColor + '20' }]}>
      <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
        <Ionicons 
          name={item.action === 'チェックイン' ? 'home' : 'car'} 
          size={16} 
          color={tintColor} 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.activityAction, { color: textColor + '80' }]}>
          {item.action}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: textColor + '60' }]}>
        {formatDate(item.timestamp)}
      </Text>
    </View>
  );

  if (activities.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <Ionicons name="time" size={20} color={tintColor} />
          <Text style={[styles.headerText, { color: textColor }]}>最近のアクティビティ</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: textColor + '60' }]}>
            まだアクティビティがありません
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Ionicons name="time" size={20} color={tintColor} />
        <Text style={[styles.headerText, { color: textColor }]}>最近のアクティビティ</Text>
      </View>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item, index) => `${item.name}-${item.timestamp}-${index}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityAction: {
    fontSize: 14,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});