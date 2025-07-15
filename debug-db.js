const { createClient } = require('./tomica-vault-app/node_modules/@supabase/supabase-js');

// リモートの環境変数を使用（.env.localから取得）
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDatabase() {
  console.log('=== データベース状況調査 ===');
  
  try {
    // 1. user_tomica_ownershipテーブルの現在のデータ確認
    console.log('\n1. user_tomica_ownership テーブルの状況:');
    const { data: ownershipData, error: ownershipError } = await supabase
      .from('user_tomica_ownership')
      .select('id, user_id, tomica_id')
      .order('id', { ascending: false })
      .limit(10);
    
    if (ownershipError) {
      console.error('所有権テーブル取得エラー:', ownershipError);
    } else {
      console.log('最新の所有権レコード（上位10件）:', ownershipData);
      if (ownershipData && ownershipData.length > 0) {
        console.log('最大ID:', Math.max(...ownershipData.map(d => d.id)));
      }
    }

    // 2. owned_tomicaテーブルの状況確認
    console.log('\n2. owned_tomica テーブルの状況:');
    const { data: tomicaData, error: tomicaError } = await supabase
      .from('owned_tomica')
      .select('id, name, nfc_tag_uid')
      .order('id', { ascending: false })
      .limit(5);
    
    if (tomicaError) {
      console.error('トミカテーブル取得エラー:', tomicaError);
    } else {
      console.log('最新のトミカレコード（上位5件）:', tomicaData);
    }

    // 3. 重複する可能性のあるNFCタグID確認
    console.log('\n3. NFCタグUID "1DBAF46B0F1080" の使用状況:');
    const { data: nfcData, error: nfcError } = await supabase
      .from('owned_tomica')
      .select('id, name, nfc_tag_uid')
      .eq('nfc_tag_uid', '1DBAF46B0F1080');
    
    if (nfcError) {
      console.error('NFCタグ検索エラー:', nfcError);
    } else {
      console.log('該当NFCタグのレコード:', nfcData);
    }

    // 4. 特定のユーザーIDで確認（エラーログから推測）
    console.log('\n4. テーブル統計:');
    const { count: ownershipCount, error: countError1 } = await supabase
      .from('user_tomica_ownership')
      .select('*', { count: 'exact', head: true });
    
    const { count: tomicaCount, error: countError2 } = await supabase
      .from('owned_tomica')
      .select('*', { count: 'exact', head: true });
    
    if (!countError1 && !countError2) {
      console.log('user_tomica_ownership レコード数:', ownershipCount);
      console.log('owned_tomica レコード数:', tomicaCount);
    }

  } catch (error) {
    console.error('調査中にエラーが発生:', error);
  }
}

debugDatabase();