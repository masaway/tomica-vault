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
  return mockTomicas.find(tomica => tomica.id === id);
};

export const getTomicaByNfcId = async (nfcId: string): Promise<Tomica | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockTomicas.find(tomica => tomica.nfcId === nfcId);
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