export interface Advance {
  amount: number;
  locked: boolean;
}

export interface EventData {
  id?: string;
  type: string;
  name: string;
  date: string;
  venue: string;
  time: string;
  guests: number;
  decoration_color: string;
  observations: string;
  status: string;
  amount: number;
  advances: Advance[];
}

export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  cost_per_unit: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}
