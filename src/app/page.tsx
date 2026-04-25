"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchEventsByMonth,
  fetchEventsByRange,
  fetchEventCountsByYear,
  saveEvent,
  deleteEvent,
  fetchInventoryItems,
  saveInventoryItem,
  deleteInventoryItem,
  fetchProspectionRecords,
  saveProspectionRecord,
  deleteProspectionRecord,
} from "@/lib/db";
import { EventData, Advance, InventoryItem, ProspectionRecord } from "@/lib/types";

const ADMIN_PASSWORD = "TINOCOadm@";
const VENUES = [
  { id: "primer_piso", label: "Primer Piso", icon: "🏢" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "salon", label: "Salón", icon: "🎪" },
  { id: "otro", label: "Otro Ambiente", icon: "✨" },
];
const EVENT_TYPES = [
  { value: "boda", label: "Boda", emoji: "💒" },
  { value: "cumpleanos", label: "Cumpleaños", emoji: "🎂" },
  { value: "corporativo", label: "Reunión Corporativa", emoji: "💼" },
  { value: "aniversario", label: "Aniversario", emoji: "🥂" },
  { value: "bautizo", label: "Bautizo", emoji: "⛪" },
  { value: "graduacion", label: "Graduación", emoji: "🎓" },
  { value: "quinceanos", label: "Quinceañera", emoji: "👑" },
  { value: "conferencia", label: "Conferencia", emoji: "🎤" },
  { value: "otro", label: "Otro", emoji: "📌" },
];
const STATUS_OPTIONS = [
  { value: "confirmado", label: "Confirmado", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  { value: "cotizacion", label: "En Cotización", color: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
];
const INVENTORY_CATEGORIES = [
  { value: "bebidas", label: "Bebidas", icon: "🍷" },
  { value: "alimentos", label: "Alimentos", icon: "🍖" },
  { value: "decoracion", label: "Decoración", icon: "🎨" },
  { value: "mobiliario", label: "Mobiliario", icon: "🪑" },
  { value: "vajilla", label: "Vajilla & Cubiertos", icon: "🍽️" },
  { value: "manteleria", label: "Mantelería", icon: "🧵" },
  { value: "equipos", label: "Equipos & Audio", icon: "🔊" },
  { value: "limpieza", label: "Limpieza", icon: "🧹" },
  { value: "otros", label: "Otros", icon: "📦" },
];
const INVENTORY_LOCATIONS = [
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "salon", label: "Salón", icon: "🎪" },
  { value: "primer_piso", label: "Primer Piso", icon: "🏢" },
  { value: "almacen", label: "Almacén", icon: "🏗️" },
  { value: "cocina", label: "Cocina", icon: "👨‍🍳" },
  { value: "otro", label: "Otro Ambiente", icon: "✨" },
];
const UNITS = ["unidades", "cajas", "paquetes", "litros", "kg", "metros", "rollos", "juegos", "docenas"];
const DAYS_ES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Prospection constants
const PROSP_TYPES = ["Colegio", "Empresa", "Institución", "Otro"];
const PROSP_SECTORS = ["Privado", "Público", "Mixto"];
const PROSP_DISTRICTS = ["Ayacucho", "Huamanga", "Huanta", "San Miguel", "Cangallo", "Otro"];
const PROSP_LEVELS = ["", "Inicial", "Primaria", "Secundaria", "Superior", "Completo"];
const PROSP_STATUSES = [
  { value: "Pendiente de contacto", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
  { value: "Contactado", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  { value: "En revisión", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  { value: "Aceptado", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  { value: "Realizado", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  { value: "No lo hará", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
];

const B = {
  dark: "#3d1a00", primary: "#b8540c", secondary: "#d4770a", accent: "#e8960f",
  gold: "#f0ad1b", light: "#fdf3e3", warm: "#fef8f0",
  gDark: "linear-gradient(135deg,#3d1a00 0%,#6b2f0a 50%,#3d1a00 100%)",
  gAcc: "linear-gradient(135deg,#d4770a,#b8540c)",
};

const SLOT_COLORS = {
  confirmado: { bg: "#2563eb", text: "#fff", tag: "#dbeafe", tagText: "#1e40af", tagBorder: "#60a5fa", slotBg: "#eff6ff" },
  cotizacion: { bg: "#ea580c", text: "#fff", tag: "#fff7ed", tagText: "#c2410c", tagBorder: "#fb923c", slotBg: "#fff7ed" },
};

function dim(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function fdow(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function fmtD(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }

// Format date from yyyy-mm-dd to dd/mm/aa
function fmtDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

// Format ISO timestamp to dd/mm/aa HH:MM
function fmtDateTime(iso: string): string {
  if (!iso) return "";
  const dt = new Date(iso);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const y = String(dt.getFullYear()).slice(2);
  const h = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}`;
}

// Get monday of the week containing a date
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Mini Calendar Picker ──
function MiniCalendar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const today = new Date();
  const initYear = value ? parseInt(value.split("-")[0]) : today.getFullYear();
  const initMonth = value ? parseInt(value.split("-")[1]) - 1 : today.getMonth();
  const [cy, setCy] = useState(initYear);
  const [cm, setCm] = useState(initMonth);

  const daysInMonth = dim(cy, cm);
  const firstDay = fdow(cy, cm);

  return (
    <div className="absolute z-[3000] bg-white rounded-xl shadow-2xl p-3 w-[260px]" style={{ border: `2px solid ${B.accent}44`, top: "100%", left: 0, marginTop: 4 }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => { if (cm === 0) { setCm(11); setCy(y => y - 1); } else setCm(m => m - 1); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-orange-50" style={{ color: B.primary }}>←</button>
        <span className="text-xs font-extrabold" style={{ color: B.dark }}>{MONTHS_ES[cm]} {cy}</span>
        <button onClick={() => { if (cm === 11) { setCm(0); setCy(y => y + 1); } else setCm(m => m + 1); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-orange-50" style={{ color: B.primary }}>→</button>
      </div>
      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => <div key={d} className="text-[9px] font-bold text-center py-0.5" style={{ color: B.secondary }}>{d[0]}</div>)}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const ds = fmtD(cy, cm, d);
          const isSelected = ds === value;
          const isToday = cy === today.getFullYear() && cm === today.getMonth() && d === today.getDate();
          return (
            <button key={d} onClick={() => { onChange(ds); onClose(); }}
              className="w-full aspect-square text-[11px] font-semibold rounded-lg flex items-center justify-center transition-all"
              style={{ background: isSelected ? B.primary : isToday ? B.light : "transparent", color: isSelected ? "#fff" : isToday ? B.primary : B.dark, fontWeight: isSelected || isToday ? 700 : 400 }}>
              {d}
            </button>
          );
        })}
      </div>
      <button onClick={onClose} className="w-full mt-2 py-1.5 text-[11px] font-bold rounded-lg" style={{ background: B.light, color: B.primary }}>Cerrar</button>
    </div>
  );
}

// ── Modal ──
function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" style={{ background: "rgba(61,26,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-[640px] max-w-[95vw] max-h-[92vh] overflow-auto" style={{ boxShadow: "0 25px 60px rgba(61,26,0,.25)" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-white z-10 rounded-t-2xl" style={{ borderBottom: `2px solid ${B.accent}33` }}>
          <h2 className="text-lg font-bold" style={{ color: B.dark }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: B.light, color: B.primary }}>✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Advance Row ──
function AdvanceRow({ advance, index, onUpdate, onLock }: { advance: Advance; index: number; onUpdate: (i: number, v: string) => void; onLock: (i: number) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const handleLock = () => { if (pw === ADMIN_PASSWORD) { onLock(index); setShowPw(false); setPw(""); setPwErr(false); } else setPwErr(true); };
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: advance.locked ? "#f0fdf4" : B.warm, border: advance.locked ? "1px solid #bbf7d0" : `1px solid ${B.accent}33` }}>
      <span className="text-xs font-bold text-gray-400 w-5">{index + 1}.</span>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">S/</span>
        <input type="number" value={advance.amount || ""} onChange={e => !advance.locked && onUpdate(index, e.target.value)} disabled={advance.locked} placeholder="0.00"
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border" style={{ borderColor: `${B.accent}33`, background: advance.locked ? "#f0fdf4" : "#fff", color: advance.locked ? "#16a34a" : B.dark, fontWeight: advance.locked ? 700 : 400 }} />
      </div>
      {advance.locked ? <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-600">🔒 Validado</span>
        : <button onClick={() => setShowPw(true)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white whitespace-nowrap" style={{ background: B.gAcc }}>Validar</button>}
      {showPw && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center" style={{ background: "rgba(61,26,0,.45)", backdropFilter: "blur(4px)" }} onClick={() => { setShowPw(false); setPw(""); setPwErr(false); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl p-6 w-[340px]" style={{ boxShadow: "0 20px 40px rgba(61,26,0,.2)" }}>
            <div className="text-center mb-4"><div className="text-3xl mb-2">🔐</div><h3 className="font-bold" style={{ color: B.dark }}>Validar Adelanto #{index + 1}</h3><p className="text-xs text-gray-400 mt-1">Monto: S/ {advance.amount || "0.00"}</p></div>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setPwErr(false); }} onKeyDown={e => e.key === "Enter" && handleLock()} placeholder="Contraseña de administrador" autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm mb-1" style={{ border: pwErr ? "2px solid #ef4444" : `1px solid ${B.accent}44` }} />
            {pwErr && <p className="text-red-500 text-xs mb-2">Contraseña incorrecta</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowPw(false); setPw(""); setPwErr(false); }} className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{ border: `1px solid ${B.accent}33` }}>Cancelar</button>
              <button onClick={handleLock} className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white" style={{ background: B.gAcc }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event Form (with date picker + registered_by) ──
function EventForm({ event, onSave, onClose, onDelete, dateStr, venue, events }: { event: EventData | null; onSave: (e: EventData) => void; onClose: () => void; onDelete: (id: string) => void; dateStr: string; venue: string; events: EventData[] }) {
  const [form, setForm] = useState<EventData>(event || {
    type: "boda", name: "", client_name: "", contact_number: "", proforma_number: "", contract_number: "",
    date: dateStr, venue, time: "18:00", guests: 50, decoration_color: "", observations: "",
    status: "cotizacion", amount: 0, advances: [], registered_by: "",
  });
  const [saveErr, setSaveErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  const up = (k: string, v: any) => { setForm(p => ({ ...p, [k]: v })); setSaveErr(""); };
  const addAdv = () => { if (form.advances.length < 10) up("advances", [...form.advances, { amount: 0, locked: false }]); };
  const upAdv = (i: number, v: string) => { const a = [...form.advances]; a[i] = { ...a[i], amount: parseFloat(v) || 0 }; up("advances", a); };
  const lockAdv = (i: number) => { const a = [...form.advances]; a[i] = { ...a[i], locked: true }; up("advances", a); };
  const rmAdv = (i: number) => { if (!form.advances[i].locked) up("advances", form.advances.filter((_: any, x: number) => x !== i)); };
  const totA = form.advances.reduce((s: number, a: Advance) => s + (a.amount || 0), 0);
  const rem = (form.amount || 0) - totA;

  // Close calendar on outside click
  useEffect(() => {
    if (!showCal) return;
    const handler = (e: MouseEvent) => { if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowCal(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCal]);

  const handleSave = async () => {
    if (!form.registered_by?.trim()) { setSaveErr("Debes indicar quién registra este evento."); return; }
    if (form.status === "confirmado") {
      const existing = events.filter(e => e.date === form.date && e.venue === form.venue && e.status === "confirmado" && e.id !== form.id);
      if (existing.length > 0) { setSaveErr(`Ya existe un evento CONFIRMADO en ${VENUES.find(v => v.id === form.venue)?.label} para esta fecha.`); return; }
    }
    setSaving(true);
    try { await onSave(form); } catch (e: any) { setSaveErr(e.message || "Error al guardar"); }
    setSaving(false);
  };

  const inp = "w-full px-3.5 py-2.5 rounded-lg text-sm border";
  const lbl = "text-[11px] font-bold uppercase tracking-wide mb-1.5 block";

  return (
    <div>
      {/* Registration info banner */}
      {event?.registered_at && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-3" style={{ background: B.warm, border: `1px solid ${B.accent}33` }}>
          <span className="text-lg">📋</span>
          <div className="text-xs" style={{ color: B.dark }}>
            <span className="font-bold">Registrado:</span> {fmtDateTime(event.registered_at)}
            {event.registered_by && <> &nbsp;·&nbsp; <span className="font-bold">Por:</span> {event.registered_by}</>}
          </div>
        </div>
      )}

      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Tipo de Evento</label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map(t => <button key={t.value} onClick={() => up("type", t.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ border: `2px solid ${form.type === t.value ? B.primary : B.accent + "33"}`, background: form.type === t.value ? B.light : "#fff", color: form.type === t.value ? B.primary : "#64748b" }}>{t.emoji} {t.label}</button>)}
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Nombre del Evento</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.name} onChange={e => up("name", e.target.value)} placeholder="Ej: Boda de María y Juan" /></div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Nombre del Cliente</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.client_name} onChange={e => up("client_name", e.target.value)} placeholder="Nombre completo del cliente" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Número de Contacto</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.contact_number} onChange={e => up("contact_number", e.target.value)} placeholder="Ej: 987 654 321" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>N° de Proforma</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.proforma_number} onChange={e => up("proforma_number", e.target.value)} placeholder="Ej: PRF-2026-001" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>N° de Contrato</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.contract_number} onChange={e => up("contract_number", e.target.value)} placeholder="Ej: CTR-2026-001" /></div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* DATE with mini calendar */}
        <div ref={dateRef} className="relative">
          <label className={lbl} style={{ color: B.primary }}>Fecha del Evento</label>
          <div className="relative cursor-pointer" onClick={() => setShowCal(s => !s)}>
            <input readOnly value={fmtDisplay(form.date)} placeholder="dd/mm/aa"
              className={`${inp} cursor-pointer pr-9`} style={{ borderColor: showCal ? B.primary : `${B.accent}33`, background: B.warm }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">📅</span>
          </div>
          {showCal && <MiniCalendar value={form.date} onChange={v => up("date", v)} onClose={() => setShowCal(false)} />}
        </div>
        <div><label className={lbl} style={{ color: B.primary }}>Hora Inicio</label><input className={inp} style={{ borderColor: `${B.accent}33` }} type="time" value={form.time} onChange={e => up("time", e.target.value)} /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Personas</label><input className={inp} style={{ borderColor: `${B.accent}33` }} type="number" min="1" value={form.guests} onChange={e => up("guests", parseInt(e.target.value) || 0)} /></div>
      </div>

      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Color de Decoración</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.decoration_color} onChange={e => up("decoration_color", e.target.value)} placeholder="Ej: Rojo con dorado, Blanco y rosa pastel" /></div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Estado</label>
        <div className="flex gap-2">{STATUS_OPTIONS.map(s => <button key={s.value} onClick={() => up("status", s.value)} className="flex-1 py-2.5 rounded-lg font-bold text-sm" style={{ border: `2px solid ${form.status === s.value ? s.color : "#e2e8f0"}`, background: form.status === s.value ? s.bg : "#fff", color: form.status === s.value ? s.color : "#94a3b8" }}>{s.value === "confirmado" ? "✓ " : "◷ "}{s.label}</button>)}</div>
        {form.status === "confirmado" && <p className="text-xs text-blue-700 mt-1.5 italic">⚠ Solo 1 evento confirmado por espacio por día.</p>}
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Monto Total (S/)</label>
        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">S/</span>
          <input className={`${inp} pl-10 text-base font-semibold`} style={{ borderColor: `${B.accent}33` }} type="number" value={form.amount || ""} onChange={e => up("amount", parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className={`${lbl} !mb-0`} style={{ color: B.primary }}>Adelantos ({form.advances.length}/10)</label>
          {form.advances.length < 10 && <button onClick={addAdv} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: B.gAcc }}>+ Agregar</button>}
        </div>
        <div className="flex flex-col gap-1.5">
          {form.advances.map((adv: Advance, i: number) => <div key={i} className="flex items-center gap-1"><div className="flex-1"><AdvanceRow advance={adv} index={i} onUpdate={upAdv} onLock={lockAdv} /></div>{!adv.locked && <button onClick={() => rmAdv(i)} className="text-red-500 text-base p-1">✕</button>}</div>)}
        </div>
        {form.advances.length > 0 && <div className="mt-2 p-3 rounded-lg flex justify-between text-sm" style={{ background: B.warm }}>
          <div><span className="text-gray-500">Total adelantos: </span><span className="font-bold text-green-600">S/ {totA.toFixed(2)}</span></div>
          <div><span className="text-gray-500">Saldo: </span><span className="font-bold" style={{ color: rem < 0 ? "#ef4444" : B.dark }}>S/ {rem.toFixed(2)}</span></div>
        </div>}
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Observaciones</label><textarea className={`${inp} min-h-[60px] resize-y`} style={{ borderColor: `${B.accent}33` }} value={form.observations} onChange={e => up("observations", e.target.value)} placeholder="Notas adicionales..." /></div>

      {/* Registered by */}
      <div className="mb-5">
        <label className={lbl} style={{ color: B.primary }}>Registrado por <span className="text-red-500">*</span></label>
        <input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.registered_by || ""} onChange={e => up("registered_by", e.target.value)} placeholder="Tu nombre (obligatorio)" />
      </div>

      {saveErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold mb-3">{saveErr}</div>}
      <div className="flex gap-2">
        {event?.id && <button onClick={() => onDelete(event.id!)} className="px-5 py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-sm">🗑 Eliminar</button>}
        <div className="flex-1" />
        <button onClick={onClose} className="px-5 py-3 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{ border: `1px solid ${B.accent}33` }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-lg font-bold text-sm text-white" style={{ background: B.gDark, boxShadow: "0 4px 12px rgba(61,26,0,.3)", opacity: saving ? .6 : 1 }}>{saving ? "Guardando..." : "Guardar Evento"}</button>
      </div>
    </div>
  );
}

// ── Event Detail ──
function EventDetail({ event, onEdit, onDelete }: { event: EventData; onEdit: (e: EventData) => void; onDelete: (id: string) => void }) {
  const ti = EVENT_TYPES.find(t => t.value === event.type) || EVENT_TYPES[0];
  const si = STATUS_OPTIONS.find(s => s.value === event.status) || STATUS_OPTIONS[0];
  const ta = event.advances?.reduce((s: number, a: Advance) => s + (a.amount || 0), 0) || 0;
  return (
    <div className="min-w-[310px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: si.color }}>{ti.emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: B.dark }}>{event.name || ti.label}</div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: si.bg, color: si.color, border: `1px solid ${si.border}` }}>{si.label}</span>
        </div>
      </div>
      {event.client_name && <div className="text-xs mb-1.5" style={{ color: B.dark }}><strong style={{ color: B.primary }}>Cliente:</strong> {event.client_name}</div>}
      {event.contact_number && <div className="text-xs mb-1.5" style={{ color: B.dark }}><strong style={{ color: B.primary }}>Contacto:</strong> {event.contact_number}</div>}
      <div className="flex gap-2 mb-1.5 flex-wrap">
        {event.proforma_number && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Proforma: {event.proforma_number}</span>}
        {event.contract_number && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700">Contrato: {event.contract_number}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {[{ l: "Fecha", v: fmtDisplay(event.date) }, { l: "Hora", v: event.time }, { l: "Personas", v: String(event.guests) }, { l: "Monto", v: `S/ ${event.amount || "0.00"}` }].map(i => (
          <div key={i.l} className="p-2 rounded-lg" style={{ background: B.warm }}><div className="text-[10px] font-bold uppercase" style={{ color: B.primary }}>{i.l}</div><div className="font-semibold" style={{ color: B.dark }}>{i.v}</div></div>
        ))}
      </div>
      {event.decoration_color && <div className="text-xs mb-2" style={{ color: B.dark }}><strong style={{ color: B.primary }}>Decoración:</strong> {event.decoration_color}</div>}
      {ta > 0 && <div className="bg-green-50 p-2.5 rounded-lg mb-2 text-sm"><div className="font-bold text-green-600">Adelantos: S/ {ta.toFixed(2)}</div><div className="text-gray-500">Saldo: S/ {((event.amount || 0) - ta).toFixed(2)}</div></div>}
      {event.observations && <div className="text-xs text-gray-500 mb-2 italic">&ldquo;{event.observations}&rdquo;</div>}
      {/* Registration info */}
      {(event.registered_at || event.registered_by) && (
        <div className="text-[10px] text-gray-400 mb-2 p-2 rounded-lg" style={{ background: B.warm }}>
          {event.registered_at && <span>📅 Registrado: {fmtDateTime(event.registered_at)}</span>}
          {event.registered_by && <span> · Por: <strong>{event.registered_by}</strong></span>}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onDelete(event.id!)} className="flex-1 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-sm">🗑 Eliminar</button>
        <button onClick={() => onEdit(event)} className="flex-1 py-2.5 rounded-lg text-white font-bold text-sm" style={{ background: B.gDark }}>✏ Editar</button>
      </div>
    </div>
  );
}

// ── Inventory Form ──
function InventoryForm({ item, onSave, onClose }: { item: InventoryItem | null; onSave: (i: InventoryItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<InventoryItem>(item || { name: "", category: "otros", quantity: 0, unit: "unidades", location: "salon", registered_by: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const up = (k: string, v: any) => { setForm(p => ({ ...p, [k]: v })); setErr(""); };

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("El nombre es obligatorio"); return; }
    if (!form.registered_by.trim()) { setErr("Debe indicar quién registra el producto"); return; }
    setSaving(true);
    try { await onSave(form); } catch (e: any) { setErr(e.message || "Error al guardar"); }
    setSaving(false);
  };

  const inp = "w-full px-3.5 py-2.5 rounded-lg text-sm border";
  const lbl = "text-[11px] font-bold uppercase tracking-wide mb-1.5 block";

  return (
    <div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Categoría</label>
        <div className="flex flex-wrap gap-1.5">
          {INVENTORY_CATEGORIES.map(c => <button key={c.value} onClick={() => up("category", c.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ border: `2px solid ${form.category === c.value ? B.primary : B.accent + "33"}`, background: form.category === c.value ? B.light : "#fff", color: form.category === c.value ? B.primary : "#64748b" }}>{c.icon} {c.label}</button>)}
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Nombre del Producto</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.name} onChange={e => up("name", e.target.value)} placeholder="Ej: Sillas plegables blancas" /></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Cantidad Actual</label><input className={inp} style={{ borderColor: `${B.accent}33` }} type="number" min="0" value={form.quantity || ""} onChange={e => up("quantity", parseInt(e.target.value) || 0)} placeholder="0" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Unidad de Medida</label>
          <select className={inp} style={{ borderColor: `${B.accent}33` }} value={form.unit} onChange={e => up("unit", e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Ubicación del Producto</label>
        <div className="flex flex-wrap gap-1.5">
          {INVENTORY_LOCATIONS.map(loc => <button key={loc.value} onClick={() => up("location", loc.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ border: `2px solid ${form.location === loc.value ? B.primary : B.accent + "33"}`, background: form.location === loc.value ? B.light : "#fff", color: form.location === loc.value ? B.primary : "#64748b" }}>{loc.icon} {loc.label}</button>)}
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Registrado por</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.registered_by} onChange={e => up("registered_by", e.target.value)} placeholder="Nombre de quien registra el producto" /></div>
      <div className="mb-5"><label className={lbl} style={{ color: B.primary }}>Notas</label><textarea className={`${inp} min-h-[60px] resize-y`} style={{ borderColor: `${B.accent}33` }} value={form.notes} onChange={e => up("notes", e.target.value)} placeholder="Notas adicionales del producto..." /></div>
      {err && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold mb-3">{err}</div>}
      <div className="flex gap-2">
        <div className="flex-1" />
        <button onClick={onClose} className="px-5 py-3 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{ border: `1px solid ${B.accent}33` }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-lg font-bold text-sm text-white" style={{ background: B.gDark, opacity: saving ? .6 : 1 }}>{saving ? "Guardando..." : "Guardar Producto"}</button>
      </div>
    </div>
  );
}

// ── Prospection Form ──
function ProspectionForm({ record, onSave, onClose }: { record: ProspectionRecord | null; onSave: (r: ProspectionRecord) => void; onClose: () => void }) {
  const [form, setForm] = useState<ProspectionRecord>(record || {
    name: "", type: "Colegio", sector: "Privado", district: "Ayacucho", address: "", level: "",
    contact1: "", phone1: "", contact2: "", phone2: "",
    status: "Pendiente de contacto", last_contact: "", next_contact: "", next_step: "", comments: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const up = (k: string, v: any) => { setForm(p => ({ ...p, [k]: v })); setErr(""); };

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("El nombre es obligatorio"); return; }
    setSaving(true);
    try { await onSave(form); } catch (e: any) { setErr(e.message || "Error al guardar"); }
    setSaving(false);
  };

  const inp = "w-full px-3.5 py-2.5 rounded-lg text-sm border";
  const lbl = "text-[11px] font-bold uppercase tracking-wide mb-1.5 block";

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Tipo</label>
          <select className={inp} style={{ borderColor: `${B.accent}33` }} value={form.type} onChange={e => up("type", e.target.value)}>
            {PROSP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={lbl} style={{ color: B.primary }}>Sector</label>
          <select className={inp} style={{ borderColor: `${B.accent}33` }} value={form.sector} onChange={e => up("sector", e.target.value)}>
            {PROSP_SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className={lbl} style={{ color: B.primary }}>Distrito</label>
          <select className={inp} style={{ borderColor: `${B.accent}33` }} value={form.district} onChange={e => up("district", e.target.value)}>
            {PROSP_DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Nombre <span className="text-red-500">*</span></label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.name} onChange={e => up("name", e.target.value)} placeholder="Ej: Colegio César Vallejo" /></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Dirección</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.address} onChange={e => up("address", e.target.value)} placeholder="Dirección" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Nivel</label>
          <select className={inp} style={{ borderColor: `${B.accent}33` }} value={form.level} onChange={e => up("level", e.target.value)}>
            {PROSP_LEVELS.map(l => <option key={l} value={l}>{l || "— Sin especificar —"}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Contacto 1</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.contact1} onChange={e => up("contact1", e.target.value)} placeholder="Nombre del contacto" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Teléfono 1</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.phone1} onChange={e => up("phone1", e.target.value)} placeholder="Ej: 987 654 321" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Contacto 2</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.contact2} onChange={e => up("contact2", e.target.value)} placeholder="Nombre del contacto" /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Teléfono 2</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.phone2} onChange={e => up("phone2", e.target.value)} placeholder="Ej: 987 654 321" /></div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Estado</label>
        <div className="flex flex-wrap gap-1.5">
          {PROSP_STATUSES.map(s => <button key={s.value} onClick={() => up("status", s.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ border: `2px solid ${form.status === s.value ? s.color : "#e2e8f0"}`, background: form.status === s.value ? s.bg : "#fff", color: form.status === s.value ? s.color : "#94a3b8" }}>{s.value}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className={lbl} style={{ color: B.primary }}>Último Contacto</label><input className={inp} style={{ borderColor: `${B.accent}33` }} type="date" value={form.last_contact} onChange={e => up("last_contact", e.target.value)} /></div>
        <div><label className={lbl} style={{ color: B.primary }}>Próximo Contacto</label><input className={inp} style={{ borderColor: `${B.accent}33` }} type="date" value={form.next_contact} onChange={e => up("next_contact", e.target.value)} /></div>
      </div>
      <div className="mb-4"><label className={lbl} style={{ color: B.primary }}>Próximo Paso</label><input className={inp} style={{ borderColor: `${B.accent}33` }} value={form.next_step} onChange={e => up("next_step", e.target.value)} placeholder="Ej: Enviar propuesta, Llamar director" /></div>
      <div className="mb-5"><label className={lbl} style={{ color: B.primary }}>Comentarios</label><textarea className={`${inp} min-h-[60px] resize-y`} style={{ borderColor: `${B.accent}33` }} value={form.comments} onChange={e => up("comments", e.target.value)} placeholder="Observaciones del seguimiento..." /></div>
      {err && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold mb-3">{err}</div>}
      <div className="flex gap-2">
        <div className="flex-1" />
        <button onClick={onClose} className="px-5 py-3 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{ border: `1px solid ${B.accent}33` }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-lg font-bold text-sm text-white" style={{ background: B.gDark, opacity: saving ? .6 : 1 }}>{saving ? "Guardando..." : "Guardar Registro"}</button>
      </div>
    </div>
  );
}

// ════════════ MAIN APP ════════════
export default function Home() {
  const today = new Date();
  const [month, setMonth] = useState(today.getFullYear() === 2026 ? today.getMonth() : 0);
  const year = 2026;

  // ── Events State ──
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvt, setEditEvt] = useState<EventData | null>(null);
  const [selSlot, setSelSlot] = useState({ date: "", venue: "" });
  const [detEvt, setDetEvt] = useState<EventData | null>(null);
  const [detPos, setDetPos] = useState({ x: 0, y: 0 });
  const [fType, setFType] = useState("all");
  const [fVenue, setFVenue] = useState("all");
  const [viewMode, setViewMode] = useState("month");
  const [yearView, setYearView] = useState(false);

  // ── Week view state ──
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(today));
  const [weekEvents, setWeekEvents] = useState<EventData[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);

  const eventsCache = useRef<Record<string, EventData[]>>({});
  const [yearCounts, setYearCounts] = useState<Record<number, number>>({});

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<"calendar" | "inventory" | "prospection">("calendar");

  // ── Inventory State ──
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invLoaded, setInvLoaded] = useState(false);
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [editInvItem, setEditInvItem] = useState<InventoryItem | null>(null);
  const [invSearch, setInvSearch] = useState("");
  const [invCatFilter, setInvCatFilter] = useState("all");
  const [invLocFilter, setInvLocFilter] = useState("all");

  // ── Prospection State ──
  const [prospection, setProspection] = useState<ProspectionRecord[]>([]);
  const [prospLoading, setProspLoading] = useState(false);
  const [prospLoaded, setProspLoaded] = useState(false);
  const [prospModalOpen, setProspModalOpen] = useState(false);
  const [editProspRecord, setEditProspRecord] = useState<ProspectionRecord | null>(null);
  const [prospSearch, setProspSearch] = useState("");
  const [prospStatusFilter, setProspStatusFilter] = useState("all");
  const [prospTypeFilter, setProspTypeFilter] = useState("all");

  // ── Load events ──
  const loadMonthEvents = useCallback(async (m: number, force = false) => {
    const cacheKey = `${year}-${m}`;
    if (!force && eventsCache.current[cacheKey]) { setEvents(eventsCache.current[cacheKey]); setLoading(false); return; }
    setLoading(true);
    try { const data = await fetchEventsByMonth(year, m); eventsCache.current[cacheKey] = data; setEvents(data); } catch (err) { console.error(err); }
    setLoading(false);
  }, [year]);

  const loadYearCounts = useCallback(async () => {
    try { const counts = await fetchEventCountsByYear(year); setYearCounts(counts); } catch (err) { console.error(err); }
  }, [year]);

  // ── Load week events ──
  const loadWeekEvents = useCallback(async (monday: Date) => {
    setWeekLoading(true);
    try {
      const end = new Date(monday);
      end.setDate(end.getDate() + 6);
      const startStr = fmtD(monday.getFullYear(), monday.getMonth(), monday.getDate());
      const endStr = fmtD(end.getFullYear(), end.getMonth(), end.getDate());
      const data = await fetchEventsByRange(startStr, endStr);
      setWeekEvents(data);
    } catch (err) { console.error(err); }
    setWeekLoading(false);
  }, []);

  useEffect(() => { loadMonthEvents(month); }, [month, loadMonthEvents]);
  useEffect(() => { loadYearCounts(); }, [loadYearCounts]);
  useEffect(() => { if (viewMode === "week") loadWeekEvents(weekStart); }, [viewMode, weekStart, loadWeekEvents]);

  // ── Load inventory ──
  const loadInventory = useCallback(async (force = false) => {
    if (invLoaded && !force) return;
    setInvLoading(true);
    try { const data = await fetchInventoryItems(); setInventory(data); setInvLoaded(true); } catch (err) { console.error(err); }
    setInvLoading(false);
  }, [invLoaded]);

  useEffect(() => { if (activeTab === "inventory") loadInventory(); }, [activeTab, loadInventory]);

  // ── Load prospection ──
  const loadProspection = useCallback(async (force = false) => {
    if (prospLoaded && !force) return;
    setProspLoading(true);
    try { const data = await fetchProspectionRecords(); setProspection(data); setProspLoaded(true); } catch (err) { console.error(err); }
    setProspLoading(false);
  }, [prospLoaded]);

  useEffect(() => { if (activeTab === "prospection") loadProspection(); }, [activeTab, loadProspection]);

  const dIM = dim(year, month), fD = fdow(year, month);
  const prev = () => setMonth(m => m === 0 ? 11 : m - 1);
  const next = () => setMonth(m => m === 11 ? 0 : m + 1);

  const openSlot = (d: string, v: string) => { setSelSlot({ date: d, venue: v }); setEditEvt(null); setModalOpen(true); setDetEvt(null); };

  const handleSave = async (data: EventData) => {
    const saved = await saveEvent(data);
    const cacheKey = `${year}-${month}`;
    setEvents(prev => {
      const updated = saved.id && prev.some(e => e.id === saved.id) ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved];
      eventsCache.current[cacheKey] = updated;
      return updated;
    });
    setWeekEvents(prev => saved.id && prev.some(e => e.id === saved.id) ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved]);
    setYearCounts(prev => { const m = parseInt(saved.date.split("-")[1], 10) - 1; if (!data.id) return { ...prev, [m]: (prev[m] || 0) + 1 }; return prev; });
    setModalOpen(false); setEditEvt(null);
  };

  const handleDel = async (id: string) => {
    const evtToDelete = events.find(e => e.id === id) || weekEvents.find(e => e.id === id);
    await deleteEvent(id);
    const cacheKey = `${year}-${month}`;
    setEvents(prev => { const updated = prev.filter(e => e.id !== id); eventsCache.current[cacheKey] = updated; return updated; });
    setWeekEvents(prev => prev.filter(e => e.id !== id));
    if (evtToDelete) { const m = parseInt(evtToDelete.date.split("-")[1], 10) - 1; setYearCounts(prev => ({ ...prev, [m]: Math.max((prev[m] || 1) - 1, 0) })); }
    setModalOpen(false); setEditEvt(null); setDetEvt(null);
  };

  const evtClick = (e: React.MouseEvent, evt: EventData) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setDetPos({ x: r.left, y: r.bottom + 4 }); setDetEvt(evt); };
  const editFrom = (evt: EventData) => { setEditEvt(evt); setSelSlot({ date: evt.date, venue: evt.venue }); setModalOpen(true); setDetEvt(null); };

  const filtered = events.filter(e => { if (fType !== "all" && e.type !== fType) return false; if (fVenue !== "all" && e.venue !== fVenue) return false; return true; });
  const slotEvts = (d: string, v: string) => filtered.filter(e => e.date === d && e.venue === v);
  const weekSlotEvts = (d: string, v: string) => weekEvents.filter(e => e.date === d && e.venue === v);

  // ── Inventory handlers ──
  const handleInvSave = async (item: InventoryItem) => {
    const saved = await saveInventoryItem(item);
    setInventory(prev => saved.id && prev.some(i => i.id === saved.id) ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved]);
    setInvModalOpen(false); setEditInvItem(null);
  };
  const handleInvDel = async (id: string) => { await deleteInventoryItem(id); setInventory(prev => prev.filter(i => i.id !== id)); };

  const filteredInv = inventory.filter(item => {
    if (invCatFilter !== "all" && item.category !== invCatFilter) return false;
    if (invLocFilter !== "all" && item.location !== invLocFilter) return false;
    if (invSearch && !item.name.toLowerCase().includes(invSearch.toLowerCase())) return false;
    return true;
  });

  // ── Prospection handlers ──
  const handleProspSave = async (record: ProspectionRecord) => {
    const saved = await saveProspectionRecord(record);
    setProspection(prev => saved.id && prev.some(r => r.id === saved.id) ? prev.map(r => r.id === saved.id ? saved : r) : [...prev, saved]);
    setProspModalOpen(false); setEditProspRecord(null);
  };
  const handleProspDel = async (id: string) => { await deleteProspectionRecord(id); setProspection(prev => prev.filter(r => r.id !== id)); };

  const filteredProsp = prospection.filter(r => {
    if (prospStatusFilter !== "all" && r.status !== prospStatusFilter) return false;
    if (prospTypeFilter !== "all" && r.type !== prospTypeFilter) return false;
    if (prospSearch && !r.name.toLowerCase().includes(prospSearch.toLowerCase()) && !r.district.toLowerCase().includes(prospSearch.toLowerCase())) return false;
    return true;
  });

  const invStats = {
    total: inventory.length,
    byLocation: INVENTORY_LOCATIONS.reduce((acc, loc) => { acc[loc.value] = inventory.filter(i => i.location === loc.value).length; return acc; }, {} as Record<string, number>),
  };

  // ── Year overview ──
  const renderYear = () => (
    <div className="grid grid-cols-4 gap-4 p-2">
      {MONTHS_ES.map((mn, mi) => {
        const d2 = dim(year, mi), fd2 = fdow(year, mi), me = yearCounts[mi] || 0;
        return (
          <div key={mi} onClick={() => { setMonth(mi); setYearView(false); }} className="bg-white rounded-xl p-3 cursor-pointer transition-all" style={{ border: month === mi ? `2px solid ${B.primary}` : `1px solid ${B.accent}22`, boxShadow: month === mi ? `0 4px 12px ${B.primary}22` : "none" }}>
            <div className="flex justify-between items-center mb-2 text-sm font-extrabold" style={{ color: B.dark }}><span>{mn}</span>{me > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: B.gAcc }}>{me}</span>}</div>
            <div className="grid grid-cols-7 gap-px text-[8px] text-center">
              {DAYS_ES.map(d3 => <div key={d3} className="text-gray-400 font-bold py-0.5">{d3[0]}</div>)}
              {Array.from({ length: fd2 }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: d2 }, (_, i) => {
                const day = i + 1, isTd = today.getFullYear() === year && today.getMonth() === mi && today.getDate() === day;
                return <div key={day} className="py-0.5 rounded" style={{ background: isTd ? B.light : "transparent", color: isTd ? B.primary : B.dark, fontWeight: isTd ? 700 : 400 }}>{day}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Month grid ──
  const renderMonth = () => {
    const cells = [];
    for (let i = 0; i < fD; i++) cells.push(<div key={`e${i}`} className="rounded-lg opacity-30" style={{ background: "#f8f6f3" }} />);
    for (let d = 1; d <= dIM; d++) {
      const ds = fmtD(year, month, d), isTd = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const dow = new Date(year, month, d).getDay(), dowIdx = dow === 0 ? 6 : dow - 1;
      const dayHasConfirmado = VENUES.some(v => slotEvts(ds, v.id).some(e => e.status === "confirmado"));
      const dayHasCotizacion = VENUES.some(v => slotEvts(ds, v.id).some(e => e.status === "cotizacion"));
      cells.push(
        <div key={d} className="bg-white rounded-lg overflow-hidden flex flex-col" style={{ border: isTd ? `2.5px solid ${B.primary}` : dayHasConfirmado ? "2px solid #3b82f6" : dayHasCotizacion ? "2px solid #f97316" : `1px solid ${B.accent}22`, boxShadow: isTd ? `0 3px 14px ${B.primary}22` : "0 1px 3px rgba(0,0,0,.04)" }}>
          <div className="px-2 py-1 flex justify-between items-center shrink-0" style={{ background: isTd ? B.gDark : dayHasConfirmado ? "#eff6ff" : dayHasCotizacion ? "#fff7ed" : B.warm, borderBottom: isTd ? `2px solid ${B.gold}` : dayHasConfirmado ? "2px solid #93c5fd" : dayHasCotizacion ? "2px solid #fdba74" : `2px solid ${B.accent}33` }}>
            <span className="text-sm font-extrabold" style={{ color: isTd ? "#fff" : B.dark }}>{d}</span>
            <span className="text-[9px] font-semibold" style={{ color: isTd ? B.gold : B.secondary }}>{DAYS_ES[dowIdx]}</span>
          </div>
          {VENUES.map((v, vi) => {
            const se = slotEvts(ds, v.id);
            const hasConf = se.some(e => e.status === "confirmado"), hasCot = se.some(e => e.status === "cotizacion");
            return (
              <div key={v.id} onClick={() => openSlot(ds, v.id)} className="px-1.5 py-1 cursor-pointer transition-colors" style={{ borderBottom: vi < VENUES.length - 1 ? `2.5px solid ${B.accent}30` : "none", background: hasConf ? "#eff6ff" : hasCot ? "#fff7ed" : vi % 2 === 0 ? "transparent" : B.warm }}
                onMouseEnter={e => (e.currentTarget.style.background = hasConf ? "#dbeafe" : hasCot ? "#ffedd5" : B.light)} onMouseLeave={e => (e.currentTarget.style.background = hasConf ? "#eff6ff" : hasCot ? "#fff7ed" : vi % 2 === 0 ? "transparent" : B.warm)}>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[8px] font-bold uppercase tracking-wide shrink-0" style={{ color: `${B.secondary}aa` }}>{v.icon} {v.label}</span>
                  {se.map(evt => { const sc = SLOT_COLORS[evt.status as keyof typeof SLOT_COLORS] || SLOT_COLORS.cotizacion; return <span key={evt.id + "tag"} className="text-[7px] font-extrabold px-1.5 py-px rounded uppercase" style={{ background: sc.tag, color: sc.tagText, border: `1px solid ${sc.tagBorder}` }}>{evt.status === "confirmado" ? "CONF." : "COT."}</span>; })}
                </div>
                {se.map(evt => { const sc = SLOT_COLORS[evt.status as keyof typeof SLOT_COLORS] || SLOT_COLORS.cotizacion; return <div key={evt.id} onClick={e => evtClick(e, evt)} className="rounded px-1.5 py-0.5 text-[8.5px] font-bold text-white mt-0.5 flex items-center gap-1 cursor-pointer" style={{ background: sc.bg }}><span>{EVENT_TYPES.find(t => t.value === evt.type)?.emoji}</span><span className="overflow-hidden text-ellipsis whitespace-nowrap">{evt.name || EVENT_TYPES.find(t => t.value === evt.type)?.label}</span><span className="ml-auto text-[7px] opacity-80">{evt.time}</span></div>; })}
              </div>
            );
          })}
        </div>
      );
    }
    return cells;
  };

  // ── Week view (FIXED) ──
  const renderWeek = () => {
    const days: { date: Date; ds: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d, ds: fmtD(d.getFullYear(), d.getMonth(), d.getDate()) });
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return (
      <div>
        {/* Week selector */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,.9)", border: `1px solid ${B.accent}22` }}>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: B.light, color: B.primary }}>← Semana anterior</button>
          <div className="text-center">
            <div className="text-sm font-extrabold" style={{ color: B.dark }}>
              {weekStart.getDate()} {MONTHS_ES[weekStart.getMonth()]} — {weekEnd.getDate()} {MONTHS_ES[weekEnd.getMonth()]} {year}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: B.secondary }}>
              Semana {Math.ceil((weekStart.getDate() + fdow(weekStart.getFullYear(), weekStart.getMonth())) / 7)} · {weekLoading ? "Cargando..." : `${weekEvents.length} evento(s)`}
            </div>
          </div>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: B.light, color: B.primary }}>Semana siguiente →</button>
        </div>

        {weekLoading ? (
          <div className="text-center py-16 text-base font-bold" style={{ color: B.secondary }}>Cargando semana...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map(({ date, ds }) => {
              const isTd = ds === fmtD(today.getFullYear(), today.getMonth(), today.getDate());
              const dowIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
              return (
                <div key={ds} className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ border: isTd ? `2.5px solid ${B.primary}` : `1px solid ${B.accent}22`, boxShadow: isTd ? `0 3px 14px ${B.primary}22` : "0 1px 3px rgba(0,0,0,.04)" }}>
                  <div className="px-2 py-2 text-center" style={{ background: isTd ? B.gDark : B.warm, borderBottom: `2px solid ${B.accent}33` }}>
                    <div className="text-[10px] font-bold uppercase" style={{ color: isTd ? B.gold : B.secondary }}>{DAYS_ES[dowIdx]}</div>
                    <div className="text-lg font-extrabold" style={{ color: isTd ? "#fff" : B.dark }}>{date.getDate()}</div>
                    <div className="text-[9px]" style={{ color: isTd ? `${B.gold}cc` : `${B.secondary}88` }}>{MONTHS_ES[date.getMonth()]}</div>
                  </div>
                  <div className="flex flex-col gap-0.5 p-1.5 flex-1">
                    {VENUES.map(v => {
                      const se = weekSlotEvts(ds, v.id);
                      return (
                        <div key={v.id}>
                          <div onClick={() => openSlot(ds, v.id)} className="text-[8px] font-bold px-1 py-0.5 rounded cursor-pointer mb-0.5 flex items-center gap-0.5" style={{ color: `${B.secondary}99`, background: `${B.accent}0a` }}
                            onMouseEnter={e => (e.currentTarget.style.background = B.light)} onMouseLeave={e => (e.currentTarget.style.background = `${B.accent}0a`)}>
                            {v.icon} <span className="truncate">{v.label}</span>
                          </div>
                          {se.map(evt => { const sc = SLOT_COLORS[evt.status as keyof typeof SLOT_COLORS] || SLOT_COLORS.cotizacion; const ti = EVENT_TYPES.find(t => t.value === evt.type); return (
                            <div key={evt.id} onClick={e => evtClick(e, evt)} className="rounded px-1.5 py-1 text-[8px] font-bold text-white mb-0.5 cursor-pointer" style={{ background: sc.bg }}>
                              <div className="flex items-center gap-0.5">{ti?.emoji} <span className="truncate">{evt.name || ti?.label}</span></div>
                              <div className="opacity-80 text-[7px] mt-0.5">{evt.time} · {evt.guests}p</div>
                            </div>
                          ); })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Day view ──
  const renderDay = () => {
    const d = new Date(year, month, today.getMonth() === month && today.getFullYear() === year ? today.getDate() : 1);
    const ds = fmtD(d.getFullYear(), d.getMonth(), d.getDate()), dowIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return (
      <div className="max-w-[850px] mx-auto">
        <div className="text-center mb-5 text-xl font-extrabold" style={{ color: B.dark, fontFamily: "'Playfair Display',serif" }}>{DAYS_ES[dowIdx]} {fmtDisplay(ds)}</div>
        {VENUES.map(v => { const se = slotEvts(ds, v.id); return (
          <div key={v.id} className="bg-white rounded-xl mb-3 overflow-hidden" style={{ border: `1px solid ${B.accent}22` }}>
            <div className="px-5 py-3 flex justify-between items-center" style={{ background: B.warm, borderBottom: `2.5px solid ${B.accent}33` }}>
              <span className="text-base font-bold" style={{ color: B.dark }}>{v.icon} {v.label}</span>
              <button onClick={() => openSlot(ds, v.id)} className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ background: B.gDark }}>+ Evento</button>
            </div>
            <div className="px-5 py-3">
              {se.length === 0 ? <div className="text-gray-400 text-sm italic py-3">Sin eventos programados</div>
                : se.map(evt => { const ti = EVENT_TYPES.find(t => t.value === evt.type)!; const si = STATUS_OPTIONS.find(s => s.value === evt.status)!; const ta = evt.advances?.reduce((s: number, a: Advance) => s + (a.amount || 0), 0) || 0;
                  return <div key={evt.id} className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer" style={{ border: `2px solid ${si.border}`, background: si.bg }} onClick={() => editFrom(evt)}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 text-white" style={{ background: si.color }}>{ti.emoji}</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: B.dark }}>{evt.name || ti.label}</div>
                      {evt.client_name && <div className="text-[11px] text-gray-500">👤 {evt.client_name}{evt.contact_number ? ` · 📞 ${evt.contact_number}` : ""}</div>}
                      <div className="text-xs text-gray-500 mt-0.5">{evt.time} · {evt.guests} pers. · S/ {evt.amount || "0"}{ta > 0 && ` · Adel: S/ ${ta.toFixed(2)}`}</div>
                      {evt.registered_by && <div className="text-[10px] text-gray-400 mt-0.5">Registrado por {evt.registered_by} {evt.registered_at ? `· ${fmtDateTime(evt.registered_at)}` : ""}</div>}
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase shrink-0" style={{ background: si.bg, color: si.color, border: `1.5px solid ${si.border}` }}>{si.label}</span>
                    <button onClick={e => { e.stopPropagation(); handleDel(evt.id!); }} className="text-red-500 text-lg p-1 shrink-0">🗑</button>
                  </div>;
                })}
            </div>
          </div>
        ); })}
      </div>
    );
  };

  // ── Inventory Tab ──
  const renderInventory = () => (
    <div className="px-6 py-4 pb-16">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { l: "Total Productos", v: invStats.total, icon: "📦", c: B.gold, bg: `${B.gold}15` },
          { l: "En Restaurant", v: invStats.byLocation["restaurant"] || 0, icon: "🍽️", c: "#2563eb", bg: "#eff6ff" },
          { l: "En Salón", v: invStats.byLocation["salon"] || 0, icon: "🎪", c: "#7c3aed", bg: "#f5f3ff" },
          { l: "Otros", v: invStats.total - (invStats.byLocation["restaurant"] || 0) - (invStats.byLocation["salon"] || 0), icon: "🏢", c: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: `${s.c}bb` }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm border" style={{ borderColor: `${B.accent}33` }} />
        </div>
        <select value={invCatFilter} onChange={e => setInvCatFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
          <option value="all">Todas las categorías</option>
          {INVENTORY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select value={invLocFilter} onChange={e => setInvLocFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
          <option value="all">Todas las ubicaciones</option>
          {INVENTORY_LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
        </select>
        <button onClick={() => { setEditInvItem(null); setInvModalOpen(true); }} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: B.gDark }}>+ Nuevo Producto</button>
      </div>
      {invLoading ? <div className="text-center py-20 text-lg font-bold" style={{ color: B.secondary }}>Cargando inventario...</div> : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${B.accent}22` }}>
          <div className="grid grid-cols-[1fr_120px_100px_130px_130px_80px] gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ background: B.warm, borderBottom: `2px solid ${B.accent}22`, color: B.secondary }}>
            <span>Producto</span><span>Categoría</span><span className="text-center">Cantidad</span><span>Ubicación</span><span>Registrado por</span><span className="text-center">Acciones</span>
          </div>
          {filteredInv.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">📦</div><div className="text-sm font-semibold">No se encontraron productos</div></div>
          ) : filteredInv.map(item => {
            const cat = INVENTORY_CATEGORIES.find(c => c.value === item.category) || INVENTORY_CATEGORIES[INVENTORY_CATEGORIES.length - 1];
            const loc = INVENTORY_LOCATIONS.find(l => l.value === item.location) || { icon: "📍", label: item.location || "—" };
            return (
              <div key={item.id} className="grid grid-cols-[1fr_120px_100px_130px_130px_80px] gap-2 px-5 py-3 items-center text-sm" style={{ borderBottom: `1px solid ${B.accent}11` }}
                onMouseEnter={e => (e.currentTarget.style.background = B.warm)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div><div className="font-bold" style={{ color: B.dark }}>{item.name}</div>{item.notes && <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[250px]">{item.notes}</div>}</div>
                <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{cat.icon} {cat.label}</span>
                <div className="text-center"><span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold" style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #16a34a33" }}>{item.quantity} {item.unit}</span></div>
                <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{loc.icon} {loc.label}</span>
                <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{item.registered_by || "—"}</span>
                <div className="flex gap-1 justify-center">
                  <button onClick={() => { setEditInvItem(item); setInvModalOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: B.light, color: B.primary }}>✏</button>
                  <button onClick={() => handleInvDel(item.id!)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-red-50 text-red-500">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={invModalOpen} onClose={() => { setInvModalOpen(false); setEditInvItem(null); }} title={editInvItem ? "Editar Producto" : "Nuevo Producto"}>
        <InventoryForm item={editInvItem} onSave={handleInvSave} onClose={() => { setInvModalOpen(false); setEditInvItem(null); }} />
      </Modal>
    </div>
  );

  // ── Prospection Tab ──
  const renderProspection = () => {
    const prospStats = {
      total: prospection.length,
      byStatus: PROSP_STATUSES.reduce((acc, s) => { acc[s.value] = prospection.filter(r => r.status === s.value).length; return acc; }, {} as Record<string, number>),
    };

    return (
      <div className="px-6 py-4 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-6 gap-2 mb-5">
          {PROSP_STATUSES.map(s => (
            <div key={s.value} className="rounded-xl p-3 cursor-pointer transition-all" style={{ background: s.bg, border: `1.5px solid ${prospStatusFilter === s.value ? s.color : s.border}`, boxShadow: prospStatusFilter === s.value ? `0 4px 12px ${s.color}22` : "none" }}
              onClick={() => setProspStatusFilter(p => p === s.value ? "all" : s.value)}>
              <div className="text-xl font-extrabold" style={{ color: s.color }}>{prospStats.byStatus[s.value] || 0}</div>
              <div className="text-[9px] font-bold uppercase tracking-wide mt-0.5 leading-tight" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={prospSearch} onChange={e => setProspSearch(e.target.value)} placeholder="Buscar institución o distrito..." className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm border" style={{ borderColor: `${B.accent}33` }} />
          </div>
          <select value={prospTypeFilter} onChange={e => setProspTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
            <option value="all">Todos los tipos</option>
            {PROSP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={prospStatusFilter} onChange={e => setProspStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
            <option value="all">Todos los estados</option>
            {PROSP_STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
          </select>
          <button onClick={() => { setEditProspRecord(null); setProspModalOpen(true); }} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: B.gDark }}>+ Nueva Institución</button>
        </div>

        {/* Table */}
        {prospLoading ? <div className="text-center py-20 text-lg font-bold" style={{ color: B.secondary }}>Cargando registros...</div> : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${B.accent}22` }}>
            <div className="grid gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "1.5fr 80px 90px 90px 110px 120px 120px 100px 70px", background: B.warm, borderBottom: `2px solid ${B.accent}22`, color: B.secondary }}>
              <span>Institución</span><span>Tipo</span><span>Sector</span><span>Nivel</span><span>Contacto 1</span><span>Último contacto</span><span>Próximo contacto</span><span>Estado</span><span className="text-center">Acc.</span>
            </div>
            {filteredProsp.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🏫</div><div className="text-sm font-semibold">No se encontraron registros</div><div className="text-xs mt-1">Agrega una nueva institución para empezar el seguimiento</div></div>
            ) : filteredProsp.map(record => {
              const st = PROSP_STATUSES.find(s => s.value === record.status) || PROSP_STATUSES[0];
              return (
                <div key={record.id} className="grid gap-2 px-4 py-3 items-center text-sm" style={{ gridTemplateColumns: "1.5fr 80px 90px 90px 110px 120px 120px 100px 70px", borderBottom: `1px solid ${B.accent}11` }}
                  onMouseEnter={e => (e.currentTarget.style.background = B.warm)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div>
                    <div className="font-bold" style={{ color: B.dark }}>{record.name}</div>
                    {record.district && <div className="text-[10px] text-gray-400">📍 {record.district}{record.address ? ` · ${record.address}` : ""}</div>}
                    {record.next_step && <div className="text-[10px] text-blue-500 mt-0.5">→ {record.next_step}</div>}
                    {record.comments && <div className="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-[200px]">{record.comments}</div>}
                  </div>
                  <span className="text-xs" style={{ color: "#64748b" }}>{record.type}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{record.sector}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{record.level || "—"}</span>
                  <div>
                    {record.contact1 && <div className="text-xs font-semibold" style={{ color: B.dark }}>{record.contact1}</div>}
                    {record.phone1 && <div className="text-[10px] text-gray-400">📞 {record.phone1}</div>}
                  </div>
                  <span className="text-xs" style={{ color: "#64748b" }}>{record.last_contact ? fmtDisplay(record.last_contact) : "—"}</span>
                  <span className="text-xs font-semibold" style={{ color: record.next_contact ? "#0369a1" : "#94a3b8" }}>{record.next_contact ? fmtDisplay(record.next_contact) : "—"}</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-extrabold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{record.status}</span>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => { setEditProspRecord(record); setProspModalOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: B.light, color: B.primary }}>✏</button>
                    <button onClick={() => handleProspDel(record.id!)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-red-50 text-red-500">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={prospModalOpen} onClose={() => { setProspModalOpen(false); setEditProspRecord(null); }} title={editProspRecord ? "Editar Institución" : "Nueva Institución"}>
          <ProspectionForm record={editProspRecord} onSave={handleProspSave} onClose={() => { setProspModalOpen(false); setEditProspRecord(null); }} />
        </Modal>
      </div>
    );
  };

  const totE = events.length, conf = events.filter(e => e.status === "confirmado").length, quot = events.filter(e => e.status === "cotizacion").length;

  return (
    <div className="min-h-screen relative">
      {/* HEADER */}
      <div className="px-6 py-4 flex items-center justify-between relative overflow-hidden" style={{ background: B.gDark, boxShadow: "0 4px 20px rgba(61,26,0,.2)" }}>
        <div className="absolute -right-5 -top-5 opacity-[.06] pointer-events-none"><svg viewBox="0 0 200 200" width="180" height="180"><polygon points="100,10 115,75 180,55 130,100 180,145 115,125 100,190 85,125 20,145 70,100 20,55 85,75" fill="#f0ad1b" /></svg></div>
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg,${B.gold},${B.accent})`, boxShadow: `0 4px 12px ${B.accent}44` }}>
            <svg viewBox="0 0 200 200" width="32" height="32"><polygon points="100,15 113,72 175,58 128,100 175,142 113,128 100,185 87,128 25,142 72,100 25,58 87,72" fill="#3d1a00" /><polygon points="100,40 108,78 145,70 122,100 145,130 108,122 100,160 92,122 55,130 78,100 55,70 92,78" fill="#6b2f0a" /></svg>
          </div>
          <div><h1 className="text-xl font-black text-white tracking-wide" style={{ fontFamily: "'Playfair Display',serif" }}>CENTRO DE CONVENCIONES</h1><p className="text-sm font-extrabold tracking-[4px] uppercase" style={{ color: B.gold }}>TINOCO</p></div>
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,.12)" }}>
            {([["calendar", "📅 Eventos"], ["inventory", "📦 Inventario"], ["prospection", "🏫 Prospección"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className="px-4 py-2 rounded-lg text-xs font-bold transition-all" style={{ background: activeTab === id ? "rgba(255,255,255,.95)" : "transparent", color: activeTab === id ? B.primary : "rgba(255,255,255,.7)", boxShadow: activeTab === id ? "0 2px 8px rgba(0,0,0,.15)" : "none" }}>{label}</button>
            ))}
          </div>
          {activeTab === "calendar" && (
            <div className="flex gap-2.5">
              {[{ l: "Total", v: totE, c: B.gold }, { l: "Confirmados", v: conf, c: "#60a5fa" }, { l: "Cotización", v: quot, c: "#fb923c" }].map(s => <div key={s.l} className="px-4 py-2 rounded-lg text-center" style={{ background: `${s.c}22` }}><div className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] font-bold uppercase tracking-wide opacity-80" style={{ color: s.c }}>{s.l}</div></div>)}
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <>
          <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-2.5" style={{ background: "rgba(255,255,255,.85)", borderBottom: `2px solid ${B.accent}22`, backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-2">
              <button onClick={prev} className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-base" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>←</button>
              <h2 onClick={() => setYearView(!yearView)} className="text-xl font-extrabold min-w-[200px] text-center cursor-pointer" style={{ color: B.dark, fontFamily: "'Playfair Display',serif" }}>{MONTHS_ES[month]} {year}</h2>
              <button onClick={next} className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-base" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>→</button>
              <button onClick={() => setYearView(!yearView)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${B.accent}33`, background: yearView ? B.gAcc : "#fff", color: yearView ? "#fff" : B.primary }}>{year}</button>
            </div>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: `${B.accent}15` }}>
              {[{ id: "month", l: "Mes" }, { id: "week", l: "Semana" }, { id: "day", l: "Día" }].map(v => <button key={v.id} onClick={() => { setViewMode(v.id); setYearView(false); if (v.id === "week") { setWeekStart(getMondayOfWeek(today)); } }} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{ background: viewMode === v.id ? "#fff" : "transparent", color: viewMode === v.id ? B.primary : "#64748b", boxShadow: viewMode === v.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>{v.l}</button>)}
            </div>
            <div className="flex gap-2 items-center">
              <select value={fType} onChange={e => setFType(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
                <option value="all">Todos los tipos</option>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
              <select value={fVenue} onChange={e => setFVenue(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{ border: `1px solid ${B.accent}33`, color: B.dark }}>
                <option value="all">Todos los espacios</option>{VENUES.map(v => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="px-6 py-4 pb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[.03] pointer-events-none z-0 w-[500px] h-[500px]">
              <svg viewBox="0 0 200 200" width="500" height="500"><polygon points="100,10 115,75 180,55 130,100 180,145 115,125 100,190 85,125 20,145 70,100 20,55 85,75" fill="#b8540c" /></svg>
            </div>
            {loading ? <div className="text-center py-20 text-lg font-bold" style={{ color: B.secondary }}>Cargando eventos...</div>
              : yearView ? renderYear() : (
                <>
                  {viewMode === "month" && <>
                    <div className="grid grid-cols-7 gap-2 mb-2">{DAYS_ES.map((d, i) => <div key={d} className="text-center py-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: i >= 5 ? B.primary : B.secondary }}>{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-2 items-start">{renderMonth()}</div>
                  </>}
                  {viewMode === "week" && renderWeek()}
                  {viewMode === "day" && renderDay()}
                </>
              )}
            <div className="mt-5 p-3.5 rounded-xl flex gap-5 items-center flex-wrap" style={{ background: "rgba(255,255,255,.85)", border: `1px solid ${B.accent}22` }}>
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: B.secondary }}>Espacios:</span>
              {VENUES.map(v => <span key={v.id} className="text-xs font-semibold" style={{ color: B.dark }}>{v.icon} {v.label}</span>)}
              <span className="pl-4" style={{ borderLeft: `1px solid ${B.accent}33` }} />
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: B.secondary }}>Estados:</span>
              {STATUS_OPTIONS.map(s => <span key={s.value} className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>)}
            </div>
          </div>

          <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditEvt(null); }} title={editEvt ? "Editar Evento" : "Nuevo Evento"}>
            <EventForm event={editEvt} dateStr={selSlot.date} venue={selSlot.venue} onSave={handleSave} onDelete={handleDel} onClose={() => { setModalOpen(false); setEditEvt(null); }} events={events} />
          </Modal>

          {detEvt && <div className="fixed inset-0 z-[900]" onClick={() => setDetEvt(null)}>
            <div onClick={e => e.stopPropagation()} className="absolute bg-white rounded-xl p-4 z-[901]" style={{ left: Math.min(detPos.x, typeof window !== "undefined" ? window.innerWidth - 380 : 400), top: Math.min(detPos.y, typeof window !== "undefined" ? window.innerHeight - 450 : 400), boxShadow: "0 20px 40px rgba(61,26,0,.15)", border: `1px solid ${B.accent}22` }}>
              <EventDetail event={detEvt} onEdit={editFrom} onDelete={handleDel} />
            </div>
          </div>}
        </>
      )}

      {activeTab === "inventory" && renderInventory()}
      {activeTab === "prospection" && renderProspection()}
    </div>
  );
}
