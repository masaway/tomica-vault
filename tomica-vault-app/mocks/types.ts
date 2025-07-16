export interface Tomica {
  id: number;
  name: string;
  nfc_tag_uid: string;
  check_in_at: string | null;
  checked_out_at: string | null;
  purchase_date: string | null;
  memo: string | null;
  scanned_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_sleeping: boolean | null;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  tomicas: Tomica[];
  createdAt: string;
  updatedAt: string;
} 