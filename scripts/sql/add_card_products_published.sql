-- card_products に公開フラグ追加
-- false (未公開) の商品は一般ユーザーから非表示
alter table card_products add column if not exists is_published boolean default false not null;

-- 既存データは一旦非公開にしておく (admin/fam は閲覧可)
-- update card_products set is_published = false;

-- GO 出たアルバムだけ true に (例: 17 CARAT, BOYS BE)
update card_products set is_published = true where product_id in ('P_KR001', 'P_KR002');
