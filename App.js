import { useState, useEffect, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "chazz2025";          // ← Cambia esto
const STORAGE_KEY    = "chazz_comunicados_v2";
const SESSION_KEY    = "chazz_admin_session";
const LOGO_URL       = "URL_DEL_LOGO";       // ← Pega aquí el link de tu imagen

// ─── Paleta Chazz ─────────────────────────────────────────────────────────────
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

// ─── Storage ──────────────────────────────────────────────────────────────────
async function loadComunicados() {
  try { const r = await window.storage.get(STORAGE_KEY, true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveComunicados(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); }
  catch (e) { console.error(e); }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
const SEED = [
  { id:"c001", titulo:"Cambio de horario semana 15", categoria:"todos", fecha:"2025-04-06",
    cuerpo:"A partir del lunes 14 de abril los turnos de apertura se recorren 30 minutos. Favor de confirmar recepción con su jefe inmediato.", autor:"Oscar", archivado:false },
  { id:"c002", titulo:"Nuevo procedimiento de mise en place", categoria:"cocina", fecha:"2025-04-05",
    cuerpo:"Se actualizó el checklist de mise en place para incluir los nuevos platillos de temporada. Consúltenlo en el folder de cocina.", autor:"Oscar", archivado:false },
  { id:"c003", titulo:"Protocolo de bienvenida al cliente", categoria:"piso", fecha:"2025-04-04",
    cuerpo:"Recordatorio: el saludo estándar se actualizó. Revisar manual de servicio sección 3. Obligatorio para todo el equipo de piso.", autor:"Oscar", archivado:false },
  { id:"c004", titulo:"Reunión de resultados Q1", categoria:"jefes", fecha:"2025-04-03",
    cuerpo:"El jueves 10 de abril a las 10am tenemos revisión de resultados del primer trimestre. Asistencia obligatoria. Traer sus reportes.", autor:"Oscar", archivado:false },
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

// ─── Logo Component ───────────────────────────────────────────────────────────
function Logo({ size = "lg" }) {
  const sizes = { lg: { img: 120, mt: 0 }, sm: { img: 56, mt: 0 } };
  const s = sizes[size] || sizes.lg;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop: s.mt }}>
      <img
        src={LOGO_URL}
        alt="Chazz LV"
        style={{ width: s.img, objectFit:"contain" }}
        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
      />
      {/* Fallback si la URL no está configurada */}
      <div style={{ display:"none", flexDirection:"column", alignItems:"center" }}>
        <div style={{ width: s.img, height: s.img * 0.55, background: C.red, borderRadius:8,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize: s.img * 0.28, fontFamily:"Arial,sans-serif", letterSpacing:"-1px" }}>
            Chazz
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Share Button (solo admin) ────────────────────────────────────────────────
function ShareBtn({ path, label }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href.split("#")[0] + "#" + path;
  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  }
  return (
    <button onClick={copy} style={S.shareBtn}>
      {copied ? "✓ Copiado" : `🔗 ${label}`}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ catId }) {
  const cat = CAT_MAP[catId];
  return (
    <span style={{ ...S.badge, background: cat?.colorLight, color: cat?.color, border: `1px solid ${cat?.color}44` }}>
      {cat?.label ?? catId}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ComunicadoCard({ c, onClick }) {
  const cat = CAT_MAP[c.categoria];
  return (
    <div onClick={() => onClick?.(c.id)}
      style={{ ...S.card, borderLeft:`4px solid ${cat?.color}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={S.cardTop}>
        <Badge catId={c.categoria} />
        <span style={S.cardDate}>{fmtDate(c.fecha)}</span>
      </div>
      <h3 style={S.cardTitle}>{c.titulo}</h3>
      <p style={S.cardExcerpt}>{c.cuerpo.slice(0,110)}{c.cuerpo.length > 110 ? "…" : ""}</p>
      <div style={S.cardFooter}>
        <span style={S.cardAutor}>— {c.autor}</span>
        {onClick && <span style={S.readMore}>Leer →</span>}
      </div>
    </div>
  );
}

// ─── Cabecera de sección (logo pequeño + título) ──────────────────────────────
function SectionHeader({ catId }) {
  const cat = CAT_MAP[catId];
  return (
    <div style={{ ...S.sectionHeader, borderBottom:`3px solid ${cat?.color}` }}>
      <Logo size="sm" />
      <div style={S.sectionHeaderText}>
        <p style={S.sectionLabel}>Comunicados Chazz LV</p>
        <h2 style={{ ...S.sectionTitle, color: cat?.color }}>{cat?.label}</h2>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView({ onLogin, onBack }) {
  const [pw, setPw]     = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(SESSION_KEY, "1"); onLogin(); }
    else {
      setError(true); setShake(true); setPw("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2500);
    }
  }

  return (
    <div style={S.loginWrap}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        button:hover{filter:brightness(0.93)}
      `}</style>
      <div style={{ ...S.loginBox, animation: shake ? "shake 0.4s" : "fadeUp 0.4s ease" }}>
        <Logo size="lg" />
        <p style={S.loginTitle}>Panel Administrativo</p>
        <p style={S.loginSub}>Acceso exclusivo</p>
        <div style={S.loginDivider} />
        <input
          type="password" autoFocus value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Contraseña"
          style={{ ...S.loginInput, borderColor: error ? C.red : C.border }}
        />
        {error && <p style={S.loginError}>⚠ Contraseña incorrecta</p>}
        <button onClick={attempt} style={S.loginBtn}>Ingresar al panel</button>
        <button onClick={onBack} style={S.loginBack}>← Volver al portal</button>
      </div>
    </div>
  );
}

// ─── HUB ──────────────────────────────────────────────────────────────────────
function HubView({ onNav }) {
  return (
    <div style={S.view}>
      <style>{`button:hover{filter:brightness(0.94)} .catCard:hover{box-shadow:0 4px 16px rgba(0,0,0,0.1);transform:translateY(-2px)}`}</style>
      {/* Hero */}
      <div style={S.hubHero}>
        <Logo size="lg" />
        <h1 style={S.hubTitle}>Comunicados Chazz LV</h1>
        <p style={S.hubSub}>Selecciona tu área para ver los comunicados</p>
        <div style={S.hubDivider} />
      </div>

      {/* Categorías */}
      <div style={S.catGrid}>
        {CATEGORIAS.map(cat => (
          <button key={cat.id} className="catCard" onClick={() => onNav("/"+cat.id)}
            style={{ ...S.catCard, borderTop:`4px solid ${cat.color}` }}>
            <div style={{ ...S.catIcon, background: cat.colorLight, color: cat.color }}>
              {cat.id === "todos" ? "📋" : cat.id === "piso" ? "🍽️" : cat.id === "cocina" ? "👨‍🍳" : "👔"}
            </div>
            <div style={{ ...S.catLabel, color: cat.color }}>{cat.label}</div>
            <div style={S.catDesc}>{cat.desc}</div>
          </button>
        ))}
      </div>

      <div style={S.hubFooter}>
        <button onClick={() => onNav("/login")} style={S.adminSmallBtn}>⚙ Panel Admin</button>
      </div>
    </div>
  );
}

// ─── LISTA ────────────────────────────────────────────────────────────────────
function ListaView({ comunicados, catId, onNav }) {
  const cat = CAT_MAP[catId];
  const lista = comunicados
    .filter(c => !c.archivado && (catId === "todos" || c.categoria === catId || c.categoria === "todos"))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  return (
    <div style={S.view}>
      <SectionHeader catId={catId} />
      <div style={S.listaInfo}>
        <span style={S.listaCount}>{lista.length} comunicado{lista.length !== 1 ? "s" : ""} activo{lista.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={S.lista}>
        {lista.length === 0 && (
          <div style={S.empty}>
            <div style={S.emptyIcon}>📭</div>
            <p>No hay comunicados activos para esta área.</p>
          </div>
        )}
        {lista.map(c => <ComunicadoCard key={c.id} c={c} onClick={id => onNav("/comunicado/"+id)} />)}
      </div>
    </div>
  );
}

// ─── ARTÍCULO ─────────────────────────────────────────────────────────────────
function ComunicadoView({ comunicados, id, onNav }) {
  const c = comunicados.find(x => x.id === id);
  if (!c) return <div style={S.view}><div style={S.empty}>Comunicado no encontrado.</div></div>;
  const cat = CAT_MAP[c.categoria];
  return (
    <div style={S.view}>
      {/* Cabecera con logo */}
      <div style={{ ...S.artBrand, borderBottom:`3px solid ${cat?.color}` }}>
        <Logo size="sm" />
        <span style={S.artBrandLabel}>Comunicados Chazz LV</span>
      </div>

      <article style={S.articulo}>
        <div style={S.artMeta}>
          <Badge catId={c.categoria} />
          <span style={S.artDate}>{fmtDate(c.fecha)}</span>
        </div>
        <h1 style={S.artTitle}>{c.titulo}</h1>
        <div style={{ ...S.artRule, background: cat?.color }} />
        <p style={S.artBody}>{c.cuerpo}</p>
        <div style={S.artFooter}>
          <span style={S.artAutor}>Publicado por <strong>{c.autor}</strong></span>
          {c.archivado && <span style={S.archivadoBadge}>Archivado</span>}
        </div>
      </article>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const EMPTY_FORM = { titulo:"", categoria:"todos", fecha: new Date().toISOString().split("T")[0], cuerpo:"", autor:"Oscar" };

function AdminView({ comunicados, onSave, onNav, onLogout }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [tab, setTab]           = useState("lista");
  const [filterCat, setFilterCat] = useState("todos");
  const [msg, setMsg]           = useState({ text:"", type:"ok" });
  const [confirmDel, setConfirmDel] = useState(null);

  function flash(text, type="ok") { setMsg({text,type}); setTimeout(()=>setMsg({text:"",type:"ok"}),2500); }

  function handleEdit(c) {
    setForm({ titulo:c.titulo, categoria:c.categoria, fecha:c.fecha, cuerpo:c.cuerpo, autor:c.autor });
    setEditId(c.id); setTab("form"); window.scrollTo(0,0);
  }

  function handleNew() { setForm(EMPTY_FORM); setEditId(null); setTab("form"); }

  function handleSubmit() {
    if (!form.titulo.trim() || !form.cuerpo.trim()) { flash("Título y contenido son requeridos","err"); return; }
    if (editId) {
      onSave(comunicados.map(c => c.id===editId ? {...c,...form} : c));
      flash("Comunicado actualizado correctamente");
    } else {
      onSave([{...form, id:genId(), archivado:false}, ...comunicados]);
      flash("Comunicado publicado correctamente");
    }
    setForm(EMPTY_FORM); setEditId(null); setTab("lista");
  }

  function toggleArchive(id) {
    const was = comunicados.find(c=>c.id===id)?.archivado;
    onSave(comunicados.map(c => c.id===id ? {...c,archivado:!c.archivado} : c));
    flash(was ? "Comunicado restaurado" : "Comunicado archivado");
  }

  function doDelete() {
    onSave(comunicados.filter(c=>c.id!==confirmDel));
    setConfirmDel(null); flash("Comunicado eliminado");
  }

  const lista = [...comunicados]
    .filter(c => filterCat==="todos" ? true : c.categoria===filterCat)
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const activos   = comunicados.filter(c=>!c.archivado).length;
  const archivados = comunicados.filter(c=>c.archivado).length;

  return (
    <div style={S.view}>
      <style>{`button:hover{filter:brightness(0.93)}`}</style>

      {/* Top bar */}
      <div style={S.adminTopBar}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Logo size="sm" />
          <div>
            <p style={S.adminBrandLabel}>Comunicados Chazz LV</p>
            <p style={S.adminBrandSub}>Panel Administrativo</p>
          </div>
        </div>
        <button onClick={onLogout} style={S.logoutBtn}>Cerrar sesión</button>
      </div>

      {/* Stats */}
      <div style={S.adminStats}>
        <div style={S.statBox}>
          <span style={{ ...S.statNum, color: C.green }}>{activos}</span>
          <span style={S.statLabel}>Activos</span>
        </div>
        <div style={S.statBox}>
          <span style={{ ...S.statNum, color: C.textLight }}>{archivados}</span>
          <span style={S.statLabel}>Archivados</span>
        </div>
        <div style={S.statBox}>
          <span style={{ ...S.statNum, color: C.blue }}>{comunicados.length}</span>
          <span style={S.statLabel}>Total</span>
        </div>
      </div>

      {/* Flash */}
      {msg.text && (
        <div style={{ ...S.flash, background: msg.type==="err" ? C.redLight : C.greenLight,
          color: msg.type==="err" ? C.red : C.green, border:`1px solid ${msg.type==="err" ? C.redMid : C.greenMid}` }}>
          {msg.type==="err" ? "⚠ " : "✓ "}{msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={S.tabRow}>
        <button onClick={()=>setTab("lista")} style={{...S.tab,...(tab==="lista"?S.tabActive:{})}}>
          📋 Comunicados
        </button>
        <button onClick={handleNew} style={{...S.tab,...(tab==="form"?S.tabActive:{})}}>
          {editId ? "✏ Editando" : "+ Nuevo comunicado"}
        </button>
      </div>

      {/* Links de área */}
      <div style={S.linksSection}>
        <span style={S.linksLabel}>Links por área:</span>
        <div style={S.linksRow}>
          {CATEGORIAS.map(c=>(
            <ShareBtn key={c.id} path={"/"+c.id} label={c.label} />
          ))}
        </div>
      </div>

      {/* Form */}
      {tab==="form" && (
        <div style={S.formCard}>
          {editId && <div style={S.editBanner}>✏ Estás editando un comunicado existente</div>}
          <div style={S.formRow}>
            <label style={S.label}>Título *</label>
            <input style={S.input} value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Título del comunicado" />
          </div>
          <div style={S.formRow2}>
            <div style={{flex:1}}>
              <label style={S.label}>Categoría</label>
              <select style={S.input} value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>
                {CATEGORIAS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <label style={S.label}>Fecha</label>
              <input type="date" style={S.input} value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} />
            </div>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Contenido *</label>
            <textarea style={{...S.input,minHeight:120,resize:"vertical"}} value={form.cuerpo}
              onChange={e=>setForm({...form,cuerpo:e.target.value})} placeholder="Escribe el comunicado aquí…" />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Autor</label>
            <input style={S.input} value={form.autor} onChange={e=>setForm({...form,autor:e.target.value})} />
          </div>
          <div style={S.formActions}>
            <button onClick={handleSubmit} style={S.publishBtn}>{editId ? "Guardar cambios" : "Publicar comunicado"}</button>
            <button onClick={()=>{setTab("lista");setEditId(null);setForm(EMPTY_FORM);}} style={S.cancelBtn}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista admin */}
      {tab==="lista" && (
        <>
          <div style={S.filterRow}>
            {CATEGORIAS.map(c=>(
              <button key={c.id} onClick={()=>setFilterCat(c.id)}
                style={{...S.filterBtn,...(filterCat===c.id ? {background:c.color,color:"#fff",borderColor:c.color} : {})}}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={S.adminLista}>
            {lista.length===0 && <div style={S.empty}><div style={S.emptyIcon}>📭</div><p>Sin comunicados.</p></div>}
            {lista.map(c=>{
              const cat = CAT_MAP[c.categoria];
              return (
                <div key={c.id} style={{...S.adminRow, opacity:c.archivado?.4:1, borderLeft:`4px solid ${cat?.color}`}}>
                  <div style={S.adminRowTop}>
                    <Badge catId={c.categoria} />
                    <span style={S.adminRowDate}>{fmtDate(c.fecha)}</span>
                    {c.archivado && <span style={S.archivadoBadge}>Archivado</span>}
                  </div>
                  <p style={S.adminRowTitle}>{c.titulo}</p>
                  <div style={S.adminRowActions}>
                    <ShareBtn path={"/comunicado/"+c.id} label="Copiar link" />
                    <button onClick={()=>handleEdit(c)} style={{...S.actionBtn,color:C.blue,borderColor:C.blue+"44"}}>✏ Editar</button>
                    <button onClick={()=>toggleArchive(c.id)} style={{...S.actionBtn,color:C.textMid}}>
                      {c.archivado ? "↩ Restaurar" : "📦 Archivar"}
                    </button>
                    <button onClick={()=>setConfirmDel(c.id)} style={{...S.actio
