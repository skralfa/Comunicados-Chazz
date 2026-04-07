import React, { useState, useEffect } from "react";

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025"; 
const STORAGE_COMMS  = "chazz_comms_v3";
const STORAGE_CATS   = "chazz_cats_v3";
const SESSION_KEY    = "chazz_admin_session";

const C = { bg: "#F4F4F4", surface: "#FFFFFF", text: "#212121", border: "#DDD", red: "#D32F2F" };

const INITIAL_CATS = [
  { id: "todos", label: "Todos", emoji: "📋", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "piso", label: "Piso", emoji: "🍽️", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "cocina", label: "Cocina", emoji: "👨‍🍳", color: "#2E7D32", colorLight: "#E8F5E9" },
  { id: "jefes", label: "Jefes", emoji: "👔", color: "#1565C0", colorLight: "#E3F2FD" }
];

export default function App() {
  const [comunicados, setComunicados] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [route, setRoute] = useState(window.location.hash || "#/");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  useEffect(() => {
    const savedComms = localStorage.getItem(STORAGE_COMMS);
    const savedCats = localStorage.getItem(STORAGE_CATS);
    setComunicados(savedComms ? JSON.parse(savedComms) : []);
    setCategorias(savedCats ? JSON.parse(savedCats) : INITIAL_CATS);

    const handleHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  if (!comunicados || !categorias) return null;

  const navigate = (path) => { window.location.hash = path; };
  const currentPath = route.replace("#", "");

  const saveData = (newComms, newCats) => {
    if(newComms) { setComunicados(newComms); localStorage.setItem(STORAGE_COMMS, JSON.stringify(newComms)); }
    if(newCats) { setCategorias(newCats); localStorage.setItem(STORAGE_CATS, JSON.stringify(newCats)); }
  };

  // HEADER GLOBAL
  const HeaderGlobal = ({ titulo, color, showBack = true }) => (
    <div style={{...S.globalHeader, borderBottom: `4px solid ${color || C.red}`}}>
      <div style={S.headerLeft}>
        {showBack && isAdmin && <button onClick={() => navigate("/")} style={S.btnBack}>Menú</button>}
        <h2 style={{margin:0, color: color || C.red, fontSize: 22}}>{titulo}</h2>
      </div>
      <div style={S.headerRight}>
        <span style={S.chazzText}>CHAZZ</span>
        <img src="/burger.png" style={S.burgerIcon} alt="Mascota" onError={e=>e.target.style.opacity=0}/>
      </div>
    </div>
  );

  // VISTAS
  if (currentPath === "/admin") {
    if (!isAdmin) { navigate("/login"); return null; }
    return <AdminPanel comunicados={comunicados} categorias={categorias} onSave={saveData} onLogout={() => { setIsAdmin(false); sessionStorage.removeItem(SESSION_KEY); navigate("/"); }} />;
  }

  if (currentPath === "/login") {
    return (
      <div style={S.centerView}>
        <div style={S.loginBox}>
          <img src="/logo.png" style={{width:100, marginBottom:20}} alt="Logo" />
          <input type="password" placeholder="Contraseña" style={S.input} autoFocus onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value === ADMIN_PASSWORD) {
              setIsAdmin(true); sessionStorage.setItem(SESSION_KEY, "1"); navigate("/admin");
            }
          }} />
          <button onClick={() => navigate("/")} style={S.btnText}>Cancelar</button>
        </div>
      </div>
    );
  }

  if (currentPath.startsWith("/ver/")) {
    const id = currentPath.split("/ver/")[1];
    const item = comunicados.find(c => c.id === id);
    if (!item) return <div style={S.centerView}>No encontrado. <button onClick={() => navigate("/")}>Volver</button></div>;
    const cat = categorias.find(cat => cat.id === item.categoria) || categorias[0];
    return (
      <div style={S.view}>
        <HeaderGlobal titulo={cat.label} color={cat.color} />
        <div style={S.artContainer}>
          <div style={S.artMeta}>
            <span style={{...S.badge, background: cat.colorLight, color: cat.color}}>{cat.label}</span>
            <span style={{fontSize:12, color:"#999"}}>{item.fecha}</span>
          </div>
          <h1 style={S.artTitle}>{item.titulo}</h1>
          <div style={S.divider} />
          <div style={S.artBody}>{item.cuerpo}</div>
          <p style={S.artAutor}>Publicado por: <strong>{item.autor}</strong></p>
        </div>
      </div>
    );
  }

  const catActual = categorias.find(c => "/" + c.id === currentPath);
  if (catActual) {
    const filtrados = comunicados.filter(c => !c.archivado && (c.categoria === catActual.id || c.categoria === "todos"));
    return (
      <div style={S.view}>
        <HeaderGlobal titulo={catActual.label} color={catActual.color} />
        <div style={{padding: 15}}>
          {filtrados.map(c => (
            <div key={c.id} onClick={() => navigate("/ver/" + c.id)} style={{...S.cardMsg, borderLeft: `5px solid ${catActual.color}`}}>
               <div style={{display:"flex", gap:10, marginBottom:8}}>
                  <span style={{...S.badge, fontSize:10, background: catActual.colorLight, color: catActual.color}}>{c.categoria.toUpperCase()}</span>
                  <span style={{fontSize:11, color:"#999"}}>{c.fecha}</span>
               </div>
              <h3 style={{margin:0, fontSize:18, fontWeight: "bold"}}>{c.titulo}</h3>
              <p style={{fontSize:13, color:"#666", marginTop:8}}>{c.cuerpo.slice(0,80)}...</p>
            </div>
          ))}
          {filtrados.length === 0 && <p style={S.empty}>No hay comunicados activos.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={S.view}>
      <div style={S.hero}>
        <img src="/logo.png" style={{width:130}} alt="Logo" />
        <h1 style={{color:C.red, margin:"15px 0 5px", fontSize:28, fontWeight:800}}>Comunicados</h1>
        <div style={S.line} />
      </div>
      <div style={S.grid}>
        {categorias.map(cat => (
          <button key={cat.id} onClick={() => navigate("/" + cat.id)} style={{...S.cardCat, borderTop: `5px solid ${cat.color}`}}>
            <div style={{...S.iconBox, background: cat.colorLight}}>{cat.emoji}</div>
            <strong style={{color:cat.color, fontSize:18}}>{cat.label}</strong>
          </button>
        ))}
      </div>
      <div style={{textAlign:"center", marginTop:30}}>
        <button onClick={() => navigate("/login")} style={S.btnAdmin}>⚙ Panel Control</button>
      </div>
    </div>
  );
}

// ─── PANEL ADMIN (ACTUALIZADO) ──────────────────────────────────────────────
function AdminPanel({ comunicados, categorias, onLogout, onSave }) {
  const [tab, setTab] = useState("lista");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ titulo: "", cuerpo: "", categoria: "todos", autor: "Oscar" });

  const resetForm = () => {
    setForm({ titulo: "", cuerpo: "", categoria: "todos", autor: "Oscar" });
    setEditId(null);
    setTab("lista");
  };

  const handlePublicar = () => {
    if(!form.titulo || !form.cuerpo) return alert("Llena los campos obligatorios");
    
    if(editId) {
      // Editar existente
      const actualizados = comunicados.map(c => c.id === editId ? { ...c, ...form } : c);
      onSave(actualizados, null);
      alert("Comunicado actualizado");
    } else {
      // Crear nuevo
      const nuevo = { ...form, id: Date.now().toString(), fecha: new Date().toLocaleDateString(), archivado: false };
      onSave([nuevo, ...comunicados], null);
      alert("Comunicado publicado");
    }
    resetForm();
  };

  const iniciarEdicion = (c) => {
    setForm({ titulo: c.titulo, cuerpo: c.cuerpo, categoria: c.categoria, autor: c.autor });
    setEditId(c.id);
    setTab("nuevo");
  };

  return (
    <div style={S.view}>
      <div style={S.adminBar}>
        <strong>ADMIN CHAZZ</strong>
        <button onClick={onLogout} style={{background:"none", border:"1px solid #fff", color:"#fff", borderRadius:4, padding:"2px 8px", fontSize:11}}>Salir</button>
      </div>
      
      <div style={S.tabBar}>
        <button onClick={() => { setTab("lista"); setEditId(null); }} style={tab==="lista"?S.tabA:S.tab}>Historial</button>
        <button onClick={() => setTab("nuevo")} style={tab==="nuevo"?S.tabA:S.tab}>{editId ? "✏️ Editando" : "+ Redactar"}</button>
      </div>

      {tab === "nuevo" ? (
        <div style={{padding:20}}>
          <label style={S.adminLabel}>Título del Comunicado</label>
          <input style={S.input} value={form.titulo} onChange={e=>setForm({...form, titulo: e.target.value})} placeholder="Ej: Nueva Receta de Salsa" />
          
          <label style={S.adminLabel}>Área de destino</label>
          <select style={S.input} value={form.categoria} onChange={e=>setForm({...form, categoria: e.target.value})}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          
          <label style={S.adminLabel}>Mensaje</label>
          <textarea style={{...S.input, height:150}} value={form.cuerpo} onChange={e=>setForm({...form, cuerpo: e.target.value})} placeholder="Escribe aquí los detalles..." />
          
          <label style={S.adminLabel}>Autor</label>
          <input style={S.input} value={form.autor} onChange={e=>setForm({...form, autor: e.target.value})} />
          
          <button onClick={handlePublicar} style={S.btnPub}>{editId ? "Guardar Cambios" : "Publicar Ahora"}</button>
          {editId && <button onClick={resetForm} style={{...S.btnText, width:"100%", marginTop:10}}>Cancelar Edición</button>}
        </div>
      ) : (
        <div style={{padding:15}}>
          {comunicados.length === 0 && <p style={S.empty}>No hay comunicados registrados.</p>}
          {comunicados.map(c => (
            <div key={c.id} style={{...S.adminRow, opacity: c.archivado ? 0.6 : 1}}>
              <div style={{flex:1}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <strong style={{fontSize:15}}>{c.titulo}</strong>
                  {c.archivado && <span style={{fontSize:10, background:"#eee", padding:"2px 5px", borderRadius:4}}>ARCHIVADO</span>}
                </div>
                <small style={{color:"#888"}}>{c.categoria.toUpperCase()} — {c.fecha}</small>
              </div>
              <div style={{display:"flex", gap:12}}>
                <button onClick={() => iniciarEdicion(c)} title="Editar" style={S.btnAction}>✏️</button>
                <button onClick={() => onSave(comunicados.map(x => x.id === c.id ? {...x, archivado: !x.archivado} : x), null)} title="Archivar" style={S.btnAction}>
                  {c.archivado ? "📤" : "📦"}
                </button>
                <button onClick={() => { if(window.confirm("¿Borrar permanentemente?")) onSave(comunicados.filter(x => x.id !== c.id), null) }} title="Eliminar" style={{...S.btnAction, color:"red"}}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ESTILOS (S) ────────────────────────────────────────────────────────────
const S = {
  view: { minHeight:"100vh", background: "#f4f4f4", fontFamily: "Arial, sans-serif", maxWidth: 500, margin: "0 auto" },
  centerView: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f4f4f4" },
  globalHeader: { background: "#fff", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  chazzText: { fontSize: 28, fontWeight: 900, color: "#333", letterSpacing: "-1px" },
  burgerIcon: { width: 45, height: 45, objectFit: "contain" },
  btnBack: { background: "#666", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 13, cursor:"pointer" },
  hero: { textAlign:"center", padding:40, background:"#fff", borderBottom: "1px solid #ddd" },
  line: { width: 50, height: 4, background: "#D32F2F", margin: "10px auto", borderRadius: 2 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: 20 },
  cardCat: { background: "#fff", border: "1px solid #ddd", borderRadius: 15, padding: 25, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", textAlign:"center" },
  iconBox: { width: 50, height: 50, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 },
  cardMsg: { background: "#fff", padding: 20, borderRadius: 12, marginBottom: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor:"pointer" },
  badge: { padding: "3px 10px", borderRadius: 20, fontWeight: "bold", textTransform: "uppercase", fontSize: 11 },
  artContainer: { padding: 25, background: "#fff", margin: 15, borderRadius: 15, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
  artMeta: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:15 },
  artTitle: { fontSize:24, margin:0, fontWeight:800, color:"#222" },
  divider: { height:2, background:"#eee", margin:"20px 0" },
  artBody: { lineHeight:1.7, fontSize:16, color:"#444", whiteSpace:"pre-wrap" },
  artAutor: { marginTop:25, fontSize:13, color:"#888", borderTop:"1px solid #eee", paddingTop:15 },
  loginBox: { background: "#fff", padding: 40, borderRadius: 25, textAlign: "center", boxShadow: "0 15px 35px rgba(0,0,0,0.1)", width: "85%" },
  input: { width: "100%", padding: 14, margin: "8px 0 15px", borderRadius: 10, border: "1px solid #ddd", fontSize: 16, boxSizing: "border-box", background: "#f9f9f9" },
  adminLabel: { fontSize:12, fontWeight:"bold", color:"#666", display:"block", textAlign:"left", marginLeft:5 },
  btnPub: { width: "100%", padding: 16, background: "#D32F2F", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor:"pointer" },
  btnAdmin: { background: "none", border: "1px solid #bbb", color: "#888", padding: "10px 20px", borderRadius: 25, fontSize: 12, cursor:"pointer" },
  btnText: { background: "none", border: "none", color: "#999", cursor: "pointer" },
  adminBar: { background: "#222", color: "#fff", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBar: { display: "flex", background: "#fff", borderBottom: "1px solid #ddd" },
  tab: { flex: 1, padding: 15, border: "none", background: "none", color: "#999", fontWeight: "bold", cursor:"pointer" },
  tabA: { flex: 1, padding: 15, border: "none", background: "none", borderBottom: "4px solid #D32F2F", color: "#D32F2F", fontWeight: "bold", cursor:"pointer" },
  adminRow: { background: "#fff", padding: 15, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee", borderRadius: 8 },
  btnAction: { background:"none", border:"none", fontSize:18, cursor:"pointer", padding:5 },
  empty: { textAlign: "center", color: "#999", marginTop: 50, fontStyle: "italic" }
};
