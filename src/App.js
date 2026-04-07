import React, { useState, useEffect, useCallback } from "react";

// ─── Configuración Inicial ──────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025"; 
const STORAGE_COMMS  = "chazz_comms_v3";
const STORAGE_CATS   = "chazz_cats_v3";
const SESSION_KEY    = "chazz_admin_session";

// ─── Paleta de Colores Chazz ───────────────────────────────────────────────
const C = { 
  bg: "#F9F9F9", 
  surface: "#FFFFFF", 
  text: "#212121", 
  textMid: "#666",
  textLight: "#999",
  border: "#E0E0E0", 
  red: "#D32F2F", // Color vibrante del logo
  redLight: "#FFEBEE",
  green: "#2E7D32", // Verde bandera del logo
  greenLight: "#E8F5E9",
  blue: "#1565C0",
  blueLight: "#E3F2FD"
};

// ─── Categorías por defecto con Emojis ────────────────────────────────────
const INITIAL_CATS = [
  { id: "todos", label: "Todos", emoji: "📋", color: C.red, colorLight: C.redLight, desc: "Comunicados generales" },
  { id: "piso", label: "Piso", emoji: "🍽️", color: C.red, colorLight: C.redLight, desc: "Área de servicio" },
  { id: "cocina", label: "Cocina", emoji: "👨‍🍳", color: C.green, colorLight: C.greenLight, desc: "Área de producción" },
  { id: "jefes", label: "Jefes", emoji: "👔", color: C.blue, colorLight: C.blueLight, desc: "Gerencia y jefes" }
];

const SEED_COMMS = [
  { id: "c1", titulo: "Bienvenido al nuevo Tablón Digital Chazz", categoria: "todos", fecha: "2026-04-06", cuerpo: "Este es el canal oficial de comunicación. Favor de revisar diariamente.", autor: "Oscar", archivado: false }
];

// ─── Routing & Utils ───────────────────────────────────────────────────────
function getRoute() { return window.location.hash.replace("#", "") || "/"; }
function setRoute(p) { window.location.hash = p; }
function genId() { return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// Componente Logo Fallback
function Logo({ size = "lg" }) {
  const sizes = { lg: 120, sm: 56 };
  const s = sizes[size] || sizes.lg;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src="/logo.png" alt="Chazz" style={{ width: s, objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [comunicados, setComunicados] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [route, setRouteState] = useState(getRoute());
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  // Cargar datos
  useEffect(() => {
    const sComms = localStorage.getItem(STORAGE_COMMS);
    const sCats = localStorage.getItem(STORAGE_CATS);
    setComunicados(sComms ? JSON.parse(sComms) : SEED_COMMS);
    setCategorias(sCats ? JSON.parse(sCats) : INITIAL_CATS);
  }, []);

  // Guardar datos
  const saveAll = (newComms, newCats) => {
    if (newComms) { setComunicados(newComms); localStorage.setItem(STORAGE_COMMS, JSON.stringify(newComms)); }
    if (newCats) { setCategorias(newCats); localStorage.setItem(STORAGE_CATS, JSON.stringify(newCats)); }
  };

  useEffect(() => {
    const h = () => setRouteState(getRoute());
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const handleNav = (p) => { setRoute(p); setRouteState(p); window.scrollTo(0, 0); };
  const handleLogout = () => { setIsAdmin(false); sessionStorage.removeItem(SESSION_KEY); handleNav("/"); };

  if (!comunicados || !categorias) return <div style={S.loading}>Cargando sistema Chazz...</div>;
  const CAT_MAP = Object.fromEntries(categorias.map(c => [c.id, c]));

  // 1. HUB / MENÚ PRINCIPAL (MÁS VISUAL)
  if (route === "/" || route === "") {
    return (
      <div style={S.view}>
        <div style={S.hubHero}>
          <Logo size="lg" />
          <h1 style={S.hubTitle}>Comunicados Chazz</h1>
          <p style={S.hubSub}>Selecciona tu área</p>
          <div style={S.heroDivider} />
        </div>
        <div style={S.catGrid}>
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => handleNav("/"+cat.id)} style={{...S.catCard, borderTop:`4px solid ${cat.color}`}}>
              {/* Emojis con recuadro de color */}
              <div style={{...S.catIcon, background: cat.colorLight, color: cat.color}}>{cat.emoji}</div>
              <div style={{...S.catLabel, color: cat.color}}>{cat.label}</div>
              <div style={S.catDesc}>{cat.desc || "Avisos del área"}</div>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center", padding:20}}>
          <button onClick={() => handleNav("/login")} style={S.adminSmallBtn}>⚙ Acceso Admin</button>
        </div>
      </div>
    );
  }

  // 2. LOGIN
  if (route === "/login") {
    return (
      <div style={{...S.view, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div style={S.loginBox}>
          <Logo size="sm" />
          <input type="password" placeholder="Contraseña Admin" style={S.input} onKeyDown={e => {
            if(e.key === 'Enter' && e.target.value === ADMIN_PASSWORD) {
              setIsAdmin(true); sessionStorage.setItem(SESSION_KEY, "1"); handleNav("/admin");
            }
          }}/>
          <button onClick={() => handleNav("/")} style={S.btnBackLink}>← Cancelar</button>
        </div>
      </div>
    );
  }

  // 3. ADMIN
  if (route === "/admin") {
    if (!isAdmin) { handleNav("/login"); return null; }
    return <AdminPanel comunicados={comunicados} categorias={categorias} saveAll={saveAll} onLogout={handleLogout} />;
  }

  // 4. LISTA POR ÁREA (Con navegación bloqueada)
  if (CAT_MAP[route.replace("/", "")]) {
    const catId = route.replace("/", "");
    const cat = CAT_MAP[catId];
    // Filtro: Ven su área + todos
    const lista = comunicados.filter(c => !c.archivado && (c.categoria === catId || c.categoria === "todos")).sort((a,b)=>b.fecha.localeCompare(a.fecha));

    return (
      <div style={S.view}>
        <div style={{...S.listaHeader, borderBottom:`3px solid ${cat.color}`}}>
          {isAdmin && <button onClick={()=>handleNav("/")} style={S.backBtn}>Menú</button>}
          <div style={S.listaHeaderText}>
            <img src="/logo.png" alt="Chazz" style={{width:50}}/>
            <h2 style={{margin:0, color:cat.color}}>{cat.label}</h2>
          </div>
        </div>
        <div style={{padding:16, display:"flex", flexDirection:"column", gap:12}}>
          {lista.length === 0 ? <p style={S.empty}>No hay avisos nuevos por ahora.</p> : 
            lista.map(c => <CardComunicado key={c.id} c={c} onClick={id => handleNav("/ver/"+id)}/>)
          }
        </div>
      </div>
    );
  }

  // 5. VER COMUNICADO (Navegación bloqueada y Logo Hamburguesa)
  if (route.startsWith("/ver/")) {
    const id = route.replace("/ver/", "");
    const comm = comunicados.find(c => c.id === id);
    if (!comm) return <div>No encontrado</div>;
    const cat = CAT_MAP[comm.categoria] || {color: C.red, label:"General"};

    return (
      <div style={S.view}>
        <div style={{padding:16, background:"#fff", borderBottom:`3px solid ${cat.color}`}}>
          {/* Solo admin puede volver si no es de cocina/piso */}
          {(!isAdmin && (comm.categoria === "cocina" || comm.categoria === "piso")) ? null : <button onClick={()=>window.history.back()} style={S.backBtn}>← Volver</button>}
          
          <div style={S.artTitleBlock}>
             <img src="/burger.png" alt="Burger Mascot" style={S.burgerLogo} onError={e=>e.target.style.display="none"}/>
             <div>
                <span style={{...S.artBadge, color: cat.color, background: cat.colorLight, border:`1px solid ${cat.color}44`}}>{cat.label}</span>
                <h1 style={{fontSize:24, marginTop:10, marginBottom:2}}>{comm.titulo}</h1>
                <p style={{fontSize:12, color:"#999", margin:0}}>Publicado: {comm.fecha} por {comm.autor}</p>
             </div>
          </div>
        </div>
        <div style={{...S.articuloBody, whiteSpace:"pre-wrap"}}>{comm.cuerpo}</div>
      </div>
    );
  }

  return <div style={{padding:20}}>Ruta no válida. <button onClick={()=>handleNav("/")}>Ir al inicio</button></div>;
}

// ─── Sub-Componentes Visuales ──────────────────────────────────────────────
function CardComunicado({ c, onClick }) {
  const cat = Initial_CATS.find(x=>x.id===c.categoria) || {color:C.red, colorLight:C.redLight};
  return (
    <div onClick={() => onClick?.(c.id)} style={{...S.postCard, borderLeft:`4px solid ${cat.color}`, cursor: "pointer"}}>
      <div style={S.cardTop}>
         <span style={{...S.artBadge, fontSize:9, padding:"1px 6px", color: cat.color, background: cat.colorLight, border:`1px solid ${cat.color}44`}}>{c.categoria.toUpperCase()}</span>
         <span style={{fontSize:11, color:"#999"}}>{c.fecha}</span>
      </div>
      <h3 style={S.cardTitle}>{c.titulo}</h3>
      <p style={S.cardExcerpt}>{c.cuerpo.slice(0,100)}...</p>
      <div style={{textAlign:"right"}}><span style={{color:cat.color, fontSize:12, fontWeight:"bold"}}>Leer →</span></div>
    </div>
  );
}

// ─── PANEL ADMIN (SUB-COMPONENTE CON PESTAÑAS) ───────────────────────────
const EMPTY_FORM = { titulo:"", cuerpo:"", categoria:"todos", autor:"Oscar" };
function AdminPanel({ comunicados, categorias, saveAll, onLogout }) {
  const [tab, setTab] = useState("comms");
  const [nuevo, setNuevo] = useState(EMPTY_FORM);

  const addComm = () => {
    if(!nuevo.titulo || !nuevo.cuerpo) return alert("Llena los campos requeridos");
    const item = { ...nuevo, id: "c"+Date.now(), fecha: new Date().toISOString().split('T')[0], archivado:false };
    saveAll([item, ...comunicados], null);
    setNuevo(EMPTY_FORM);
    setTab("comms");
  };

  const addCat = () => {
    const name = prompt("Nombre de la nueva área (ej: Limpieza):");
    if(name) {
      const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      const emoji = prompt("Un Emoji para el área (ej: 🧹):", "📋");
      const color = prompt("Un Color Hexadecimal (ej: #FF5733):", "#D32F2F");
      saveAll(null, [...categorias, { id, label: name, emoji, color, colorLight: color+"22", desc: "Avisos de " + name }]);
    }
  };

  return (
    <div style={S.view}>
      <div style={S.adminTopBar}>
        <strong>ADMIN CHAZZ</strong>
        <button onClick={onLogout} style={S.btnLogout}>Salir</button>
      </div>
      <div style={S.tabRow}>
        <button onClick={()=>setTab("comms")} style={tab==="comms"?S.tabA:S.tab}>Lista</button>
        <button onClick={()=>setTab("nuevo")} style={tab==="nuevo"?S.tabA:S.tab}>+ Nuevo</button>
        <button onClick={()=>setTab("cats")} style={tab==="cats"?S.tabA:S.tab}>Áreas</button>
      </div>

      {tab === "nuevo" && (
        <div style={{padding:20}}>
          <input style={S.input} placeholder="Título *" value={nuevo.titulo} onChange={e=>setNuevo({...nuevo, titulo:e.target.value})} />
          <select style={S.input} value={nuevo.categoria} onChange={e=>setNuevo({...nuevo, categoria:e.target.value})}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <textarea style={{...S.input, height:180, resize:"none"}} placeholder="Mensaje... *" value={nuevo.cuerpo} onChange={e=>setNuevo({...nuevo, cuerpo:e.target.value})} />
          <input style={S.input} placeholder="Autor" value={nuevo.autor} onChange={e=>setNuevo({...nuevo, autor:e.target.value})} />
          <button style={S.btnSave} onClick={addComm}>Publicar Comunicado</button>
        </div>
      )}

      {tab === "comms" && (
        <div style={{padding:15}}>
          {comunicados.map(c => (
            <div key={c.id} style={S.adminRow}>
              <div><strong>{c.titulo}</strong><br/><small>{c.categoria.toUpperCase()} | {c.fecha}</small></div>
              <div style={{display:"flex", gap:5}}>
                <button onClick={() => saveAll(comunicados.map(x=>x.id===c.id?{...x, archivado:!x.archivado}:x), null)} style={S.btnIcon}>{c.archivado?"Restaurar":"Archivar"}</button>
                <button onClick={() => { if(window.confirm("¿Borrar?")) saveAll(comunicados.filter(x=>x.id!==c.id), null) }} style={{...S.btnIcon, color:"red", borderColor:"red"}}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "cats" && (
        <div style={{padding:20}}>
          <button onClick={addCat} style={S.btnSave}>+ Agregar Nueva Área</button>
          <div style={{marginTop:20}}>
            {categorias.map(c => (
              <div key={c.id} style={{...S.adminRow, borderLeft:`3px solid ${c.color}`}}>
                <span>{c.label} {c.emoji}</span>
                {c.id !== "todos" && <button onClick={()=>saveAll(null, categorias.filter(x=>x.id!==c.id))} style={{color:"red", border:"none", background:"none", fontSize:11}}>Borrar</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Estilos (S) ─────────────────────────────────────────────────────────────
const S = {
  view: { minHeight:"100vh", background:C.bg, fontFamily:"Arial, sans-serif", maxWidth:600, margin:"0 auto" },
  loading: { padding:20, textAlign:"center", fontSize:16, color:C.textMid },
  // Hub
  hubHero: { background:"#fff", padding:"40px 24px 30px", textAlign:"center", borderBottom:`1px solid ${C.border}` },
  hubTitle: { color:C.red, margin:"15px 0 5px", fontSize:28, fontWeight:800 },
  hubSub: { fontSize:15, color:C.textMid, margin:"0 0 25px" },
  heroDivider: { width:48, height:3, background:C.red, margin:"0 auto", borderRadius:2 },
  catGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, padding:"25px 20px 10px" },
  catCard: { background:"#fff", padding:"25px 15px 20px", borderRadius:15, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"center", boxShadow:"0 4px 6px rgba(0,0,0,0.05)", borderTopWidth:4 },
  catIcon: { width:48, height:48, borderRadius:12, margin:"0 auto 15px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 },
  catLabel: { fontWeight:"bold", fontSize:18, marginBottom:4 },
  catDesc: { fontSize:12, color:C.textLight, lineHeight:1.3 },
  adminSmallBtn: { background:"none", border:`1px solid ${C.border}`, color:C.textLight, padding:"8px 20px", borderRadius:20, fontSize:12, cursor:"pointer" },
  // Area / Comunicados
  listaHeader: { background:"#fff", padding:15, display:"flex", alignItems:"center", borderBottomWidth:3 },
  listaHeaderText: { textAlign:"center", flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:15 },
  backBtn: { background:"#eee", border:"none", padding:"6px 12px", borderRadius:8, fontSize:12, cursor:"pointer", color:C.textMid },
  postCard: { background:"#fff", padding:16, borderRadius:10, marginBottom:12, boxShadow:"0 2px 4px rgba(0,0,0,0.02)", borderLeftWidth:4, border:`1px solid ${C.border}` },
  cardTop: { display:"flex", justifyContent:"space-between", marginBottom:10 },
  artBadge: { fontSize:10, padding:"3px 10px", borderRadius:20, fontWeight:"bold", textTransform:"uppercase", letterSpacing:"0.05em" },
  cardTitle: { margin:"0 0 6px", fontSize:16, fontWeight:700 },
  cardExcerpt: { fontSize:13, color:C.textMid, lineHeight:1.55, margin:"0 0 12px" },
  empty: { textAlign:"center", padding:"60px 20px", color:C.textLight },
  artTitleBlock: { display:"flex", alignItems:"flex-start", gap:20, marginTop:15 },
  burgerLogo: { width:70, height:70, objectFit:"contain" },
  articuloBody: { padding:20, margin:16, background:"#fff", borderRadius:10, border:`1px solid ${C.border}`, lineHeight:1.7 },
  // Login / Admin
  loginBox: { background:"#fff", padding:40, borderRadius:20, width:300, textAlign:"center", boxShadow:"0 10px 25px rgba(0,0,0,0.1)" },
  input: { width:"100%", padding:12, marginBottom:10, borderRadius:8, border:"1px solid #ddd", boxSizing:"border-box", background:C.bg },
  btnBackLink: { background:"none", border:"none", color:"#999", marginTop:15, cursor:"pointer" },
  adminTopBar: { background:"#333", color:"#fff", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  tabRow: { display:"flex", background:"#fff", borderBottom:`1px solid ${C.border}` },
  tab: { flex:1, padding:14, border:"none", background:"none", color:"#999", fontSize:13, fontWeight:600 },
  tabA: { flex:1, padding:14, border:"none", background:"none", borderBottom:`3px solid ${C.red}`, fontWeight:"bold", color:C.red, fontSize:13 },
  adminRow: { background:"#fff", padding:12, borderRadius:8, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center", border:`1px solid ${C.border}` },
  btnSave: { width:"100%", padding:15, background:C.red, color:"#fff", border:"none", borderRadius:8, fontWeight:"bold", cursor:"pointer", fontSize:15 },
  btnLogout: { background:"none", border:`1px solid #666`, color:"#fff", padding:"4px 12px", borderRadius:5, fontSize:11, cursor:"pointer" },
  btnIcon: { fontSize:11, padding:6, border:"1px solid #ddd", borderRadius:4, background:"#F9F9F9", cursor:"pointer", color:C.textMid }
};
