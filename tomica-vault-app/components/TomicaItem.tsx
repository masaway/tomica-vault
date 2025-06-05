import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

type Tomica = {
  id: number;
  name: string;
  situation: string;
  lastUpdatedDate: string;
  updatedBy: string;
};

type TomicaItemProps = {
  item: Tomica;
  onPress?: (item: Tomica) => void;
};

export function TomicaItem({ item, onPress }: TomicaItemProps) {
  const getSituationStyle = (situation: string) => {
    switch (situation) {
      case '外出中':
        return styles.situationOut;
      case '帰宅中':
        return styles.situationReturning;
      case '家出中':
        return styles.situationMissing;
      default:
        return styles.situationOut;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    } else {
      // デフォルトの動作：詳細画面に遷移
      router.push({
        pathname: '/details',
        params: { tomica: JSON.stringify(item) }
      });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.item}
      onPress={handlePress}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.situationContainer}>
        <Text style={[
          styles.situation,
          getSituationStyle(item.situation)
        ]}>
          {item.situation}
        </Text>
      </View>
      <Text style={styles.updateInfo}>
        最終更新: {new Date(item.lastUpdatedDate).toLocaleDateString()}
      </Text>
      <Text style={styles.updateInfo}>
        更新者: {item.updatedBy}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  situationContainer: {
    marginTop: 8,
  },
  situation: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  situationOut: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
  },
  situationReturning: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  situationMissing: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
  updateInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 