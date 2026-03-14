import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

/* ════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════ */
const T = {
  black:"#000000",white:"#FFFFFF",green:"#06C167",greenLight:"#E6F9F1",greenDark:"#038C48",
  gray50:"#F6F6F6",gray100:"#EBEBEB",gray200:"#D3D3D3",gray400:"#8C8C8C",gray600:"#545454",gray800:"#282828",
  red:"#E11900",redLight:"#FCEAE8",amber:"#FFC043",amberLight:"#FFF3D9",blue:"#276EF1",blueLight:"#EEF3FE",
};
const F = "'Manrope', sans-serif";

/* ════════════════════════════════════════════
   RESPONSIVE HOOK
════════════════════════════════════════════ */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, width: w };
}

/* ════════════════════════════════════════════
   DATA
════════════════════════════════════════════ */
const DEPOTS = [
  { id:1, name:"Nepal Energies", location:"Apapa, Lagos", pms:795, ago:null, stock:61200, cap:85000, rating:4.8, orders:312, slots:5, eta:"4–6h" },
  { id:2, name:"Eterna Plc", location:"Warri, Delta", pms:797, ago:1185, stock:38400, cap:60000, rating:4.6, orders:198, slots:3, eta:"6–8h" },
  { id:3, name:"Matrix Energy", location:"Port Harcourt, Rivers", pms:800, ago:1190, stock:53200, cap:70000, rating:4.7, orders:241, slots:4, eta:"8–10h" },
  { id:4, name:"MRS Oil", location:"Kano, Kano State", pms:803, ago:1175, stock:31500, cap:45000, rating:4.5, orders:112, slots:2, eta:"5–7h" },
];
const ORDERS = [
  { id:"VTL-00841", buyer:"Chukwuma Fuels Ltd", depot:"Nepal Energies", product:"PMS", vol:90000, value:71700000, status:"delivered", placed:"Mar 8", trucks:3, progress:100 },
  { id:"VTL-00838", buyer:"Chukwuma Fuels Ltd", depot:"Nepal Energies", product:"PMS", vol:66000, value:52470000, status:"in_transit", placed:"Mar 10", trucks:2, progress:65 },
  { id:"VTL-00835", buyer:"Chukwuma Fuels Ltd", depot:"Eterna Plc", product:"AGO", vol:33000, value:39105000, status:"confirmed", placed:"Mar 10", trucks:1, progress:20 },
];
const INCOMING = [
  { id:"VTL-00843", buyer:"Horizon Petroleum", type:"Petrol Station", product:"PMS", vol:99000, value:78705000, trucks:3, location:"Ikeja, Lagos", submitted:"12 min ago", slaLeft:"1h 48m", status:"pending" },
  { id:"VTL-00842", buyer:"Skyline Aviation", type:"Aviation", product:"AGO", vol:33000, value:39105000, trucks:1, location:"Murtala Airport", submitted:"34 min ago", slaLeft:"1h 26m", status:"pending" },
  { id:"VTL-00840", buyer:"Femi Oil & Gas", type:"Petrol Station", product:"PMS", vol:66000, value:52470000, trucks:2, location:"Lekki, Lagos", submitted:"2h ago", slaLeft:"Confirmed", status:"confirmed" },
];
const PRICE_HISTORY = [
  {day:"Mar 4",pms:792,ago:1170},{day:"Mar 5",pms:793,ago:1172},{day:"Mar 6",pms:795,ago:1175},
  {day:"Mar 7",pms:794,ago:1174},{day:"Mar 8",pms:797,ago:1180},{day:"Mar 9",pms:800,ago:1185},{day:"Mar 10",pms:795,ago:1185},
];
const REVENUE_DATA = [
  {month:"Oct",revenue:95},{month:"Nov",revenue:124},{month:"Dec",revenue:148},
  {month:"Jan",revenue:167},{month:"Feb",revenue:198},{month:"Mar",revenue:218},
];
const DAILY = [
  {day:"Mon",pms:4,ago:2},{day:"Tue",pms:3,ago:1},{day:"Wed",pms:5,ago:3},
  {day:"Thu",pms:6,ago:2},{day:"Fri",pms:4,ago:4},{day:"Sat",pms:7,ago:1},{day:"Sun",pms:2,ago:0},
];
const SLOTS = [
  {time:"07:00",bay:"Bay 1",order:"VTL-00841",product:"PMS",trucks:3,status:"in_transit"},
  {time:"09:00",bay:"Bay 2",order:"VTL-00839",product:"PMS",trucks:4,status:"loading"},
  {time:"11:00",bay:"Bay 1",order:"VTL-00840",product:"PMS",trucks:2,status:"confirmed"},
  {time:"13:00",bay:"Bay 2",order:"VTL-00842",product:"AGO",trucks:1,status:"pending"},
  {time:"15:00",bay:"Bay 1",order:"—",product:"—",trucks:null,status:"open"},
  {time:"17:00",bay:"Bay 2",order:"—",product:"—",trucks:null,status:"open"},
];
const BUYERS_DATA = [
  {name:"Chukwuma Fuels Ltd",type:"Petrol Station",orders:7,vol:"363k L",spend:"₦280.5M",score:720,tier:"Silver",lastOrder:"Mar 10"},
  {name:"Horizon Petroleum",type:"Petrol Station",orders:5,vol:"215k L",spend:"₦171.3M",score:810,tier:"Gold",lastOrder:"Mar 9"},
  {name:"Silvergate Energy",type:"Petrol Station",orders:4,vol:"396k L",spend:"₦316.5M",score:680,tier:"Silver",lastOrder:"Mar 8"},
  {name:"Skyline Aviation",type:"Aviation",orders:3,vol:"99k L",spend:"₦117.3M",score:760,tier:"Silver",lastOrder:"Mar 7"},
  {name:"Femi Oil & Gas",type:"Petrol Station",orders:2,vol:"66k L",spend:"₦52.5M",score:590,tier:"Bronze",lastOrder:"Mar 5"},
];
const TXN = [
  {id:"TXN-4421",desc:"Wallet Top-up",amount:"+₦150,000,000",date:"Mar 10",type:"credit"},
  {id:"TXN-4420",desc:"Order VTL-00841 — Escrow Hold",amount:"-₦71,700,000",date:"Mar 8",type:"debit"},
  {id:"TXN-4419",desc:"Order VTL-00838 — Escrow Hold",amount:"-₦52,470,000",date:"Mar 10",type:"debit"},
  {id:"TXN-4418",desc:"Order VTL-00841 — Escrow Released",amount:"₦71,700,000",date:"Mar 8",type:"released"},
];

/* ════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════ */
const STATUS_CFG = {
  delivered:{label:"Delivered",bg:T.greenLight,color:T.greenDark},
  in_transit:{label:"In Transit",bg:T.blueLight,color:T.blue},
  confirmed:{label:"Confirmed",bg:T.amberLight,color:"#8A5C00"},
  loading:{label:"Loading",bg:T.gray100,color:T.gray600},
  disputed:{label:"Disputed",bg:T.redLight,color:T.red},
  pending:{label:"Pending",bg:T.gray100,color:T.gray600},
  open:{label:"Available",bg:T.greenLight,color:T.greenDark},
};

function Badge({status}) {
  const c = STATUS_CFG[status]||{label:status,bg:T.gray100,color:T.gray600};
  return <span style={{background:c.bg,color:c.color,fontSize:"11px",fontWeight:700,padding:"3px 8px",borderRadius:"4px",display:"inline-block",whiteSpace:"nowrap"}}>{c.label}</span>;
}

const ChartTip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:T.black,padding:"10px 14px",borderRadius:"6px",fontFamily:F}}>
      <div style={{color:T.gray400,fontSize:"11px",marginBottom:"5px"}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:T.white,fontSize:"12px",fontWeight:700}}>{p.name}: {p.value}</div>)}
    </div>
  );
};

/* Nav icon SVG */
function Icon({d,size=18}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

/* Stat card */
function KpiCard({label,value,sub,alert,accent}) {
  return (
    <div style={{background:T.white,padding:"18px 20px",borderLeft:alert?`3px solid ${T.amber}`:accent?`3px solid ${accent}`:"none"}}>
      <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>{label}</div>
      <div style={{fontSize:"24px",fontWeight:800,color:alert?"#8A5C00":T.black,letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:"11px",color:T.gray400,marginTop:"5px",fontWeight:600}}>{sub}</div>}
    </div>
  );
}

/* Section header */
function SectionHead({title,sub,right}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px",gap:"12px",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:"14px",fontWeight:800,color:T.black}}>{title}</div>
        {sub&&<div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{sub}</div>}
      </div>
      {right&&<div style={{flexShrink:0}}>{right}</div>}
    </div>
  );
}

/* Card wrapper */
function Card({children,pad=true,style={}}) {
  return <div style={{border:`1px solid ${T.gray100}`,background:T.white,...(pad?{padding:"20px"}:{}),marginBottom:"14px",...style}}>{children}</div>;
}

/* ════════════════════════════════════════════
   SIDEBAR (desktop) / BOTTOM NAV (mobile)
════════════════════════════════════════════ */
function Sidebar({navItems,active,setActive,identity,portalLabel,isMobile}) {
  if (isMobile) {
    return (
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.black,borderTop:"1px solid #1A1A1A",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setActive(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 4px",background:"none",border:"none",cursor:"pointer",fontFamily:F,color:active===n.id?T.green:"#555",position:"relative",minHeight:"56px"}}>
            {n.badge&&<span style={{position:"absolute",top:"6px",right:"calc(50% - 14px)",background:T.red,color:T.white,fontSize:"9px",fontWeight:800,padding:"1px 4px",borderRadius:"8px",minWidth:"16px",textAlign:"center"}}>{n.badge}</span>}
            <Icon d={n.icon} size={20}/>
            <span style={{fontSize:"9px",fontWeight:700,marginTop:"3px",textTransform:"uppercase",letterSpacing:"0.04em"}}>{n.shortLabel||n.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{width:"210px",background:T.black,minHeight:"100vh",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
      <div style={{padding:"24px 20px 20px",borderBottom:"1px solid #1A1A1A"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"30px",height:"30px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>V</span>
          </div>
          <div>
            <div style={{fontSize:"14px",fontWeight:800,color:T.white}}>Ventryl</div>
            <div style={{fontSize:"9px",fontWeight:700,color:portalLabel==="Buyer Portal"?T.green:T.blue,letterSpacing:"0.1em",textTransform:"uppercase"}}>{portalLabel}</div>
          </div>
        </div>
      </div>
      <nav style={{padding:"14px 10px",flex:1}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setActive(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"9px",padding:"10px 12px",borderRadius:"5px",background:active===n.id?T.white:"transparent",color:active===n.id?T.black:"#888",border:"none",cursor:"pointer",marginBottom:"2px",fontFamily:F,fontSize:"12px",fontWeight:active===n.id?800:600,textAlign:"left",transition:"all 0.1s"}}>
            <Icon d={n.icon} size={15}/>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge&&<span style={{background:T.red,color:T.white,fontSize:"10px",fontWeight:800,padding:"1px 5px",borderRadius:"10px"}}>{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:"1px solid #1A1A1A"}}>
        <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
          <div style={{width:"30px",height:"30px",background:identity.bg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:800,color:identity.textColor||T.black,flexShrink:0}}>{identity.initials}</div>
          <div>
            <div style={{fontSize:"11px",fontWeight:800,color:T.white}}>{identity.name}</div>
            <div style={{fontSize:"10px",color:"#666"}}>{identity.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Top bar */
function Topbar({crumb,pills,isMobile,onMenuToggle,portalLabel}) {
  return (
    <div style={{background:T.white,borderBottom:`1px solid ${T.gray100}`,padding:`0 ${isMobile?"16px":"28px"}`,height:"52px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        {isMobile&&(
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginRight:"6px"}}>
            <div style={{width:"22px",height:"22px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>V</span>
            </div>
          </div>
        )}
        <span style={{fontSize:"10px",color:T.gray400,fontWeight:600}}>{isMobile?portalLabel:"Platform"}</span>
        <span style={{color:T.gray200}}>›</span>
        <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{crumb}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"nowrap"}}>
        {pills?.filter((_,i)=>!isMobile||i<2).map((p,i)=>(
          <div key={i} style={{background:p.bg,color:p.color,fontSize:"10px",fontWeight:800,padding:"3px 8px",borderRadius:"3px",whiteSpace:"nowrap"}}>{p.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ORDER FLOW (3-step)
════════════════════════════════════════════ */
function OrderFlow({onDone,isMobile}) {
  const [step,setStep]=useState(1);
  const [sel,setSel]=useState(null);
  const [prod,setProd]=useState("PMS");
  const [vol,setVol]=useState(66000);
  const [done,setDone]=useState(false);
  const trucks=Math.ceil(vol/33000);
  const price=sel?(prod==="PMS"?sel.pms:sel.ago||sel.pms):0;
  const total=price*vol;

  if (done) return (
    <div style={{maxWidth:"420px",margin:"32px auto",textAlign:"center",padding:"0 16px"}}>
      <div style={{width:"60px",height:"60px",background:T.greenLight,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:"24px"}}>✓</div>
      <div style={{fontSize:"20px",fontWeight:800,color:T.black,marginBottom:"6px"}}>Order Submitted</div>
      <div style={{fontSize:"13px",color:T.gray400,marginBottom:"24px"}}>{sel?.name} will confirm within 2 hours. Funds held in KrediBank escrow.</div>
      <div style={{border:`1px solid ${T.gray100}`,marginBottom:"18px",textAlign:"left"}}>
        {[["Order ID","VTL-00844"],["Depot",sel?.name],["Product",prod],["Volume",`${(vol/1000).toFixed(0)}k L`],["Trucks",`${trucks} tanker${trucks>1?"s":""}`],["Total (Escrow)",`₦${total.toLocaleString()}`]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 18px",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px"}}>
            <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{color:T.black,fontWeight:800}}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={onDone} style={{background:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,cursor:"pointer",fontFamily:F,width:"100%"}}>Back to Dashboard</button>
    </div>
  );

  const stepLabels=["Depot","Configure","Pay"];
  return (
    <div style={{maxWidth:"660px",margin:"0 auto",padding:isMobile?"0":"0 8px"}}>
      {/* Step indicator */}
      <div style={{display:"flex",alignItems:"center",marginBottom:"24px"}}>
        {stepLabels.map((s,i,arr)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?"1":"0"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:step>i+1?T.green:step===i+1?T.black:T.gray200,color:step>=i+1?T.white:T.gray400,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,flexShrink:0,transition:"all 0.2s"}}>{step>i+1?"✓":i+1}</div>
              {!isMobile&&<span style={{fontSize:"12px",fontWeight:700,color:step===i+1?T.black:T.gray400}}>{s}</span>}
            </div>
            {i<arr.length-1&&<div style={{flex:1,height:"2px",background:step>i+1?T.green:T.gray200,margin:"0 8px",transition:"background 0.2s"}}/>}
          </div>
        ))}
      </div>

      {step===1&&(
        <div>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"14px"}}>Choose a Depot</div>
          {[...DEPOTS].sort((a,b)=>a.pms-b.pms).map((d,i)=>(
            <div key={d.id} onClick={()=>setSel(d)} style={{border:`2px solid ${sel?.id===d.id?T.green:T.gray100}`,background:T.white,padding:"16px",cursor:"pointer",marginBottom:"10px",transition:"border-color 0.15s"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{width:"30px",height:"30px",background:i===0?T.green:T.gray100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:800,color:i===0?T.white:T.gray600,flexShrink:0,marginTop:"2px"}}>{i+1}</div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>{d.name}</span>
                      {i===0&&<span style={{background:T.greenLight,color:T.greenDark,fontSize:"9px",fontWeight:800,padding:"2px 6px"}}>BEST</span>}
                    </div>
                    <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{d.location} · ETA {d.eta} · ★{d.rating}</div>
                    <div style={{fontSize:"11px",color:T.gray400}}>{d.slots} slots available</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"18px",fontWeight:800,color:i===0?T.green:T.black}}>₦{d.pms}/L</div>
                  {d.ago&&<div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>AGO ₦{d.ago.toLocaleString()}</div>}
                </div>
              </div>
            </div>
          ))}
          <button disabled={!sel} onClick={()=>setStep(2)} style={{background:sel?T.black:T.gray200,color:sel?T.white:T.gray400,border:"none",padding:"14px",fontSize:"13px",fontWeight:800,cursor:sel?"pointer":"not-allowed",fontFamily:F,width:"100%",marginTop:"8px"}}>
            Continue with {sel?.name||"a depot"} →
          </button>
        </div>
      )}

      {step===2&&(
        <div>
          <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:T.gray400,cursor:"pointer",fontFamily:F,fontSize:"12px",fontWeight:700,marginBottom:"14px",padding:0}}>← Back</button>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"18px"}}>Configure Order</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"18px"}}>
            <div>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>Product</div>
              <div style={{display:"flex",gap:"8px"}}>
                {["PMS",sel.ago?"AGO":null].filter(Boolean).map(p=>(
                  <button key={p} onClick={()=>setProd(p)} style={{flex:1,padding:"12px",border:`2px solid ${prod===p?T.black:T.gray200}`,background:prod===p?T.black:T.white,color:prod===p?T.white:T.black,fontFamily:F,fontSize:"14px",fontWeight:800,cursor:"pointer",minHeight:"48px"}}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>Unit Price</div>
              <div style={{background:T.gray50,border:`1px solid ${T.gray100}`,padding:"12px 14px",fontSize:"18px",fontWeight:800,color:T.black}}>₦{price.toLocaleString()}/L</div>
            </div>
          </div>
          <div style={{marginBottom:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em"}}>Volume</div>
              <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{(vol/1000).toFixed(0)}k L · {trucks} truck{trucks>1?"s":""}</div>
            </div>
            <input type="range" min={33000} max={198000} step={33000} value={vol} onChange={e=>setVol(Number(e.target.value))} style={{width:"100%",accentColor:T.black,cursor:"pointer",height:"6px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
              <span style={{fontSize:"10px",color:T.gray400}}>33k L (1 truck)</span>
              <span style={{fontSize:"10px",color:T.gray400}}>198k L (6 trucks)</span>
            </div>
          </div>
          <div style={{background:T.black,padding:"18px",marginBottom:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
              {[["Trucks",trucks],["Volume",`${(vol/1000).toFixed(0)}k L`],["Total",`₦${(total/1e6).toFixed(1)}M`]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>{l}</div><div style={{fontSize:"20px",fontWeight:800,color:T.white}}>{v}</div></div>
              ))}
            </div>
            <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #222",fontSize:"10px",color:T.gray400}}>⌈{(vol/1000).toFixed(0)}k ÷ 33k⌉ = {trucks} truck{trucks>1?"s":""}  ·  Escrow on delivery</div>
          </div>
          <button onClick={()=>setStep(3)} style={{background:T.green,color:T.white,border:"none",padding:"14px",fontSize:"13px",fontWeight:800,cursor:"pointer",fontFamily:F,width:"100%",minHeight:"48px"}}>Review Order →</button>
        </div>
      )}

      {step===3&&(
        <div>
          <button onClick={()=>setStep(2)} style={{background:"none",border:"none",color:T.gray400,cursor:"pointer",fontFamily:F,fontSize:"12px",fontWeight:700,marginBottom:"14px",padding:0}}>← Back</button>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"16px"}}>Review & Pay</div>
          <div style={{border:`1px solid ${T.gray100}`,background:T.white,marginBottom:"12px"}}>
            {[["Depot",sel.name],["Product",prod],["Price",`₦${price}/L`],["Volume",`${(vol/1000).toFixed(0)},000 L`],["Trucks",`${trucks}×33k L`],["ETA",sel.eta]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 18px",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px"}}>
                <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{color:T.black,fontWeight:700}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"14px 18px",fontSize:"15px"}}>
              <span style={{fontWeight:800,color:T.black}}>Total (Escrow)</span>
              <span style={{fontWeight:800,color:T.black}}>₦{total.toLocaleString()}</span>
            </div>
          </div>
          <div style={{background:T.amberLight,padding:"12px 16px",marginBottom:"10px",fontSize:"12px",color:"#8A5C00",fontWeight:600,lineHeight:1.5}}>
            💡 Funds held by KrediBank until you confirm delivery.
          </div>
          <div style={{background:T.greenLight,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <div><div style={{fontSize:"10px",fontWeight:700,color:T.greenDark,textTransform:"uppercase"}}>Wallet Balance</div><div style={{fontSize:"17px",fontWeight:800,color:T.greenDark}}>₦25,830,000</div></div>
            <div style={{fontSize:"12px",fontWeight:800,color:total>25830000?T.red:T.greenDark}}>{total>25830000?"⚠ Insufficient":"✓ Sufficient"}</div>
          </div>
          <button onClick={()=>setDone(true)} style={{background:T.green,color:T.white,border:"none",padding:"14px",fontSize:"14px",fontWeight:800,cursor:"pointer",fontFamily:F,width:"100%",minHeight:"48px"}}>
            Confirm & Pay ₦{total.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   BUYER VIEWS
════════════════════════════════════════════ */
function BuyerDash({onOrder,isMobile}) {
  const col2 = isMobile ? "1fr" : "1fr 1.3fr";
  return (
    <div>
      {/* Hero */}
      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",flexWrap:isMobile?"wrap":"nowrap"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"4px"}}>Buyer Dashboard</div>
            <div style={{fontSize:isMobile?"20px":"24px",fontWeight:800,color:T.white}}>Chukwuma Fuels Ltd</div>
            <div style={{fontSize:"11px",color:T.gray400,marginTop:"3px"}}>RC-1092843 · Lagos · KYB ✓</div>
          </div>
          <div style={{textAlign:isMobile?"left":"right"}}>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>Wallet Balance</div>
            <div style={{fontSize:isMobile?"22px":"28px",fontWeight:800,color:T.green}}>₦25,830,000</div>
            <button style={{marginTop:"8px",background:T.green,color:T.black,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"36px"}}>+ Fund Wallet</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:"1px",background:T.gray100,border:`1px solid ${T.gray100}`,marginBottom:"14px"}}>
        {[{l:"Orders MTD",v:"7",sub:"3 delivered"},{l:"Volume",v:"363k L",sub:"₦280.5M"},{l:"Avg. Price",v:"₦795/L",sub:"PMS · Mar"},{l:"Credit (VCS)",v:"720",sub:"Silver tier"}].map(k=>(
          <KpiCard key={k.l} label={k.l} value={k.v} sub={k.sub}/>
        ))}
      </div>

      {/* Active orders + chart */}
      <div style={{display:"grid",gridTemplateColumns:col2,gap:"14px",marginBottom:"14px"}}>
        <Card pad={false}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Active Orders</div>
          </div>
          {ORDERS.filter(o=>o.status!=="delivered").map((o,i,arr)=>(
            <div key={o.id} style={{padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${T.gray100}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px",gap:"8px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div>
                  <div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{o.depot} · {o.product} · {(o.vol/1000).toFixed(0)}k L</div>
                </div>
                <Badge status={o.status}/>
              </div>
              <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${o.progress}%`,background:o.status==="in_transit"?T.blue:T.amber,borderRadius:"2px"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                <span style={{fontSize:"10px",color:T.gray400}}>{o.progress}% done</span>
                <span style={{fontSize:"10px",color:T.gray400,fontWeight:600}}>₦{(o.value/1e6).toFixed(1)}M escrow</span>
              </div>
            </div>
          ))}
          <div style={{padding:"12px 18px"}}>
            <button onClick={onOrder} style={{width:"100%",background:T.black,color:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"44px"}}>+ Place New Order</button>
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Price Trend — 7 Days</div>
              <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>₦/Litre · PMS & AGO</div>
            </div>
            <div style={{background:T.amberLight,color:"#8A5C00",fontSize:"10px",fontWeight:800,padding:"4px 8px"}}>📈 Rising next week</div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile?150:180}>
            <LineChart data={PRICE_HISTORY} margin={{top:4,right:0,bottom:0,left:-24}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100}/>
              <XAxis dataKey="day" tick={{fill:T.gray400,fontSize:9,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.gray400,fontSize:9,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false} domain={[780,810]}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="pms" stroke={T.green} strokeWidth={2.5} name="PMS" dot={{fill:T.green,r:3,strokeWidth:0}}/>
              <Line type="monotone" dataKey="ago" stroke={T.blue} strokeWidth={2} name="AGO" dot={{fill:T.blue,r:3,strokeWidth:0}} strokeDasharray="5 3"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:"12px",marginTop:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"10px",height:"2px",background:T.green}}/><span style={{fontSize:"10px",fontWeight:600,color:T.gray400}}>PMS ₦795</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"10px",height:"2px",background:T.blue}}/><span style={{fontSize:"10px",fontWeight:600,color:T.gray400}}>AGO ₦1,185</span></div>
          </div>
        </Card>
      </div>

      {/* Order history - cards on mobile */}
      <Card pad={false}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`}}><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Order History</div></div>
        {isMobile?(
          ORDERS.map((o,i)=>(
            <div key={o.id} style={{padding:"14px 18px",borderBottom:i<ORDERS.length-1?`1px solid ${T.gray100}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div>
                  <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{o.depot} · {o.product}</div>
                </div>
                <Badge status={o.status}/>
              </div>
              <div style={{display:"flex",gap:"16px"}}>
                <span style={{fontSize:"11px",color:T.gray600,fontWeight:700}}>{(o.vol/1000).toFixed(0)}k L</span>
                <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>₦{(o.value/1e6).toFixed(1)}M</span>
                <span style={{fontSize:"11px",color:T.gray400}}>{o.placed}</span>
              </div>
            </div>
          ))
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Order","Depot","Product","Volume","Value","Placed","Status"].map(h=><th key={h} style={{padding:"9px 18px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
            <tbody>{ORDERS.map((o,i)=>(
              <tr key={o.id} style={{borderBottom:i<ORDERS.length-1?`1px solid ${T.gray100}`:"none"}}>
                <td style={{padding:"12px 18px",fontFamily:F,fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</td>
                <td style={{padding:"12px 18px",fontFamily:F,fontSize:"12px",color:T.gray800}}>{o.depot}</td>
                <td style={{padding:"12px 18px"}}><span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{o.product}</span></td>
                <td style={{padding:"12px 18px",fontFamily:F,fontSize:"12px",color:T.gray600}}>{(o.vol/1000).toFixed(0)}k L</td>
                <td style={{padding:"12px 18px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>₦{(o.value/1e6).toFixed(1)}M</td>
                <td style={{padding:"12px 18px",fontFamily:F,fontSize:"11px",color:T.gray400}}>{o.placed}</td>
                <td style={{padding:"12px 18px"}}><Badge status={o.status}/></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function BuyerMarketplace({onOrder,isMobile}) {
  const [sort,setSort]=useState("price");
  const sorted=[...DEPOTS].sort((a,b)=>sort==="price"?a.pms-b.pms:sort==="rating"?b.rating-a.rating:b.stock-a.stock);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
        <div><div style={{fontSize:"14px",fontWeight:800,color:T.black}}>Price Discovery</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>4 depots · NMDPRA verified</div></div>
        <div style={{display:"flex",gap:"6px"}}>
          {["price","rating","stock"].map(s=>(
            <button key={s} onClick={()=>setSort(s)} style={{background:sort===s?T.black:T.white,color:sort===s?T.white:T.gray600,border:`1px solid ${sort===s?T.black:T.gray200}`,padding:"5px 10px",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:F,borderRadius:"20px",textTransform:"capitalize"}}>{s}</button>
          ))}
        </div>
      </div>
      {sorted.map((d,i)=>(
        <div key={d.id} style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"16px",marginBottom:"10px"}}>
          {isMobile?(
            <>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"10px",gap:"10px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{width:"30px",height:"30px",background:i===0&&sort==="price"?T.green:T.gray100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:800,color:i===0&&sort==="price"?T.white:T.gray600,flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>{d.name}</span>
                      {i===0&&sort==="price"&&<span style={{background:T.greenLight,color:T.greenDark,fontSize:"9px",fontWeight:800,padding:"1px 5px"}}>BEST</span>}
                    </div>
                    <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>{d.location} · ★{d.rating} · {d.slots} slots</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"18px",fontWeight:800,color:i===0&&sort==="price"?T.green:T.black}}>₦{d.pms}/L</div>
                  {d.ago&&<div style={{fontSize:"10px",color:T.gray400}}>AGO ₦{d.ago.toLocaleString()}</div>}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>Stock: {(d.stock/1000).toFixed(0)}k/{(d.cap/1000).toFixed(0)}k MT</div>
                  <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(d.stock/d.cap*100)}%`,background:T.green}}/></div>
                </div>
                <button onClick={onOrder} style={{background:T.black,color:T.white,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px",flexShrink:0}}>Order →</button>
              </div>
            </>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <div style={{width:"36px",height:"36px",background:i===0&&sort==="price"?T.green:T.gray100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:800,color:i===0&&sort==="price"?T.white:T.gray600,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                  <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>{d.name}</span>
                  <span style={{background:T.greenLight,color:T.greenDark,fontSize:"9px",fontWeight:700,padding:"2px 6px"}}>NMDPRA ✓</span>
                </div>
                <div style={{fontSize:"11px",color:T.gray400}}>{d.location} · ★{d.rating} ({d.orders} orders) · {d.slots} slots · ETA {d.eta}</div>
              </div>
              <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>PMS</div><div style={{fontSize:"18px",fontWeight:800,color:T.black}}>₦{d.pms}</div></div>
                {d.ago&&<div style={{textAlign:"center"}}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>AGO</div><div style={{fontSize:"18px",fontWeight:800,color:T.black}}>₦{d.ago.toLocaleString()}</div></div>}
                <div>
                  <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"4px"}}>Stock</div>
                  <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden",width:"70px"}}><div style={{height:"100%",width:`${Math.round(d.stock/d.cap*100)}%`,background:T.green}}/></div>
                  <div style={{fontSize:"9px",color:T.gray400,marginTop:"2px"}}>{(d.stock/1000).toFixed(0)}k/{(d.cap/1000).toFixed(0)}k MT</div>
                </div>
                <button onClick={onOrder} style={{background:T.black,color:T.white,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px"}}>Order →</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BuyerWallet({isMobile}) {
  return (
    <div>
      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"24px"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"}}>Available Balance</div>
            <div style={{fontSize:isMobile?"28px":"36px",fontWeight:800,color:T.green,letterSpacing:"-0.02em",lineHeight:1}}>₦25,830,000</div>
            <div style={{fontSize:"11px",color:T.gray400,marginTop:"5px"}}>₦91.6M in escrow · 2 orders</div>
            <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
              <button style={{background:T.green,color:T.black,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px"}}>+ Fund</button>
              <button style={{background:"transparent",color:T.white,border:"1px solid #333",padding:"9px 16px",fontSize:"12px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px"}}>Withdraw</button>
            </div>
          </div>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"10px"}}>Escrow Breakdown</div>
            {ORDERS.filter(o=>o.status!=="delivered").map(o=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1A1A1A",fontSize:"12px"}}>
                <div><span style={{color:T.white,fontWeight:700}}>{o.id}</span><span style={{color:T.gray400,marginLeft:"6px"}}>{o.product}</span></div>
                <span style={{color:T.green,fontWeight:800}}>₦{(o.value/1e6).toFixed(1)}M</span>
              </div>
            ))}
            <div style={{fontSize:"10px",color:T.gray400,marginTop:"10px",fontWeight:600}}>KrediBank · Released on delivery confirm</div>
          </div>
        </div>
      </div>
      <Card pad={false}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`}}><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Transaction History</div></div>
        {TXN.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",borderBottom:i<TXN.length-1?`1px solid ${T.gray100}`:"none",gap:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"50%",background:t.type==="credit"?T.greenLight:t.type==="released"?T.blueLight:T.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0}}>{t.type==="credit"?"↓":t.type==="released"?"🔓":"↑"}</div>
              <div><div style={{fontSize:"12px",fontWeight:700,color:T.black}}>{isMobile?t.desc.split("—")[0]:t.desc}</div><div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{t.id} · {t.date}</div></div>
            </div>
            <div style={{fontSize:"13px",fontWeight:800,color:t.type==="credit"?T.greenDark:t.type==="released"?T.blue:T.black,flexShrink:0}}>{t.amount}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════
   DEPOT VIEWS
════════════════════════════════════════════ */
function DepotDash({isMobile}) {
  const [pms,setPms]=useState(795);
  const [ago,setAgo]=useState(1185);
  const [editing,setEditing]=useState(false);
  const col2=isMobile?"1fr":"1fr 1fr";
  return (
    <div>
      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",flexWrap:isMobile?"wrap":"nowrap"}}>
        <div>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"4px"}}>Depot Dashboard</div>
          <div style={{fontSize:isMobile?"20px":"24px",fontWeight:800,color:T.white}}>Nepal Energies</div>
          <div style={{fontSize:"11px",color:T.gray400,marginTop:"3px"}}>Apapa, Lagos · NMDPRA: MDP/D/0042</div>
        </div>
        <div style={{textAlign:isMobile?"left":"right"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>Revenue (Mar)</div>
          <div style={{fontSize:isMobile?"22px":"28px",fontWeight:800,color:T.green}}>₦218M</div>
          <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>+10.1% vs Feb</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:"1px",background:T.gray100,border:`1px solid ${T.gray100}`,marginBottom:"14px"}}>
        <KpiCard label="Orders MTD" value="34" sub="28 fulfilled"/>
        <KpiCard label="Volume" value="1.12M L" sub="34 trucks"/>
        <KpiCard label="Pending" value="2" sub="SLA: 2h max" alert/>
        <KpiCard label="Avg. Rating" value="4.8 ★" sub="34 reviews"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:col2,gap:"14px",marginBottom:"14px"}}>
        {/* Price Control */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <div><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Live Price Control</div><div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>Updates marketplace instantly</div></div>
            <button onClick={()=>setEditing(!editing)} style={{background:editing?T.green:T.black,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"36px"}}>{editing?"Save":"Edit"}</button>
          </div>
          {[{label:"PMS",val:pms,set:setPms},{label:"AGO",val:ago,set:setAgo}].map(p=>(
            <div key={p.label} style={{marginBottom:"12px",paddingBottom:"12px",borderBottom:`1px solid ${T.gray100}`}}>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"7px"}}>{p.label}</div>
              {editing?(
                <div style={{display:"flex",alignItems:"center",border:`2px solid ${T.black}`}}>
                  <span style={{padding:"9px 10px",fontSize:"12px",fontWeight:700,color:T.gray400,borderRight:`1px solid ${T.gray100}`}}>₦</span>
                  <input type="number" value={p.val} onChange={e=>p.set(Number(e.target.value))} style={{flex:1,border:"none",padding:"9px 10px",fontSize:"16px",fontWeight:800,fontFamily:F,outline:"none",color:T.black,width:"100%"}}/>
                  <span style={{padding:"9px 10px",fontSize:"11px",fontWeight:600,color:T.gray400}}>/L</span>
                </div>
              ):(
                <div style={{background:T.gray50,padding:"10px 12px",fontSize:"18px",fontWeight:800,color:T.black}}>₦{p.val.toLocaleString()}/L</div>
              )}
            </div>
          ))}
          <div style={{background:T.greenLight,padding:"10px 12px",display:"flex",alignItems:"center",gap:"7px"}}>
            <span>📡</span><span style={{fontSize:"11px",fontWeight:700,color:T.greenDark}}>Live on marketplace</span>
          </div>
        </Card>

        {/* Inventory */}
        <Card>
          <SectionHead title="Inventory Status" sub="Current stock · Apapa"/>
          {[{prod:"PMS",current:61200,cap:85000},{prod:"Total",current:61200,cap:85000}].map(s=>(
            <div key={s.prod} style={{marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{s.prod}</span>
                <span style={{fontSize:"11px",fontWeight:700,color:T.gray400}}>{(s.current/1000).toFixed(1)}k/{(s.cap/1000).toFixed(0)}k MT · <span style={{color:T.green,fontWeight:800}}>{Math.round(s.current/s.cap*100)}%</span></span>
              </div>
              <div style={{height:"7px",background:T.gray100,borderRadius:"4px",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(s.current/s.cap*100)}%`,background:T.green,borderRadius:"4px"}}/></div>
            </div>
          ))}
          <div style={{background:T.amberLight,padding:"10px 14px",marginTop:"6px"}}>
            <div style={{fontSize:"11px",fontWeight:700,color:"#8A5C00",marginBottom:"2px"}}>⚠ Restock in ~4 days</div>
            <div style={{fontSize:"11px",color:"#8A5C00"}}>Contact NNPC for next PMS allocation.</div>
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.5fr 1fr",gap:"14px"}}>
        <Card>
          <SectionHead title="Revenue Trend" sub="₦ Millions · 6 months"/>
          <ResponsiveContainer width="100%" height={isMobile?150:170}>
            <AreaChart data={REVENUE_DATA} margin={{top:4,right:0,bottom:0,left:-24}}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.15}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100}/>
              <XAxis dataKey="month" tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="revenue" stroke={T.green} strokeWidth={2.5} fill="url(#rg)" name="Revenue" dot={{fill:T.green,r:3,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHead title="Orders by Day" sub="This week"/>
          <ResponsiveContainer width="100%" height={isMobile?150:170}>
            <BarChart data={DAILY} barSize={7} margin={{left:-24,bottom:0}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100} vertical={false}/>
              <XAxis dataKey="day" tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="pms" fill={T.green} name="PMS" radius={[2,2,0,0]}/>
              <Bar dataKey="ago" fill={T.blue} name="AGO" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function DepotInbox({isMobile}) {
  const [acted,setActed]=useState({});
  return (
    <div>
      <div style={{marginBottom:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:800,color:T.black}}>Incoming Orders</div>
          <div style={{background:T.redLight,color:T.red,fontSize:"10px",fontWeight:800,padding:"2px 7px",borderRadius:"10px"}}>2 require action</div>
        </div>
        {INCOMING.filter(o=>o.status==="pending").map(o=>(
          <div key={o.id} style={{border:acted[o.id]?`2px solid ${acted[o.id]==="confirm"?T.green:T.red}`:`2px solid ${T.amber}`,background:T.white,marginBottom:"12px"}}>
            <div style={{padding:"16px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"8px",gap:"10px",flexWrap:isMobile?"wrap":"nowrap"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",marginBottom:"4px"}}>
                    <span style={{fontSize:"13px",fontWeight:800,color:T.black}}>{o.id}</span>
                    <span style={{background:T.gray100,color:T.gray600,fontSize:"10px",fontWeight:700,padding:"2px 6px",borderRadius:"3px"}}>{o.type}</span>
                  </div>
                  <div style={{fontSize:"13px",fontWeight:700,color:T.black,marginBottom:"2px"}}>{o.buyer}</div>
                  <div style={{fontSize:"11px",color:T.gray400}}>{o.location} · {o.submitted}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px 20px",flexShrink:0}}>
                  {[["Product",o.product],["Volume",`${(o.vol/1000).toFixed(0)}k L`],["Trucks",o.trucks],["Value",`₦${(o.value/1e6).toFixed(1)}M`]].map(([l,v])=>(
                    <div key={l}>
                      <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{l}</div>
                      <div style={{fontSize:"14px",fontWeight:800,color:T.black}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{borderTop:`1px solid ${T.gray100}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                <span style={{fontSize:"10px",color:T.gray400,fontWeight:600}}>SLA:</span>
                <span style={{fontSize:"11px",fontWeight:800,color:"#8A5C00",background:T.amberLight,padding:"2px 7px",borderRadius:"3px"}}>⏱ {o.slaLeft}</span>
                {!isMobile&&<span style={{fontSize:"10px",color:T.gray400}}>· Funds in KrediBank escrow ✓</span>}
              </div>
              {acted[o.id]?(
                <div style={{fontSize:"12px",fontWeight:800,color:acted[o.id]==="confirm"?T.greenDark:T.red}}>{acted[o.id]==="confirm"?"✓ Confirmed":"✗ Rejected"}</div>
              ):(
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>setActed(a=>({...a,[o.id]:"reject"}))} style={{background:T.white,color:T.red,border:`1px solid ${T.red}`,padding:"8px 14px",fontSize:"11px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px"}}>Reject</button>
                  <button onClick={()=>setActed(a=>({...a,[o.id]:"confirm"}))} style={{background:T.green,color:T.white,border:"none",padding:"8px 14px",fontSize:"11px",fontWeight:800,cursor:"pointer",fontFamily:F,minHeight:"40px"}}>Confirm →</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{fontSize:"14px",fontWeight:800,color:T.black,marginBottom:"12px"}}>Active Dispatches</div>
      {[{id:"VTL-00841",buyer:"Chukwuma Fuels Ltd",product:"PMS",vol:90000,trucks:3,stage:"in_transit",driver:"Emeka Nwosu",truck:"LSD-481-KJ",departure:"08:45",eta:"13:30",progress:65},
        {id:"VTL-00839",buyer:"Silvergate Energy",product:"PMS",vol:132000,trucks:4,stage:"loading",driver:"Bayo Adeyemi",truck:"LSD-219-AB",departure:"11:00",eta:"16:00",progress:25}].map(o=>(
        <Card key={o.id} pad={false}>
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",gap:"8px",flexWrap:isMobile?"wrap":"nowrap"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                  <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</span>
                  <Badge status={o.stage}/>
                </div>
                <div style={{fontSize:"11px",color:T.gray400}}>{o.buyer} · {o.product} · {(o.vol/1000).toFixed(0)}k L · {o.trucks} trucks</div>
              </div>
              <div style={{textAlign:isMobile?"left":"right"}}>
                <div style={{fontSize:"11px",color:T.gray400,fontWeight:600}}>Dept {o.departure} · ETA {o.eta}</div>
                <div style={{fontSize:"11px",color:T.black,fontWeight:700,marginTop:"1px"}}>{o.driver} · {o.truck}</div>
              </div>
            </div>
            <div style={{height:"5px",background:T.gray100,borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",width:`${o.progress}%`,background:o.stage==="in_transit"?T.blue:T.amber,borderRadius:"3px"}}/></div>
            <div style={{marginTop:"4px",fontSize:"10px",color:T.gray400}}>{o.progress}% · 🔐 Escrow released on buyer confirmation</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TruckSched({isMobile}) {
  return (
    <div>
      <SectionHead title="Loading Bay Schedule" sub="Tue 10 Mar 2026 · Apapa Depot"
        right={<div style={{display:"flex",gap:"6px"}}>
          {["← Prev","Next →"].map(b=><button key={b} style={{background:T.white,border:`1px solid ${T.gray200}`,color:T.black,padding:"6px 10px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F,borderRadius:"4px",minHeight:"36px"}}>{b}</button>)}
        </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
        {["Bay 1","Bay 2"].map(bay=>{
          const bs=SLOTS.filter(s=>s.bay===bay),booked=bs.filter(s=>s.status!=="open").length;
          return (<Card key={bay}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{bay}</div>
              <div style={{fontSize:"11px",fontWeight:700,color:T.gray400}}>{booked}/{bs.length}</div>
            </div>
            <div style={{height:"5px",background:T.gray100,borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",width:`${booked/bs.length*100}%`,background:T.green}}/></div>
            <div style={{fontSize:"10px",color:T.gray400,marginTop:"4px"}}>{Math.round(booked/bs.length*100)}% utilised</div>
          </Card>);
        })}
      </div>
      {isMobile?(
        <div>
          {SLOTS.map((s,i)=>(
            <div key={i} style={{border:`1px solid ${T.gray100}`,background:s.status==="open"?`${T.green}08`:T.white,padding:"14px 16px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{s.time} · {s.bay}</div>
                  <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{s.order} {s.product!=="—"?`· ${s.product}`:""}{s.trucks?` · ${s.trucks} 🚛`:""}</div>
                </div>
                <Badge status={s.status}/>
              </div>
              {s.status==="open"&&<button style={{background:T.black,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F,width:"100%",minHeight:"40px"}}>Assign Order</button>}
              {s.status==="loading"&&<button style={{background:T.green,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F,width:"100%",minHeight:"40px"}}>Mark Departed</button>}
            </div>
          ))}
        </div>
      ):(
        <Card pad={false}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Time","Bay","Order","Product","Trucks","Status","Action"].map(h=><th key={h} style={{padding:"10px 18px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{SLOTS.map((s,i)=>(
              <tr key={i} style={{borderBottom:i<SLOTS.length-1?`1px solid ${T.gray100}`:"none",background:s.status==="open"?`${T.green}08`:T.white}}>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>{s.time}</td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",color:T.gray600}}>{s.bay}</td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",fontWeight:700,color:s.order==="—"?T.gray200:T.black}}>{s.order}</td>
                <td style={{padding:"13px 18px"}}>{s.product!=="—"?<span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{s.product}</span>:<span style={{color:T.gray200}}>—</span>}</td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",fontWeight:800,color:s.trucks?T.black:T.gray200}}>{s.trucks?`${s.trucks} 🚛`:"—"}</td>
                <td style={{padding:"13px 18px"}}><Badge status={s.status}/></td>
                <td style={{padding:"13px 18px"}}>
                  {s.status==="open"?<button style={{background:T.black,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F,minHeight:"36px"}}>Assign</button>
                  :s.status==="loading"?<button style={{background:T.green,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F,minHeight:"36px"}}>Departed</button>
                  :<span style={{fontSize:"11px",color:T.gray400}}>—</span>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function BuyerNetwork({isMobile}) {
  return (
    <div>
      <SectionHead title="Buyer Network" sub={`${BUYERS_DATA.length} active buyers · VCS via KrediBank`}/>
      {isMobile?(
        BUYERS_DATA.map((b,i)=>(
          <div key={b.name} style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
              <div>
                <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{b.name}</div>
                <div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{b.type} · Last: {b.lastOrder}</div>
              </div>
              <span style={{background:b.tier==="Gold"?T.amberLight:b.tier==="Silver"?T.gray100:"#F3F0FF",color:b.tier==="Gold"?"#8A5C00":b.tier==="Silver"?T.gray600:"#8B5CF6",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"3px"}}>{b.tier}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
              {[["Orders",b.orders],["Volume",b.vol],["Spend",b.spend]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>{l}</div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{v}</div></div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"7px",marginTop:"10px"}}>
              <div style={{flex:1,height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${b.score/10}%`,background:b.score>=750?T.green:b.score>=650?T.amber:T.gray400}}/></div>
              <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{b.score}</span>
            </div>
          </div>
        ))
      ):(
        <Card pad={false}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Buyer","Type","Orders","Volume","Spend","VCS","Tier","Last"].map(h=><th key={h} style={{padding:"10px 18px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{BUYERS_DATA.map((b,i)=>(
              <tr key={b.name} style={{borderBottom:i<BUYERS_DATA.length-1?`1px solid ${T.gray100}`:"none"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.gray50}
                onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>{b.name}</td>
                <td style={{padding:"13px 18px"}}><span style={{background:T.gray100,color:T.gray600,fontSize:"10px",fontWeight:700,padding:"3px 7px",borderRadius:"3px"}}>{b.type}</span></td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"13px",fontWeight:700,color:T.black}}>{b.orders}</td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",color:T.gray600}}>{b.vol}</td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>{b.spend}</td>
                <td style={{padding:"13px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                    <div style={{height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden",width:"50px"}}><div style={{height:"100%",width:`${b.score/10}%`,background:b.score>=750?T.green:b.score>=650?T.amber:T.gray400}}/></div>
                    <span style={{fontFamily:F,fontSize:"12px",fontWeight:800,color:T.black}}>{b.score}</span>
                  </div>
                </td>
                <td style={{padding:"13px 18px"}}><span style={{background:b.tier==="Gold"?T.amberLight:b.tier==="Silver"?T.gray100:"#F3F0FF",color:b.tier==="Gold"?"#8A5C00":b.tier==="Silver"?T.gray600:"#8B5CF6",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"3px"}}>{b.tier}</span></td>
                <td style={{padding:"13px 18px",fontFamily:F,fontSize:"11px",color:T.gray400}}>{b.lastOrder}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   PORTAL SHELLS
════════════════════════════════════════════ */
const BUYER_NAV = [
  {id:"dash",label:"Dashboard",shortLabel:"Home",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
  {id:"market",label:"Price Discovery",shortLabel:"Market",icon:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"},
  {id:"orders",label:"My Orders",shortLabel:"Orders",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
  {id:"wallet",label:"Wallet",shortLabel:"Wallet",icon:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"},
  {id:"order_form",label:"Place Order",shortLabel:"Order+",icon:"M12 4v16m8-8H4"},
];

const DEPOT_NAV = [
  {id:"dash",label:"Dashboard",shortLabel:"Home",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
  {id:"inbox",label:"Order Inbox",shortLabel:"Inbox",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",badge:2},
  {id:"sched",label:"Truck Schedule",shortLabel:"Schedule",icon:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
  {id:"buyers",label:"Buyers",shortLabel:"Buyers",icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"},
];

function BuyerPortal({bp}) {
  const {isMobile}=bp;
  const [active,setActive]=useState("dash");
  const activeN=BUYER_NAV.find(n=>n.id===active);
  const views={
    dash:<BuyerDash onOrder={()=>setActive("order_form")} isMobile={isMobile}/>,
    market:<BuyerMarketplace onOrder={()=>setActive("order_form")} isMobile={isMobile}/>,
    orders:(
      <div>
        <div style={{fontSize:"14px",fontWeight:800,color:T.black,marginBottom:"14px"}}>My Orders</div>
        {isMobile?(
          ORDERS.map((o,i)=>(
            <div key={o.id} style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"7px"}}>
                <div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{o.depot} · {o.product}</div></div>
                <Badge status={o.status}/>
              </div>
              <div style={{display:"flex",gap:"14px"}}>
                <span style={{fontSize:"11px",color:T.gray600,fontWeight:700}}>{(o.vol/1000).toFixed(0)}k L</span>
                <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>₦{(o.value/1e6).toFixed(1)}M</span>
                <span style={{fontSize:"11px",color:T.gray400}}>{o.placed}</span>
              </div>
            </div>
          ))
        ):(
          <Card pad={false}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Order","Depot","Product","Volume","Trucks","Value","Placed","Status"].map(h=><th key={h} style={{padding:"10px 18px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
              <tbody>{ORDERS.map((o,i)=>(
                <tr key={o.id} style={{borderBottom:i<ORDERS.length-1?`1px solid ${T.gray100}`:"none"}}>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</td>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",color:T.gray800}}>{o.depot}</td>
                  <td style={{padding:"13px 18px"}}><span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{o.product}</span></td>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",color:T.gray600}}>{(o.vol/1000).toFixed(0)}k L</td>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"12px",fontWeight:700,color:T.black,textAlign:"center"}}>{o.trucks}</td>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>₦{(o.value/1e6).toFixed(1)}M</td>
                  <td style={{padding:"13px 18px",fontFamily:F,fontSize:"11px",color:T.gray400}}>{o.placed}</td>
                  <td style={{padding:"13px 18px"}}><Badge status={o.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    ),
    wallet:<BuyerWallet isMobile={isMobile}/>,
    order_form:<OrderFlow onDone={()=>setActive("dash")} isMobile={isMobile}/>,
  };
  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F}}>
      <Sidebar navItems={BUYER_NAV} active={active} setActive={setActive} identity={{initials:"CF",bg:T.green,textColor:T.black,name:"Chukwuma Fuels",role:"Buyer · Lagos"}} portalLabel="Buyer Portal" isMobile={isMobile}/>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <Topbar crumb={activeN?.label} isMobile={isMobile} portalLabel="Buyer Portal"
          pills={[{bg:T.greenLight,color:T.greenDark,label:"KYB ✓"},{bg:T.gray50,color:T.black,label:"₦25.8M wallet"}]}/>
        <div style={{padding:isMobile?"14px 16px":"24px 28px",paddingBottom:isMobile?"80px":"24px",flex:1,overflowY:"auto"}}>
          {views[active]}
        </div>
      </div>
      {isMobile&&<Sidebar navItems={BUYER_NAV} active={active} setActive={setActive} identity={{}} portalLabel="Buyer Portal" isMobile={true}/>}
    </div>
  );
}

function DepotPortal({bp}) {
  const {isMobile}=bp;
  const [active,setActive]=useState("dash");
  const activeN=DEPOT_NAV.find(n=>n.id===active);
  const views={
    dash:<DepotDash isMobile={isMobile}/>,
    inbox:<DepotInbox isMobile={isMobile}/>,
    sched:<TruckSched isMobile={isMobile}/>,
    buyers:<BuyerNetwork isMobile={isMobile}/>,
  };
  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F}}>
      <Sidebar navItems={DEPOT_NAV} active={active} setActive={setActive} identity={{initials:"NE",bg:T.blue,textColor:T.white,name:"Nepal Energies",role:"Depot Partner"}} portalLabel="Depot Portal" isMobile={isMobile}/>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <Topbar crumb={activeN?.label} isMobile={isMobile} portalLabel="Depot Portal"
          pills={[{bg:T.redLight,color:T.red,label:"2 Pending"},{bg:T.greenLight,color:T.greenDark,label:"NMDPRA ✓"}]}/>
        <div style={{padding:isMobile?"14px 16px":"24px 28px",paddingBottom:isMobile?"80px":"24px",flex:1,overflowY:"auto"}}>
          {views[active]}
        </div>
      </div>
      {isMobile&&<Sidebar navItems={DEPOT_NAV} active={active} setActive={setActive} identity={{}} portalLabel="Depot Portal" isMobile={true}/>}
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT — ROLE SWITCHER
════════════════════════════════════════════ */
export default function VentrylApp() {
  const [role,setRole]=useState(null);
  const bp=useBreakpoint();
  const {isMobile}=bp;

  if (!role) return (
    <div style={{fontFamily:F,background:T.black,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#333;}`}</style>
      <div style={{textAlign:"center",marginBottom:"40px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
          <div style={{width:"40px",height:"40px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:"20px",fontWeight:800,color:T.black}}>V</span></div>
          <span style={{fontSize:isMobile?"24px":"28px",fontWeight:800,color:T.white,letterSpacing:"-0.02em"}}>Ventryl</span>
        </div>
        <div style={{fontSize:"13px",color:T.gray400,fontWeight:600}}>Nigeria's B2B Petroleum Marketplace</div>
        <div style={{fontSize:"11px",color:"#333",marginTop:"3px"}}>Trade fuel. Move faster.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",width:"100%",maxWidth:"480px"}}>
        {[{r:"buyer",title:"Buyer Portal",sub:"Petrol stations, aviation & industrial buyers",icon:"⛽",accent:T.green},{r:"depot",title:"Depot Portal",sub:"Licensed petroleum depots & suppliers",icon:"🏭",accent:T.blue}].map(x=>(
          <button key={x.r} onClick={()=>setRole(x.r)} style={{background:"#0A0A0A",border:`1px solid #1A1A1A`,padding:"24px 20px",cursor:"pointer",fontFamily:F,textAlign:"left",minHeight:isMobile?"auto":"160px"}}
            onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${x.accent}`}}
            onMouseLeave={e=>{e.currentTarget.style.border="1px solid #1A1A1A"}}>
            <div style={{fontSize:"26px",marginBottom:"12px"}}>{x.icon}</div>
            <div style={{fontSize:"14px",fontWeight:800,color:T.white,marginBottom:"5px"}}>{x.title}</div>
            <div style={{fontSize:"11px",color:T.gray400,lineHeight:1.5,marginBottom:"16px"}}>{x.sub}</div>
            <div style={{fontSize:"12px",fontWeight:800,color:x.accent}}>Enter →</div>
          </button>
        ))}
      </div>
      <div style={{marginTop:"32px",fontSize:"10px",color:"#333",fontWeight:600}}>MVP Live · Pilot Phase · March 2026</div>
    </div>
  );

  return (
    <div style={{fontFamily:F,background:T.gray50,minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#D3D3D3;} input[type=range]{-webkit-appearance:none;appearance:none;height:4px;background:#EBEBEB;border-radius:2px;outline:none;} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;background:#000;border-radius:50%;cursor:pointer;} input[type=number]::-webkit-inner-spin-button{opacity:1;}`}</style>
      {/* Role switcher bar */}
      {!isMobile&&(
        <div style={{background:"#0A0A0A",padding:"5px 20px",display:"flex",alignItems:"center",gap:"10px",justifyContent:"flex-end",borderBottom:"1px solid #1A1A1A"}}>
          <span style={{fontSize:"10px",color:"#444",fontWeight:600}}>Viewing:</span>
          {[{r:"buyer",label:"Buyer"},{r:"depot",label:"Depot"}].map(x=>(
            <button key={x.r} onClick={()=>setRole(x.r)} style={{background:role===x.r?"#1A1A1A":"transparent",color:role===x.r?T.white:"#444",border:`1px solid ${role===x.r?"#333":"transparent"}`,padding:"3px 10px",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:F,borderRadius:"3px"}}>{x.label} Portal</button>
          ))}
          <button onClick={()=>setRole(null)} style={{background:"transparent",color:"#444",border:"none",fontSize:"10px",fontWeight:700,cursor:"pointer",fontFamily:F,marginLeft:"6px"}}>← Switch</button>
        </div>
      )}
      {role==="buyer"?<BuyerPortal bp={bp}/>:<DepotPortal bp={bp}/>}
      {/* Mobile role switcher - floating pill */}
      {isMobile&&(
        <div style={{position:"fixed",top:"8px",right:"12px",zIndex:200,display:"flex",gap:"4px",background:"rgba(0,0,0,0.85)",padding:"4px",borderRadius:"20px",backdropFilter:"blur(8px)"}}>
          {[{r:"buyer",label:"B"},{r:"depot",label:"D"}].map(x=>(
            <button key={x.r} onClick={()=>setRole(x.r)} style={{background:role===x.r?T.green:"transparent",color:role===x.r?T.black:T.gray400,border:"none",width:"28px",height:"28px",borderRadius:"50%",fontSize:"11px",fontWeight:800,cursor:"pointer",fontFamily:F}}>{x.label}</button>
          ))}
          <button onClick={()=>setRole(null)} style={{background:"transparent",color:T.gray400,border:"none",width:"28px",height:"28px",borderRadius:"50%",fontSize:"14px",cursor:"pointer"}}>↩</button>
        </div>
      )}
    </div>
  );
}
