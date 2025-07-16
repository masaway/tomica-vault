import { Tomica, Collection } from './types';

// 現在時刻とテスト用タイムスタンプを作成
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(); // 49時間前
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const nowISO = now.toISOString();

export const mockTomicas: Tomica[] = [
  {
    id: 1,
    name: 'トヨタ クラウン（おでかけ中）',
    nfc_tag_uid: '12345',
    check_in_at: yesterday,
    checked_out_at: oneHourAgo, // 1時間前におでかけ
    purchase_date: '2024-01-15T00:00:00Z',
    memo: 'おでかけテスト用',
    scanned_at: oneHourAgo,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: oneHourAgo,
    deleted_at: null,
    is_sleeping: false,
  },
  {
    id: 2,
    name: '日産 スカイライン（おうち）',
    nfc_tag_uid: 'test-nfc-002',
    check_in_at: oneHourAgo, // 1時間前に帰宅
    checked_out_at: yesterday,
    purchase_date: '2024-01-20T00:00:00Z',
    memo: 'おうちテスト用',
    scanned_at: oneHourAgo,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: oneHourAgo,
    deleted_at: null,
    is_sleeping: false,
  },
  {
    id: 3,
    name: 'ホンダ シビック（まいご）',
    nfc_tag_uid: 'test-nfc-003',
    check_in_at: null,
    checked_out_at: twoDaysAgo, // 49時間前におでかけしたまま
    purchase_date: '2024-02-01T00:00:00Z',
    memo: 'まいごテスト用',
    scanned_at: twoDaysAgo, // 49時間前が最後のスキャン
    created_at: '2024-02-01T00:00:00Z',
    updated_at: twoDaysAgo,
    deleted_at: null,
    is_sleeping: false,
  },
  {
    id: 4,
    name: 'マツダ デミオ（おやすみ）',
    nfc_tag_uid: 'test-nfc-004',
    check_in_at: yesterday,
    checked_out_at: null,
    purchase_date: '2024-02-10T00:00:00Z',
    memo: 'おやすみテスト用',
    scanned_at: yesterday,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: yesterday,
    deleted_at: null,
    is_sleeping: true, // おやすみモード
  },
  {
    id: 5,
    name: 'スバル インプレッサ（複数検出テスト）',
    nfc_tag_uid: 'test-nfc-005',
    check_in_at: oneHourAgo,
    checked_out_at: yesterday,
    purchase_date: '2024-02-15T00:00:00Z',
    memo: '複数検出テスト用',
    scanned_at: oneHourAgo,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: oneHourAgo,
    deleted_at: null,
    is_sleeping: false,
  },
];

export const mockCollections: Collection[] = [
  {
    id: '1',
    name: '2023年コレクション',
    description: '2023年に発売されたおもちゃのコレクション',
    tomicas: mockTomicas,
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
]; 