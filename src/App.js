import React, { useState, useEffect, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025";          
const STORAGE_KEY    = "chazz_comunicados_v2";
const SESSION_KEY    = "chazz_admin_session";

// ─── Paleta Chazz (Basada en logo) ──────────────────────────────────────────
const C = {
  red:        "#D32F2F",
  redLight:   "#FFEBEE",
  redMid:     "#EF9A9A",
  green:      "#2E7D32",
  greenLight: "#E8F5E9",
  greenMid:   "#A5D6A7",
  blue:       "#1565C0",
  blueLight:  "#E3F2FD",
  bg:         "#F9F9F9",
  surface:    "#FFFFFF",
  border:     "#E0E0E0",
  borderDark: "#BDBDBD",
  text:       "#212121",
  textMid:    "#616161",
  textLight:  "#9E9E9E",
  yellow:     "#F9A825",
  yellowLight:"#FFF8E1",
};

// ─── Categorías ───────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "todos",  label: "Todos",  color: C.red,   colorLight: C.redLight,   desc: "Comunicados generales para toda la operación" },
  { id: "piso",   label: "Piso",   color: C.red,   colorLight: C.redLight,   desc: "Área de servicio y atención al cliente" },
  { id: "cocina", label: "Cocina", color: C.green, colorLight: C.greenLight, desc: "Área de producción y alimentos" },
  { id: "jefes",  label: "Jefes",  color: C.blue,  colorLight: C.blueLight,  desc: "Gerencia y jefes de área" },
];
const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]));

// Define qué categorías se muestran en la pantalla principal operativa
const OPERATIVE_CATS = ["todos", "cocina"]; // ← Cambia aquí si Piso también debe estar bloqueado.

// ─── Storage (CORREGIDO) ──────────────────────────────────────────────────────
async function loadComunicados() {
  try { 
    const r = localStorage.getItem(STORAGE_KEY); 
    return r ? JSON.parse(r) : null; 
  }
  catch { return null; }
}
async function saveComunicados(data) {
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
  }
  catch (e) { console.error(e); }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
const SEED = [
  { id:"c001", titulo:"Bienvenida al Tablón Digital Chazz", categoria:"todos", fecha:"2026-04-06",
    cuerpo:"Este es el nuevo canal oficial. Favor de revisar diariamente.", autor:"Oscar", archivado:false }
];

// ─── Routing ──────────────────────────────────────────────────────────────────
function getRoute() { return window.location.hash.replace("#","") || "/"; }
function setRoute(p) { window.location.hash = p; }

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return "";
  const [y,m,d] = str.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}
function genId() { return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ─── Componentes Visuales ─────────────────────────────────────────────────────
function Logo({ size = "lg" }) {
  const sizes = { lg: { img: 120 }, sm: { img: 56 } };
  const s = sizes[size] || sizes.lg;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <img src="/logo.png" alt="Chazz" style={{ width: s.img, objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
    </div>
  );
}

function ShareBtn({ path, label }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href.split("#")[0] + "#" + path;
  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  }
  return (
    <button onClick={copy} style={S.shareBtn}>
      {copied ? "✓" : `🔗 ${label}`}
    </button>
  );
}

function Badge({ catId }) {
  const cat = CAT_MAP[catId];
  return (
    <span style={{ ...S.badge, background: cat?.colorLight, color: cat?.color, border: `1px solid ${cat?.color}44` }}>
      {cat?.label ?? catId}
    </span>
  );
}

function ComunicadoCard({ c, onClick }) {
  const cat = CAT_MAP[c.categoria];
  return (
    <div onClick={() => onClick?.(c.id)} style={{ ...S.card, borderLeft:`4px solid ${cat?.color}`, cursor: "pointer" }}>
      <div style={S.cardTop}>
        <Badge catId={c.categoria} />
        <span style={S.cardDate}>{fmtDate(c.fecha)}</span>
      </div>
      <h3 style={S.cardTitle}>{c.titulo}</h3>
      <p style={S.cardExcerpt}>{c.cuerpo.slice(0,110)}...</p>
      <div style={S.cardFooter}><span style={S.readMore}>Leer →</span></div>
    </div>
  );
}

// ─── Vistas Operativas (SIN BOTÓN DE VOLVER) ──────────────────────────────────
function ListaView({ comunicados, catId, onNav }) {
  const cat = CAT_MAP[catId];
  const lista = comunicados.filter(c => !c.archivado && (catId === "todos" || c.categoria === catId || c.categoria === "todos"));
  const isLocked = OPERATIVE_CATS.includes(catId); // Verifica si es una sección bloqueada

  return (
    <div style={S.view}>
      <div style={{...S.listaHeader, borderBottom:`3px solid ${cat?.color}`, padding:"10px 20px"}}>
        {!isLocked && <button onClick={()=>onNav("/")} style={S.backBtn}>← Volver</button>}
        <h2>{cat?.label}</h2>
      </div>
      <div style={{padding:16, display:"flex", flexDirection:"column", gap:10}}>
        {lista.map(c => <ComunicadoCard key={c.id} c={c} onClick={id => onNav("/comunicado/"+id)} />)}
      </div>
    </div>
  );
}

// ─── Vistas ───────────────────────────────────────────────────────────────────
function HubView({ onNav }) {
  return (
    <div style={S.view}>
      <div style={S.hubHero}>
        <Logo size="lg" />
        <h1 style={S.hubTitle}>Comunicados Chazz</h1>
        <p style={S.hubSub}>Selecciona tu área</p>
      </div>
      <div style={S.catGrid}>
        {CATEGORIAS.map(cat => (
          <button key={cat.id} onClick={() => onNav("/"+cat.id)} style={{ ...S.catCard, borderTop:`4px solid ${cat.color}` }}>
            <div style={S.catLabel}>{cat.label}</div>
            <div style={S.catDesc}>{cat.desc}</div>
          </button>
        ))}
      </div>
      <div style={{textAlign:"center", marginTop:20}}>
        <button onClick={() => onNav("/login")} style={S.adminSmallBtn}>⚙ Admin</button>
      </div>
    </div>
  );
}

function ComunicadoView({ comunicados, id, onNav }) {
  const c = comunicados.find(x => x.id === id);
  if (!c) return <div style={S.view}>No encontrado</div>;
  const isLocked = OPERATIVE_CATS.includes(c.categoria); // Verifica si es un comunicado de sección bloqueada
  return (
    <div style={S.view}>
       <div style={{padding:20}}>
        {!isLocked && <button onClick={()=>window.history.back()} style={S.backBtn}>← Volver</button>}
        <div style={{marginTop: resembles("todos", c.categoria) || resembles("cocina", c.categoria) ? 10 : 0}}>
            <Badge catId={c.categoria} />
            <h1 style={{marginTop:10}}>{c.titulo}</h1>
            <p style={{whiteSpace:"pre-wrap", color:"#555"}}>{c.cuerpo}</p>
            <hr style={{border:"none", borderBottom:"1px solid #ddd"}}/>
            <p>Publicado por: <strong>{c.autor}</strong></p>
        </div>
       </div>
    </div>
  );
}

function resembles(a,b) { return a.toLowerCase() === b.toLowerCase(); }

function LoginView({ onLogin, onBack }) {
  const [pw, setPw] = useState("");
  return (
    <div style={{...S.view, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
      <div style={S.loginBox}>
        <Logo size="lg" />
        <input type="password" style={S.loginInput} onChange={e=>setPw(e.target.value)} placeholder="Contraseña" />
        <button style={S.loginBtn} onClick={() => pw === ADMIN_PASSWORD ? onLogin() : alert("Error")}>Entrar</button>
        <button style={S.loginBack} onClick={onBack}>Cancelar</button>
      </div>
    </div>
  );
}

function AdminView({ comunicados, onSave, onNav, onLogout }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState("lista");

  const handlePublish = () => {
    onSave([{...form, id:genId(), archivado:false}, ...comunicados]);
    setForm(EMPTY_FORM);
    setTab("lista");
  };

  return (
    <div style={S.view}>
      <div style={S.adminTopBar}>
        <span>Panel Admin</span>
        <button onClick={onLogout}>Salir</button>
      </div>
      <div style={S.tabRow}>
        <button onClick={()=>setTab("lista")} style={tab==="lista"?S.tabActive:S.tab}>Lista</button>
        <button onClick={()=>setTab("nuevo")} style={tab==="nuevo"?S.tabActive:S.tab}>Nuevo</button>
      </div>
      {tab === "nuevo" ? (
        <div style={{padding:20}}>
          <input style={S.input} placeholder="Título" onChange={e=>setForm({...form, titulo:e.target.value})} />
          <select style={S.input} onChange={e=>setForm({...form, categoria:e.target.value})}>
             {CATEGORIAS.map(c=><option value={c.id}>{c.label}</option>)}
          </select>
          <textarea style={{...S.input, height:100}} placeholder="Mensaje" onChange={e=>setForm({...form, cuerpo:e.target.value})} />
          <input style={S.input} placeholder="Autor" onChange={e=>setForm({...form, autor:e.target.value})} />
          <button style={S.publishBtn} onClick={handlePublish}>Publicar</button>
        </div>
      ) : (
        <div style={{padding:20}}>
           {comunicados.map(c => (
             <div key={c.id} style={{padding:10, borderBottom:"1px solid #ddd"}}>
                {c.titulo} - <button onClick={()=>onSave(comunicados.filter(x=>x.id!==c.id))}>Eliminar</button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = { titulo:"", categoria:"todos", fecha: new Date().toISOString().split("T")[0], cuerpo:"", autor:"Oscar" };

// ─── App Base ─────────────────────────────────────────────────────────────────
export default function App() {
  const [comunicados, setComunicados] = useState(null);
  const [route, setRouteState] = useState(getRoute());
  const [isAdmin, setIsAdmin] = useState(()=>sessionStorage.getItem(SESSION_KEY)==="1");

  useEffect(()=>{ loadComunicados().then(d=>setComunicados(d??SEED)); },[]);
  useEffect(()=>{
    const h=()=>setRouteState(getRoute());
    window.addEventListener("hashchange",h);
    return ()=>window.removeEventListener("hashchange",h);
  },[]);

  const handleNav = (p)=>{ setRoute(p); setRouteState(p); window.scrollTo(0,0); };
  const handleSave = (d)=>{ setComunicados(d); saveComunicados(d); };

  if (!comunicados) return <div>Cargando...</div>;

  if (route==="/" || route==="") return <HubView onNav={handleNav} />;
  if (route==="/login") return isAdmin ? (handleNav("/admin"),null) : <LoginView onLogin={()=>{setIsAdmin(true); sessionStorage.setItem(SESSION_KEY,"1"); handleNav("/admin")}} onBack={()=>handleNav("/")} />;
  if (route==="/admin") return isAdmin ? <AdminView comunicados={comunicados} onSave={handleSave} onNav={handleNav} onLogout={()=>{setIsAdmin(false); sessionStorage.removeItem(SESSION_KEY); handleNav("/")}}/> : (handleNav("/login"),null);
  if (route.startsWith("/comunicado/")) return <ComunicadoView comunicados={comunicados} id={route.replace("/comunicado/","")} onNav={handleNav}/>;
  const catId = route.replace("/","");
  if (CAT_MAP[catId]) return <ListaView comunicados={comunicados} catId={catId} onNav={handleNav}/>;
  return <HubView onNav={handleNav} />;
}

// ─── Estilos Básicos ──────────────────────────────────────────────────────────
const S = {
  view: { minHeight:"100vh", background:C.bg, fontFamily:"Arial", maxWidth:600, margin:"0 auto", paddingBottom:30 },
  hubHero: { background:"#fff", padding:"20px 40px", textAlign:"center", borderBottom:`1px solid ${C.border}` },
  hubTitle: { color:C.red, margin:"5px 0", fontSize:26 },
  hubSub: { fontSize:15, color:C.textLight, margin:"0 0 10px" },
  hubDivider: { width:48, height:3, background:C.red, margin:"0 auto", borderRadius:2 },
  catGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"15px 15px 10px" },
  catCard: { background:"#fff", border:`1px solid ${C.border}`, padding:"20px 10px", borderRadius:10, cursor:"pointer", borderTopWidth:4 },
  catLabel: { fontWeight:"bold", fontSize:18 },
  catDesc: { fontSize:11, color:C.textLight, display:"block", marginTop:3, lineHeight:1.3 },
  hubFooter: { textAlign:"center", padding:10 },
  adminSmallBtn: { background:"none", border:`1px solid ${C.border}`, color:C.textLight, padding:"5px 15px", borderRadius:5, cursor:"pointer", fontSize:11 },
  listaHeader: { display:"flex", alignItems:"center", background:"#fff", borderBottomWidth:3 },
  backBtn: { background:"none", border:"none", color:C.textLight, cursor:"pointer", fontSize:13, marginRight:10 },
  card: { background:"#fff", padding:15, borderRadius:8, border:`1px solid ${C.border}`, borderLeftWidth:4 },
  cardTop: { display:"flex", justifyContent:"space-between", marginBottom:10 },
  badge: { fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:"bold", textTransform:"uppercase" },
  cardTitle: { margin:0, fontSize:16, fontWeight:"bold" },
  cardExcerpt: { fontSize:13, color:C.textMid, margin:"5px 0 10px", lineHeight:1.4 },
  readMore: { fontSize:12, color:C.red, fontWeight:"bold" },
  artBrand: { display:"flex", alignItems:"center", padding:"10px 20px", background:"#fff", borderBottom:`1px solid ${C.border}` },
  articulo: { background:"#fff", margin:16, borderRadius:8, padding:20, border:`1px solid ${C.border}` },
  artMeta: { display:"flex", justifyContent:"space-between", marginBottom:10 },
  artTitle: { margin:"0 0 10px", fontSize:22, fontWeight:"bold" },
  loginBox: { background:"#fff", padding:30, borderRadius:15, width:"100%", textAlign:"center", boxShadow:"0 4px 10px rgba(0,0,0,0.1)" },
  loginInput: { width:"100%", padding:10, margin:"10px 0", border:`1px solid ${C.border}`, borderRadius:5 },
  loginBtn: { width:"100%", padding:10, background:C.red, color:"#fff", border:"none", borderRadius:5, fontWeight:"bold" },
  adminTopBar: { display:"flex", justifyContent:"space-between", padding:15, background:"#fff", borderBottom:`1px solid ${C.border}` },
  tabRow: { display:"flex", background:"#fff", borderBottom:`1px solid ${C.border}` },
  tabActive: { flex:1, padding:10, border:"none", background:"none", borderBottom:`2px solid ${C.red}`, fontWeight:"bold", color:C.red },
  tab: { flex:1, padding:10, border:"none", background:"none", color:C.textLight },
  input: { width:"100%", padding:10, marginBottom:10, border:`1px solid ${C.border}`, borderRadius:5, background:C.bg }
};
