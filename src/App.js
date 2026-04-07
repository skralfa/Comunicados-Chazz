import React, { useState, useEffect } from "react";

// ─── Configuración ──────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025"; 
const STORAGE_COMMS  = "chazz_comms_v3";
const STORAGE_CATS   = "chazz_cats_v3";
const SESSION_KEY    = "chazz_admin_session";

const C = { bg: "#F9F9F9", surface: "#FFFFFF", text: "#212121", border: "#E0E0E0", red: "#D32F2F" };

const INITIAL_CATS = [
  { id: "todos", label: "Todos", emoji: "📋", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "piso", label: "Piso", emoji: "🍽️", color: "#D32F2F", colorLight: "#FFEBEE" },
  { id: "cocina", label: "Cocina", emoji: "👨‍🍳", color: "#2E7D32", colorLight: "#E8F5E9" },
  { id: "jefes", label: "Jefes", emoji: "👔", color: "#1565C0", colorLight: "#E3F2FD" }
];

// ─── App Principal ──────────────────────────────────────────────────────────
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

  // Lógica de ruteo simple
  const currentPath = route.replace("#", "");

  // 1. VISTA ADMIN
  if (currentPath === "/admin") {
    if (!isAdmin) { navigate("/login"); return null; }
    return <AdminPanel 
              comunicados={comunicados} 
              categorias={categorias} 
              onLogout={() => { setIsAdmin(false); sessionStorage.removeItem(SESSION_KEY); navigate("/"); }}
              onSave={(newComms, newCats) => {
                if(newComms) { setComunicados(newComms); localStorage.setItem(STORAGE_COMMS, JSON.stringify(newComms)); }
                if(newCats) { setCategorias(newCats); localStorage.setItem(STORAGE_CATS, JSON.stringify(newCats)); }
              }}
            />;
  }

  // 2. VISTA LOGIN
  if (currentPath === "/login") {
    return (
      <div style={S.centerView}>
        <div style={S.loginBox}>
          <img src="/logo.png" style={{width:80}} alt="Logo" />
          <input type="password" placeholder="Password" style={S.input} autoFocus onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value === ADMIN_PASSWORD) {
              setIsAdmin(true); sessionStorage.setItem(SESSION_KEY, "1"); navigate("/admin");
            }
          }} />
          <button onClick={() => navigate("/")} style={S.btnText}>Cancelar</button>
        </div>
      </div>
    );
  }

  // 3. VISTA VER COMUNICADO
  if (currentPath.startsWith("/ver/")) {
    const id = currentPath.split("/ver/")[1];
    const item = comunicados.find(c => c.id === id);
    if (!item) return <div style={S.centerView}>No encontrado. <button onClick={() => navigate("/")}>Volver</button></div>;
    const cat = categorias.find(cat => cat.id === item.categoria) || categorias[0];

    return (
      <div style={S.view}>
        <div style={{...S.headerArt, borderBottom: `4px solid ${cat.color}`}}>
          {isAdmin && <button onClick={() => window.history.back()} style={S.btnBack}>← Volver</button>}
          <div style={S.artBrand}>
            <img src="/burger.png" style={S.burgerLogo} alt="Mascot" />
            <div>
              <span style={{...S.badge, background: cat.colorLight, color: cat.color}}>{cat.label}</span>
              <h1 style={S.artTitle}>{item.titulo}</h1>
            </div>
          </div>
        </div>
        <div style={S.artContent}>{item.cuerpo}</div>
      </div>
    );
  }

  // 4. VISTA CATEGORÍA ESPECÍFICA (Lo que abre al dar click)
  const catActual = categorias.find(c => "/" + c.id === currentPath);
  if (catActual) {
    const filtrados = comunicados.filter(c => !c.archivado && (c.categoria === catActual.id || c.categoria === "todos"));
    return (
      <div style={S.view}>
        <div style={{...S.headerCat, borderBottom: `4px solid ${catActual.color}`}}>
          {isAdmin && <button onClick={() => navigate("/")} style={S.btnBack}>Menú</button>}
          <img src="/logo.png" style={{width:60}} alt="Logo" />
          <h2 style={{color: catActual.color}}>{catActual.label}</h2>
        </div>
        <div style={{padding: 15}}>
          {filtrados.map(c => (
            <div key={c.id} onClick={() => navigate("/ver/" + c.id)} style={{...S.cardMsg, borderLeft: `4px solid ${catActual.color}`}}>
              <h3 style={{margin:0, fontSize:16}}>{c.titulo}</h3>
              <p style={{fontSize:12, color:"#666", marginTop:5}}>{c.cuerpo.slice(0,60)}...</p>
            </div>
          ))}
          {filtrados.length === 0 && <p style={S.empty}>No hay comunicados.</p>}
        </div>
      </div>
    );
  }

  // 5. HOME (PANTALLA PRINCIPAL)
  return (
    <div style={S.view}>
      <div style={S.hero}>
        <img src="/logo.png" style={{width:100}} alt="Logo" />
        <h1 style={{color:C.red, margin:"15px 0 5px"}}>Comunicados Chazz</h1>
        <p style={{color:"#666", fontSize:14}}>Selecciona tu área</p>
        <div style={S.line} />
      </div>
      <div style={S.grid}>
        {categorias.map(cat => (
          <button key={cat.id} onClick={() => navigate("/" + cat.id)} style={{...S.cardCat, borderTop: `4px solid ${cat.color}`}}>
            <div style={{...S.iconBox, background: cat.colorLight}}>{cat.emoji}</div>
            <strong style={{color:cat.color}}>{cat.label}</strong>
          </button>
        ))}
      </div>
      <div style={{textAlign:"center", marginTop:20}}>
        <button onClick={() => navigate("/login")} style={S.btnAdmin}>⚙ Acceso Admin</button>
      </div>
    </div>
  );
}

// ─── Panel Admin ────────────────────────────────────────────────────────────
function AdminPanel({ comunicados, categorias, onLogout, onSave }) {
  const [tab, setTab] = useState("nuevo");
  const [form, setForm] = useState({ titulo: "", cuerpo: "", categoria: "todos" });

  const publicar = () => {
    if(!form.titulo || !form.cuerpo) return alert("Completa los datos");
    const nuevo = { ...form, id: Date.now().toString(), fecha: new Date().toLocaleDateString(), archivado: false, autor: "Admin" };
    onSave([nuevo, ...comunicados], null);
    setForm({ titulo: "", cuerpo: "", categoria: "todos" });
    setTab("lista");
  };

  return (
    <div style={S.view}>
      <div style={S.adminBar}>
        <strong>ADMIN PANEL</strong>
        <button onClick={onLogout} style={S.btnAdmin}>Salir</button>
      </div>
      <div style={S.tabBar}>
        <button onClick={() => setTab("nuevo")} style={tab==="nuevo"?S.tabA:S.tab}>Nuevo</button>
        <button onClick={() => setTab("lista")} style={tab==="lista"?S.tabA:S.tab}>Lista</button>
      </div>
      {tab === "nuevo" ? (
        <div style={{padding:20}}>
          <input style={S.input} placeholder="Título" value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} />
          <select style={S.input} value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <textarea style={{...S.input, height:150}} placeholder="Mensaje..." value={form.cuerpo} onChange={e=>setForm({...form, cuerpo:e.target.value})} />
          <button onClick={publicar} style={S.btnPub}>Publicar</button>
        </div>
      ) : (
        <div style={{padding:15}}>
          {comunicados.map(c => (
            <div key={c.id} style={S.adminRow}>
              <span>{c.titulo}</span>
              <button onClick={() => onSave(comunicados.filter(x => x.id !== c.id))} style={{color:"red", border:"none", background:"none"}}>Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const S = {
  view: { minHeight:"100vh", background: "#f9f9f9", fontFamily: "Arial, sans-serif", maxWidth: 500, margin: "0 auto" },
  centerView: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f9" },
  hero: { textAlign:"center", padding:30, background:"#fff", borderBottom: "1px solid #eee" },
  line: { width: 40, height: 3, background: "#D32F2F", margin: "10px auto", borderRadius: 2 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, padding: 20 },
  cardCat: { background: "#fff", border: "1px solid #eee", borderRadius: 15, padding: 20, cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" },
  iconBox: { width: 45, height: 45, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 20 },
  headerCat: { background: "#fff", padding: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 15 },
  headerArt: { background: "#fff", padding: 20 },
  artBrand: { display: "flex", gap: 15, alignItems: "flex-start", marginTop: 10 },
  burgerLogo: { width: 60 },
  artTitle: { fontSize: 20, margin: 0 },
  artContent: { padding: 20, lineHeight: 1.6, background: "#fff", margin: 15, borderRadius: 10, border: "1px solid #eee" },
  badge: { fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: "bold", textTransform: "uppercase" },
  cardMsg: { background: "#fff", padding: 15, borderRadius: 10, marginBottom: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  btnBack: { position: "absolute", left: 10, background: "#eee", border: "none", padding: "5px 10px", borderRadius: 5, fontSize: 11 },
  loginBox: { background: "#fff", padding: 40, borderRadius: 20, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  input: { width: "100%", padding: 12, margin: "15px 0", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" },
  btnAdmin: { background: "none", border: "1px solid #ccc", color: "#999", padding: "8px 15px", borderRadius: 20, fontSize: 11 },
  adminBar: { background: "#333", color: "#fff", padding: 15, display: "flex", justifyContent: "space-between" },
  tabBar: { display: "flex", background: "#fff", borderBottom: "1px solid #eee" },
  tab: { flex: 1, padding: 15, border: "none", background: "none", color: "#999" },
  tabA: { flex: 1, padding: 15, border: "none", background: "none", borderBottom: "3px solid #D32F2F", color: "#D32F2F", fontWeight: "bold" },
  btnPub: { width: "100%", padding: 15, background: "#D32F2F", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold" },
  adminRow: { background: "#fff", padding: 15, marginBottom: 5, display: "flex", justifyContent: "space-between" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 }
};
    
