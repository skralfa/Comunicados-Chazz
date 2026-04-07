import React, { useState, useEffect, useCallback } from "react";

// ─── Configuración Inicial ──────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025"; 
const STORAGE_COMMS  = "chazz_comms_v3";
const STORAGE_CATS   = "chazz_cats_v3";
const SESSION_KEY    = "chazz_admin_session";

const INITIAL_CATS = [
  { id: "todos", label: "Todos", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "piso", label: "Piso", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "cocina", label: "Cocina", color: "#2E7D32", colorLight: "#E8F5E9" },
  { id: "jefes", label: "Jefes", color: "#1565C0", colorLight: "#E3F2FD" }
];

const SEED_COMMS = [
  { id: "c1", titulo: "Bienvenido al nuevo Tablón", categoria: "todos", fecha: "2026-04-06", cuerpo: "Sistema oficial de comunicación Chazz.", autor: "Oscar", archivado: false }
];

// ─── Estilos (C) ─────────────────────────────────────────────────────────────
const C = { bg: "#F9F9F9", surface: "#FFFFFF", text: "#212121", border: "#E0E0E0", red: "#D32F2F" };

export default function App() {
  const [comunicados, setComunicados] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [route, setRouteState] = useState(window.location.hash.replace("#", "") || "/");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  // Cargar datos
  useEffect(() => {
    const savedComms = localStorage.getItem(STORAGE_COMMS);
    const savedCats = localStorage.getItem(STORAGE_CATS);
    setComunicados(savedComms ? JSON.parse(savedComms) : SEED_COMMS);
    setCategorias(savedCats ? JSON.parse(savedCats) : INITIAL_CATS);
  }, []);

  // Guardar datos
  const saveAll = (newComms, newCats) => {
    if (newComms) { setComunicados(newComms); localStorage.setItem(STORAGE_COMMS, JSON.stringify(newComms)); }
    if (newCats) { setCategorias(newCats); localStorage.setItem(STORAGE_CATS, JSON.stringify(newCats)); }
  };

  useEffect(() => {
    const h = () => setRouteState(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const handleNav = (p) => { window.location.hash = p; setRouteState(p); window.scrollTo(0, 0); };

  if (!comunicados || !categorias) return <div style={{padding:20, textAlign:"center"}}>Cargando sistema Chazz...</div>;

  const CAT_MAP = Object.fromEntries(categorias.map(c => [c.id, c]));

  // ─── Vistas ────────────────────────────────────────────────────────────────
  
  // 1. HUB (Menú Principal - Solo para ti o acceso inicial)
  if (route === "/" || route === "") {
    return (
      <div style={S.view}>
        <div style={S.header}><img src="/logo.png" alt="Chazz" style={{width:120}} onError={e=>e.target.style.display="none"}/></div>
        <div style={{padding:20, textAlign:"center"}}>
           <h2 style={{color:C.red}}>Tablón de Comunicados</h2>
           <p style={{fontSize:14, color:"#666"}}>Selecciona un área para ingresar</p>
        </div>
        <div style={S.grid}>
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => handleNav("/" + cat.id)} style={{...S.cardCat, borderTop:`5px solid ${cat.color}`}}>
              <strong style={{color:cat.color, fontSize:18}}>{cat.label}</strong>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center", marginTop:40}}>
           <button onClick={() => handleNav("/login")} style={S.btnAdmin}>Acceso Administrativo</button>
        </div>
      </div>
    );
  }

  // 2. LOGIN
  if (route === "/login") {
    return (
      <div style={{...S.view, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div style={S.loginBox}>
          <img src="/logo.png" alt="Chazz" style={{width:80, marginBottom:20}}/>
          <input type="password" placeholder="Contraseña Admin" style={S.input} onKeyDown={e => {
            if(e.key === 'Enter' && e.target.value === ADMIN_PASSWORD) {
              setIsAdmin(true); sessionStorage.setItem(SESSION_KEY, "1"); handleNav("/admin");
            }
          }}/>
          <button onClick={() => handleNav("/")} style={{background:"none", border:"none", color:"#999", marginTop:15, cursor:"pointer"}}>Volver</button>
        </div>
      </div>
    );
  }

  // 3. ADMIN (Tu Panel de Control)
  if (route === "/admin") {
    if (!isAdmin) { handleNav("/login"); return null; }
    return <AdminPanel comunicados={comunicados} categorias={categorias} saveAll={saveAll} onLogout={() => {setIsAdmin(false); sessionStorage.removeItem(SESSION_KEY); handleNav("/");}} />;
  }

  // 4. LISTA POR ÁREA (Lo que ve el empleado)
  if (CAT_MAP[route.replace("/", "")]) {
    const catId = route.replace("/", "");
    const cat = CAT_MAP[catId];
    // Filtro: Ven lo de su área y lo de "todos"
    const filtrados = comunicados.filter(c => !c.archivado && (c.categoria === catId || c.categoria === "todos")).sort((a,b)=>b.fecha.localeCompare(a.fecha));

    return (
      <div style={S.view}>
        <div style={{...S.areaHeader, borderBottom:`4px solid ${cat.color}`}}>
          <img src="/logo.png" alt="Chazz" style={{width:60}}/>
          <h2 style={{margin:0, color:cat.color}}>{cat.label}</h2>
          {isAdmin && <button onClick={()=>handleNav("/")} style={S.backBtn}>Menú</button>}
        </div>
        <div style={{padding:15}}>
          {filtrados.length === 0 ? <p style={{textAlign:"center", color:"#999", marginTop:40}}>No hay avisos nuevos por ahora.</p> : 
            filtrados.map(c => (
              <div key={c.id} onClick={() => handleNav("/ver/" + c.id)} style={{...S.postCard, borderLeft:`4px solid ${cat.color}`}}>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:"#999", marginBottom:5}}>
                  <span>{c.categoria.toUpperCase()}</span>
                  <span>{c.fecha}</span>
                </div>
                <h3 style={{margin:0}}>{c.titulo}</h3>
                <p style={{fontSize:13, color:"#666", marginTop:5}}>{c.cuerpo.slice(0,60)}...</p>
              </div>
            ))
          }
        </div>
      </div>
    );
  }

  // 5. VER COMUNICADO INDIVIDUAL
  if (route.startsWith("/ver/")) {
    const id = route.replace("/ver/", "");
    const comm = comunicados.find(c => c.id === id);
    if (!comm) return <div>No encontrado</div>;
    const cat = CAT_MAP[comm.categoria] || {color: C.red};

    return (
      <div style={S.view}>
        <div style={{padding:20, background:"#fff", borderBottom:`3px solid ${cat.color}`}}>
           {(!isAdmin && !["todos", "cocina", "piso"].includes(comm.categoria)) ? null : <button onClick={()=>window.history.back()} style={S.backBtn}>← Volver</button>}
           <h1 style={{fontSize:24, marginTop:15}}>{comm.titulo}</h1>
           <p style={{fontSize:12, color:"#999"}}>Publicado: {comm.fecha} por {comm.autor}</p>
        </div>
        <div style={{padding:20, background:"#fff", margin:15, borderRadius:10, lineHeight:1.6, whiteSpace:"pre-wrap"}}>
           {comm.cuerpo}
        </div>
      </div>
    );
  }

  return <div style={{padding:20}}>Ruta no válida. <button onClick={()=>handleNav("/")}>Ir al inicio</button></div>;
}

// ─── PANEL ADMIN (SUB-COMPONENTE) ──────────────────────────────────────────
function AdminPanel({ comunicados, categorias, saveAll, onLogout }) {
  const [tab, setTab] = useState("comms");
  const [nuevo, setNuevo] = useState({ titulo:"", cuerpo:"", categoria:"todos", autor:"Oscar" });

  const addComm = () => {
    if(!nuevo.titulo || !nuevo.cuerpo) return alert("Llena los campos");
    const item = { ...nuevo, id: "c"+Date.now(), fecha: new Date().toISOString().split('T')[0], archivado:false };
    saveAll([item, ...comunicados], null);
    setNuevo({ titulo:"", cuerpo:"", categoria:"todos", autor:"Oscar" });
    setTab("comms");
  };

  const addCat = () => {
    const name = prompt("Nombre de la nueva área (ej: Limpieza):");
    if(name) {
      const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
      const color = prompt("Color Hexadecimal (ej: #FF5733):", "#D32F2F");
      saveAll(null, [...categorias, { id, label: name, color, colorLight: color+"22" }]);
    }
  };

  return (
    <div style={S.view}>
      <div style={S.adminHeader}>
        <strong>ADMIN CHAZZ</strong>
        <button onClick={onLogout} style={S.btnLogout}>Salir</button>
      </div>
      <div style={S.tabRow}>
        <button onClick={()=>setTab("comms")} style={tab==="comms"?S.tabA:S.tab}>Comunicados</button>
        <button onClick={()=>setTab("nuevo")} style={tab==="nuevo"?S.tabA:S.tab}>+ Redactar</button>
        <button onClick={()=>setTab("cats")} style={tab==="cats"?S.tabA:S.tab}>Áreas</button>
      </div>

      {tab === "nuevo" && (
        <div style={{padding:20}}>
          <input style={S.input} placeholder="Título" value={nuevo.titulo} onChange={e=>setNuevo({...nuevo, titulo:e.target.value})} />
          <select style={S.input} value={nuevo.categoria} onChange={e=>setNuevo({...nuevo, categoria:e.target.value})}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <textarea style={{...S.input, height:150}} placeholder="Mensaje..." value={nuevo.cuerpo} onChange={e=>setNuevo({...nuevo, cuerpo:e.target.value})} />
          <button style={S.btnSave} onClick={addComm}>Publicar Ahora</button>
        </div>
      )}

      {tab === "comms" && (
        <div style={{padding:15}}>
          {comunicados.map(c => (
            <div key={c.id} style={S.adminItem}>
              <div><strong>{c.titulo}</strong><br/><small>{c.categoria} | {c.fecha}</small></div>
              <div style={{display:"flex", gap:5}}>
                <button onClick={() => saveAll(comunicados.map(x=>x.id===c.id?{...x, archivado:!x.archivado}:x), null)} style={S.btnIcon}>{c.archivado?"Restaurar":"Archivar"}</button>
                <button onClick={() => { if(window.confirm("¿Borrar?")) saveAll(comunicados.filter(x=>x.id!==c.id), null) }} style={{...S.btnIcon, color:"red"}}>Borrar</button>
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
              <div key={c.id} style={S.adminItem}>
                <span>{c.label} <small>({c.id})</small></span>
                {c.id !== "todos" && <button onClick={()=>saveAll(null, categorias.filter(x=>x.id!==c.id))} style={{color:"red", border:"none", background:"none"}}>Eliminar</button>}
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
  header: { padding:30, textAlign:"center", background:"#fff" },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, padding:20 },
  cardCat: { background:"#fff", padding:25, borderRadius:15, border:"1px solid #eee", cursor:"pointer", textAlign:"center", boxShadow:"0 4px 6px rgba(0,0,0,0.05)" },
  areaHeader: { background:"#fff", padding:15, display:"flex", alignItems:"center", justifyContent:"space-between" },
  postCard: { background:"#fff", padding:15, borderRadius:10, marginBottom:12, cursor:"pointer", boxShadow:"0 2px 4px rgba(0,0,0,0.02)" },
  loginBox: { background:"#fff", padding:40, borderRadius:20, width:300, textAlign:"center", boxShadow:"0 10px 25px rgba(0,0,0,0.1)" },
  input: { width:"100%", padding:12, marginBottom:10, borderRadius:8, border:"1px solid #ddd", boxSizing:"border-box", background:C.bg },
  adminHeader: { background:"#333", color:"#fff", padding:15, display:"flex", justifyContent:"space-between" },
  tabRow: { display:"flex", background:"#fff", borderBottom:"1px solid #ddd" },
  tab: { flex:1, padding:12, border:"none", background:"none", color:"#999" },
  tabA: { flex:1, padding:12, border:"none", background:"none", borderBottom:`3px solid ${C.red}`, fontWeight:"bold", color:C.red },
  adminItem: { background:"#fff", padding:12, borderRadius:8, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #eee" },
  btnSave: { width:"100%", padding:15, background:C.red, color:"#fff", border:"none", borderRadius:8, fontWeight:"bold", cursor:"pointer" },
  btnAdmin: { background:"none", border:"1px solid #ccc", color:"#999", padding:"8px 20px", borderRadius:20, fontSize:12, cursor:"pointer" },
  btnLogout: { background:"none", border:"1px solid #666", color:"#fff", padding:"4px 10px", borderRadius:5, fontSize:11 },
  btnIcon: { fontSize:11, padding:5, border:"1px solid #ddd", borderRadius:4, background:"#f9f9f9", cursor:"pointer" },
  backBtn: { background:"#eee", border:"none", padding:"5px 10px", borderRadius:5, fontSize:12, cursor:"pointer" }
};
