"use client";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const G = "#00E5B0";
const T = { dark:"#020A18", card:"#0A1628", border:"rgba(255,255,255,.07)", green:G, gold:"#FFB547", blue:"#5B8EF0", red:"#FF5772", text:"#F0F4FF", muted:"#64748B" };
const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(Math.round(n)) + " FCFA";
const inputStyle: React.CSSProperties = { width:"100%", background:"#060F22", border:`1px solid ${T.border}`, borderRadius:12, color:T.text, padding:"12px 14px", fontSize:14, outline:"none", boxSizing:"border-box" };
const btnG: React.CSSProperties = { background:`linear-gradient(135deg,${G},#00A87E)`, color:"#000", border:"none", borderRadius:14, padding:"12px 22px", fontWeight:800, fontSize:14, cursor:"pointer" };
const EMOJIS = ["📦","🌾","🫙","🧼","🍬","🥛","🐟","🍎","🧴","👕","💊","🔧"];

const appCSS = `
  *{box-sizing:border-box;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px #00E5B035}50%{box-shadow:0 0 40px #00E5B060}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .page{animation:fadeUp .28s cubic-bezier(.4,0,.2,1) both}
  .fab{animation:glow 3s ease-in-out infinite}
  input::placeholder{color:#374151}
  input{caret-color:#00E5B0}
`;

interface Product { id:string; name:string; buy_price:number; sell_price:number; stock:number; min_stock:number; emoji:string; }
interface Debt { id:string; client_name:string; phone:string; total:number; paid:number; }
interface SaleItem { name:string; qty:number; price:number; }
interface Sale { id:string; label:string; total:number; profit:number; payment:string; client_name:string; created_at:string; items:SaleItem[]; disc:number; }
interface Shop { id:string; name:string; owner_name:string; plan:string; trial_ends_at:string; subscription_ends_at:string; }

// ── MICRO COMPONENTS ──────────────────────────────────────────────
function Toast({ msg, ok }: { msg:string; ok:boolean }) {
  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background: ok?"#052e16":"#450a0a", border:`1px solid ${ok?"#166534":"#991b1b"}`, borderRadius:12, padding:"12px 22px", color:ok?"#4ade80":"#f87171", fontWeight:700, fontSize:14, zIndex:9999, whiteSpace:"nowrap", pointerEvents:"none", boxShadow:"0 8px 24px rgba(0,0,0,.4)" }}>
      {ok ? "✅ " : "❌ "}{msg}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:998, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"22px 22px 18px 18px", width:"100%", maxWidth:430, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <b style={{ color:T.text, fontSize:16 }}>{title}</b>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.muted, fontSize:24, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, type="text", value, onChange, placeholder="" }: { label:string; type?:string; value:string|number; onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void; placeholder?:string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ color:T.muted, fontSize:12, fontWeight:600, display:"block", marginBottom:6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Sparkline({ data, color=G, w=130, h=38 }: { data:number[]; color?:string; w?:number; h?:number }) {
  if (!data.length) return null;
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const xs=data.map((_,i)=>(i/(data.length-1))*w);
  const ys=data.map(v=>h-((v-min)/range)*(h-4)-2);
  const pts=xs.map((x,i)=>`${x},${ys[i]}`).join(" ");
  const fill=`${xs.map((x,i)=>`${x},${ys[i]}`).join(" ")} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} style={{ overflow:"visible" }}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={fill} fill="url(#sg)"/>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="4" fill={color}/>
    </svg>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin:(shop:Shop)=>void }) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [shopName,setShopName]=useState("");
  const [ownerName,setOwnerName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleLogin=async()=>{
    setLoading(true); setError("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    if(data.user){const {data:shop}=await supabase.from("shops").select("*").eq("user_id",data.user.id).single();if(shop)onLogin(shop);}
    setLoading(false);
  };
  const handleRegister=async()=>{
    setLoading(true); setError("");
    const {data,error}=await supabase.auth.signUp({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    if(data.user){const {data:shop}=await supabase.from("shops").insert({user_id:data.user.id,name:shopName,owner_name:ownerName}).select().single();if(shop)onLogin(shop);}
    setLoading(false);
  };

  return (
    <div style={{ background:T.dark, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"system-ui,sans-serif", color:T.text }}>
      <style>{appCSS}</style>
      <div style={{ width:"100%", maxWidth:340 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ background:`linear-gradient(135deg,${G},#00A87E)`, width:56, height:56, borderRadius:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:26, color:"#000", marginBottom:14, boxShadow:`0 8px 24px ${G}40` }}>S</div>
          <div style={{ fontWeight:900, fontSize:24, color:T.text }}>Sen <span style={{ color:G }}>Business</span></div>
          <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>Gestion simple pour votre boutique</div>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:24 }}>
          <div style={{ display:"flex", gap:4, background:"#060F22", borderRadius:14, padding:4, marginBottom:20 }}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", background:mode===m?G:"transparent", color:mode===m?"#000":T.muted }}>
                {m==="login"?"Connexion":"Inscription"}
              </button>
            ))}
          </div>
          {mode==="register"&&(<><Field label="Nom de votre boutique *" placeholder="Epicerie Centrale" value={shopName} onChange={e=>setShopName(e.target.value)}/><Field label="Votre nom *" placeholder="Amadou Diallo" value={ownerName} onChange={e=>setOwnerName(e.target.value)}/></>)}
          <Field label="Email *" type="email" placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          <Field label="Mot de passe *" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
          {error&&<div style={{ background:"#450a0a", border:"1px solid #991b1b", borderRadius:10, padding:"10px 14px", marginBottom:14, color:"#f87171", fontSize:13 }}>{error}</div>}
          <button onClick={mode==="login"?handleLogin:handleRegister} style={{ ...btnG, width:"100%", padding:14, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading?"Chargement...":mode==="login"?"Se connecter":"Creer mon compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ shop, onVente }: { shop:Shop; onVente:()=>void }) {
  const [period,setPeriod]=useState("today");
  const [stats,setStats]=useState({ca:0,ventes:0,profit:0,alerts:0,panier:0});
  const [recentSales,setRecentSales]=useState<Sale[]>([]);
  const [sparkData,setSparkData]=useState<number[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      const now=new Date();
      let startDate="";
      if(period==="today") startDate=new Date(now.getFullYear(),now.getMonth(),now.getDate()).toISOString();
      else if(period==="week"){const day=now.getDay();const diff=now.getDate()-day+(day===0?-6:1);startDate=new Date(now.getFullYear(),now.getMonth(),diff).toISOString();}
      else if(period==="month") startDate=new Date(now.getFullYear(),now.getMonth(),1).toISOString();

      const [salesRes,prodsRes,allSalesRes,sparkRes]=await Promise.all([
        supabase.from("sales").select("*").eq("shop_id",shop.id).gte("created_at",startDate),
        supabase.from("products").select("*").eq("shop_id",shop.id),
        supabase.from("sales").select("*").eq("shop_id",shop.id).order("created_at",{ascending:false}).limit(5),
        supabase.from("sales").select("total,created_at").eq("shop_id",shop.id).gte("created_at",new Date(Date.now()-7*86400000).toISOString()).order("created_at",{ascending:true}),
      ]);

      const sales=salesRes.data||[];
      const products=prodsRes.data||[];
      const ca=sales.reduce((a:number,s:Sale)=>a+s.total,0);
      const ventes=sales.length;
      setStats({ca,ventes,profit:sales.reduce((a:number,s:Sale)=>a+s.profit,0),alerts:products.filter((p:Product)=>p.stock<=p.min_stock).length,panier:ventes>0?Math.round(ca/ventes):0});
      if(allSalesRes.data) setRecentSales(allSalesRes.data);

      if(sparkRes.data){
        const dayMap:Record<string,number>={};
        sparkRes.data.forEach((s:{total:number;created_at:string})=>{
          const d=new Date(s.created_at).toLocaleDateString("fr-FR");
          dayMap[d]=(dayMap[d]||0)+s.total;
        });
        setSparkData(Object.values(dayMap).slice(-7));
      }
      setLoading(false);
    };
    load();
  },[shop.id,period]);

  const PMETHODS:Record<string,{e:string;c:string}>={"Wave":{e:"💙",c:"#3B82F6"},"Cash":{e:"💵",c:G},"Orange":{e:"🟠",c:T.gold}};

  return (
    <div className="page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:13, color:T.muted }}>Bienvenue 👋</div>
          <div style={{ fontSize:22, fontWeight:900, color:T.text }}>{shop.name}</div>
        </div>
        <div style={{ background:`${G}15`, border:`1px solid ${G}30`, borderRadius:12, padding:"8px 14px", display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:G }}/>
          <span style={{ color:G, fontSize:12, fontWeight:700 }}>Plan {shop.plan==="pro"?"Pro":"Essai"}</span>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ background:"linear-gradient(135deg,#071C14 0%,#020F1F 50%,#071525 100%)", border:`1px solid ${G}20`, borderRadius:22, padding:"20px 20px 16px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-50, right:-30, width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${G}18 0%,transparent 70%)` }}/>
        <div style={{ fontSize:11, color:`${G}AA`, fontWeight:700, textTransform:"uppercase", letterSpacing:2, marginBottom:6 }}>
          {period==="today"?"CA Aujourd'hui":period==="week"?"CA Cette semaine":"CA Ce mois"}
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            {loading ? <div style={{ color:T.muted, fontSize:24, fontWeight:900 }}>...</div> : (
              <>
                <div style={{ fontSize:36, fontWeight:900, color:T.text, letterSpacing:-1.5, lineHeight:1 }}>{fmt(stats.ca).replace(" FCFA","")}</div>
                <div style={{ color:`${G}80`, fontSize:13, marginTop:5 }}>FCFA · {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
              </>
            )}
          </div>
          {sparkData.length>0 && <Sparkline data={sparkData}/>}
        </div>
        <div style={{ display:"flex", gap:0, paddingTop:14, borderTop:`1px solid ${G}15` }}>
          {[
            {l:"Benefice",v:fmt(stats.profit),c:T.gold},
            {l:"Ventes",v:`${stats.ventes}`,c:T.blue},
            {l:"Panier moy.",v:stats.panier>0?fmt(stats.panier).replace(" FCFA","")+"F":"—",c:T.text},
          ].map((s,i)=>(
            <div key={i} style={{ flex:1, textAlign:"center", borderRight:i<2?`1px solid ${G}15`:"none" }}>
              <div style={{ color:`${G}70`, fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{s.l}</div>
              <div style={{ color:s.c, fontWeight:800, fontSize:13 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Period tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:18, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:4 }}>
        {[["today","Aujourd'hui"],["week","Semaine"],["month","Mois"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:"none", fontWeight:700, fontSize:12, cursor:"pointer", background:period===k?G:"transparent", color:period===k?"#000":T.muted, transition:"all .2s" }}>{l}</button>
        ))}
      </div>

      {/* Alert banner */}
      {stats.alerts>0 && (
        <div style={{ background:"rgba(255,87,114,.08)", border:"1px solid rgba(255,87,114,.25)", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ color:T.red, fontWeight:700, fontSize:13 }}>{stats.alerts} produit{stats.alerts>1?"s":""} en alerte stock</div>
            <div style={{ color:"rgba(255,87,114,.6)", fontSize:12, marginTop:2 }}>Verifiez vos stocks avant de perdre des ventes</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display:"flex", gap:10, marginBottom:18 }}>
        {[
          {e:"⚡",l:"Vente rapide",c:G,bg:`${G}12`,b:`${G}25`,action:onVente},
          {e:"📦",l:"Produit",c:T.blue,bg:`${T.blue}12`,b:`${T.blue}25`},
          {e:"💸",l:"Dette",c:T.gold,bg:`${T.gold}12`,b:`${T.gold}25`},
        ].map((a,i)=>(
          <button key={i} onClick={a.action} style={{ flex:1, background:a.bg, border:`1px solid ${a.b}`, borderRadius:16, padding:"14px 6px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:22 }}>{a.e}</span>
            <span style={{ color:a.c, fontWeight:700, fontSize:12 }}>{a.l}</span>
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          {e:"🛒",l:"Ventes",v:`${stats.ventes}`,sub:"transactions",c:T.blue},
          {e:"⚠️",l:"Stock alerte",v:`${stats.alerts}`,sub:"produits",c:T.red},
          {e:"✨",l:"Benefice",v:fmt(stats.profit).replace(" FCFA",""),sub:"FCFA",c:T.gold},
          {e:"🧾",l:"Panier moyen",v:stats.panier>0?fmt(stats.panier).replace(" FCFA",""):"—",sub:"FCFA",c:G},
        ].map((s,i)=>(
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:16, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", bottom:-12, right:-12, width:50, height:50, borderRadius:"50%", background:s.c, opacity:.07 }}/>
            <div style={{ fontSize:22, marginBottom:10 }}>{s.e}</div>
            <div style={{ color:T.muted, fontSize:11, letterSpacing:.5, marginBottom:4 }}>{s.l}</div>
            <div style={{ color:T.text, fontWeight:900, fontSize:20 }}>{s.v}</div>
            <div style={{ color:s.c, fontSize:11, marginTop:2, fontWeight:600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent sales */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:18 }}>
        <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:16 }}>Dernieres ventes</div>
        {recentSales.map((s,i)=>{
          const pm=PMETHODS[s.payment]||{e:"💰",c:T.muted};
          return (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderTop:i>0?`1px solid ${T.border}`:"none" }}>
              <div style={{ width:40, height:40, borderRadius:13, background:`${G}12`, border:`1px solid ${G}20`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:G, fontSize:15, flexShrink:0 }}>
                {(s.client_name||s.label).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{s.label}</div>
                <div style={{ color:T.muted, fontSize:12, marginTop:2 }}>{new Date(s.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ color:G, fontWeight:800, fontSize:13 }}>{fmt(s.total)}</div>
                <div style={{ background:`${pm.c}18`, borderRadius:99, padding:"2px 8px", marginTop:3, display:"inline-block" }}>
                  <span style={{ color:pm.c, fontSize:11, fontWeight:600 }}>{pm.e} {s.payment}</span>
                </div>
              </div>
            </div>
          );
        })}
        {recentSales.length===0&&!loading&&<p style={{ color:T.muted, textAlign:"center", padding:20, fontSize:13 }}>Aucune vente encore</p>}
        {loading&&<p style={{ color:T.muted, textAlign:"center", padding:20 }}>Chargement...</p>}
      </div>
    </div>
  );
}

// ── PRODUITS ──────────────────────────────────────────────────────
function Produits({ shop, showToast }: { shop:Shop; showToast:(m:string,ok?:boolean)=>void }) {
  const [products,setProducts]=useState<Product[]>([]);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [emoji,setEmoji]=useState("📦");
  const [f,setF]=useState({name:"",buy:"",sell:"",stock:"",min:"5"});
  const [filter,setFilter]=useState("all");

  useEffect(()=>{
    supabase.from("products").select("*").eq("shop_id",shop.id).then(({data})=>{if(data)setProducts(data);});
  },[shop.id]);

  const filtered=products.filter(p=>{
    const matchSearch=p.name.toLowerCase().includes(search.toLowerCase());
    if(filter==="alert") return matchSearch&&p.stock<=p.min_stock;
    if(filter==="ok") return matchSearch&&p.stock>p.min_stock;
    return matchSearch;
  });

  const save=async()=>{
    if(!f.name||!f.sell){showToast("Nom et prix requis",false);return;}
    const d={name:f.name,emoji,buy_price:+f.buy||0,sell_price:+f.sell,stock:+f.stock||0,min_stock:+f.min||5,shop_id:shop.id};
    if(editId){const {data}=await supabase.from("products").update(d).eq("id",editId).select().single();if(data){setProducts(products.map(p=>p.id===editId?data:p));showToast("Modifie!");}}
    else{const {data}=await supabase.from("products").insert(d).select().single();if(data){setProducts([...products,data]);showToast("Ajoute!");}}
    setModal(false);
  };
  const del=async(id:string)=>{if(!confirm("Supprimer ?"))return;await supabase.from("products").delete().eq("id",id);setProducts(products.filter(p=>p.id!==id));showToast("Supprime");};
  const adj=async(id:string,d:number)=>{const p=products.find(x=>x.id===id);if(!p)return;const ns=Math.max(0,p.stock+d);await supabase.from("products").update({stock:ns}).eq("id",id);setProducts(products.map(x=>x.id===id?{...x,stock:ns}:x));};
  const openAdd=()=>{setEditId(null);setEmoji("📦");setF({name:"",buy:"",sell:"",stock:"",min:"5"});setModal(true);};
  const openEdit=(p:Product)=>{setEditId(p.id);setEmoji(p.emoji);setF({name:p.name,buy:String(p.buy_price),sell:String(p.sell_price),stock:String(p.stock),min:String(p.min_stock)});setModal(true);};

  const alerts=products.filter(p=>p.stock<=p.min_stock).length;

  return (
    <div className="page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><h1 style={{ fontSize:22, fontWeight:900, color:T.text, margin:0 }}>Produits</h1><p style={{ color:T.muted, fontSize:13, marginTop:3 }}>{products.length} produits{alerts>0?` · ${alerts} alertes`:""}</p></div>
        <button onClick={openAdd} style={btnG}>+ Ajouter</button>
      </div>
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none", color:T.muted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un produit..." style={{ ...inputStyle, paddingLeft:44 }}/>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        {[["all","Tous"],["alert","⚠️ Alertes"],["ok","✅ OK"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{ flexShrink:0, background:filter===k?`${G}18`:T.card, border:`1px solid ${filter===k?`${G}40`:T.border}`, borderRadius:99, padding:"8px 16px", color:filter===k?G:T.muted, fontSize:13, fontWeight:filter===k?700:500, cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      {filtered.map(p=>{
        const low=p.stock<=p.min_stock;
        const margin=Math.round(((p.sell_price-p.buy_price)/p.sell_price)*100);
        return (
          <div key={p.id} style={{ background:T.card, border:`1px solid ${low?T.red+"40":T.border}`, borderRadius:18, padding:16, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:50, height:50, borderRadius:15, background:low?"rgba(255,87,114,.1)":`${G}0D`, border:`1px solid ${low?T.red+"40":`${G}20`}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{p.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{p.name}</div>
                  <div style={{ background:`${T.gold}18`, borderRadius:99, padding:"3px 10px" }}>
                    <span style={{ color:T.gold, fontSize:11, fontWeight:700 }}>+{margin}%</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, marginTop:4, alignItems:"center" }}>
                  <span style={{ color:G, fontWeight:800, fontSize:14 }}>{fmt(p.sell_price)}</span>
                  <span style={{ color:T.muted, fontSize:12 }}>achat {fmt(p.buy_price)}</span>
                </div>
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ color:p.stock===0?T.red:low?T.gold:T.muted, fontSize:12, fontWeight:low?700:500 }}>
                      {p.stock===0?"⛔ Rupture totale":low?`⚠️ Stock critique: ${p.stock}`:`✅ Stock: ${p.stock}`}
                    </span>
                    <span style={{ color:T.muted, fontSize:11 }}>min {p.min_stock}</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,.04)", borderRadius:99, height:5, overflow:"hidden" }}>
                    <div style={{ width:`${Math.min((p.stock/(p.min_stock*2))*100,100)}%`, height:5, background:p.stock===0?T.red:low?T.gold:G, borderRadius:99 }}/>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>adj(p.id,-1)} style={{ width:32, height:32, background:"rgba(255,87,114,.12)", border:`1px solid ${T.red}40`, borderRadius:9, cursor:"pointer", color:T.red, fontWeight:900, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                <span style={{ color:T.text, fontWeight:900, fontSize:16, minWidth:26, textAlign:"center" }}>{p.stock}</span>
                <button onClick={()=>adj(p.id,1)} style={{ width:32, height:32, background:`${G}12`, border:`1px solid ${G}40`, borderRadius:9, cursor:"pointer", color:G, fontWeight:900, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>openEdit(p)} style={{ background:"rgba(255,255,255,.05)", border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 14px", cursor:"pointer", color:T.text, fontSize:13, fontWeight:600 }}>✏️ Modifier</button>
                <button onClick={()=>del(p.id)} style={{ background:"rgba(255,87,114,.1)", border:`1px solid ${T.red}30`, borderRadius:10, padding:"8px 12px", cursor:"pointer", color:T.red, fontSize:13 }}>🗑️</button>
              </div>
            </div>
          </div>
        );
      })}
      <Modal open={modal} onClose={()=>setModal(false)} title={editId?"Modifier produit":"Nouveau produit"}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          {EMOJIS.map(e=>(<button key={e} onClick={()=>setEmoji(e)} style={{ fontSize:22, background:emoji===e?`${G}20`:"transparent", border:`1px solid ${emoji===e?G:T.border}`, borderRadius:10, padding:"6px 10px", cursor:"pointer" }}>{e}</button>))}
        </div>
        <Field label="Nom *" placeholder="Ex: Riz 25kg" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <Field label="Prix de vente FCFA *" type="number" placeholder="14500" value={f.sell} onChange={e=>setF({...f,sell:e.target.value})}/>
        <Field label="Prix d'achat FCFA" type="number" placeholder="12000" value={f.buy} onChange={e=>setF({...f,buy:e.target.value})}/>
        <Field label="Stock initial" type="number" placeholder="0" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/>
        <Field label="Seuil d'alerte" type="number" placeholder="5" value={f.min} onChange={e=>setF({...f,min:e.target.value})}/>
        <button onClick={save} style={{ ...btnG, width:"100%", padding:13 }}>Enregistrer</button>
      </Modal>
    </div>
  );
}

// ── CAISSE ────────────────────────────────────────────────────────
function Caisse({ shop, showToast, onClose }: { shop:Shop; showToast:(m:string,ok?:boolean)=>void; onClose:()=>void }) {
  const [products,setProducts]=useState<Product[]>([]);
  const [cart,setCart]=useState<{product:Product;qty:number}[]>([]);
  const [search,setSearch]=useState("");
  const [clientName,setClientName]=useState("");
  const [payment,setPayment]=useState("Wave");
  const [disc,setDisc]=useState(0);
  const [step,setStep]=useState<"products"|"checkout">("products");

  useEffect(()=>{supabase.from("products").select("*").eq("shop_id",shop.id).order("name").then(({data})=>{if(data)setProducts(data);});}, [shop.id]);

  const filtered=products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  const addToCart=(p:Product)=>{if(p.stock<=0)return;setCart(c=>{const ex=c.find(x=>x.product.id===p.id);return ex?c.map(x=>x.product.id===p.id?{...x,qty:Math.min(x.qty+1,p.stock)}:x):[...c,{product:p,qty:1}];});};
  const removeFromCart=(id:string)=>setCart(c=>c.map(x=>x.product.id===id?{...x,qty:Math.max(0,x.qty-1)}:x).filter(x=>x.qty>0));
  const subtotal=cart.reduce((a,c)=>a+c.product.sell_price*c.qty,0);
  const total=Math.max(0,subtotal-disc);
  const profit=cart.reduce((a,c)=>a+(c.product.sell_price-c.product.buy_price)*c.qty,0)-disc;

  const checkout=async()=>{
    if(cart.length===0){showToast("Panier vide",false);return;}
    const items:SaleItem[]=cart.map(c=>({name:c.product.name,qty:c.qty,price:c.product.sell_price}));
    const label=clientName||cart.map(c=>`${c.product.emoji}${c.qty>1?` x${c.qty}`:""}`).join(", ");
    const {error}=await supabase.from("sales").insert({shop_id:shop.id,label,total,profit,payment,client_name:clientName,items,disc});
    if(error){showToast("Erreur",false);return;}
    for(const c of cart){await supabase.from("products").update({stock:c.product.stock-c.qty}).eq("id",c.product.id);}
    showToast(`Vente enregistree ! ${fmt(total)}`);
    setCart([]);setClientName("");setDisc(0);setStep("products");
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:T.dark, display:"flex", flexDirection:"column", fontFamily:"system-ui,sans-serif", color:T.text }}>
      <div style={{ background:`rgba(2,10,24,.96)`, backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onClose} style={{ width:40, height:40, borderRadius:13, background:T.card, border:`1px solid ${T.border}`, cursor:"pointer", color:T.text, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <div style={{ flex:1 }}><div style={{ fontWeight:800, fontSize:17, color:T.text }}>Nouvelle vente</div><div style={{ color:T.muted, fontSize:12 }}>Tapez pour ajouter au panier</div></div>
        {cart.length>0&&<div style={{ background:`${G}18`, border:`1px solid ${G}35`, borderRadius:99, padding:"6px 14px" }}><span style={{ color:G, fontWeight:700, fontSize:13 }}>{cart.reduce((a,c)=>a+c.qty,0)} article{cart.reduce((a,c)=>a+c.qty,0)>1?"s":""}</span></div>}
      </div>

      {step==="products"&&(
        <>
          <div style={{ flex:1, overflowY:"auto", padding:"16px 16px", paddingBottom:cart.length>0?110:16 }}>
            <div style={{ position:"relative", marginBottom:14 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:T.muted, pointerEvents:"none" }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chercher un produit..." style={{ ...inputStyle, paddingLeft:44 }}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {filtered.map(p=>{
                const inCart=cart.find(c=>c.product.id===p.id);
                return (
                  <button key={p.id} onClick={()=>addToCart(p)} disabled={p.stock===0} style={{ background:inCart?`${G}10`:T.card, border:`1px solid ${inCart?`${G}40`:T.border}`, borderRadius:18, padding:14, cursor:p.stock>0?"pointer":"default", textAlign:"left", position:"relative", opacity:p.stock===0?.4:1 }}>
                    {inCart&&<div style={{ position:"absolute", top:10, right:10, background:G, color:"#000", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12 }}>{inCart.qty}</div>}
                    <div style={{ fontSize:28, marginBottom:10 }}>{p.emoji}</div>
                    <div style={{ color:T.text, fontWeight:700, fontSize:13, marginBottom:4 }}>{p.name}</div>
                    <div style={{ color:G, fontWeight:900, fontSize:14 }}>{fmt(p.sell_price)}</div>
                    <div style={{ color:p.stock===0?T.red:T.muted, fontSize:11, marginTop:4 }}>{p.stock===0?"⛔ Rupture":`Stock: ${p.stock}`}</div>
                  </button>
                );
              })}
            </div>
          </div>
          {cart.length>0&&(
            <div style={{ position:"fixed", bottom:0, left:0, right:0, background:`rgba(2,10,24,.97)`, backdropFilter:"blur(20px)", borderTop:`1px solid ${T.border}`, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ color:T.muted, fontSize:14 }}>Total panier</span>
                <span style={{ color:T.text, fontWeight:900, fontSize:24, letterSpacing:-1 }}>{fmt(total)}</span>
              </div>
              <button onClick={()=>setStep("checkout")} style={{ ...btnG, width:"100%", padding:14, fontSize:15 }}>
                Encaisser {fmt(total)} →
              </button>
            </div>
          )}
        </>
      )}

      {step==="checkout"&&(
        <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 40px" }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:18, marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:15, color:T.text, marginBottom:14 }}>Recapitulatif</div>
            {cart.map((c,i)=>(
              <div key={c.product.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop:i>0?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:20 }}>{c.product.emoji}</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.product.name}</div><div style={{ color:T.muted, fontSize:12 }}>{fmt(c.product.sell_price)} × {c.qty}</div></div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <button onClick={()=>removeFromCart(c.product.id)} style={{ width:26, height:26, background:"rgba(255,255,255,.06)", border:"none", borderRadius:7, cursor:"pointer", color:T.text, fontWeight:700 }}>−</button>
                  <span style={{ color:G, fontWeight:800, fontSize:14, minWidth:18, textAlign:"center" }}>{c.qty}</span>
                  <button onClick={()=>addToCart(c.product)} style={{ width:26, height:26, background:`${G}15`, border:`1px solid ${G}30`, borderRadius:7, cursor:"pointer", color:G, fontWeight:700 }}>+</button>
                </div>
                <span style={{ color:T.gold, fontWeight:700, fontSize:13, minWidth:90, textAlign:"right" }}>{fmt(c.product.sell_price*c.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:18, marginBottom:16 }}>
            <Field label="Nom du client (optionnel)" placeholder="Ex: Aminata" value={clientName} onChange={e=>setClientName(e.target.value)}/>
            <Field label="Remise FCFA" type="number" placeholder="0" value={disc||""} onChange={e=>setDisc(+e.target.value||0)}/>
            <div style={{ marginBottom:14 }}>
              <label style={{ color:T.muted, fontSize:12, fontWeight:600, display:"block", marginBottom:8 }}>Mode de paiement</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[["Wave","💙","#3B82F6"],["Cash","💵",G],["Orange","🟠",T.gold]].map(([pm,e,c])=>(
                  <button key={pm} onClick={()=>setPayment(pm)} style={{ background:payment===pm?`${c}20`:T.card, border:`1px solid ${payment===pm?c+"50":T.border}`, borderRadius:14, padding:"12px 0", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:20 }}>{e}</span>
                    <span style={{ color:payment===pm?c:T.muted, fontWeight:700, fontSize:12 }}>{pm}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:14, borderTop:`1px solid ${T.border}` }}>
              <span style={{ color:T.muted, fontSize:15 }}>Total a payer</span>
              <span style={{ color:T.text, fontWeight:900, fontSize:24, letterSpacing:-1 }}>{fmt(total)}</span>
            </div>
          </div>
          <button onClick={()=>setStep("products")} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:14, padding:"12px 0", fontWeight:700, fontSize:14, cursor:"pointer", color:T.muted, width:"100%", marginBottom:10 }}>← Modifier le panier</button>
          <button onClick={checkout} style={{ ...btnG, width:"100%", padding:15, fontSize:16 }}>✅ Confirmer {fmt(total)}</button>
        </div>
      )}
    </div>
  );
}

// ── DETTES ────────────────────────────────────────────────────────
function Dettes({ shop, showToast }: { shop:Shop; showToast:(m:string,ok?:boolean)=>void }) {
  const [debts,setDebts]=useState<Debt[]>([]);
  const [modal,setModal]=useState(false);
  const [payModal,setPayModal]=useState<string|null>(null);
  const [payAmount,setPayAmount]=useState("");
  const [f,setF]=useState({client:"",phone:"",amount:""});

  useEffect(()=>{supabase.from("debts").select("*").eq("shop_id",shop.id).order("created_at",{ascending:false}).then(({data})=>{if(data)setDebts(data);});},[shop.id]);

  const addDebt=async()=>{
    if(!f.client||!f.amount){showToast("Client et montant requis",false);return;}
    const {data}=await supabase.from("debts").insert({shop_id:shop.id,client_name:f.client,phone:f.phone,total:+f.amount,paid:0}).select().single();
    if(data){setDebts([data,...debts]);setModal(false);setF({client:"",phone:"",amount:""});showToast("Dette ajoutee!");}
  };
  const recordPayment=async()=>{
    const debt=debts.find(d=>d.id===payModal);
    if(!debt||!payAmount)return;
    const newPaid=Math.min(debt.total,debt.paid+(+payAmount));
    const {data}=await supabase.from("debts").update({paid:newPaid}).eq("id",payModal).select().single();
    if(data){setDebts(debts.map(d=>d.id===payModal?data:d));setPayModal(null);setPayAmount("");showToast(`Paiement de ${fmt(+payAmount)} enregistre!`);}
  };

  const totalDu=debts.reduce((a,d)=>a+(d.total-d.paid),0);
  const totalRecup=debts.reduce((a,d)=>a+d.paid,0);

  return (
    <div className="page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h1 style={{ fontSize:22, fontWeight:900, color:T.text, margin:0 }}>Dettes Clients</h1><p style={{ color:T.muted, fontSize:13, marginTop:3 }}>{debts.filter(d=>d.total>d.paid).length} debiteurs actifs</p></div>
        <button onClick={()=>setModal(true)} style={btnG}>+ Ajouter</button>
      </div>

      <div style={{ background:"linear-gradient(135deg,#1A0B0B,#0D0918)", border:`1px solid rgba(255,87,114,.2)`, borderRadius:18, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"rgba(255,87,114,.7)", fontSize:11, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Montant en attente</div>
            <div style={{ fontSize:30, fontWeight:900, color:T.red, letterSpacing:-1 }}>{fmt(totalDu)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:T.muted, fontSize:11, marginBottom:4 }}>Deja recupere</div>
            <div style={{ color:G, fontWeight:800, fontSize:18 }}>{fmt(totalRecup)}</div>
          </div>
        </div>
      </div>

      {debts.map((d,i)=>{
        const rem=d.total-d.paid; const pct=Math.round((d.paid/d.total)*100); const ok=rem===0;
        return (
          <div key={d.id} style={{ background:T.card, border:`1px solid ${ok?G+"30":T.border}`, borderRadius:20, padding:18, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:44, height:44, borderRadius:14, background:ok?`${G}18`:"rgba(255,87,114,.12)", border:`1px solid ${ok?G+"35":T.red+"30"}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:ok?G:T.red, fontSize:18 }}>
                  {ok?"✓":d.client_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:T.text }}>{d.client_name}</div>
                  <div style={{ color:T.muted, fontSize:12, marginTop:3 }}>{d.phone?`📱 +${d.phone}`:"Pas de numero"}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:ok?G:T.red, fontWeight:900, fontSize:20 }}>{ok?"Solde ✓":`-${fmt(rem)}`}</div>
                {!ok&&<div style={{ color:T.muted, fontSize:12, marginTop:2 }}>sur {fmt(d.total)}</div>}
              </div>
            </div>
            <div style={{ marginBottom:ok?0:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:T.muted, fontSize:12 }}>Progression</span>
                <span style={{ color:ok?G:T.gold, fontWeight:700, fontSize:12 }}>{pct}% paye</span>
              </div>
              <div style={{ background:"rgba(255,255,255,.04)", borderRadius:99, height:6, overflow:"hidden" }}>
                <div style={{ height:6, borderRadius:99, background:ok?G:`linear-gradient(90deg,${T.gold},${G})`, width:`${pct}%`, transition:"width .5s" }}/>
              </div>
            </div>
            {!ok&&(
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                {d.phone&&<a href={`https://wa.me/${d.phone}?text=Bonjour ${d.client_name}, vous avez une dette de ${fmt(rem)} a regler.`} style={{ flex:1, background:"rgba(37,211,102,.1)", border:"1px solid rgba(37,211,102,.25)", borderRadius:12, padding:"11px 0", fontSize:13, fontWeight:700, color:"#25D366", textDecoration:"none", textAlign:"center" }}>💬 Relancer</a>}
                <button onClick={()=>{setPayModal(d.id);setPayAmount("");}} style={{ flex:1, background:`${G}12`, border:`1px solid ${G}30`, borderRadius:12, padding:"11px 0", fontSize:13, fontWeight:700, color:G, cursor:"pointer" }}>💰 Paiement</button>
              </div>
            )}
          </div>
        );
      })}
      {debts.length===0&&<p style={{ color:T.muted, textAlign:"center", padding:40, fontSize:14 }}>Aucune dette enregistree</p>}

      <Modal open={modal} onClose={()=>setModal(false)} title="Nouvelle dette">
        <Field label="Nom du client *" placeholder="Aminata Diallo" value={f.client} onChange={e=>setF({...f,client:e.target.value})}/>
        <Field label="Telephone (optionnel)" placeholder="221771234567" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
        <Field label="Montant total FCFA *" type="number" placeholder="15000" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
        <button onClick={addDebt} style={{ ...btnG, width:"100%", padding:13 }}>Enregistrer</button>
      </Modal>
      <Modal open={!!payModal} onClose={()=>setPayModal(null)} title="Enregistrer un paiement">
        <Field label="Montant recu FCFA *" type="number" placeholder="5000" value={payAmount} onChange={e=>setPayAmount(e.target.value)}/>
        <button onClick={recordPayment} style={{ ...btnG, width:"100%", padding:13 }}>Confirmer</button>
      </Modal>
    </div>
  );
}

// ── ANALYSES ──────────────────────────────────────────────────────
function Analyses({ shop }: { shop:Shop }) {
  const [monthly,setMonthly]=useState<{month:string;ca:number;ventes:number;profit:number}[]>([]);
  const [topProfitable,setTopProfitable]=useState<{name:string;qty:number;profit:number;margin:number}[]>([]);
  const [payments,setPayments]=useState<{name:string;ca:number;count:number;color:string}[]>([]);
  const [debtHealth,setDebtHealth]=useState({total:0,paid:0,pending:0,clients:0});
  const [lowStock,setLowStock]=useState<{name:string;emoji:string;stock:number;min_stock:number;sell_price:number}[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      const since=new Date();since.setMonth(since.getMonth()-5);since.setDate(1);since.setHours(0,0,0,0);
      const [salesRes,debtsRes,productsRes]=await Promise.all([
        supabase.from("sales").select("*").eq("shop_id",shop.id).gte("created_at",since.toISOString()),
        supabase.from("debts").select("*").eq("shop_id",shop.id),
        supabase.from("products").select("*").eq("shop_id",shop.id),
      ]);
      const sales=salesRes.data||[];const debts=debtsRes.data||[];const products=productsRes.data||[];
      const MONTHS=["Jan","Fev","Mar","Avr","Mai","Juin","Juil","Aou","Sep","Oct","Nov","Dec"];
      const mMap:Record<string,{ca:number;ventes:number;profit:number}>={};
      const pMap:Record<string,{qty:number;profit:number;revenue:number}>={};
      const payMap:Record<string,{ca:number;count:number}>={};
      for(const s of sales){
        const d=new Date(s.created_at);
        const mk=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        if(!mMap[mk])mMap[mk]={ca:0,ventes:0,profit:0};
        mMap[mk].ca+=s.total;mMap[mk].ventes+=1;mMap[mk].profit+=s.profit;
        const pm=s.payment||"Cash";
        if(!payMap[pm])payMap[pm]={ca:0,count:0};
        payMap[pm].ca+=s.total;payMap[pm].count+=1;
        if(Array.isArray(s.items)){
          for(const item of s.items as SaleItem[]){
            const prod=products.find((p:Product)=>p.name===item.name);
            const buyP=prod?prod.buy_price:0;
            if(!pMap[item.name])pMap[item.name]={qty:0,profit:0,revenue:0};
            pMap[item.name].qty+=item.qty;pMap[item.name].revenue+=item.price*item.qty;pMap[item.name].profit+=(item.price-buyP)*item.qty;
          }
        }
      }
      const monthlyArr=Object.entries(mMap).sort(([a],[b])=>a.localeCompare(b)).map(([mk,v])=>{const[,mo]=mk.split("-");return{month:MONTHS[+mo-1],...v};});
      setMonthly(monthlyArr);
      const top5=Object.entries(pMap).map(([name,v])=>({name,qty:v.qty,profit:v.profit,margin:v.revenue>0?Math.round((v.profit/v.revenue)*100):0})).sort((a,b)=>b.profit-a.profit).slice(0,5);
      setTopProfitable(top5);
      const PAY_COLORS:Record<string,string>={Wave:"#3B82F6",Cash:G,Orange:T.gold};
      const totalCA=sales.reduce((a:number,s:Sale)=>a+s.total,0);
      const payArr=Object.entries(payMap).map(([name,v])=>({name,ca:v.ca,count:v.count,pct:totalCA>0?Math.round((v.ca/totalCA)*100):0,color:PAY_COLORS[name]||T.muted})).sort((a,b)=>b.ca-a.ca);
      setPayments(payArr);
      const totalDebt=debts.reduce((a:number,d:Debt)=>a+d.total,0);
      const totalPaid=debts.reduce((a:number,d:Debt)=>a+d.paid,0);
      setDebtHealth({total:totalDebt,paid:totalPaid,pending:totalDebt-totalPaid,clients:debts.filter((d:Debt)=>d.total>d.paid).length});
      const low=products.filter((p:Product)=>p.stock<=p.min_stock).sort((a:Product,b:Product)=>(a.stock/(a.min_stock||1))-(b.stock/(b.min_stock||1))).slice(0,5);
      setLowStock(low);
      setLoading(false);
    };
    load();
  },[shop.id]);

  if(loading)return(<div style={{textAlign:"center",padding:60,color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>📊</div><p style={{fontWeight:600}}>Calcul en cours...</p></div>);

  const maxCA=Math.max(...monthly.map(m=>m.ca),1);
  const maxProfit=Math.max(...topProfitable.map(p=>p.profit),1);
  const totalPayCA=payments.reduce((a,p)=>a+p.ca,0);
  const debtPct=debtHealth.total>0?Math.round((debtHealth.paid/debtHealth.total)*100):0;
  const circumference=2*Math.PI*32;
  const best=monthly.length>0?monthly.reduce((a,m)=>m.ca>a.ca?m:a,monthly[0]):null;
  const avg=monthly.length>0?Math.round(monthly.reduce((a,m)=>a+m.ca,0)/monthly.length):0;

  return (
    <div className="page">
      <h1 style={{fontSize:22,fontWeight:900,color:T.text,margin:"0 0 4px"}}>Analyses</h1>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}>6 derniers mois</p>

      {best&&avg>0&&(
        <div style={{background:`${G}0D`,border:`1px solid ${G}25`,borderRadius:16,padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:28}}>💡</span>
          <div>
            <div style={{color:G,fontWeight:700,fontSize:13}}>Meilleur mois : {best.month}</div>
            <div style={{color:T.muted,fontSize:12,marginTop:2}}>{fmt(best.ca)}, soit <span style={{color:G}}>+{Math.round(((best.ca-avg)/avg)*100)}%</span> au-dessus de la moyenne</div>
          </div>
        </div>
      )}

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:18,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
          <div><div style={{fontWeight:800,fontSize:15,color:T.text}}>📈 CA mensuel</div><div style={{color:T.muted,fontSize:12,marginTop:3}}>Total: {fmt(monthly.reduce((a,m)=>a+m.ca,0))}</div></div>
          {best&&<div style={{textAlign:"right"}}><div style={{color:G,fontWeight:900,fontSize:15}}>{best.ca>=1000?`${Math.round(best.ca/1000)}k`:best.ca} FCFA</div><div style={{color:T.muted,fontSize:11}}>{best.month} · meilleur 🏆</div></div>}
        </div>
        {monthly.length===0?<p style={{color:T.muted,textAlign:"center",padding:20,fontSize:13}}>Pas encore de ventes</p>:(
          <>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
              {monthly.map((m,i)=>{const h=Math.max((m.ca/maxCA)*95,6);const isMax=m.ca===maxCA;const isLast=i===monthly.length-1;return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{color:isMax?G:T.muted,fontSize:9,fontWeight:700}}>{isMax?`${Math.round(m.ca/1000)}k`:""}</div>
                  <div style={{width:"100%",height:h,background:isMax?`linear-gradient(180deg,${G},#00A87E)`:isLast?"rgba(91,142,240,.3)":"rgba(255,255,255,.05)",borderRadius:"8px 8px 0 0",position:"relative"}}>
                    {isMax&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",fontSize:10}}>🏆</div>}
                  </div>
                  <div style={{color:isLast?T.blue:T.muted,fontSize:10,fontWeight:isLast?700:400}}>{m.month}</div>
                </div>
              );})}
            </div>
            <div style={{display:"flex",marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
              {[["Benefice",fmt(monthly.reduce((a,m)=>a+m.profit,0)),T.gold],["Ventes",String(monthly.reduce((a,m)=>a+m.ventes,0)),T.blue],["Moy./mois",fmt(avg),T.text]].map(([l,v,c],i)=>(
                <div key={i} style={{flex:1,textAlign:"center",borderRight:i<2?`1px solid ${T.border}`:"none"}}>
                  <div style={{color:T.muted,fontSize:10,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{l}</div>
                  <div style={{color:c,fontWeight:800,fontSize:13}}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:18,marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:4}}>🏆 Produits les plus rentables</div>
        <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Classes par benefice genere</div>
        {topProfitable.length===0?<p style={{color:T.muted,textAlign:"center",padding:20,fontSize:13}}>Pas encore de donnees</p>:
          topProfitable.map((p,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:26,height:26,borderRadius:8,background:i===0?"rgba(255,181,71,.2)":i===1?"rgba(255,255,255,.07)":"rgba(255,255,255,.04)",color:i===0?T.gold:i===1?"#9CA3AF":T.muted,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12}}>{i+1}</div>
                  <div><div style={{fontWeight:700,fontSize:13,color:T.text}}>{p.name}</div><div style={{color:T.muted,fontSize:11}}>{p.qty} vendus · marge {p.margin}%</div></div>
                </div>
                <div style={{textAlign:"right"}}><div style={{color:G,fontWeight:800,fontSize:13}}>+{p.profit>=1000?`${Math.round(p.profit/1000)}k`:p.profit} FCFA</div><div style={{color:T.muted,fontSize:11}}>benefice net</div></div>
              </div>
              <div style={{background:"rgba(255,255,255,.04)",borderRadius:99,height:5,overflow:"hidden"}}>
                <div style={{height:5,borderRadius:99,background:i===0?T.gold:i===1?"#9CA3AF":G,width:`${(p.profit/maxProfit)*100}%`}}/>
              </div>
            </div>
          ))
        }
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:18,marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:4}}>💳 Moyens de paiement</div>
        <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Comment paient vos clients</div>
        {payments.length===0?<p style={{color:T.muted,textAlign:"center",padding:20,fontSize:13}}>Pas encore de donnees</p>:(
          <>
            <div style={{display:"flex",gap:3,height:9,borderRadius:99,overflow:"hidden",marginBottom:16}}>
              {payments.map((p,i)=><div key={i} style={{width:`${totalPayCA>0?(p.ca/totalPayCA)*100:0}%`,background:p.color,borderRadius:i===0?"99px 0 0 99px":i===payments.length-1?"0 99px 99px 0":0}}/>)}
            </div>
            {payments.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<payments.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:p.color}}/>
                  <div><div style={{fontWeight:700,fontSize:14,color:T.text}}>{p.name==="Wave"?"💙 Wave":p.name==="Cash"?"💵 Cash":"🟠 Orange"}</div><div style={{color:T.muted,fontSize:12}}>{p.count} transactions</div></div>
                </div>
                <div style={{textAlign:"right"}}><div style={{color:p.color,fontWeight:800,fontSize:14}}>{totalPayCA>0?Math.round((p.ca/totalPayCA)*100):0}%</div><div style={{color:T.muted,fontSize:11}}>{p.ca>=1000?`${Math.round(p.ca/1000)}k`:p.ca} FCFA</div></div>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:18,marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:4}}>💸 Sante de la tresorerie</div>
        <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Etat de vos creances clients</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
          <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
            <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke={debtPct>70?G:debtPct>40?T.gold:T.red} strokeWidth="8" strokeDasharray={`${(debtPct/100)*circumference} ${circumference}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <span style={{fontSize:16,fontWeight:900,color:T.text}}>{debtPct}%</span>
              <span style={{fontSize:9,color:T.muted}}>recup.</span>
            </div>
          </div>
          <div style={{flex:1}}>
            {[["Total du",fmt(debtHealth.total),T.text],["Recupere ✅",fmt(debtHealth.paid),G],["En attente ⏳",fmt(debtHealth.pending),T.red]].map(([l,v,c],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:i<2?8:0}}>
                <span style={{color:T.muted,fontSize:12}}>{l}</span>
                <span style={{color:c,fontWeight:700,fontSize:13}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {debtHealth.clients>0&&<div style={{background:"rgba(255,87,114,.08)",border:"1px solid rgba(255,87,114,.2)",borderRadius:10,padding:"10px 14px"}}><span style={{color:T.red,fontSize:13,fontWeight:600}}>⚠️ {debtHealth.clients} client{debtHealth.clients>1?"s":""} avec dette en cours</span></div>}
        {debtHealth.total===0&&<p style={{color:T.muted,textAlign:"center",padding:10,fontSize:13}}>Aucune dette enregistree</p>}
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:18}}>
        <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:4}}>📦 Stocks a reapprovisionner</div>
        <div style={{color:T.muted,fontSize:12,marginBottom:16}}>Produits sous le seuil d&apos;alerte</div>
        {lowStock.length===0?(
          <div style={{textAlign:"center",padding:20}}><div style={{fontSize:36,marginBottom:8}}>✅</div><p style={{color:G,fontSize:13,fontWeight:600}}>Tous les stocks sont OK !</p></div>
        ):lowStock.map((p,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:i<lowStock.length-1?`1px solid ${T.border}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:24}}>{p.emoji}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:T.text}}>{p.name}</div>
                <div style={{fontSize:12,marginTop:2}}>
                  <span style={{color:p.stock===0?T.red:T.gold,fontWeight:700}}>{p.stock===0?"⛔ Rupture":p.stock}</span>
                  <span style={{color:T.muted}}> / min {p.min_stock}</span>
                </div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:T.red,fontWeight:800,fontSize:13}}>-{fmt((p.min_stock-p.stock)*p.sell_price)}</div>
              <div style={{color:T.muted,fontSize:11}}>ventes perdues</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── PARAMETRES ────────────────────────────────────────────────────
function Parametres({ shop, showToast }: { shop:Shop; showToast:(m:string,ok?:boolean)=>void }) {
  const [shopName, setShopName] = useState(shop.name);
  const [ownerName, setOwnerName] = useState(shop.owner_name);
  const [saving, setSaving] = useState(false);

  const trialEnd = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;
  const subEnd = shop.subscription_ends_at ? new Date(shop.subscription_ends_at) : null;
  const isPro = shop.plan === "pro";
  const expiry = isPro ? subEnd : trialEnd;
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : 0;

  const saveShop = async () => {
    setSaving(true);
    const { error } = await supabase.from("shops").update({ name: shopName, owner_name: ownerName }).eq("id", shop.id);
    setSaving(false);
    if (error) showToast("Erreur lors de la sauvegarde", false);
    else showToast("Informations mises a jour !");
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, paddingLeft: 4 }}>{title}</div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden" }}>{children}</div>
    </div>
  );

  const Row = ({ e, label, value, danger = false, onPress }: { e: string; label: string; value?: string; danger?: boolean; onPress?: () => void }) => (
    <div onClick={onPress} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: `1px solid ${T.border}`, cursor: onPress ? "pointer" : "default" }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: danger ? "rgba(255,87,114,.12)" : `${G}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{e}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: danger ? T.red : T.text }}>{label}</div>
        {value && <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{value}</div>}
      </div>
      {onPress && <span style={{ color: T.muted, fontSize: 18 }}>›</span>}
    </div>
  );

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: "0 0 20px" }}>Parametres</h1>

      {/* Plan actuel */}
      <div style={{ background: isPro ? "linear-gradient(135deg,#071C14,#020F1F)" : "linear-gradient(135deg,#1A100A,#0D0918)", border: `1px solid ${isPro ? G+"30" : T.gold+"30"}`, borderRadius: 20, padding: 20, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: isPro ? `${G}12` : `${T.gold}12` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: isPro ? `${G}AA` : `${T.gold}AA`, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Votre abonnement</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T.text }}>Plan {isPro ? "Pro ✨" : "Essai"}</div>
            <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
              {daysLeft > 0 ? `Expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}` : "Expire aujourd'hui"}
            </div>
          </div>
          <div style={{ background: isPro ? `${G}20` : `${T.gold}20`, border: `1px solid ${isPro ? G+"40" : T.gold+"40"}`, borderRadius: 99, padding: "6px 14px" }}>
            <span style={{ color: isPro ? G : T.gold, fontWeight: 700, fontSize: 13 }}>3 000 FCFA/mois</span>
          </div>
        </div>
        {!isPro && (
          <a href={`https://wa.me/221786584622?text=Bonjour je veux activer mon abonnement Sen Business pour la boutique: ${shop.name}`}
            style={{ display: "block", marginTop: 14, background: `linear-gradient(135deg,${G},#00A87E)`, color: "#000", borderRadius: 12, padding: "12px 0", fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center" }}>
            🚀 Passer au Plan Pro
          </a>
        )}
      </div>

      {/* Infos boutique */}
      <Section title="Ma boutique">
        <div style={{ padding: "16px 18px" }}>
          <Field label="Nom de la boutique" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Boutique Narbi" />
          <Field label="Votre nom" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Hamza" />
          <button onClick={saveShop} style={{ ...btnG, width: "100%", padding: 12, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Sauvegarde..." : "💾 Sauvegarder"}
          </button>
        </div>
      </Section>

      {/* Compte */}
      <Section title="Compte">
        <Row e="📧" label="Email" value="Votre email de connexion" />
        <Row e="🔑" label="Changer le mot de passe" onPress={() => {
          supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) {
              supabase.auth.resetPasswordForEmail(data.user.email);
              showToast("Email de reinitialisation envoye !");
            }
          });
        }} />
        <Row e="🆔" label="ID Boutique" value={`#${shop.id.slice(0, 8).toUpperCase()}`} />
      </Section>

      {/* Support */}
      <Section title="Aide & Support">
        <Row e="💬" label="Contacter le support" value="WhatsApp · +221 78 658 46 22" onPress={() => window.open("https://wa.me/221786584622?text=Bonjour, j'ai besoin d'aide avec Sen Business", "_blank")} />
        <Row e="📖" label="Guide d'utilisation" value="Apprenez a utiliser Sen Business" onPress={() => {}} />
        <Row e="⭐" label="Donner votre avis" value="Aidez-nous a ameliorer l'app" onPress={() => {}} />
      </Section>

      {/* Version */}
      <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
        <div style={{ color: T.muted, fontSize: 12 }}>Sen Business · Version 1.0</div>
        <div style={{ color: `${T.muted}80`, fontSize: 11, marginTop: 4 }}>Fait avec ❤️ pour les commercants du Senegal</div>
      </div>
    </div>
  );
}

// ── BOTTOM SHEET ──────────────────────────────────────────────────
function BottomSheet({ open, onClose, onNav, onLogout, currentPage }: { open:boolean; onClose:()=>void; onNav:(id:string)=>void; onLogout:()=>void; currentPage:string }) {
  const items=[
    {id:"analyses",e:"📈",l:"Analyses",desc:"Statistiques & performances"},
    {id:"settings",e:"⚙️",l:"Parametres",desc:"Boutique, compte, abonnement"},
    {id:"logout",e:"🔴",l:"Deconnexion",desc:"Fermer la session",danger:true},
  ];
  return (
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:400,backdropFilter:"blur(4px)"}}/>}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.card,borderTop:`1px solid ${T.border}`,borderRadius:"28px 28px 0 0",zIndex:500,transform:open?"translateY(0)":"translateY(110%)",transition:"transform .38s cubic-bezier(.4,0,.2,1)",boxShadow:"0 -24px 80px rgba(0,0,0,.6)"}}>
        <div style={{width:36,height:4,borderRadius:99,background:"rgba(255,255,255,.1)",margin:"14px auto 22px"}}/>
        <div style={{padding:"0 16px"}}>
          {items.map(item=>(
            <button key={item.id} onClick={()=>{if(item.id==="logout"){supabase.auth.signOut().then(()=>onLogout());}else{onNav(item.id);onClose();}}} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"14px 14px",background:currentPage===item.id?`${G}0C`:"transparent",border:`1px solid ${currentPage===item.id?G+"25":"transparent"}`,borderRadius:16,cursor:"pointer",marginBottom:8}}>
              <div style={{width:46,height:46,borderRadius:14,background:item.danger?"rgba(255,87,114,.12)":currentPage===item.id?`${G}18`:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{item.e}</div>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{color:item.danger?T.red:currentPage===item.id?G:T.text,fontWeight:700,fontSize:15}}>{item.l}</div>
                <div style={{color:T.muted,fontSize:12,marginTop:2}}>{item.desc}</div>
              </div>
              {currentPage===item.id&&<div style={{width:8,height:8,borderRadius:"50%",background:G}}/>}
            </button>
          ))}
        </div>
        <div style={{padding:"14px 16px 36px",borderTop:`1px solid ${T.border}`,marginTop:6,display:"flex",justifyContent:"center"}}>
          <div style={{background:`${G}10`,border:`1px solid ${G}25`,borderRadius:99,padding:"8px 20px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:G}}/>
            <span style={{color:G,fontSize:13,fontWeight:700}}>Plan Pro actif</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────
export default function SenBusiness() {
  const [screen,setScreen]=useState<"login"|"app"|"bye">("login");
  const [shop,setShop]=useState<Shop|null>(null);
  const [page,setPage]=useState("dashboard");
  const [sheetOpen,setSheet]=useState(false);
  const [caisseOpen,setCaisse]=useState(false);
  const [toastMsg,setToastMsg]=useState("");
  const [toastOk,setToastOk]=useState(true);

  const showToast=(msg:string,ok=true)=>{setToastMsg(msg);setToastOk(ok);setTimeout(()=>setToastMsg(""),2800);};

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){
        supabase.from("shops").select("*").eq("user_id",session.user.id).single().then(({data})=>{if(data){setShop(data);setScreen("app");}});
      }
    });
  },[]);

  if(screen==="login")return<Login onLogin={s=>{setShop(s);setScreen("app");}}/>;

  if(screen==="bye")return(
    <div style={{background:T.dark,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif",color:T.text}}>
      <style>{appCSS}</style>
      <div style={{textAlign:"center",animation:"fadeUp .4s ease"}}>
        <div style={{fontSize:72,marginBottom:20}}>👋</div>
        <h1 style={{fontSize:26,fontWeight:900,marginBottom:8}}>A bientot !</h1>
        <p style={{color:T.muted,fontSize:15,marginBottom:32,lineHeight:1.6}}>Vous etes bien deconnecte.<br/>Vous pouvez fermer l&apos;application.</p>
        <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"0 auto"}}>
          <button onClick={()=>window.close()} style={{background:`linear-gradient(135deg,${G},#00A87E)`,color:"#000",border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,cursor:"pointer"}}>Fermer l&apos;application</button>
          <button onClick={()=>{setScreen("login");setShop(null);}} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 0",fontWeight:700,fontSize:15,cursor:"pointer",color:T.muted}}>Se reconnecter</button>
        </div>
      </div>
    </div>
  );
  if(!shop)return null;

  const trialExpired=shop.trial_ends_at&&new Date()>new Date(shop.trial_ends_at)&&shop.plan==="trial";
  if(trialExpired)return(
    <div style={{background:T.dark,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"system-ui,sans-serif",color:T.text}}>
      <style>{appCSS}</style>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>🔒</div>
        <h1 style={{fontSize:24,fontWeight:900,marginBottom:8}}>Essai gratuit termine</h1>
        <p style={{color:T.muted,fontSize:15,marginBottom:32,lineHeight:1.6}}>Votre essai de 7 jours est termine.<br/>Passez au plan Pro pour continuer.</p>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:28}}>
          <div style={{color:G,fontWeight:900,fontSize:32,marginBottom:4}}>3 000 FCFA</div>
          <div style={{color:T.muted,fontSize:13,marginBottom:20}}>par mois</div>
          <div style={{background:"#060F22",borderRadius:12,padding:16,marginBottom:16}}>
            <p style={{color:T.muted,fontSize:13,marginBottom:8}}>Envoyez sur Wave :</p>
            <div style={{color:T.text,fontWeight:900,fontSize:22}}>+221 78 658 46 22</div>
            <p style={{color:T.muted,fontSize:12,marginTop:4}}>Objet : SenBusiness + {shop.name}</p>
          </div>
          <a href={`https://wa.me/221786584622?text=Bonjour je veux activer mon abonnement Sen Business pour la boutique: ${shop.name}`} style={{display:"block",background:"linear-gradient(135deg,#25D366,#1ebe5c)",color:"#fff",borderRadius:12,padding:"14px 0",fontWeight:700,fontSize:15,textDecoration:"none"}}>
            💬 Contacter sur WhatsApp
          </a>
        </div>
        <p style={{color:T.muted,fontSize:12,marginTop:16}}>Apres paiement, votre compte sera active dans les 2h</p>
      </div>
    </div>
  );

  const inSheet=["analyses","settings"].includes(page);
  const NAV_L=[{id:"dashboard",e:"📊",l:"Accueil"},{id:"produits",e:"📦",l:"Produits"}];
  const NAV_R=[{id:"dettes",e:"💸",l:"Dettes"},{id:"more",e:"•••",l:"Plus"}];

  const NavBtn=({n}:{n:{id:string;e:string;l:string}})=>{
    const isMore=n.id==="more";
    const active=isMore?(inSheet||sheetOpen):page===n.id;
    return(
      <button onClick={()=>{isMore?setSheet(!sheetOpen):(setPage(n.id),setSheet(false));}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0 12px",border:"none",background:"none",cursor:"pointer",position:"relative"}}>
        {active&&<div style={{position:"absolute",top:0,left:"25%",right:"25%",height:2,background:G,borderRadius:"0 0 4px 4px"}}/>}
        <span style={{fontSize:isMore?14:20,marginBottom:3,color:active?G:T.muted,fontWeight:isMore?900:400,letterSpacing:isMore?2:0}}>{n.e}</span>
        <span style={{fontSize:11,fontWeight:active?700:500,color:active?G:T.muted}}>{n.l}</span>
      </button>
    );
  };

  return(
    <div style={{background:T.dark,minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",color:T.text}}>
      <style>{appCSS}</style>
      {toastMsg&&<Toast msg={toastMsg} ok={toastOk}/>}

      {/* Header */}
      <div style={{background:"rgba(2,10,24,.94)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{background:`linear-gradient(135deg,${G},#00A87E)`,width:36,height:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000",fontSize:18,flexShrink:0}}>S</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15,color:T.text}}>Sen <span style={{color:G}}>Business</span></div>
          <div style={{color:T.muted,fontSize:11,marginTop:1}}>{shop.name} · Dakar</div>
        </div>
        <div style={{width:36,height:36,borderRadius:12,background:`${G}20`,border:`1px solid ${G}40`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:G,fontSize:16}}>
          {shop.owner_name?.charAt(0)||"U"}
        </div>
      </div>

      {/* Content */}
      <div key={page} style={{padding:"20px 16px 140px",maxWidth:900,margin:"0 auto"}}>
        {page==="dashboard"&&<Dashboard shop={shop} onVente={()=>setCaisse(true)}/>}
        {page==="produits"&&<Produits shop={shop} showToast={showToast}/>}
        {page==="dettes"&&<Dettes shop={shop} showToast={showToast}/>}
        {page==="analyses"&&<Analyses shop={shop}/>}
        {page==="settings"&&<Parametres shop={shop} showToast={showToast}/>}
      </div>

      {/* Split pill nav + FAB */}
      <div style={{position:"fixed",bottom:16,left:12,right:12,display:"flex",alignItems:"flex-end",gap:10,zIndex:200}}>
        <div style={{flex:1,background:"rgba(6,15,34,.92)",backdropFilter:"blur(20px)",border:`1px solid ${T.border}`,borderRadius:"99px 24px 24px 99px",display:"flex",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
          {NAV_L.map(n=><NavBtn key={n.id} n={n}/>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <button className="fab" onClick={()=>setCaisse(true)} style={{width:62,height:62,borderRadius:"50%",background:`linear-gradient(135deg,${G},#00A87E)`,border:"none",cursor:"pointer",fontSize:26,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 24px ${G}50`,color:"#000"}}>
            🛒
          </button>
          <span style={{color:G,fontSize:10,fontWeight:700,paddingBottom:2}}>Vente</span>
        </div>
        <div style={{flex:1,background:"rgba(6,15,34,.92)",backdropFilter:"blur(20px)",border:`1px solid ${T.border}`,borderRadius:"24px 99px 99px 24px",display:"flex",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
          {NAV_R.map(n=><NavBtn key={n.id} n={n}/>)}
        </div>
      </div>

      {/* Bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={()=>setSheet(false)} currentPage={page} onNav={id=>{setPage(id);}} onLogout={()=>{setScreen("bye");setSheet(false);}}/>

      {/* Caisse overlay */}
      {caisseOpen&&<Caisse shop={shop} showToast={showToast} onClose={()=>setCaisse(false)}/>}
    </div>
  );
}
