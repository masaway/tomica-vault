import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useEffect, useState } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  onPress?: () => void;
  subtitle?: string;
  delay?: number;
  animationKey?: number;
}

export function DashboardCard({ 
  title, 
  value, 
  icon, 
  gradientColors, 
  onPress, 
  subtitle,
  delay = 0,
  animationKey = 0
}: DashboardCardProps) {
  // 楽しいアニメーション効果のためのAnimated値
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // フェードイン・スライドインアニメーション
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // カウントアップアニメーション
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // アニメーション値をリセット
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    countAnim.setValue(0);
    setDisplayValue(0);

    // 初期表示アニメーション
    const showAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      })
    ]);

    // カウントアップアニメーション
    const numericValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    const countAnimation = Animated.timing(countAnim, {
      toValue: numericValue,
      duration: 1200,
      delay: delay + 300,
      useNativeDriver: false,
    });

    // アニメーション値の監視
    const listener = countAnim.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    // アニメーション実行
    showAnimation.start(() => {
      countAnimation.start();
    });

    return () => {
      countAnim.removeListener(listener);
    };
  }, [value, delay, fadeAnim, slideAnim, countAnim, animationKey]);

  // タッチ時のバウンスアニメーション
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 15,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 15,
      })
    ]).start();
  };

  const CardContent = (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardContent}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconAndValueContainer}>
          <Animated.View style={[
            styles.iconContainer,
            {
              transform: [
                { rotate: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '10deg']
                })}
              ]
            }
          ]}>
            <Ionicons name={icon} size={24} color="#fff" />
          </Animated.View>
          <Text style={styles.value}>{displayValue}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Animated.View style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}>
        <TouchableOpacity 
          onPress={onPress} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{ borderRadius: 16 }}
        >
          {CardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.card,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {CardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientContainer: {
    borderRadius: 16,
    padding: 20,
    height: 140,
  },
  cardContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  iconAndValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginTop: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '600',
    textAlign: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
});