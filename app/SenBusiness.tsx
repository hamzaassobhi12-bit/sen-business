"use client";
import { useState } from "react";

export default function SenBusiness() {
  const [screen, setScreen] = useState("login");
  const [page, setPage] = useState("dashboard");

  if (screen === "login") {
    return (
      <div style={{background:"#0A0F1E",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui",color:"#fff"}}>
        <div style={{width:"100%",maxWidth:340,padding:20}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{background:"linear-gradient(135deg,#00C896,#00A87E)",width:52,height:52,borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:24,color:"#fff",marginBottom:12}}>S</div>
            <div style={{fontWeight:900,fontSize:22}}>Sen <span style={{color:"#00C896"}}>Business</span></div>
            <div style={{color:"#9CA3AF",fontSize:13,marginTop:4}}>Gestion simple pour votre boutique</div>
          </div>
          <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:20,padding:28}}>
            <div style={{marginBottom:14}}>
              <label style={{color:"#9CA3AF",fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>Telephone</label>
              <input placeholder="+221 77 000 0000" style={{width:"100%",background:"#0d1520",border:"1px solid #1F2937",borderRadius:10,color:"#fff",padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{color:"#9CA3AF",fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>Mot de passe</label>
              <input type="password" placeholder="••••••••" style={{width:"100%",background:"#0d1520",border:"1px solid #1F2937",borderRadius:10,color:"#fff",padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button
              onClick={() => setScreen("app")}
              style={{width:"100%",background:"linear-gradient(135deg,#00C896,#00A87E)",color:"#fff",border:"none",borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10}}>
              Se connecter
            </button>
            <button
              onClick={() => setScreen("app")}
              style={{width:"100%",background:"transparent",color:"#00C896",border:"2px solid #00C896",borderRadius:12,padding:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Essayer la demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    {id:"dashboard",e:"📊",l:"Dashboard"},
    {id:"produits",e:"📦",l:"Produits"},
    {id:"caisse",e:"🛒",l:"Caisse"},
    {id:"dettes",e:"💸",l:"Dettes"},
  ];

  return (
    <div style={{background:"#0A0F1E",minHeight:"100vh",fontFamily:"system-ui",color:"#fff"}}>
      <div style={{background:"rgba(10,15,30,.96)",borderBottom:"1px solid #1F2937",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{background:"linear-gradient(135deg,#00C896,#00A87E)",width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16}}>S</div>
        <span style={{fontWeight:800,fontSize:15,flex:1}}>Sen <span style={{color:"#00C896"}}>Business</span></span>
        <button onClick={() => setScreen("login")} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:13,fontWeight:600}}>Deconnexion</button>
      </div>

      <div style={{padding:"20px 16px 100px",maxWidth:900,margin:"0 auto"}}>
        {page === "dashboard" && <Dashboard />}
        {page === "produits" && <Produits />}
        {page === "caisse" && <Caisse />}
        {page === "dettes" && <Dettes />}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,15,30,.97)",borderTop:"1px solid #1F2937",display:"flex",zIndex:50}}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 14px",border:"none",background:"none",cursor:"pointer",position:"relative"}}>
            {page===n.id && <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:"#00C896",borderRadius:"0 0 4px 4px"}}/>}
            <span style={{fontSize:20,marginBottom:3}}>{n.e}</span>
            <span style={{fontSize:11,fontWeight:page===n.id?700:500,color:page===n.id?"#00C896":"#9CA3AF"}}>{n.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,margin:"0 0 20px"}}>Tableau de bord</h1>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {e:"💰",l:"CA Aujourd'hui",v:"51 000 FCFA",c:"#00C896"},
          {e:"🛒",l:"Ventes",v:"8 ventes",c:"#3B82F6"},
          {e:"✨",l:"Benefice",v:"18 500 FCFA",c:"#F59E0B"},
          {e:"⚠️",l:"Stock alerte",v:"2 produits",c:"#EF4444"},
        ].map((s,i) => (
          <div key={i} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:16,padding:18}}>
            <div style={{fontSize:24,marginBottom:8}}>{s.e}</div>
            <div style={{color:"#9CA3AF",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{s.l}</div>
            <div style={{color:s.c,fontSize:20,fontWeight:900}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:16,padding:18}}>
        <div style={{fontWeight:800,marginBottom:16}}>Dernieres ventes</div>
        {[
          {l:"Amadou - Riz+Huile",d:"Aujourd'hui",p:"Wave",t:"20 500 FCFA"},
          {l:"Fatou - Savon x2",d:"Aujourd'hui",p:"Cash",t:"9 600 FCFA"},
          {l:"Ibrahima - Sucre",d:"Hier",p:"Orange",t:"7 500 FCFA"},
        ].map((s,i) => (
          <div key={i} style={{padding:"12px 0",borderBottom:"1px solid rgba(31,41,55,.4)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14}}>{s.l}</div>
              <div style={{color:"#9CA3AF",fontSize:12,marginTop:2}}>{s.d} · {s.p}</div>
            </div>
            <div style={{color:"#00C896",fontWeight:800,fontSize:14}}>{s.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Produits() {
  const [prods, setProds] = useState([
    {id:1,name:"Riz 25kg",sell:15000,stock:45,min:10,emoji:"🌾"},
    {id:2,name:"Huile 5L",sell:5500,stock:8,min:10,emoji:"🫙"},
    {id:3,name:"Sucre 10kg",sell:7500,stock:3,min:8,emoji:"🍬"},
    {id:4,name:"Savon x12",sell:4800,stock:32,min:15,emoji:"🧼"},
  ]);
  const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(n) + " FCFA";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:900,margin:0}}>Produits</h1>
        <button style={{background:"linear-gradient(135deg,#00C896,#00A87E)",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Ajouter</button>
      </div>
      {prods.map(p => (
        <div key={p.id} style={{background:"#111827",border:`1px solid ${p.stock<=p.min?"#EF444450":"#1F2937"}`,borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <span style={{fontSize:28}}>{p.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>{p.name}</div>
            <div style={{color:"#00C896",fontWeight:800,fontSize:13,marginTop:4}}>{fmt(p.sell)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setProds(prods.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))} style={{background:"#EF444420",color:"#EF4444",border:"1px solid #EF444440",borderRadius:7,padding:"4px 9px",cursor:"pointer",fontWeight:800,fontSize:14}}>−</button>
            <span style={{color:p.stock<=p.min?"#EF4444":"#10B981",fontWeight:700,fontSize:13,minWidth:28,textAlign:"center"}}>{p.stock}</span>
            <button onClick={()=>setProds(prods.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))} style={{background:"#00C89620",color:"#00C896",border:"1px solid #00C89640",borderRadius:7,padding:"4px 9px",cursor:"pointer",fontWeight:800,fontSize:14}}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Caisse() {
  const [cart, setCart] = useState<{id:number;name:string;price:number;emoji:string;qty:number}[]>([]);
  const [pay, setPay] = useState("Cash");
  const [done, setDone] = useState(false);
  const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(n) + " FCFA";
  const prods = [
    {id:1,name:"Riz 25kg",price:15000,emoji:"🌾"},
    {id:2,name:"Huile 5L",price:5500,emoji:"🫙"},
    {id:3,name:"Sucre 10kg",price:7500,emoji:"🍬"},
    {id:4,name:"Savon x12",price:4800,emoji:"🧼"},
  ];
  const total = cart.reduce((a,i) => a+i.price*i.qty, 0);
  const add = (p: typeof prods[0]) => setCart(prev => {
    const ex = prev.find(i => i.id===p.id);
    return ex ? prev.map(i => i.id===p.id?{...i,qty:i.qty+1}:i) : [...prev,{...p,qty:1}];
  });
  if (done) return (
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:64,marginBottom:16}}>✅</div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>Vente enregistree !</div>
      <div style={{color:"#00C896",fontSize:20,fontWeight:800,marginBottom:24}}>{fmt(total)}</div>
      <button onClick={()=>{setCart([]);setDone(false);}} style={{background:"linear-gradient(135deg,#00C896,#00A87E)",color:"#fff",border:"none",borderRadius:12,padding:"12px 32px",fontWeight:700,fontSize:15,cursor:"pointer"}}>Nouvelle vente</button>
    </div>
  );
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,margin:"0 0 16px"}}>Caisse</h1>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
        {prods.map(p => (
          <button key={p.id} onClick={()=>add(p)} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:14,padding:14,cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{fontSize:26,marginBottom:8}}>{p.emoji}</div>
            <div style={{color:"#fff",fontWeight:600,fontSize:13,marginBottom:4}}>{p.name}</div>
            <div style={{color:"#00C896",fontWeight:800,fontSize:14}}>{fmt(p.price)}</div>
          </button>
        ))}
      </div>
      {cart.length > 0 && (
        <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:16,padding:18}}>
          <div style={{fontWeight:800,marginBottom:12}}>🛒 Panier</div>
          {cart.map(item => (
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(31,41,55,.3)"}}>
              <span>{item.emoji} {item.name}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setCart(cart.map(i=>i.id===item.id&&i.qty>1?{...i,qty:i.qty-1}:i).filter(i=>!(i.id===item.id&&i.qty===1)))} style={{background:"#1F2937",border:"none",borderRadius:6,width:24,height:24,cursor:"pointer",color:"#fff",fontWeight:700}}>−</button>
                <span style={{color:"#fff",fontWeight:700}}>{item.qty}</span>
                <button onClick={()=>setCart(cart.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{background:"#1F2937",border:"none",borderRadius:6,width:24,height:24,cursor:"pointer",color:"#fff",fontWeight:700}}>+</button>
                <span style={{color:"#00C896",fontWeight:700,minWidth:80,textAlign:"right"}}>{fmt(item.price*item.qty)}</span>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:6,margin:"14px 0"}}>
            {["Cash","Wave","Orange"].map(k => (
              <button key={k} onClick={()=>setPay(k)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`2px solid ${pay===k?"#00C896":"#1F2937"}`,background:pay===k?"rgba(0,200,150,.15)":"transparent",color:pay===k?"#00C896":"#9CA3AF",cursor:"pointer",fontWeight:700,fontSize:12}}>
                {k==="Cash"?"💵":k==="Wave"?"💙":"🟠"} {k}
              </button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:18,marginBottom:14}}>
            <span>TOTAL</span><span style={{color:"#00C896"}}>{fmt(total)}</span>
          </div>
          <button onClick={()=>setDone(true)} style={{width:"100%",background:"linear-gradient(135deg,#00C896,#00A87E)",color:"#fff",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>
            Encaisser {fmt(total)}
          </button>
        </div>
      )}
    </div>
  );
}

function Dettes() {
  const [dettes, setDettes] = useState([
    {id:1,name:"Moussa Camara",total:45000,paid:20000},
    {id:2,name:"Aissatou Diop",total:25000,paid:0},
    {id:3,name:"Oumar Faye",total:18000,paid:18000},
  ]);
  const fmt = (n: number) => new Intl.NumberFormat("fr-SN").format(n) + " FCFA";
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:900,margin:"0 0 20px"}}>Dettes Clients</h1>
      {dettes.map(d => {
        const rem = d.total - d.paid;
        const pct = Math.round((d.paid/d.total)*100);
        const ok = rem === 0;
        return (
          <div key={d.id} style={{background:"#111827",border:`1px solid ${ok?"#166534":"#1F2937"}`,borderRadius:16,padding:18,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15}}>{d.name}</div>
              <div style={{color:ok?"#00C896":"#EF4444",fontWeight:900,fontSize:16}}>{ok?"Solde ✓":`-${fmt(rem)}`}</div>
            </div>
            <div style={{background:"#1F2937",borderRadius:99,height:6,marginBottom:12}}>
              <div style={{height:6,borderRadius:99,background:ok?"#00C896":"#F59E0B",width:`${pct}%`}}/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              {!ok && (
                <button onClick={()=>setDettes(dettes.map(x=>x.id===d.id?{...x,paid:x.total}:x))} style={{background:"rgba(0,200,150,.15)",border:"1px solid rgba(0,200,150,.3)",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,color:"#00C896",cursor:"pointer"}}>
                  Paye integralement
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}