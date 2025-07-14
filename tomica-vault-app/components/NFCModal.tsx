import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tomica } from '@/hooks/useTomica';

interface NFCModalProps {
  visible: boolean;
  onClose: () => void;
  tomicaList: Tomica[];
  onCheckOut: (tomica: Tomica) => void;
  onCheckIn: (tomica: Tomica) => void;
  scannedNfcTagId?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function NFCModal({
  visible,
  onClose,
  tomicaList,
  onCheckOut,
  onCheckIn,
  scannedNfcTagId,
}: NFCModalProps) {
  const handleViewDetails = (tomica: Tomica) => {
    onClose();
    router.push(`/details?id=${tomica.id}`);
  };

  const isCheckedOut = (tomica: Tomica) => {
    const { check_in_at, checked_out_at } = tomica;
    
    if (check_in_at === null && checked_out_at !== null) {
      return true;
    }
    
    if (check_in_at !== null && checked_out_at !== null) {
      return new Date(checked_out_at).getTime() > new Date(check_in_at).getTime();
    }
    
    return false;
  };

  const renderTomicaCard = (tomica: Tomica, index: number) => {
    const checkedOut = isCheckedOut(tomica);
    
    return (
      <View key={tomica.id} style={[styles.tomicaCard, index > 0 && styles.additionalCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.tomicaName}>{tomica.name}</Text>
          <View style={[styles.statusBadge, checkedOut ? styles.checkedOutBadge : styles.checkedInBadge]}>
            <Text style={[styles.statusText, checkedOut ? styles.checkedOutText : styles.checkedInText]}>
              {checkedOut ? '外出中' : '帰宅中'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => checkedOut ? onCheckIn(tomica) : onCheckOut(tomica)}
          >
            <Ionicons
              name={checkedOut ? 'home' : 'exit'}
              size={20}
              color="#fff"
            />
            <Text style={styles.primaryButtonText}>
              {checkedOut ? '帰宅登録' : '持ち出し登録'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleViewDetails(tomica)}
          >
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>詳細を見る</Text>
          </TouchableOpacity>
        </View>
        
        {tomica.memo && (
          <View style={styles.memoContainer}>
            <Text style={styles.memoLabel}>メモ:</Text>
            <Text style={styles.memoText}>{tomica.memo}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="radio" size={24} color="#4A90E2" />
              <Text style={styles.modalTitle}>NFC読み取り結果</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {tomicaList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle" size={36} color="#ccc" />
              <Text style={styles.emptyTitle}>おもちゃが見つかりません</Text>
              <Text style={styles.emptyMessage}>
                このNFCタグは登録されていません。{'\n'}
                新しいおもちゃとして登録しますか？
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, styles.fullWidthButton]}
                onPress={() => {
                  onClose();
                  const params = scannedNfcTagId ? `?nfcTagId=${scannedNfcTagId}` : '';
                  router.push(`/add${params}`);
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>新規登録</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {tomicaList.length > 1 && (
                <View style={styles.multipleNotice}>
                  <Ionicons name="layers" size={16} color="#FF9500" />
                  <Text style={styles.multipleText}>
                    {tomicaList.length}個のおもちゃが検出されました
                  </Text>
                </View>
              )}
              {tomicaList.map((tomica, index) => renderTomicaCard(tomica, index))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: screenHeight * 0.85,
    minHeight: 350,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  tomicaCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  additionalCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tomicaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkedOutBadge: {
    backgroundColor: '#ffe6e6',
  },
  checkedInBadge: {
    backgroundColor: '#e6f3ff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkedOutText: {
    color: '#d63031',
  },
  checkedInText: {
    color: '#0984e3',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  memoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'space-evenly',
    flex: 1,
    minHeight: 280,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  multipleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  multipleText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
});