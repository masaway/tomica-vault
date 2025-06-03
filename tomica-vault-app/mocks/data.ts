import { Tomica, Collection } from './types';

export const mockTomicas: Tomica[] = [
  {
    id: '1',
    name: 'トヨタ クラウン',
    series: 'No.1',
    releaseYear: 2023,
    imageUrl: 'https://example.com/crown.jpg',
    nfcId: 'nfc-001',
    condition: 'new',
    notes: '限定カラー',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: '2',
    name: '日産 スカイライン',
    series: 'No.2',
    releaseYear: 2023,
    imageUrl: 'https://example.com/skyline.jpg',
    nfcId: 'nfc-002',
    condition: 'used',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
];

export const mockCollections: Collection[] = [
  {
    id: '1',
    name: '2023年コレクション',
    description: '2023年に発売されたトミカのコレクション',
    tomicas: mockTomicas,
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
]; 