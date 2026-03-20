import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { haptic, H, GLOBAL_CSS } from "./motion.js";
import { DepotOrderMgmt, DEPOT_ORDERS_INITIAL, DEPOT_DRIVERS } from "./depotOrders.jsx";

/* ════════ DESIGN TOKENS ════════ */
const T = {
  black:"#000000",white:"#FFFFFF",green:"#06C167",greenLight:"#E6F9F1",greenDark:"#038C48",
  gray50:"#F6F6F6",gray100:"#EBEBEB",gray200:"#D3D3D3",gray400:"#8C8C8C",gray600:"#545454",gray800:"#282828",
  red:"#E11900",redLight:"#FCEAE8",amber:"#FFC043",amberLight:"#FFF3D9",blue:"#276EF1",blueLight:"#EEF3FE",
};
const F = "'Manrope', sans-serif";
const fmt = n => "₦" + Number(n).toLocaleString("en-NG");
const fmtM = n => "₦" + (n/1e6).toFixed(1) + "M";

/* ════════ RESPONSIVE ════════ */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const fn=()=>setW(window.innerWidth); window.addEventListener("resize",fn); return()=>window.removeEventListener("resize",fn); }, []);
  return { isMobile: w<768, isTablet: w>=768&&w<1024, isDesktop: w>=1024, width:w };
}

/* ════════ RIPPLE / BTN ════════ */
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const add = e => {
    const rect=e.currentTarget.getBoundingClientRect(), x=e.clientX-rect.left, y=e.clientY-rect.top, id=Date.now()+Math.random();
    setRipples(r=>[...r,{x,y,id}]);
    setTimeout(()=>setRipples(r=>r.filter(rp=>rp.id!==id)),700);
  };
  return [ripples,add];
}
function RippleLayer({ripples,color="rgba(255,255,255,0.22)"}) {
  return ripples.map(r=>(
    <span key={r.id} style={{position:"absolute",left:r.x,top:r.y,width:"6px",height:"6px",background:color,borderRadius:"50%",transform:"translate(-50%,-50%) scale(0)",animation:"vRipple 0.65s cubic-bezier(0.4,0,0.2,1) forwards",pointerEvents:"none",zIndex:10}}/>
  ));
}
function Btn({children,onClick,style,disabled,hapticPattern,rippleColor,...rest}) {
  const [ripples,addRipple]=useRipple();
  const [pressed,setPressed]=useState(false);
  const [hovered,setHovered]=useState(false);
  const handleClick=e=>{ if(disabled)return; addRipple(e); haptic(hapticPattern||H.tap); onClick?.(e); };
  return (
    <button {...rest} disabled={disabled} onClick={handleClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setPressed(false);}}
      style={{position:"relative",overflow:"hidden",transform:pressed?"scale(0.96)":hovered?"scale(1.01)":"scale(1)",transition:"transform 0.12s cubic-bezier(0.4,0,0.2,1),background 0.15s,color 0.15s,border-color 0.15s,box-shadow 0.15s",cursor:disabled?"not-allowed":"pointer",...style}}>
      {children}<RippleLayer ripples={ripples} color={rippleColor}/>
    </button>
  );
}
function MotionCard({children,style,onClick,hapticPattern,lift=true}) {
  const [hovered,setHovered]=useState(false);
  const [pressed,setPressed]=useState(false);
  const [ripples,addRipple]=useRipple();
  const handleClick=e=>{ addRipple(e); haptic(hapticPattern||H.soft); onClick?.(e); };
  return (
    <div onClick={onClick?handleClick:undefined} onMouseDown={()=>onClick&&setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setPressed(false);}}
      style={{position:"relative",overflow:"hidden",transform:pressed?"scale(0.985)":(lift&&hovered)?"translateY(-2px)":"none",transition:"transform 0.15s cubic-bezier(0.4,0,0.2,1),box-shadow 0.15s",boxShadow:lift&&hovered?"0 4px 16px rgba(0,0,0,0.08)":"none",cursor:onClick?"pointer":"default",...style}}>
      {children}{onClick&&<RippleLayer ripples={ripples} color="rgba(0,0,0,0.05)"/>}
    </div>
  );
}
function PageView({children,viewKey}){return <div key={viewKey} style={{animation:"vFadeUp 0.28s cubic-bezier(0.4,0,0.2,1) both"}}>{children}</div>;}
function StaggerItem({children,index,style}){return <div style={{animation:"vFadeUp 0.3s cubic-bezier(0.4,0,0.2,1) both",animationDelay:`${index*0.055}s`,...style}}>{children}</div>;}

/* ════════ TOAST SYSTEM ════════ */
function useToast() {
  const [toasts,setToasts]=useState([]);
  const add=useCallback((type,msg,duration=3500)=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,type,msg,dying:false}]);
    setTimeout(()=>setToasts(t=>t.map(x=>x.id===id?{...x,dying:true}:x)),duration-400);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),duration);
  },[]);
  return [toasts,add];
}
function ToastContainer({toasts}) {
  const icons={success:"✓",error:"✕",warning:"⚠",info:"ℹ"};
  const colors={success:{bg:T.greenDark,text:T.white},error:{bg:T.red,text:T.white},warning:{bg:T.amber,text:T.black},info:{bg:T.blue,text:T.white}};
  return (
    <div style={{position:"fixed",top:"16px",right:"16px",zIndex:9999,display:"flex",flexDirection:"column",gap:"8px",maxWidth:"340px",width:"calc(100vw - 32px)"}}>
      {toasts.map(t=>{const c=colors[t.type]||colors.info;return(
        <div key={t.id} style={{background:c.bg,color:c.text,padding:"12px 16px",display:"flex",alignItems:"flex-start",gap:"10px",animation:t.dying?"vToastOut 0.4s ease forwards":"vToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",fontFamily:F,boxShadow:"0 4px 20px rgba(0,0,0,0.18)"}}>
          <span style={{fontSize:"14px",fontWeight:800,flexShrink:0,marginTop:"1px"}}>{icons[t.type]}</span>
          <span style={{fontSize:"12px",fontWeight:700,lineHeight:1.4}}>{t.msg}</span>
        </div>
      );})}
    </div>
  );
}

/* ════════ MODAL SYSTEM ════════ */
function Modal({open,onClose,children,title,isMobile,width="480px"}) {
  useEffect(()=>{
    if(open){document.body.style.overflow="hidden";}else{document.body.style.overflow="";}
    return()=>{document.body.style.overflow="";};
  },[open]);
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",animation:"vFadeIn 0.2s ease"}} onClick={onClose}/>
      <div style={{position:"relative",background:T.white,width:isMobile?"100%":width,maxWidth:"100vw",maxHeight:isMobile?"92vh":"85vh",overflowY:"auto",animation:isMobile?"vDrawerUp 0.3s cubic-bezier(0.4,0,0.2,1)":"vModalIn 0.25s ease",zIndex:1}}>
        {isMobile&&<div style={{width:"36px",height:"4px",background:T.gray200,borderRadius:"2px",margin:"10px auto 0",display:"block"}}/>}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"15px",fontWeight:800,color:T.black}}>{title}</div>
          <Btn onClick={onClose} style={{background:"none",border:"none",color:T.gray400,fontSize:"18px",fontWeight:400,padding:"0 4px",lineHeight:1}}>✕</Btn>
        </div>
        <div style={{padding:"20px 24px"}}>{children}</div>
      </div>
    </div>
  );
}
function ModalRow({label,value}){return <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px"}}><span style={{color:T.gray400,fontWeight:600}}>{label}</span><span style={{fontWeight:700,color:T.black}}>{value}</span></div>;}
function InputField({label,value,onChange,type="text",placeholder,prefix,suffix,hint}){
  return(
    <div style={{marginBottom:"14px"}}>
      {label&&<div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{label}</div>}
      <div style={{display:"flex",alignItems:"center",border:`2px solid ${T.gray200}`,transition:"border-color 0.15s",onFocus:"border-color: black"}}>
        {prefix&&<span style={{padding:"10px 12px",fontSize:"13px",fontWeight:700,color:T.gray400,borderRight:`1px solid ${T.gray100}`,whiteSpace:"nowrap"}}>{prefix}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={e=>e.currentTarget.parentElement.style.borderColor=T.black}
          onBlur={e=>e.currentTarget.parentElement.style.borderColor=T.gray200}
          style={{flex:1,border:"none",padding:"11px 12px",fontSize:"14px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:"transparent",width:"100%"}}/>
        {suffix&&<span style={{padding:"10px 12px",fontSize:"12px",fontWeight:700,color:T.gray400,borderLeft:`1px solid ${T.gray100}`,whiteSpace:"nowrap"}}>{suffix}</span>}
      </div>
      {hint&&<div style={{fontSize:"11px",color:T.gray400,marginTop:"4px"}}>{hint}</div>}
    </div>
  );
}
function SelectField({label,value,onChange,options}){
  return(
    <div style={{marginBottom:"14px"}}>
      {label&&<div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",border:`2px solid ${T.gray200}`,padding:"11px 12px",fontSize:"13px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:T.white,appearance:"none",cursor:"pointer"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ════════ SHARED DATA ════════ */
const DEPOT_LIST = [
  {id:1,name:"Nepal Energies",location:"Apapa, Lagos",pms:795,ago:null,stock:61200,cap:85000,rating:4.8,orders:312,slots:5,eta:"4–6h"},
  {id:2,name:"Eterna Plc",location:"Warri, Delta",pms:797,ago:1185,stock:38400,cap:60000,rating:4.6,orders:198,slots:3,eta:"6–8h"},
  {id:3,name:"Matrix Energy",location:"Port Harcourt, Rivers",pms:800,ago:1190,stock:53200,cap:70000,rating:4.7,orders:241,slots:4,eta:"8–10h"},
  {id:4,name:"MRS Oil",location:"Kano, Kano State",pms:803,ago:1175,stock:31500,cap:45000,rating:4.5,orders:112,slots:2,eta:"5–7h"},
];
const INITIAL_ORDERS = [
  {id:"VTL-00841",buyer:"Chukwuma Fuels Ltd",depot:"Nepal Energies",product:"PMS",vol:90000,value:71700000,status:"delivered",placed:"Mar 8",trucks:3,progress:100},
  {id:"VTL-00838",buyer:"Chukwuma Fuels Ltd",depot:"Nepal Energies",product:"PMS",vol:66000,value:52470000,status:"in_transit",placed:"Mar 10",trucks:2,progress:65},
  {id:"VTL-00835",buyer:"Chukwuma Fuels Ltd",depot:"Eterna Plc",product:"AGO",vol:33000,value:39105000,status:"confirmed",placed:"Mar 10",trucks:1,progress:20},
];
const INITIAL_INCOMING = [
  {id:"VTL-00843",buyer:"Horizon Petroleum",type:"Petrol Station",product:"PMS",vol:99000,value:78705000,trucks:3,location:"Ikeja, Lagos",submitted:"12 min ago",slaLeft:"1h 48m",status:"pending"},
  {id:"VTL-00842",buyer:"Skyline Aviation",type:"Aviation",product:"AGO",vol:33000,value:39105000,trucks:1,location:"Murtala Airport",submitted:"34 min ago",slaLeft:"1h 26m",status:"pending"},
  {id:"VTL-00840",buyer:"Femi Oil & Gas",type:"Petrol Station",product:"PMS",vol:66000,value:52470000,trucks:2,location:"Lekki, Lagos",submitted:"2h ago",slaLeft:"Confirmed",status:"confirmed"},
];
const INITIAL_SLOTS = [
  {id:"s1",time:"07:00",bay:"Bay 1",orderId:"VTL-00841",product:"PMS",trucks:3,status:"in_transit",driver:"Emeka Nwosu",truck:"LSD-481-KJ"},
  {id:"s2",time:"09:00",bay:"Bay 2",orderId:"VTL-00839",product:"PMS",trucks:4,status:"loading",driver:"Bayo Adeyemi",truck:"LSD-219-AB"},
  {id:"s3",time:"11:00",bay:"Bay 1",orderId:"VTL-00840",product:"PMS",trucks:2,status:"confirmed",driver:"Chidi Okafor",truck:"LSD-334-MN"},
  {id:"s4",time:"13:00",bay:"Bay 2",orderId:"VTL-00842",product:"AGO",trucks:1,status:"pending",driver:"—",truck:"—"},
  {id:"s5",time:"15:00",bay:"Bay 1",orderId:null,product:null,trucks:null,status:"open",driver:null,truck:null},
  {id:"s6",time:"17:00",bay:"Bay 2",orderId:null,product:null,trucks:null,status:"open",driver:null,truck:null},
];
const BUYERS_DATA = [
  {name:"Chukwuma Fuels Ltd",type:"Petrol Station",orders:7,vol:"363k L",spend:"₦280.5M",score:720,tier:"Silver",lastOrder:"Mar 10",email:"ops@chukwumafuels.ng",phone:"+234 803 421 0044"},
  {name:"Horizon Petroleum",type:"Petrol Station",orders:5,vol:"215k L",spend:"₦171.3M",score:810,tier:"Gold",lastOrder:"Mar 9",email:"fuel@horizonpetro.ng",phone:"+234 805 776 3321"},
  {name:"Silvergate Energy",type:"Petrol Station",orders:4,vol:"396k L",spend:"₦316.5M",score:680,tier:"Silver",lastOrder:"Mar 8",email:"orders@silvergate.ng",phone:"+234 706 243 8800"},
  {name:"Skyline Aviation",type:"Aviation",orders:3,vol:"99k L",spend:"₦117.3M",score:760,tier:"Silver",lastOrder:"Mar 7",email:"fuel@skylineaviation.ng",phone:"+234 809 100 2222"},
  {name:"Femi Oil & Gas",type:"Petrol Station",orders:2,vol:"66k L",spend:"₦52.5M",score:590,tier:"Bronze",lastOrder:"Mar 5",email:"femi@femioilgas.ng",phone:"+234 802 334 1199"},
];
const INITIAL_TXNS = [
  {id:"TXN-4421",desc:"Wallet Top-up",amount:150000000,date:"Mar 10",type:"credit"},
  {id:"TXN-4420",desc:"Order VTL-00841 — Escrow Hold",amount:-71700000,date:"Mar 8",type:"debit"},
  {id:"TXN-4419",desc:"Order VTL-00838 — Escrow Hold",amount:-52470000,date:"Mar 10",type:"debit"},
  {id:"TXN-4418",desc:"Order VTL-00841 — Escrow Released",amount:71700000,date:"Mar 8",type:"released"},
];
const PRICE_HISTORY=[
  {day:"Mar 4",pms:792,ago:1170},{day:"Mar 5",pms:793,ago:1172},{day:"Mar 6",pms:795,ago:1175},
  {day:"Mar 7",pms:794,ago:1174},{day:"Mar 8",pms:797,ago:1180},{day:"Mar 9",pms:800,ago:1185},{day:"Mar 10",pms:795,ago:1185},
];
const REVENUE_DATA=[{month:"Oct",revenue:95},{month:"Nov",revenue:124},{month:"Dec",revenue:148},{month:"Jan",revenue:167},{month:"Feb",revenue:198},{month:"Mar",revenue:218}];
const DAILY=[{day:"Mon",pms:4,ago:2},{day:"Tue",pms:3,ago:1},{day:"Wed",pms:5,ago:3},{day:"Thu",pms:6,ago:2},{day:"Fri",pms:4,ago:4},{day:"Sat",pms:7,ago:1},{day:"Sun",pms:2,ago:0}];
const SCHEDULE_DAYS = ["Mon 10 Mar","Tue 11 Mar","Wed 12 Mar","Thu 13 Mar","Fri 14 Mar"];

/* ════════ SHARED COMPONENTS ════════ */
const STATUS_CFG = {
  delivered:{label:"Delivered",bg:T.greenLight,color:T.greenDark},
  in_transit:{label:"In Transit",bg:T.blueLight,color:T.blue},
  confirmed:{label:"Confirmed",bg:T.amberLight,color:"#8A5C00"},
  loading:{label:"Loading",bg:T.gray100,color:T.gray600},
  disputed:{label:"Disputed",bg:T.redLight,color:T.red},
  pending:{label:"Pending",bg:T.gray100,color:T.gray600},
  open:{label:"Available",bg:T.greenLight,color:T.greenDark},
};
function Badge({status}){const c=STATUS_CFG[status]||{label:status,bg:T.gray100,color:T.gray600};return <span style={{background:c.bg,color:c.color,fontSize:"11px",fontWeight:700,padding:"3px 8px",borderRadius:"4px",display:"inline-block",whiteSpace:"nowrap"}}>{c.label}</span>;}
const ChartTip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.black,padding:"10px 14px",borderRadius:"6px",fontFamily:F,animation:"vFadeIn 0.15s ease"}}><div style={{color:T.gray400,fontSize:"11px",marginBottom:"5px"}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:T.white,fontSize:"12px",fontWeight:700}}>{p.name}: {p.value}</div>)}</div>);};
function Icon({d,size=18}){return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>);}
function KpiCard({label,value,sub,alert,accent,index=0}){return(<div style={{background:T.white,padding:"18px 20px",borderLeft:alert?`3px solid ${T.amber}`:accent?`3px solid ${accent}`:"none",animation:"vScaleIn 0.35s cubic-bezier(0.4,0,0.2,1) both",animationDelay:`${index*0.07}s`}}><div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>{label}</div><div style={{fontSize:"24px",fontWeight:800,color:alert?"#8A5C00":T.black,letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>{sub&&<div style={{fontSize:"11px",color:T.gray400,marginTop:"5px",fontWeight:600}}>{sub}</div>}</div>);}
function SectionHead({title,sub,right}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px",gap:"12px",flexWrap:"wrap"}}><div><div style={{fontSize:"14px",fontWeight:800,color:T.black}}>{title}</div>{sub&&<div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{sub}</div>}</div>{right&&<div style={{flexShrink:0}}>{right}</div>}</div>);}
function Card({children,pad=true,style={}}){return <div style={{border:`1px solid ${T.gray100}`,background:T.white,...(pad?{padding:"20px"}:{}),marginBottom:"14px",...style}}>{children}</div>;}
function Th({children}){return <th style={{padding:"10px 18px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{children}</th>;}

/* ════════ CSV EXPORT ════════ */
function exportCSV(filename,headers,rows){
  const csv=[headers.join(","),...rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}

/* ════════ SIDEBAR / NAV ════════ */
function Sidebar({navItems,active,setActive,identity,portalLabel,isMobile}){
  if(isMobile)return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.black,borderTop:"1px solid #1A1A1A",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {navItems.map(n=>(
        <Btn key={n.id} hapticPattern={H.nav} rippleColor="rgba(6,193,103,0.2)" onClick={()=>setActive(n.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 4px",background:"none",border:"none",fontFamily:F,color:active===n.id?T.green:"#555",position:"relative",minHeight:"56px"}}>
          {n.badge&&<span style={{position:"absolute",top:"6px",right:"calc(50% - 14px)",background:T.red,color:T.white,fontSize:"9px",fontWeight:800,padding:"1px 4px",borderRadius:"8px",minWidth:"16px",textAlign:"center",animation:"vPulse 2s ease-in-out infinite"}}>{n.badge}</span>}
          <span style={{display:"block",transform:active===n.id?"scale(1.1)":"scale(1)",transition:"transform 0.2s cubic-bezier(0.34,1.56,0.64,1)"}}><Icon d={n.icon} size={20}/></span>
          <span style={{fontSize:"9px",fontWeight:700,marginTop:"3px",textTransform:"uppercase",letterSpacing:"0.04em"}}>{n.shortLabel||n.label}</span>
          {active===n.id&&<span style={{position:"absolute",bottom:"6px",left:"50%",transform:"translateX(-50%)",width:"16px",height:"2px",background:T.green,borderRadius:"1px",animation:"vFadeIn 0.2s ease"}}/>}
        </Btn>
      ))}
    </div>
  );
  return(
    <div style={{width:"210px",background:T.black,minHeight:"100vh",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
      <div style={{padding:"24px 20px 20px",borderBottom:"1px solid #1A1A1A"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"30px",height:"30px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>V</span>
          </div>
          <div><div style={{fontSize:"14px",fontWeight:800,color:T.white}}>Ventryl</div><div style={{fontSize:"9px",fontWeight:700,color:portalLabel==="Buyer Portal"?T.green:T.blue,letterSpacing:"0.1em",textTransform:"uppercase"}}>{portalLabel}</div></div>
        </div>
      </div>
      <nav style={{padding:"14px 10px",flex:1}}>
        {navItems.map((n,i)=>(
          <Btn key={n.id} hapticPattern={H.nav} rippleColor={active===n.id?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.1)"} onClick={()=>setActive(n.id)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:"9px",padding:"10px 12px",borderRadius:"5px",background:active===n.id?T.white:"transparent",color:active===n.id?T.black:"#888",border:"none",marginBottom:"2px",fontFamily:F,fontSize:"12px",fontWeight:active===n.id?800:600,textAlign:"left",animationDelay:`${i*0.05}s`,animation:"vSlideLeft 0.3s both"}}>
            <span style={{transition:"transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",transform:active===n.id?"scale(1.1)":"scale(1)"}}><Icon d={n.icon} size={15}/></span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge&&<span style={{background:T.red,color:T.white,fontSize:"10px",fontWeight:800,padding:"1px 5px",borderRadius:"10px",animation:"vPulse 2s ease-in-out infinite"}}>{n.badge}</span>}
          </Btn>
        ))}
      </nav>
      <div style={{padding:"16px 20px",borderTop:"1px solid #1A1A1A"}}>
        <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
          <div style={{width:"30px",height:"30px",background:identity.bg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:800,color:identity.textColor||T.black,flexShrink:0}}>{identity.initials}</div>
          <div><div style={{fontSize:"11px",fontWeight:800,color:T.white}}>{identity.name}</div><div style={{fontSize:"10px",color:"#666"}}>{identity.role}</div></div>
        </div>
      </div>
    </div>
  );
}
function Topbar({crumb,pills,isMobile,portalLabel}){
  return(
    <div style={{background:T.white,borderBottom:`1px solid ${T.gray100}`,padding:`0 ${isMobile?"16px":"28px"}`,height:"52px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        {isMobile&&<div style={{display:"flex",alignItems:"center",gap:"8px",marginRight:"6px"}}><div style={{width:"22px",height:"22px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:"11px",fontWeight:800,color:T.black}}>V</span></div></div>}
        <span style={{fontSize:"10px",color:T.gray400,fontWeight:600}}>{isMobile?portalLabel:"Platform"}</span>
        <span style={{color:T.gray200}}>›</span>
        <span style={{fontSize:"12px",fontWeight:800,color:T.black,animation:"vFadeIn 0.2s ease"}}>{crumb}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"nowrap"}}>
        {pills?.filter((_,i)=>!isMobile||i<2).map((p,i)=>(
          <div key={i} style={{background:p.bg,color:p.color,fontSize:"10px",fontWeight:800,padding:"3px 8px",borderRadius:"3px",whiteSpace:"nowrap",animation:`vFadeIn 0.3s ${i*0.1}s both`}}>{p.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ════════ ORDER FLOW ════════ */
function OrderFlow({onDone,isMobile,addToast,walletBalance,setWalletBalance,setOrders,setTxns}){
  const [step,setStep]=useState(1);
  const [sel,setSel]=useState(null);
  const [prod,setProd]=useState("PMS");
  const [vol,setVol]=useState(66000);
  const [done,setDone]=useState(false);
  const [placing,setPlacing]=useState(false);
  const trucks=Math.ceil(vol/33000);
  const price=sel?(prod==="PMS"?sel.pms:sel.ago||sel.pms):0;
  const total=price*vol;
  const newOrderId="VTL-0084"+(Math.floor(Math.random()*9)+5);

  const handleConfirmPay=()=>{
    if(total>walletBalance){addToast("error","Insufficient wallet balance. Please fund your wallet.");return;}
    setPlacing(true);
    haptic(H.confirm);
    setTimeout(()=>{
      setWalletBalance(b=>b-total);
      setTxns(t=>[{id:"TXN-"+(4422+Math.floor(Math.random()*10)),desc:`Order ${newOrderId} — Escrow Hold`,amount:-total,date:"Mar 10",type:"debit"},...t]);
      setOrders(prev=>[{id:newOrderId,buyer:"Chukwuma Fuels Ltd",depot:sel.name,product:prod,vol,value:total,status:"confirmed",placed:"Mar 10",trucks,progress:15},...prev]);
      setPlacing(false);
      setDone(true);
      addToast("success",`Order ${newOrderId} placed! ${fmt(total)} held in KrediBank escrow.`);
    },1200);
  };

  if(done)return(
    <div style={{maxWidth:"420px",margin:"32px auto",textAlign:"center",padding:"0 16px",animation:"vFadeUp 0.4s ease"}}>
      <div style={{width:"60px",height:"60px",background:T.greenLight,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:"24px",animation:"vCheckPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both"}}>✓</div>
      <div style={{fontSize:"20px",fontWeight:800,color:T.black,marginBottom:"6px",animation:"vFadeUp 0.3s 0.2s both"}}>Order Placed</div>
      <div style={{fontSize:"13px",color:T.gray400,marginBottom:"24px",animation:"vFadeUp 0.3s 0.3s both"}}>{sel?.name} will confirm within 2 hours. Track in My Orders.</div>
      <div style={{border:`1px solid ${T.gray100}`,marginBottom:"18px",textAlign:"left",animation:"vFadeUp 0.3s 0.35s both"}}>
        {[["Order ID",newOrderId],["Depot",sel?.name],["Product",prod],["Volume",`${(vol/1000).toFixed(0)}k L`],["Trucks",`${trucks} tanker${trucks>1?"s":""}`],["Total (Escrow)",fmt(total)]].map(([k,v],i)=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 18px",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px",animation:`vFadeUp 0.25s ${0.4+i*0.05}s both`}}>
            <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{color:T.black,fontWeight:800}}>{v}</span>
          </div>
        ))}
      </div>
      <Btn hapticPattern={H.tap} onClick={onDone} style={{background:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%",animation:"vFadeUp 0.3s 0.6s both"}}>Back to Dashboard</Btn>
    </div>
  );

  const stepLabels=["Depot","Configure","Pay"];
  return(
    <div style={{maxWidth:"660px",margin:"0 auto",padding:isMobile?"0":"0 8px"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:"24px"}}>
        {stepLabels.map((s,i,arr)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?"1":"0"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:step>i+1?T.green:step===i+1?T.black:T.gray200,color:step>=i+1?T.white:T.gray400,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,flexShrink:0,transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",transform:step===i+1?"scale(1.1)":"scale(1)"}}>{step>i+1?"✓":i+1}</div>
              {!isMobile&&<span style={{fontSize:"12px",fontWeight:700,color:step===i+1?T.black:T.gray400,transition:"color 0.2s"}}>{s}</span>}
            </div>
            {i<arr.length-1&&<div style={{flex:1,height:"2px",background:step>i+1?T.green:T.gray200,margin:"0 8px",transition:"background 0.4s ease"}}/>}
          </div>
        ))}
      </div>

      {step===1&&(
        <div style={{animation:"vFadeUp 0.25s ease"}}>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"14px"}}>Choose a Depot</div>
          {[...DEPOT_LIST].sort((a,b)=>a.pms-b.pms).map((d,i)=>(
            <MotionCard key={d.id} hapticPattern={H.soft} onClick={()=>setSel(d)}
              style={{border:`2px solid ${sel?.id===d.id?T.green:T.gray100}`,background:T.white,padding:"16px",marginBottom:"10px",transition:"border-color 0.15s",animation:`vFadeUp 0.3s ${i*0.06}s both`}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{width:"30px",height:"30px",background:i===0?T.green:T.gray100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:800,color:i===0?T.white:T.gray600,flexShrink:0,marginTop:"2px"}}>{i+1}</div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>{d.name}</span>
                      {i===0&&<span style={{background:T.greenLight,color:T.greenDark,fontSize:"9px",fontWeight:800,padding:"2px 6px"}}>BEST PRICE</span>}
                    </div>
                    <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{d.location} · ETA {d.eta} · ★{d.rating}</div>
                    <div style={{fontSize:"11px",color:T.gray400}}>{d.slots} slots available today</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"18px",fontWeight:800,color:i===0?T.green:T.black}}>₦{d.pms}/L</div>
                  {d.ago&&<div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>AGO ₦{d.ago.toLocaleString()}/L</div>}
                </div>
              </div>
            </MotionCard>
          ))}
          <Btn disabled={!sel} hapticPattern={H.double} onClick={()=>setStep(2)} style={{background:sel?T.black:T.gray200,color:sel?T.white:T.gray400,border:"none",padding:"14px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%",marginTop:"8px"}}>
            Continue with {sel?.name||"a depot"} →
          </Btn>
        </div>
      )}

      {step===2&&(
        <div style={{animation:"vFadeUp 0.25s ease"}}>
          <Btn hapticPattern={H.soft} onClick={()=>setStep(1)} style={{background:"none",border:"none",color:T.gray400,fontFamily:F,fontSize:"12px",fontWeight:700,marginBottom:"14px",padding:0}}>← Back</Btn>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"18px"}}>Configure Order</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"18px"}}>
            <div>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>Product</div>
              <div style={{display:"flex",gap:"8px"}}>
                {["PMS",sel.ago?"AGO":null].filter(Boolean).map(p=>(
                  <Btn key={p} hapticPattern={H.soft} onClick={()=>setProd(p)} style={{flex:1,padding:"12px",border:`2px solid ${prod===p?T.black:T.gray200}`,background:prod===p?T.black:T.white,color:prod===p?T.white:T.black,fontFamily:F,fontSize:"14px",fontWeight:800,minHeight:"48px"}}>{p}</Btn>
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
            <input type="range" min={33000} max={198000} step={33000} value={vol} onChange={e=>{setVol(Number(e.target.value));haptic(H.soft);}} style={{width:"100%",cursor:"pointer",height:"6px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
              <span style={{fontSize:"10px",color:T.gray400}}>33k L (1 truck)</span>
              <span style={{fontSize:"10px",color:T.gray400}}>198k L (6 trucks)</span>
            </div>
          </div>
          <div style={{background:T.black,padding:"18px",marginBottom:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
              {[["Trucks",trucks],["Volume",`${(vol/1000).toFixed(0)}k L`],["Total",fmtM(total)]].map(([l,v])=>(
                <div key={l}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>{l}</div><div style={{fontSize:"20px",fontWeight:800,color:T.white,transition:"all 0.3s"}}>{v}</div></div>
              ))}
            </div>
            <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #222",fontSize:"10px",color:T.gray400}}>⌈{(vol/1000).toFixed(0)}k ÷ 33k⌉ = {trucks} truck{trucks>1?"s":""}  ·  Escrow held until delivery confirmed</div>
          </div>
          <Btn hapticPattern={H.double} onClick={()=>setStep(3)} style={{background:T.green,color:T.white,border:"none",padding:"14px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%",minHeight:"48px"}}>Review Order →</Btn>
        </div>
      )}

      {step===3&&(
        <div style={{animation:"vFadeUp 0.25s ease"}}>
          <Btn hapticPattern={H.soft} onClick={()=>setStep(2)} style={{background:"none",border:"none",color:T.gray400,fontFamily:F,fontSize:"12px",fontWeight:700,marginBottom:"14px",padding:0}}>← Back</Btn>
          <div style={{fontSize:"16px",fontWeight:800,color:T.black,marginBottom:"16px"}}>Review & Pay</div>
          <div style={{border:`1px solid ${T.gray100}`,background:T.white,marginBottom:"12px"}}>
            {[["Depot",sel.name],["Location",sel.location],["Product",prod],["Price",`₦${price}/L`],["Volume",`${(vol/1000).toFixed(0)},000 L`],["Trucks",`${trucks}×33k L`],["ETA",sel.eta]].map(([k,v],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 18px",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px",animation:`vFadeUp 0.2s ${i*0.05}s both`}}>
                <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{color:T.black,fontWeight:700}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"14px 18px",fontSize:"15px"}}>
              <span style={{fontWeight:800,color:T.black}}>Total (Escrow)</span><span style={{fontWeight:800,color:T.black}}>{fmt(total)}</span>
            </div>
          </div>
          <div style={{background:T.amberLight,padding:"12px 16px",marginBottom:"10px",fontSize:"12px",color:"#8A5C00",fontWeight:600,lineHeight:1.5}}>💡 Payment held by KrediBank until you confirm delivery at your station.</div>
          <div style={{background:total>walletBalance?T.redLight:T.greenLight,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <div><div style={{fontSize:"10px",fontWeight:700,color:total>walletBalance?T.red:T.greenDark,textTransform:"uppercase"}}>Wallet Balance</div><div style={{fontSize:"17px",fontWeight:800,color:total>walletBalance?T.red:T.greenDark}}>{fmt(walletBalance)}</div></div>
            <div style={{fontSize:"12px",fontWeight:800,color:total>walletBalance?T.red:T.greenDark}}>{total>walletBalance?"⚠ Insufficient — Fund wallet first":"✓ Sufficient"}</div>
          </div>
          <Btn hapticPattern={H.confirm} disabled={placing||total>walletBalance} onClick={handleConfirmPay}
            style={{background:placing?"#888":total>walletBalance?T.gray200:T.green,color:T.white,border:"none",padding:"14px",fontSize:"14px",fontWeight:800,fontFamily:F,width:"100%",minHeight:"48px"}}>
            {placing?"Processing...":`Confirm & Pay ${fmt(total)}`}
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ════════ FUND WALLET MODAL ════════ */
function FundWalletModal({open,onClose,isMobile,addToast,walletBalance,setWalletBalance,setTxns}){
  const [amount,setAmount]=useState("");
  const [bank,setBank]=useState("gtb");
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const presets=[5000000,10000000,25000000,50000000];
  const num=Number(String(amount).replace(/,/g,""))||0;
  const banks=[{value:"gtb",label:"Guaranty Trust Bank"},{value:"access",label:"Access Bank"},{value:"zenith",label:"Zenith Bank"},{value:"uba",label:"United Bank for Africa"},{value:"fcmb",label:"First City Monument Bank"}];

  const handleFund=()=>{
    if(num<100000){addToast("warning","Minimum funding amount is ₦100,000");return;}
    setLoading(true);
    haptic(H.confirm);
    setTimeout(()=>{
      setWalletBalance(b=>b+num);
      const txnId="TXN-"+(4430+Math.floor(Math.random()*100));
      setTxns(t=>[{id:txnId,desc:"Wallet Top-up",amount:num,date:"Mar 10",type:"credit"},...t]);
      setLoading(false);setStep(2);
      addToast("success",`Wallet funded with ${fmt(num)} successfully!`);
    },1800);
  };

  const handleClose=()=>{setStep(1);setAmount("");onClose();};

  return(
    <Modal open={open} onClose={handleClose} title="Fund Wallet" isMobile={isMobile} width="440px">
      {step===1?(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
            {presets.map(p=>(
              <Btn key={p} hapticPattern={H.soft} onClick={()=>setAmount(p.toLocaleString())}
                style={{background:amount===p.toLocaleString()?T.black:T.gray50,color:amount===p.toLocaleString()?T.white:T.black,border:`1px solid ${amount===p.toLocaleString()?T.black:T.gray200}`,padding:"10px",fontSize:"13px",fontWeight:800,fontFamily:F,transition:"all 0.15s"}}>
                {fmtM(p)}
              </Btn>
            ))}
          </div>
          <InputField label="Custom amount" value={amount} onChange={setAmount} prefix="₦" placeholder="0" type="text" hint="Minimum: ₦100,000"/>
          <SelectField label="Source bank account" value={bank} onChange={setBank} options={banks}/>
          <div style={{background:T.gray50,padding:"12px 14px",marginBottom:"16px",fontSize:"12px",color:T.gray600,lineHeight:1.5}}>💳 Funds will be transferred via Paystack and reflected instantly in your Ventryl wallet.</div>
          <Btn hapticPattern={H.confirm} disabled={loading||num<100000} onClick={handleFund} style={{background:loading||num<100000?T.gray200:T.green,color:loading||num<100000?T.gray400:T.black,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%",minHeight:"48px"}}>
            {loading?"Processing...":num>=100000?`Fund ${fmt(num)}`:"Enter an amount"}
          </Btn>
        </>
      ):(
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:"40px",marginBottom:"12px",animation:"vCheckPop 0.5s ease"}}>✅</div>
          <div style={{fontSize:"17px",fontWeight:800,color:T.black,marginBottom:"6px"}}>{fmt(num)} Added</div>
          <div style={{fontSize:"13px",color:T.gray400,marginBottom:"8px"}}>New balance: {fmt(walletBalance)}</div>
          <div style={{background:T.greenLight,padding:"10px",marginBottom:"20px",fontSize:"12px",color:T.greenDark,fontWeight:600}}>Transaction ID: TXN-{Date.now().toString().slice(-6)}</div>
          <Btn hapticPattern={H.tap} onClick={handleClose} style={{background:T.black,color:T.white,border:"none",padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%"}}>Done</Btn>
        </div>
      )}
    </Modal>
  );
}

/* ════════ WITHDRAW MODAL ════════ */
function WithdrawModal({open,onClose,isMobile,addToast,walletBalance,setWalletBalance,setTxns}){
  const [amount,setAmount]=useState("");
  const [acct,setAcct]=useState("");
  const [bank,setBank]=useState("gtb");
  const [loading,setLoading]=useState(false);
  const num=Number(String(amount).replace(/,/g,""))||0;
  const banks=[{value:"gtb",label:"GTBank"},{value:"access",label:"Access Bank"},{value:"zenith",label:"Zenith Bank"},{value:"uba",label:"UBA"}];

  const handleWithdraw=()=>{
    if(num<50000){addToast("warning","Minimum withdrawal is ₦50,000");return;}
    if(num>walletBalance){addToast("error","Amount exceeds available balance");return;}
    if(acct.length<10){addToast("warning","Enter a valid 10-digit account number");return;}
    setLoading(true);haptic(H.confirm);
    setTimeout(()=>{
      setWalletBalance(b=>b-num);
      setTxns(t=>[{id:"TXN-"+(4440+Math.floor(Math.random()*100)),desc:"Withdrawal",amount:-num,date:"Mar 10",type:"debit"},...t]);
      setLoading(false);onClose();setAmount("");setAcct("");
      addToast("success",`₦${num.toLocaleString()} withdrawal initiated. 1–2 business hours.`);
    },1600);
  };

  return(
    <Modal open={open} onClose={onClose} title="Withdraw Funds" isMobile={isMobile} width="440px">
      <div style={{background:T.gray50,padding:"12px 14px",marginBottom:"16px",display:"flex",justifyContent:"space-between"}}>
        <div><div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>Available</div><div style={{fontSize:"18px",fontWeight:800,color:T.black}}>{fmt(walletBalance)}</div></div>
        <Btn hapticPattern={H.soft} onClick={()=>setAmount(walletBalance.toLocaleString())} style={{background:T.black,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,fontFamily:F,alignSelf:"center"}}>Max</Btn>
      </div>
      <InputField label="Amount to withdraw" value={amount} onChange={setAmount} prefix="₦" placeholder="0" type="text"/>
      <SelectField label="Destination bank" value={bank} onChange={setBank} options={banks}/>
      <InputField label="Account number" value={acct} onChange={setAcct} placeholder="0123456789" hint="10-digit NUBAN account number"/>
      {num>0&&num<=walletBalance&&<div style={{background:T.amberLight,padding:"10px 14px",marginBottom:"14px",fontSize:"12px",color:"#8A5C00",fontWeight:600}}>⚠ Withdrawal is irreversible. Please verify account details.</div>}
      <Btn hapticPattern={H.confirm} disabled={loading} onClick={handleWithdraw} style={{background:loading?T.gray200:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%",minHeight:"48px"}}>
        {loading?"Processing...":num>0?`Withdraw ${fmt(num)}`:"Withdraw"}
      </Btn>
    </Modal>
  );
}

/* ════════ ORDER DETAIL MODAL ════════ */
function OrderDetailModal({open,onClose,order,isMobile,addToast,setOrders,setTxns}){
  const [disputeReason,setDisputeReason]=useState("");
  const [showDispute,setShowDispute]=useState(false);
  const [loading,setLoading]=useState("");
  if(!order)return null;
  const timeline=[
    {label:"Order Placed",done:true,time:order.placed},
    {label:"Confirmed by Depot",done:["confirmed","loading","in_transit","delivered","disputed"].includes(order.status),time:"Within 2h"},
    {label:"Loading at Depot",done:["loading","in_transit","delivered","disputed"].includes(order.status),time:""},
    {label:"In Transit",done:["in_transit","delivered","disputed"].includes(order.status),time:""},
    {label:"Delivered",done:["delivered","disputed"].includes(order.status),time:order.status==="delivered"?"Mar 8":""},
  ];

  const handleConfirmDelivery=()=>{
    setLoading("deliver");haptic(H.confirm);
    setTimeout(()=>{
      setOrders(prev=>prev.map(o=>o.id===order.id?{...o,status:"delivered",progress:100}:o));
      setTxns(t=>[{id:"TXN-"+(4450+Math.floor(Math.random()*100)),desc:`Order ${order.id} — Escrow Released`,amount:order.value,date:"Mar 10",type:"released"},...t]);
      setLoading("");onClose();
      addToast("success",`Delivery confirmed! ${fmt(order.value)} released to depot.`);
    },1200);
  };

  const handleDispute=()=>{
    if(!disputeReason.trim()){addToast("warning","Please describe the issue");return;}
    setLoading("dispute");haptic(H.warning);
    setTimeout(()=>{
      setOrders(prev=>prev.map(o=>o.id===order.id?{...o,status:"disputed"}:o));
      setLoading("");setShowDispute(false);onClose();
      addToast("warning",`Dispute filed for ${order.id}. Our team will respond within 2 hours.`);
    },1000);
  };

  return(
    <Modal open={open} onClose={onClose} title={`Order ${order.id}`} isMobile={isMobile} width="500px">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
        {[["Depot",order.depot],["Product",order.product],["Volume",`${(order.vol/1000).toFixed(0)}k L`],["Trucks",order.trucks],["Value",fmt(order.value)],["Placed",order.placed]].map(([k,v])=>(
          <div key={k} style={{background:T.gray50,padding:"10px 12px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>{k}</div>
            <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:"14px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><span style={{fontSize:"11px",fontWeight:700,color:T.gray400,textTransform:"uppercase"}}>Status</span><Badge status={order.status}/></div></div>

      {/* Timeline */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"12px"}}>Timeline</div>
        {timeline.map((t,i)=>(
          <div key={t.label} style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"12px"}}>
            <div style={{width:"20px",height:"20px",borderRadius:"50%",background:t.done?T.green:T.gray100,border:`2px solid ${t.done?T.green:T.gray200}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"10px",fontWeight:800,color:t.done?T.white:T.gray400,marginTop:"1px"}}>{t.done?"✓":i+1}</div>
            <div style={{flex:1,paddingBottom:"12px",borderBottom:i<timeline.length-1?`1px dashed ${T.gray100}`:"none"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:t.done?T.black:T.gray400}}>{t.label}</div>
              {t.time&&<div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>{t.time}</div>}
            </div>
          </div>
        ))}
      </div>

      {order.status==="in_transit"&&!showDispute&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <Btn hapticPattern={H.confirm} disabled={loading==="deliver"} onClick={handleConfirmDelivery} style={{background:loading==="deliver"?"#888":T.green,color:T.white,border:"none",padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"44px"}}>
            {loading==="deliver"?"Confirming...":"Confirm Delivery"}
          </Btn>
          <Btn hapticPattern={H.warning} onClick={()=>setShowDispute(true)} style={{background:T.white,color:T.red,border:`1px solid ${T.red}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"44px"}}>Raise Dispute</Btn>
        </div>
      )}
      {order.status==="confirmed"&&(
        <div style={{background:T.amberLight,padding:"12px 14px",fontSize:"12px",color:"#8A5C00",fontWeight:600}}>⏳ Awaiting depot confirmation. Expected within 2 hours of placement.</div>
      )}
      {order.status==="delivered"&&(
        <div style={{display:"flex",gap:"10px"}}>
          <div style={{background:T.greenLight,padding:"12px 14px",flex:1,fontSize:"12px",color:T.greenDark,fontWeight:700}}>✓ Delivered · Escrow released to depot</div>
          <Btn hapticPattern={H.warning} onClick={()=>setShowDispute(true)} style={{background:T.white,color:T.gray400,border:`1px solid ${T.gray200}`,padding:"12px 14px",fontSize:"11px",fontWeight:700,fontFamily:F,whiteSpace:"nowrap"}}>Dispute</Btn>
        </div>
      )}
      {showDispute&&(
        <div style={{animation:"vFadeUp 0.2s ease"}}>
          <div style={{fontSize:"12px",fontWeight:700,color:T.black,marginBottom:"8px"}}>Describe the issue</div>
          <textarea value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} placeholder="e.g. Short delivery — ordered 90,000L but received 82,000L. Waybill attached." rows={3}
            style={{width:"100%",border:`2px solid ${T.gray200}`,padding:"10px 12px",fontSize:"12px",fontFamily:F,outline:"none",resize:"vertical",marginBottom:"10px",color:T.black}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <Btn hapticPattern={H.soft} onClick={()=>setShowDispute(false)} style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>Cancel</Btn>
            <Btn hapticPattern={H.warning} disabled={loading==="dispute"} onClick={handleDispute} style={{background:T.red,color:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>{loading==="dispute"?"Filing...":"File Dispute"}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ════════ BUYER DASHBOARD ════════ */
function BuyerDash({onOrder,isMobile,addToast,walletBalance,orders,setOrders,setTxns,setActiveView}){
  const [selectedOrder,setSelectedOrder]=useState(null);
  const [showOrderDetail,setShowOrderDetail]=useState(false);
  const col2=isMobile?"1fr":"1fr 1.3fr";
  const activeOrders=orders.filter(o=>o.status!=="delivered");

  return(
    <div>
      <OrderDetailModal open={showOrderDetail} onClose={()=>setShowOrderDetail(false)} order={selectedOrder} isMobile={isMobile} addToast={addToast} setOrders={setOrders} setTxns={setTxns}/>
      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px",animation:"vFadeIn 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",flexWrap:isMobile?"wrap":"nowrap"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"4px"}}>Buyer Dashboard</div>
            <div style={{fontSize:isMobile?"20px":"24px",fontWeight:800,color:T.white,animation:"vFadeUp 0.3s 0.05s both"}}>Chukwuma Fuels Ltd</div>
            <div style={{fontSize:"11px",color:T.gray400,marginTop:"3px",animation:"vFadeUp 0.3s 0.1s both"}}>RC-1092843 · Lagos · KYB Verified ✓</div>
          </div>
          <div style={{textAlign:isMobile?"left":"right",animation:"vScaleIn 0.4s 0.1s both"}}>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>Wallet Balance</div>
            <div style={{fontSize:isMobile?"22px":"28px",fontWeight:800,color:T.green}}>{fmt(walletBalance)}</div>
            <Btn hapticPattern={H.tap} onClick={()=>setActiveView("wallet")} style={{marginTop:"8px",background:T.green,color:T.black,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"36px"}}>+ Fund Wallet</Btn>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:"1px",background:T.gray100,border:`1px solid ${T.gray100}`,marginBottom:"14px"}}>
        <KpiCard label="Orders MTD" value={orders.length} sub={`${orders.filter(o=>o.status==="delivered").length} delivered`} index={0}/>
        <KpiCard label="Volume" value={`${(orders.reduce((a,o)=>a+o.vol,0)/1000).toFixed(0)}k L`} sub={`${fmtM(orders.reduce((a,o)=>a+o.value,0))}`} index={1}/>
        <KpiCard label="Avg. Price" value="₦795/L" sub="PMS · Mar" index={2}/>
        <KpiCard label="Credit (VCS)" value="720" sub="Silver tier" index={3}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:col2,gap:"14px",marginBottom:"14px"}}>
        <Card pad={false} style={{animation:"vFadeUp 0.35s 0.1s both"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Active Orders</div>
            <span style={{fontSize:"11px",color:T.gray400,fontWeight:600}}>{activeOrders.length} active</span>
          </div>
          {activeOrders.length===0?(
            <div style={{padding:"28px 18px",textAlign:"center",color:T.gray400,fontSize:"12px"}}>No active orders</div>
          ):activeOrders.map((o,i,arr)=>(
            <StaggerItem key={o.id} index={i}>
              <MotionCard onClick={()=>{setSelectedOrder(o);setShowOrderDetail(true);}} hapticPattern={H.soft} style={{padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${T.gray100}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px",gap:"8px"}}>
                  <div>
                    <div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div>
                    <div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{o.depot} · {o.product} · {(o.vol/1000).toFixed(0)}k L</div>
                  </div>
                  <Badge status={o.status}/>
                </div>
                <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${o.progress}%`,background:o.status==="in_transit"?T.blue:T.amber,borderRadius:"2px",animation:"vProgressFill 1s ease both"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                  <span style={{fontSize:"10px",color:T.gray400}}>{o.progress}% complete</span>
                  <span style={{fontSize:"10px",color:T.gray400,fontWeight:600}}>{fmt(o.value)} escrow</span>
                </div>
                {o.status==="in_transit"&&<div style={{marginTop:"8px",fontSize:"10px",color:T.blue,fontWeight:700}}>Tap to confirm delivery →</div>}
              </MotionCard>
            </StaggerItem>
          ))}
          <div style={{padding:"12px 18px"}}>
            <Btn hapticPattern={H.double} onClick={onOrder} style={{width:"100%",background:T.black,color:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"44px"}}>+ Place New Order</Btn>
          </div>
        </Card>

        <Card style={{animation:"vFadeUp 0.35s 0.18s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Price Trend — 7 Days</div>
              <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>₦/Litre · PMS & AGO</div>
            </div>
            <div style={{background:T.amberLight,color:"#8A5C00",fontSize:"10px",fontWeight:800,padding:"4px 8px",animation:"vPulse 3s 1s ease-in-out infinite"}}>📈 Rising next week</div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile?150:180}>
            <LineChart data={PRICE_HISTORY} margin={{top:4,right:0,bottom:0,left:-24}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100}/>
              <XAxis dataKey="day" tick={{fill:T.gray400,fontSize:9,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.gray400,fontSize:9,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false} domain={[780,810]}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="pms" stroke={T.green} strokeWidth={2.5} name="PMS" dot={{fill:T.green,r:3,strokeWidth:0}} animationDuration={1200}/>
              <Line type="monotone" dataKey="ago" stroke={T.blue} strokeWidth={2} name="AGO" dot={{fill:T.blue,r:3,strokeWidth:0}} strokeDasharray="5 3" animationDuration={1400}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:"12px",marginTop:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"10px",height:"2px",background:T.green}}/><span style={{fontSize:"10px",fontWeight:600,color:T.gray400}}>PMS ₦795</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"10px",height:"2px",background:T.blue}}/><span style={{fontSize:"10px",fontWeight:600,color:T.gray400}}>AGO ₦1,185</span></div>
          </div>
        </Card>
      </div>

      <Card pad={false} style={{animation:"vFadeUp 0.35s 0.25s both"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Recent Orders</div>
          <Btn hapticPattern={H.soft} onClick={()=>setActiveView("orders")} style={{background:"none",border:"none",fontSize:"11px",fontWeight:700,color:T.green,fontFamily:F,padding:0}}>View all →</Btn>
        </div>
        {orders.slice(0,3).map((o,i)=>(
          <StaggerItem key={o.id} index={i}>
            <MotionCard onClick={()=>{setSelectedOrder(o);setShowOrderDetail(true);}} hapticPattern={H.soft} style={{padding:"13px 18px",borderBottom:i<2?`1px solid ${T.gray100}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div><div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{o.depot} · {o.product} · {(o.vol/1000).toFixed(0)}k L · {o.placed}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}><span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span><Badge status={o.status}/></div>
            </MotionCard>
          </StaggerItem>
        ))}
      </Card>
    </div>
  );
}

/* ════════ BUYER MARKETPLACE ════════ */
function BuyerMarketplace({onOrder,isMobile,addToast}){
  const [sort,setSort]=useState("price");
  const [search,setSearch]=useState("");
  const sorted=[...DEPOT_LIST].sort((a,b)=>sort==="price"?a.pms-b.pms:sort==="rating"?b.rating-a.rating:b.stock-a.stock)
    .filter(d=>d.name.toLowerCase().includes(search.toLowerCase())||d.location.toLowerCase().includes(search.toLowerCase()));

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px",animation:"vFadeUp 0.25s ease"}}>
        <div><div style={{fontSize:"14px",fontWeight:800,color:T.black}}>Price Discovery</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{sorted.length} depots · NMDPRA verified</div></div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search depots..." style={{border:`1px solid ${T.gray200}`,padding:"6px 10px 6px 28px",fontSize:"11px",fontFamily:F,outline:"none",width:"160px",color:T.black}}/>
            <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",color:T.gray400,fontSize:"12px"}}>🔍</span>
          </div>
          {["price","rating","stock"].map(s=>(
            <Btn key={s} hapticPattern={H.soft} onClick={()=>setSort(s)} style={{background:sort===s?T.black:T.white,color:sort===s?T.white:T.gray600,border:`1px solid ${sort===s?T.black:T.gray200}`,padding:"5px 10px",fontSize:"10px",fontWeight:700,fontFamily:F,borderRadius:"20px",textTransform:"capitalize"}}>{s}</Btn>
          ))}
        </div>
      </div>
      {sorted.length===0&&<div style={{padding:"40px",textAlign:"center",color:T.gray400,fontSize:"13px"}}>No depots match "{search}"</div>}
      {sorted.map((d,i)=>(
        <MotionCard key={d.id} hapticPattern={H.soft} style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"16px",marginBottom:"10px",animation:`vFadeUp 0.3s ${i*0.07}s both`}}>
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
                    <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>{d.location} · ★{d.rating} · {d.slots} slots · ETA {d.eta}</div>
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
                  <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(d.stock/d.cap*100)}%`,background:T.green,animation:"vProgressFill 1s ease both"}}/></div>
                </div>
                <Btn hapticPattern={H.double} onClick={()=>{addToast("info",`Starting order from ${d.name}…`);onOrder();}} style={{background:T.black,color:T.white,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px",flexShrink:0}}>Order →</Btn>
              </div>
            </>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <div style={{width:"36px",height:"36px",background:i===0&&sort==="price"?T.green:T.gray100,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:800,color:i===0&&sort==="price"?T.white:T.gray600,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                  <span style={{fontSize:"14px",fontWeight:800,color:T.black}}>{d.name}</span>
                  <span style={{background:T.greenLight,color:T.greenDark,fontSize:"9px",fontWeight:700,padding:"2px 6px"}}>NMDPRA ✓</span>
                  {i===0&&sort==="price"&&<span style={{background:T.black,color:T.white,fontSize:"9px",fontWeight:800,padding:"2px 6px"}}>BEST PRICE</span>}
                </div>
                <div style={{fontSize:"11px",color:T.gray400}}>{d.location} · ★{d.rating} ({d.orders} orders) · {d.slots} slots today · ETA {d.eta}</div>
              </div>
              <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>PMS</div><div style={{fontSize:"18px",fontWeight:800,color:i===0&&sort==="price"?T.green:T.black}}>₦{d.pms}</div></div>
                {d.ago&&<div style={{textAlign:"center"}}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>AGO</div><div style={{fontSize:"18px",fontWeight:800,color:T.black}}>₦{d.ago.toLocaleString()}</div></div>}
                <div>
                  <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"4px"}}>Stock</div>
                  <div style={{height:"4px",background:T.gray100,borderRadius:"2px",overflow:"hidden",width:"70px"}}><div style={{height:"100%",width:`${Math.round(d.stock/d.cap*100)}%`,background:T.green,animation:"vProgressFill 1s ease both"}}/></div>
                  <div style={{fontSize:"9px",color:T.gray400,marginTop:"2px"}}>{(d.stock/1000).toFixed(0)}k/{(d.cap/1000).toFixed(0)}k MT</div>
                </div>
                <Btn hapticPattern={H.double} onClick={()=>{addToast("info",`Starting order from ${d.name}…`);onOrder();}} style={{background:T.black,color:T.white,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>Order →</Btn>
              </div>
            </div>
          )}
        </MotionCard>
      ))}
    </div>
  );
}

/* ════════ BUYER ORDERS LIST ════════ */
function BuyerOrders({isMobile,orders,addToast,setOrders,setTxns}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [selectedOrder,setSelectedOrder]=useState(null);
  const [showDetail,setShowDetail]=useState(false);
  const filters=["all","in_transit","confirmed","delivered","disputed"];
  const filtered=orders.filter(o=>(filter==="all"||o.status===filter)&&(o.id.toLowerCase().includes(search.toLowerCase())||o.depot.toLowerCase().includes(search.toLowerCase())));

  const handleExport=()=>{
    exportCSV("ventryl-orders.csv",["Order ID","Depot","Product","Volume (L)","Value (₦)","Trucks","Status","Placed"],
      filtered.map(o=>[o.id,o.depot,o.product,o.vol,o.value,o.trucks,o.status,o.placed]));
    addToast("success","Orders exported to CSV");
  };

  return(
    <div>
      <OrderDetailModal open={showDetail} onClose={()=>setShowDetail(false)} order={selectedOrder} isMobile={isMobile} addToast={addToast} setOrders={setOrders} setTxns={setTxns}/>
      <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders..." style={{border:`1px solid ${T.gray200}`,padding:"7px 10px 7px 28px",fontSize:"11px",fontFamily:F,outline:"none",width:"150px",color:T.black}}/>
          <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",color:T.gray400,fontSize:"12px"}}>🔍</span>
        </div>
        {filters.map(f=>(
          <Btn key={f} hapticPattern={H.soft} onClick={()=>setFilter(f)} style={{background:filter===f?T.black:T.white,color:filter===f?T.white:T.gray600,border:`1px solid ${filter===f?T.black:T.gray200}`,padding:"6px 12px",borderRadius:"20px",fontSize:"11px",fontWeight:700,fontFamily:F,textTransform:"capitalize"}}>
            {f==="all"?"All":STATUS_CFG[f]?.label}
          </Btn>
        ))}
        <Btn hapticPattern={H.soft} onClick={handleExport} style={{background:T.white,border:`1px solid ${T.gray200}`,color:T.black,padding:"6px 12px",fontSize:"11px",fontWeight:700,fontFamily:F,marginLeft:"auto"}}>↓ Export CSV</Btn>
      </div>

      {isMobile?(
        filtered.length===0?<div style={{padding:"40px",textAlign:"center",color:T.gray400,fontSize:"13px"}}>No orders found</div>:
        filtered.map((o,i)=>(
          <StaggerItem key={o.id} index={i}>
            <MotionCard onClick={()=>{setSelectedOrder(o);setShowDetail(true);}} hapticPattern={H.soft} style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"7px"}}>
                <div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{o.depot} · {o.product}</div></div>
                <Badge status={o.status}/>
              </div>
              <div style={{display:"flex",gap:"14px"}}>
                <span style={{fontSize:"11px",color:T.gray600,fontWeight:700}}>{(o.vol/1000).toFixed(0)}k L</span>
                <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                <span style={{fontSize:"11px",color:T.gray400}}>{o.placed}</span>
              </div>
            </MotionCard>
          </StaggerItem>
        ))
      ):(
        <Card pad={false}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Order","Depot","Product","Volume","Trucks","Value","Placed","Status",""].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={9} style={{padding:"32px",textAlign:"center",color:T.gray400,fontSize:"13px"}}>No orders match your filter</td></tr>:
              filtered.map((o,i)=>(
                <tr key={o.id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.gray100}`:"none",animation:`vFadeUp 0.2s ${i*0.05}s both`,cursor:"pointer",transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.gray50}
                  onMouseLeave={e=>e.currentTarget.style.background=T.white}
                  onClick={()=>{setSelectedOrder(o);setShowDetail(true);}}>
                  <td style={{padding:"13px 18px",fontSize:"12px",fontWeight:800,color:T.black,fontFamily:F}}>{o.id}</td>
                  <td style={{padding:"13px 18px",fontSize:"12px",color:T.gray800,fontFamily:F}}>{o.depot}</td>
                  <td style={{padding:"13px 18px"}}><span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{o.product}</span></td>
                  <td style={{padding:"13px 18px",fontSize:"12px",color:T.gray600,fontFamily:F}}>{(o.vol/1000).toFixed(0)}k L</td>
                  <td style={{padding:"13px 18px",fontSize:"12px",fontWeight:700,color:T.black,fontFamily:F,textAlign:"center"}}>{o.trucks}</td>
                  <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:800,color:T.black,fontFamily:F}}>{fmtM(o.value)}</td>
                  <td style={{padding:"13px 18px",fontSize:"11px",color:T.gray400,fontFamily:F}}>{o.placed}</td>
                  <td style={{padding:"13px 18px"}}><Badge status={o.status}/></td>
                  <td style={{padding:"13px 18px",fontSize:"11px",color:T.blue,fontWeight:700}}>View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ════════ BUYER WALLET ════════ */
function BuyerWallet({isMobile,addToast,walletBalance,setWalletBalance,txns,setTxns,orders}){
  const [showFund,setShowFund]=useState(false);
  const [showWithdraw,setShowWithdraw]=useState(false);
  const [txnFilter,setTxnFilter]=useState("all");
  const filteredTxns=txns.filter(t=>txnFilter==="all"||t.type===txnFilter);
  const escrowOrders=orders.filter(o=>["confirmed","in_transit","loading"].includes(o.status));
  const escrowTotal=escrowOrders.reduce((a,o)=>a+o.value,0);

  const handleExportStatement=()=>{
    exportCSV("ventryl-statement.csv",["Transaction ID","Description","Amount (₦)","Date","Type"],
      filteredTxns.map(t=>[t.id,t.desc,t.amount,t.date,t.type]));
    addToast("success","Statement exported to CSV");
  };

  return(
    <div>
      <FundWalletModal open={showFund} onClose={()=>setShowFund(false)} isMobile={isMobile} addToast={addToast} walletBalance={walletBalance} setWalletBalance={setWalletBalance} setTxns={setTxns}/>
      <WithdrawModal open={showWithdraw} onClose={()=>setShowWithdraw(false)} isMobile={isMobile} addToast={addToast} walletBalance={walletBalance} setWalletBalance={setWalletBalance} setTxns={setTxns}/>

      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px",animation:"vFadeIn 0.3s ease"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"24px"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"}}>Available Balance</div>
            <div style={{fontSize:isMobile?"28px":"36px",fontWeight:800,color:T.green,letterSpacing:"-0.02em",lineHeight:1,animation:"vScaleIn 0.4s 0.1s both"}}>{fmt(walletBalance)}</div>
            <div style={{fontSize:"11px",color:T.gray400,marginTop:"5px"}}>{fmt(escrowTotal)} in escrow · {escrowOrders.length} order{escrowOrders.length!==1?"s":""}</div>
            <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
              <Btn hapticPattern={H.double} onClick={()=>setShowFund(true)} style={{background:T.green,color:T.black,border:"none",padding:"9px 16px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>+ Fund</Btn>
              <Btn hapticPattern={H.tap} onClick={()=>setShowWithdraw(true)} style={{background:"transparent",color:T.white,border:"1px solid #333",padding:"9px 16px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>Withdraw</Btn>
            </div>
          </div>
          <div>
            <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"10px"}}>Escrow Breakdown</div>
            {escrowOrders.length===0?<div style={{fontSize:"12px",color:T.gray400}}>No active escrow</div>:
            escrowOrders.map((o,i)=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1A1A1A",fontSize:"12px",animation:`vFadeUp 0.25s ${i*0.07}s both`}}>
                <div><span style={{color:T.white,fontWeight:700}}>{o.id}</span><span style={{color:T.gray400,marginLeft:"6px"}}>{o.product}</span></div>
                <span style={{color:T.green,fontWeight:800}}>{fmt(o.value)}</span>
              </div>
            ))}
            <div style={{fontSize:"10px",color:T.gray400,marginTop:"10px",fontWeight:600}}>KrediBank · Released on delivery confirm</div>
          </div>
        </div>
      </div>

      <Card pad={false}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
          <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Transaction History</div>
          <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
            {["all","credit","debit","released"].map(f=>(
              <Btn key={f} hapticPattern={H.soft} onClick={()=>setTxnFilter(f)} style={{background:txnFilter===f?T.black:T.white,color:txnFilter===f?T.white:T.gray600,border:`1px solid ${txnFilter===f?T.black:T.gray200}`,padding:"4px 10px",borderRadius:"20px",fontSize:"10px",fontWeight:700,fontFamily:F,textTransform:"capitalize"}}>{f}</Btn>
            ))}
            <Btn hapticPattern={H.soft} onClick={handleExportStatement} style={{background:T.white,border:`1px solid ${T.gray200}`,color:T.black,padding:"4px 10px",fontSize:"10px",fontWeight:700,fontFamily:F,borderRadius:"3px"}}>↓ CSV</Btn>
          </div>
        </div>
        {filteredTxns.length===0?<div style={{padding:"28px",textAlign:"center",color:T.gray400,fontSize:"12px"}}>No transactions match filter</div>:
        filteredTxns.map((t,i)=>(
          <StaggerItem key={t.id} index={i}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",borderBottom:i<filteredTxns.length-1?`1px solid ${T.gray100}`:"none",gap:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:t.type==="credit"?T.greenLight:t.type==="released"?T.blueLight:T.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0,transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  {t.type==="credit"?"↓":t.type==="released"?"🔓":"↑"}
                </div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:700,color:T.black}}>{isMobile?t.desc.split("—")[0]:t.desc}</div>
                  <div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{t.id} · {t.date}</div>
                </div>
              </div>
              <div style={{fontSize:"13px",fontWeight:800,color:t.type==="credit"||t.type==="released"?T.greenDark:T.black,flexShrink:0}}>{t.amount>0?"+":""}{fmt(Math.abs(t.amount))}</div>
            </div>
          </StaggerItem>
        ))}
      </Card>
    </div>
  );
}

/* ════════ DEPOT DASHBOARD ════════ */
function DepotDash({isMobile,addToast,pmsPrice,setPmsPrice,agoPrice,setAgoPrice}){
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [pmsEdit,setPmsEdit]=useState(pmsPrice);
  const [agoEdit,setAgoEdit]=useState(agoPrice);
  const col2=isMobile?"1fr":"1fr 1fr";

  const handleSave=()=>{
    setSaving(true);haptic(H.confirm);
    setTimeout(()=>{
      setPmsPrice(Number(pmsEdit));setAgoPrice(Number(agoEdit));
      setSaving(false);setEditing(false);
      addToast("success","Prices updated · Live on marketplace now");
    },900);
  };

  return(
    <div>
      <div style={{background:T.black,padding:isMobile?"18px 16px":"24px 28px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",flexWrap:isMobile?"wrap":"nowrap",animation:"vFadeIn 0.3s ease"}}>
        <div>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"4px"}}>Depot Dashboard</div>
          <div style={{fontSize:isMobile?"20px":"24px",fontWeight:800,color:T.white,animation:"vFadeUp 0.3s 0.05s both"}}>Nepal Energies</div>
          <div style={{fontSize:"11px",color:T.gray400,marginTop:"3px",animation:"vFadeUp 0.3s 0.1s both"}}>Apapa, Lagos · NMDPRA: MDP/D/0042 · 85,000 MT Capacity</div>
        </div>
        <div style={{textAlign:isMobile?"left":"right",animation:"vScaleIn 0.4s 0.1s both"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"3px"}}>Revenue (Mar)</div>
          <div style={{fontSize:isMobile?"22px":"28px",fontWeight:800,color:T.green}}>₦218M</div>
          <div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>+10.1% vs Feb</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:"1px",background:T.gray100,border:`1px solid ${T.gray100}`,marginBottom:"14px"}}>
        <KpiCard label="Orders MTD" value="34" sub="28 fulfilled" index={0}/>
        <KpiCard label="Volume" value="1.12M L" sub="34 trucks" index={1}/>
        <KpiCard label="Pending" value="2" sub="SLA: 2h max" alert index={2}/>
        <KpiCard label="Avg. Rating" value="4.8 ★" sub="34 reviews" index={3}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:col2,gap:"14px",marginBottom:"14px"}}>
        <Card style={{animation:"vFadeUp 0.35s 0.1s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <div><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>Live Price Control</div><div style={{fontSize:"10px",color:T.gray400,marginTop:"2px"}}>Changes go live on marketplace instantly</div></div>
            {editing?(
              <div style={{display:"flex",gap:"6px"}}>
                <Btn hapticPattern={H.soft} onClick={()=>{setEditing(false);setPmsEdit(pmsPrice);setAgoEdit(agoPrice);}} style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"6px 12px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"32px"}}>Cancel</Btn>
                <Btn hapticPattern={H.confirm} disabled={saving} onClick={handleSave} style={{background:saving?T.gray200:T.green,color:saving?T.gray400:T.black,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"32px"}}>{saving?"Saving…":"Save"}</Btn>
              </div>
            ):(
              <Btn hapticPattern={H.tap} onClick={()=>setEditing(true)} style={{background:T.black,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"36px"}}>Edit Prices</Btn>
            )}
          </div>
          {[{label:"PMS",val:pmsEdit,set:setPmsEdit,live:pmsPrice},{label:"AGO",val:agoEdit,set:setAgoEdit,live:agoPrice}].map((p,i)=>(
            <div key={p.label} style={{marginBottom:"12px",paddingBottom:"12px",borderBottom:`1px solid ${T.gray100}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}>
                <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.label}</div>
                {editing&&Number(p.val)!==p.live&&<span style={{fontSize:"9px",color:T.amber,fontWeight:700}}>CHANGED</span>}
              </div>
              {editing?(
                <div style={{display:"flex",alignItems:"center",border:`2px solid ${T.black}`}}>
                  <span style={{padding:"9px 10px",fontSize:"12px",fontWeight:700,color:T.gray400,borderRight:`1px solid ${T.gray100}`}}>₦</span>
                  <input type="number" value={p.val} onChange={e=>p.set(e.target.value)} style={{flex:1,border:"none",padding:"9px 10px",fontSize:"16px",fontWeight:800,fontFamily:F,outline:"none",color:T.black,width:"100%"}}/>
                  <span style={{padding:"9px 10px",fontSize:"11px",fontWeight:600,color:T.gray400}}>/L</span>
                </div>
              ):(
                <div style={{background:T.gray50,padding:"10px 12px",fontSize:"18px",fontWeight:800,color:T.black}}>₦{p.live.toLocaleString()}/L</div>
              )}
            </div>
          ))}
          <div style={{background:T.greenLight,padding:"10px 12px",display:"flex",alignItems:"center",gap:"7px"}}>
            <span style={{animation:"vPulse 2s ease-in-out infinite"}}>📡</span>
            <span style={{fontSize:"11px",fontWeight:700,color:T.greenDark}}>Live on Ventryl marketplace</span>
          </div>
        </Card>

        <Card style={{animation:"vFadeUp 0.35s 0.18s both"}}>
          <SectionHead title="Inventory Status" sub="Current stock · Apapa"/>
          {[{prod:"PMS",current:61200,cap:85000},{prod:"Total",current:61200,cap:85000}].map((s,i)=>(
            <div key={s.prod} style={{marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{s.prod}</span>
                <span style={{fontSize:"11px",fontWeight:700,color:T.gray400}}>{(s.current/1000).toFixed(1)}k/{(s.cap/1000).toFixed(0)}k MT · <span style={{color:T.green,fontWeight:800}}>{Math.round(s.current/s.cap*100)}%</span></span>
              </div>
              <div style={{height:"7px",background:T.gray100,borderRadius:"4px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(s.current/s.cap*100)}%`,background:T.green,borderRadius:"4px",animation:"vProgressFill 1.2s ease both",animationDelay:`${i*0.15+0.2}s`}}/>
              </div>
            </div>
          ))}
          <div style={{background:T.amberLight,padding:"11px 14px",marginTop:"4px"}}>
            <div style={{fontSize:"11px",fontWeight:700,color:"#8A5C00",marginBottom:"6px"}}>⚠ Restock in ~4 days</div>
            <Btn hapticPattern={H.tap} onClick={()=>addToast("info","NNPC allocation request sent. Response expected within 24 hours.")} style={{background:"#8A5C00",color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:800,fontFamily:F,width:"100%",minHeight:"36px"}}>Contact NNPC for Allocation</Btn>
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.5fr 1fr",gap:"14px"}}>
        <Card style={{animation:"vFadeUp 0.35s 0.22s both"}}>
          <SectionHead title="Revenue Trend" sub="₦ Millions · 6 months"/>
          <ResponsiveContainer width="100%" height={isMobile?150:170}>
            <AreaChart data={REVENUE_DATA} margin={{top:4,right:0,bottom:0,left:-24}}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.15}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100}/>
              <XAxis dataKey="month" tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="revenue" stroke={T.green} strokeWidth={2.5} fill="url(#rg)" name="Revenue" dot={{fill:T.green,r:3,strokeWidth:0}} animationDuration={1400}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{animation:"vFadeUp 0.35s 0.28s both"}}>
          <SectionHead title="Orders by Day" sub="This week"/>
          <ResponsiveContainer width="100%" height={isMobile?150:170}>
            <BarChart data={DAILY} barSize={7} margin={{left:-24,bottom:0}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.gray100} vertical={false}/>
              <XAxis dataKey="day" tick={{fill:T.gray400,fontSize:10,fontFamily:F,fontWeight:600}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="pms" fill={T.green} name="PMS" radius={[2,2,0,0]} animationDuration={1000}/>
              <Bar dataKey="ago" fill={T.blue} name="AGO" radius={[2,2,0,0]} animationDuration={1200}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ════════ DEPOT INBOX ════════ */
function DepotInbox({isMobile,addToast,incoming,setIncoming}){
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectReason,setRejectReason]=useState("");

  const handleConfirm=id=>{
    haptic(H.confirm);
    setIncoming(prev=>prev.map(o=>o.id===id?{...o,status:"confirmed"}:o));
    addToast("success",`Order ${id} confirmed! Loading slot assigned.`);
  };

  const handleReject=id=>{
    if(!rejectReason.trim()){addToast("warning","Please provide a reason for rejection");return;}
    setIncoming(prev=>prev.filter(o=>o.id!==id));
    addToast("warning",`Order ${id} rejected. Buyer has been notified.`);
    setRejectModal(null);setRejectReason("");
  };

  const pending=incoming.filter(o=>o.status==="pending");
  const confirmed=incoming.filter(o=>o.status==="confirmed");

  return(
    <div>
      <Modal open={!!rejectModal} onClose={()=>{setRejectModal(null);setRejectReason("");}} title="Reject Order" isMobile={isMobile} width="420px">
        {rejectModal&&<>
          <div style={{background:T.gray50,padding:"10px 14px",marginBottom:"14px",fontSize:"12px",color:T.gray800,fontWeight:600}}>Rejecting: {rejectModal}</div>
          <InputField label="Reason for rejection" value={rejectReason} onChange={setRejectReason} placeholder="e.g. Loading bay fully booked for this slot"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <Btn hapticPattern={H.soft} onClick={()=>{setRejectModal(null);setRejectReason("");}} style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>Cancel</Btn>
            <Btn hapticPattern={H.warning} onClick={()=>handleReject(rejectModal)} style={{background:T.red,color:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>Reject Order</Btn>
          </div>
        </>}
      </Modal>

      <div style={{marginBottom:"22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:800,color:T.black}}>Incoming Orders</div>
          {pending.length>0&&<div style={{background:T.redLight,color:T.red,fontSize:"10px",fontWeight:800,padding:"2px 7px",borderRadius:"10px",animation:"vPulse 2s ease-in-out infinite"}}>{pending.length} require action</div>}
        </div>
        {pending.length===0&&<div style={{padding:"24px",border:`1px solid ${T.gray100}`,background:T.white,textAlign:"center",color:T.gray400,fontSize:"12px"}}>No pending orders requiring action</div>}
        {pending.map((o,i)=>(
          <StaggerItem key={o.id} index={i}>
            <div style={{border:`2px solid ${T.amber}`,background:T.white,marginBottom:"12px",transition:"border-color 0.3s"}}>
              <div style={{padding:"16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"8px",gap:"10px",flexWrap:isMobile?"wrap":"nowrap"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",marginBottom:"4px"}}>
                      <span style={{fontSize:"13px",fontWeight:800,color:T.black}}>{o.id}</span>
                      <span style={{background:T.gray100,color:T.gray600,fontSize:"10px",fontWeight:700,padding:"2px 6px",borderRadius:"3px"}}>{o.type}</span>
                      <span style={{fontSize:"10px",color:T.gray400}}>{o.submitted}</span>
                    </div>
                    <div style={{fontSize:"13px",fontWeight:700,color:T.black,marginBottom:"2px"}}>{o.buyer}</div>
                    <div style={{fontSize:"11px",color:T.gray400}}>{o.location}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px 20px",flexShrink:0}}>
                    {[["Product",o.product],["Volume",`${(o.vol/1000).toFixed(0)}k L`],["Trucks",o.trucks],["Value",fmtM(o.value)]].map(([l,v],j)=>(
                      <div key={l} style={{animation:`vScaleIn 0.2s ${j*0.06}s both`}}>
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
                  <span style={{fontSize:"11px",fontWeight:800,color:"#8A5C00",background:T.amberLight,padding:"2px 7px",borderRadius:"3px",animation:"vPulse 3s ease-in-out infinite"}}>⏱ {o.slaLeft}</span>
                  {!isMobile&&<span style={{fontSize:"10px",color:T.gray400}}>· Funds in KrediBank escrow ✓</span>}
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <Btn hapticPattern={H.warning} onClick={()=>setRejectModal(o.id)} style={{background:T.white,color:T.red,border:`1px solid ${T.red}`,padding:"8px 14px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>Reject</Btn>
                  <Btn hapticPattern={H.confirm} onClick={()=>handleConfirm(o.id)} style={{background:T.green,color:T.white,border:"none",padding:"8px 14px",fontSize:"11px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>Confirm →</Btn>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </div>

      {confirmed.length>0&&(
        <div>
          <div style={{fontSize:"14px",fontWeight:800,color:T.black,marginBottom:"12px"}}>Confirmed Queue</div>
          {confirmed.map((o,i)=>(
            <StaggerItem key={o.id} index={i}>
              <div style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"14px 18px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:800,color:T.black,marginBottom:"3px"}}>{o.id} · {o.buyer}</div>
                  <div style={{fontSize:"11px",color:T.gray400}}>{o.product} · {(o.vol/1000).toFixed(0)}k L · {o.trucks} trucks · {o.location}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <Badge status="confirmed"/>
                  <span style={{fontSize:"13px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════ TRUCK SCHEDULE ════════ */
function TruckSched({isMobile,addToast,slots,setSlots,incoming}){
  const [dayIdx,setDayIdx]=useState(0);
  const [assignModal,setAssignModal]=useState(null);
  const [selectedOrderId,setSelectedOrderId]=useState("");

  const confirmedOrders=incoming.filter(o=>o.status==="confirmed");
  const slotOrders=slots.filter(s=>s.status!=="open").map(s=>s.orderId);
  const availableToAssign=confirmedOrders.filter(o=>!slotOrders.includes(o.id));

  const handleAssign=()=>{
    if(!selectedOrderId){addToast("warning","Select an order to assign");return;}
    const order=confirmedOrders.find(o=>o.id===selectedOrderId);
    if(!order)return;
    setSlots(prev=>prev.map(s=>s.id===assignModal?{...s,orderId:order.id,product:order.product,trucks:order.trucks,status:"confirmed",driver:"Assigned Driver",truck:"TBD"}:s));
    addToast("success",`Order ${order.id} assigned to slot ${slots.find(s=>s.id===assignModal)?.time}`);
    setAssignModal(null);setSelectedOrderId("");
  };

  const handleDepart=(slotId)=>{
    haptic(H.confirm);
    setSlots(prev=>prev.map(s=>s.id===slotId?{...s,status:"in_transit"}:s));
    addToast("success",`Truck departed! Order now in transit.`);
  };

  const handleMarkLoading=(slotId)=>{
    haptic(H.tap);
    setSlots(prev=>prev.map(s=>s.id===slotId?{...s,status:"loading"}:s));
    addToast("info","Loading started — truck at bay");
  };

  return(
    <div>
      <Modal open={!!assignModal} onClose={()=>{setAssignModal(null);setSelectedOrderId("");}} title="Assign Order to Slot" isMobile={isMobile} width="440px">
        <div style={{fontSize:"12px",color:T.gray400,marginBottom:"14px"}}>Slot: {slots.find(s=>s.id===assignModal)?.time} · {slots.find(s=>s.id===assignModal)?.bay}</div>
        {availableToAssign.length===0?(
          <div style={{padding:"20px",background:T.gray50,textAlign:"center",color:T.gray400,fontSize:"12px",marginBottom:"14px"}}>No confirmed orders available to assign</div>
        ):(
          <div style={{marginBottom:"14px"}}>
            {availableToAssign.map(o=>(
              <MotionCard key={o.id} onClick={()=>setSelectedOrderId(o.id)} hapticPattern={H.soft}
                style={{border:`2px solid ${selectedOrderId===o.id?T.green:T.gray100}`,padding:"12px 14px",marginBottom:"8px",transition:"border-color 0.15s"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id} · {o.buyer}</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{o.product} · {(o.vol/1000).toFixed(0)}k L · {o.trucks} trucks</div></div>
                  <span style={{fontSize:"13px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                </div>
              </MotionCard>
            ))}
          </div>
        )}
        <Btn hapticPattern={H.confirm} disabled={!selectedOrderId} onClick={handleAssign} style={{background:selectedOrderId?T.black:T.gray200,color:selectedOrderId?T.white:T.gray400,border:"none",padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,width:"100%"}}>Assign Order</Btn>
      </Modal>

      <SectionHead title="Loading Bay Schedule" sub={`${SCHEDULE_DAYS[dayIdx]} · Apapa Depot`}
        right={<div style={{display:"flex",gap:"6px"}}>
          <Btn hapticPattern={H.soft} disabled={dayIdx===0} onClick={()=>setDayIdx(i=>Math.max(0,i-1))} style={{background:T.white,border:`1px solid ${T.gray200}`,color:dayIdx===0?T.gray200:T.black,padding:"6px 10px",fontSize:"11px",fontWeight:700,fontFamily:F,borderRadius:"4px",minHeight:"36px"}}>← Prev</Btn>
          <Btn hapticPattern={H.soft} disabled={dayIdx===SCHEDULE_DAYS.length-1} onClick={()=>setDayIdx(i=>Math.min(SCHEDULE_DAYS.length-1,i+1))} style={{background:T.white,border:`1px solid ${T.gray200}`,color:dayIdx===SCHEDULE_DAYS.length-1?T.gray200:T.black,padding:"6px 10px",fontSize:"11px",fontWeight:700,fontFamily:F,borderRadius:"4px",minHeight:"36px"}}>Next →</Btn>
        </div>}/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
        {["Bay 1","Bay 2"].map((bay,bi)=>{
          const bs=slots.filter(s=>s.bay===bay),booked=bs.filter(s=>s.status!=="open").length;
          return(<Card key={bay} style={{animation:`vScaleIn 0.3s ${bi*0.1}s both`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{bay}</div>
              <div style={{fontSize:"11px",fontWeight:700,color:T.gray400}}>{booked}/{bs.length} booked</div>
            </div>
            <div style={{height:"5px",background:T.gray100,borderRadius:"3px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${booked/bs.length*100}%`,background:T.green,animation:"vProgressFill 1s ease both",animationDelay:`${bi*0.15+0.2}s`}}/>
            </div>
            <div style={{fontSize:"10px",color:T.gray400,marginTop:"4px"}}>{Math.round(booked/bs.length*100)}% utilised</div>
          </Card>);
        })}
      </div>

      {isMobile?(
        slots.map((s,i)=>(
          <StaggerItem key={s.id} index={i}>
            <div style={{border:`1px solid ${T.gray100}`,background:s.status==="open"?`${T.green}08`:T.white,padding:"14px 16px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{s.time} · {s.bay}</div>
                  <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{s.orderId||"—"} {s.product?`· ${s.product}`:""}{s.trucks?` · ${s.trucks} 🚛`:""}</div>
                  {s.driver&&s.driver!=="—"&&<div style={{fontSize:"10px",color:T.gray400}}>{s.driver} · {s.truck}</div>}
                </div>
                <Badge status={s.status}/>
              </div>
              {s.status==="open"&&<Btn hapticPattern={H.tap} onClick={()=>setAssignModal(s.id)} style={{background:T.black,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:700,fontFamily:F,width:"100%",minHeight:"40px"}}>Assign Order</Btn>}
              {s.status==="confirmed"&&<Btn hapticPattern={H.tap} onClick={()=>handleMarkLoading(s.id)} style={{background:T.blue,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:700,fontFamily:F,width:"100%",minHeight:"40px"}}>Mark Loading</Btn>}
              {s.status==="loading"&&<Btn hapticPattern={H.double} onClick={()=>handleDepart(s.id)} style={{background:T.green,color:T.white,border:"none",padding:"7px 14px",fontSize:"11px",fontWeight:700,fontFamily:F,width:"100%",minHeight:"40px"}}>Mark Departed ✓</Btn>}
            </div>
          </StaggerItem>
        ))
      ):(
        <Card pad={false} style={{animation:"vFadeUp 0.3s 0.15s both"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Time","Bay","Order","Product","Driver","Trucks","Status","Action"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>{slots.map((s,i)=>(
              <tr key={s.id} style={{borderBottom:i<slots.length-1?`1px solid ${T.gray100}`:"none",background:s.status==="open"?`${T.green}08`:T.white,animation:`vFadeUp 0.2s ${i*0.05}s both`,transition:"background 0.2s"}}>
                <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:800,color:T.black,fontFamily:F}}>{s.time}</td>
                <td style={{padding:"13px 18px",fontSize:"12px",color:T.gray600,fontFamily:F}}>{s.bay}</td>
                <td style={{padding:"13px 18px",fontSize:"12px",fontWeight:700,color:s.orderId?T.black:T.gray200,fontFamily:F}}>{s.orderId||"—"}</td>
                <td style={{padding:"13px 18px"}}>{s.product?<span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{s.product}</span>:<span style={{color:T.gray200}}>—</span>}</td>
                <td style={{padding:"13px 18px",fontSize:"11px",color:s.driver&&s.driver!=="—"?T.black:T.gray200,fontFamily:F}}>{s.driver||"—"}</td>
                <td style={{padding:"13px 18px",fontSize:"12px",fontWeight:800,color:s.trucks?T.black:T.gray200,fontFamily:F}}>{s.trucks?`${s.trucks} 🚛`:"—"}</td>
                <td style={{padding:"13px 18px"}}><Badge status={s.status}/></td>
                <td style={{padding:"13px 18px"}}>
                  {s.status==="open"&&<Btn hapticPattern={H.tap} onClick={()=>setAssignModal(s.id)} style={{background:T.black,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,fontFamily:F,minHeight:"36px"}}>Assign</Btn>}
                  {s.status==="confirmed"&&<Btn hapticPattern={H.tap} onClick={()=>handleMarkLoading(s.id)} style={{background:T.blue,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,fontFamily:F,minHeight:"36px"}}>Loading</Btn>}
                  {s.status==="loading"&&<Btn hapticPattern={H.double} onClick={()=>handleDepart(s.id)} style={{background:T.green,color:T.white,border:"none",padding:"6px 12px",fontSize:"11px",fontWeight:700,fontFamily:F,minHeight:"36px"}}>Departed ✓</Btn>}
                  {["in_transit","pending","open"].includes(s.status)&&s.status!=="open"&&<span style={{fontSize:"11px",color:T.gray400}}>—</span>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ════════ BUYER NETWORK ════════ */
function BuyerNetwork({isMobile,addToast}){
  const [search,setSearch]=useState("");
  const [tierFilter,setTierFilter]=useState("All");
  const [selectedBuyer,setSelectedBuyer]=useState(null);

  const filtered=BUYERS_DATA.filter(b=>
    (tierFilter==="All"||b.tier===tierFilter)&&
    (b.name.toLowerCase().includes(search.toLowerCase())||b.type.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport=()=>{
    exportCSV("ventryl-buyers.csv",["Buyer","Type","Orders","Volume","Total Spend","VCS Score","Tier","Last Order"],
      filtered.map(b=>[b.name,b.type,b.orders,b.vol,b.spend,b.score,b.tier,b.lastOrder]));
    addToast("success","Buyer network exported to CSV");
  };

  const handleContact=(b)=>{
    navigator.clipboard.writeText(b.email).catch(()=>{});
    addToast("info",`${b.email} copied to clipboard`);
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:selectedBuyer&&!isMobile?"1fr 320px":"1fr",gap:"16px"}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
          <SectionHead title="Buyer Network" sub={`${filtered.length} buyers · VCS via KrediBank`}/>
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
            <div style={{position:"relative"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search buyers…" style={{border:`1px solid ${T.gray200}`,padding:"6px 10px 6px 28px",fontSize:"11px",fontFamily:F,outline:"none",width:"150px",color:T.black}}/>
              <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",color:T.gray400,fontSize:"12px"}}>🔍</span>
            </div>
            {["All","Gold","Silver","Bronze"].map(t=>(
              <Btn key={t} hapticPattern={H.soft} onClick={()=>setTierFilter(t)} style={{background:tierFilter===t?T.black:T.white,color:tierFilter===t?T.white:T.gray600,border:`1px solid ${tierFilter===t?T.black:T.gray200}`,padding:"5px 10px",fontSize:"10px",fontWeight:700,fontFamily:F,borderRadius:"20px"}}>{t}</Btn>
            ))}
            <Btn hapticPattern={H.soft} onClick={handleExport} style={{background:T.white,border:`1px solid ${T.gray200}`,color:T.black,padding:"5px 10px",fontSize:"10px",fontWeight:700,fontFamily:F}}>↓ CSV</Btn>
          </div>
        </div>

        {isMobile?(
          filtered.map((b,i)=>(
            <StaggerItem key={b.name} index={i}>
              <MotionCard onClick={()=>setSelectedBuyer(b===selectedBuyer?null:b)} hapticPattern={H.soft} style={{border:`1px solid ${selectedBuyer?.name===b.name?T.green:T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                  <div><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{b.name}</div><div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{b.type} · Last: {b.lastOrder}</div></div>
                  <span style={{background:b.tier==="Gold"?T.amberLight:b.tier==="Silver"?T.gray100:"#F3F0FF",color:b.tier==="Gold"?"#8A5C00":b.tier==="Silver"?T.gray600:"#8B5CF6",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"3px"}}>{b.tier}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
                  {[["Orders",b.orders],["Volume",b.vol],["Spend",b.spend]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>{l}</div><div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{v}</div></div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                  <div style={{flex:1,height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${b.score/10}%`,background:b.score>=750?T.green:b.score>=650?T.amber:T.gray400,animation:"vProgressFill 1.2s ease both"}}/></div>
                  <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>VCS {b.score}</span>
                </div>
              </MotionCard>
            </StaggerItem>
          ))
        ):(
          <Card pad={false}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>{["Buyer","Type","Orders","Volume","Spend","VCS","Tier","Last Order"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>{filtered.length===0?<tr><td colSpan={8} style={{padding:"28px",textAlign:"center",color:T.gray400,fontSize:"12px"}}>No buyers match filter</td></tr>:
              filtered.map((b,i)=>(
                <tr key={b.name} style={{borderBottom:i<filtered.length-1?`1px solid ${T.gray100}`:"none",animation:`vFadeUp 0.25s ${i*0.07}s both`,cursor:"pointer",transition:"background 0.15s",background:selectedBuyer?.name===b.name?T.gray50:T.white}}
                  onMouseEnter={e=>{ if(selectedBuyer?.name!==b.name)e.currentTarget.style.background=T.gray50; haptic(H.soft); }}
                  onMouseLeave={e=>{ if(selectedBuyer?.name!==b.name)e.currentTarget.style.background=T.white; }}
                  onClick={()=>setSelectedBuyer(selectedBuyer?.name===b.name?null:b)}>
                  <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:800,color:T.black,fontFamily:F}}>{b.name}</td>
                  <td style={{padding:"13px 18px"}}><span style={{background:T.gray100,color:T.gray600,fontSize:"10px",fontWeight:700,padding:"3px 7px",borderRadius:"3px"}}>{b.type}</span></td>
                  <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:700,color:T.black,fontFamily:F}}>{b.orders}</td>
                  <td style={{padding:"13px 18px",fontSize:"12px",color:T.gray600,fontFamily:F}}>{b.vol}</td>
                  <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:800,color:T.black,fontFamily:F}}>{b.spend}</td>
                  <td style={{padding:"13px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                      <div style={{height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden",width:"50px"}}><div style={{height:"100%",width:`${b.score/10}%`,background:b.score>=750?T.green:b.score>=650?T.amber:T.gray400,animation:"vProgressFill 1.2s ease both"}}/></div>
                      <span style={{fontSize:"12px",fontWeight:800,color:T.black,fontFamily:F}}>{b.score}</span>
                    </div>
                  </td>
                  <td style={{padding:"13px 18px"}}><span style={{background:b.tier==="Gold"?T.amberLight:b.tier==="Silver"?T.gray100:"#F3F0FF",color:b.tier==="Gold"?"#8A5C00":b.tier==="Silver"?T.gray600:"#8B5CF6",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"3px"}}>{b.tier}</span></td>
                  <td style={{padding:"13px 18px",fontSize:"11px",color:T.gray400,fontFamily:F}}>{b.lastOrder}</td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Buyer Detail Panel */}
      {selectedBuyer&&(
        <div style={{animation:"vSlideRight 0.25s ease"}}>
          <Card style={{position:"sticky",top:"66px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
              <div>
                <div style={{fontSize:"15px",fontWeight:800,color:T.black}}>{selectedBuyer.name}</div>
                <div style={{fontSize:"11px",color:T.gray400,marginTop:"2px"}}>{selectedBuyer.type}</div>
              </div>
              <Btn onClick={()=>setSelectedBuyer(null)} style={{background:"none",border:"none",color:T.gray400,fontSize:"18px",padding:"0 4px",fontFamily:F}}>✕</Btn>
            </div>
            <div style={{background:T.gray50,padding:"12px 14px",marginBottom:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {[["Orders",selectedBuyer.orders],["Volume",selectedBuyer.vol],["Spend",selectedBuyer.spend],["Last Order",selectedBuyer.lastOrder]].map(([k,v])=>(
                <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"2px"}}>{k}</div><div style={{fontSize:"13px",fontWeight:800,color:T.black}}>{v}</div></div>
              ))}
            </div>
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"8px"}}>Ventryl Credit Score</div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
                <div style={{flex:1,height:"8px",background:T.gray100,borderRadius:"4px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${selectedBuyer.score/10}%`,background:selectedBuyer.score>=750?T.green:selectedBuyer.score>=650?T.amber:T.gray400,borderRadius:"4px",animation:"vProgressFill 1s ease"}}/>
                </div>
                <span style={{fontSize:"18px",fontWeight:800,color:T.black,minWidth:"42px",textAlign:"right"}}>{selectedBuyer.score}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:T.gray400}}><span>0</span><span>500</span><span>1000</span></div>
              <div style={{marginTop:"8px"}}>
                <span style={{background:selectedBuyer.tier==="Gold"?T.amberLight:selectedBuyer.tier==="Silver"?T.gray100:"#F3F0FF",color:selectedBuyer.tier==="Gold"?"#8A5C00":selectedBuyer.tier==="Silver"?T.gray600:"#8B5CF6",fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"3px"}}>{selectedBuyer.tier} Tier</span>
              </div>
            </div>
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"8px"}}>Contact</div>
              <div style={{fontSize:"12px",color:T.black,marginBottom:"4px",fontWeight:600}}>📧 {selectedBuyer.email}</div>
              <div style={{fontSize:"12px",color:T.black,fontWeight:600}}>📱 {selectedBuyer.phone}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <Btn hapticPattern={H.tap} onClick={()=>handleContact(selectedBuyer)} style={{background:T.black,color:T.white,border:"none",padding:"10px",fontSize:"12px",fontWeight:800,fontFamily:F,width:"100%"}}>Copy Email Address</Btn>
              <Btn hapticPattern={H.soft} onClick={()=>{addToast("info",`Credit report for ${selectedBuyer.name} will be ready in 2 minutes.`);}} style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"10px",fontSize:"12px",fontWeight:800,fontFamily:F,width:"100%"}}>Request Credit Report</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ════════ NAV CONFIG ════════ */
const BUYER_NAV = [
  {id:"dash",label:"Dashboard",shortLabel:"Home",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
  {id:"market",label:"Price Discovery",shortLabel:"Market",icon:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"},
  {id:"orders",label:"My Orders",shortLabel:"Orders",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
  {id:"wallet",label:"Wallet",shortLabel:"Wallet",icon:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"},
  {id:"order_form",label:"Place Order",shortLabel:"Order+",icon:"M12 4v16m8-8H4"},
];
const DEPOT_NAV = [
  {id:"dash",label:"Dashboard",shortLabel:"Home",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
  {id:"inbox",label:"Order Inbox",shortLabel:"Inbox",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",badge:null},
  {id:"orders",label:"Order Management",shortLabel:"Orders",icon:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
  {id:"sched",label:"Truck Schedule",shortLabel:"Schedule",icon:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"},
  {id:"buyers",label:"Buyers",shortLabel:"Buyers",icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"},
];

/* ════════ BUYER PORTAL ════════ */
function BuyerPortal({bp,addToast}){
  const {isMobile}=bp;
  const [active,setActive]=useState("dash");
  const [walletBalance,setWalletBalance]=useState(25830000);
  const [orders,setOrders]=useState(INITIAL_ORDERS);
  const [txns,setTxns]=useState(INITIAL_TXNS);
  const activeN=BUYER_NAV.find(n=>n.id===active);

  const views={
    dash:<BuyerDash onOrder={()=>setActive("order_form")} isMobile={isMobile} addToast={addToast} walletBalance={walletBalance} orders={orders} setOrders={setOrders} setTxns={setTxns} setActiveView={setActive}/>,
    market:<BuyerMarketplace onOrder={()=>setActive("order_form")} isMobile={isMobile} addToast={addToast}/>,
    orders:<BuyerOrders isMobile={isMobile} orders={orders} addToast={addToast} setOrders={setOrders} setTxns={setTxns}/>,
    wallet:<BuyerWallet isMobile={isMobile} addToast={addToast} walletBalance={walletBalance} setWalletBalance={setWalletBalance} txns={txns} setTxns={setTxns} orders={orders}/>,
    order_form:<OrderFlow onDone={()=>setActive("dash")} isMobile={isMobile} addToast={addToast} walletBalance={walletBalance} setWalletBalance={setWalletBalance} setOrders={setOrders} setTxns={setTxns}/>,
  };
  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F}}>
      <Sidebar navItems={BUYER_NAV} active={active} setActive={setActive} identity={{initials:"CF",bg:T.green,textColor:T.black,name:"Chukwuma Fuels",role:"Buyer · Lagos"}} portalLabel="Buyer Portal" isMobile={isMobile}/>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <Topbar crumb={activeN?.label} isMobile={isMobile} portalLabel="Buyer Portal"
          pills={[{bg:T.greenLight,color:T.greenDark,label:"KYB ✓"},{bg:T.gray50,color:T.black,label:`${(walletBalance/1e6).toFixed(1)}M wallet`}]}/>
        <div style={{padding:isMobile?"14px 16px":"24px 28px",paddingBottom:isMobile?"80px":"24px",flex:1,overflowY:"auto"}}>
          <PageView viewKey={active}>{views[active]}</PageView>
        </div>
      </div>
      {isMobile&&<Sidebar navItems={BUYER_NAV} active={active} setActive={setActive} identity={{}} portalLabel="Buyer Portal" isMobile={true}/>}
    </div>
  );
}

/* ════════ DEPOT PORTAL ════════ */
function DepotPortal({bp,addToast}){
  const {isMobile}=bp;
  const [active,setActive]=useState("dash");
  const [pmsPrice,setPmsPrice]=useState(795);
  const [agoPrice,setAgoPrice]=useState(1185);
  const [incoming,setIncoming]=useState(INITIAL_INCOMING);
  const [slots,setSlots]=useState(INITIAL_SLOTS);
  const [depotOrders,setDepotOrders]=useState(DEPOT_ORDERS_INITIAL);
  const pendingCount=incoming.filter(o=>o.status==="pending").length;
  const ordersPendingCount=depotOrders.filter(o=>o.status==="pending").length;
  const depotNav=DEPOT_NAV.map(n=>{
    if(n.id==="inbox")return{...n,badge:pendingCount>0?pendingCount:null};
    if(n.id==="orders")return{...n,badge:ordersPendingCount>0?ordersPendingCount:null};
    return n;
  });
  const activeN=depotNav.find(n=>n.id===active);
  const views={
    dash:<DepotDash isMobile={isMobile} addToast={addToast} pmsPrice={pmsPrice} setPmsPrice={setPmsPrice} agoPrice={agoPrice} setAgoPrice={setAgoPrice}/>,
    inbox:<DepotInbox isMobile={isMobile} addToast={addToast} incoming={incoming} setIncoming={setIncoming}/>,
    orders:<DepotOrderMgmt isMobile={isMobile} addToast={addToast} depotOrders={depotOrders} setDepotOrders={setDepotOrders} drivers={DEPOT_DRIVERS}/>,
    sched:<TruckSched isMobile={isMobile} addToast={addToast} slots={slots} setSlots={setSlots} incoming={incoming}/>,
    buyers:<BuyerNetwork isMobile={isMobile} addToast={addToast}/>,
  };
  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:F}}>
      <Sidebar navItems={depotNav} active={active} setActive={setActive} identity={{initials:"NE",bg:T.blue,textColor:T.white,name:"Nepal Energies",role:"Depot Partner"}} portalLabel="Depot Portal" isMobile={isMobile}/>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <Topbar crumb={activeN?.label} isMobile={isMobile} portalLabel="Depot Portal"
          pills={[pendingCount>0?{bg:T.redLight,color:T.red,label:`${pendingCount} Pending`}:{bg:T.greenLight,color:T.greenDark,label:"Inbox Clear"},{bg:T.greenLight,color:T.greenDark,label:"NMDPRA ✓"}]}/>
        <div style={{padding:isMobile?"14px 16px":"24px 28px",paddingBottom:isMobile?"80px":"24px",flex:1,overflowY:"auto"}}>
          <PageView viewKey={active}>{views[active]}</PageView>
        </div>
      </div>
      {isMobile&&<Sidebar navItems={depotNav} active={active} setActive={setActive} identity={{}} portalLabel="Depot Portal" isMobile={true}/>}
    </div>
  );
}

/* ════════ ROOT ════════ */
export default function VentrylApp(){
  const [role,setRole]=useState(null);
  const bp=useBreakpoint();
  const {isMobile}=bp;
  const [toasts,addToast]=useToast();

  const handleRoleSelect=r=>{haptic(H.success);setRole(r);};

  if(!role)return(
    <div style={{fontFamily:F,background:T.black,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <style>{GLOBAL_CSS}</style>
      <ToastContainer toasts={toasts}/>
      <div style={{textAlign:"center",marginBottom:"40px",animation:"vFadeUp 0.5s ease"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
          <div style={{width:"40px",height:"40px",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",animation:"vBounce 2s ease-in-out infinite"}}>
            <span style={{fontSize:"20px",fontWeight:800,color:T.black}}>V</span>
          </div>
          <span style={{fontSize:isMobile?"24px":"28px",fontWeight:800,color:T.white,letterSpacing:"-0.02em"}}>Ventryl</span>
        </div>
        <div style={{fontSize:"13px",color:T.gray400,fontWeight:600,animation:"vFadeIn 0.5s 0.2s both"}}>Nigeria's B2B Petroleum Marketplace</div>
        <div style={{fontSize:"11px",color:"#333",marginTop:"3px",animation:"vFadeIn 0.5s 0.3s both"}}>Trade fuel. Move faster.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",width:"100%",maxWidth:"480px"}}>
        {[{r:"buyer",title:"Buyer Portal",sub:"Petrol stations, aviation & industrial buyers",icon:"⛽",accent:T.green},{r:"depot",title:"Depot Portal",sub:"Licensed petroleum depots & suppliers",icon:"🏭",accent:T.blue}].map((x,i)=>(
          <MotionCard key={x.r} hapticPattern={H.success} onClick={()=>handleRoleSelect(x.r)}
            style={{background:"#0A0A0A",border:"1px solid #1A1A1A",padding:"24px 20px",minHeight:isMobile?"auto":"160px",animation:`vFadeUp 0.4s ${i*0.12}s both`,transition:"border-color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=x.accent} onMouseLeave={e=>e.currentTarget.style.borderColor="#1A1A1A"}>
            <div style={{fontSize:"26px",marginBottom:"12px"}}>{x.icon}</div>
            <div style={{fontSize:"14px",fontWeight:800,color:T.white,marginBottom:"5px"}}>{x.title}</div>
            <div style={{fontSize:"11px",color:T.gray400,lineHeight:1.5,marginBottom:"16px"}}>{x.sub}</div>
            <div style={{fontSize:"12px",fontWeight:800,color:x.accent}}>Enter →</div>
          </MotionCard>
        ))}
      </div>
      <div style={{marginTop:"32px",fontSize:"10px",color:"#333",fontWeight:600,animation:"vFadeIn 0.5s 0.5s both"}}>MVP Live · Pilot Phase · March 2026</div>
    </div>
  );

  return(
    <div style={{fontFamily:F,background:T.gray50,minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <ToastContainer toasts={toasts}/>
      {!isMobile&&(
        <div style={{background:"#0A0A0A",padding:"5px 20px",display:"flex",alignItems:"center",gap:"10px",justifyContent:"flex-end",borderBottom:"1px solid #1A1A1A"}}>
          <span style={{fontSize:"10px",color:"#444",fontWeight:600}}>Viewing:</span>
          {[{r:"buyer",label:"Buyer"},{r:"depot",label:"Depot"}].map(x=>(
            <Btn key={x.r} hapticPattern={H.nav} onClick={()=>setRole(x.r)} style={{background:role===x.r?"#1A1A1A":"transparent",color:role===x.r?T.white:"#444",border:`1px solid ${role===x.r?"#333":"transparent"}`,padding:"3px 10px",fontSize:"10px",fontWeight:700,fontFamily:F,borderRadius:"3px"}}>{x.label} Portal</Btn>
          ))}
          <Btn hapticPattern={H.soft} onClick={()=>setRole(null)} style={{background:"transparent",color:"#444",border:"none",fontSize:"10px",fontWeight:700,fontFamily:F,marginLeft:"6px"}}>← Switch</Btn>
        </div>
      )}
      {role==="buyer"?<BuyerPortal bp={bp} addToast={addToast}/>:<DepotPortal bp={bp} addToast={addToast}/>}
      {isMobile&&(
        <div style={{position:"fixed",top:"8px",right:"12px",zIndex:200,display:"flex",gap:"4px",background:"rgba(0,0,0,0.85)",padding:"4px",borderRadius:"20px",backdropFilter:"blur(8px)"}}>
          {[{r:"buyer",label:"B"},{r:"depot",label:"D"}].map(x=>(
            <Btn key={x.r} hapticPattern={H.nav} onClick={()=>setRole(x.r)} rippleColor="rgba(6,193,103,0.3)" style={{background:role===x.r?T.green:"transparent",color:role===x.r?T.black:T.gray400,border:"none",width:"28px",height:"28px",borderRadius:"50%",fontSize:"11px",fontWeight:800,fontFamily:F}}>{x.label}</Btn>
          ))}
          <Btn hapticPattern={H.soft} onClick={()=>setRole(null)} style={{background:"transparent",color:T.gray400,border:"none",width:"28px",height:"28px",borderRadius:"50%",fontSize:"14px",fontFamily:F}}>↩</Btn>
        </div>
      )}
    </div>
  );
}
// PLACEHOLDER - will be replaced
