export interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  brand_name?: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_price?: number;
  selling_price?: number;
  expiry_date: string;
  batch_number?: string;
  supplier_id?: number;
  supplier?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  is_low_stock: boolean;
  is_expiring_soon: boolean;
  created_at?: string;
  updated_at?: string;
}
