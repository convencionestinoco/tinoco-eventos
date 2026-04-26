line 1: import { EventData, ... } from "@/lib/types";
line 2: import { EventData, ... } from "./types";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── EVENTS ──

export async function fetchEventsByMonth(year: number, month: number): Promise<EventData[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data, error } = await supabase.from("events").select("*").gte("date", startDate).lte("date", endDate).order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

export async function fetchEventsByRange(startDate: string, endDate: string): Promise<EventData[]> {
  const { data, error } = await supabase.from("events").select("*").gte("date", startDate).lte("date", endDate).order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

export async function fetchEventCountsByYear(year: number): Promise<Record<number, number>> {
  const { data, error } = await supabase.from("events").select("date").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
  if (error) throw error;
  const counts: Record<number, number> = {};
  (data || []).forEach((row: { date: string }) => {
    const m = parseInt(row.date.split("-")[1], 10) - 1;
    counts[m] = (counts[m] || 0) + 1;
  });
  return counts;
}

export async function fetchAllEventsForReports(year: number): Promise<EventData[]> {
  const { data, error } = await supabase.from("events").select("*").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`).order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

export async function fetchPendingQuotations(): Promise<EventData[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("events").select("*").eq("status", "cotizacion").gte("date", today).order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

function parseEvent(row: any): EventData {
  return {
    ...row,
    advances: Array.isArray(row.advances) ? row.advances : [],
    client_name: row.client_name || "",
    contact_number: row.contact_number || "",
    proforma_number: row.proforma_number || "",
    contract_number: row.contract_number || "",
    registered_by: row.registered_by || "",
    registered_at: row.registered_at || "",
  };
}

export async function saveEvent(event: EventData): Promise<EventData> {
  const payload: any = {
    type: event.type, name: event.name, client_name: event.client_name || "",
    contact_number: event.contact_number || "", proforma_number: event.proforma_number || "",
    contract_number: event.contract_number || "", date: event.date, venue: event.venue,
    time: event.time, guests: event.guests, decoration_color: event.decoration_color || "",
    observations: event.observations || "", status: event.status, amount: event.amount || 0,
    advances: event.advances || [], registered_by: event.registered_by || "",
  };
  if (event.id) {
    const { data, error } = await supabase.from("events").update(payload).eq("id", event.id).select().single();
    if (error) throw error;
    return parseEvent(data);
  } else {
    payload.registered_at = new Date().toISOString();
    const { data, error } = await supabase.from("events").insert(payload).select().single();
    if (error) throw error;
    return parseEvent(data);
  }
}

export async function deleteEvent(id: string): Promise<string> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return id;
}

export async function fetchEvents(): Promise<EventData[]> {
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

// ── INVENTORY ──

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").select("*").order("category", { ascending: true });
  if (error) throw error;
  return (data || []) as InventoryItem[];
}

export async function saveInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  const payload = { name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, location: item.location || "", registered_by: item.registered_by || "", notes: item.notes || "" };
  if (item.id) {
    const { data, error } = await supabase.from("inventory").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", item.id).select().single();
    if (error) throw error;
    return data as InventoryItem;
  } else {
    const { data, error } = await supabase.from("inventory").insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data as InventoryItem;
  }
}

export async function deleteInventoryItem(id: string): Promise<string> {
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
  return id;
}

// ── PROSPECTION ──

export async function fetchProspectionRecords(): Promise<ProspectionRecord[]> {
  const { data, error } = await supabase.from("prospection").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as ProspectionRecord[];
}

export async function saveProspectionRecord(record: ProspectionRecord): Promise<ProspectionRecord> {
  const payload = {
    name: record.name, type: record.type || "Colegio", sector: record.sector || "Privado",
    district: record.district || "Ayacucho", address: record.address || "", level: record.level || "",
    contact1: record.contact1 || "", phone1: record.phone1 || "", contact2: record.contact2 || "",
    phone2: record.phone2 || "", status: record.status || "Pendiente de contacto",
    last_contact: record.last_contact || null, next_contact: record.next_contact || null,
    next_step: record.next_step || "", comments: record.comments || "",
  };
  if (record.id) {
    const { data, error } = await supabase.from("prospection").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", record.id).select().single();
    if (error) throw error;
    return data as ProspectionRecord;
  } else {
    const { data, error } = await supabase.from("prospection").insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data as ProspectionRecord;
  }
}

export async function deleteProspectionRecord(id: string): Promise<string> {
  const { error } = await supabase.from("prospection").delete().eq("id", id);
  if (error) throw error;
  return id;
}

// ── APP USERS ──

export async function fetchAppUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase.from("app_users").select("id,name,email,role,active,created_at").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as AppUser[];
}

export async function loginUser(email: string, password: string): Promise<AppUser | null> {
  const { data, error } = await supabase.from("app_users").select("*").eq("email", email.trim().toLowerCase()).eq("password_hash", password).eq("active", true).single();
  if (error || !data) return null;
  return data as AppUser;
}

export async function saveAppUser(user: AppUser): Promise<AppUser> {
  const payload = { name: user.name, email: user.email.trim().toLowerCase(), password_hash: user.password_hash, role: user.role, active: user.active };
  if (user.id) {
    const { data, error } = await supabase.from("app_users").update(payload).eq("id", user.id).select().single();
    if (error) throw error;
    return data as AppUser;
  } else {
    const { data, error } = await supabase.from("app_users").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data as AppUser;
  }
}

export async function deleteAppUser(id: string): Promise<string> {
  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) throw error;
  return id;
}

