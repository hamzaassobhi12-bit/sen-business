"use client";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(Math.round(n)) + " FCFA";
const G = "#00C896";

interface Product { id: string; name: string; buy_price: number; sell_price: number; stock: number; min_stock: number; emoji: string; }
interface Debt { id: string; client_name: string; phone: string; total: number; paid: number; }
interface Sale { id: string; label: string; total: number; profit: number; payment: string; client_name: string; created_at: string; }
interface Shop { id: string; name: string; owner_name: string; plan: string; trial_ends_at: string; subscription_ends_at: string; }

const cardStyle: React.CSSProperties = { background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: 18 };
const inputStyle: React.CSSProperties = { width: "100%", background: "#0d1520", border: "1px solid #1F2937", borderRadius: 10, color: "#fff", padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" };
const btnG: React.CSSProperties = { background: "linear-gradient(135deg,#00C896,#00A87E)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnO: React.CSSProperties = { background: "transparent", color: G, border: "2px solid #00C896", borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" };

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: ok ? "#052e16" : "#450a0a", border: `1px solid ${ok ? "#166534" : "#991b1b"}`, borderRadius: 12, padding: "12px 22px", color: ok ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 14, zIndex: 9999, whiteSpace: "nowrap", pointerEvents: "none" }}>
      {ok ? "✅ " : "❌ "}{msg}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 998, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: "20px 20px 16px 16px", width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ color: "#fff", fontSize: 16 }}>{title}</b>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder = "" }: { label: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function StatBox({ emoji, label, value, accent = G }: { emoji: string; label: string; value: string; accent?: string }) {
  return (
    <div style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 60, height: 60, borderRadius: "50%", background: accent, opacity: 0.08 }} />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div style={{ color: "#9CA3AF", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

// LOGIN / REGISTER
function Login({ onLogin }: { onLogin: (shop: Shop) => void }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      const { data: shop } = await supabase.from("shops").select("*").eq("user_id", data.user.id).single();
      if (shop) onLogin(shop);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      const { data: shop } = await supabase.from("shops").insert({ user_id: data.user.id, name: shopName, owner_name: ownerName }).select().single();
      if (shop) onLogin(shop);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif", color: "#fff" }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ background: "linear-gradient(135deg,#00C896,#00A87E)", width: 52, height: 52, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, color: "#fff", marginBottom: 12 }}>S</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Sen <span style={{ color: G }}>Business</span></div>
          <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 4 }}>Gestion simple pour votre boutique 🇸🇳</div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", gap: 4, background: "#0d1520", borderRadius: 12, padding: 4, marginBottom: 20 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: mode === m ? G : "transparent", color: mode === m ? "#fff" : "#9CA3AF" }}>
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>
          {mode === "register" && (
            <>
              <Field label="Nom de votre boutique *" placeholder="Epicerie Centrale" value={shopName} onChange={e => setShopName(e.target.value)} />
              <Field label="Votre nom *" placeholder="Amadou Diallo" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </>
          )}
          <Field label="Email *" type="email" placeholder="email@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Field label="Mot de passe *" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#f87171", fontSize: 13 }}>{error}</div>}
          <button onClick={mode === "login" ? handleLogin : handleRegister} style={{ ...btnG, width: "100%", padding: 13, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? "Chargement..." : mode === "login" ? "Se connecter →" : "Creer mon compte →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// DASHBOARD
function Dashboard({ shop }: { shop: Shop }) {
  const [stats, setStats] = useState({ ca: 0, ventes: 0, profit: 0, alerts: 0 });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: sales } = await supabase.from("sales").select("*").eq("shop_id", shop.id).gte("created_at", today);
      const { data: products } = await supabase.from("products").select("*").eq("shop_id", shop.id);
      const { data: allSales } = await supabase.from("sales").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(5);
      if (sales) {
        setStats({
          ca: sales.reduce((a, s) => a + s.total, 0),
          ventes: sales.length,
          profit: sales.reduce((a, s) => a + s.profit, 0),
          alerts: products ? products.filter((p: Product) => p.stock <= p.min_stock).length : 0,
        });
      }
      if (allSales) setRecentSales(allSales);
    };
    load();
  }, [shop.id]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Tableau de bord</h1>
      <p style={{ color: "#9CA3AF", fontSize: 13, margin: "0 0 20px" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} 👋</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatBox emoji="💰" label="CA Aujourd'hui" value={fmt(stats.ca)} />
        <StatBox emoji="🛒" label="Ventes" value={`${stats.ventes} ventes`} accent="#3B82F6" />
        <StatBox emoji="✨" label="Benefice" value={fmt(stats.profit)} accent="#F59E0B" />
        <StatBox emoji="⚠️" label="Stock alerte" value={`${stats.alerts} produits`} accent="#EF4444" />
      </div>
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Dernieres ventes</div>
        {recentSales.map(s => (
          <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(31,41,55,.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
              <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString("fr-FR")} · {s.payment}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: G, fontWeight: 800, fontSize: 14 }}>{fmt(s.total)}</div>
              <div style={{ color: "#6B7280", fontSize: 12 }}>+{fmt(s.profit)}</div>
            </div>
          </div>
        ))}
        {recentSales.length === 0 && <p style={{ color: "#6B7280", textAlign: "center", padding: 20 }}>Aucune vente aujourd&apos;hui</p>}
      </div>
    </div>
  );
}

// PRODUITS
function Produits({ shop, showToast }: { shop: Shop; showToast: (m: string, ok?: boolean) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [emoji, setEmoji] = useState("📦");
  const [f, setF] = useState({ name: "", buy: "", sell: "", stock: "", min: "5" });
  const EMOJIS = ["📦", "🌾", "🫙", "🧼", "🍬", "🥛", "🐟", "🍎", "🧴", "👕", "💊", "🔧"];

  useEffect(() => {
    supabase.from("products").select("*").eq("shop_id", shop.id).then(({ data }) => { if (data) setProducts(data); });
  }, [shop.id]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    if (!f.name || !f.sell) { showToast("Nom et prix requis", false); return; }
    const d = { name: f.name, emoji, buy_price: +f.buy || 0, sell_price: +f.sell, stock: +f.stock || 0, min_stock: +f.min || 5, shop_id: shop.id };
    if (editId) {
      const { data } = await supabase.from("products").update(d).eq("id", editId).select().single();
      if (data) { setProducts(products.map(p => p.id === editId ? data : p)); showToast("Modifie !"); }
    } else {
      const { data } = await supabase.from("products").insert(d).select().single();
      if (data) { setProducts([...products, data]); showToast("Ajoute !"); }
    }
    setModal(false);
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter(p => p.id !== id));
    showToast("Supprime");
  };

  const adj = async (id: string, d: number) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newStock = Math.max(0, p.stock + d);
    await supabase.from("products").update({ stock: newStock }).eq("id", id);
    setProducts(products.map(x => x.id === id ? { ...x, stock: newStock } : x));
  };

  const openAdd = () => { setEditId(null); setEmoji("📦"); setF({ name: "", buy: "", sell: "", stock: "", min: "5" }); setModal(true); };
  const openEdit = (p: Product) => { setEditId(p.id); setEmoji(p.emoji); setF({ name: p.name, buy: String(p.buy_price), sell: String(p.sell_price), stock: String(p.stock), min: String(p.min_stock) }); setModal(true); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Produits</h1><p style={{ color: "#9CA3AF", fontSize: 13, margin: "4px 0 0" }}>{products.length} produits</p></div>
        <button onClick={openAdd} style={{ ...btnG, padding: "10px 18px" }}>+ Ajouter</button>
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, paddingLeft: 40 }} />
      </div>
      {filtered.map(p => {
        const low = p.stock <= p.min_stock;
        return (
          <div key={p.id} style={{ background: "#111827", border: `1px solid ${low ? "#EF444450" : "#1F2937"}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ color: G, fontWeight: 800, fontSize: 13 }}>{fmt(p.sell_price)}</span>
                <span style={{ color: "#9CA3AF", fontSize: 12 }}>achat: {fmt(p.buy_price)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button onClick={() => adj(p.id, -1)} style={{ background: "#EF444420", color: "#EF4444", border: "1px solid #EF444440", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>−</button>
              <span style={{ color: low ? "#EF4444" : "#10B981", fontWeight: 700, fontSize: 13, minWidth: 28, textAlign: "center" }}>{p.stock}</span>
              <button onClick={() => adj(p.id, 1)} style={{ background: "#00C89620", color: G, border: "1px solid #00C89640", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>+</button>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => openEdit(p)} style={{ background: "rgba(31,41,55,.8)", border: "1px solid #1F2937", borderRadius: 9, padding: "7px 10px", cursor: "pointer", fontSize: 15 }}>✏️</button>
              <button onClick={() => del(p.id)} style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 9, padding: "7px 10px", cursor: "pointer", fontSize: 15 }}>🗑️</button>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📦</div><p>Aucun produit</p></div>}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Modifier" : "Nouveau produit"}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {EMOJIS.map(e => (<button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 20, background: emoji === e ? "rgba(0,200,150,.25)" : "transparent", border: `2px solid ${emoji === e ? G : "#1F2937"}`, borderRadius: 9, padding: "6px 8px", cursor: "pointer" }}>{e}</button>))}
        </div>
        <Field label="Nom *" placeholder="Ex: Riz 25kg" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prix achat (FCFA)" type="number" placeholder="0" value={f.buy} onChange={e => setF({ ...f, buy: e.target.value })} />
          <Field label="Prix vente (FCFA)" type="number" placeholder="0" value={f.sell} onChange={e => setF({ ...f, sell: e.target.value })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Stock actuel" type="number" placeholder="0" value={f.stock} onChange={e => setF({ ...f, stock: e.target.value })} />
          <Field label="Alerte min" type="number" placeholder="5" value={f.min} onChange={e => setF({ ...f, min: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModal(false)} style={{ ...btnO, flex: 1 }}>Annuler</button>
          <button onClick={save} style={{ ...btnG, flex: 1 }}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

// CAISSE
function Caisse({ shop, showToast }: { shop: Shop; showToast: (m: string, ok?: boolean) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<(Product & { qty: number })[]>([]);
  const [pay, setPay] = useState("Cash");
  const [client, setClient] = useState("");
  const [tab, setTab] = useState("vente");
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("products").select("*").eq("shop_id", shop.id).then(({ data }) => { if (data) setProducts(data); });
    supabase.from("sales").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => { if (data) setSales(data); });
  }, [shop.id]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const sub = cart.reduce((a, i) => a + i.sell_price * i.qty, 0);

  const addItem = (p: Product) => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
  });

  const upd = (id: string, d: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (item.qty + d < 1) { setCart(cart.filter(i => i.id !== id)); return; }
    setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + d } : i));
  };

  const encaisser = async () => {
    if (!cart.length) return;
    const profit = cart.reduce((a, i) => a + (i.sell_price - i.buy_price) * i.qty, 0);
    const label = (client || "Client") + " - " + cart.map(i => i.name).join(", ");
    const { data: sale } = await supabase.from("sales").insert({ shop_id: shop.id, label, total: sub, profit, payment: pay, client_name: client }).select().single();
    if (sale) {
      setSales(prev => [sale, ...prev]);
      for (const item of cart) {
        const p = products.find(x => x.id === item.id);
        if (p) await supabase.from("products").update({ stock: Math.max(0, p.stock - item.qty) }).eq("id", item.id);
      }
      setProducts(prev => prev.map(p => { const ci = cart.find(i => i.id === p.id); return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p; }));
      setCart([]); setClient("");
      showToast(`${fmt(sub)} encaisse via ${pay} 💰`);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Caisse</h1>
      <p style={{ color: "#9CA3AF", fontSize: 13, margin: "0 0 16px" }}>Enregistrez une vente rapidement</p>
      <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 12, padding: 4, width: "fit-content", display: "flex", gap: 4, marginBottom: 20 }}>
        {[["vente", "🛒 Nouvelle vente"], ["histo", "📋 Historique"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: tab === k ? G : "transparent", color: tab === k ? "#fff" : "#9CA3AF" }}>{l}</button>
        ))}
      </div>
      {tab === "vente" ? (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
          <div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, paddingLeft: 40 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => addItem(p)} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{p.emoji}</div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ color: G, fontWeight: 800, fontSize: 14 }}>{fmt(p.sell_price)}</div>
                  <div style={{ color: p.stock <= p.min_stock ? "#EF4444" : "#9CA3AF", fontSize: 11, marginTop: 2 }}>Stock: {p.stock}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ ...cardStyle, position: "sticky", top: 72 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1F2937", fontWeight: 800, fontSize: 15 }}>🛒 Panier ({cart.reduce((a, i) => a + i.qty, 0)})</div>
              {cart.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div><p style={{ color: "#9CA3AF", fontSize: 13 }}>Panier vide</p></div>
              ) : (
                <>
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid rgba(31,41,55,.2)" }}>
                        <span style={{ fontSize: 18 }}>{item.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff" }}>{item.name}</div>
                          <div style={{ color: G, fontSize: 12, fontWeight: 700 }}>{fmt(item.sell_price)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button onClick={() => upd(item.id, -1)} style={{ width: 24, height: 24, background: "#1F2937", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, width: 18, textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => upd(item.id, 1)} style={{ width: 24, height: 24, background: "#1F2937", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                        <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 16 }}>
                    <Field label="Client (optionnel)" placeholder="Nom du client" value={client} onChange={e => setClient(e.target.value)} />
                    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                      {[["Cash", "💵"], ["Wave", "💙"], ["Orange", "🟠"]].map(([k, e]) => (
                        <button key={k} onClick={() => setPay(k)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `2px solid ${pay === k ? G : "#1F2937"}`, background: pay === k ? "rgba(0,200,150,.15)" : "transparent", color: pay === k ? G : "#9CA3AF", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{e} {k}</button>
                      ))}
                    </div>
                    <div style={{ background: "#0d1520", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                        <span style={{ fontSize: 15 }}>TOTAL</span>
                        <span style={{ color: G, fontSize: 22 }}>{fmt(sub)}</span>
                      </div>
                    </div>
                    <button onClick={encaisser} style={{ ...btnG, width: "100%", padding: 14, fontSize: 15 }}>Encaisser {fmt(sub)}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, marginBottom: 16 }}>Toutes les ventes</div>
          {sales.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(31,41,55,.4)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
                <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString("fr-FR")} · {s.payment}</div>
              </div>
              <div style={{ color: G, fontWeight: 800 }}>{fmt(s.total)}</div>
            </div>
          ))}
          {sales.length === 0 && <p style={{ color: "#6B7280", textAlign: "center", padding: 24 }}>Aucune vente</p>}
        </div>
      )}
    </div>
  );
}

// DETTES
function Dettes({ shop, showToast }: { shop: Shop; showToast: (m: string, ok?: boolean) => void }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [f, setF] = useState({ name: "", phone: "", total: "" });

  useEffect(() => {
    supabase.from("debts").select("*").eq("shop_id", shop.id).then(({ data }) => { if (data) setDebts(data); });
  }, [shop.id]);

  const saveDebt = async () => {
    if (!f.name || !f.total) { showToast("Nom et montant requis", false); return; }
    const { data } = await supabase.from("debts").insert({ shop_id: shop.id, client_name: f.name, phone: f.phone, total: +f.total, paid: 0 }).select().single();
    if (data) { setDebts([...debts, data]); showToast("Dette ajoutee !"); }
    setAddModal(false); setF({ name: "", phone: "", total: "" });
  };

  const savePay = async () => {
    if (!payAmt || !payId) { showToast("Entrez un montant", false); return; }
    const d = debts.find(x => x.id === payId);
    if (!d) return;
    const newPaid = Math.min(d.paid + +payAmt, d.total);
    await supabase.from("debts").update({ paid: newPaid }).eq("id", payId);
    setDebts(debts.map(x => x.id === payId ? { ...x, paid: newPaid } : x));
    showToast(newPaid >= d.total ? "Dette soldee ! 🎉" : `${fmt(+payAmt)} enregistre !`);
    setPayModal(false);
  };

  const totalDu = debts.reduce((a, d) => a + (d.total - d.paid), 0);
  const totalRec = debts.reduce((a, d) => a + d.paid, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Dettes Clients</h1><p style={{ color: "#9CA3AF", fontSize: 13, margin: "4px 0 0" }}>{debts.filter(d => d.total > d.paid).length} debiteurs actifs</p></div>
        <button onClick={() => setAddModal(true)} style={{ ...btnG, padding: "10px 18px" }}>+ Ajouter</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <StatBox emoji="💸" label="Total du" value={fmt(totalDu)} accent="#EF4444" />
        <StatBox emoji="✅" label="Recupere" value={fmt(totalRec)} />
      </div>
      {debts.map(d => {
        const rem = d.total - d.paid;
        const pct = Math.round((d.paid / d.total) * 100);
        const ok = rem === 0;
        return (
          <div key={d.id} style={{ background: "#111827", border: `1px solid ${ok ? "#166534" : "#1F2937"}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: ok ? "rgba(0,200,150,.2)" : "rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: ok ? G : "#EF4444", flexShrink: 0 }}>{ok ? "✓" : d.client_name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{d.client_name}</div>
                  {d.phone && <div style={{ color: "#9CA3AF", fontSize: 12 }}>+{d.phone}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: ok ? G : "#EF4444", fontWeight: 900, fontSize: 18 }}>{ok ? "Solde ✓" : `-${fmt(rem)}`}</div>
                <div style={{ color: "#9CA3AF", fontSize: 12 }}>sur {fmt(d.total)}</div>
              </div>
            </div>
            <div style={{ background: "#1F2937", borderRadius: 99, height: 6, overflow: "hidden", margin: "8px 0" }}>
              <div style={{ height: 6, borderRadius: 99, background: ok ? G : "#F59E0B", width: `${pct}%`, transition: "width .5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 6 }}>
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>Paye: {fmt(d.paid)} ({pct}%)</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {d.phone && <a href={`https://wa.me/${d.phone}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(37,211,102,.15)", border: "1px solid rgba(37,211,102,.3)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#25D366", textDecoration: "none" }}>💬 Relancer</a>}
                {!ok && <button onClick={() => { setPayId(d.id); setPayAmt(""); setPayModal(true); }} style={{ background: "rgba(0,200,150,.15)", border: "1px solid rgba(0,200,150,.3)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: G, cursor: "pointer" }}>💰 Paiement</button>}
                <button onClick={async () => { if (!confirm("Supprimer ?")) return; await supabase.from("debts").delete().eq("id", d.id); setDebts(debts.filter(x => x.id !== d.id)); showToast("Supprimee"); }} style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "6px 8px", fontSize: 13, cursor: "pointer" }}>🗑️</button>
              </div>
            </div>
          </div>
        );
      })}
      {debts.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><p>Aucune dette !</p></div>}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Nouvelle dette">
        <Field label="Nom du client *" placeholder="Amadou Diallo" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <Field label="Telephone (WhatsApp)" placeholder="221771234567" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <Field label="Montant du (FCFA) *" type="number" placeholder="0" value={f.total} onChange={e => setF({ ...f, total: e.target.value })} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setAddModal(false)} style={{ ...btnO, flex: 1 }}>Annuler</button>
          <button onClick={saveDebt} style={{ ...btnG, flex: 1 }}>Enregistrer</button>
        </div>
      </Modal>
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Enregistrer un paiement">
        {payId && (() => {
          const d = debts.find(x => x.id === payId);
          if (!d) return null;
          const rem = d.total - d.paid;
          return (
            <>
              <div style={{ background: "#0d1520", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.client_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#9CA3AF" }}>Reste:</span><span style={{ color: "#EF4444", fontWeight: 800 }}>{fmt(rem)}</span></div>
              </div>
              <Field label="Montant recu (FCFA) *" type="number" placeholder="0" value={payAmt} onChange={e => setPayAmt(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[[25, "25%"], [50, "50%"], [100, "Tout"]].map(([pct, lbl]) => (
                  <button key={String(lbl)} onClick={() => setPayAmt(String(Math.round(rem * +pct / 100)))} style={{ flex: 1, padding: 8, background: "#0d1520", border: "1px solid #1F2937", borderRadius: 8, color: "#9CA3AF", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{lbl}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPayModal(false)} style={{ ...btnO, flex: 1 }}>Annuler</button>
                <button onClick={savePay} style={{ ...btnG, flex: 1 }}>Confirmer 💰</button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

// PAYWALL
function Paywall({ shop }: { shop: Shop }) {
  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif", color: "#fff" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Essai gratuit terminé</h1>
        <p style={{ color: "#9CA3AF", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Votre essai de 7 jours est terminé.<br/>
          Passez au plan Pro pour continuer.
        </p>
        <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <div style={{ background: "rgba(0,200,150,.1)", border: "1px solid rgba(0,200,150,.3)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ color: "#00C896", fontWeight: 900, fontSize: 28 }}>5 000 FCFA</div>
            <div style={{ color: "#9CA3AF", fontSize: 13 }}>par mois</div>
          </div>
          <div style={{ textAlign: "left", marginBottom: 20 }}>
            {["Produits illimités", "Ventes illimitées", "Suivi des dettes", "Rapports complets", "Support WhatsApp"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(31,41,55,.4)" }}>
                <span style={{ color: "#00C896", fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#0d1520", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 8 }}>Envoyez 5 000 FCFA sur Wave :</p>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 4 }}>+221 78 658 46 22</div>
            <p style={{ color: "#9CA3AF", fontSize: 12 }}>Objet : SenBusiness + {shop.name}</p>
          </div>
          <a href={`https://wa.me/221786584622?text=Bonjour je veux activer mon abonnement Sen Business pour la boutique: ${shop.name}`} style={{ display: "block", background: "linear-gradient(135deg,#25D366,#1ebe5c)", color: "#fff", borderRadius: 12, padding: "14px 0", fontWeight: 700, fontSize: 15, textDecoration: "none", textAlign: "center" }}>
            💬 Contacter sur WhatsApp
          </a>
        </div>
        <p style={{ color: "#6B7280", fontSize: 12 }}>Après paiement, votre compte sera activé dans les 2h</p>
      </div>
    </div>
  );
}

// ROOT
export default function SenBusiness() {
  const [screen, setScreen] = useState<"login" | "app">("login");
  const [shop, setShop] = useState<Shop | null>(null);
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
const [blocked, setBlocked] = useState(false);
  const [toastOk, setToastOk] = useState(true);

  const showToast = (msg: string, ok = true) => { setToastMsg(msg); setToastOk(ok); setTimeout(() => setToastMsg(""), 2600); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("shops").select("*").eq("user_id", session.user.id).single().then(({ data }) => {
          if (data) { setShop(data); setScreen("app"); }
        });
      }
    });
  }, []);

  if (screen === "login") return <Login onLogin={s => { setShop(s); setScreen("app"); }} />;
  if (!shop) return null;// Vérifier essai expiré
  const trialExpired = shop.trial_ends_at && new Date() > new Date(shop.trial_ends_at) && shop.plan === 'trial';
  if (trialExpired) return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif", color: "#fff" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Essai gratuit terminé</h1>
        <p style={{ color: "#9CA3AF", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Votre essai de 7 jours est terminé.<br/>Passez au plan Pro pour continuer.</p>
        <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 20, padding: 28 }}>
          <div style={{ color: "#00C896", fontWeight: 900, fontSize: 32, marginBottom: 4 }}>5 000 FCFA</div>
          <div style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 20 }}>par mois</div>
          <div style={{ background: "#0d1520", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 8 }}>Envoyez sur Wave :</p>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>+221 78 658 46 22</div>
            <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>Objet : SenBusiness + {shop.name}</p>
          </div>
          <a href={`https://wa.me/221786584622?text=Bonjour je veux activer mon abonnement Sen Business pour la boutique: ${shop.name}`} style={{ display: "block", background: "linear-gradient(135deg,#25D366,#1ebe5c)", color: "#fff", borderRadius: 12, padding: "14px 0", fontWeight: 700, fontSize: 15, textDecoration: "none", textAlign: "center" }}>
            💬 Contacter sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  );

  const nav = [{ id: "dashboard", e: "📊", l: "Dashboard" }, { id: "produits", e: "📦", l: "Produits" }, { id: "caisse", e: "🛒", l: "Caisse" }, { id: "dettes", e: "💸", l: "Dettes" }, { id: "logout", e: "🚪", l: "Quitter" }];

  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: "#fff" }}>
      {toastMsg && <Toast msg={toastMsg} ok={toastOk} />}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 150 }} />}
      <div style={{ background: "rgba(10,15,30,.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1F2937", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ background: "linear-gradient(135deg,#00C896,#00A87E)", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16, flexShrink: 0 }}>S</div>
        <span style={{ fontWeight: 800, fontSize: 15, flex: 1 }}>Sen <span style={{ color: G }}>Business</span> <span style={{ color: "#6B7280", fontSize: 13, fontWeight: 400 }}>— {shop.name}</span></span>
        <div onClick={() => setMenuOpen(!menuOpen)} style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#00C896,#00A87E)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, cursor: "pointer", position: "relative" }}>
          {shop.owner_name?.charAt(0) || "U"}
          {menuOpen && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 44, right: 0, background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: 8, zIndex: 200, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #1F2937", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{shop.owner_name}</div>
                <div style={{ color: "#9CA3AF", fontSize: 12 }}>{shop.name}</div>
              </div>
              <button onClick={async () => { window.location.href = "/"; }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontWeight: 600, fontSize: 13, borderRadius: 8 }}>
                🚪 Deconnexion
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "20px 16px 100px", maxWidth: 900, margin: "0 auto" }}>
        {page === "dashboard" && <Dashboard shop={shop} />}
        {page === "produits" && <Produits shop={shop} showToast={showToast} />}
        {page === "caisse" && <Caisse shop={shop} showToast={showToast} />}
        {page === "dettes" && <Dettes shop={shop} showToast={showToast} />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,15,30,.97)", backdropFilter: "blur(16px)", borderTop: "1px solid #1F2937", display: "flex", zIndex: 50 }}>
        {nav.map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => n.id === "logout" ? (async () => { await supabase.auth.signOut(); window.location.href = "/"; })() : setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 14px", border: "none", background: "none", cursor: "pointer", position: "relative" }}>
              {active && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: G, borderRadius: "0 0 4px 4px" }} />}
              <span style={{ fontSize: 20, marginBottom: 3 }}>{n.e}</span>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? G : "#9CA3AF" }}>{n.l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}