import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tomica } from '@/hooks/useTomica';
import { determineTomicaSituation } from '@/utils/tomicaUtils';

interface NFCModalProps {
  visible: boolean;
  onClose: () => void;
  tomicaList: Tomica[];
  onCheckOut: (tomica: Tomica) => void;
  onCheckIn: (tomica: Tomica) => void;
  onToggleSleep: (tomica: Tomica) => void;
  scannedNfcTagId?: string;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');
const statusBarHeight = StatusBar.currentHeight || 0;

export default function NFCModal({
  visible,
  onClose,
  tomicaList,
  onCheckOut,
  onCheckIn,
  onToggleSleep,
  scannedNfcTagId,
}: NFCModalProps) {
  const handleViewDetails = (tomica: Tomica) => {
    onClose();
    router.push(`/details?id=${tomica.id}`);
  };

  const getStatusBadgeStyle = (situation: string) => {
    switch (situation) {
      case 'おでかけ':
        return styles.situationOutBadge;
      case 'まいご':
        return styles.situationMissingBadge;
      case 'おやすみ':
        return styles.situationSleepingBadge;
      case 'おうち':
      default:
        return styles.situationReturningBadge;
    }
  };

  const getStatusTextStyle = (situation: string) => {
    switch (situation) {
      case 'おでかけ':
        return styles.situationOutText;
      case 'まいご':
        return styles.situationMissingText;
      case 'おやすみ':
        return styles.situationSleepingText;
      case 'おうち':
      default:
        return styles.situationReturningText;
    }
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
    const situation = determineTomicaSituation(tomica);
    
    // ドキュメント仕様に基づくボタン活性制御
    const canGoOut = situation === 'まいご' || situation === 'おうち' || situation === 'おやすみ';
    const canComeHome = situation === 'おでかけ' || situation === 'おやすみ';
    
    return (
      <View key={tomica.id} style={styles.tomicaCard}>
        <View style={styles.cardHeader}>
          <TouchableOpacity 
            style={styles.tomicaNameContainer}
            onPress={() => handleViewDetails(tomica)}
          >
            <Text style={styles.tomicaName}>{tomica.name}</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, getStatusBadgeStyle(situation)]}>
            <Text style={[styles.statusText, getStatusTextStyle(situation)]}>
              {situation}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.primaryButton,
              !canComeHome && styles.disabledButton
            ]}
            onPress={() => canComeHome ? onCheckIn(tomica) : null}
            disabled={!canComeHome}
          >
            <Ionicons
              name="home"
              size={20}
              color={canComeHome ? "#fff" : "#ccc"}
            />
            <Text 
              style={[
                styles.primaryButtonText,
                !canComeHome && styles.disabledButtonText
              ]}
              numberOfLines={1}
            >
              おうち
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.goOutButton,
              !canGoOut && styles.disabledSecondaryButton
            ]}
            onPress={() => canGoOut ? onCheckOut(tomica) : null}
            disabled={!canGoOut}
          >
            <Ionicons 
              name="exit" 
              size={20} 
              color={canGoOut ? "#ff9800" : "#ccc"} 
            />
            <Text 
              style={[
                styles.goOutButtonText,
                !canGoOut && styles.disabledButtonText
              ]}
              numberOfLines={1}
            >
              おでかけ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.sleepButton]}
            onPress={() => onToggleSleep(tomica)}
          >
            <Ionicons 
              name={situation === 'おやすみ' ? 'sunny' : 'moon'} 
              size={20} 
              color="#1976d2" 
            />
            <Text style={styles.sleepButtonText} numberOfLines={1}>
              {situation === 'おやすみ' ? 'おこす' : 'おやすみ'}
            </Text>
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
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="radio" size={24} color="#4A90E2" />
              <Text style={styles.modalTitle}>おもちゃタッチけっか</Text>
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
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              {tomicaList.length >= 1 && (
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: statusBarHeight,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.7,
    width: '100%',
    maxWidth: screenWidth > 600 ? 700 : 600,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tomicaNameContainer: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 4,
  },
  tomicaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  situationOutBadge: {
    backgroundColor: '#fff3e0',
  },
  situationReturningBadge: {
    backgroundColor: '#e8f5e9',
  },
  situationMissingBadge: {
    backgroundColor: '#ffebee',
  },
  situationSleepingBadge: {
    backgroundColor: '#e3f2fd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  situationOutText: {
    color: '#e65100',
  },
  situationReturningText: {
    color: '#2e7d32',
  },
  situationMissingText: {
    color: '#d32f2f',
  },
  situationSleepingText: {
    color: '#1976d2',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 0,
  },
  primaryButton: {
    backgroundColor: '#2e7d32', // おうちボタン - グリーン
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff9800', // おでかけボタン - オレンジ
  },
  goOutButton: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  disabledSecondaryButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disabledButtonText: {
    color: '#ccc',
  },
  sleepButton: {
    backgroundColor: '#e3f2fd', // 薄い青系でおやすみを表現
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  sleepButtonText: {
    color: '#1976d2', // はっきりとした青色
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#ff9800', // おでかけボタンテキスト - オレンジ
    fontSize: 14,
    fontWeight: '600',
  },
  goOutButtonText: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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