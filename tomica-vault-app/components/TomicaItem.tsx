import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from '../hooks/useThemeColor';
import type { Situation } from '../utils/tomicaUtils';

type Tomica = {
  id: number;
  name: string;
  situation: string;
  nfc_tag_uid: string;
  check_in_at: string | null;
  checked_out_at: string | null;
  lastUpdatedDate: string;
  updatedBy: string;
};

type TomicaItemProps = {
  item: Tomica;
  onPress?: (item: Tomica) => void;
};

export function TomicaItem({ item, onPress }: TomicaItemProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const mutedColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  const getSituationStyle = (situation: Situation) => {
    switch (situation) {
      case 'おでかけ':
        return styles.situationOut;
      case 'まいご':
        return styles.situationMissing;
      case 'おやすみ':
        return styles.situationSleeping;
      case 'おうち':
      default:
        return styles.situationReturning;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    } else {
      router.push({
        pathname: '/details',
        params: { id: item.id.toString() }
      });
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: borderColor }]}
      onPress={handlePress}
    >
      <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
      <View style={styles.situationContainer}>
        <Text style={[
          styles.situation,
          getSituationStyle(item.situation as Situation)
        ]}>
          {item.situation}
        </Text>
      </View>
      <Text style={[styles.updateInfo, { color: mutedColor }]}>
        最終更新: {formatDate(item.lastUpdatedDate)}
      </Text>
      {item.updatedBy && (
        <Text style={[styles.updateInfo, { color: mutedColor }]}>
          更新者: {item.updatedBy}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
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
  situationSleeping: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  updateInfo: {
    fontSize: 14,
    marginTop: 4,
  },
}); 