// ═══════════════════════════════════════════════════════════════════
// DEPOT ORDER MANAGEMENT — Full lifecycle from pending → complete
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { haptic, H } from "./motion.js";

const T = {
  black:"#000000",white:"#FFFFFF",green:"#06C167",greenLight:"#E6F9F1",greenDark:"#038C48",
  gray50:"#F6F6F6",gray100:"#EBEBEB",gray200:"#D3D3D3",gray400:"#8C8C8C",gray600:"#545454",gray800:"#282828",
  red:"#E11900",redLight:"#FCEAE8",amber:"#FFC043",amberLight:"#FFF3D9",blue:"#276EF1",blueLight:"#EEF3FE",
  purple:"#7C3AED",purpleLight:"#F5F0FF",
};
const F = "'Manrope', sans-serif";
const fmt = n => "₦" + Number(n).toLocaleString("en-NG");
const fmtM = n => "₦" + (n/1e6).toFixed(1) + "M";
const nowStr = () => new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})
  + " · " + new Date().toLocaleDateString("en-NG",{day:"2-digit",month:"short"});

// ─── STAGE CONFIG ─────────────────────────────────────────────────
export const STAGE_CFG = {
  pending:    {label:"Pending Review",  short:"Pending",   color:T.gray600,  bg:T.gray100,     icon:"⏳"},
  confirmed:  {label:"Confirmed",       short:"Confirmed", color:"#8A5C00",  bg:T.amberLight,  icon:"✓"},
  scheduled:  {label:"Loading Scheduled",short:"Scheduled",color:T.blue,    bg:T.blueLight,   icon:"📅"},
  loading:    {label:"Loading",         short:"Loading",   color:T.purple,   bg:T.purpleLight, icon:"⛽"},
  loaded:     {label:"Loaded",          short:"Loaded",    color:T.greenDark,bg:T.greenLight,  icon:"🔒"},
  dispatched: {label:"In Transit",      short:"Transit",   color:T.blue,     bg:T.blueLight,   icon:"🚛"},
  delivered:  {label:"Delivered",       short:"Delivered", color:T.greenDark,bg:T.greenLight,  icon:"📦"},
  completed:  {label:"Completed",       short:"Completed", color:T.greenDark,bg:T.greenLight,  icon:"✅"},
  disputed:   {label:"Disputed",        short:"Disputed",  color:T.red,      bg:T.redLight,    icon:"⚠"},
  rejected:   {label:"Rejected",        short:"Rejected",  color:T.red,      bg:T.redLight,    icon:"✕"},
};

// ─── DRIVER DATA ──────────────────────────────────────────────────
export const DEPOT_DRIVERS = [
  {id:"d1",name:"Emeka Nwosu",phone:"+234 803 421 7762",license:"LSDR-2024-0482",available:true},
  {id:"d2",name:"Bayo Adeyemi",phone:"+234 806 334 9910",license:"LSDR-2024-0339",available:true},
  {id:"d3",name:"Chidi Okafor",phone:"+234 805 228 4461",license:"LSDR-2023-1190",available:false},
  {id:"d4",name:"Kunle Fashola",phone:"+234 807 551 0033",license:"LSDR-2024-0771",available:true},
  {id:"d5",name:"Tunde Gbadebo",phone:"+234 802 877 2245",license:"LSDR-2023-0987",available:true},
];

// ─── INITIAL ORDER DATA ───────────────────────────────────────────
export const DEPOT_ORDERS_INITIAL = [
  {
    id:"VTL-00843",buyer:"Horizon Petroleum",buyerType:"Petrol Station",buyerLocation:"Ikeja, Lagos",
    buyerContact:"+234 805 776 3321",product:"PMS",vol:99000,volLoaded:null,value:78705000,trucks:3,
    status:"pending",submittedAt:"2026-03-10 09:12",confirmedAt:null,scheduledAt:null,
    loadingStartAt:null,loadingEndAt:null,dispatchedAt:null,deliveredAt:null,completedAt:null,
    bay:null,loadingSlot:null,driver:null,truckPlate:null,waybillNo:null,
    compartments:[],sealNos:"",meterOpen:null,meterClose:null,notes:"",
    activityLog:[{time:"09:12 · 10 Mar",actor:"Buyer",action:"Order placed",note:""}],
    disputeReason:null,slaLeft:"1h 48m",
  },
  {
    id:"VTL-00842",buyer:"Skyline Aviation",buyerType:"Aviation",buyerLocation:"Murtala Airport, Lagos",
    buyerContact:"+234 809 100 2222",product:"AGO",vol:33000,volLoaded:null,value:39105000,trucks:1,
    status:"confirmed",submittedAt:"2026-03-10 08:34",confirmedAt:"2026-03-10 09:05",scheduledAt:null,
    loadingStartAt:null,loadingEndAt:null,dispatchedAt:null,deliveredAt:null,completedAt:null,
    bay:null,loadingSlot:null,driver:null,truckPlate:null,waybillNo:null,
    compartments:[],sealNos:"",meterOpen:null,meterClose:null,notes:"",
    activityLog:[
      {time:"08:34 · 10 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"09:05 · 10 Mar",actor:"Depot",action:"Order confirmed",note:"Slot assigned for today afternoon"},
    ],
    disputeReason:null,slaLeft:"—",
  },
  {
    id:"VTL-00840",buyer:"Femi Oil & Gas",buyerType:"Petrol Station",buyerLocation:"Lekki, Lagos",
    buyerContact:"+234 802 334 1199",product:"PMS",vol:66000,volLoaded:null,value:52470000,trucks:2,
    status:"scheduled",submittedAt:"2026-03-10 07:00",confirmedAt:"2026-03-10 07:22",
    scheduledAt:"2026-03-10 09:30",loadingStartAt:null,loadingEndAt:null,dispatchedAt:null,deliveredAt:null,completedAt:null,
    bay:"Bay 1",loadingSlot:"11:00",driver:{id:"d3",name:"Chidi Okafor",phone:"+234 805 228 4461"},
    truckPlate:"LSD-334-MN",waybillNo:null,
    compartments:[{no:1,capacity:33000,product:"PMS",volume:null},{no:2,capacity:33000,product:"PMS",volume:null}],
    sealNos:"",meterOpen:null,meterClose:null,notes:"Buyer requested morning loading if possible",
    activityLog:[
      {time:"07:00 · 10 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"07:22 · 10 Mar",actor:"Depot",action:"Order confirmed",note:""},
      {time:"09:30 · 10 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 1 · 11:00 · Driver: Chidi Okafor"},
    ],
    disputeReason:null,slaLeft:"—",
  },
  {
    id:"VTL-00839",buyer:"Silvergate Energy",buyerType:"Petrol Station",buyerLocation:"VI, Lagos",
    buyerContact:"+234 706 243 8800",product:"PMS",vol:132000,volLoaded:null,value:104544000,trucks:4,
    status:"loading",submittedAt:"2026-03-09 18:00",confirmedAt:"2026-03-09 18:42",
    scheduledAt:"2026-03-10 09:00",loadingStartAt:"2026-03-10 09:08",loadingEndAt:null,dispatchedAt:null,deliveredAt:null,completedAt:null,
    bay:"Bay 2",loadingSlot:"09:00",driver:{id:"d2",name:"Bayo Adeyemi",phone:"+234 806 334 9910"},
    truckPlate:"LSD-219-AB",waybillNo:null,
    compartments:[
      {no:1,capacity:33000,product:"PMS",volume:33000},
      {no:2,capacity:33000,product:"PMS",volume:33000},
      {no:3,capacity:33000,product:"PMS",volume:null},
      {no:4,capacity:33000,product:"PMS",volume:null},
    ],
    sealNos:"",meterOpen:"48420",meterClose:null,notes:"",
    activityLog:[
      {time:"18:00 · 9 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"18:42 · 9 Mar",actor:"Depot",action:"Order confirmed",note:""},
      {time:"09:00 · 10 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 2 · 09:00"},
      {time:"09:08 · 10 Mar",actor:"Depot",action:"Loading started",note:"Pump activated"},
    ],
    disputeReason:null,slaLeft:"—",
  },
  {
    id:"VTL-00838",buyer:"Chukwuma Fuels Ltd",buyerType:"Petrol Station",buyerLocation:"Surulere, Lagos",
    buyerContact:"+234 803 421 0044",product:"PMS",vol:66000,volLoaded:65880,value:52470000,trucks:2,
    status:"loaded",submittedAt:"2026-03-09 16:00",confirmedAt:"2026-03-09 16:30",
    scheduledAt:"2026-03-10 07:00",loadingStartAt:"2026-03-10 07:05",loadingEndAt:"2026-03-10 08:22",dispatchedAt:null,deliveredAt:null,completedAt:null,
    bay:"Bay 1",loadingSlot:"07:00",driver:{id:"d1",name:"Emeka Nwosu",phone:"+234 803 421 7762"},
    truckPlate:"LSD-481-KJ",waybillNo:null,
    compartments:[
      {no:1,capacity:33000,product:"PMS",volume:32940},
      {no:2,capacity:33000,product:"PMS",volume:32940},
    ],
    sealNos:"SL-4482, SL-4483",meterOpen:"44100",meterClose:"46296",notes:"",
    activityLog:[
      {time:"16:00 · 9 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"16:30 · 9 Mar",actor:"Depot",action:"Order confirmed",note:""},
      {time:"07:00 · 10 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 1 · Emeka Nwosu"},
      {time:"07:05 · 10 Mar",actor:"Depot",action:"Loading started",note:"Opening meter: 44100"},
      {time:"08:22 · 10 Mar",actor:"Depot",action:"Loading completed",note:"65,880L loaded · Meter: 46296"},
    ],
    disputeReason:null,slaLeft:"—",
  },
  {
    id:"VTL-00837",buyer:"Horizon Petroleum",buyerType:"Petrol Station",buyerLocation:"Agege, Lagos",
    buyerContact:"+234 805 776 3321",product:"PMS",vol:33000,volLoaded:33000,value:26235000,trucks:1,
    status:"dispatched",submittedAt:"2026-03-09 14:00",confirmedAt:"2026-03-09 14:28",
    scheduledAt:"2026-03-09 17:00",loadingStartAt:"2026-03-09 17:05",loadingEndAt:"2026-03-09 17:52",
    dispatchedAt:"2026-03-09 18:10",deliveredAt:null,completedAt:null,
    bay:"Bay 2",loadingSlot:"17:00",driver:{id:"d4",name:"Kunle Fashola",phone:"+234 807 551 0033"},
    truckPlate:"LSD-609-YZ",waybillNo:"WB-2026-00837",
    compartments:[{no:1,capacity:33000,product:"PMS",volume:33000}],
    sealNos:"SL-4478",meterOpen:"41070",meterClose:"42070",notes:"",
    activityLog:[
      {time:"14:00 · 9 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"14:28 · 9 Mar",actor:"Depot",action:"Order confirmed",note:""},
      {time:"17:00 · 9 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 2 · 17:00"},
      {time:"17:05 · 9 Mar",actor:"Depot",action:"Loading started",note:""},
      {time:"17:52 · 9 Mar",actor:"Depot",action:"Loading completed",note:"33,000L loaded"},
      {time:"18:10 · 9 Mar",actor:"Depot",action:"Truck dispatched",note:"Waybill: WB-2026-00837"},
    ],
    disputeReason:null,slaLeft:"—",
  },
  {
    id:"VTL-00841",buyer:"Chukwuma Fuels Ltd",buyerType:"Petrol Station",buyerLocation:"Surulere, Lagos",
    buyerContact:"+234 803 421 0044",product:"PMS",vol:90000,volLoaded:89820,value:71700000,trucks:3,
    status:"completed",submittedAt:"2026-03-08 10:00",confirmedAt:"2026-03-08 10:30",
    scheduledAt:"2026-03-08 14:00",loadingStartAt:"2026-03-08 14:05",loadingEndAt:"2026-03-08 15:48",
    dispatchedAt:"2026-03-08 16:15",deliveredAt:"2026-03-08 19:42",completedAt:"2026-03-08 19:50",
    bay:"Bay 1",loadingSlot:"14:00",driver:{id:"d1",name:"Emeka Nwosu",phone:"+234 803 421 7762"},
    truckPlate:"LSD-481-KJ",waybillNo:"WB-2026-00841",
    compartments:[
      {no:1,capacity:33000,product:"PMS",volume:29940},
      {no:2,capacity:33000,product:"PMS",volume:29940},
      {no:3,capacity:33000,product:"PMS",volume:29940},
    ],
    sealNos:"SL-4471, SL-4472, SL-4473",meterOpen:"38100",meterClose:"41094",notes:"",
    activityLog:[
      {time:"10:00 · 8 Mar",actor:"Buyer",action:"Order placed",note:""},
      {time:"10:30 · 8 Mar",actor:"Depot",action:"Order confirmed",note:""},
      {time:"14:00 · 8 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 1 · 14:00"},
      {time:"14:05 · 8 Mar",actor:"Depot",action:"Loading started",note:"Opening meter: 38100"},
      {time:"15:48 · 8 Mar",actor:"Depot",action:"Loading completed",note:"89,820L loaded"},
      {time:"16:15 · 8 Mar",actor:"Depot",action:"Truck dispatched",note:"Waybill: WB-2026-00841"},
      {time:"19:42 · 8 Mar",actor:"Buyer",action:"Delivery confirmed",note:"Received at Surulere station"},
      {time:"19:50 · 8 Mar",actor:"System",action:"Order completed",note:"Escrow ₦71.7M released"},
    ],
    disputeReason:null,slaLeft:"—",
  },
];

const SCHEDULE_DAYS = ["Mon 10 Mar","Tue 11 Mar","Wed 12 Mar","Thu 13 Mar","Fri 14 Mar"];

// ─── SHARED UI ─────────────────────────────────────────────────────
function useRipple() {
  const [ripples,setRipples] = useState([]);
  const add = e => {
    const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,id=Date.now()+Math.random();
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
      style={{position:"relative",overflow:"hidden",transform:pressed?"scale(0.96)":hovered?"scale(1.01)":"scale(1)",transition:"transform 0.12s cubic-bezier(0.4,0,0.2,1),background 0.15s,color 0.15s,box-shadow 0.15s",cursor:disabled?"not-allowed":"pointer",...style}}>
      {children}<RippleLayer ripples={ripples} color={rippleColor||"rgba(255,255,255,0.22)"}/>
    </button>
  );
}
function MotionCard({children,style,onClick,hapticPattern}) {
  const [hovered,setHovered]=useState(false);
  const [pressed,setPressed]=useState(false);
  const [ripples,addRipple]=useRipple();
  const handleClick=e=>{ addRipple(e); haptic(hapticPattern||H.soft); onClick?.(e); };
  return (
    <div onClick={onClick?handleClick:undefined} onMouseDown={()=>onClick&&setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setPressed(false);}}
      style={{position:"relative",overflow:"hidden",transform:pressed?"scale(0.985)":hovered?"translateY(-2px)":"none",transition:"transform 0.15s cubic-bezier(0.4,0,0.2,1),box-shadow 0.15s",boxShadow:hovered?"0 4px 16px rgba(0,0,0,0.08)":"none",cursor:onClick?"pointer":"default",...style}}>
      {children}{onClick&&<RippleLayer ripples={ripples} color="rgba(0,0,0,0.05)"/>}
    </div>
  );
}
function StatusPill({status}) {
  const c=STAGE_CFG[status]||{label:status,color:T.gray600,bg:T.gray100,icon:"·"};
  return <span style={{background:c.bg,color:c.color,fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"4px",display:"inline-flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}><span>{c.icon}</span>{c.short||c.label}</span>;
}
function FRow({label,value}) {
  return (
    <div style={{background:T.gray50,padding:"8px 10px"}}>
      <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{label}</div>
      <div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{value||"—"}</div>
    </div>
  );
}
function FGrid({pairs}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
      {pairs.map(([k,v])=><FRow key={k} label={k} value={v}/>)}
    </div>
  );
}
function Lbl({children}) {
  return <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{children}</div>;
}
function TextInput({label,value,onChange,type="text",placeholder,prefix,suffix,hint}) {
  return (
    <div style={{marginBottom:"14px"}}>
      {label&&<Lbl>{label}</Lbl>}
      <div style={{display:"flex",alignItems:"center",border:`2px solid ${T.gray200}`,transition:"border-color 0.15s"}}
        onFocusCapture={e=>e.currentTarget.style.borderColor=T.black}
        onBlurCapture={e=>e.currentTarget.style.borderColor=T.gray200}>
        {prefix&&<span style={{padding:"10px 12px",fontSize:"12px",fontWeight:700,color:T.gray400,borderRight:`1px solid ${T.gray100}`,whiteSpace:"nowrap",flexShrink:0}}>{prefix}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{flex:1,border:"none",padding:"11px 12px",fontSize:"14px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:"transparent",width:"100%"}}/>
        {suffix&&<span style={{padding:"10px 12px",fontSize:"12px",fontWeight:700,color:T.gray400,borderLeft:`1px solid ${T.gray100}`,whiteSpace:"nowrap",flexShrink:0}}>{suffix}</span>}
      </div>
      {hint&&<div style={{fontSize:"10px",color:T.gray400,marginTop:"4px"}}>{hint}</div>}
    </div>
  );
}
function TextArea({label,value,onChange,placeholder,rows=3}) {
  return (
    <div style={{marginBottom:"14px"}}>
      {label&&<Lbl>{label}</Lbl>}
      <div style={{border:`2px solid ${T.gray200}`,transition:"border-color 0.15s"}}
        onFocusCapture={e=>e.currentTarget.style.borderColor=T.black}
        onBlurCapture={e=>e.currentTarget.style.borderColor=T.gray200}>
        <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:"100%",border:"none",padding:"11px 12px",fontSize:"13px",fontFamily:F,outline:"none",color:T.black,background:"transparent",resize:"vertical",boxSizing:"border-box"}}/>
      </div>
    </div>
  );
}
function SelInput({label,value,onChange,options}) {
  return (
    <div style={{marginBottom:"14px"}}>
      {label&&<Lbl>{label}</Lbl>}
      <div style={{position:"relative"}}>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",border:`2px solid ${T.gray200}`,padding:"11px 36px 11px 12px",fontSize:"13px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:T.white,appearance:"none",cursor:"pointer"}}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",color:T.gray400,pointerEvents:"none",fontSize:"11px"}}>▾</span>
      </div>
    </div>
  );
}
function InfoBanner({type,children}) {
  const cfg={green:{bg:T.greenLight,color:T.greenDark},blue:{bg:T.blueLight,color:T.blue},amber:{bg:T.amberLight,color:"#8A5C00"},red:{bg:T.redLight,color:T.red},purple:{bg:T.purpleLight,color:T.purple}};
  const c=cfg[type]||cfg.blue;
  return <div style={{background:c.bg,border:`1px solid ${c.color}20`,padding:"10px 14px",marginBottom:"14px",fontSize:"12px",color:c.color,fontWeight:600,lineHeight:1.5}}>{children}</div>;
}
function Divider({label}) {
  return <div style={{fontSize:"11px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px",paddingTop:"4px"}}>{label}</div>;
}

// ─── MODAL WRAPPER ─────────────────────────────────────────────────
function Modal({open,onClose,title,children,isMobile,width="600px"}) {
  useEffect(()=>{
    if(open){document.body.style.overflow="hidden";}else{document.body.style.overflow="";}
    return()=>{document.body.style.overflow="";};
  },[open]);
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",animation:"vFadeIn 0.2s ease"}} onClick={onClose}/>
      <div style={{position:"relative",background:T.white,width:isMobile?"100%":width,maxWidth:"100vw",maxHeight:isMobile?"95vh":"90vh",overflowY:"auto",animation:isMobile?"vDrawerUp 0.3s cubic-bezier(0.4,0,0.2,1)":"vModalIn 0.25s ease",zIndex:1,display:"flex",flexDirection:"column"}}>
        {isMobile&&<div style={{width:"36px",height:"4px",background:T.gray200,borderRadius:"2px",margin:"10px auto 0",flexShrink:0}}/>}
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:"15px",fontWeight:800,color:T.black}}>{title}</div>
          <Btn onClick={onClose} style={{background:"none",border:"none",color:T.gray400,fontSize:"20px",padding:"0 6px",lineHeight:1,fontFamily:F}}>✕</Btn>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── ORDER TIMELINE ────────────────────────────────────────────────
function OrderTimeline({order}) {
  const stages=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered","completed"];
  const currentIdx=stages.indexOf(order.status);
  return (
    <div style={{marginBottom:"20px"}}>
      <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",paddingBottom:"4px"}}>
        {stages.map((s,i)=>{
          const cfg=STAGE_CFG[s];
          const done=currentIdx>i;
          const active=currentIdx===i;
          const future=currentIdx<i;
          return (
            <div key={s} style={{display:"flex",alignItems:"flex-start",flex:i<stages.length-1?"1":"0",minWidth:"fit-content"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",padding:"0 2px"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",flexShrink:0,
                  background:done||active?cfg.bg:T.gray100,
                  border:`2px solid ${done||active?cfg.color:T.gray200}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",
                  transition:"all 0.3s",transform:active?"scale(1.12)":"scale(1)"}}>
                  {done
                    ? <span style={{fontSize:"11px",color:cfg.color,fontWeight:800}}>✓</span>
                    : <span style={{fontSize:"11px",color:future?T.gray300:cfg.color}}>{cfg.icon}</span>}
                </div>
                <div style={{fontSize:"8px",fontWeight:700,color:active?T.black:future?T.gray200:T.gray600,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center",whiteSpace:"nowrap"}}>{cfg.short}</div>
              </div>
              {i<stages.length-1&&(
                <div style={{flex:1,height:"2px",background:done?T.green:T.gray200,margin:"13px 2px 0",minWidth:"10px",transition:"background 0.4s ease"}}/>
              )}
            </div>
          );
        })}
      </div>
      {(order.status==="rejected"||order.status==="disputed")&&(
        <div style={{background:T.redLight,border:`1px solid ${T.red}20`,padding:"8px 12px",marginTop:"8px",fontSize:"11px",color:T.red,fontWeight:700}}>
          {order.status==="rejected"?"✕ Order Rejected — Buyer notified":"⚠ Order Disputed — Escrow held pending resolution"}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY LOG ──────────────────────────────────────────────────
function ActivityLog({log}) {
  const entries=[...(log||[])].reverse();
  return (
    <div>
      <Divider label={`Activity Log (${entries.length})`}/>
      {entries.length===0&&<div style={{color:T.gray400,fontSize:"12px",padding:"12px 0"}}>No activity yet</div>}
      {entries.map((e,i)=>(
        <div key={i} style={{display:"flex",gap:"10px",marginBottom:"12px",animation:`vFadeUp 0.2s ${i*0.04}s both`}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:e.actor==="System"?T.green:e.actor==="Buyer"?T.blue:T.black,flexShrink:0,marginTop:"4px"}}/>
          <div style={{flex:1,paddingBottom:"12px",borderBottom:i<entries.length-1?`1px dashed ${T.gray100}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px",gap:"8px"}}>
              <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{e.action}</span>
              <span style={{fontSize:"10px",color:T.gray400,whiteSpace:"nowrap",flexShrink:0}}>{e.time}</span>
            </div>
            {e.note&&<div style={{fontSize:"11px",color:T.gray600,marginBottom:"2px"}}>{e.note}</div>}
            <div style={{fontSize:"10px",color:T.gray400}}>{e.actor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WAYBILL ───────────────────────────────────────────────────────
function Waybill({order,onClose}) {
  const wbNo=order.waybillNo||`WB-2026-${order.id.split("-")[1]}`;
  const totalL=order.compartments.reduce((a,c)=>a+(Number(c.volume)||0),0);
  return (
    <div>
      <div style={{border:`2px solid ${T.black}`,padding:"24px",fontFamily:"'Courier New',monospace",fontSize:"12px",background:T.white}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",paddingBottom:"16px",borderBottom:`2px solid ${T.black}`}}>
          <div>
            <div style={{fontSize:"22px",fontWeight:800,fontFamily:F,letterSpacing:"-0.02em"}}>VENTRYL</div>
            <div style={{fontSize:"10px",color:T.gray600,fontFamily:F}}>B2B PETROLEUM MARKETPLACE</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"12px",fontWeight:800}}>WAYBILL / DELIVERY NOTE</div>
            <div style={{fontSize:"18px",fontWeight:800,fontFamily:F}}>{wbNo}</div>
            <div style={{fontSize:"10px",color:T.gray600}}>NMDPRA Compliant Document</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
          <div><div style={{fontWeight:700,marginBottom:"6px",textTransform:"uppercase",fontSize:"10px",borderBottom:`1px solid ${T.black}`,paddingBottom:"4px"}}>FROM (DEPOT)</div>
            <div style={{fontWeight:700}}>Nepal Energies Ltd</div>
            <div>Apapa, Lagos</div>
            <div>NMDPRA Licence: MDP/D/0042</div>
          </div>
          <div><div style={{fontWeight:700,marginBottom:"6px",textTransform:"uppercase",fontSize:"10px",borderBottom:`1px solid ${T.black}`,paddingBottom:"4px"}}>TO (CONSIGNEE)</div>
            <div style={{fontWeight:700}}>{order.buyer}</div>
            <div>{order.buyerLocation}</div>
            <div>Tel: {order.buyerContact}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
          {[["Order Ref",order.id],["Driver",order.driver?.name||"—"],["Vehicle",order.truckPlate||"—"],["Date",order.dispatchedAt?.split(" ")[0]||"—"]].map(([k,v])=>(
            <div key={k} style={{background:T.gray50,padding:"8px"}}>
              <div style={{fontSize:"9px",textTransform:"uppercase",color:T.gray400,marginBottom:"2px"}}>{k}</div>
              <div style={{fontWeight:700,fontFamily:F,fontSize:"11px"}}>{v}</div>
            </div>
          ))}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"16px"}}>
          <thead>
            <tr style={{background:T.black,color:T.white}}>
              {["Compt.","Product","Capacity (L)","Loaded (L)"].map(h=>(
                <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:"10px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.compartments.map((c,i)=>(
              <tr key={i} style={{background:i%2===0?T.white:T.gray50}}>
                <td style={{padding:"7px 10px",fontFamily:F,fontWeight:700}}>{c.no}</td>
                <td style={{padding:"7px 10px",fontFamily:F}}>{c.product}</td>
                <td style={{padding:"7px 10px",fontFamily:F}}>{c.capacity.toLocaleString()}</td>
                <td style={{padding:"7px 10px",fontFamily:F,fontWeight:700}}>{(Number(c.volume)||0).toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{background:T.gray100}}>
              <td colSpan={3} style={{padding:"8px 10px",fontFamily:F,textAlign:"right",fontWeight:800}}>TOTAL LOADED</td>
              <td style={{padding:"8px 10px",fontFamily:F,fontWeight:800}}>{totalL.toLocaleString()} L</td>
            </tr>
          </tbody>
        </table>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          <div><div style={{fontSize:"10px",textTransform:"uppercase",color:T.gray400,marginBottom:"4px"}}>Seal Numbers</div><div style={{fontWeight:700,fontFamily:F}}>{order.sealNos||"—"}</div></div>
          <div><div style={{fontSize:"10px",textTransform:"uppercase",color:T.gray400,marginBottom:"4px"}}>Pump Meter</div>
            <div style={{fontFamily:F}}>Open: {order.meterOpen||"—"} m³</div>
            <div style={{fontFamily:F}}>Close: {order.meterClose||"—"} m³</div>
          </div>
        </div>
        <div style={{borderTop:`2px solid ${T.black}`,paddingTop:"14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px",textAlign:"center"}}>
          {["Depot Officer","Truck Driver","Buyer / Receiver"].map(r=>(
            <div key={r}><div style={{height:"30px",borderBottom:`1px solid ${T.black}`,marginBottom:"4px"}}/><div style={{fontSize:"9px",textTransform:"uppercase",color:T.gray400}}>{r}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
        <Btn hapticPattern={H.tap} onClick={()=>window.print()} style={{flex:1,background:T.black,color:T.white,border:"none",padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F}}>🖨 Print Waybill</Btn>
        <Btn hapticPattern={H.soft} onClick={onClose} style={{flex:1,background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F}}>Close</Btn>
      </div>
    </div>
  );
}

// ─── ACTION PANELS (top-level components, NOT nested) ──────────────

function PanelPending({order,onUpdate,addToast,isMobile}) {
  const [loading,setLoading]=useState("");
  const act=(patch,msg,delay=900)=>{
    setLoading("acting");haptic(H.confirm);
    setTimeout(()=>{
      const entry={time:nowStr(),actor:"Depot",action:msg.split("·")[0].trim(),note:msg.split("·")[1]?.trim()||""};
      onUpdate(order.id,{...patch,activityLog:[...(order.activityLog||[]),entry]});
      setLoading("");addToast("success",msg);
    },delay);
  };
  return (
    <div>
      <InfoBanner type="amber">⏱ SLA expires in <strong>{order.slaLeft}</strong>. Confirm or reject within 2 hours of receipt.</InfoBanner>
      <FGrid pairs={[["Buyer",order.buyer],["Buyer Type",order.buyerType],["Product",order.product],["Volume",`${(order.vol/1000).toFixed(0)},000 L`],["Trucks Required",order.trucks],["Order Value",fmt(order.value)],["Delivery Location",order.buyerLocation],["Contact",order.buyerContact]]}/>
      <div style={{display:"flex",gap:"10px"}}>
        <Btn hapticPattern={H.warning}
          onClick={()=>{const r=window.prompt("Reason for rejection (required):"); if(!r||!r.trim())return; act({status:"rejected"},"Order rejected · "+r);}}
          style={{flex:1,background:T.white,color:T.red,border:`1px solid ${T.red}`,padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          ✕ Reject
        </Btn>
        <Btn hapticPattern={H.confirm} disabled={loading==="acting"}
          onClick={()=>act({status:"confirmed",confirmedAt:nowStr()},"Order confirmed · Schedule loading next")}
          style={{flex:2,background:T.green,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          {loading==="acting"?"Confirming…":"✓ Confirm Order"}
        </Btn>
      </div>
    </div>
  );
}

function PanelConfirmed({order,onUpdate,addToast,drivers,isMobile}) {
  const [loading,setLoading]=useState("");
  const [bay,setBay]=useState(order.bay||"Bay 1");
  const [slot,setSlot]=useState(order.loadingSlot||"09:00");
  const [driverId,setDriverId]=useState(order.driver?.id||"");
  const [truckPlate,setTruckPlate]=useState(order.truckPlate||"");
  const [notes,setNotes]=useState(order.notes||"");
  const numCompts=order.trucks*2;

  const handleSchedule=()=>{
    if(!driverId){addToast("warning","Please select a driver");return;}
    if(!truckPlate.trim()){addToast("warning","Please enter the truck plate number");return;}
    const d=drivers.find(x=>x.id===driverId);
    const comps=Array.from({length:numCompts},(_,i)=>({no:i+1,capacity:33000,product:order.product,volume:null}));
    setLoading("schedule");haptic(H.confirm);
    setTimeout(()=>{
      const entry={time:nowStr(),actor:"Depot",action:"Loading scheduled",note:`${bay} · ${slot} · Driver: ${d.name}`};
      onUpdate(order.id,{status:"scheduled",scheduledAt:nowStr(),bay,loadingSlot:slot,driver:d,truckPlate:truckPlate.trim(),compartments:comps,notes,activityLog:[...(order.activityLog||[]),entry]});
      setLoading("");
      addToast("success",`Loading scheduled · ${bay} at ${slot} · Driver: ${d.name}`);
    },900);
  };

  return (
    <div>
      <InfoBanner type="blue">📅 Assign a loading bay, time slot, and driver to schedule this order.</InfoBanner>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        <SelInput label="Loading Bay" value={bay} onChange={setBay} options={[{value:"Bay 1",label:"Bay 1"},{value:"Bay 2",label:"Bay 2"}]}/>
        <SelInput label="Time Slot" value={slot} onChange={setSlot} options={["07:00","09:00","11:00","13:00","15:00","17:00"].map(t=>({value:t,label:t}))}/>
      </div>
      <SelInput label="Assign Driver" value={driverId} onChange={setDriverId}
        options={[{value:"",label:"— Select a driver —"},...drivers.map(d=>({value:d.id,label:`${d.name}${d.available?"":" (unavailable)"}`}))]}/>
      <TextInput label="Truck / Tanker Plate Number" value={truckPlate} onChange={setTruckPlate} placeholder="e.g. LSD-481-KJ"/>
      <div style={{background:T.gray50,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.gray600}}>
        <span style={{fontWeight:700}}>{numCompts} compartments</span> will be created across {order.trucks} tanker{order.trucks>1?"s":""} ({order.trucks}×2 compts × 33,000L)
      </div>
      <TextArea label="Loading Notes (optional)" value={notes} onChange={setNotes} placeholder="Any special instructions for the loading team…"/>
      <Btn hapticPattern={H.double} disabled={!driverId||!truckPlate.trim()||loading==="schedule"} onClick={handleSchedule}
        style={{width:"100%",background:!driverId||!truckPlate.trim()?T.gray200:T.black,color:!driverId||!truckPlate.trim()?T.gray400:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
        {loading==="schedule"?"Scheduling…":"📅 Schedule Loading"}
      </Btn>
    </div>
  );
}

function PanelScheduled({order,onUpdate,addToast}) {
  const [loading,setLoading]=useState("");
  const [meterOpen,setMeterOpen]=useState(order.meterOpen||"");
  return (
    <div>
      <InfoBanner type="purple">⛽ Truck is scheduled. Enter the opening meter reading, then activate loading.</InfoBanner>
      <FGrid pairs={[["Loading Bay",order.bay],["Time Slot",order.loadingSlot],["Driver",order.driver?.name],["Truck Plate",order.truckPlate],["Compartments",order.compartments?.length||0],["Scheduled At",order.scheduledAt]]}/>
      <TextInput label="Opening Meter Reading" value={meterOpen} onChange={setMeterOpen} type="number" placeholder="e.g. 44100" suffix="m³" hint="Record the pump meter before loading starts"/>
      <Btn hapticPattern={H.confirm} disabled={loading==="start"} onClick={()=>{
        if(!meterOpen){addToast("warning","Enter the opening meter reading before starting");return;}
        setLoading("start");haptic(H.confirm);
        setTimeout(()=>{
          const entry={time:nowStr(),actor:"Depot",action:"Loading started",note:`Opening meter: ${meterOpen} m³`};
          onUpdate(order.id,{status:"loading",loadingStartAt:nowStr(),meterOpen,activityLog:[...(order.activityLog||[]),entry]});
          setLoading("");addToast("success","Loading started · Record volumes per compartment below");
        },900);
      }} style={{width:"100%",background:loading==="start"?T.gray200:T.purple,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
        {loading==="start"?"Starting…":"⛽ Start Loading"}
      </Btn>
    </div>
  );
}

function PanelLoading({order,onUpdate,addToast}) {
  const [loading,setLoading]=useState("");
  const [compartments,setCompartments]=useState(
    (order.compartments&&order.compartments.length>0) ? order.compartments
    : Array.from({length:order.trucks*2},(_,i)=>({no:i+1,capacity:33000,product:order.product,volume:null}))
  );
  const [meterClose,setMeterClose]=useState(order.meterClose||"");
  const [sealNos,setSealNos]=useState(order.sealNos||"");
  const totalLoaded=compartments.reduce((a,c)=>a+(Number(c.volume)||0),0);
  const allFilled=compartments.every(c=>c.volume!==null&&c.volume!==undefined&&c.volume!=="");

  const updateVol=(idx,v)=>setCompartments(prev=>prev.map((c,i)=>i===idx?{...c,volume:v===""?null:Number(v)}:c));

  return (
    <div>
      <InfoBanner type="purple">⛽ Loading in progress since {order.loadingStartAt}. Record each compartment volume.</InfoBanner>
      <Divider label={`Compartment Loading Record (${order.trucks} truck${order.trucks>1?"s":""})`}/>
      <div style={{marginBottom:"14px"}}>
        {compartments.map((c,i)=>(
          <div key={c.no} style={{display:"grid",gridTemplateColumns:"40px 1fr 130px",gap:"8px",alignItems:"center",marginBottom:"8px",padding:"10px 12px",background:T.gray50,border:`1px solid ${c.volume?T.green:T.gray200}`}}>
            <div style={{fontSize:"13px",fontWeight:800,color:T.black,textAlign:"center",background:c.volume?T.greenLight:T.gray100,borderRadius:"50%",width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center"}}>C{c.no}</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:700,color:T.black}}>{c.product} · Capacity: {c.capacity.toLocaleString()}L</div>
              <div style={{height:"4px",background:T.gray200,borderRadius:"2px",marginTop:"4px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${c.volume?(Number(c.volume)/c.capacity*100):0}%`,background:T.purple,borderRadius:"2px",transition:"width 0.3s"}}/>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",border:`1px solid ${T.gray200}`,background:T.white}}>
              <input type="number" value={c.volume===null||c.volume===undefined?"":c.volume} onChange={e=>updateVol(i,e.target.value)} placeholder="0"
                style={{flex:1,border:"none",padding:"8px 8px",fontSize:"13px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,width:"60px"}}/>
              <span style={{padding:"8px 6px",fontSize:"10px",color:T.gray400,flexShrink:0}}>L</span>
            </div>
          </div>
        ))}
        <div style={{padding:"10px 14px",background:T.black,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:"12px",fontWeight:700,color:T.gray400}}>Total Loaded</span>
          <span style={{fontSize:"15px",fontWeight:800,color:T.green}}>{totalLoaded.toLocaleString()} L <span style={{color:T.gray400,fontSize:"11px"}}>/ {order.vol.toLocaleString()} L</span></span>
        </div>
      </div>
      <TextInput label="Closing Meter Reading" value={meterClose} onChange={setMeterClose} type="number" placeholder="e.g. 46296" suffix="m³"/>
      <TextInput label="Seal Numbers (comma separated)" value={sealNos} onChange={setSealNos} placeholder="e.g. SL-4482, SL-4483"/>
      <Btn hapticPattern={H.double} disabled={!allFilled||!meterClose||loading==="complete"} onClick={()=>{
        setLoading("complete");haptic(H.confirm);
        setTimeout(()=>{
          const entry={time:nowStr(),actor:"Depot",action:"Loading completed",note:`${totalLoaded.toLocaleString()}L loaded · Meter: ${meterClose} m³`};
          onUpdate(order.id,{status:"loaded",loadingEndAt:nowStr(),compartments,meterClose,sealNos,volLoaded:totalLoaded,activityLog:[...(order.activityLog||[]),entry]});
          setLoading("");addToast("success",`Loading completed · ${totalLoaded.toLocaleString()}L · Seals applied`);
        },900);
      }} style={{width:"100%",background:!allFilled||!meterClose?T.gray200:T.black,color:!allFilled||!meterClose?T.gray400:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
        {loading==="complete"?"Completing…":"🔒 Complete Loading"}
      </Btn>
      {!allFilled&&<div style={{fontSize:"10px",color:T.gray400,textAlign:"center",marginTop:"6px"}}>Fill all compartment volumes to continue</div>}
    </div>
  );
}

function PanelLoaded({order,onUpdate,addToast,isMobile}) {
  const [loading,setLoading]=useState("");
  const [showWaybill,setShowWaybill]=useState(false);
  const wbNo=`WB-2026-${order.id.split("-")[1]}`;
  const totalLoaded=order.compartments.reduce((a,c)=>a+(Number(c.volume)||0),0);
  return (
    <div>
      <InfoBanner type="green">✓ Loading complete · {totalLoaded.toLocaleString()}L loaded · Ready to dispatch</InfoBanner>
      <FGrid pairs={[["Volume Loaded",`${totalLoaded.toLocaleString()} L`],["Ordered",`${order.vol.toLocaleString()} L`],["Variance",`${(order.vol-totalLoaded).toLocaleString()} L`],["Seals",order.sealNos||"—"],["Meter Open",`${order.meterOpen||"—"} m³`],["Meter Close",`${order.meterClose||"—"} m³`]]}/>
      <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)}
        style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>
        📄 Review Waybill — {wbNo}
      </Btn>
      <Btn hapticPattern={H.double} disabled={loading==="dispatch"} onClick={()=>{
        setLoading("dispatch");haptic(H.confirm);
        setTimeout(()=>{
          const entry={time:nowStr(),actor:"Depot",action:"Truck dispatched",note:`Waybill: ${wbNo} · Driver: ${order.driver?.name}`};
          onUpdate(order.id,{status:"dispatched",dispatchedAt:nowStr(),waybillNo:wbNo,activityLog:[...(order.activityLog||[]),entry]});
          setLoading("");addToast("success",`Truck dispatched · Waybill: ${wbNo} · ETA 3–4 hours`);
        },900);
      }} style={{width:"100%",background:loading==="dispatch"?T.gray200:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
        {loading==="dispatch"?"Dispatching…":"🚛 Dispatch Truck"}
      </Btn>
      <Modal open={showWaybill} onClose={()=>setShowWaybill(false)} title={`Waybill ${wbNo}`} isMobile={isMobile} width="560px">
        <Waybill order={{...order,waybillNo:wbNo}} onClose={()=>setShowWaybill(false)}/>
      </Modal>
    </div>
  );
}

function PanelDispatched({order,onUpdate,addToast,isMobile}) {
  const [loading,setLoading]=useState("");
  const [showWaybill,setShowWaybill]=useState(false);
  return (
    <div>
      <InfoBanner type="blue">🚛 In transit since {order.dispatchedAt}. Awaiting buyer delivery confirmation.</InfoBanner>
      <FGrid pairs={[["Driver",order.driver?.name||"—"],["Phone",order.driver?.phone||"—"],["Truck",order.truckPlate||"—"],["Waybill",order.waybillNo||"—"],["Departed",order.dispatchedAt||"—"],["Destination",order.buyerLocation]]}/>
      <Btn hapticPattern={H.tap} onClick={()=>{ if(order.driver?.phone){ window.open(`tel:${order.driver.phone}`); } else { addToast("info","No driver phone on record"); } }}
        style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>
        📞 Call Driver — {order.driver?.name||"—"}
      </Btn>
      <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)}
        style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>
        📄 View Waybill — {order.waybillNo}
      </Btn>
      <Btn hapticPattern={H.confirm} disabled={loading==="deliver"} onClick={()=>{
        setLoading("deliver");haptic(H.confirm);
        setTimeout(()=>{
          const entry={time:nowStr(),actor:"Depot",action:"Delivery confirmed (depot override)",note:"Buyer confirmed receipt or 24h override applied"};
          onUpdate(order.id,{status:"delivered",deliveredAt:nowStr(),activityLog:[...(order.activityLog||[]),entry]});
          setLoading("");addToast("success","Delivery confirmed · Awaiting escrow release from buyer");
        },900);
      }} style={{width:"100%",background:loading==="deliver"?T.gray200:T.green,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
        {loading==="deliver"?"Confirming…":"📦 Confirm Delivery"}
      </Btn>
      <div style={{fontSize:"10px",color:T.gray400,textAlign:"center",marginTop:"6px"}}>Use if buyer is unresponsive after truck has arrived</div>
      <Modal open={showWaybill} onClose={()=>setShowWaybill(false)} title={`Waybill ${order.waybillNo}`} isMobile={isMobile} width="560px">
        <Waybill order={order} onClose={()=>setShowWaybill(false)}/>
      </Modal>
    </div>
  );
}

function PanelDelivered({order,onUpdate,addToast}) {
  const [loading,setLoading]=useState("");
  return (
    <div>
      <InfoBanner type="green">📦 Delivered at {order.deliveredAt} · Awaiting buyer to release escrow</InfoBanner>
      <div style={{border:`1px solid ${T.gray100}`,padding:"14px 16px",marginBottom:"14px"}}>
        {[["Volume Delivered",`${(order.volLoaded||order.vol).toLocaleString()} L`],["Waybill",order.waybillNo||"—"],["Escrow Value",fmt(order.value)]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px"}}>
            <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{fontWeight:800,color:T.black}}>{v}</span>
          </div>
        ))}
      </div>
      <InfoBanner type="amber">💡 Escrow of {fmt(order.value)} releases automatically when buyer confirms receipt in their portal.</InfoBanner>
      <Btn hapticPattern={H.confirm} disabled={loading==="complete"} onClick={()=>{
        setLoading("complete");haptic(H.confirm);
        setTimeout(()=>{
          const entry={time:nowStr(),actor:"System",action:"Order completed",note:`Escrow ${fmt(order.value)} released to depot revenue`};
          onUpdate(order.id,{status:"completed",completedAt:nowStr(),activityLog:[...(order.activityLog||[]),entry]});
          setLoading("");addToast("success",`Order completed · ${fmt(order.value)} revenue released`);
        },900);
      }} style={{width:"100%",background:loading==="complete"?T.gray200:T.black,color:T.white,border:"none",padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"44px"}}>
        {loading==="complete"?"Completing…":"✅ Force Complete & Release Escrow"}
      </Btn>
      <div style={{fontSize:"10px",color:T.gray400,textAlign:"center",marginTop:"6px"}}>Only if buyer is unresponsive after 24 hours</div>
    </div>
  );
}

function PanelCompleted({order,isMobile}) {
  const [showWaybill,setShowWaybill]=useState(false);
  return (
    <div>
      <div style={{background:T.greenLight,padding:"20px",marginBottom:"16px",textAlign:"center"}}>
        <div style={{fontSize:"36px",marginBottom:"8px"}}>✅</div>
        <div style={{fontSize:"16px",fontWeight:800,color:T.greenDark}}>Order Completed</div>
        <div style={{fontSize:"13px",color:T.greenDark,marginTop:"4px"}}>{fmt(order.value)} released to revenue</div>
      </div>
      <FGrid pairs={[["Volume Loaded",`${(order.volLoaded||order.vol).toLocaleString()} L`],["Revenue",fmt(order.value)],["Loading Bay",order.bay||"—"],["Driver",order.driver?.name||"—"],["Dispatched",order.dispatchedAt||"—"],["Completed",order.completedAt||"—"]]}/>
      {order.waybillNo&&(
        <>
          <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)}
            style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>
            📄 View Completed Waybill — {order.waybillNo}
          </Btn>
          <Modal open={showWaybill} onClose={()=>setShowWaybill(false)} title={`Waybill ${order.waybillNo}`} isMobile={isMobile} width="560px">
            <Waybill order={order} onClose={()=>setShowWaybill(false)}/>
          </Modal>
        </>
      )}
    </div>
  );
}

function PanelDisputed({order,onUpdate,addToast}) {
  const [loading,setLoading]=useState("");
  const [response,setResponse]=useState("");
  return (
    <div>
      <InfoBanner type="red">⚠ Dispute raised by buyer · Escrow of {fmt(order.value)} held pending resolution</InfoBanner>
      {order.disputeReason&&(
        <div style={{border:`1px solid ${T.red}30`,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.gray800}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"4px"}}>Buyer's Complaint</div>
          {order.disputeReason}
        </div>
      )}
      <TextArea label="Your Response" value={response} onChange={setResponse} rows={3} placeholder="Describe your position, reference waybill numbers, evidence…"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <Btn hapticPattern={H.tap} onClick={()=>{ addToast("info","Dispute escalated to Ventryl support team. They will respond within 2 hours."); }}
          style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>
          Escalate to Ventryl
        </Btn>
        <Btn hapticPattern={H.confirm} disabled={!response.trim()||loading==="resolve"} onClick={()=>{
          setLoading("resolve");haptic(H.confirm);
          setTimeout(()=>{
            const entry={time:nowStr(),actor:"Depot",action:"Dispute resolved",note:response.trim().substring(0,80)};
            onUpdate(order.id,{status:"completed",completedAt:nowStr(),disputeReason:null,activityLog:[...(order.activityLog||[]),entry]});
            setLoading("");addToast("success","Dispute resolved · Order completed · Escrow released");
          },900);
        }} style={{background:!response.trim()?T.gray200:T.black,color:!response.trim()?T.gray400:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>
          {loading==="resolve"?"Resolving…":"Resolve & Close"}
        </Btn>
      </div>
    </div>
  );
}

function PanelDetails({order}) {
  return (
    <div>
      <FGrid pairs={[["Order ID",order.id],["Buyer",order.buyer],["Buyer Type",order.buyerType],["Location",order.buyerLocation],["Contact",order.buyerContact],["Product",order.product],["Volume Ordered",`${order.vol.toLocaleString()} L`],["Volume Loaded",order.volLoaded?`${order.volLoaded.toLocaleString()} L`:"—"],["Value",fmt(order.value)],["Trucks",order.trucks],["Bay",order.bay||"—"],["Driver",order.driver?.name||"—"],["Truck Plate",order.truckPlate||"—"],["Waybill",order.waybillNo||"—"],["Submitted",order.submittedAt||"—"],["Confirmed",order.confirmedAt||"—"],["Scheduled",order.scheduledAt||"—"],["Dispatched",order.dispatchedAt||"—"],["Delivered",order.deliveredAt||"—"],["Completed",order.completedAt||"—"]]}/>
      {order.notes&&<InfoBanner type="amber">Notes: {order.notes}</InfoBanner>}
      {(order.compartments&&order.compartments.length>0)&&(
        <div>
          <Divider label="Compartment Summary"/>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"14px"}}>
            <thead><tr style={{background:T.black,color:T.white}}>{["Compt.","Product","Capacity","Loaded"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:"10px",fontFamily:F,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>{order.compartments.map((c,i)=>(
              <tr key={i} style={{background:i%2===0?T.white:T.gray50}}>
                <td style={{padding:"7px 10px",fontFamily:F,fontWeight:700}}>{c.no}</td>
                <td style={{padding:"7px 10px",fontFamily:F}}>{c.product}</td>
                <td style={{padding:"7px 10px",fontFamily:F}}>{c.capacity.toLocaleString()} L</td>
                <td style={{padding:"7px 10px",fontFamily:F,fontWeight:700}}>{c.volume!==null&&c.volume!==undefined?`${Number(c.volume).toLocaleString()} L`:"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {order.sealNos&&<div style={{marginBottom:"10px"}}><Divider label="Seal Numbers"/><div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{order.sealNos}</div></div>}
      {(order.meterOpen||order.meterClose)&&<div><Divider label="Meter Readings"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}><FRow label="Opening" value={`${order.meterOpen||"—"} m³`}/><FRow label="Closing" value={`${order.meterClose||"—"} m³`}/></div></div>}
    </div>
  );
}

// ─── MAIN DETAIL MODAL ─────────────────────────────────────────────
function DepotOrderDetail({open,onClose,order,onUpdate,addToast,isMobile,drivers}) {
  const [tab,setTab]=useState("action");

  // Reset to action tab when order changes
  useEffect(()=>{ if(order) setTab("action"); },[order?.id]);

  if(!order) return null;

  const showDetails=order.status!=="pending";
  const tabs=[
    {k:"action",label:"Actions"},
    showDetails&&{k:"details",label:"Details"},
    {k:"log",label:`Log (${order.activityLog?.length||0})`},
  ].filter(Boolean);

  // Select the right action panel based on status — all are top-level components
  const renderAction=()=>{
    switch(order.status) {
      case "pending":    return <PanelPending    order={order} onUpdate={onUpdate} addToast={addToast} isMobile={isMobile}/>;
      case "confirmed":  return <PanelConfirmed  order={order} onUpdate={onUpdate} addToast={addToast} drivers={drivers} isMobile={isMobile}/>;
      case "scheduled":  return <PanelScheduled  order={order} onUpdate={onUpdate} addToast={addToast}/>;
      case "loading":    return <PanelLoading    order={order} onUpdate={onUpdate} addToast={addToast}/>;
      case "loaded":     return <PanelLoaded     order={order} onUpdate={onUpdate} addToast={addToast} isMobile={isMobile}/>;
      case "dispatched": return <PanelDispatched order={order} onUpdate={onUpdate} addToast={addToast} isMobile={isMobile}/>;
      case "delivered":  return <PanelDelivered  order={order} onUpdate={onUpdate} addToast={addToast}/>;
      case "completed":  return <PanelCompleted  order={order} isMobile={isMobile}/>;
      case "disputed":   return <PanelDisputed   order={order} onUpdate={onUpdate} addToast={addToast}/>;
      default:           return <div style={{color:T.gray400,fontSize:"12px",padding:"20px",textAlign:"center"}}>No actions available for this stage.</div>;
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Order ${order.id}`} isMobile={isMobile} width="600px">
      <OrderTimeline order={order}/>
      {/* Tab bar */}
      <div style={{display:"flex",marginBottom:"16px",borderBottom:`1px solid ${T.gray100}`}}>
        {tabs.map(t=>(
          <Btn key={t.k} hapticPattern={H.soft} onClick={()=>setTab(t.k)}
            style={{background:"none",border:"none",padding:"8px 16px",fontSize:"12px",fontWeight:tab===t.k?800:600,color:tab===t.k?T.black:T.gray400,fontFamily:F,borderBottom:`2px solid ${tab===t.k?T.black:"transparent"}`,borderRadius:0,marginBottom:"-1px"}}>
            {t.label}
          </Btn>
        ))}
      </div>
      {/* Content — rendered directly, no nested components with hooks */}
      {tab==="action"&&renderAction()}
      {tab==="details"&&<PanelDetails order={order}/>}
      {tab==="log"&&<ActivityLog log={order.activityLog}/>}
    </Modal>
  );
}

// ─── PIPELINE VIEW ─────────────────────────────────────────────────
function PipelineView({orders,onSelect}) {
  const activeStages=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered"];
  return (
    <div style={{display:"flex",gap:"10px",overflowX:"auto",paddingBottom:"8px"}}>
      {activeStages.map(stage=>{
        const cfg=STAGE_CFG[stage];
        const stageOrders=orders.filter(o=>o.status===stage);
        return (
          <div key={stage} style={{minWidth:"190px",flex:"0 0 190px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",padding:"6px 10px",background:cfg.bg,border:`1px solid ${cfg.color}20`}}>
              <div style={{fontSize:"10px",fontWeight:800,color:cfg.color,textTransform:"uppercase",letterSpacing:"0.04em"}}>{cfg.short}</div>
              {stageOrders.length>0&&<div style={{background:cfg.color,color:cfg.bg,fontSize:"10px",fontWeight:800,padding:"1px 6px",borderRadius:"10px"}}>{stageOrders.length}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {stageOrders.length===0&&<div style={{border:`1px dashed ${T.gray200}`,padding:"16px",textAlign:"center",color:T.gray200,fontSize:"11px"}}>Empty</div>}
              {stageOrders.map(o=>(
                <MotionCard key={o.id} onClick={()=>onSelect(o)} hapticPattern={H.soft}
                  style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"12px"}}>
                  <div style={{fontSize:"11px",fontWeight:800,color:T.black,marginBottom:"3px"}}>{o.id}</div>
                  <div style={{fontSize:"10px",color:T.gray600,marginBottom:"6px"}}>{o.buyer}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{background:T.gray100,color:T.black,fontSize:"9px",fontWeight:800,padding:"2px 5px"}}>{o.product}</span>
                    <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                  </div>
                  {stage==="pending"&&<div style={{marginTop:"6px",fontSize:"9px",color:T.red,fontWeight:700,background:T.redLight,padding:"2px 5px",display:"inline-block"}}>SLA: {o.slaLeft}</div>}
                  {stage==="loading"&&o.compartments.length>0&&(
                    <div style={{marginTop:"6px"}}>
                      <div style={{height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${o.compartments.filter(c=>c.volume!==null).length/o.compartments.length*100}%`,background:T.purple}}/>
                      </div>
                    </div>
                  )}
                </MotionCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export function DepotOrderMgmt({isMobile,addToast,depotOrders,setDepotOrders,drivers}) {
  const [viewMode,setViewMode]=useState("list");
  const [filterStatus,setFilterStatus]=useState("active");
  const [search,setSearch]=useState("");
  const [selectedOrder,setSelectedOrder]=useState(null);
  const [showDetail,setShowDetail]=useState(false);

  const handleUpdate=(id,patch)=>{
    setDepotOrders(prev=>prev.map(o=>o.id===id?{...o,...patch}:o));
    setSelectedOrder(prev=>prev&&prev.id===id?{...prev,...patch}:prev);
  };

  const handleOpenDetail=(o)=>{ setSelectedOrder(o); setShowDetail(true); };
  const handleCloseDetail=()=>setShowDetail(false);

  const activeStatuses=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered"];
  const filtered=depotOrders.filter(o=>{
    const ms=o.id.toLowerCase().includes(search.toLowerCase())||o.buyer.toLowerCase().includes(search.toLowerCase());
    const mf=filterStatus==="active"?activeStatuses.includes(o.status)
      :filterStatus==="completed"?["completed","rejected"].includes(o.status)
      :filterStatus==="all"?true:o.status===filterStatus;
    return ms&&mf;
  });

  const stats={
    pending:depotOrders.filter(o=>o.status==="pending").length,
    inProgress:depotOrders.filter(o=>["confirmed","scheduled","loading","loaded","dispatched"].includes(o.status)).length,
    delivered:depotOrders.filter(o=>o.status==="delivered").length,
    completed:depotOrders.filter(o=>o.status==="completed").length,
  };

  const handleExport=()=>{
    const headers=["Order ID","Buyer","Product","Vol Ordered","Vol Loaded","Value","Status","Bay","Driver","Truck","Waybill","Submitted","Dispatched","Delivered"];
    const rows=filtered.map(o=>[o.id,o.buyer,o.product,o.vol,o.volLoaded||"",o.value,o.status,o.bay||"",o.driver?.name||"",o.truckPlate||"",o.waybillNo||"",o.submittedAt||"",o.dispatchedAt||"",o.deliveredAt||""]);
    const csv=[headers.join(","),...rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="ventryl-depot-orders.csv";a.click();URL.revokeObjectURL(url);
    addToast("success","Orders exported to CSV");
  };

  const filterBtns=[{v:"active",l:"Active"},{v:"pending",l:"Pending"},{v:"loading",l:"Loading"},{v:"dispatched",l:"In Transit"},{v:"completed",l:"Completed"},{v:"all",l:"All"}];

  return (
    <div>
      <DepotOrderDetail
        open={showDetail&&!!selectedOrder}
        onClose={handleCloseDetail}
        order={selectedOrder}
        onUpdate={handleUpdate}
        addToast={addToast}
        isMobile={isMobile}
        drivers={drivers}
      />

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:"#EBEBEB",border:"1px solid #EBEBEB",marginBottom:"14px"}}>
        {[
          {label:"Pending Review", value:stats.pending,   dot:stats.pending>0, color:"#8A5C00"},
          {label:"In Progress",    value:stats.inProgress,dot:false,           color:"#276EF1"},
          {label:"Awaiting Receipt",value:stats.delivered,dot:false,           color:"#038C48"},
          {label:"Completed MTD",  value:stats.completed, dot:false,           color:"#000000"},
        ].map((s,i)=>(
          <div key={s.label} style={{background:"#FFFFFF",padding:"16px 18px",borderLeft:s.dot?`3px solid ${T.amber}`:"none",animation:`vScaleIn 0.3s ${i*0.07}s both`}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#8C8C8C",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{s.label}</div>
            <div style={{fontSize:"24px",fontWeight:800,color:s.dot?"#8A5C00":"#000000",letterSpacing:"-0.02em"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders…"
            style={{border:`1px solid ${T.gray200}`,padding:"7px 10px 7px 28px",fontSize:"11px",fontFamily:F,outline:"none",width:"150px",color:T.black}}/>
          <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",color:T.gray400,fontSize:"12px"}}>🔍</span>
        </div>
        {filterBtns.map(f=>(
          <Btn key={f.v} hapticPattern={H.soft} onClick={()=>setFilterStatus(f.v)}
            style={{background:filterStatus===f.v?T.black:T.white,color:filterStatus===f.v?T.white:T.gray600,border:`1px solid ${filterStatus===f.v?T.black:T.gray200}`,padding:"6px 12px",borderRadius:"20px",fontSize:"10px",fontWeight:700,fontFamily:F}}>
            {f.l}
          </Btn>
        ))}
        <div style={{display:"flex",gap:"6px",marginLeft:"auto"}}>
          {["list","pipeline"].map(m=>(
            <Btn key={m} hapticPattern={H.soft} onClick={()=>setViewMode(m)}
              style={{background:viewMode===m?T.black:T.white,color:viewMode===m?T.white:T.gray600,border:`1px solid ${viewMode===m?T.black:T.gray200}`,padding:"6px 10px",fontSize:"11px",fontWeight:700,fontFamily:F,textTransform:"capitalize"}}>
              {m==="list"?"≡ List":"⊞ Pipeline"}
            </Btn>
          ))}
          <Btn hapticPattern={H.soft} onClick={handleExport} style={{background:T.white,border:`1px solid ${T.gray200}`,color:T.black,padding:"6px 10px",fontSize:"10px",fontWeight:700,fontFamily:F}}>↓ CSV</Btn>
        </div>
      </div>

      {/* Views */}
      {viewMode==="pipeline"?(
        <PipelineView orders={filtered} onSelect={handleOpenDetail}/>
      ):filtered.length===0?(
        <div style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"48px",textAlign:"center",color:T.gray400,fontSize:"13px"}}>No orders match your filter</div>
      ):isMobile?(
        filtered.map((o,i)=>(
          <div key={o.id} style={{animation:`vFadeUp 0.25s ${i*0.05}s both`}}>
            <MotionCard onClick={()=>handleOpenDetail(o)} hapticPattern={H.soft}
              style={{border:`1px solid ${o.status==="pending"?T.amber:T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div>
                  <div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{o.buyer} · {o.product}</div>
                </div>
                <StatusPill status={o.status}/>
              </div>
              <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:"11px",color:T.gray600,fontWeight:700}}>{(o.vol/1000).toFixed(0)}k L</span>
                <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                {o.bay&&<span style={{fontSize:"10px",color:T.gray400}}>{o.bay}</span>}
                {o.driver&&<span style={{fontSize:"10px",color:T.gray400}}>{o.driver.name.split(" ")[0]}</span>}
              </div>
              <div style={{fontSize:"10px",color:T.blue,marginTop:"6px",fontWeight:700}}>Tap to manage →</div>
            </MotionCard>
          </div>
        ))
      ):(
        <div style={{border:`1px solid ${T.gray100}`,background:T.white}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.gray100}`}}>
              {["Order","Buyer","Product","Volume","Value","Bay","Driver","Status",""].map(h=>(
                <th key={h} style={{padding:"10px 16px",fontFamily:F,fontSize:"10px",fontWeight:700,color:T.gray400,textAlign:"left",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((o,i)=>(
                <tr key={o.id} style={{borderBottom:i<filtered.length-1?`1px solid ${T.gray100}`:"none",animation:`vFadeUp 0.2s ${i*0.05}s both`,cursor:"pointer",transition:"background 0.15s",borderLeft:o.status==="pending"?`3px solid ${T.amber}`:"none"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.gray50}
                  onMouseLeave={e=>e.currentTarget.style.background=T.white}
                  onClick={()=>handleOpenDetail(o)}>
                  <td style={{padding:"13px 16px",fontFamily:F,fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</td>
                  <td style={{padding:"13px 16px"}}>
                    <div style={{fontSize:"12px",fontWeight:700,color:T.black,fontFamily:F}}>{o.buyer}</div>
                    <div style={{fontSize:"10px",color:T.gray400,fontFamily:F}}>{o.buyerLocation}</div>
                  </td>
                  <td style={{padding:"13px 16px"}}><span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{o.product}</span></td>
                  <td style={{padding:"13px 16px"}}>
                    <div style={{fontSize:"12px",fontWeight:700,color:T.black,fontFamily:F}}>{(o.vol/1000).toFixed(0)}k L</div>
                    {o.volLoaded&&<div style={{fontSize:"10px",color:T.gray400,fontFamily:F}}>{(o.volLoaded/1000).toFixed(1)}k loaded</div>}
                  </td>
                  <td style={{padding:"13px 16px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</td>
                  <td style={{padding:"13px 16px",fontFamily:F,fontSize:"12px",color:o.bay?T.black:T.gray200}}>{o.bay||"—"}</td>
                  <td style={{padding:"13px 16px"}}>
                    {o.driver
                      ?<div><div style={{fontSize:"11px",fontWeight:700,color:T.black,fontFamily:F}}>{o.driver.name.split(" ")[0]}</div><div style={{fontSize:"10px",color:T.gray400,fontFamily:F}}>{o.truckPlate||"—"}</div></div>
                      :<span style={{color:T.gray200,fontSize:"12px"}}>—</span>}
                  </td>
                  <td style={{padding:"13px 16px"}}><StatusPill status={o.status}/></td>
                  <td style={{padding:"13px 16px",fontSize:"11px",color:T.blue,fontWeight:700,whiteSpace:"nowrap"}}>Manage →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
