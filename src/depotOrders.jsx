// ═══════════════════════════════════════════════════════════
// DEPOT ORDER MANAGEMENT — Full lifecycle from pending → complete
// ═══════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { haptic, H } from "./motion.js";

const T = {
  black:"#000000",white:"#FFFFFF",green:"#06C167",greenLight:"#E6F9F1",greenDark:"#038C48",
  gray50:"#F6F6F6",gray100:"#EBEBEB",gray200:"#D3D3D3",gray400:"#8C8C8C",gray600:"#545454",gray800:"#282828",
  red:"#E11900",redLight:"#FCEAE8",amber:"#FFC043",amberLight:"#FFF3D9",blue:"#276EF1",blueLight:"#EEF3FE",
  purple:"#8B5CF6",purpleLight:"#F3F0FF",
};
const F = "'Manrope', sans-serif";
const fmt = n => "₦" + Number(n).toLocaleString("en-NG");
const fmtM = n => "₦" + (n/1e6).toFixed(1) + "M";
const now = () => new Date().toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})+" · "+new Date().toLocaleDateString("en-NG",{day:"2-digit",month:"short"});

// ─── ORDER STAGES CONFIG ───────────────────────────────────
export const STAGE_CFG = {
  pending:    {label:"Pending Review",  short:"Pending",   color:T.gray600,  bg:T.gray100,   icon:"⏳"},
  confirmed:  {label:"Confirmed",       short:"Confirmed", color:"#8A5C00",  bg:T.amberLight,icon:"✓"},
  scheduled:  {label:"Loading Scheduled",short:"Scheduled",color:T.blue,    bg:T.blueLight, icon:"📅"},
  loading:    {label:"Loading",         short:"Loading",   color:"#7C3AED",  bg:T.purpleLight,icon:"⛽"},
  loaded:     {label:"Loaded",          short:"Loaded",    color:T.greenDark,bg:T.greenLight, icon:"🔒"},
  dispatched: {label:"In Transit",      short:"Transit",   color:T.blue,     bg:T.blueLight,  icon:"🚛"},
  delivered:  {label:"Delivered",       short:"Delivered", color:T.greenDark,bg:T.greenLight, icon:"📦"},
  completed:  {label:"Completed",       short:"Completed", color:T.greenDark,bg:T.greenLight, icon:"✅"},
  disputed:   {label:"Disputed",        short:"Disputed",  color:T.red,      bg:T.redLight,   icon:"⚠"},
  rejected:   {label:"Rejected",        short:"Rejected",  color:T.red,      bg:T.redLight,   icon:"✕"},
};
const STAGE_ORDER = ["pending","confirmed","scheduled","loading","loaded","dispatched","delivered","completed"];

// ─── INITIAL DATA ──────────────────────────────────────────
export const DEPOT_DRIVERS = [
  {id:"d1",name:"Emeka Nwosu",phone:"+234 803 421 7762",license:"LSDR-2024-0482",available:true},
  {id:"d2",name:"Bayo Adeyemi",phone:"+234 806 334 9910",license:"LSDR-2024-0339",available:true},
  {id:"d3",name:"Chidi Okafor",phone:"+234 805 228 4461",license:"LSDR-2023-1190",available:false},
  {id:"d4",name:"Kunle Fashola",phone:"+234 807 551 0033",license:"LSDR-2024-0771",available:true},
  {id:"d5",name:"Tunde Gbadebo",phone:"+234 802 877 2245",license:"LSDR-2023-0987",available:true},
];

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
    compartments:[{no:1,capacity:33000,product:"PMS",volume:33000},{no:2,capacity:33000,product:"PMS",volume:33000}],
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
      {time:"09:00 · 10 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 2 · 09:00 · Driver: Bayo Adeyemi"},
      {time:"09:08 · 10 Mar",actor:"Depot",action:"Loading started",note:"Truck at bay, pump activated"},
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
      {time:"07:00 · 10 Mar",actor:"Depot",action:"Loading scheduled",note:"Bay 1 · 07:00 · Emeka Nwosu"},
      {time:"07:05 · 10 Mar",actor:"Depot",action:"Loading started",note:"Opening meter: 44100"},
      {time:"08:22 · 10 Mar",actor:"Depot",action:"Loading completed",note:"65,880L loaded · Closing meter: 46296"},
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
      {time:"15:48 · 8 Mar",actor:"Depot",action:"Loading completed",note:"89,820L loaded · Meter: 41094"},
      {time:"16:15 · 8 Mar",actor:"Depot",action:"Truck dispatched",note:"Waybill: WB-2026-00841"},
      {time:"19:42 · 8 Mar",actor:"Buyer",action:"Delivery confirmed",note:"Received 89,820L at Surulere station"},
      {time:"19:50 · 8 Mar",actor:"System",action:"Order completed",note:"Escrow ₦71.7M released to depot"},
    ],
    disputeReason:null,slaLeft:"—",
  },
];

// ─── SHARED MICRO-COMPONENTS ───────────────────────────────
function useRippleLocal() {
  const [ripples, setRipples] = useState([]);
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
  const [ripples,addRipple]=useRippleLocal();
  const [pressed,setPressed]=useState(false);
  const [hovered,setHovered]=useState(false);
  const handleClick=e=>{ if(disabled)return; addRipple(e); haptic(hapticPattern||H.tap); onClick?.(e); };
  return (
    <button {...rest} disabled={disabled} onClick={handleClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setPressed(false);}}
      style={{position:"relative",overflow:"hidden",transform:pressed?"scale(0.96)":hovered?"scale(1.01)":"scale(1)",transition:"transform 0.12s cubic-bezier(0.4,0,0.2,1),background 0.15s,color 0.15s,box-shadow 0.15s",cursor:disabled?"not-allowed":"pointer",...style}}>
      {children}<RippleLayer ripples={ripples} color={rippleColor}/>
    </button>
  );
}
function MotionCard({children,style,onClick,hapticPattern}) {
  const [hovered,setHovered]=useState(false);
  const [pressed,setPressed]=useState(false);
  const [ripples,addRipple]=useRippleLocal();
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
  return <span style={{background:c.bg,color:c.color,fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"4px",display:"inline-flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}><span style={{fontSize:"11px"}}>{c.icon}</span>{c.short||c.label}</span>;
}
function InputField({label,value,onChange,type="text",placeholder,prefix,suffix,hint,rows}) {
  const isTA=rows>0;
  return(
    <div style={{marginBottom:"14px"}}>
      {label&&<div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{label}</div>}
      <div style={{display:"flex",alignItems:isTA?"flex-start":"center",border:`2px solid ${T.gray200}`,transition:"border-color 0.15s"}}
        onFocusCapture={e=>e.currentTarget.style.borderColor=T.black}
        onBlurCapture={e=>e.currentTarget.style.borderColor=T.gray200}>
        {prefix&&<span style={{padding:"10px 12px",fontSize:"12px",fontWeight:700,color:T.gray400,borderRight:`1px solid ${T.gray100}`,whiteSpace:"nowrap",flexShrink:0}}>{prefix}</span>}
        {isTA?(
          <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
            style={{flex:1,border:"none",padding:"11px 12px",fontSize:"13px",fontFamily:F,outline:"none",color:T.black,background:"transparent",resize:"vertical",width:"100%"}}/>
        ):(
          <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
            style={{flex:1,border:"none",padding:"11px 12px",fontSize:"14px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:"transparent",width:"100%"}}/>
        )}
        {suffix&&<span style={{padding:"10px 12px",fontSize:"12px",fontWeight:700,color:T.gray400,borderLeft:`1px solid ${T.gray100}`,whiteSpace:"nowrap",flexShrink:0}}>{suffix}</span>}
      </div>
      {hint&&<div style={{fontSize:"10px",color:T.gray400,marginTop:"4px"}}>{hint}</div>}
    </div>
  );
}
function SelectField({label,value,onChange,options}) {
  return(
    <div style={{marginBottom:"14px"}}>
      {label&&<div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{label}</div>}
      <div style={{position:"relative"}}>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",border:`2px solid ${T.gray200}`,padding:"11px 36px 11px 12px",fontSize:"13px",fontWeight:700,fontFamily:F,outline:"none",color:T.black,background:T.white,appearance:"none",cursor:"pointer"}}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",color:T.gray400,pointerEvents:"none"}}>▾</span>
      </div>
    </div>
  );
}
function Modal({open,onClose,children,title,isMobile,width="560px"}) {
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",animation:"vFadeIn 0.2s ease"}} onClick={onClose}/>
      <div style={{position:"relative",background:T.white,width:isMobile?"100%":width,maxWidth:"100vw",maxHeight:isMobile?"95vh":"90vh",overflowY:"auto",animation:isMobile?"vDrawerUp 0.3s cubic-bezier(0.4,0,0.2,1)":"vModalIn 0.25s ease",zIndex:1,display:"flex",flexDirection:"column"}}>
        {isMobile&&<div style={{width:"36px",height:"4px",background:T.gray200,borderRadius:"2px",margin:"10px auto 0",flexShrink:0}}/>}
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${T.gray100}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{fontSize:"15px",fontWeight:800,color:T.black}}>{title}</div>
          <Btn onClick={onClose} style={{background:"none",border:"none",color:T.gray400,fontSize:"20px",padding:"0 4px",lineHeight:1,fontFamily:F}}>✕</Btn>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

// ─── ORDER TIMELINE ────────────────────────────────────────
function OrderTimeline({order}) {
  const stages=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered","completed"];
  const currentIdx=stages.indexOf(order.status);
  const isRejected=order.status==="rejected";
  const isDisputed=order.status==="disputed";
  return(
    <div style={{marginBottom:"20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"0",overflowX:"auto",paddingBottom:"4px"}}>
        {stages.map((s,i)=>{
          const cfg=STAGE_CFG[s];
          const done=currentIdx>i||(currentIdx===i&&!["pending"].includes(order.status));
          const active=currentIdx===i;
          const future=currentIdx<i;
          return(
            <div key={s} style={{display:"flex",alignItems:"center",flex:i<stages.length-1?"1":"0",minWidth:"fit-content"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",padding:"0 2px"}}>
                <div style={{
                  width:"28px",height:"28px",borderRadius:"50%",flexShrink:0,
                  background:done||active?(isDisputed&&s==="delivered"?T.red:cfg.bg):T.gray100,
                  border:`2px solid ${done||active?(isDisputed&&s==="delivered"?T.red:cfg.color):T.gray200}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"12px",transition:"all 0.3s",
                  transform:active?"scale(1.1)":"scale(1)",
                }}>
                  {done?<span style={{fontSize:"11px",color:cfg.color}}>✓</span>:<span style={{fontSize:"11px",color:future?T.gray200:cfg.color}}>{cfg.icon}</span>}
                </div>
                <div style={{fontSize:"8px",fontWeight:700,color:active?T.black:future?T.gray200:T.gray600,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center",whiteSpace:"nowrap"}}>{cfg.short}</div>
              </div>
              {i<stages.length-1&&(
                <div style={{flex:1,height:"2px",background:done?T.green:T.gray200,margin:"0 2px",marginBottom:"16px",minWidth:"12px",transition:"background 0.4s ease"}}/>
              )}
            </div>
          );
        })}
      </div>
      {(isRejected||isDisputed)&&(
        <div style={{background:T.redLight,border:`1px solid ${T.red}20`,padding:"8px 12px",marginTop:"8px",fontSize:"11px",color:T.red,fontWeight:700}}>
          {isRejected?"✕ Order Rejected":"⚠ Order Disputed — under review"}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY LOG ─────────────────────────────────────────
function ActivityLog({log}) {
  return(
    <div>
      <div style={{fontSize:"11px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>Activity Log</div>
      {[...log].reverse().map((e,i)=>(
        <div key={i} style={{display:"flex",gap:"10px",marginBottom:"10px",animation:`vFadeUp 0.2s ${i*0.04}s both`}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:e.actor==="System"?T.green:e.actor==="Buyer"?T.blue:T.black,flexShrink:0,marginTop:"5px"}}/>
          <div style={{flex:1,paddingBottom:"10px",borderBottom:i<log.length-1?`1px dashed ${T.gray100}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}>
              <span style={{fontSize:"11px",fontWeight:800,color:T.black}}>{e.action}</span>
              <span style={{fontSize:"10px",color:T.gray400}}>{e.time}</span>
            </div>
            {e.note&&<div style={{fontSize:"11px",color:T.gray600}}>{e.note}</div>}
            <div style={{fontSize:"10px",color:T.gray400,marginTop:"1px"}}>{e.actor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WAYBILL MODAL ─────────────────────────────────────────
function WaybillModal({open,onClose,order,isMobile}) {
  if(!order)return null;
  const waybillNo = order.waybillNo || `WB-2026-${order.id.split("-")[1]}`;
  const totalLoaded = order.compartments.reduce((a,c)=>a+(c.volume||0),0);
  return(
    <Modal open={open} onClose={onClose} title={`Waybill ${waybillNo}`} isMobile={isMobile} width="540px">
      <div style={{border:"2px solid",borderColor:T.black,padding:"24px",fontFamily:"'Courier New',monospace",fontSize:"12px",background:T.white}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",paddingBottom:"16px",borderBottom:`2px solid ${T.black}`}}>
          <div>
            <div style={{fontSize:"22px",fontWeight:800,fontFamily:F,letterSpacing:"-0.02em"}}>VENTRYL</div>
            <div style={{fontSize:"10px",color:T.gray600,fontFamily:F}}>B2B PETROLEUM MARKETPLACE</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"14px",fontWeight:800}}>WAYBILL</div>
            <div style={{fontSize:"18px",fontWeight:800,fontFamily:F}}>{waybillNo}</div>
            <div style={{fontSize:"10px",color:T.gray600}}>NMDPRA Compliant</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
          <div>
            <div style={{fontWeight:700,marginBottom:"6px",textTransform:"uppercase",fontSize:"10px"}}>FROM (DEPOT)</div>
            <div style={{fontWeight:700}}>Nepal Energies</div>
            <div>Apapa, Lagos</div>
            <div>NMDPRA: MDP/D/0042</div>
          </div>
          <div>
            <div style={{fontWeight:700,marginBottom:"6px",textTransform:"uppercase",fontSize:"10px"}}>TO (BUYER)</div>
            <div style={{fontWeight:700}}>{order.buyer}</div>
            <div>{order.buyerLocation}</div>
            <div>Tel: {order.buyerContact}</div>
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <div style={{fontWeight:700,marginBottom:"8px",textTransform:"uppercase",fontSize:"10px"}}>Transport Details</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {[["Driver",order.driver?.name||"—"],["Truck Plate",order.truckPlate||"—"],["Departure",order.dispatchedAt?.split(" ")[1]||"—"],["Product",order.product]].map(([k,v])=>(
              <div key={k} style={{background:T.gray50,padding:"8px 10px"}}>
                <div style={{fontSize:"9px",textTransform:"uppercase",color:T.gray400,marginBottom:"2px"}}>{k}</div>
                <div style={{fontWeight:700,fontFamily:F}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"16px"}}>
          <thead>
            <tr style={{background:T.black,color:T.white}}>
              {["Compt.","Product","Capacity (L)","Loaded (L)"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:"10px",fontFamily:F,textTransform:"uppercase"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {order.compartments.map((c,i)=>(
              <tr key={i} style={{background:i%2===0?T.white:T.gray50}}>
                <td style={{padding:"6px 10px",fontFamily:F,fontWeight:700}}>{c.no}</td>
                <td style={{padding:"6px 10px",fontFamily:F}}>{c.product}</td>
                <td style={{padding:"6px 10px",fontFamily:F}}>{c.capacity.toLocaleString()}</td>
                <td style={{padding:"6px 10px",fontFamily:F,fontWeight:700}}>{(c.volume||0).toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{background:T.gray100,fontWeight:700}}>
              <td colSpan={3} style={{padding:"8px 10px",fontFamily:F,textAlign:"right"}}>TOTAL LOADED</td>
              <td style={{padding:"8px 10px",fontFamily:F,fontWeight:800}}>{totalLoaded.toLocaleString()} L</td>
            </tr>
          </tbody>
        </table>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"10px",textTransform:"uppercase",color:T.gray400,marginBottom:"4px"}}>Seal Numbers</div>
            <div style={{fontWeight:700,fontFamily:F}}>{order.sealNos||"—"}</div>
          </div>
          <div>
            <div style={{fontSize:"10px",textTransform:"uppercase",color:T.gray400,marginBottom:"4px"}}>Meter Readings</div>
            <div style={{fontFamily:F}}>Opening: {order.meterOpen||"—"}</div>
            <div style={{fontFamily:F}}>Closing: {order.meterClose||"—"}</div>
          </div>
        </div>
        <div style={{borderTop:`2px solid ${T.black}`,paddingTop:"14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px",textAlign:"center"}}>
          {["Depot Officer","Truck Driver","Buyer Representative"].map(r=>(
            <div key={r}>
              <div style={{height:"30px",borderBottom:`1px solid ${T.black}`,marginBottom:"4px"}}/>
              <div style={{fontSize:"9px",textTransform:"uppercase",color:T.gray400}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
        <Btn hapticPattern={H.tap} onClick={()=>{ window.print(); }} style={{flex:1,background:T.black,color:T.white,border:"none",padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F}}>🖨 Print Waybill</Btn>
        <Btn hapticPattern={H.soft} onClick={onClose} style={{flex:1,background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F}}>Close</Btn>
      </div>
    </Modal>
  );
}

// ─── ORDER DETAIL MODAL ───────────────────────────────────
function DepotOrderDetail({open,onClose,order,onUpdate,addToast,isMobile,drivers}) {
  const [tab,setTab]=useState("action");
  const [loading,setLoading]=useState("");
  const [showWaybill,setShowWaybill]=useState(false);
  const [rejectReason,setRejectReason]=useState("");
  const [disputeResponse,setDisputeResponse]=useState("");

  // Scheduling fields
  const [bay,setBay]=useState(order?.bay||"Bay 1");
  const [slot,setSlot]=useState(order?.loadingSlot||"09:00");
  const [driverId,setDriverId]=useState(order?.driver?.id||"");
  const [truckPlate,setTruckPlate]=useState(order?.truckPlate||"");

  // Loading fields
  const [compartments,setCompartments]=useState(order?.compartments||[]);
  const [meterOpen,setMeterOpen]=useState(order?.meterOpen||"");
  const [meterClose,setMeterClose]=useState(order?.meterClose||"");
  const [sealNos,setSealNos]=useState(order?.sealNos||"");
  const [notes,setNotes]=useState(order?.notes||"");

  if(!order)return null;

  // Sync state when order changes
  const syncFields=useCallback(()=>{
    setBay(order.bay||"Bay 1");setSlot(order.loadingSlot||"09:00");
    setDriverId(order.driver?.id||"");setTruckPlate(order.truckPlate||"");
    setCompartments(order.compartments||[]);setMeterOpen(order.meterOpen||"");
    setMeterClose(order.meterClose||"");setSealNos(order.sealNos||"");setNotes(order.notes||"");
    setTab("action");setLoading("");
  },[order]);

  const act=(action, newData, successMsg, delay=900)=>{
    setLoading(action);haptic(H.confirm);
    setTimeout(()=>{
      const logEntry={time:now(),actor:"Depot",action:successMsg.split("·")[0].trim(),note:successMsg.split("·")[1]?.trim()||""};
      onUpdate(order.id,{...newData,activityLog:[...(order.activityLog||[]),logEntry]});
      setLoading("");
      addToast("success",successMsg);
    },delay);
  };

  // ── Action panels per stage ──
  const ActionPanel=()=>{
    if(order.status==="pending") return(
      <div>
        <div style={{background:T.amberLight,border:`1px solid ${T.amber}30`,padding:"12px 14px",marginBottom:"16px",fontSize:"12px",color:"#8A5C00",fontWeight:600,lineHeight:1.5}}>
          ⏱ SLA expires in <strong>{order.slaLeft}</strong>. Confirm or reject within 2 hours of receipt.
        </div>
        <div style={{background:T.gray50,padding:"14px",marginBottom:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[["Buyer",order.buyer],["Type",order.buyerType],["Product",order.product],["Volume",`${(order.vol/1000).toFixed(0)},000 L`],["Trucks Required",order.trucks],["Value",fmt(order.value)],["Location",order.buyerLocation],["Contact",order.buyerContact]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div><div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{v}</div></div>
          ))}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <Btn hapticPattern={H.warning} onClick={()=>{ const r=prompt("Reason for rejection:"); if(!r)return; act("reject",{status:"rejected"},"Order rejected · Buyer notified"); }} style={{flex:1,background:T.white,color:T.red,border:`1px solid ${T.red}`,padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>✕ Reject</Btn>
          <Btn hapticPattern={H.confirm} disabled={loading==="confirm"} onClick={()=>act("confirm",{status:"confirmed",confirmedAt:now()},"Order confirmed · Schedule loading next")} style={{flex:2,background:T.green,color:T.white,border:"none",padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>{loading==="confirm"?"Confirming…":"✓ Confirm Order"}</Btn>
        </div>
      </div>
    );

    if(order.status==="confirmed") return(
      <div>
        <div style={{background:T.blueLight,padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:T.blue,fontWeight:600}}>📅 Schedule a loading bay, time slot, and assign a driver.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <SelectField label="Loading Bay" value={bay} onChange={setBay} options={[{value:"Bay 1",label:"Bay 1"},{value:"Bay 2",label:"Bay 2"}]}/>
          <SelectField label="Loading Time Slot" value={slot} onChange={setSlot} options={["07:00","09:00","11:00","13:00","15:00","17:00"].map(t=>({value:t,label:t}))}/>
        </div>
        <SelectField label="Assign Driver" value={driverId} onChange={setDriverId}
          options={[{value:"",label:"— Select driver —"},...drivers.map(d=>({value:d.id,label:`${d.name}${d.available?"":" (unavailable)"}`}))]}/>
        <InputField label="Truck / Tanker Plate" value={truckPlate} onChange={setTruckPlate} placeholder="e.g. LSD-481-KJ"/>
        <div style={{marginBottom:"16px"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>Compartment Plan ({order.trucks} trucks)</div>
          {Array.from({length:order.trucks*2},(_,i)=>i+1).map(n=>{
            const c=compartments.find(x=>x.no===n)||{no:n,capacity:33000,product:order.product,volume:33000};
            return(
              <div key={n} style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr",gap:"6px",marginBottom:"6px",alignItems:"center"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:T.gray600,textAlign:"center"}}>C{n}</div>
                <SelectField label="" value={c.product} onChange={v=>setCompartments(prev=>{const u=[...prev.filter(x=>x.no!==n),{...c,product:v}];return u;})} options={[{value:"PMS",label:"PMS"},{value:"AGO",label:"AGO"},{value:"DPK",label:"DPK"}]}/>
                <InputField label="" value={c.capacity} onChange={v=>setCompartments(prev=>[...prev.filter(x=>x.no!==n),{...c,capacity:Number(v)}])} type="number" suffix="L"/>
              </div>
            );
          })}
        </div>
        <InputField label="Notes (optional)" value={notes} onChange={setNotes} rows={2} placeholder="Any special loading instructions…"/>
        <Btn hapticPattern={H.double} disabled={!driverId||!truckPlate||loading==="schedule"}
          onClick={()=>{
            const d=drivers.find(x=>x.id===driverId);
            if(!d){addToast("warning","Select a driver");return;}
            const comps=Array.from({length:order.trucks*2},(_,i)=>({no:i+1,capacity:33000,product:order.product,volume:null}));
            act("schedule",{status:"scheduled",scheduledAt:now(),bay,loadingSlot:slot,driver:d,truckPlate,compartments:comps.length?comps:compartments,notes},`Loading scheduled · ${bay} at ${slot} · Driver: ${d.name}`);
          }}
          style={{width:"100%",background:!driverId||!truckPlate?T.gray200:T.black,color:!driverId||!truckPlate?T.gray400:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          {loading==="schedule"?"Scheduling…":"📅 Schedule Loading"}
        </Btn>
      </div>
    );

    if(order.status==="scheduled") return(
      <div>
        <div style={{background:T.gray50,padding:"14px",marginBottom:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[["Loading Bay",order.bay],["Time Slot",order.loadingSlot],["Driver",order.driver?.name],["Truck",order.truckPlate],["Compartments",order.compartments.length],["Scheduled At",order.scheduledAt||"—"]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div><div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{v||"—"}</div></div>
          ))}
        </div>
        <InputField label="Opening Meter Reading" value={meterOpen} onChange={setMeterOpen} type="number" placeholder="e.g. 44100" suffix="m³"/>
        <Btn hapticPattern={H.confirm} disabled={loading==="start"}
          onClick={()=>act("start",{status:"loading",loadingStartAt:now(),meterOpen},"Loading started · Pump activated · Track compartments below")}
          style={{width:"100%",background:T.purple||"#7C3AED",color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          {loading==="start"?"Starting…":"⛽ Start Loading"}
        </Btn>
      </div>
    );

    if(order.status==="loading") return(
      <div>
        <div style={{background:"#F5F0FF",border:"1px solid #7C3AED20",padding:"10px 14px",marginBottom:"14px",fontSize:"12px",color:"#7C3AED",fontWeight:600}}>
          ⛽ Loading in progress since {order.loadingStartAt}
        </div>
        <div style={{marginBottom:"16px"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>Compartment Loading Record</div>
          {compartments.map((c,i)=>(
            <div key={c.no} style={{display:"grid",gridTemplateColumns:"40px 1fr 120px",gap:"8px",alignItems:"center",marginBottom:"8px",padding:"10px 12px",background:T.gray50,border:`1px solid ${T.gray100}`}}>
              <div style={{fontSize:"12px",fontWeight:800,color:T.black,textAlign:"center"}}>C{c.no}</div>
              <div>
                <div style={{fontSize:"11px",fontWeight:700,color:T.black}}>{c.product} · Capacity: {c.capacity.toLocaleString()}L</div>
                <div style={{height:"4px",background:T.gray200,borderRadius:"2px",marginTop:"4px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${c.volume?(c.volume/c.capacity*100):0}%`,background:"#7C3AED",borderRadius:"2px",transition:"width 0.3s"}}/>
                </div>
              </div>
              <InputField label="" value={c.volume===null?"":c.volume} onChange={v=>{const n=Number(v);setCompartments(prev=>prev.map((x,j)=>j===i?{...x,volume:n}:x));}} type="number" placeholder="0" suffix="L"/>
            </div>
          ))}
          <div style={{padding:"10px 12px",background:T.black,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:"12px",fontWeight:700,color:T.gray400}}>Total Loaded</span>
            <span style={{fontSize:"14px",fontWeight:800,color:T.green}}>{compartments.reduce((a,c)=>a+(c.volume||0),0).toLocaleString()} L <span style={{color:T.gray400,fontSize:"11px"}}>/ {order.vol.toLocaleString()} L</span></span>
          </div>
        </div>
        <InputField label="Closing Meter Reading" value={meterClose} onChange={setMeterClose} type="number" placeholder="e.g. 46296" suffix="m³"/>
        <InputField label="Seal Numbers" value={sealNos} onChange={setSealNos} placeholder="e.g. SL-4482, SL-4483"/>
        <Btn hapticPattern={H.double}
          disabled={loading==="complete"||compartments.some(c=>c.volume===null||c.volume===undefined)}
          onClick={()=>{
            const totalL=compartments.reduce((a,c)=>a+(c.volume||0),0);
            act("complete",{status:"loaded",loadingEndAt:now(),compartments,meterClose,sealNos,volLoaded:totalL},`Loading completed · ${totalL.toLocaleString()}L loaded · Meter: ${meterClose}`);
          }}
          style={{width:"100%",background:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          {loading==="complete"?"Completing…":"🔒 Complete Loading"}
        </Btn>
      </div>
    );

    if(order.status==="loaded") {
      const waybillNo=`WB-2026-${order.id.split("-")[1]}`;
      const totalLoaded=order.compartments.reduce((a,c)=>a+(c.volume||0),0);
      return(
        <div>
          <div style={{background:T.greenLight,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.greenDark,fontWeight:600}}>
            ✓ Loading complete · {totalLoaded.toLocaleString()}L loaded · Waybill ready
          </div>
          <div style={{border:`1px solid ${T.gray100}`,padding:"14px 16px",marginBottom:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {[["Volume Loaded",`${totalLoaded.toLocaleString()} L`],["Ordered",`${order.vol.toLocaleString()} L`],["Variance",`${((order.vol-totalLoaded)/1000).toFixed(1)}k L`],["Seals",order.sealNos||"—"],["Meter Open",order.meterOpen||"—"],["Meter Close",order.meterClose||"—"]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div><div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{v}</div></div>
            ))}
          </div>
          <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)} style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"13px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>📄 Review Waybill ({waybillNo})</Btn>
          <Btn hapticPattern={H.double} disabled={loading==="dispatch"}
            onClick={()=>act("dispatch",{status:"dispatched",dispatchedAt:now(),waybillNo},`Truck dispatched · Waybill: ${waybillNo} · ETA ~3–4 hours`)}
            style={{width:"100%",background:T.black,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
            {loading==="dispatch"?"Dispatching…":"🚛 Dispatch Truck"}
          </Btn>
          <WaybillModal open={showWaybill} onClose={()=>setShowWaybill(false)} order={{...order,waybillNo}} isMobile={isMobile}/>
        </div>
      );
    }

    if(order.status==="dispatched") return(
      <div>
        <div style={{background:T.blueLight,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.blue,fontWeight:600}}>
          🚛 In transit since {order.dispatchedAt}
        </div>
        <div style={{border:`1px solid ${T.gray100}`,padding:"14px 16px",marginBottom:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          {[["Driver",order.driver?.name||"—"],["Phone",order.driver?.phone||"—"],["Truck",order.truckPlate||"—"],["Waybill",order.waybillNo||"—"],["Departed",order.dispatchedAt||"—"],["Destination",order.buyerLocation]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div>
            <div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{v}</div></div>
          ))}
        </div>
        <Btn hapticPattern={H.tap} onClick={()=>{if(order.driver?.phone){window.open(`tel:${order.driver.phone}`);}else{addToast("info","No driver phone on record");}}}
          style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>
          📞 Call Driver — {order.driver?.name}
        </Btn>
        <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)}
          style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,marginBottom:"10px",minHeight:"44px"}}>
          📄 View Waybill
        </Btn>
        <Btn hapticPattern={H.confirm} disabled={loading==="deliver"}
          onClick={()=>act("deliver",{status:"delivered",deliveredAt:now()},"Delivery confirmed · Awaiting buyer receipt")}
          style={{width:"100%",background:T.green,color:T.white,border:"none",padding:"13px",fontSize:"13px",fontWeight:800,fontFamily:F,minHeight:"48px"}}>
          {loading==="deliver"?"Marking…":"📦 Mark Delivered (Depot Override)"}
        </Btn>
        <div style={{fontSize:"10px",color:T.gray400,textAlign:"center",marginTop:"6px"}}>Use if buyer has not confirmed after arrival</div>
        <WaybillModal open={showWaybill} onClose={()=>setShowWaybill(false)} order={order} isMobile={isMobile}/>
      </div>
    );

    if(order.status==="delivered") return(
      <div>
        <div style={{background:T.greenLight,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.greenDark,fontWeight:600}}>
          📦 Delivered at {order.deliveredAt} · Awaiting escrow release from buyer
        </div>
        <div style={{border:`1px solid ${T.gray100}`,padding:"14px 16px",marginBottom:"14px"}}>
          {[["Volume Delivered",`${(order.volLoaded||order.vol).toLocaleString()} L`],["Waybill",order.waybillNo||"—"],["Value (Escrow)",fmt(order.value)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.gray100}`,fontSize:"13px"}}>
              <span style={{color:T.gray400,fontWeight:600}}>{k}</span><span style={{fontWeight:800,color:T.black}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:T.amberLight,padding:"10px 14px",marginBottom:"14px",fontSize:"11px",color:"#8A5C00",fontWeight:600}}>
          💡 Escrow of {fmt(order.value)} will be released automatically once buyer confirms receipt.
        </div>
        <Btn hapticPattern={H.tap} onClick={()=>act("complete",{status:"completed",completedAt:now()},"Order completed · Revenue of "+fmt(order.value)+" released")}
          style={{width:"100%",background:T.black,color:T.white,border:"none",padding:"12px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"44px"}}>
          ✅ Force Complete & Release Escrow
        </Btn>
        <div style={{fontSize:"10px",color:T.gray400,textAlign:"center",marginTop:"6px"}}>If buyer is unresponsive after 24 hours</div>
      </div>
    );

    if(order.status==="completed") return(
      <div>
        <div style={{background:T.greenLight,padding:"16px",marginBottom:"14px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"6px",animation:"vCheckPop 0.5s ease"}}>✅</div>
          <div style={{fontSize:"15px",fontWeight:800,color:T.greenDark}}>Order Completed</div>
          <div style={{fontSize:"12px",color:T.greenDark,marginTop:"4px"}}>{fmt(order.value)} released to revenue</div>
        </div>
        <div style={{border:`1px solid ${T.gray100}`,padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
          {[["Volume",`${(order.volLoaded||order.vol).toLocaleString()} L`],["Revenue",fmt(order.value)],["Loading Bay",order.bay||"—"],["Driver",order.driver?.name||"—"],["Dispatched",order.dispatchedAt||"—"],["Completed",order.completedAt||"—"]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div><div style={{fontSize:"13px",fontWeight:700,color:T.black}}>{v}</div></div>
          ))}
        </div>
        <Btn hapticPattern={H.tap} onClick={()=>setShowWaybill(true)} style={{width:"100%",background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F,minHeight:"40px"}}>📄 View Completed Waybill</Btn>
        <WaybillModal open={showWaybill} onClose={()=>setShowWaybill(false)} order={order} isMobile={isMobile}/>
      </div>
    );

    if(order.status==="disputed") return(
      <div>
        <div style={{background:T.redLight,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.red,fontWeight:600}}>
          ⚠ Dispute raised by buyer · Escrow held
        </div>
        {order.disputeReason&&<div style={{border:`1px solid ${T.red}30`,padding:"12px 14px",marginBottom:"14px",fontSize:"12px",color:T.gray800}}>
          <div style={{fontSize:"10px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"4px"}}>Buyer's Complaint</div>
          {order.disputeReason}
        </div>}
        <InputField label="Your response" value={disputeResponse} onChange={setDisputeResponse} rows={3} placeholder="Describe your position, attach evidence…"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <Btn hapticPattern={H.tap} onClick={()=>{ addToast("info","Dispute escalated to Ventryl support team. Response in 2 hours."); }}
            style={{background:T.white,color:T.black,border:`1px solid ${T.gray200}`,padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>
            Escalate to Ventryl
          </Btn>
          <Btn hapticPattern={H.confirm} disabled={!disputeResponse.trim()}
            onClick={()=>act("resolve",{status:"completed",completedAt:now(),disputeReason:null},"Dispute resolved · Order completed · Escrow released")}
            style={{background:T.black,color:T.white,border:"none",padding:"11px",fontSize:"12px",fontWeight:800,fontFamily:F}}>
            Resolve & Close
          </Btn>
        </div>
      </div>
    );

    return <div style={{color:T.gray400,fontSize:"12px",padding:"20px",textAlign:"center"}}>No actions available for this stage.</div>;
  };

  return(
    <>
      <Modal open={open} onClose={onClose} title={`Order ${order.id}`} isMobile={isMobile} width="600px">
        <OrderTimeline order={order}/>
        <div style={{display:"flex",gap:"0",marginBottom:"16px",borderBottom:`1px solid ${T.gray100}`}}>
          {[{k:"action",label:"Actions"},order.status!=="pending"&&{k:"details",label:"Details"},{k:"log",label:`Log (${order.activityLog?.length||0})`}].filter(Boolean).map(t=>(
            <Btn key={t.k} hapticPattern={H.soft} onClick={()=>setTab(t.k)}
              style={{background:"none",border:"none",padding:"8px 16px",fontSize:"12px",fontWeight:tab===t.k?800:600,color:tab===t.k?T.black:T.gray400,fontFamily:F,borderBottom:`2px solid ${tab===t.k?T.black:"transparent"}`,borderRadius:0,marginBottom:"-1px"}}>
              {t.label}
            </Btn>
          ))}
        </div>
        {tab==="action"&&<ActionPanel/>}
        {tab==="details"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              {[["Order ID",order.id],["Buyer",order.buyer],["Type",order.buyerType],["Location",order.buyerLocation],["Contact",order.buyerContact],["Product",order.product],["Volume Ordered",`${order.vol.toLocaleString()} L`],["Volume Loaded",order.volLoaded?`${order.volLoaded.toLocaleString()} L`:"—"],["Value",fmt(order.value)],["Trucks",order.trucks],["Bay",order.bay||"—"],["Driver",order.driver?.name||"—"],["Truck",order.truckPlate||"—"],["Waybill",order.waybillNo||"—"],["Submitted",order.submittedAt||"—"],["Confirmed",order.confirmedAt||"—"],["Dispatched",order.dispatchedAt||"—"],["Delivered",order.deliveredAt||"—"]].map(([k,v])=>(
                <div key={k} style={{background:T.gray50,padding:"8px 10px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:T.gray400,textTransform:"uppercase",marginBottom:"1px"}}>{k}</div>
                  <div style={{fontSize:"12px",fontWeight:700,color:T.black}}>{v}</div>
                </div>
              ))}
            </div>
            {order.notes&&<div style={{background:T.amberLight,padding:"10px 14px",fontSize:"12px",color:"#8A5C00",fontWeight:600}}>Notes: {order.notes}</div>}
          </div>
        )}
        {tab==="log"&&<ActivityLog log={order.activityLog||[]}/>}
      </Modal>
    </>
  );
}

// ─── PIPELINE VIEW (Kanban-style) ─────────────────────────
function PipelineView({orders,onSelect}) {
  const activeStages=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered"];
  return(
    <div style={{display:"flex",gap:"10px",overflowX:"auto",paddingBottom:"8px"}}>
      {activeStages.map(stage=>{
        const stageOrders=orders.filter(o=>o.status===stage);
        const cfg=STAGE_CFG[stage];
        return(
          <div key={stage} style={{minWidth:"200px",flex:"0 0 200px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",padding:"6px 10px",background:cfg.bg,border:`1px solid ${cfg.color}20`}}>
              <div style={{fontSize:"11px",fontWeight:800,color:cfg.color,textTransform:"uppercase",letterSpacing:"0.04em"}}>{cfg.short}</div>
              {stageOrders.length>0&&<div style={{background:cfg.color,color:cfg.bg,fontSize:"10px",fontWeight:800,padding:"1px 6px",borderRadius:"10px",minWidth:"18px",textAlign:"center"}}>{stageOrders.length}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {stageOrders.length===0&&(
                <div style={{border:`1px dashed ${T.gray200}`,padding:"16px",textAlign:"center",color:T.gray200,fontSize:"11px"}}>Empty</div>
              )}
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
                  {stage==="loading"&&(
                    <div style={{marginTop:"6px"}}>
                      <div style={{height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${o.compartments.reduce((a,c)=>a+(c.volume?1:0),0)/o.compartments.length*100}%`,background:"#7C3AED"}}/>
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

// ─── MAIN DEPOT ORDERS COMPONENT ─────────────────────────
export function DepotOrderMgmt({isMobile,addToast,depotOrders,setDepotOrders,drivers}) {
  const [viewMode,setViewMode]=useState("list");  // list | pipeline
  const [filterStatus,setFilterStatus]=useState("active");
  const [search,setSearch]=useState("");
  const [selectedOrder,setSelectedOrder]=useState(null);
  const [showDetail,setShowDetail]=useState(false);

  const handleUpdate=(id,patch)=>{
    setDepotOrders(prev=>prev.map(o=>o.id===id?{...o,...patch}:o));
    setSelectedOrder(prev=>prev&&prev.id===id?{...prev,...patch}:prev);
  };

  const activeStatuses=["pending","confirmed","scheduled","loading","loaded","dispatched","delivered"];
  const filtered=depotOrders.filter(o=>{
    const matchSearch=o.id.toLowerCase().includes(search.toLowerCase())||o.buyer.toLowerCase().includes(search.toLowerCase());
    const matchStatus=filterStatus==="active"?activeStatuses.includes(o.status):filterStatus==="completed"?["completed","rejected"].includes(o.status):filterStatus==="all"?true:o.status===filterStatus;
    return matchSearch&&matchStatus;
  });

  const stats={
    pending:depotOrders.filter(o=>o.status==="pending").length,
    inProgress:depotOrders.filter(o=>["confirmed","scheduled","loading","loaded","dispatched"].includes(o.status)).length,
    delivered:depotOrders.filter(o=>o.status==="delivered").length,
    completed:depotOrders.filter(o=>o.status==="completed").length,
  };

  const handleExport=()=>{
    const rows=filtered.map(o=>[o.id,o.buyer,o.product,o.vol,o.volLoaded||"",o.value,o.status,o.bay||"",o.driver?.name||"",o.truckPlate||"",o.waybillNo||"",o.submittedAt||"",o.dispatchedAt||"",o.deliveredAt||""]);
    const headers=["Order ID","Buyer","Product","Vol Ordered","Vol Loaded","Value","Status","Bay","Driver","Truck","Waybill","Submitted","Dispatched","Delivered"];
    const csv=[headers.join(","),...rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="ventryl-depot-orders.csv";a.click();URL.revokeObjectURL(url);
    addToast("success","Orders exported to CSV");
  };

  return(
    <div>
      <DepotOrderDetail
        open={showDetail&&!!selectedOrder}
        onClose={()=>setShowDetail(false)}
        order={selectedOrder}
        onUpdate={handleUpdate}
        addToast={addToast}
        isMobile={isMobile}
        drivers={drivers}
      />

      {/* Stats strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:"#EBEBEB",border:"1px solid #EBEBEB",marginBottom:"14px"}}>
        {[
          {label:"Pending Review",value:stats.pending,color:T.amber,bg:T.amberLight,dot:stats.pending>0},
          {label:"In Progress",value:stats.inProgress,color:T.blue,bg:T.blueLight},
          {label:"Awaiting Receipt",value:stats.delivered,color:T.greenDark,bg:T.greenLight},
          {label:"Completed MTD",value:stats.completed,color:T.black,bg:"#F6F6F6"},
        ].map((s,i)=>(
          <div key={s.label} style={{background:T.white,padding:"16px 18px",borderLeft:s.dot?`3px solid ${T.amber}`:"none",animation:`vScaleIn 0.3s ${i*0.07}s both`}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#8C8C8C",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"6px"}}>{s.label}</div>
            <div style={{fontSize:"24px",fontWeight:800,color:s.dot?"#8A5C00":T.black,letterSpacing:"-0.02em"}}>{s.value}</div>
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
        {[{v:"active",l:"Active"},{v:"pending",l:"Pending"},{v:"loading",l:"Loading"},{v:"dispatched",l:"In Transit"},{v:"completed",l:"Completed"},{v:"all",l:"All"}].map(f=>(
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

      {viewMode==="pipeline"?(
        <PipelineView orders={filtered} onSelect={o=>{setSelectedOrder(o);setShowDetail(true);}}/>
      ):(
        filtered.length===0?(
          <div style={{border:`1px solid ${T.gray100}`,background:T.white,padding:"48px",textAlign:"center",color:T.gray400,fontSize:"13px"}}>No orders match your filter</div>
        ):(
          isMobile?(
            <div>
              {filtered.map((o,i)=>(
                <div key={o.id} style={{animation:`vFadeUp 0.25s ${i*0.05}s both`}}>
                  <MotionCard onClick={()=>{setSelectedOrder(o);setShowDetail(true);}} hapticPattern={H.soft}
                    style={{border:`1px solid ${o.status==="pending"?T.amber:T.gray100}`,background:T.white,padding:"14px 16px",marginBottom:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                      <div>
                        <div style={{fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</div>
                        <div style={{fontSize:"11px",color:T.gray400,marginTop:"1px"}}>{o.buyer} · {o.product}</div>
                      </div>
                      <StatusPill status={o.status}/>
                    </div>
                    <div style={{display:"flex",gap:"14px",alignItems:"center"}}>
                      <span style={{fontSize:"11px",color:T.gray600,fontWeight:700}}>{(o.vol/1000).toFixed(0)}k L</span>
                      <span style={{fontSize:"12px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</span>
                      {o.bay&&<span style={{fontSize:"10px",color:T.gray400}}>{o.bay}</span>}
                      {o.driver&&<span style={{fontSize:"10px",color:T.gray400}}>{o.driver.name.split(" ")[0]}</span>}
                    </div>
                    {o.status==="loading"&&(
                      <div style={{marginTop:"8px"}}>
                        <div style={{height:"3px",background:T.gray100,borderRadius:"2px",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${o.compartments.filter(c=>c.volume).length/o.compartments.length*100}%`,background:"#7C3AED",animation:"vProgressFill 1s ease both"}}/>
                        </div>
                        <div style={{fontSize:"9px",color:"#7C3AED",marginTop:"2px",fontWeight:700}}>Loading {o.compartments.filter(c=>c.volume).length}/{o.compartments.length} compartments</div>
                      </div>
                    )}
                    <div style={{fontSize:"10px",color:T.blue,marginTop:"6px",fontWeight:700}}>Tap to manage →</div>
                  </MotionCard>
                </div>
              ))}
            </div>
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
                      onClick={()=>{ setSelectedOrder(o); setShowDetail(true); }}>
                      <td style={{padding:"13px 16px",fontFamily:F,fontSize:"12px",fontWeight:800,color:T.black}}>{o.id}</td>
                      <td style={{padding:"13px 16px"}}>
                        <div style={{fontSize:"12px",fontWeight:700,color:T.black}}>{o.buyer}</div>
                        <div style={{fontSize:"10px",color:T.gray400}}>{o.buyerLocation}</div>
                      </td>
                      <td style={{padding:"13px 16px"}}><span style={{background:T.gray100,color:T.black,fontSize:"10px",fontWeight:800,padding:"3px 7px"}}>{o.product}</span></td>
                      <td style={{padding:"13px 16px"}}>
                        <div style={{fontSize:"12px",fontWeight:700,color:T.black}}>{(o.vol/1000).toFixed(0)}k L</div>
                        {o.volLoaded&&<div style={{fontSize:"10px",color:T.gray400}}>{(o.volLoaded/1000).toFixed(1)}k loaded</div>}
                      </td>
                      <td style={{padding:"13px 16px",fontFamily:F,fontSize:"13px",fontWeight:800,color:T.black}}>{fmtM(o.value)}</td>
                      <td style={{padding:"13px 16px",fontFamily:F,fontSize:"12px",color:o.bay?T.black:T.gray200}}>{o.bay||"—"}</td>
                      <td style={{padding:"13px 16px"}}>
                        {o.driver?<div><div style={{fontSize:"11px",fontWeight:700,color:T.black}}>{o.driver.name.split(" ")[0]}</div><div style={{fontSize:"10px",color:T.gray400}}>{o.truckPlate||"—"}</div></div>:<span style={{color:T.gray200,fontSize:"12px"}}>—</span>}
                      </td>
                      <td style={{padding:"13px 16px"}}><StatusPill status={o.status}/></td>
                      <td style={{padding:"13px 16px",fontSize:"11px",color:T.blue,fontWeight:700,whiteSpace:"nowrap"}}>Manage →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )
      )}
    </div>
  );
}
