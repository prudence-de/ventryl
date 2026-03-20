// Motion & Haptic utilities — imported by App.jsx

export const haptic = (pattern = [12]) => {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
};

export const H = {
  tap:     [10],
  soft:    [6],
  double:  [12, 60, 12],
  success: [15, 50, 15],
  warning: [25],
  heavy:   [30],
  nav:     [5],
  confirm: [10, 40, 10, 40, 10],
  error:   [30, 50, 30],
};

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #D3D3D3; }
@keyframes vRipple { to { transform: translate(-50%,-50%) scale(90); opacity: 0; } }
@keyframes vFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes vFadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes vFadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
@keyframes vScaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
@keyframes vSlideLeft { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
@keyframes vSlideRight { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
@keyframes vSlideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
@keyframes vPulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.7;transform:scale(1.08);} }
@keyframes vBounce { 0%,100%{transform:translateY(0);}40%{transform:translateY(-4px);}60%{transform:translateY(-2px);} }
@keyframes vCheckPop { 0%{transform:scale(0) rotate(-15deg);opacity:0;}60%{transform:scale(1.2) rotate(5deg);}100%{transform:scale(1) rotate(0deg);opacity:1;} }
@keyframes vProgressFill { from { width:0%; } }
@keyframes vShake { 0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);} }
@keyframes vToastIn { from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);} }
@keyframes vToastOut { from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(40px);} }
@keyframes vModalIn { from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);} }
@keyframes vDrawerUp { from{transform:translateY(100%);}to{transform:translateY(0);} }
input[type="range"]{-webkit-appearance:none;appearance:none;height:4px;background:#EBEBEB;border-radius:2px;outline:none;width:100%;cursor:pointer;}
input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;background:#000;border-radius:50%;cursor:pointer;transition:transform 0.15s;}
input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.15);}
input[type="range"]::-moz-range-thumb{width:20px;height:20px;background:#000;border-radius:50%;border:none;cursor:pointer;}
input[type="number"]::-webkit-inner-spin-button{opacity:1;}
*{-webkit-tap-highlight-color:transparent;}
`;
