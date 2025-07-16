import { Tomica } from '../hooks/useTomica';

export type Situation = 'まいご' | 'おでかけ' | 'おうち';

/**
 * トミカの状態を判断する共通関数
 * @param tomica トミカオブジェクト
 * @returns 状態（まいご、おでかけ、おうち）
 */
export const determineTomicaSituation = (tomica: Tomica): Situation => {
  const { check_in_at, checked_out_at, scanned_at } = tomica;

  // まいご判定（scanned_atベース）
  if (scanned_at === null) {
    // 一度もスキャンされていない場合、作成から48時間経過したらまいご
    const createdDate = new Date(tomica.created_at).getTime();
    const now = Date.now();
    if (now - createdDate >= 48 * 60 * 60 * 1000) {
      return 'まいご';
    }
  } else {
    // スキャンから48時間経過したらまいご
    const scannedDate = new Date(scanned_at).getTime();
    const now = Date.now();
    if (now - scannedDate >= 48 * 60 * 60 * 1000) {
      return 'まいご';
    }
  }

  // 既存のおでかけ・おうち判定
  if (check_in_at === null) {
    return 'おでかけ';
  }
  if (checked_out_at === null) return 'おうち';

  const checkedInDate = new Date(check_in_at).getTime();
  const checkedOutDate = new Date(checked_out_at).getTime();

  if (checkedInDate > checkedOutDate) {
    return 'おうち';
  } else {
    return 'おでかけ';
  }
};

/**
 * 状態の表示順を定義
 */
export const situationOrder: Record<Situation, number> = {
  'まいご': 0,
  'おでかけ': 1,
  'おうち': 2,
};