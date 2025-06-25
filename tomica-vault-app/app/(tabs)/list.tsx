import { StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { NFCShortcut } from '../../components/NFCShortcut';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { TomicaItem } from '../../components/TomicaItem';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';

// トミカの状態を判断する関数
const determineTomicaSituation = (tomica: Tomica): '外出中' | '帰宅中' => {
  const { check_in_at, checked_out_at } = tomica;

  // check_in_atがnullなら外出中
  if (check_in_at === null) {
    return '外出中';
  }

  // checked_out_atがnullなら帰宅中
  if (checked_out_at === null) {
    return '帰宅中';
  }

  // 両方の値が存在する場合、日付を比較
  const checkedInDate = new Date(check_in_at).getTime();
  const checkedOutDate = new Date(checked_out_at).getTime();

  return checkedInDate > checkedOutDate ? '帰宅中' : '外出中';
};

export default function ListScreen() {
  const { tomicaList, loading, error, fetchTomicaList } = useTomica();

  // 画面フォーカス時に最新リスト取得
  useFocusEffect(
    React.useCallback(() => {
      fetchTomicaList();
    }, [])
  );

  // TomicaItem用のitem生成
  const toTomicaItemProps = (item: Tomica) => ({
    id: item.id,
    name: item.name,
    situation: determineTomicaSituation(item),
    nfc_tag_uid: item.nfc_tag_uid,
    check_in_at: item.check_in_at,
    checked_out_at: item.checked_out_at,
    lastUpdatedDate: item.updated_at ? item.updated_at : '',
    updatedBy: '' // DBにないので空文字
  });

  const renderItem = ({ item }: { item: Tomica }) => (
    <TomicaItem item={toTomicaItemProps(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>トミカ一覧</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <Text>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={tomicaList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
      <NFCShortcut />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
}); 