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
  return (data || []) as EventData[];
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
  return (data || []) as EventData[];
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

/** Save event — returns the saved event so we can update state locally */
export async function saveEvent(event: EventData): Promise<EventData> {
  if (event.id) {
    const { data, error } = await supabase
      .from("events")
      .update(event)
      .eq("id", event.id)
      .select()
      .single();
    if (error) throw error;
    return data as EventData;
  } else {
    const { id, ...rest } = event;
    const { data, error } = await supabase
      .from("events")
      .insert(rest)
      .select()
      .single();
    if (error) throw error;
    return data as EventData;
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
  return (data || []) as EventData[];
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
  if (item.id) {
    const { data, error } = await supabase
      .from("inventory")
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    return data as InventoryItem;
  } else {
    const { id, ...rest } = item;
    const { data, error } = await supabase
      .from("inventory")
      .insert({ ...rest, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
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



