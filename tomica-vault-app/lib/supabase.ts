import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// SupabaseのプロジェクトURLとanon keyを環境変数から取得
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// トミカのテーブル名
export const TOMICA_TABLE = 'owned_tomica'; 