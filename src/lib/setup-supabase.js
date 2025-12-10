import * as supabase from './supabase.js';

// Parcel/WebpackなどでUMDをインポートすると、モジュールとして扱われるため
// グローバル変数 window.supabase に自動的にセットされません。
// 手動でセットして、後続の dataviz-auth-client.js から参照できるようにします。

// exportsの内容に応じて調整
if (supabase.createClient) {
  window.supabase = supabase;
} else if (supabase.default && supabase.default.createClient) {
  window.supabase = supabase.default;
} else {
  // その他のパターン（createClientがnamed exportでない場合など）
  // 念のためすべて割り当てておく
  window.supabase = supabase;
}
