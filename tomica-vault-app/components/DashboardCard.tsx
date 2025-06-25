import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  onPress?: () => void;
  subtitle?: string;
}

export function DashboardCard({ 
  title, 
  value, 
  icon, 
  gradientColors, 
  onPress, 
  subtitle 
}: DashboardCardProps) {

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
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color="#fff" />
          </View>
          <Text style={styles.value}>{value}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {CardContent}
    </View>
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
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
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