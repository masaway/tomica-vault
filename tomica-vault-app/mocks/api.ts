import { Tomica, Collection } from './types';
import { mockTomicas, mockCollections } from './data';

// おもちゃ関連のAPI
export const getTomicas = async (): Promise<Tomica[]> => {
  // 実際のAPIコールをシミュレート
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTomicas;
};

export const getTomicaById = async (id: string): Promise<Tomica | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockTomicas.find(tomica => tomica.id.toString() === id);
};

export const getTomicaByNfcId = async (nfcTagUid: string): Promise<Tomica | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockTomicas.find(tomica => tomica.nfc_tag_uid === nfcTagUid);
};

// 複数のトミカが同じNFCタグを持つ場合のテスト用（デバッグ専用）
export const getTomicasByNfcId = async (nfcTagUid: string): Promise<Tomica[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 特定のテストNFCタグIDの場合は複数返す
  if (nfcTagUid === 'test-multiple') {
    return [mockTomicas[0], mockTomicas[1]]; // 複数検出テスト
  }
  
  const found = mockTomicas.filter(tomica => tomica.nfc_tag_uid === nfcTagUid);
  return found;
};

// コレクション関連のAPI
export const getCollections = async (): Promise<Collection[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCollections;
};

export const getCollectionById = async (id: string): Promise<Collection | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockCollections.find(collection => collection.id === id);
}; 