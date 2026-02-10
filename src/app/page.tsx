"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchEvents, saveEvent, deleteEvent } from "@/lib/db";
import { EventData, Advance } from "@/lib/types";

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
const DAYS_ES = ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const B = {dark:"#3d1a00",primary:"#b8540c",secondary:"#d4770a",accent:"#e8960f",gold:"#f0ad1b",light:"#fdf3e3",warm:"#fef8f0",gDark:"linear-gradient(135deg,#3d1a00 0%,#6b2f0a 50%,#3d1a00 100%)",gAcc:"linear-gradient(135deg,#d4770a,#b8540c)"};

function dim(y:number,m:number){return new Date(y,m+1,0).getDate()}
function fdow(y:number,m:number){const d=new Date(y,m,1).getDay();return d===0?6:d-1}
function fmtD(y:number,m:number,d:number){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`}

// ── Modal ──
function Modal({open,onClose,children,title}:{open:boolean;onClose:()=>void;children:React.ReactNode;title:string}){
  if(!open)return null;
  return(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" style={{background:"rgba(61,26,0,0.5)",backdropFilter:"blur(6px)",animation:"fadeIn .2s ease"}} onClick={onClose}>
      <div className="bg-white rounded-2xl w-[600px] max-w-[95vw] max-h-[92vh] overflow-auto" style={{boxShadow:"0 25px 60px rgba(61,26,0,.25)",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-white z-10 rounded-t-2xl" style={{borderBottom:`2px solid ${B.accent}33`}}>
          <h2 className="text-lg font-bold" style={{color:B.dark}}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{background:B.light,color:B.primary}}>✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Advance Row ──
function AdvanceRow({advance,index,onUpdate,onLock}:{advance:Advance;index:number;onUpdate:(i:number,v:string)=>void;onLock:(i:number)=>void}){
  const[showPw,setShowPw]=useState(false);
  const[pw,setPw]=useState("");
  const[pwErr,setPwErr]=useState(false);
  const handleLock=()=>{if(pw===ADMIN_PASSWORD){onLock(index);setShowPw(false);setPw("");setPwErr(false)}else setPwErr(true)};
  return(
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:advance.locked?"#f0fdf4":B.warm,border:advance.locked?"1px solid #bbf7d0":`1px solid ${B.accent}33`}}>
      <span className="text-xs font-bold text-gray-400 w-5">{index+1}.</span>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">S/</span>
        <input type="number" value={advance.amount||""} onChange={e=>!advance.locked&&onUpdate(index,e.target.value)} disabled={advance.locked} placeholder="0.00"
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm border" style={{borderColor:`${B.accent}33`,background:advance.locked?"#f0fdf4":"#fff",color:advance.locked?"#16a34a":B.dark,fontWeight:advance.locked?700:400}}/>
      </div>
      {advance.locked?<span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-600">🔒 Validado</span>
      :<button onClick={()=>setShowPw(true)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white whitespace-nowrap" style={{background:B.gAcc}}>Validar</button>}
      {showPw&&(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center" style={{background:"rgba(61,26,0,.45)",backdropFilter:"blur(4px)"}} onClick={()=>{setShowPw(false);setPw("");setPwErr(false)}}>
          <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl p-6 w-[340px]" style={{boxShadow:"0 20px 40px rgba(61,26,0,.2)"}}>
            <div className="text-center mb-4"><div className="text-3xl mb-2">🔐</div><h3 className="font-bold" style={{color:B.dark}}>Validar Adelanto #{index+1}</h3><p className="text-xs text-gray-400 mt-1">Monto: S/ {advance.amount||"0.00"}</p></div>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false)}} onKeyDown={e=>e.key==="Enter"&&handleLock()} placeholder="Contraseña de administrador" autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm mb-1" style={{border:pwErr?"2px solid #ef4444":`1px solid ${B.accent}44`}}/>
            {pwErr&&<p className="text-red-500 text-xs mb-2">Contraseña incorrecta</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={()=>{setShowPw(false);setPw("");setPwErr(false)}} className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{border:`1px solid ${B.accent}33`}}>Cancelar</button>
              <button onClick={handleLock} className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white" style={{background:B.gAcc}}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event Form ──
function EventForm({event,onSave,onClose,onDelete,dateStr,venue,events}:{event:EventData|null;onSave:(e:EventData)=>void;onClose:()=>void;onDelete:(id:string)=>void;dateStr:string;venue:string;events:EventData[]}){
  const[form,setForm]=useState<EventData>(event||{type:"boda",name:"",date:dateStr,venue,time:"18:00",guests:50,decoration_color:"",observations:"",status:"cotizacion",amount:0,advances:[]});
  const[saveErr,setSaveErr]=useState("");
  const[saving,setSaving]=useState(false);
  const up=(k:string,v:any)=>{setForm(p=>({...p,[k]:v}));setSaveErr("")};
  const addAdv=()=>{if(form.advances.length<10)up("advances",[...form.advances,{amount:0,locked:false}])};
  const upAdv=(i:number,v:string)=>{const a=[...form.advances];a[i]={...a[i],amount:parseFloat(v)||0};up("advances",a)};
  const lockAdv=(i:number)=>{const a=[...form.advances];a[i]={...a[i],locked:true};up("advances",a)};
  const rmAdv=(i:number)=>{if(!form.advances[i].locked)up("advances",form.advances.filter((_:any,x:number)=>x!==i))};
  const totA=form.advances.reduce((s:number,a:Advance)=>s+(a.amount||0),0);
  const rem=(form.amount||0)-totA;

  const handleSave=async()=>{
    if(form.status==="confirmado"){
      const existing=events.filter(e=>e.date===form.date&&e.venue===form.venue&&e.status==="confirmado"&&e.id!==form.id);
      if(existing.length>0){setSaveErr(`Ya existe un evento CONFIRMADO en ${VENUES.find(v=>v.id===form.venue)?.label} para esta fecha.`);return}
    }
    setSaving(true);
    try{await onSave(form)}catch(e:any){setSaveErr(e.message||"Error al guardar")}
    setSaving(false);
  };

  const inp="w-full px-3.5 py-2.5 rounded-lg text-sm border";
  const lbl="text-[11px] font-bold uppercase tracking-wide mb-1.5 block";

  return(
    <div>
      <div className="mb-4"><label className={lbl} style={{color:B.primary}}>Tipo de Evento</label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map(t=><button key={t.value} onClick={()=>up("type",t.value)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{border:`2px solid ${form.type===t.value?B.primary:B.accent+"33"}`,background:form.type===t.value?B.light:"#fff",color:form.type===t.value?B.primary:"#64748b"}}>{t.emoji} {t.label}</button>)}
        </div>
      </div>
      <div className="mb-4"><label className={lbl} style={{color:B.primary}}>Nombre del Evento</label><input className={inp} style={{borderColor:`${B.accent}33`}} value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Ej: Boda de María y Juan"/></div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div><label className={lbl} style={{color:B.primary}}>Fecha</label><input className={inp} style={{borderColor:`${B.accent}33`,background:B.warm}} type="date" value={form.date} readOnly/></div>
        <div><label className={lbl} style={{color:B.primary}}>Hora Inicio</label><input className={inp} style={{borderColor:`${B.accent}33`}} type="time" value={form.time} onChange={e=>up("time",e.target.value)}/></div>
        <div><label className={lbl} style={{color:B.primary}}>Personas</label><input className={inp} style={{borderColor:`${B.accent}33`}} type="number" min="1" value={form.guests} onChange={e=>up("guests",parseInt(e.target.value)||0)}/></div>
      </div>
      <div className="mb-4"><label className={lbl} style={{color:B.primary}}>Color de Decoración</label><input className={inp} style={{borderColor:`${B.accent}33`}} value={form.decoration_color} onChange={e=>up("decoration_color",e.target.value)} placeholder="Ej: Rojo con dorado, Blanco y rosa pastel"/></div>
      <div className="mb-4"><label className={lbl} style={{color:B.primary}}>Estado</label>
        <div className="flex gap-2">{STATUS_OPTIONS.map(s=><button key={s.value} onClick={()=>up("status",s.value)} className="flex-1 py-2.5 rounded-lg font-bold text-sm" style={{border:`2px solid ${form.status===s.value?s.color:"#e2e8f0"}`,background:form.status===s.value?s.bg:"#fff",color:form.status===s.value?s.color:"#94a3b8"}}>{s.value==="confirmado"?"✓ ":"◷ "}{s.label}</button>)}</div>
        {form.status==="confirmado"&&<p className="text-xs text-blue-700 mt-1.5 italic">⚠ Solo 1 evento confirmado por espacio por día.</p>}
      </div>
      <div className="mb-4"><label className={lbl} style={{color:B.primary}}>Monto Total (S/)</label>
        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">S/</span>
          <input className={`${inp} pl-10 text-base font-semibold`} style={{borderColor:`${B.accent}33`}} type="number" value={form.amount||""} onChange={e=>up("amount",parseFloat(e.target.value)||0)} placeholder="0.00"/>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className={`${lbl} !mb-0`} style={{color:B.primary}}>Adelantos ({form.advances.length}/10)</label>
          {form.advances.length<10&&<button onClick={addAdv} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{background:B.gAcc}}>+ Agregar</button>}
        </div>
        <div className="flex flex-col gap-1.5">
          {form.advances.map((adv:Advance,i:number)=><div key={i} className="flex items-center gap-1"><div className="flex-1"><AdvanceRow advance={adv} index={i} onUpdate={upAdv} onLock={lockAdv}/></div>{!adv.locked&&<button onClick={()=>rmAdv(i)} className="text-red-500 text-base p-1">✕</button>}</div>)}
        </div>
        {form.advances.length>0&&<div className="mt-2 p-3 rounded-lg flex justify-between text-sm" style={{background:B.warm}}>
          <div><span className="text-gray-500">Total adelantos: </span><span className="font-bold text-green-600">S/ {totA.toFixed(2)}</span></div>
          <div><span className="text-gray-500">Saldo: </span><span className="font-bold" style={{color:rem<0?"#ef4444":B.dark}}>S/ {rem.toFixed(2)}</span></div>
        </div>}
      </div>
      <div className="mb-5"><label className={lbl} style={{color:B.primary}}>Observaciones</label><textarea className={`${inp} min-h-[60px] resize-y`} style={{borderColor:`${B.accent}33`}} value={form.observations} onChange={e=>up("observations",e.target.value)} placeholder="Notas adicionales..."/></div>
      {saveErr&&<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold mb-3">{saveErr}</div>}
      <div className="flex gap-2">
        {event?.id&&<button onClick={()=>onDelete(event.id!)} className="px-5 py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-sm">🗑 Eliminar</button>}
        <div className="flex-1"/>
        <button onClick={onClose} className="px-5 py-3 rounded-lg font-semibold text-sm text-gray-500 bg-white" style={{border:`1px solid ${B.accent}33`}}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-lg font-bold text-sm text-white" style={{background:B.gDark,boxShadow:"0 4px 12px rgba(61,26,0,.3)",opacity:saving?.6:1}}>{saving?"Guardando...":"Guardar Evento"}</button>
      </div>
    </div>
  );
}

// ── Event Detail ──
function EventDetail({event,onEdit,onDelete}:{event:EventData;onEdit:(e:EventData)=>void;onDelete:(id:string)=>void}){
  const ti=EVENT_TYPES.find(t=>t.value===event.type)||EVENT_TYPES[0];
  const si=STATUS_OPTIONS.find(s=>s.value===event.status)||STATUS_OPTIONS[0];
  const ta=event.advances?.reduce((s:number,a:Advance)=>s+(a.amount||0),0)||0;
  return(
    <div className="min-w-[290px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{background:si.color}}>{ti.emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{color:B.dark}}>{event.name||ti.label}</div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{background:si.bg,color:si.color,border:`1px solid ${si.border}`}}>{si.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {[{l:"Fecha",v:event.date},{l:"Hora",v:event.time},{l:"Personas",v:String(event.guests)},{l:"Monto",v:`S/ ${event.amount||"0.00"}`}].map(i=>(
          <div key={i.l} className="p-2 rounded-lg" style={{background:B.warm}}><div className="text-[10px] font-bold uppercase" style={{color:B.primary}}>{i.l}</div><div className="font-semibold" style={{color:B.dark}}>{i.v}</div></div>
        ))}
      </div>
      {event.decoration_color&&<div className="text-xs mb-2" style={{color:B.dark}}><strong style={{color:B.primary}}>Decoración:</strong> {event.decoration_color}</div>}
      {ta>0&&<div className="bg-green-50 p-2.5 rounded-lg mb-2 text-sm"><div className="font-bold text-green-600">Adelantos: S/ {ta.toFixed(2)}</div><div className="text-gray-500">Saldo: S/ {((event.amount||0)-ta).toFixed(2)}</div></div>}
      {event.observations&&<div className="text-xs text-gray-500 mb-2 italic">&ldquo;{event.observations}&rdquo;</div>}
      <div className="flex gap-2">
        <button onClick={()=>onDelete(event.id!)} className="flex-1 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-sm">🗑 Eliminar</button>
        <button onClick={()=>onEdit(event)} className="flex-1 py-2.5 rounded-lg text-white font-bold text-sm" style={{background:B.gDark}}>✏ Editar</button>
      </div>
    </div>
  );
}

// ════════════ MAIN APP ════════════
export default function Home(){
  const today=new Date();
  const[month,setMonth]=useState(today.getFullYear()===2026?today.getMonth():0);
  const year=2026;
  const[events,setEvents]=useState<EventData[]>([]);
  const[loading,setLoading]=useState(true);
  const[modalOpen,setModalOpen]=useState(false);
  const[editEvt,setEditEvt]=useState<EventData|null>(null);
  const[selSlot,setSelSlot]=useState({date:"",venue:""});
  const[detEvt,setDetEvt]=useState<EventData|null>(null);
  const[detPos,setDetPos]=useState({x:0,y:0});
  const[fType,setFType]=useState("all");
  const[fVenue,setFVenue]=useState("all");
  const[viewMode,setViewMode]=useState("month");
  const[yearView,setYearView]=useState(false);

  const loadEvents=useCallback(async()=>{setLoading(true);const data=await fetchEvents();setEvents(data);setLoading(false)},[]);
  useEffect(()=>{loadEvents()},[loadEvents]);

  const dIM=dim(year,month),fD=fdow(year,month);
  const prev=()=>setMonth(m=>m===0?11:m-1);
  const next=()=>setMonth(m=>m===11?0:m+1);

  const openSlot=(d:string,v:string)=>{setSelSlot({date:d,venue:v});setEditEvt(null);setModalOpen(true);setDetEvt(null)};
  const handleSave=async(data:EventData)=>{await saveEvent(data);await loadEvents();setModalOpen(false);setEditEvt(null)};
  const handleDel=async(id:string)=>{await deleteEvent(id);await loadEvents();setModalOpen(false);setEditEvt(null);setDetEvt(null)};
  const evtClick=(e:React.MouseEvent,evt:EventData)=>{e.stopPropagation();const r=(e.currentTarget as HTMLElement).getBoundingClientRect();setDetPos({x:r.left,y:r.bottom+4});setDetEvt(evt)};
  const editFrom=(evt:EventData)=>{setEditEvt(evt);setSelSlot({date:evt.date,venue:evt.venue});setModalOpen(true);setDetEvt(null)};

  const filtered=events.filter(e=>{if(fType!=="all"&&e.type!==fType)return false;if(fVenue!=="all"&&e.venue!==fVenue)return false;return true});
  const slotEvts=(d:string,v:string)=>filtered.filter(e=>e.date===d&&e.venue===v);

  // Year overview
  const renderYear=()=>(
    <div className="grid grid-cols-4 gap-4 p-2">
      {MONTHS_ES.map((mn,mi)=>{
        const d2=dim(year,mi),fd2=fdow(year,mi);
        const me=events.filter(e=>{const[,em]=e.date.split("-").map(Number);return em===mi+1});
        return(
          <div key={mi} onClick={()=>{setMonth(mi);setYearView(false)}} className="bg-white rounded-xl p-3 cursor-pointer transition-all" style={{border:month===mi?`2px solid ${B.primary}`:`1px solid ${B.accent}22`,boxShadow:month===mi?`0 4px 12px ${B.primary}22`:"none"}}>
            <div className="flex justify-between items-center mb-2 text-sm font-extrabold" style={{color:B.dark}}><span>{mn}</span>{me.length>0&&<span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{background:B.gAcc}}>{me.length}</span>}</div>
            <div className="grid grid-cols-7 gap-px text-[8px] text-center">
              {DAYS_ES.map(d3=><div key={d3} className="text-gray-400 font-bold py-0.5">{d3[0]}</div>)}
              {Array.from({length:fd2},(_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:d2},(_,i)=>{const day=i+1,ds=fmtD(year,mi,day),has=events.some(e=>e.date===ds),isTd=today.getFullYear()===year&&today.getMonth()===mi&&today.getDate()===day;
                return <div key={day} className="py-0.5 rounded" style={{background:has?B.accent:isTd?B.light:"transparent",color:has?"#fff":isTd?B.primary:B.dark,fontWeight:has||isTd?700:400}}>{day}</div>})}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Month grid
  const renderMonth=()=>{
    const cells=[];
    for(let i=0;i<fD;i++)cells.push(<div key={`e${i}`} className="rounded-lg opacity-30" style={{background:"#f8f6f3"}}/>);
    for(let d=1;d<=dIM;d++){
      const ds=fmtD(year,month,d),isTd=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
      const dow=new Date(year,month,d).getDay(),dowIdx=dow===0?6:dow-1;
      cells.push(
        <div key={d} className="bg-white rounded-lg overflow-hidden flex flex-col" style={{border:isTd?`2.5px solid ${B.primary}`:`1px solid ${B.accent}22`,boxShadow:isTd?`0 3px 14px ${B.primary}22`:"0 1px 3px rgba(0,0,0,.04)"}}>
          <div className="px-2 py-1 flex justify-between items-center shrink-0" style={{background:isTd?B.gDark:B.warm,borderBottom:`2px solid ${B.accent}33`}}>
            <span className="text-sm font-extrabold" style={{color:isTd?"#fff":B.dark}}>{d}</span>
            <span className="text-[9px] font-semibold" style={{color:isTd?B.gold:B.secondary}}>{DAYS_ES[dowIdx]}</span>
          </div>
          {VENUES.map((v,vi)=>{
            const se=slotEvts(ds,v.id);
            return(
              <div key={v.id} onClick={()=>openSlot(ds,v.id)} className="px-1.5 py-1 cursor-pointer transition-colors" style={{borderBottom:vi<VENUES.length-1?`2.5px solid ${B.accent}30`:"none",background:vi%2===0?"transparent":B.warm}}
                onMouseEnter={e=>(e.currentTarget.style.background=B.light)} onMouseLeave={e=>(e.currentTarget.style.background=vi%2===0?"transparent":B.warm)}>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[8px] font-bold uppercase tracking-wide shrink-0" style={{color:`${B.secondary}aa`}}>{v.icon} {v.label}</span>
                  {se.map(evt=>{const si=STATUS_OPTIONS.find(s=>s.value===evt.status)!;return <span key={evt.id+"tag"} className="text-[7px] font-extrabold px-1.5 py-px rounded uppercase" style={{background:si.bg,color:si.color,border:`1px solid ${si.border}`}}>{evt.status==="confirmado"?"CONFIRMADO":"COTIZACIÓN"}</span>})}
                </div>
                {se.map(evt=>{const bgC=evt.status==="confirmado"?"#1d4ed8":"#c2410c";
                  return <div key={evt.id} onClick={e=>evtClick(e,evt)} className="rounded px-1.5 py-0.5 text-[8.5px] font-bold text-white mt-0.5 flex items-center gap-1 cursor-pointer" style={{background:bgC,boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}>
                    <span>{EVENT_TYPES.find(t=>t.value===evt.type)?.emoji}</span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{evt.name||EVENT_TYPES.find(t=>t.value===evt.type)?.label}</span>
                    <span className="ml-auto text-[7px] opacity-80">{evt.time}</span>
                  </div>})}
              </div>
            );
          })}
        </div>
      );
    }
    return cells;
  };

  // Day view
  const renderDay=()=>{
    const d=new Date(year,month,today.getMonth()===month&&today.getFullYear()===year?today.getDate():1);
    const ds=fmtD(d.getFullYear(),d.getMonth(),d.getDate()),dowIdx=d.getDay()===0?6:d.getDay()-1;
    return(
      <div className="max-w-[850px] mx-auto">
        <div className="text-center mb-5 text-xl font-extrabold" style={{color:B.dark,fontFamily:"'Playfair Display',serif"}}>{DAYS_ES[dowIdx]} {d.getDate()} de {MONTHS_ES[d.getMonth()]} {d.getFullYear()}</div>
        {VENUES.map(v=>{const se=slotEvts(ds,v.id);return(
          <div key={v.id} className="bg-white rounded-xl mb-3 overflow-hidden" style={{border:`1px solid ${B.accent}22`}}>
            <div className="px-5 py-3 flex justify-between items-center" style={{background:B.warm,borderBottom:`2.5px solid ${B.accent}33`}}>
              <span className="text-base font-bold" style={{color:B.dark}}>{v.icon} {v.label}</span>
              <button onClick={()=>openSlot(ds,v.id)} className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{background:B.gDark}}>+ Evento</button>
            </div>
            <div className="px-5 py-3">
              {se.length===0?<div className="text-gray-400 text-sm italic py-3">Sin eventos programados</div>
              :se.map(evt=>{const ti=EVENT_TYPES.find(t=>t.value===evt.type)!;const si=STATUS_OPTIONS.find(s=>s.value===evt.status)!;const ta=evt.advances?.reduce((s:number,a:Advance)=>s+(a.amount||0),0)||0;
                return <div key={evt.id} className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer" style={{border:`2px solid ${si.border}`,background:`${si.bg}55`}}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 text-white" style={{background:si.color}}>{ti.emoji}</div>
                  <div className="flex-1" onClick={()=>editFrom(evt)}>
                    <div className="font-bold text-sm" style={{color:B.dark}}>{evt.name||ti.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{evt.time} · {evt.guests} pers. · S/ {evt.amount||"0"}{ta>0&&` · Adel: S/ ${ta.toFixed(2)}`}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase shrink-0" style={{background:si.bg,color:si.color,border:`1.5px solid ${si.border}`}}>{si.label}</span>
                  <button onClick={e=>{e.stopPropagation();handleDel(evt.id!)}} className="text-red-500 text-lg p-1 shrink-0" title="Eliminar">🗑</button>
                </div>})}
            </div>
          </div>
        )})}
      </div>
    );
  };

  const totE=events.length,conf=events.filter(e=>e.status==="confirmado").length,quot=events.filter(e=>e.status==="cotizacion").length;

  return(
    <div className="min-h-screen relative">
      {/* HEADER */}
      <div className="px-6 py-4 flex items-center justify-between relative overflow-hidden" style={{background:B.gDark,boxShadow:"0 4px 20px rgba(61,26,0,.2)"}}>
        <div className="absolute -right-5 -top-5 opacity-[.06] pointer-events-none"><svg viewBox="0 0 200 200" width="180" height="180"><polygon points="100,10 115,75 180,55 130,100 180,145 115,125 100,190 85,125 20,145 70,100 20,55 85,75" fill="#f0ad1b"/></svg></div>
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:`linear-gradient(135deg,${B.gold},${B.accent})`,boxShadow:`0 4px 12px ${B.accent}44`}}>
            <svg viewBox="0 0 200 200" width="32" height="32"><polygon points="100,15 113,72 175,58 128,100 175,142 113,128 100,185 87,128 25,142 72,100 25,58 87,72" fill="#3d1a00"/><polygon points="100,40 108,78 145,70 122,100 145,130 108,122 100,160 92,122 55,130 78,100 55,70 92,78" fill="#6b2f0a"/></svg>
          </div>
          <div><h1 className="text-xl font-black text-white tracking-wide" style={{fontFamily:"'Playfair Display',serif"}}>CENTRO DE CONVENCIONES</h1><p className="text-sm font-extrabold tracking-[4px] uppercase" style={{color:B.gold}}>TINOCO</p></div>
        </div>
        <div className="flex gap-2.5 z-10">
          {[{l:"Total",v:totE,c:B.gold},{l:"Confirmados",v:conf,c:"#60a5fa"},{l:"Cotización",v:quot,c:"#fb923c"}].map(s=><div key={s.l} className="px-4 py-2 rounded-lg text-center" style={{background:`${s.c}22`}}><div className="text-xl font-extrabold" style={{color:s.c}}>{s.v}</div><div className="text-[9px] font-bold uppercase tracking-wide opacity-80" style={{color:s.c}}>{s.l}</div></div>)}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-2.5" style={{background:"rgba(255,255,255,.85)",borderBottom:`2px solid ${B.accent}22`,backdropFilter:"blur(8px)"}}>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-base" style={{border:`1px solid ${B.accent}33`,color:B.dark}}>←</button>
          <h2 onClick={()=>setYearView(!yearView)} className="text-xl font-extrabold min-w-[200px] text-center cursor-pointer" style={{color:B.dark,fontFamily:"'Playfair Display',serif"}}>{MONTHS_ES[month]} {year}</h2>
          <button onClick={next} className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-base" style={{border:`1px solid ${B.accent}33`,color:B.dark}}>→</button>
          <button onClick={()=>setYearView(!yearView)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold" style={{border:`1px solid ${B.accent}33`,background:yearView?B.gAcc:"#fff",color:yearView?"#fff":B.primary}}>{year}</button>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{background:`${B.accent}15`}}>
          {[{id:"month",l:"Mes"},{id:"week",l:"Semana"},{id:"day",l:"Día"}].map(v=><button key={v.id} onClick={()=>{setViewMode(v.id);setYearView(false)}} className="px-4 py-1.5 rounded-lg text-xs font-bold" style={{background:viewMode===v.id?"#fff":"transparent",color:viewMode===v.id?B.primary:"#64748b",boxShadow:viewMode===v.id?"0 1px 4px rgba(0,0,0,.08)":"none"}}>{v.l}</button>)}
        </div>
        <div className="flex gap-2 items-center">
          <select value={fType} onChange={e=>setFType(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{border:`1px solid ${B.accent}33`,color:B.dark}}>
            <option value="all">Todos los tipos</option>{EVENT_TYPES.map(t=><option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
          </select>
          <select value={fVenue} onChange={e=>setFVenue(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-white cursor-pointer" style={{border:`1px solid ${B.accent}33`,color:B.dark}}>
            <option value="all">Todos los espacios</option>{VENUES.map(v=><option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
          </select>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-4 pb-16 relative">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[.03] pointer-events-none z-0 w-[500px] h-[500px]">
          <svg viewBox="0 0 200 200" width="500" height="500"><polygon points="100,10 115,75 180,55 130,100 180,145 115,125 100,190 85,125 20,145 70,100 20,55 85,75" fill="#b8540c"/><polygon points="100,30 112,78 160,65 125,100 160,135 112,122 100,170 88,122 40,135 75,100 40,65 88,78" fill="#d4770a"/><polygon points="100,50 108,82 140,75 118,100 140,125 108,118 100,150 92,118 60,125 82,100 60,75 92,82" fill="#e8960f"/><ellipse cx="100" cy="165" rx="50" ry="12" fill="#b8540c"/></svg>
        </div>

        {loading?<div className="text-center py-20 text-lg font-bold" style={{color:B.secondary}}>Cargando eventos...</div>
        :yearView?renderYear():(
          <>
            {viewMode==="month"&&<>
              <div className="grid grid-cols-7 gap-2 mb-2">{DAYS_ES.map((d,i)=><div key={d} className="text-center py-2 text-[11px] font-extrabold uppercase tracking-wide" style={{color:i>=5?B.primary:B.secondary}}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-2 items-start">{renderMonth()}</div>
            </>}
            {viewMode==="day"&&renderDay()}
          </>
        )}

        {/* Legend */}
        <div className="mt-5 p-3.5 rounded-xl flex gap-5 items-center flex-wrap" style={{background:"rgba(255,255,255,.85)",border:`1px solid ${B.accent}22`,backdropFilter:"blur(4px)"}}>
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{color:B.secondary}}>Espacios:</span>
          {VENUES.map(v=><span key={v.id} className="text-xs font-semibold" style={{color:B.dark}}>{v.icon} {v.label}</span>)}
          <span className="pl-4" style={{borderLeft:`1px solid ${B.accent}33`}}/>
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{color:B.secondary}}>Estados:</span>
          {STATUS_OPTIONS.map(s=><span key={s.value} className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{s.label}</span>)}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={()=>{setModalOpen(false);setEditEvt(null)}} title={editEvt?"Editar Evento":"Nuevo Evento"}>
        <EventForm event={editEvt} dateStr={selSlot.date} venue={selSlot.venue} onSave={handleSave} onDelete={handleDel} onClose={()=>{setModalOpen(false);setEditEvt(null)}} events={events}/>
      </Modal>

      {/* Detail Popover */}
      {detEvt&&<div className="fixed inset-0 z-[900]" onClick={()=>setDetEvt(null)}>
        <div onClick={e=>e.stopPropagation()} className="absolute bg-white rounded-xl p-4 z-[901]" style={{left:Math.min(detPos.x,typeof window!=="undefined"?window.innerWidth-360:400),top:Math.min(detPos.y,typeof window!=="undefined"?window.innerHeight-400:400),boxShadow:"0 20px 40px rgba(61,26,0,.15)",animation:"slideUp .2s ease",border:`1px solid ${B.accent}22`}}>
          <EventDetail event={detEvt} onEdit={editFrom} onDelete={handleDel}/>
        </div>
      </div>}
    </div>
  );
}
