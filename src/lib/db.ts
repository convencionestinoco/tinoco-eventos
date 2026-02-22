import { createClient } from "@supabase/supabase-js";
import { EventData, InventoryItem } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── EVENTS (optimized: query by date range instead of fetching all) ──

/** Fetch events only for a specific month — drastically reduces reads */
export async function fetchEventsByMonth(year: number, month: number): Promise<EventData[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data || []).map(parseEvent);
}

/** Fetch events for a date range (used for week view or year overview) */
export async function fetchEventsByRange(startDate: string, endDate: string): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data || []).map(parseEvent);
}

/** Fetch counts per month for year overview (lightweight query) */
export async function fetchEventCountsByYear(year: number): Promise<Record<number, number>> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("events")
    .select("date")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  const counts: Record<number, number> = {};
  (data || []).forEach((row: { date: string }) => {
    const m = parseInt(row.date.split("-")[1], 10) - 1;
    counts[m] = (counts[m] || 0) + 1;
  });
  return counts;
}

/** Parse event from DB row — ensures advances is always an array */
function parseEvent(row: any): EventData {
  return {
    ...row,
    advances: Array.isArray(row.advances) ? row.advances : [],
    client_name: row.client_name || "",
    contact_number: row.contact_number || "",
    proforma_number: row.proforma_number || "",
    contract_number: row.contract_number || "",
  };
}

/** Save event — advances stored as JSONB column */
export async function saveEvent(event: EventData): Promise<EventData> {
  // Prepare payload with advances as JSON
  const payload = {
    type: event.type,
    name: event.name,
    client_name: event.client_name || "",
    contact_number: event.contact_number || "",
    proforma_number: event.proforma_number || "",
    contract_number: event.contract_number || "",
    date: event.date,
    venue: event.venue,
    time: event.time,
    guests: event.guests,
    decoration_color: event.decoration_color || "",
    observations: event.observations || "",
    status: event.status,
    amount: event.amount || 0,
    advances: event.advances || [],
  };

  if (event.id) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", event.id)
      .select()
      .single();
    if (error) throw error;
    return parseEvent(data);
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return parseEvent(data);
  }
}

/** Delete event — returns the id for local state removal */
export async function deleteEvent(id: string): Promise<string> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return id;
}

// ── KEEP LEGACY fetchEvents for backward compatibility ──
export async function fetchEvents(): Promise<EventData[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(parseEvent);
}

// ── INVENTORY ──

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("category", { ascending: true });
  if (error) throw error;
  return (data || []) as InventoryItem[];
}

export async function saveInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  const payload = {
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location || "",
    registered_by: item.registered_by || "",
    notes: item.notes || "",
  };

  if (item.id) {
    const { data, error } = await supabase
      .from("inventory")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    return data as InventoryItem;
  } else {
    const { data, error } = await supabase
      .from("inventory")
      .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as InventoryItem;
  }
}

export async function deleteInventoryItem(id: string): Promise<string> {
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
  return id;
}




