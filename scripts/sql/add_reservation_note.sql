-- my_entries の拡張カラム
-- Supabase Dashboard の SQL Editor で実行してください

-- 予約番号
ALTER TABLE my_entries ADD COLUMN IF NOT EXISTS reservation_note text;

-- チケット入手経路 (日本 LIVE 用): 'FC_1ST' / 'MOBILE_1ST' / 'FC_2ND' / 'MOBILE_2ND' /
-- 'LAWSON_LOTTERY' / 'LAWSON_GENERAL' / 'TICKET_SHARE' / 'EQUIPMENT_RELEASE' / null
ALTER TABLE my_entries ADD COLUMN IF NOT EXISTS ticket_source text;
