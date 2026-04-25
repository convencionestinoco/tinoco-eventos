export interface Advance {
  amount: number;
  locked: boolean;
}

export interface EventData {
  id?: string;
  type: string;
  name: string;
  client_name: string;
  contact_number: string;
  proforma_number: string;
  contract_number: string;
  date: string;
  venue: string;
  time: string;
  guests: number;
  decoration_color: string;
  observations: string;
  status: string;
  amount: number;
  advances: Advance[];
  registered_by?: string;
  registered_at?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  registered_by: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProspectionRecord {
  id?: string;
  name: string;
  type: string;
  sector: string;
  district: string;
  address: string;
  level: string;
  contact1: string;
  phone1: string;
  contact2: string;
  phone2: string;
  status: string;
  last_contact: string;
  next_contact: string;
  next_step: string;
  comments: string;
  created_at?: string;
  updated_at?: string;
}
