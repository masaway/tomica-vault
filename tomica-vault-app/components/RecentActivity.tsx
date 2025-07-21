import { StyleSheet, View, Text, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { TomicaStats } from '../hooks/useTomica';
import { useRef, useEffect } from 'react';

interface RecentActivityProps {
  activities: TomicaStats['recentActivity'];
  animationKey?: number;
}

export function RecentActivity({ activities, animationKey = 0 }: RecentActivityProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  
  // コンテナのフェードインアニメーション
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // アニメーション値をリセット
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 800, // ダッシュボードカードの後に表示
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, animationKey]);

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

  // アクティビティアイテムのアニメーション値を管理
  const itemAnimations = useRef<{fade: Animated.Value, slide: Animated.Value}[]>([]).current;

  // アクティビティが変更されたときにアニメーション値をリセット
  useEffect(() => {
    // アニメーション配列をクリア
    itemAnimations.length = 0;

    if (activities.length > 0) {
      // 必要な数だけアニメーション値を準備
      activities.forEach(() => {
        itemAnimations.push({
          fade: new Animated.Value(0),
          slide: new Animated.Value(50),
        });
      });

      // 各アイテムのアニメーションを順次開始
      activities.forEach((_, index) => {
        if (itemAnimations[index]) {
          Animated.parallel([
            Animated.timing(itemAnimations[index].fade, {
              toValue: 1,
              duration: 400,
              delay: 1000 + (index * 100),
              useNativeDriver: true,
            }),
            Animated.timing(itemAnimations[index].slide, {
              toValue: 0,
              duration: 400,
              delay: 1000 + (index * 100),
              useNativeDriver: true,
            })
          ]).start();
        }
      });
    }
  }, [activities, itemAnimations, animationKey]);

  const renderActivity = ({ item, index }: { item: TomicaStats['recentActivity'][0], index: number }) => {
    const animation = itemAnimations[index];
    if (!animation) return null;

    return (
      <Animated.View 
        style={[
          styles.activityItem, 
          { 
            borderBottomColor: tintColor + '20',
            opacity: animation.fade,
            transform: [{ translateX: animation.slide }]
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
          <Ionicons 
            name={item.action === 'チェックイン' ? 'home' : item.action === 'タッチ' ? 'scan' : 'car'} 
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
      </Animated.View>
    );
  };

  if (activities.length === 0) {
    return (
      <Animated.View style={[
        styles.container, 
        { 
          backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.header}>
          <Ionicons name="time" size={20} color={tintColor} />
          <Text style={[styles.headerText, { color: textColor }]}>さいきんのタッチ</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: textColor + '60' }]}>
            まだタッチしていないよ
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.container, 
      { 
        backgroundColor,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.header}>
        <Ionicons name="time" size={20} color={tintColor} />
        <Text style={[styles.headerText, { color: textColor }]}>さいきんのタッチ</Text>
      </View>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item, index) => `${item.name}-${item.timestamp}-${index}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </Animated.View>
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