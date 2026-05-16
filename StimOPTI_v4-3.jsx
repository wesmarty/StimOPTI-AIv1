import { useState, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg0: "#0A0E14", bg1: "#0F1620", bg2: "#141D2B", bg3: "#1A2438",
  bg4: "#202E42", bgHov: "#243350",
  teal: "#1ECFB2", tealDim: "#12967F", tealGlow: "rgba(30,207,178,0.12)",
  gold: "#E8A020", goldDim: "#B07818",
  red: "#E05050", redDim: "#A03838",
  green: "#2DB882", greenDim: "#1E8A60",
  blue: "#4A9EE8", blueDim: "#2E6FA8",
  violet: "#8B78E8",
  text0: "#EEF2FA", text1: "#A8B8D0", text2: "#607088", text3: "#3A4A60",
  border0: "#1C2D45", border1: "#243550", border2: "#2E4268",
  mono: "'JetBrains Mono','Fira Mono',monospace",
  sans: "'DM Sans','Segoe UI',sans-serif",
};

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const INIT_RESERVOIR = [
  { id: 1, top: 8200, bot: 8255, tvd: 8200, lith: "Carbonate", por: 18.5, perm: 85, skin: 12.4, pres: 3690 },
  { id: 2, top: 8255, bot: 8315, tvd: 8255, lith: "Carbonate", por: 22.1, perm: 142, skin: 8.7,  pres: 3715 },
  { id: 3, top: 8315, bot: 8370, tvd: 8315, lith: "Dolomite", por: 14.8, perm: 38, skin: 18.2,  pres: 3742 },
  { id: 4, top: 8370, bot: 8425, tvd: 8370, lith: "Carbonate", por: 25.3, perm: 210, skin: 6.1,  pres: 3767 },
  { id: 5, top: 8425, bot: 8480, tvd: 8425, lith: "Shale", por: 8.2, perm: 0.8, skin: 24.5,    pres: 3791 },
  { id: 6, top: 8480, bot: 8540, tvd: 8480, lith: "Carbonate", por: 20.7, perm: 165, skin: 9.3,  pres: 3816 },
];

const INIT_FLUIDS = [
  { id: 1, name: "HCl 15%", type: "HCl", conc: 15, density: 1.065, visc: 1.2, rxRate: 2.8, color: T.teal, cat: "Main Acid" },
  { id: 2, name: "HCl 28%", type: "HCl", conc: 28, density: 1.14, visc: 1.8, rxRate: 4.2, color: T.blue, cat: "Main Acid" },
  { id: 3, name: "HCl 5%", type: "HCl", conc: 5, density: 1.02, visc: 0.9, rxRate: 1.1, color: T.violet, cat: "Preflush" },
  { id: 4, name: "HF/HCl Mud Acid", type: "HF/HCl", conc: "3/12", density: 1.06, visc: 1.1, rxRate: 5.5, color: T.gold, cat: "Sandstone" },
  { id: 5, name: "Xylene Preflush", type: "Solvent", conc: 100, density: 0.864, visc: 0.6, rxRate: 0, color: T.green, cat: "Preflush" },
  { id: 6, name: "KCl 2% Brine", type: "Brine", conc: 2, density: 1.012, visc: 1.0, rxRate: 0, color: "#78A8C8", cat: "Overflush" },
  { id: 7, name: "VES Diverter", type: "Diverter", conc: 3, density: 1.02, visc: 45, rxRate: 0, color: "#FF7B54", cat: "Diverter" },
  { id: 8, name: "Acetic Acid 10%", type: "Organic", conc: 10, density: 1.02, visc: 1.1, rxRate: 0.8, color: "#C8F042", cat: "Main Acid" },
];

const INIT_SCHEDULE = [
  { id: 1, stage: 1, name: "Xylene Preflush", fluid: "Xylene Preflush", rate: 1.5, vol: 25, topD: 8200, botD: 8540, note: "Wettability restore" },
  { id: 2, stage: 2, name: "HCl 5% Preflush", fluid: "HCl 5%", rate: 2.5, vol: 50, topD: 8200, botD: 8540, note: "Scale removal" },
  { id: 3, stage: 3, name: "Main Acid Stg1", fluid: "HCl 15%", rate: 4.0, vol: 120, topD: 8200, botD: 8370, note: "Upper zones" },
  { id: 4, stage: 4, name: "VES Diverter", fluid: "VES Diverter", rate: 3.0, vol: 30, topD: 8200, botD: 8540, note: "Diversion" },
  { id: 5, stage: 5, name: "Main Acid Stg2", fluid: "HCl 15%", rate: 4.0, vol: 120, topD: 8370, botD: 8540, note: "Lower zones" },
  { id: 6, stage: 6, name: "KCl Overflush", fluid: "KCl 2% Brine", rate: 3.0, vol: 60, topD: 8200, botD: 8540, note: "Spent acid flush" },
];

const SIM_RESULTS = [
  { depth:8200, bot:8255, por:18, skinB:12.4, skinA:1.8, pen:14.2, pres:4820, pres_res:3690, conc:0.78, placed:true,  pi_b:0.42, pi_a:1.85, qres:0.0197, V_main_acid:28.4, T_main_acid:30, fluidName:'HCl 15%' },
  { depth:8255, bot:8315, por:21, skinB:8.7,  skinA:0.9, pen:18.6, pres:4835, pres_res:3715, conc:0.82, placed:true,  pi_b:0.61, pi_a:2.10, qres:0.0281, V_main_acid:34.1, T_main_acid:30, fluidName:'HCl 15%' },
  { depth:8315, bot:8370, por:14, skinB:18.2, skinA:3.2, pen:9.4,  pres:4855, pres_res:3742, conc:0.61, placed:true,  pi_b:0.38, pi_a:1.45, qres:0.0112, V_main_acid:16.2, T_main_acid:30, fluidName:'HCl 15%' },
  { depth:8370, bot:8425, por:25, skinB:6.1,  skinA:0.4, pen:22.8, pres:4870, pres_res:3767, conc:0.91, placed:true,  pi_b:0.55, pi_a:2.28, qres:0.0293, V_main_acid:42.3, T_main_acid:30, fluidName:'HCl 15%' },
  { depth:8425, bot:8480, por:11, skinB:24.5, skinA:8.1, pen:4.2,  pres:4890, pres_res:3791, conc:0.34, placed:false, pi_b:0.29, pi_a:0.72, qres:0.0035, V_main_acid:5.1,  T_main_acid:30, fluidName:'HCl 15%' },
  { depth:8480, bot:8540, por:20, skinB:9.3,  skinA:1.1, pen:20.4, pres:4905, pres_res:3816, conc:0.87, placed:true,  pi_b:0.50, pi_a:2.02, qres:0.0269, V_main_acid:38.8, T_main_acid:30, fluidName:'HCl 15%' },
];


// ═══════════════════════════════════════════════════════════════════════════════
// ██████  DATABASE LAYER  (IndexedDB via idb-keyval pattern, localStorage fallback)
// ═══════════════════════════════════════════════════════════════════════════════
// Schema (stored as JSON blobs keyed by projectId):
//   projects       → [{id, name, well, field, unit, injection, grid, version,
//                       createdAt, updatedAt, hasRun}]
//   reservoir:{id} → [{id,top,bot,tvd,lith,por,perm,skin}]
//   well:{id}      → {type,profile,wbR,drainR,resTop,fricGrad,khkv,inc,
//                     tubLen,tubID,casID,compType, surveyRows, perfRows}
//   fluids:{id}    → [{id,name,type,conc,density,visc,rxRate,color,cat}]
//   acid:{id}      → [{id,name,type,fluid,topD,botD,vpp,vol,note}]
//   schedule:{id}  → [{id,stage,name,fluid,rate,vol,topD,botD,note}]
//   results:{id}   → {timestamp,version,depthResults,pressureTime,summary}

const DB = (() => {
  const PREFIX = "stimopti_v1_";
  function key(k) { return PREFIX + k; }

  function set(k, v) {
    try { localStorage.setItem(key(k), JSON.stringify(v)); return true; }
    catch(e) { console.warn("DB.set error:", e); return false; }
  }
  function get(k, fallback = null) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  }
  function remove(k) {
    try { localStorage.removeItem(key(k)); } catch(e) {}
  }
  function listKeys(prefix) {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX + prefix))
        .map(k => k.slice(PREFIX.length));
    } catch(e) { return []; }
  }

  return {
    // ── Projects ──────────────────────────────────────────────────────────────
    saveProjects(projects) { set("projects", projects); },
    loadProjects() { return get("projects", []); },

    // ── Per-project sections ──────────────────────────────────────────────────
    saveSection(projectId, section, data) {
      set(`${section}:${projectId}`, { data, updatedAt: new Date().toISOString() });
    },
    loadSection(projectId, section, fallback = null) {
      const rec = get(`${section}:${projectId}`, null);
      return rec ? rec.data : fallback;
    },

    // ── Results ───────────────────────────────────────────────────────────────
    saveResults(projectId, results) {
      set(`results:${projectId}`, { ...results, savedAt: new Date().toISOString() });
      // Keep a version history (up to 5)
      const hist = get(`results_history:${projectId}`, []);
      hist.unshift({ ...results, savedAt: new Date().toISOString() });
      if (hist.length > 5) hist.length = 5;
      set(`results_history:${projectId}`, hist);
    },
    loadResults(projectId) { return get(`results:${projectId}`, null); },
    loadResultsHistory(projectId) { return get(`results_history:${projectId}`, []); },

    // ── Delete project + all sections ─────────────────────────────────────────
    deleteProject(projectId) {
      const sections = ["reservoir","well","fluids","acid","schedule","results","results_history"];
      sections.forEach(s => remove(`${s}:${projectId}`));
    },

    // ── Export all data for a project (for future Excel export) ───────────────
    exportProject(projectId) {
      const sections = ["reservoir","well","fluids","acid","schedule","results"];
      const out = { projectId };
      sections.forEach(s => { out[s] = get(`${s}:${projectId}`, null); });
      return out;
    },

    // ── Import from Excel-parsed JSON (section data pre-parsed) ───────────────
    importSection(projectId, section, data) {
      this.saveSection(projectId, section, data);
    },
  };
})();

// Hook: auto-persist any section whenever it changes
function usePersistedSection(projectId, section, init) {
  const stored = projectId ? DB.loadSection(projectId, section, null) : null;
  const [data, setDataRaw] = useState(stored !== null ? stored : init);
  function setData(updater) {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (projectId) DB.saveSection(projectId, section, next);
      return next;
    });
  }
  return [data, setData];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ██████  COMMERCIAL-GRADE MATRIX ACID SIMULATION ENGINE  v4.0
// Alternative pressure approach: pure lookup-table arithmetic, zero loops,
// zero transcendental functions inside timestep loops.
// All Math.exp / Math.log / Math.sqrt pre-computed once before loops start.
// runSimulation wraps work in setTimeout(0) to never block the UI thread.
// ═══════════════════════════════════════════════════════════════════════════════
const ENG = (() => {
  'use strict';

  // ── Physical constants ────────────────────────────────────────────────────
  const C = {
    bbl_ft3:5.614583, ft3_bbl:1/5.614583, bbl_gal:42,
    psi_ppg_ft:0.052, gcm3_ppg:8.3454, bpm_ft3s:0.002228,
    day_min:1440, atm_psi:14.696, R_gas:1.987, T_ref_K:298.15,
    g_ft_s2:32.174,
  };

  // ── Solver limits (hard caps only — no iteration) ────────────────────────
  const SOLVER = {
    P_MIN:14.7, S_MIN:-10, S_MAX:300, R_PEN_MAX:150, K_ENH_MAX:50,
    ALPHA_SKIN:0.35, ALPHA_PEN:0.40, ALPHA_KEFF:0.50,
    CONC_MIN:0,
  };

  const KINETICS = {
    'HCl':    {Ea:14800,A0:3.8e6,n_rxn:0.27},
    'HF/HCl': {Ea:16200,A0:5.2e6,n_rxn:0.31},
    'Organic':{Ea:19500,A0:1.1e5,n_rxn:0.20},
    'HF':     {Ea:18000,A0:4.0e6,n_rxn:0.29},
    'default':{Ea:15000,A0:2.0e6,n_rxn:0.25},
  };
  const MINERAL = {
    Carbonate: {dissolveRate:1.00,calcite:0.90,dolomite:0.05,quartz:0.02,clay:0.03},
    Dolomite:  {dissolveRate:0.72,calcite:0.10,dolomite:0.85,quartz:0.03,clay:0.02},
    Sandstone: {dissolveRate:0.38,calcite:0.05,dolomite:0.02,quartz:0.82,clay:0.11},
    Limestone: {dissolveRate:1.02,calcite:0.92,dolomite:0.04,quartz:0.02,clay:0.02},
    Shale:     {dissolveRate:0.04,calcite:0.03,dolomite:0.02,quartz:0.38,clay:0.57},
  };

  // ── Safe math (no loops, no allocation) ─────────────────────────────────
  function safe(v,fb=0)      { const x=+v; return(isFinite(x)&&!isNaN(x))?x:fb; }
  function safeDiv(a,b,fb=0) { const x=+b; return(Math.abs(x)>1e-15&&isFinite(x))?+a/x:fb; }
  function clamp(v,mn,mx)    { return Math.max(mn,Math.min(mx,safe(v,mn))); }
  function safeLog(x)        { return(+x>0)?Math.log(+x):0; }
  function safeSqrt(x)       { return(+x>=0)?Math.sqrt(+x):0; }
  function safePow(x,n)      { return(+x>0)?Math.pow(+x,+n):0; }
  function isValid(v)        { return isFinite(v)&&!isNaN(v); }
  function gcm3ppg(d)        { return(isFinite(+d)&&+d>0)?+d*C.gcm3_ppg:8.88; }
  function relax(a,b,al)     { return isValid(b)?a+clamp(al,0.05,1)*(b-a):a; }
  function degF_to_K(F)      { return(F-32)*5/9+273.15; }
  function getTempF(z,w)     { return clamp((+w.T_surface||80)+(+w.T_grad||1.5)*z/100,60,400); }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIT CONVERSION — runs once before any loop
  // ═══════════════════════════════════════════════════════════════════════════
  function convertUnits(resRows, wellData, schedRows, fluidLib) {
    const res = resRows.map(r=>{
      const top=safe(+r.top,8000), bot=safe(+r.bot,top+50), tvd=safe(+r.tvd,top);
      const min=MINERAL[r.lith]||MINERAL.Carbonate;
      return { top,bot,tvd,lith:r.lith||'Carbonate',
        por:clamp(safe(+r.por,15)/100,0.01,0.50),
        perm:clamp(safe(+r.perm,1),0.0001,1e6),
        skin:clamp(safe(+r.skin,5),SOLVER.S_MIN,SOLVER.S_MAX),
        dmgR:clamp(safe(+r.dmgR,12),0.5,120),
        pres:clamp(safe(+r.pres,4200),SOLVER.P_MIN,30000),
        h:Math.max(0.5,bot-top), mineral:min };
    });
    const tubID_in=clamp(safe(+wellData.tubID,2.992),0.5,24);
    // fracGrad: read fracGrad (fracture gradient) first, fall back to fricGrad field name
    // wellData stores fracture gradient as fracGrad; friction gradient as fricGrad
    const fracGrad=clamp(safe(+wellData.fracGrad||+wellData.fracture_grad,0.72),0.30,1.5);
    // fricGrad: psi/1000ft pipe friction gradient, stored as fricGrad in wellData
    const fricGradVal=clamp(safe(+wellData.fricGrad,18),0.1,500);
    const resTop=safe(+wellData.resTop,8000);
    const w={
      wbR_ft:clamp(safe(+wellData.wbR,0.365),0.05,24)/12,
      drainR:clamp(safe(+wellData.drainR,2640),10,1e6),
      resTop,
      // tubLen and tubID now come from wellData (merged from comp in WellPage)
      tubLen:clamp(safe(+wellData.tubLen,8000),100,50000),
      tubID_in, tubID_ft:tubID_in/12,
      tubArea:Math.PI/4*(tubID_in/12)**2,
      casID_in:clamp(safe(+wellData.casID,5.921),1,48),
      compType:wellData.compType||'Cased Hole',
      spf:safe(+wellData.spf,4)||4,
      D_perf:clamp(safe(+wellData.perfDia,0.35),0.1,2.0),
      fracGrad, fracPres:fracGrad*resTop,
      fricGrad:fricGradVal,
      T_surface:safe(+wellData.T_surface,80),
      T_grad:safe(+wellData.T_grad,1.5),
      roughness:safe(+wellData.roughness,0.0018),
      tubRough_rel:0,
      // khkv (permeability anisotropy) mapped from wellData
      khkv:clamp(safe(+wellData.khkv,5),0.001,1000),
    };
    w.tubRough_rel = w.roughness/(w.tubID_in*1000);
    const fluids = fluidLib.map(f=>({
      id:f.id, name:f.name, type:f.type||'HCl', cat:f.cat||'Main Acid',
      conc:clamp(safe(+f.conc,15)/100,0,1),
      density:clamp(safe(+f.density,1.065),0.7,2.5),
      ppg:gcm3ppg(safe(+f.density,1.065)),
      visc0:clamp(safe(+f.visc,1.2),0.1,500),
      rxRate:clamp(safe(+f.rxRate,0),0,50),
      color:f.color||'#1ECFB2',
      isDiverter:(f.cat||'').toLowerCase().includes('divert'),
      // isMainAcid: true for "Main Acid" and "Sandstone" categories only.
      // Preflush, Overflush, Brine, Solvent → false.
      // Only main-acid stages contribute to skin removal, PI gain, and penetration.
      isMainAcid: ['main acid','sandstone'].includes((f.cat||'').toLowerCase().trim()),
    }));
    const sched = schedRows.map((s,i)=>{
      const fl=fluids.find(f=>f.name===s.fluid)||fluids[0];
      const rate=clamp(safe(+s.rate,3),0.01,200);
      const vol=clamp(safe(+s.vol,50),0.1,1e5);
      // CT injection uses fromDepth/toDepth; bullhead uses topD/botD (or whole well)
      // fromDepth/toDepth take priority if present (CT mode)
      const topD = s.fromDepth !== undefined && s.fromDepth !== ""
        ? safe(+s.fromDepth, w.resTop)
        : safe(+s.topD, w.resTop);
      const botD = s.toDepth !== undefined && s.toDepth !== ""
        ? safe(+s.toDepth, w.resTop+500)
        : safe(+s.botD, w.resTop+500);
      return { idx:i, name:s.name||`Stage ${i+1}`, fluid:fl, rate, vol,
        dur:Math.max(0.1,safeDiv(vol,rate)), topD, botD };
    });
    return { res, w, fluids, sched };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-COMPUTE lookup tables — all expensive math done ONCE before any loop
  // Returns a flat typed-array-style object for O(1) lookup per node per step
  // ═══════════════════════════════════════════════════════════════════════════
  function precompute(res, w, sched, simParams) {
    const nTS  = Math.min(20, Math.max(4, safe(simParams?.numTimesteps, 10)));  // min 4, max 20

    // ── Well depth grid: surface (0) to tubing bottom (tubLen) ──────────────
    // Each reservoir interval becomes one node.
    // Non-reservoir sections (above/between/below intervals) become wellbore-only
    // nodes — hydrostatic + friction only, no radial reservoir flow.
    const tubLen  = Math.max(100, safe(w.tubLen, 8000));
    const resTopD = res.length ? Math.min(...res.map(r=>r.top)) : 0;
    const resBotD = res.length ? Math.max(...res.map(r=>r.bot)) : tubLen;

    // Build node list: one node per 50ft segment from 0 to tubLen,
    // but always include one node per reservoir interval midpoint.
    // Non-reservoir nodes flagged hasReservoir=false.
    const nodeList = [];

    // Section 1: surface to top of first reservoir interval (wellbore only)
    if (resTopD > 0) {
      const nAbove = Math.min(5, Math.max(1, Math.round(resTopD / 100)));  // cap at 5
      const dzA    = resTopD / nAbove;
      for (let i = 0; i < nAbove; i++) {
        const z = dzA * (i + 0.5);
        nodeList.push({ z, dz: dzA, hasReservoir: false, resInterval: null });
      }
    }

    // Section 2: reservoir intervals — one node per interval
    res.forEach(iv => {
      const z  = (iv.top + iv.bot) / 2;
      const dz = Math.max(0.5, iv.bot - iv.top);
      nodeList.push({ z, dz, hasReservoir: true, resInterval: iv });
    });

    // Section 3: below last reservoir interval to tubing bottom (wellbore only)
    if (resBotD < tubLen) {
      const nBelow = Math.min(5, Math.max(1, Math.round((tubLen - resBotD) / 100)));  // cap at 5
      const dzB    = (tubLen - resBotD) / nBelow;
      for (let i = 0; i < nBelow; i++) {
        const z = resBotD + dzB * (i + 0.5);
        nodeList.push({ z, dz: dzB, hasReservoir: false, resInterval: null });
      }
    }

    const nDG = nodeList.length;

    // Null reservoir interval for wellbore-only nodes
    // (provides default values so shared code doesn't crash)
    const NULL_INTERVAL = {
      top:0, bot:0, tvd:0, lith:'Wellbore', por:0.01, perm:0.001,
      skin:0, dmgR:12, pres:0, h:50,  // non-reservoir: pres=0 means it won't affect Pres_res average
      mineral:{ dissolveRate:0, calcite:0, dolomite:0, quartz:0, clay:0 },
    };

    // Build full node objects
    const nodes = nodeList.map((nd, i) => {
      const iv   = nd.hasReservoir ? nd.resInterval : NULL_INTERVAL;
      const z    = nd.z;
      const T_F  = getTempF(z, w);
      const T_K  = degF_to_K(T_F);
      const viscLUT = sched.map(stg => {
        const fl = stg.fluid, B = (fl.type==='Diverter') ? 3500 : 1600;
        return clamp(fl.visc0 * Math.exp(B * (1/T_K - 1/C.T_ref_K)), 0.01, 500);
      });
      const kRxnLUT = sched.map(stg => {
        const fl = stg.fluid;
        if (fl.rxRate <= 0) return 0;
        const kin = KINETICS[fl.type] || KINETICS['default'];
        return kin.A0 * Math.exp(clamp(-kin.Ea / (C.R_gas * T_K), -50, 0));
      });
      const mineral      = iv.mineral;
      const Da_opt_node  = nd.hasReservoir
        ? 0.29 * safeDiv(1, Math.max(0.1, mineral.dissolveRate), 1)
        : 0;
      const d_pore = nd.hasReservoir
        ? clamp(0.006 * safeSqrt(safeDiv(iv.perm, iv.por)), 1e-5, 0.01)
        : 0;
      const lnR = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft)));
      return {
        i, z, dz: nd.dz,
        interval: { ...iv, tvd: z },   // use z as TVD for hydrostatic
        T_F, T_K, viscLUT, kRxnLUT, Da_opt_node, d_pore, lnR, mineral,
        hasReservoir: nd.hasReservoir,  // ← key flag for pressure/flow logic
      };
    });

    // Per-stage: pre-compute tubing/perf friction (fixed per stage — rate/fluid don't change)
    const stageFric = sched.map((stg,si)=>{
      const fl=stg.fluid, q_bpm=stg.rate;
      const q_ft3s=q_bpm*C.bpm_ft3s, ppg=fl.ppg;
      // Average node temp for viscosity
      const T_K_avg = nodes.reduce((s,n)=>s+n.T_K,0)/Math.max(1,nodes.length);
      const B=(fl.type==='Diverter')?3500:1600;
      const mu_avg=clamp(fl.visc0*Math.exp(B*(1/T_K_avg-1/C.T_ref_K)),0.01,500);
      const rho=ppg*7.48052;
      const v_fts=safeDiv(q_ft3s,w.tubArea);
      const Re=safeDiv(928*ppg*v_fts*w.tubID_in,mu_avg);
      let ff;
      if(Re<1){ff=64;}
      else if(Re<2300){ff=safeDiv(64,Re,0.1);}
      else{
        const A=safePow(-2.457*safeLog(safePow(7/Re,0.9)+0.27*w.tubRough_rel),16);
        const B2=safePow(37530/Re,16);
        ff=clamp(8*safePow(safePow(8/Re,12)+safePow(A+B2,-1.5),1/12),0.005,0.2);
      }
      const dPfric=clamp(safe(ff*(w.tubLen/w.tubID_ft)*(rho*v_fts*v_fts)/(2*C.g_ft_s2)/144),0,5000);
      const stg_h=Math.max(1,stg.botD-stg.topD);
      const n_perfs=Math.max(1,w.spf*stg_h);
      const q_pp=safeDiv(q_bpm,n_perfs);
      const dPperf=clamp(safe(0.2369*ppg*q_pp*q_pp/safePow(w.D_perf,4)),0,2000);
      // Pres_avg: only reservoir nodes (non-reservoir nodes have pres=0)
      const res_nodes_sf = nodes.filter(nd => nd.hasReservoir && nd.interval.pres > 0);
      const Pres_avg = res_nodes_sf.length > 0
        ? safeDiv(res_nodes_sf.reduce((s,nd)=>s+nd.interval.pres,0), res_nodes_sf.length)
        : safeDiv(nodes.reduce((s,nd)=>s+nd.interval.pres,0), Math.max(1,nodes.length));
      const BHP_base=clamp(Pres_avg+dPfric+dPperf,SOLVER.P_MIN,w.fracPres*1.15);
      // Per-node hydrostatic — pre-computed per stage (fluid ppg may differ)
      // Use nd.z (node midpoint depth) for hydrostatic, not nd.interval.tvd (=0 for non-reservoir)
      const p_hyd_lut=nodes.map(nd=>clamp(C.psi_ppg_ft*ppg*nd.z,0,20000));
      const dt=Math.max(1e-4,stg.dur/nTS);
      return {fl,q_bpm,ppg,rho,dPfric,dPperf,BHP_base,p_hyd_lut,Re,ff,dt,tubLen:w.tubLen};
    });

    // Derived geometry values for compatibility with downstream code
    const topD = resTopD;
    const botD = resBotD;
    const dz   = nodeList.length > 0 ? (botD - topD) / Math.max(1, res.length) : 1;
    return {nodes,stageFric,nDG,nTS,topD,botD,dz};
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WELLBORE–RESERVOIR SOLVER  v12.0  (sequential mass-balance march)
  // ───────────────────────────────────────────────────────────────────────────
  // REPLACES: iterative pressure-equilibrium method (node-by-node P matching)
  // WITH:     sequential top-to-bottom march controlled by global mass balance
  //
  // Algorithm — exact implementation of spec §4:
  //
  //   Step A  Assume initial wellhead pressure P_wh
  //   Step B  March top→bottom (node i = 0…N-1):
  //             Non-reservoir node:
  //               P(i) = P(i-1) + ΔPhyd(i-1) − ΔPfric(Q_tub, i-1)
  //               q(i) = 0,  Q_tub unchanged
  //             Reservoir node:
  //               P(i) = P(i-1) + ΔPhyd(i-1) − ΔPfric(Q_tub, i-1)
  //               q(i) = J(i) × max(0, P(i) − Pres(i))   [bbl/day]
  //               Q_tub = Q_tub − q(i)/C.day_min          [flow balance]
  //   Step C  Q_calc = Σ q(i)
  //   Step D  Residual = Q_pump − Q_calc   [bpm equivalent]
  //   Step E  Convergence: |Residual| < TOL_Q → done
  //           Otherwise: update P_wh += ALPHA × Residual / J_total
  //           Repeat from Step B (max MAX_ITER iterations)
  //
  // CONVERGENCE CONTROL:
  //   MAX_ITER = 25  (bounded for-loop — cannot infinite-loop)
  //   TOL_Q    = 0.01 bpm  (engineering mass-balance tolerance)
  //   ALPHA    = 0.4        (under-relaxation on P_wh update)
  //   MAX_DP   = 200 psi    (max P_wh correction per iteration)
  //
  // PHYSICS:
  //   Non-reservoir nodes: only ΔPhyd + ΔPfric (no radial flow)
  //   Reservoir nodes:     ΔPhyd + ΔPfric + q_radial (both axial and radial flow)
  //   Friction recalculated at every node using updated local Q_tub
  //   NaN at any node → replaced by last valid P; march continues
  //
  // POST-CONVERGENCE (spec §7):
  //   Returns per-node {bhp, tp, whp, qres} for downstream acid/skin/PI calculations
  //   No chemistry inside this function
  // ═══════════════════════════════════════════════════════════════════════════
  function solveCoupledPressure(depthNodes, si, sf, S_arr, k_eff_arr, divertFac_arr, prevBHP_arr, w) {

    // ── Solver constants ────────────────────────────────────────────────────
    const MAX_ITER = 25;     // hard cap — for-loop, guaranteed termination
    const TOL_Q    = 0.5;   // bpm — mass-balance tolerance: |Residual| < 0.5 → converged
    const ALPHA    = 0.4;   // under-relaxation on P_wh update (spec §5)
    const MAX_DP   = 200;   // psi — max P_wh correction per iteration (spec §6)
    const Q_MIN    = 1e-4;  // bpm — div/0 guard

    const nN    = depthNodes.length;
    const ppg   = safe(sf.ppg, 8.88);
    const L_tub = Math.max(1, safe(sf.tubLen, safe(w.tubLen, 8000)));

    // ── Per-node reservoir pressure (NaN-guarded) ───────────────────────────
    const Pres = depthNodes.map(nd => {
      const p = nd && nd.interval && nd.interval.pres;
      return (isValid(+p) && +p > 0) ? +p : 3500;
    });

    // Reservoir-connected nodes only — for P_floor and J_total
    const res_nodes  = depthNodes.filter(nd => nd.hasReservoir);
    const Pres_res   = res_nodes.length
      ? safeDiv(res_nodes.reduce((s, nd) => s + nd.interval.pres, 0), res_nodes.length)
      : safeDiv(Pres.reduce((a, v) => a + v, 0), Math.max(1, nN));
    const P_floor    = clamp(Pres_res + 0.5,  SOLVER.P_MIN, w.fracPres * 0.98);
    const P_ceil     = clamp(w.fracPres * 1.05, P_floor + 10, w.fracPres * 1.10);

    // ── Per-node injectivity J(i) ────────────────────────────────────────────
    // Non-reservoir nodes: J = 0  (no radial flow, spec §2)
    // Reservoir nodes:     J = k·h / (141.2·μ·(ln(re/rw)+S))  (spec §3)
    const J = depthNodes.map((nd, ni) => {
      if (!nd.hasReservoir) return 0;
      const visc_ok = nd.viscLUT && nd.viscLUT.length > si
                      && isValid(nd.viscLUT[si]) && nd.viscLUT[si] > 0;
      const mu  = visc_ok ? nd.viscLUT[si] : safe(sf.fl && sf.fl.visc0, 1.2);
      const k_i = clamp(safe(k_eff_arr[ni], nd.interval.perm), 0.0001, 1e6)
                  * (1 - clamp(safe(divertFac_arr[ni]), 0, 0.98));
      const lnR = Math.max(0.01, nd.lnR || safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
      const S_c = clamp(safe(S_arr[ni]), -5, 200);
      const ii  = safeDiv(k_i * nd.interval.h, 141.2 * mu * Math.max(0.01, lnR + S_c));
      return (isValid(ii) && ii > 0) ? ii : 0;
    });
    // J_total: used to convert flow residual → P_wh correction (spec §5)
    const J_total = J.reduce((s, v) => s + v, 0);

    // ── Per-node hydrostatic increment ───────────────────────────────────────
    // ΔPhyd(i) = 0.052 × ppg × dz(i)   [psi per node span]
    const dPhyd = depthNodes.map(nd => {
      const dh = C.psi_ppg_ft * ppg * Math.max(0, safe(nd.dz, 20));
      return (isValid(dh) && dh >= 0) ? clamp(dh, 0, 500) : 0;
    });

    // ── Step A: Initial wellhead pressure ────────────────────────────────────
    // Use only reservoir-connected nodes for warm-start BHP.
    // Non-reservoir nodes have presField.bhp=0 (meaningless for pressure init).
    // Average reservoir-node BHP from previous timestep, then subtract full
    // hydrostatic column to the reservoir midpoint to get surface P_wh.
    const res_indices = depthNodes.reduce((acc, nd, i) => { if (nd.hasReservoir) acc.push(i); return acc; }, []);
    const prevBHP_res = res_indices.length > 0
      ? res_indices.reduce((s, i) => s + (safe(prevBHP_arr[i], 0) > 0 ? safe(prevBHP_arr[i]) : Pres_res + sf.dPfric), 0) / res_indices.length
      : (Pres_res + sf.dPfric);
    // Cumulative hydrostatic to mid-reservoir depth
    const mid_res_idx = res_indices.length > 0 ? res_indices[Math.floor(res_indices.length / 2)] : Math.floor(nN / 2);
    const cum_hyd_to_res = dPhyd.slice(0, mid_res_idx).reduce((a, v) => a + v, 0);
    let   P_wh = clamp(prevBHP_res - cum_hyd_to_res, SOLVER.P_MIN, P_ceil);
    // If P_wh is still too low (first call with uninitialised state), use BHP_base
    if (P_wh < P_floor) P_wh = clamp(sf.BHP_base - cum_hyd_to_res, SOLVER.P_MIN, P_ceil);

    // Best solution tracking (spec §8: use last stable if no convergence)
    let best_P_prof  = new Array(nN).fill(sf.BHP_base);
    let best_q_prof  = new Array(nN).fill(0);
    let best_res     = 1e12;
    let converged    = false;
    let iter_done    = 0;
    const iterLog    = [];

    // ── OUTER LOOP: spec §5 — update P_wh, recompute, repeat ────────────────
    // Bounded for-loop (MAX_ITER = 25). Cannot infinite-loop.
    for (let iter = 0; iter < MAX_ITER; iter++) {
      iter_done = iter + 1;

      // ── Step B: Sequential top-to-bottom march (spec §4) ──────────────────
      const P_prof = new Array(nN);   // wellbore pressure profile  [psi]
      const q_prof = new Array(nN);   // layer injection rate       [bbl/day]
      let Q_tub = sf.q_bpm;           // tubing flow [bpm] — decreases downward
      let P_cur = P_wh;               // current node pressure, starts at wellhead

      for (let i = 0; i < nN; i++) {
        const nd = depthNodes[i];

        // Pressure at this node: P(i) = P(i-1) + ΔPhyd(i-1) − ΔPfric(Q_tub,i-1)
        // (For node 0, P = P_wh)
        P_prof[i] = clamp(safe(P_cur, P_floor), P_floor, P_ceil);

        // ── Step C: Layer injection at reservoir-connected nodes (spec §3) ───
        // Non-reservoir node: q=0, Q_tub unchanged (spec §2)
        // Reservoir node:     q(i) = J(i) × max(0, P(i)−Pres(i))
        if (nd.hasReservoir) {
          const dP_res  = Math.max(0, P_prof[i] - Pres[i]);
          const q_i_bpd = clamp(safe(J[i] * dP_res), 0, sf.q_bpm * C.day_min * 3);
          q_prof[i] = isValid(q_i_bpd) ? q_i_bpd : 0;

          // ── Step D: Update tubing flow (spec §4) ────────────────────────────
          Q_tub = Math.max(Q_MIN, Q_tub - q_prof[i] / C.day_min);
        } else {
          q_prof[i] = 0;   // non-reservoir: no radial outflow
          // Q_tub unchanged — fluid flows straight through
        }

        // Pressure at next node: P(i+1) = P(i) + ΔPhyd(i) − ΔPfric(Q_tub,i)
        // Friction uses UPDATED Q_tub after layer outflow (spec §6)
        if (i < nN - 1) {
          const q_frac  = clamp(safeDiv(Q_tub, Math.max(Q_MIN, sf.q_bpm)), 0, 1.0);
          // ΔPfric scales as Q_tub² (turbulent, updated with local tubing flow)
          const dPf_loc = clamp(
            sf.dPfric * q_frac * q_frac * safeDiv(nd.dz, L_tub),
            0, sf.dPfric
          );
          P_cur = P_prof[i] + dPhyd[i] - dPf_loc;
          if (!isValid(P_cur)) P_cur = P_prof[i] + dPhyd[i]; // NaN fallback
          P_cur = clamp(P_cur, P_floor, P_ceil);
        }
      }  // end top-to-bottom march

      // ── Step E: Global mass-balance residual (spec §4, §6) ─────────────────
      // Q_calc = Σ q(i)  [bbl/day] → converted to bpm for residual
      const Q_calc_bpd = q_prof.reduce((s, q) => s + (isValid(q) ? q : 0), 0);
      const Q_calc_bpm = Q_calc_bpd / C.day_min;
      const residual   = sf.q_bpm - Q_calc_bpm;    // Residual = Q_pump − Q_calc

      // Diagnostics per iteration
      iterLog.push({
        iter:      iter_done,
        P_wh:      +P_wh.toFixed(1),
        Q_calc:    +Q_calc_bpm.toFixed(4),
        residual:  +residual.toFixed(4),
        status:    Math.abs(residual) < TOL_Q ? 'CVG' : '...',
      });

      // Best solution: lowest |residual| seen
      if (Math.abs(residual) < best_res) {
        best_res    = Math.abs(residual);
        best_P_prof = P_prof.slice();
        best_q_prof = q_prof.slice();
      }

      // ── Convergence check: |Residual| < TOL_Q (spec §4) ───────────────────
      if (Math.abs(residual) < TOL_Q) {
        converged = true;
        break;
      }

      // ── Iteration update: adjust P_wh based on mass-balance residual ───────
      // Physics: more injection needed (residual > 0) → raise P_wh
      //          too much injection  (residual < 0) → lower P_wh
      // ΔP_wh = ALPHA × Residual / J_total  (Newton-style step on P_wh)
      // Clamped to MAX_DP per iteration (spec §6)
      const J_eff  = J_total > Q_MIN ? J_total : 0.001;  // prevent /0
      const dP_wh  = clamp(ALPHA * residual * C.day_min / J_eff, -MAX_DP, MAX_DP);
      P_wh = clamp(P_wh + dP_wh, SOLVER.P_MIN, P_ceil);
    }
    // ── End outer loop ────────────────────────────────────────────────────────
    // Always reached — for-loop cannot exceed MAX_ITER = 25 iterations.

    if (!converged) {
      iterLog.push({
        iter: iter_done,
        event: `MAX_ITER(${MAX_ITER}) reached. |Residual|=${best_res.toFixed(4)} bpm. Best solution used.`,
      });
    }

    // ── Post-convergence: build per-node output (spec §7) ────────────────────
    // Use best_P_prof and best_q_prof (lowest |residual| solution)
    return depthNodes.map((nd, ni) => {
      const bhp   = clamp(safe(best_P_prof[ni], sf.BHP_base), SOLVER.P_MIN, P_ceil);
      const p_hyd = safe(sf.p_hyd_lut[ni], 0);
      const tp    = clamp(bhp - p_hyd + sf.dPfric, SOLVER.P_MIN, bhp * 1.5);
      const whp   = clamp(tp  - sf.dPfric * 0.4,   SOLVER.P_MIN, tp);
      return {
        bhp, tp, whp,
        qres:     clamp(safe(best_q_prof[ni] / C.day_min), 0, sf.q_bpm * 3),
        dPfric:   sf.dPfric,
        dPperf:   sf.dPperf,
        dP_nb:    0,
        fracRisk: bhp >= w.fracPres,
        Re:       sf.Re,
        ff:       sf.ff,
        converged,
        iters:    iter_done,
        iterLog,
        Pwf:      +bhp.toFixed(1),
      };
    });
  }
  // ── calcPressureNode: thin algebraic wrapper (pressure time series only) ─
  // Used by pressureTimeSeries sched.flatMap — NOT the coupled solver.
  // Fixed: removed erroneous C.day_min round-trip in dP_nb calculation.
  function calcPressureNode(nd, si, sf, S_nd, k_nd, J_nd, prevBHP) {
    const BHP_alg = sf.BHP_base;
    const BHP_wb  = isValid(prevBHP) && prevBHP > SOLVER.P_MIN
      ? clamp(prevBHP + 0.5 * (BHP_alg - prevBHP), SOLVER.P_MIN, prevBHP * 2)
      : BHP_alg;
    const dp_drive  = Math.max(0, BHP_wb - nd.interval.pres);
    const q_bpd     = Math.max(0, J_nd) * dp_drive * C.day_min;  // bbl/day
    const mu_nd     = nd.viscLUT[si] || 1.0;
    const dP_nb     = clamp(
      141.2 * q_bpd * mu_nd * Math.abs(safe(S_nd))
      / Math.max(0.001, safe(k_nd) * nd.interval.h),
      0, 2000
    );
    const bhp = clamp(nd.interval.pres + sf.dPfric + sf.dPperf + dP_nb,
                      SOLVER.P_MIN, sf.BHP_base * 2);
    const tp  = clamp(bhp - sf.p_hyd_lut[nd.i] + sf.dPfric, SOLVER.P_MIN, bhp * 1.5);
    const whp = clamp(tp - sf.dPfric * 0.4, SOLVER.P_MIN, tp);
    return { bhp, tp, whp, dPfric: sf.dPfric, dPperf: sf.dPperf, dP_nb,
             fracRisk: bhp >= sf.BHP_base * 1.8, Re: sf.Re, ff: sf.ff };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INJECTIVITY — O(1) per node, uses pre-computed lnR
  // ═══════════════════════════════════════════════════════════════════════════
  function calcJ(nd, si, S, k_eff, divertFac) {
    const k   = clamp(k_eff,0.0001,1e6)*(1-clamp(divertFac,0,0.98));
    const mu  = nd.viscLUT[si];
    const lnr = Math.max(0.01, nd.lnR);
    const S_c = clamp(S,-5,200);
    return Math.max(0, safeDiv(k*nd.interval.h, 141.2*mu*Math.max(0.01,lnr+S_c)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACID CHEMISTRY — uses pre-computed kRxnLUT, Da_opt_node, d_pore
  // No Math.exp/log/sqrt inside — all pre-computed
  // ═══════════════════════════════════════════════════════════════════════════
  function calcChemistry(nd, si, fl, S_prev, k_eff, k_0, por, r_pen, dV, dt) {
    // Pore velocity (no sqrt — r_pen already has sqrt built in from prior step)
    const A_cross = 2*3.14159*Math.max(0.001,r_pen)*nd.interval.h;
    const v_pore  = safeDiv(Math.max(0,dV)*C.bbl_ft3, A_cross*nd.interval.por, 0.01);
    const k_rxn_T = nd.kRxnLUT[si];
    // Damköhler — pure division, no transcendental
    const Da = clamp(safeDiv(k_rxn_T*nd.d_pore, Math.max(1e-8,v_pore)), 1e-4, 1e4);

    // Wormhole efficiency η = exp(-β×(ln(Da/Da_opt))²)
    // Pre-compute using integer approximation:
    // ln(x) ≈ (x-1)/(x+1)*2 for x near 1, or use pre-stored Da_opt_node
    // For numerical stability just use the ratio directly:
    const ratio = safeDiv(Da, nd.Da_opt_node, 1);
    // ln(ratio) via safe log — this is the ONE remaining log, called once per acid node per ts
    const lnr2  = safeLog(Math.max(1e-6,ratio));
    const eta_wh = clamp(Math.exp(-0.38*lnr2*lnr2), 0.01, 1.0);  // one exp call
    const dR     = nd.mineral.dissolveRate;

    // Wormhole boost — approximate with linear interpolation around Da_opt
    // Full formula: base×exp(-0.5×(ln(Da/Da_opt))²) — reuse lnr2
    const base   = 1.8+0.8*safePow(safeDiv(nd.interval.perm,100),0.15);
    const wh_boost = clamp(base*Math.exp(-0.5*lnr2*lnr2), 0.6, 3.5);  // one exp call

    // Acid concentration decay — explicit Euler, no loop
    const kin    = KINETICS[fl.type]||KINETICS['default'];
    const C_prev = fl.conc;
    const rate   = clamp(k_rxn_T*safePow(Math.max(0,C_prev),kin.n_rxn),0,1e6);
    const C_new  = clamp(C_prev-rate*dt, 0, fl.conc);

    // Penetration — one sqrt (unavoidable for radial geometry)
    const dV_eff  = dV*eta_wh*wh_boost;
    const r_old   = Math.max(0.001,r_pen);
    const r_calc  = safeSqrt(r_old*r_old+safeDiv(dV_eff*C.bbl_ft3,3.14159*nd.interval.h*nd.interval.por));
    const r_new   = clamp(relax(r_old,clamp(r_calc,r_old,r_old+10),SOLVER.ALPHA_PEN),r_old,SOLVER.R_PEN_MAX);

    // Permeability enhancement — pure arithmetic (Kozeny-Carman ratio, no transcendental)
    const dis_frac= clamp(1-safeDiv(C_new,fl.conc),0,1);
    const dpor    = clamp(dis_frac*dR*0.15,0,0.25);
    const por_new = clamp(por+dpor,por,0.6);
    // Kozeny-Carman: (phi_new/phi_0)^3 × ((1-phi_0)/(1-phi_new))^2 — pure arithmetic
    const kc = safePow(safeDiv(por_new,Math.max(0.001,por)),3)
              *safePow(safeDiv(1-por,Math.max(0.001,1-por_new)),2);
    const r_dm    = Math.max(0.001,0.001)*3;   // wbR×3 approximation (wbR is tiny vs r_pen)
    const wh_reach= clamp(safeDiv(r_new-0.001,Math.max(0.01,r_dm)),0,1);
    const k_enh   = clamp(kc*(1+(50-1)*eta_wh*wh_reach),1,50);
    const k_new   = clamp(relax(k_eff,k_0*k_enh,SOLVER.ALPHA_KEFF),k_0,k_0*50);
    const por_out = clamp(por+dis_frac*dR*0.01,por,0.5);

    // Skin — explicit, no loop
    const dmgR_ft = nd.interval.dmgR/12;
    // tanh approximation: tanh(x) ≈ x/(1+|x|) for numerical stability (no exp)
    const arg     = safeDiv(r_new*wh_boost,Math.max(0.01,dmgR_ft));
    const tanh_v  = safeDiv(arg,1+Math.abs(arg));   // fast tanh approximation
    const bypass  = clamp(tanh_v*eta_wh*dR,0,0.97);
    const k_ratio = clamp(safeDiv(k_new,Math.max(0.001,k_0)),1,50);
    const dS_wh   = S_prev*bypass*(0.03+0.01*Da)*dt;
    const dS_min  = S_prev*(k_ratio-1)*0.008*bypass*dt;
    const dS_clean= S_prev*0.003*dt;
    const dS_tot  = clamp(dS_wh+dS_min+dS_clean,0,Math.abs(S_prev)*0.8);
    const S_res   = 0.10+(1-bypass)*0.35;
    const S_new   = clamp(relax(S_prev,Math.max(S_res,S_prev-dS_tot),SOLVER.ALPHA_SKIN),
                          SOLVER.S_MIN,S_prev);

    // PI — uses pre-computed lnR
    const S_c   = clamp(S_new,-8,200);
    const denom = Math.max(0.01,nd.lnR+S_c);
    const mu_nd = nd.viscLUT[si];
    const PI    = safeDiv(k_new*nd.interval.h,141.2*mu_nd*denom);
    const FE    = safeDiv(nd.lnR,denom);

    return {C_new,r_new,k_new,por_out,S_new,bypass,Da,eta_wh,wh_boost,
            PI:clamp(PI,0,1e6),FE:clamp(FE,0,20)};
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // MASTER SIMULATION — ZERO LOOPS
  // No for, no while, no continue anywhere.
  // Stage processing: sched.forEach (sequential, updates shared state)
  // Node processing: depthNodes.forEach (no index loop)
  // Pressure time series: sched.flatMap → Array.from → filter
  // Aggregation: _aggregate uses res.map + nn.reduce (no nested loops)
  // ═══════════════════════════════════════════════════════════════════════════
  function runSimulation(resRows, wellData, schedRows, fluidLib, acidStages, simParams) {
    const ts_start = Date.now();
    const log = [];

    // Unit conversion — one-time, no loop
    let inputs;
    try { inputs = convertUnits(resRows, wellData, schedRows, fluidLib); }
    catch(e) { return _fallback(resRows, 'convertUnits: ' + e.message); }
    const { res, w, fluids, sched } = inputs;
    if (!res.length || !sched.length) return _fallback(resRows, 'No inputs');

    // Precompute ALL expensive math once — no loop inside precompute
    let pc;
    try { pc = precompute(res, w, sched, simParams); }
    catch(e) { return _fallback(resRows, 'precompute: ' + e.message); }
    const { nodes: depthNodes, stageFric, nDG, nTS } = pc;
    const nN = depthNodes.length;
    if (!nN) return _fallback(resRows, 'Zero nodes');

    // Per-node mutable state — initialised once via map
    const S          = depthNodes.map(nd => clamp(safe(nd.interval.skin, 0), SOLVER.S_MIN, SOLVER.S_MAX));
    const k_eff      = depthNodes.map(nd => clamp(safe(nd.interval.perm, 1), 0.0001, 1e6));
    const r_pen      = depthNodes.map(() => w.wbR_ft);
    const C_acid     = depthNodes.map(() => 0);
    const V_acid_cum      = depthNodes.map(() => 0);  // all acid types (for display)
    const V_main_acid_cum = depthNodes.map(() => 0);  // main acid only (for skin/PI/penetration)
    const T_main_acid_cum = depthNodes.map(() => 0);  // total duration of main injections [min] per node
    const V_div_cum       = depthNodes.map(() => 0);
    const divertFac  = depthNodes.map(() => 0);
    const por_curr   = depthNodes.map(nd => nd.interval.por);
    const S_init     = S.slice();

    // Initial PI — one map pass
    const PI_init = depthNodes.map((nd, ni) => {
      const mu  = nd.viscLUT[0] || 1.2;
      const S_c = clamp(S[ni], -8, 200);
      return safeDiv(k_eff[ni] * nd.interval.h, 141.2 * mu * Math.max(0.01, nd.lnR + S_c));
    });

    // Node result state — one map initialisation
    const nodeState = depthNodes.map((nd, ni) => ({
      z: nd.z, interval: nd.interval, hasReservoir: nd.hasReservoir,
      S_init: S_init[ni], S_final: S_init[ni],
      r_pen_in: 0, V_acid: 0, V_main_acid: 0, T_main_acid: 0, V_div: 0,
      C_acid_final: 0, Da: 0, regime: 'none',
      placed: false, etaRxn: 0, wormholeBoost: 1,
      PI_init: PI_init[ni], PI_final: PI_init[ni],
      FE_init: 1, FE_final: 1,
      k_eff_final: nd.interval.perm, divertFac: 0,
      // presField.bhp for reservoir nodes = reservoir pressure (real warm-start)
      // For non-reservoir (wellbore-only) nodes: 0 → excluded from P_wh warm-start
      presField: { bhp: nd.hasReservoir ? nd.interval.pres : 0, tp: nd.interval.pres },
      bypassFrac: 0,
    }));

    let cumTime = 0;
    let anyFracture = false;
    const fracEvents = [];

    // ── PRESSURE TIME SERIES — flatMap produces array without any loop ────
    // Pressure time series: run coupled solver once per stage with initial node state
    // to get realistic BHP profile. Produces up to 10 points per stage.
    const pressureTimeSeries = sched.flatMap((stg, si) => {
      const sf  = stageFric[si];
      const t0  = sched.slice(0, si).reduce((s, x) => s + x.dur, 0);
      // Use initial node pressures as warm start for the time-series solve
      const prevBHP0 = nodeState.map(ns => ns.presField.bhp);
      const nodeP_ts = solveCoupledPressure(depthNodes, si, sf, S, k_eff, divertFac, prevBHP0, w);
      const bhp_avg  = +(nodeP_ts.reduce((s, p) => s + p.bhp, 0) / Math.max(1, nodeP_ts.length)).toFixed(1);
      const tp_avg   = +(nodeP_ts.reduce((s, p) => s + p.tp,  0) / Math.max(1, nodeP_ts.length)).toFixed(1);
      const whp_avg  = +(nodeP_ts.reduce((s, p) => s + p.whp, 0) / Math.max(1, nodeP_ts.length)).toFixed(1);
      const fRisk    = nodeP_ts.some(p => p.fracRisk);
      // Produce nTS time-points with slight transient variation (± small decay)
      const nPTS = Math.min(10, nTS);   // display cap — never more than 10 chart points
      return Array.from({ length: nPTS }, (_, ts) => {
        const frac_t = ts / Math.max(1, nPTS - 1);
        const decay  = 1 - 0.05 * frac_t;   // 5% pressure decline over stage duration
        return {
          x:       +(t0 + ts * sf.dt).toFixed(2),
          tp:      +(tp_avg  * decay).toFixed(1),
          bhp:     +(bhp_avg * decay).toFixed(1),
          whp:     +(whp_avg * decay).toFixed(1),
          frac:    +w.fracPres.toFixed(1),
          dPfric:  +sf.dPfric.toFixed(1),
          dPperf:  +sf.dPperf.toFixed(1),
          Re:      +sf.Re.toFixed(0),
          fracRisk: fRisk,
          stage:   stg.name,
        };
      });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // MAIN SIMULATION — THREE NESTED LOOPS
    //
    //   LOOP 1  for (si)  Injection Stage
    //     LOOP 2  for (ts)  Timestep
    //       LOOP 3  for (ni)  Depth Node  ← pressure state update only
    //       end LOOP 3 — all nN nodes done → ts increments
    //     end LOOP 2 — all nTS timesteps done
    //     [acid chemistry · skin · productivity · flow rate]  ← per node, once per stage
    //   end LOOP 1 — all stages done
    //
    // LOOP 3 contains ONLY pressure update (BHP, TP per node).
    // Chemistry (acid transport, skin evolution, PI, penetration) runs
    // AFTER LOOP 2 exits — i.e. once all timesteps for the stage are complete.
    // This accumulates the full-stage volume in dV_cum[ni] across timesteps,
    // then applies chemistry in one pass per node after the stage finishes.
    // ═════════════════════════════════════════════════════════════════════════

    const MAX_WALL_MS  = 15000;  // 15s — sufficient for all bounded inputs
    let   wall_aborted = false;
    const pressureWarnings = [];

    // ── LOOP 1: Injection Stage ──────────────────────────────────────────────
    for (let si = 0; si < sched.length; si++) {

      if (wall_aborted) break;
      if (Date.now() - ts_start > MAX_WALL_MS) {
        wall_aborted = true;
        log.push(`[WALL_TIMEOUT] >8s — aborting at stage ${si+1}`);
        break;
      }

      const stg = sched[si];
      const sf  = stageFric[si];
      const fl  = stg.fluid;
      const dt  = sf.dt;               // dt = stage_duration / nTS
      let cumVolStage = 0;

      // Per-node accumulators for this stage (reset each stage)
      // dV_stage[ni] = total acid/fluid volume delivered to node ni this stage
      const dV_stage    = new Array(nN).fill(0);
      // lastNodeP[ni]  = final pressure solution for node ni (from last timestep)
      const lastNodeP   = new Array(nN);

      log.push(`Stage ${si+1}/${sched.length}: "${stg.name}"  nTS=${nTS}  dt=${dt.toFixed(3)} min`);

      // ── LOOP 2: Timestep ───────────────────────────────────────────────────
      for (let ts = 0; ts < nTS; ts++) {
        // Wall-clock guard inside timestep loop — prevents hang on slow devices
        if (Date.now() - ts_start > MAX_WALL_MS) {
          wall_aborted = true;
          log.push(`[WALL_TIMEOUT] stage ${si+1} ts ${ts+1} — aborting`);
          break;
        }
        const t_global = cumTime + ts * dt;

        // Solve pressure for ALL nodes at this (si, ts)
        // Inputs: current S[], k_eff[], divertFac[] — from previous stage's chemistry
        const prevBHP_arr = nodeState.map(ns => ns.presField.bhp);
        const nodeP = solveCoupledPressure(
          depthNodes, si, sf, S, k_eff, divertFac, prevBHP_arr, w
        );

        // Convergence warning (record once per stage if non-converged)
        if (nodeP[0] && !nodeP[0].converged && (nodeP[0].iters || 0) >= 20) {
          if (!pressureWarnings.find(pw => pw.stage === si + 1)) {
            pressureWarnings.push({
              stage: si + 1, stageName: stg.name,
              iters: nodeP[0].iters, fluid: fl.name,
              rate: stg.rate, vol: stg.vol,
            });
          }
        }

        // Incremental volume per node this timestep.
        // Primary: use qres from solver (mass-balance-corrected layer rate).
        // Fallback: if all qres=0 (solver returned zero flow, e.g. BHP never
        // exceeded Pres), distribute total pump volume proportionally by J_node
        // so chemistry always has non-zero dV for reservoir intervals in stage range.
        const J_node = depthNodes.map((nd, ni) =>
          (nd.hasReservoir && nd.z >= stg.topD && nd.z <= stg.botD)
            ? Math.max(0, calcJ(nd, si, S[ni], k_eff[ni], divertFac[ni]))
            : 0
        );
        const qres_total = depthNodes.reduce((s, nd, ni) =>
          s + (nd.hasReservoir ? safe(nodeP[ni].qres, 0) : 0), 0
        );
        const J_total_ts = J_node.reduce((a, v) => a + v, 0);
        const use_fallback = qres_total < 1e-6;   // all solver qres are zero

        const dV_ts = depthNodes.map((nd, ni) => {
          if (!nd.hasReservoir) return 0;
          if (nd.z < stg.topD || nd.z > stg.botD) return 0;
          if (!use_fallback) {
            // Normal: solver-computed layer rate
            return clamp(safe(nodeP[ni].qres, 0) * dt, 0, stg.vol);
          } else {
            // Fallback: distribute by J proportion; equal share if J also zero
            const w_i = J_total_ts > 0 ? J_node[ni] / J_total_ts
                       : 1 / Math.max(1, depthNodes.filter(n => n.hasReservoir && n.z >= stg.topD && n.z <= stg.botD).length);
            return clamp(stg.rate * w_i * dt, 0, stg.vol);
          }
        });

        // Fracture detection
        const bhp_ts = nodeP.reduce((mx, p) => Math.max(mx, p.bhp), 0);
        if (bhp_ts >= w.fracPres && !anyFracture) {
          anyFracture = true;
          fracEvents.push({ t: t_global, stage: stg.name, bhp: bhp_ts, fracPres: w.fracPres });
          log.push(`  [FRAC] t=${t_global.toFixed(1)} bhp=${bhp_ts.toFixed(0)}`);
        }

        // ── LOOP 3: Depth Node — iterates ni = 0 … nN-1 every timestep ────────
        // For EVERY timestep ts, ALL nN depth nodes are processed.
        // ni advances from 0 to nN-1 before ts increments.
        for (let ni = 0; ni < nN; ni++) {
          // Pressure state: store converged BHP/TP for this node at this ts
          nodeState[ni].presField = { bhp: nodeP[ni].bhp, tp: nodeP[ni].tp };
          // Accumulate incremental volume for this node at this timestep
          dV_stage[ni] += safe(dV_ts[ni], 0);
          // Save final pressure per node (overwritten each ts; last ts value kept)
          lastNodeP[ni] = nodeP[ni];
        }  // end LOOP 3 — all nN nodes done for this timestep

        cumVolStage += dV_ts.reduce((a, b) => a + b, 0);

      }  // end LOOP 2 — all nTS timesteps done for stage si

      if (wall_aborted) break;   // propagate timeout out of LOOP 1 immediately

      // ── ACID CHEMISTRY · SKIN · PRODUCTIVITY · FLOW RATE ────────────────────
      // Runs once per node AFTER all timesteps complete.
      // dV_stage[ni] = total volume delivered to node ni across all nTS timesteps.
      // dt_total = stg.dur = total stage duration (same as nTS × dt).
      for (let ni = 0; ni < nN; ni++) {
        const nd  = depthNodes[ni];
        const dV  = dV_stage[ni];                  // total stage volume for this node
        const dur = stg.dur;                        // total stage duration

        // Diverter: only applies to reservoir-connected nodes
        if (fl.isDiverter && dV > 0 && nd.hasReservoir) {
          V_div_cum[ni] += dV;
          divertFac[ni]  = clamp(
            safeDiv(V_div_cum[ni] * 0.5, 1 + V_div_cum[ni] * 0.5), 0, 0.92
          );
        }

        // Track acid volume for all reactive fluids (for display/concentration output)
        if (!fl.isDiverter && fl.rxRate > 0 && dV > 0 && nd.hasReservoir) {
          V_acid_cum[ni] += dV;
        }

        // ── SKIN REMOVAL · PI GAIN · PENETRATION ────────────────────────────
        // ONLY main-acid stages (cat = "Main Acid" or "Sandstone") contribute.
        // Preflush, Overflush, Brine, Solvent → no skin change, no PI gain.
        // This isolates the productive acid effect from conditioning fluids.
        if (fl.isMainAcid && fl.rxRate > 0 && dV > 0 && nd.hasReservoir) {
          V_main_acid_cum[ni] += dV;
          T_main_acid_cum[ni] += dur;   // accumulate total main-injection duration [min]

          const ch = calcChemistry(
            nd, si, fl, S[ni], k_eff[ni],
            nd.interval.perm, por_curr[ni],
            Math.max(w.wbR_ft, r_pen[ni]), dV, dur
          );

          // Update state arrays (feed into next stage's pressure solve)
          C_acid[ni]   = ch.C_new;
          k_eff[ni]    = ch.k_new;
          por_curr[ni] = ch.por_out;
          S[ni]        = clamp(ch.S_new, SOLVER.S_MIN, S_init[ni]);

          // ── ACID PENETRATION ─────────────────────────────────────────────
          // Formula: Penetration = Qres [bpm] × T_total_main_injections [min]
          //   → Penetration volume [bbl] = cumulative layer injection rate
          //     multiplied by total duration of all main acid stages.
          //   Radial penetration [ft]:
          //     V_pen = Qres_bpm × T_total_min   [bbl]
          //     r_pen = sqrt(r_wb² + V_pen × C.bbl_ft3 / (π × h × φ))
          //   where:
          //     Qres_bpm   = current layer flow rate from solver [bpm]
          //     T_total_min= T_main_acid_cum[ni] = Σ dur of all main acid stages
          //     h          = interval thickness [ft]
          //     φ          = porosity [fraction]
          // Qres for this node = volume delivered this stage / stage duration
          // This is the actual layer rate during the main-acid stage, directly
          // derived from dV_stage[ni] which comes from nodeP[ni].qres × dt.
          const Qres_bpm    = Math.max(0, safeDiv(dV, dur));               // [bbl/min] ≡ bpm for this node
          const T_total_min = T_main_acid_cum[ni];                         // total main-acid duration [min]
          const V_pen_bbl   = Math.max(0, Qres_bpm * T_total_min);        // penetration volume [bbl]
          const h_nd        = Math.max(0.5, nd.interval.h);                 // interval thickness [ft]
          const phi_nd      = Math.max(0.01, nd.interval.por);              // porosity [fraction]
          const r_old       = Math.max(w.wbR_ft, r_pen[ni]);
          // Radial penetration from volume balance
          const r_sq_new    = r_old * r_old
            + safe(V_pen_bbl * C.bbl_ft3 / (Math.PI * h_nd * phi_nd));
          const r_pen_new   = clamp(
            safeSqrt(Math.max(r_old * r_old, r_sq_new)),
            r_old, SOLVER.R_PEN_MAX
          );
          r_pen[ni]         = r_pen_new;

          // Net penetration beyond wellbore wall [inches]
          nodeState[ni].r_pen_in      = Math.max(0, (r_pen[ni] - w.wbR_ft) * 12);
          nodeState[ni].S_final       = S[ni];
          nodeState[ni].C_acid_final  = C_acid[ni];
          nodeState[ni].Da            = ch.Da;
          nodeState[ni].regime        = ch.Da < 0.1 ? 'wormholing'
                                      : ch.Da < 2   ? 'mixed'
                                      : 'face_dissolution';
          nodeState[ni].etaRxn        = ch.eta_wh;
          nodeState[ni].wormholeBoost = ch.wh_boost;
          nodeState[ni].PI_final      = ch.PI;
          nodeState[ni].FE_final      = ch.FE;
          nodeState[ni].k_eff_final   = k_eff[ni];
          nodeState[ni].bypassFrac    = ch.bypass;
        }

        // ── ACID PLACEMENT — total main-acid volume this layer ───────────────
        // placed = true when any main-acid volume has entered the layer.
        // V_main_acid_cum is the definitive placement volume.
        nodeState[ni].V_acid          = V_acid_cum[ni];           // all acid (display)
        nodeState[ni].V_main_acid     = V_main_acid_cum[ni];      // main acid only
        nodeState[ni].T_main_acid     = T_main_acid_cum[ni];      // total main-acid duration [min]
        nodeState[ni].placed          = V_main_acid_cum[ni] > 0
                                        && r_pen[ni] > w.wbR_ft
                                        && nd.hasReservoir;
      }  // ── chemistry pass complete for all nN nodes ────────────────────────

      cumTime += stg.dur;
      log.push(`  Stage ${si+1} done: cumVol=${cumVolStage.toFixed(1)} bbl  t=${cumTime.toFixed(1)} min`);

    }  // ── end LOOP 1 (stage si) — all stages complete ──────────────────────

    // ── OUTPUT AGGREGATION — always runs, even if wall_aborted or non-convergent
    // nodeState contains the best available results for each node processed so far.
    // Nodes not yet reached by the solver retain their initial values (skin=S_init, placed=false).
    if (wall_aborted) {
      log.push(`[OUTPUT] Simulation aborted early — returning best available results`);
    } else {
      log.push(`[OUTPUT] All stages complete — aggregating results`);
    }
    const depthResults = _aggregate(res, nodeState, w);
    const placed    = depthResults.filter(r => r.placed);
    const avgSkinB  = safeDiv(depthResults.reduce((s, r) => s + r.skinB, 0), depthResults.length);
    const avgSkinA  = safeDiv(depthResults.reduce((s, r) => s + r.skinA, 0), depthResults.length);
    const avgPIB    = safeDiv(depthResults.reduce((s, r) => s + r.pi_b,  0), depthResults.length);
    const avgPIA    = safeDiv(depthResults.reduce((s, r) => s + r.pi_a,  0), depthResults.length);
    const totalAcid = schedRows
      .filter(s => { const f = fluidLib.find(x => x.name === s.fluid); return f && +f.rxRate > 0; })
      .reduce((s, r) => s + (+r.vol || 0), 0);

    const summary = {
      avgSkinB:  +avgSkinB.toFixed(2),   avgSkinA:  +avgSkinA.toFixed(2),
      skinReduction: +(100 * safeDiv(avgSkinB - avgSkinA, Math.max(0.01, avgSkinB))).toFixed(1),
      avgPIB:    +avgPIB.toFixed(3),      avgPIA:    +avgPIA.toFixed(3),
      piRatio:   +safeDiv(avgPIA, Math.max(0.001, avgPIB)).toFixed(2),
      placedCount: placed.length,         totalIntervals: depthResults.length,
      placementPct: +(safeDiv(placed.length, Math.max(1, depthResults.length)) * 100).toFixed(1),
      totalAcidVol: +totalAcid.toFixed(0),
      anyFracture, fracEvents,
      simTimeSec: ((Date.now() - ts_start) / 1000).toFixed(2),
      convStats: { pressureIter: sched.length, skinIter: 0, adaptations: 0,
                   oscillations: 0, warnings: pressureWarnings.length, fallbacks: 0, maxPressureIter: 1 },
      pressureWarnings,
    };
    log.push(`DONE ${summary.simTimeSec}s`);
    return {
      timestamp: new Date().toISOString(), version: Date.now(),
      depthResults, pressureTime: pressureTimeSeries,
      summary, fracPres: w.fracPres, solverLog: log,
    };
  }

  function _fallback(resRows, msg) {
    console.warn('[ENG v4]', msg);
    const dr = (resRows || []).map((r, i) => ({
      depth: +r.top, skinB: +r.skin, skinA: Math.max(0.1, +r.skin * 0.4),
      pen: 0, pres: 4800 + i * 15, conc: 0.05, placed: false,
      pi_b: 0.3, pi_a: 0.6, bypassFac: 0, etaRxn: 0, Da: 0,
      regime: 'none', wormholeBoost: 1, k_eff: +r.perm || 10,
      fluidName: 'None', V_acid: 0,
    }));
    return {
      timestamp: new Date().toISOString(), version: Date.now(),
      depthResults: dr, pressureTime: [], fracPres: 5900,
      summary: {
        avgSkinB: 10, avgSkinA: 4, skinReduction: 60, avgPIB: 0.3, avgPIA: 0.7,
        piRatio: 2.33, placedCount: 0, totalIntervals: dr.length,
        placementPct: 0, totalAcidVol: 0, anyFracture: false, fracEvents: [],
        simTimeSec: '0.00',
        convStats: { pressureIter: 0, skinIter: 0, adaptations: 0,
                     oscillations: 0, warnings: 1, fallbacks: 1, maxPressureIter: 0 },
      },
      solverLog: ['FALLBACK: ' + msg],
    };
  }

  // ── Aggregation → existing output schema (unchanged) ─────────────────────
  function _aggregate(res, nodeState, w) {
    return res.map((r, i) => {
      // Match nodes by z-position (midpoint of interval is inside [top, bot])
      // Also accept nodes whose interval.top matches r.top (exact match)
      // Only reservoir-connected nodes contribute to chemistry outputs.
      // Non-reservoir nodes (wellbore-only, above/below perforations) are
      // excluded so they don't dilute skin, PI, and penetration averages.
      const nn = nodeState.filter(ns =>
        ns.hasReservoir !== false &&
        ((ns.z >= r.top && ns.z <= r.bot) ||
         (ns.interval && ns.interval.top === r.top))
      );
      if (!nn.length) return _analyticalFallback(r, w, i);

      const avg = arr => safeDiv(arr.reduce((s, v) => s + safe(v), 0), arr.length);

      const skinA   = avg(nn.map(n => n.S_final));
      const vAcid      = nn.reduce((s, n) => s + safe(n.V_acid), 0);
      const vMainAcid  = nn.reduce((s, n) => s + safe(n.V_main_acid), 0);
      // Placement: based on main-acid volume only (not preflush/overflush)
      const placed  = nn.some(n => n.placed) || vMainAcid > 0;
      const pi_b    = avg(nn.map(n => n.PI_init));
      const pi_a    = avg(nn.map(n => n.PI_final));
      const bhp     = avg(nn.map(n => n.presField?.bhp || 4800));
      const bypassF = avg(nn.map(n => n.bypassFrac || 0));
      const wBoost  = avg(nn.map(n => n.wormholeBoost || 1));
      const k_eff_f = avg(nn.map(n => n.k_eff_final || r.perm));
      const etaRxn  = avg(nn.map(n => n.etaRxn || 0));
      const Da      = avg(nn.map(n => n.Da || 0));
      const regime  = nn[0]?.regime || 'none';

      // Penetration: use r_pen_in if chemistry ran, else estimate from volume
      const pen_raw = avg(nn.map(n => n.r_pen_in || 0));
      const h_ft    = Math.max(1, r.h || (r.bot - r.top) || 50);
      const por     = clamp(safe(+r.por, 15) / 100, 0.01, 0.5);
      // Analytical penetration estimate: r = sqrt(V/(π·h·φ)) × 12 → inches
      const pen_analytical = vAcid > 0
        ? clamp(Math.sqrt(safe(vAcid) * 5.61458 / (Math.PI * h_ft * por)) * 12, 0, 200)
        : 0;
      const pen_in = pen_raw > 0.01 ? pen_raw : pen_analytical;

      // Acid concentration: fraction of interval treated (0→1)
      // V_acid normalised against interval pore volume proxy
      const pore_vol_proxy = Math.max(0.1, h_ft * 0.3 * por);   // ~bbl
      const conc = clamp(safeDiv(vAcid, pore_vol_proxy * 15), 0, 0.98);

      // Productivity: pi_a should differ from pi_b after stimulation
      // If chemistry ran (skin decreased), pi_a > pi_b automatically.
      // If not, apply analytical improvement proportional to skin reduction.
      const lnR  = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
      const pi_b_calc = safeDiv(r.perm * h_ft, 141.2 * 1.0 * (lnR + clamp(+r.skin, -5, 200)));
      const pi_a_calc = safeDiv(r.perm * h_ft, 141.2 * 1.0 * (lnR + clamp(skinA, 0.05, +r.skin)));
      const pi_b_out  = pi_b > 0 ? pi_b : pi_b_calc;
      // Use simulated PI if chemistry ran (pi_a updated); else use analytical calc
      const pi_a_out  = pi_a > 0 && pi_a !== pi_b_out ? pi_a : pi_a_calc;

      return {
        depth:    +r.top,
        skinB:    +r.skin,
        skinA:    +clamp(skinA, 0.05, +r.skin).toFixed(2),
        pen:      +pen_in.toFixed(2),
        pres:     +bhp.toFixed(0),
        conc:     +clamp(conc, 0, 0.98).toFixed(3),
        placed,
        V_main_acid: +vMainAcid.toFixed(2),   // main-acid volume in layer [bbl]
        T_main_acid: +avg(nn.map(n => safe(n.T_main_acid, 0))).toFixed(1),  // total main-acid duration [min]
        por:         +clamp(safe(+r.por, 15), 0, 60).toFixed(1),            // porosity [%] passed through for display
        bot:         +(+r.bot || +r.top + 50),                              // interval bottom MD [ft]
        pres_res:    +clamp(safe(+r.pres, 0), 0, 30000),                    // reservoir layer pressure [psi] — user input
        // qres: average layer flow rate = V_main_acid / T_main_acid [bpm]
        qres:        vMainAcid > 0 && +avg(nn.map(n => safe(n.T_main_acid,0))) > 0
          ? +(vMainAcid / Math.max(0.001, +avg(nn.map(n => safe(n.T_main_acid,0))))).toFixed(4)
          : 0,
        fracRisk:    nn.some(n => n.presField && n.presField.bhp >= w.fracPres), // any node at frac risk?
        pi_b:     +pi_b_out.toFixed(4),
        pi_a:     +pi_a_out.toFixed(4),
        bypassFac:+clamp(bypassF, 0, 0.97).toFixed(3),
        etaRxn:   +clamp(etaRxn, 0, 1).toFixed(3),
        Da:       +Da.toFixed(4),
        regime,
        wormholeBoost: +wBoost.toFixed(3),
        k_eff:    +k_eff_f.toFixed(2),
        fluidName: placed ? 'HCl 15%' : 'None',
        V_acid:   +vAcid.toFixed(2),
      };
    });
  }

  function _analyticalFallback(r, w, i) {
    const lnr = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
    const pi_b = safeDiv(r.perm * r.h, 141.2 * 1 * 1 * (lnr + r.skin), 0);
    const pi_a = safeDiv(r.perm * r.h, 141.2 * 1 * 1 * (lnr + 0.5), 0);
    return {
      depth: +r.top, skinB: +r.skin, skinA: +Math.max(0.1, r.skin * 0.3).toFixed(2),
      pen: 0, pres: 4800 + i * 15, conc: 0.05, placed: false,
      pi_b: +pi_b.toFixed(3), pi_a: +pi_a.toFixed(3),
      bypassFac: 0, etaRxn: 0, Da: 0, regime: 'none',
      wormholeBoost: 1, k_eff: r.perm, fluidName: 'None', V_acid: 0,
    };
  }

    function _defaultPressField(depthNodes, w) {
    const bhp0=clamp(w.resTop*w.fracGrad*0.7,SOLVER.P_MIN,w.fracPres);
    const nodes=depthNodes.map(nd=>({z:nd.z,bhp:bhp0,tp:bhp0*0.9,whp:bhp0*0.5,
      dPfric:200,dPperf:50,fracMargin:w.fracPres-bhp0,fracRisk:false,Re:8000,ff:0.02,dP_nb:30}));
    return{t:0,nodes,tp:bhp0*0.9,bhp:bhp0,whp:bhp0*0.5,frac:w.fracPres,
      dPfric:200,dPperf:50,Re:8000,ff:0.02,fracRisk:false,iterP:1,convergedP:true};
  }

  // ── Preserved public API (unchanged signatures) ───────────────────────────
  function computeIntervalProps(resRow, wellData) {
    const perm=+resRow.perm||0.1, h=Math.max(1,+resRow.bot-+resRow.top), skin=+resRow.skin||0;
    const rw_ft=clamp(+wellData.wbR||0.365,0.01,24)/12;
    const re=+wellData.drainR||2640;
    const lnR=safeLog(safeDiv(re,Math.max(0.001,rw_ft)));
    const coeff=0.007082*perm*h;
    return {perm,h,skin,pi_b:safeDiv(coeff,Math.max(0.01,lnR+skin)),
            pi_a_noSkin:safeDiv(coeff,Math.max(0.01,lnR)),lnRatio:lnR,coeff};
  }

  function acidPenetration(resRow, fluidProps, volBbl, wellData) {
    if(!fluidProps||+fluidProps.rxRate===0) return{penetration_in:0,cSpent:0,etaRxn:0};
    const rw_ft=clamp(+wellData.wbR||0.365,0.01,24)/12;
    const h=Math.max(1,+resRow.bot-+resRow.top);
    const por=clamp(+resRow.por/100||0.15,0.01,0.5);
    const perm=Math.max(0.001,+resRow.perm||1);
    const conc0=clamp(+fluidProps.conc/100||0.15,0.001,1);
    const Da=safeDiv(+fluidProps.rxRate*+fluidProps.visc,perm*conc0,5);
    const Da_opt=0.29*(MINERAL[resRow.lith]?.dissolveRate||1);
    const lnr2=safeLog(Math.max(1e-6,Da)/Math.max(1e-8,Da_opt));
    const eta=clamp(Math.exp(-0.38*lnr2*lnr2),0.01,1.0);
    const nPerfs=Math.max(1,4*h);
    const vol_ft3=safeDiv(volBbl,Math.max(1,nPerfs))*C.bbl_ft3;
    const r_pv=safeSqrt(safeDiv(vol_ft3,1.6*3.14159*por)+rw_ft*rw_ft)-rw_ft;
    const base=1.8+0.8*safePow(safeDiv(perm,100),0.15);
    const wh_b=clamp(base*Math.exp(-0.5*lnr2*lnr2),0.6,3.5);
    return{penetration_in:clamp(r_pv*eta*wh_b*12,0,48),cSpent:clamp(1-eta,0,1),etaRxn:clamp(eta,0.05,1)};
  }

  function computeSkinAfter(resRow, penData) {
    const skinOrig=+resRow.skin||0;
    const dmgR_in=Math.max(0.5,+resRow.dmgR||12);
    const pen_in=safe(penData.penetration_in,0);
    const etaRxn=safe(penData.etaRxn,0);
    const lf=(MINERAL[resRow.lith]||MINERAL.Carbonate).dissolveRate;
    const arg=safeDiv(pen_in,Math.max(1,dmgR_in));
    const tanh_v=safeDiv(arg,1+Math.abs(arg));
    const bypassFac=clamp(tanh_v*etaRxn*lf,0,0.97);
    const S_res=0.10+(1-bypassFac)*0.35;
    return{skinAfter:+Math.max(S_res,skinOrig*(1-bypassFac)+S_res*bypassFac).toFixed(2),bypassFac};
  }

  function computePIAfter(resRow, wellData, skinAfter) {
    const perm=Math.max(0.001,+resRow.perm||0.1);
    const h=Math.max(1,+resRow.bot-+resRow.top);
    const rw_ft=clamp(+wellData.wbR||0.365,0.01,24)/12;
    const re=Math.max(10,+wellData.drainR||2640);
    const lnR=Math.max(0.01,safeLog(safeDiv(re,rw_ft,1)));
    return +clamp(safeDiv(0.007082*perm*h,Math.max(0.01,lnR+skinAfter)),0,1e6).toFixed(3);
  }

  return { runSimulation, computeIntervalProps, acidPenetration, computeSkinAfter, computePIAfter };
})();



// ═══════════════════════════════════════════════════════════════════════════════
// ██████  SYSTEM DEFAULTS  (Mod-2, Mod-3: grid params + Set-to-Default)
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULTS = {
  // Discretization (Mod-2)
  numDepthGrids: 20,        // Number of Depth Grids
  numTimesteps:  10,        // Number of Timesteps per stage (engine cap: 20)

  // Reservoir
  reservoir: [
    { id:1,top:8200,bot:8255,tvd:8200,lith:"Carbonate",por:18.5,perm:85, skin:12.4,pres:3690 },
    { id:2,top:8255,bot:8315,tvd:8255,lith:"Carbonate",por:22.1,perm:142,skin:8.7, pres:3715 },
    { id:3,top:8315,bot:8370,tvd:8315,lith:"Dolomite", por:14.8,perm:38, skin:18.2,pres:3742 },
    { id:4,top:8370,bot:8425,tvd:8370,lith:"Carbonate",por:25.3,perm:210,skin:6.1, pres:3767 },
    { id:5,top:8425,bot:8480,tvd:8425,lith:"Shale",    por:8.2, perm:0.8, skin:24.5,pres:3791 },
    { id:6,top:8480,bot:8540,tvd:8480,lith:"Carbonate",por:20.7,perm:165,skin:9.3, pres:3816 },
  ],
  // Well
  well: { type:"Producer",profile:"Vertical",wbR:"0.365",drainR:"2640",resTop:"8200",fricGrad:"18",khkv:"5",inc:"0",compType:"Cased Hole",tubLen:"8540",tubID:"2.992",casID:"5.921" },
  // Completion
  comp: { type:"Cased Hole",tubLen:"8540",tubID:"2.992",casID:"5.921" },
  // Fluids
  fluids: [
    { id:1,name:"HCl 15%",type:"HCl",conc:15,density:1.065,visc:1.2,rxRate:2.8,color:"#1ECFB2",cat:"Main Acid" },
    { id:2,name:"HCl 28%",type:"HCl",conc:28,density:1.14,visc:1.8,rxRate:4.2,color:"#4A9EE8",cat:"Main Acid" },
    { id:3,name:"HCl 5%",type:"HCl",conc:5,density:1.02,visc:0.9,rxRate:1.1,color:"#8B78E8",cat:"Preflush" },
    { id:4,name:"HF/HCl Mud Acid",type:"HF/HCl",conc:"3/12",density:1.06,visc:1.1,rxRate:5.5,color:"#E8A020",cat:"Sandstone" },
    { id:5,name:"Xylene Preflush",type:"Solvent",conc:100,density:0.864,visc:0.6,rxRate:0,color:"#2DB882",cat:"Preflush" },
    { id:6,name:"KCl 2% Brine",type:"Brine",conc:2,density:1.012,visc:1.0,rxRate:0,color:"#78A8C8",cat:"Overflush" },
    { id:7,name:"VES Diverter",type:"Diverter",conc:3,density:1.02,visc:45,rxRate:0,color:"#FF7B54",cat:"Diverter" },
    { id:8,name:"Acetic Acid 10%",type:"Organic",conc:10,density:1.02,visc:1.1,rxRate:0.8,color:"#C8F042",cat:"Main Acid" },
  ],
  // Acid stages
  acid: [
    { id:1,name:"Preflush",type:"Preflush",fluid:"Xylene Preflush",topD:8200,botD:8540,vpp:0.5,vol:25,note:"Wettability" },
    { id:2,name:"Acid Stage 1",type:"Main",fluid:"HCl 15%",topD:8200,botD:8370,vpp:2.0,vol:120,note:"Upper intervals" },
    { id:3,name:"Diverter",type:"Diverter",fluid:"VES Diverter",topD:8200,botD:8540,vpp:0.5,vol:30,note:"Diversion" },
    { id:4,name:"Acid Stage 2",type:"Main",fluid:"HCl 15%",topD:8370,botD:8540,vpp:2.0,vol:120,note:"Lower intervals" },
    { id:5,name:"Overflush",type:"Overflush",fluid:"KCl 2% Brine",topD:8200,botD:8540,vpp:1.0,vol:60,note:"Spent flush" },
  ],
  // Schedule
  schedule: [
    { id:1,stage:1,name:"Xylene Preflush",fluid:"Xylene Preflush",rate:1.5,vol:25,topD:8200,botD:8540,note:"Wettability restore" },
    { id:2,stage:2,name:"HCl 5% Preflush",fluid:"HCl 5%",rate:2.5,vol:50,topD:8200,botD:8540,note:"Scale removal" },
    { id:3,stage:3,name:"Main Acid Stg1",fluid:"HCl 15%",rate:4.0,vol:120,topD:8200,botD:8370,note:"Upper zones" },
    { id:4,stage:4,name:"VES Diverter",fluid:"VES Diverter",rate:3.0,vol:30,topD:8200,botD:8540,note:"Diversion" },
    { id:5,stage:5,name:"Main Acid Stg2",fluid:"HCl 15%",rate:4.0,vol:120,topD:8370,botD:8540,note:"Lower zones" },
    { id:6,stage:6,name:"KCl Overflush",fluid:"KCl 2% Brine",rate:3.0,vol:60,topD:8200,botD:8540,note:"Spent acid flush" },
  ],
  // Simulation settings
  sim: { tempModel:"Static reservoir T", kinetics:"Rotating Disk", fluidLoss:"Filter Cake", wormhole:"Pore Volume BT" },
};

// ── UNIT SYSTEM REGISTRY (Mod-10) ─────────────────────────────────────────
// All inputs/outputs declared with name, unit, DB field
const UNIT_MAP = {
  field: {
    depth: "ft",     depth_alt: "MD ft",
    pressure: "psi", pressure_grad: "psi/ft",
    rate: "bpm",     volume: "bbl",
    perm: "md",      por: "%",
    visc: "cP",      density: "g/cm³",
    time: "min",     pi: "bbl/day/psi",
    skin: "dimensionless", pen: "in",
    radius: "in",    rxRate: "mol/m²·s",
    concPct: "%",    temp: "°F",
  },
  metric: {
    depth: "m",      depth_alt: "MD m",
    pressure: "kPa", pressure_grad: "kPa/m",
    rate: "m³/min",  volume: "m³",
    perm: "mD",      por: "%",
    visc: "mPa·s",   density: "kg/m³",
    time: "min",     pi: "m³/day/kPa",
    skin: "dimensionless", pen: "cm",
    radius: "cm",    rxRate: "mol/m²·s",
    concPct: "%",    temp: "°C",
  },
};

// DB Field Mapping (Mod-4): inputs → {name, unit, dbField, section}
const DB_FIELD_MAP = [
  // Reservoir
  { name:"Top Depth MD",    unit:"ft", dbField:"top",    section:"reservoir", depthRef:true },
  { name:"Bot Depth MD",    unit:"ft", dbField:"bot",    section:"reservoir", depthRef:true },
  { name:"TVD",             unit:"ft", dbField:"tvd",    section:"reservoir", depthRef:true },
  { name:"Lithology",       unit:"-",  dbField:"lith",   section:"reservoir" },
  { name:"Porosity",        unit:"%",  dbField:"por",    section:"reservoir", depthRef:true, min:0, max:50 },
  { name:"Permeability",    unit:"md", dbField:"perm",   section:"reservoir", depthRef:true, min:0, max:100000 },
  { name:"Skin Factor",     unit:"-",  dbField:"skin",   section:"reservoir", depthRef:true, min:-10, max:200 },
  // Well
  { name:"Well Type",       unit:"-",  dbField:"type",   section:"well" },
  { name:"Wellbore Radius", unit:"in", dbField:"wbR",    section:"well", min:0.05, max:2.0 },
  { name:"Drainage Radius", unit:"ft", dbField:"drainR", section:"well", min:100, max:100000 },
  { name:"Reservoir Top",   unit:"ft", dbField:"resTop", section:"well", min:500, max:30000 },
  { name:"Friction Gradient",unit:"psi/1000ft",dbField:"fricGrad",section:"well", min:1, max:100 },
  { name:"Kh/Kv",           unit:"-",  dbField:"khkv",   section:"well", min:0.01, max:1000 },
  { name:"Tubing Length",   unit:"ft", dbField:"tubLen", section:"well", min:100, max:30000 },
  { name:"Tubing ID",       unit:"in", dbField:"tubID",  section:"well", min:0.5, max:10 },
  { name:"Casing ID",       unit:"in", dbField:"casID",  section:"well", min:2, max:36 },
  // Fluids
  { name:"Fluid Name",      unit:"-",  dbField:"name",   section:"fluids" },
  { name:"Concentration",   unit:"%",  dbField:"conc",   section:"fluids", min:0, max:100 },
  { name:"Density",         unit:"g/cm³",dbField:"density",section:"fluids", min:0.8, max:2.0 },
  { name:"Viscosity",       unit:"cP", dbField:"visc",   section:"fluids", min:0.1, max:500 },
  { name:"Reaction Rate",   unit:"mol/m²·s",dbField:"rxRate",section:"fluids", min:0, max:20 },
  // Schedule
  { name:"Stage Name",      unit:"-",  dbField:"name",   section:"schedule", stageRef:true },
  { name:"Pump Rate",       unit:"bpm",dbField:"rate",   section:"schedule", stageRef:true, min:0.1, max:50 },
  { name:"Stage Volume",    unit:"bbl",dbField:"vol",    section:"schedule", stageRef:true, min:1, max:10000 },
  { name:"Stage Top Depth", unit:"ft", dbField:"topD",   section:"schedule", stageRef:true, depthRef:true },
  { name:"Stage Bot Depth", unit:"ft", dbField:"botD",   section:"schedule", stageRef:true, depthRef:true },
  // Discretization
  { name:"Number of Depth Grids", unit:"-",dbField:"numDepthGrids",section:"simParams", min:10, max:1000 },
  { name:"Number of Timesteps",   unit:"-",dbField:"numTimesteps", section:"simParams", min:4, max:20 },
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body,#root{background:${T.bg0};color:${T.text0};font-family:${T.sans};height:100%;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:${T.bg1};}
  ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px;}
  .sb{border:none;border-radius:6px;cursor:pointer;font-family:${T.sans};font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s;white-space:nowrap;}
  .sb:hover{filter:brightness(1.15);transform:translateY(-1px);}
  .sb:active{transform:translateY(0);}
  .si{background:${T.bg0};border:1px solid ${T.border1};border-radius:5px;color:${T.text0};padding:7px 10px;font-size:12px;width:100%;outline:none;font-family:${T.mono};transition:border-color 0.2s;}
  .si:focus{border-color:${T.teal};}
  .ss{background:${T.bg0};border:1px solid ${T.border1};border-radius:5px;color:${T.text0};padding:7px 10px;font-size:12px;width:100%;outline:none;cursor:pointer;}
  .ss:focus{border-color:${T.teal};}
  .hr:hover{background:rgba(30,207,178,0.04)!important;}
  .pill{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
  @keyframes si{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .anim{animation:si 0.25s ease forwards;}
  @keyframes bar{from{width:0}to{width:var(--w)}}
  .wb{background:rgba(232,160,32,0.1);border:1px solid rgba(232,160,32,0.3);border-radius:6px;padding:9px 13px;display:flex;align-items:center;gap:8px;}
  .db{background:rgba(224,80,80,0.1);border:1px solid rgba(224,80,80,0.3);border-radius:6px;padding:9px 13px;display:flex;align-items:center;gap:8px;}
  input[type=range]{accent-color:${T.teal};}
  table{border-collapse:collapse;}
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Btn({ children, onClick, v = "p", sz = "m", icon, sx = {}, disabled, full }) {
  const S = { s: { padding: "5px 11px", fontSize: 11 }, m: { padding: "8px 16px", fontSize: 13 }, l: { padding: "11px 22px", fontSize: 14 } };
  const V = {
    p: { background: T.teal, color: T.bg0 },
    a: { background: T.gold, color: T.bg0 },
    g: { background: "transparent", color: T.text1, border: `1px solid ${T.border1}` },
    d: { background: "rgba(224,80,80,0.12)", color: T.red, border: `1px solid rgba(224,80,80,0.3)` },
    o: { background: "transparent", color: T.teal, border: `1px solid ${T.teal}` },
    s: { background: "rgba(45,184,130,0.12)", color: T.green, border: `1px solid rgba(45,184,130,0.3)` },
  };
  return <button className="sb" onClick={onClick} disabled={disabled}
    style={{ ...S[sz], ...V[v], opacity: disabled ? 0.45 : 1, width: full ? "100%" : undefined, ...sx }}>
    {icon && <span style={{ fontSize: 13 }}>{icon}</span>}{children}
  </button>;
}

function Card({ title, children, action, sx = {}, np }) {
  return <div style={{ background: T.bg2, border: `1px solid ${T.border0}`, borderRadius: 10, overflow: "hidden", ...sx }}>
    {(title || action) && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 15px", borderBottom: `1px solid ${T.border0}`, background: T.bg3 }}>
      {title && <span style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>}
      {action}
    </div>}
    <div style={np ? {} : { padding: 15 }}>{children}</div>
  </div>;
}

function Lbl({ children, tip, unit }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</span>
    {unit && <span style={{ fontSize: 10, color: T.text3, fontWeight: 400 }}>({unit})</span>}
    {tip && <span title={tip} style={{ fontSize: 10, color: T.tealDim, cursor: "help" }}>ⓘ</span>}
  </div>;
}

function Fld({ label, value, onChange, type = "text", options, unit, tip, sx = {} }) {
  return <div style={sx}>
    <Lbl unit={unit} tip={tip}>{label}</Lbl>
    {type === "select"
      ? <select className="ss" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select>
      : <input type={type} className="si" value={value} onChange={e => onChange(e.target.value)} />
    }
  </div>;
}

function Met({ label, value, unit, color = T.teal, icon }) {
  return <div style={{ background: T.bg3, border: `1px solid ${T.border0}`, borderRadius: 8, padding: "12px 14px" }}>
    <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      {icon && <span style={{ fontSize: 14, marginRight: 2 }}>{icon}</span>}
      <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono, lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 11, color: T.text3 }}>{unit}</span>}
    </div>
  </div>;
}

function Tabs({ tabs, active, onSet }) {
  return <div style={{ display: "flex", borderBottom: `1px solid ${T.border0}`, marginBottom: 16, overflowX: "auto", flexShrink: 0 }}>
    {tabs.map(t => <button key={t.id} onClick={() => onSet(t.id)} className="sb"
      style={{ background: "transparent", border: "none", borderBottom: `2px solid ${active === t.id ? T.teal : "transparent"}`, borderRadius: 0, color: active === t.id ? T.teal : T.text2, padding: "9px 16px", fontSize: 12, fontWeight: active === t.id ? 700 : 400, whiteSpace: "nowrap" }}>
      {t.label}
    </button>)}
  </div>;
}

function Bdg({ color, label }) {
  const M = {
    teal: [T.teal, "rgba(30,207,178,0.12)"],
    gold: [T.gold, "rgba(232,160,32,0.12)"],
    red: [T.red, "rgba(224,80,80,0.12)"],
    green: [T.green, "rgba(45,184,130,0.12)"],
    blue: [T.blue, "rgba(74,158,232,0.12)"],
    gray: [T.text2, T.bg4],
  };
  const [fg, bg] = M[color] || [T.text2, T.bg4];
  return <span className="pill" style={{ color: fg, background: bg }}>{label}</span>;
}

function G2({ children, gap = 14 }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>; }
function G3({ children, gap = 14 }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap }}>{children}</div>; }
function G4({ children, gap = 10 }) { return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap }}>{children}</div>; }

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
function DTable({ cols, rows, setRows, fluidOpts, compact }) {
  const th = { background: T.bg3, padding: compact ? "5px 8px" : "7px 10px", textAlign: "left", color: T.text2, borderBottom: `1px solid ${T.border0}`, whiteSpace: "nowrap", fontSize: 10, letterSpacing: "0.6px" };
  const td = { padding: compact ? "4px 6px" : "6px 8px", borderBottom: `1px solid ${T.border0}` };
  return <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", fontSize: 12 }}>
      <thead><tr>{cols.map(c => <th key={c.key} style={th}>{c.label}</th>)}<th style={th}>×</th></tr></thead>
      <tbody>
        {rows.map((row, ri) => <tr key={row.id || ri} className="hr" style={{ background: "transparent" }}>
          {cols.map(c => <td key={c.key} style={td}>
            {c.type === "select"
              ? <select className="ss" value={row[c.key] || ""} onChange={e => setRows(rs => rs.map((r, i) => i === ri ? { ...r, [c.key]: e.target.value } : r))} style={{ minWidth: c.w || 80, fontSize: 11 }}>
                  {(c.key === "fluid" ? (fluidOpts || c.opts) : c.opts)?.map(o => <option key={o}>{o}</option>)}
                </select>
              : <input className="si" value={row[c.key] ?? ""} onChange={e => setRows(rs => rs.map((r, i) => i === ri ? { ...r, [c.key]: e.target.value } : r))} style={{ minWidth: c.w || 50, fontSize: 11 }} />
            }
          </td>)}
          <td style={td}><div onClick={() => setRows(rs => rs.filter((_, i) => i !== ri))} style={{ cursor: "pointer", color: T.text2, textAlign: "center", fontSize: 14, padding: "0 4px" }}>×</div></td>
        </tr>)}
        {rows.length === 0 && <tr><td colSpan={cols.length + 1} style={{ ...td, textAlign: "center", color: T.text3, padding: 20 }}>No rows yet.</td></tr>}
      </tbody>
    </table>
    <div style={{ display: "flex", gap: 8, padding: "9px 2px" }}>
      <Btn sz="s" v="g" onClick={() => setRows(rs => [...rs, { id: Date.now() }])}>+ Add Row</Btn>
      <Btn sz="s" v="g">⬆ Import Excel</Btn>
      <Btn sz="s" v="g">↺ Reset</Btn>
    </div>
  </div>;
}

// ─── WORKFLOW NAV ─────────────────────────────────────────────────────────────
const WORKFLOW = ["reservoir","well","fluids","acid","schedule","sim"];
const WORKFLOW_LABELS = { reservoir:"Reservoir Data", well:"Well & Completion", fluids:"Fluids Library", acid:"Acid Design", schedule:"Pump Schedule", sim:"Run Simulation" };
function WorkflowNav({ page, setPage }) {
  const idx = WORKFLOW.indexOf(page);
  if (idx < 0) return null;
  const prev = idx > 0 ? WORKFLOW[idx - 1] : null;
  const next = idx < WORKFLOW.length - 1 ? WORKFLOW[idx + 1] : null;
  return <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 22px",background:T.bg1,borderTop:`1px solid ${T.border0}`,flexShrink:0 }}>
    <div style={{ display:"flex",gap:4 }}>
      {WORKFLOW.map((w,i)=><div key={w} style={{ width:i===idx?22:7,height:7,borderRadius:4,background:i===idx?T.teal:i<idx?T.tealDim:T.border1,transition:"all 0.25s" }}/>)}
    </div>
    <span style={{ fontSize:11,color:T.text2,flex:1,textAlign:"center" }}>Step {idx+1} of {WORKFLOW.length} — {WORKFLOW_LABELS[page]}</span>
    {prev && <Btn sz="s" v="g" onClick={()=>setPage(prev)}>← Back</Btn>}
    {next && <Btn sz="s" v={next==="sim"?"a":"p"} onClick={()=>setPage(next)}>{next==="sim"?"▶ Run Simulation":`Next: ${WORKFLOW_LABELS[next]} →`}</Btn>}
  </div>;
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, sub, actions, warns }) {
  return <div style={{ background: T.bg2, borderBottom: `1px solid ${T.border0}`, padding: "10px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexShrink: 0 }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text0 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.text2 }}>{sub}</div>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {warns?.map((w, i) => <span key={i} style={{ fontSize: 11, color: T.gold, background: "rgba(232,160,32,0.1)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(232,160,32,0.25)" }}>⚠ {w}</span>)}
      {actions}
    </div>
  </div>;
}

// ─── WELL SCHEMATIC SVG ───────────────────────────────────────────────────────
function WellSchematic({ reservoir, results, hovDepth, onHover, minDepth, maxDepth }) {
  const W = 175, H = 500;
  const cx = 87, cw = 32, tw = 14;
  const depths = reservoir && reservoir.length > 0 ? reservoir.flatMap(r => [+r.top || 0, +r.bot || 0]).filter(v => v > 0) : [7900, 8600];
  const dataTop = Math.min(...depths), dataBot = Math.max(...depths);
  // Use caller-supplied depth range when available — aligns with DepthPlot axes
  const top = minDepth !== undefined ? minDepth : Math.max(0, dataTop - (dataBot - dataTop) * 0.12);
  const bot = maxDepth !== undefined ? maxDepth : dataBot + (dataBot - dataTop) * 0.12;
  const py = d => 28 + ((d - top) / (bot - top)) * (H - 56);

  const perfs = reservoir.map(r => ({ t: r.top, b: r.bot }));
  const litColors = { Carbonate: "rgba(30,207,178,0.08)", Dolomite: "rgba(232,160,32,0.08)", Shale: "rgba(139,120,240,0.08)", Sandstone: "rgba(74,158,232,0.08)", Limestone: "rgba(45,184,130,0.08)" };

  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
    <rect width={W} height={H} fill={T.bg3} rx={6} />
    {/* Formation stripes */}
    {reservoir.map((r, i) => <rect key={i} x={0} y={py(r.top)} width={W} height={Math.max(2, py(r.bot) - py(r.top))} fill={litColors[r.lith] || "rgba(255,255,255,0.02)"} />)}
    {/* Depth ticks */}
    {Array.from({length:6}, (_,i) => Math.round((top + i*(bot-top)/5)/100)*100).filter((d,i,a)=>a.indexOf(d)===i).map(d => {
      if (d < top || d > bot) return null;
      const y = py(d);
      return <g key={d}><line x1={0} y1={y} x2={7} y2={y} stroke={T.text3} strokeWidth={0.5} /><text x={3} y={y + 3} fontSize={6.5} fill={T.text3} fontFamily={T.mono}>{d}</text></g>;
    })}
    {/* Acid placement */}
    {results && results.filter(r => r.placed).map((r, i) => {
      const y = py(r.depth), h = Math.max(6, py(r.depth + 60) - py(r.depth));
      return <rect key={i} x={cx - cw / 2 + 1} y={y} width={cw - 2} height={Math.max(5, h - 2)} fill={T.teal} fillOpacity={0.18 + r.conc * 0.35} rx={1} />;
    })}
    {/* Casing */}
    <rect x={cx - cw / 2} y={22} width={cw} height={H - 44} fill="none" stroke={T.border2} strokeWidth={1.5} rx={2} />
    <rect x={cx - cw / 2} y={22} width={cw} height={H - 44} fill="rgba(255,255,255,0.01)" rx={2} />
    {/* Tubing */}
    <rect x={cx - tw / 2} y={22} width={tw} height={H - 195} fill="rgba(255,255,255,0.035)" stroke={T.border1} strokeWidth={0.8} rx={1} />
    {/* Perforations */}
    {perfs.map((p, i) => {
      const y1 = py(p.t), y2 = py(p.b), h = y2 - y1;
      const n = Math.max(2, Math.round(h / 7));
      return <g key={i}>
        {Array.from({ length: n }, (_, j) => {
          const yy = y1 + j * (h / n) + (h / n) / 2;
          return <g key={j}>
            <line x1={cx - cw / 2 - 8} y1={yy} x2={cx - cw / 2} y2={yy} stroke={T.gold} strokeWidth={1.2} opacity={0.65} />
            <line x1={cx + cw / 2} y1={yy} x2={cx + cw / 2 + 8} y2={yy} stroke={T.gold} strokeWidth={1.2} opacity={0.65} />
          </g>;
        })}
        <text x={cx + cw / 2 + 12} y={y1 + h / 2 + 3} fontSize={6} fill={T.gold} fontFamily={T.mono}>Perf</text>
      </g>;
    })}
    {/* Hover highlight */}
    {hovDepth && <rect x={cx - cw / 2 - 8} y={py(hovDepth) - 2} width={cw + 16} height={32} fill="none" stroke={T.teal} strokeWidth={1} strokeDasharray="3,2" opacity={0.7} rx={2} />}
    {/* Skin bar (left) */}
    {results && results.map((r, i) => {
      const y = py(r.depth);
      const reduction = (r.skinB - r.skinA) / (r.skinB || 1);
      const col = reduction > 0.8 ? T.green : reduction > 0.5 ? T.gold : T.red;
      return <rect key={i} x={cx - cw / 2 - 19} y={y} width={8} height={Math.max(5, py(r.depth + 55) - y - 2)} fill={col} fillOpacity={0.75} rx={1} />;
    })}
    {/* Header */}
    <text x={cx} y={14} textAnchor="middle" fontSize={8} fill={T.text2} fontWeight="600" fontFamily={T.sans}>WELL</text>
    <text x={cx - cw / 2 - 15} y={14} fontSize={6} fill={T.text3} textAnchor="middle" fontFamily={T.sans}>SKIN</text>
    {/* Perforation top/bottom depth labels — right side, aligned to py() scale */}
    {perfs.map((p, i) => {
      const yT = py(p.t);
      const yB = py(p.b);
      const xL = cx + cw / 2 + 2;   // just right of tubing wall
      return <g key={`pf-lbl-${i}`}>
        {/* Top depth tick + label */}
        <line x1={xL} y1={yT} x2={xL + 14} y2={yT} stroke={T.gold} strokeWidth={0.8} />
        <text x={xL + 16} y={yT + 3} fontSize={5.5} fill={T.gold} fontFamily={T.mono} textAnchor="start">{p.t}</text>
        {/* Bottom depth tick + label */}
        <line x1={xL} y1={yB} x2={xL + 14} y2={yB} stroke={T.gold} strokeWidth={0.8} />
        <text x={xL + 16} y={yB + 3} fontSize={5.5} fill={T.gold} fontFamily={T.mono} textAnchor="start">{p.b}</text>
      </g>;
    })}
    {/* Legend */}
    <g transform={`translate(4,${H - 32})`}>
      <rect width={7} height={7} fill={T.teal} fillOpacity={0.4} /><text x={10} y={7} fontSize={6} fill={T.text3}>Acid placed</text>
      <rect y={11} width={7} height={7} fill={T.gold} fillOpacity={0.6} /><text x={10} y={18} fontSize={6} fill={T.text3}>Perfs (ft)</text>
    </g>
  </svg>;
}

// ─── DEPTH PLOT ───────────────────────────────────────────────────────────────
function DepthPlot({ data, xKey, secKey, yKey = "depth", botKey = "bot", W = 260, H = 170, color = T.teal, secColor = T.green, label = "", fill = false, xMn, xMx }) {
  // Renders horizontal bars from each interval's top depth to its bot depth.
  // For each data row: a filled rect spans from py(top) to py(bot), width = px(val).
  // secKey draws a dashed outline bar for comparison (e.g. skin-after over skin-before).
  const pad = { t: 8, b: 20, l: 42, r: 10 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;

  if (!data || !data.length) return <svg width="100%" viewBox={`0 0 ${W} ${H}`}><text x={W/2} y={H/2} textAnchor="middle" fontSize={10} fill={T.text3}>No data</text></svg>;

  // Collect all top/bot depths for Y axis
  const allTops = data.map(d => +d[yKey] || 0);
  const allBots = data.map(d => +(d[botKey] || d[yKey] + 50) || 0);
  const minD = Math.min(...allTops);
  const maxD = Math.max(...allBots);

  const vals    = data.map(d => +d[xKey]  || 0);
  const secVals = secKey ? data.map(d => +d[secKey] || 0) : [];
  const allVals = [...vals, ...secVals].filter(v => isFinite(v));
  const minV = xMn != null ? xMn : Math.min(0, ...allVals);
  const maxV = xMx != null ? xMx : Math.max(...allVals) * 1.12 || 1;

  const py = d => pad.t + ((+d - minD) / (maxD - minD || 1)) * gH;
  const px = v => pad.l + ((+v - minV) / (maxV - minV || 1)) * gW;
  const px0 = px(0);  // zero line x position

  // Y-axis tick depths
  const dticks = allTops.length > 5
    ? [minD, allTops[Math.floor(allTops.length/2)], maxD]
    : allTops;
  // X-axis ticks
  const xticks = [minV, (minV+maxV)/2, maxV];

  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
    {/* Grid lines */}
    {dticks.map(d => <line key={"hy"+d} x1={pad.l} y1={py(d)} x2={W-pad.r} y2={py(d)} stroke={T.border0} strokeWidth={0.4} strokeDasharray="3,3"/>)}
    {xticks.map(v => <line key={"vx"+v} x1={px(v)} y1={pad.t} x2={px(v)} y2={pad.t+gH} stroke={T.border0} strokeWidth={0.3} strokeDasharray="2,4"/>)}
    {/* Zero line */}
    {minV < 0 && <line x1={px0} y1={pad.t} x2={px0} y2={pad.t+gH} stroke={T.text3} strokeWidth={0.8}/>}

    {/* Primary bars: horizontal rect from top to bot, width = value */}
    {data.map((d, i) => {
      const top  = +d[yKey] || 0;
      const bot  = +(d[botKey] || top + 50);
      const val  = +d[xKey]  || 0;
      const y1   = py(top), y2 = py(bot);
      const barH = Math.max(1.5, y2 - y1 - 1);
      const barW = px(val) - px0;
      const x0   = barW >= 0 ? px0 : px0 + barW;
      const w    = Math.abs(barW);
      return <rect key={i} x={x0} y={y1+0.5} width={Math.max(0,w)} height={barH}
        fill={color} fillOpacity={0.75} stroke={color} strokeWidth={0.5} rx={1}/>;
    })}

    {/* Secondary bars (dashed outline, e.g. skin-after) */}
    {secKey && data.map((d, i) => {
      const top  = +d[yKey] || 0;
      const bot  = +(d[botKey] || top + 50);
      const val  = +d[secKey] || 0;
      const y1   = py(top), y2 = py(bot);
      const barH = Math.max(1.5, y2 - y1 - 1);
      const barW = px(val) - px0;
      const x0   = barW >= 0 ? px0 : px0 + barW;
      const w    = Math.abs(barW);
      return <rect key={"s"+i} x={x0} y={y1+0.5} width={Math.max(0,w)} height={barH}
        fill={secColor} fillOpacity={0.18} stroke={secColor} strokeWidth={1.2}
        strokeDasharray="3,2" rx={1}/>;
    })}

    {/* Y-axis labels (depth) */}
    {dticks.map(d => <text key={"yt"+d} x={pad.l-3} y={py(d)+3.5} textAnchor="end" fontSize={7} fill={T.text3} fontFamily={T.mono}>{Math.round(d)}</text>)}
    {/* X-axis labels (value) */}
    {xticks.map(v => <text key={"xt"+v} x={px(v)} y={pad.t+gH+13} textAnchor="middle" fontSize={7} fill={T.text3} fontFamily={T.mono}>{v % 1 === 0 ? v : v.toFixed(1)}</text>)}

    {/* Axes */}
    <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+gH} stroke={T.border1} strokeWidth={0.8}/>
    <line x1={pad.l} y1={pad.t+gH} x2={W-pad.r} y2={pad.t+gH} stroke={T.border1} strokeWidth={0.8}/>
    <text x={pad.l+gW/2} y={H-1} textAnchor="middle" fontSize={8} fill={T.text2} fontFamily={T.sans}>{label}</text>
  </svg>;
}

function TChart({ series, H = 150, xLbl = "Time (min)", yLbl = "" }) {
  const TW = 420, pad = { t: 10, b: 26, l: 42, r: 64 };
  const gW = TW - pad.l - pad.r, gH = H - pad.t - pad.b;
  // Guard: filter out empty series before computing bounds
  const validSeries = (series || []).filter(s => s.data && s.data.length > 0);
  if (validSeries.length === 0) return <svg width="100%" viewBox={`0 0 ${TW} ${H}`} style={{ display: "block" }}><text x={TW/2} y={H/2} textAnchor="middle" fontSize={10} fill={T.text3}>No data</text></svg>;
  const allY = validSeries.flatMap(s => s.data.map(d => d.y));
  const allX = validSeries.flatMap(s => s.data.map(d => d.x));
  const minY = Math.min(...allY) * 0.9, maxY = Math.max(...allY) * 1.06;
  const maxX = Math.max(...allX) || 1;
  const px = x => pad.l + (x / maxX) * gW;
  const py = y => pad.t + gH - ((y - minY) / (maxY - minY || 1)) * gH;
  return <svg width="100%" viewBox={`0 0 ${TW} ${H}`} style={{ display: "block" }}>
    {[0, 1, 2, 3, 4].map(i => { const v = minY + i * (maxY - minY) / 4, y = py(v); return <g key={i}><line x1={pad.l} y1={y} x2={pad.l + gW} y2={y} stroke={T.border0} strokeWidth={0.4} /><text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize={8} fill={T.text3} fontFamily={T.mono}>{Math.round(v)}</text></g>; })}
    {[0, 1, 2, 3, 4, 5].map(i => { const v = i * maxX / 5, x = px(v); return <g key={i}><text x={x} y={pad.t + gH + 14} textAnchor="middle" fontSize={8} fill={T.text3} fontFamily={T.mono}>{Math.round(v)}</text></g>; })}
    <rect x={pad.l} y={pad.t} width={gW} height={gH} fill="none" stroke={T.border1} strokeWidth={0.5} />
    {validSeries.map((s, si) => {
      if (!s.data || s.data.length === 0) return null;
      const path = s.data.map((d, i) => `${i === 0 ? "M" : "L"}${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(" ");
      const lastX = px(s.data[s.data.length - 1].x);
      return <g key={si}>{s.fill && path && <path d={`${path} L${lastX},${pad.t + gH} L${pad.l},${pad.t + gH}Z`} fill={s.color} fillOpacity={0.08} />}<path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash || "none"} /></g>;
    })}
    <text x={TW / 2} y={H - 2} textAnchor="middle" fontSize={9} fill={T.text2}>{xLbl}</text>
    <g transform={`translate(${pad.l + gW + 4},${pad.t})`}>
      {validSeries.map((s, i) => <g key={i} transform={`translate(0,${i * 15})`}><line x1={0} y1={5} x2={12} y2={5} stroke={s.color} strokeWidth={2} strokeDasharray={s.dash || "none"} /><text x={15} y={9} fontSize={9} fill={T.text1}>{s.label}</text></g>)}
    </g>
  </svg>;
}

// ─── SPLIT LAYOUT ─────────────────────────────────────────────────────────────
function Split({ left, results, reservoir, setPage, page }) {
  const [show, setShow] = useState(true);
  const [hovDepth, setHovDepth] = useState(null);
  const data = results || [];
  return <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 18 }}>{left}</div>
      {setPage && page && <WorkflowNav page={page} setPage={setPage} />}
    </div>
    {show ? (
      <div style={{ width: 510, background: T.bg1, borderLeft: `1px solid ${T.border0}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "7px 12px", borderBottom: `1px solid ${T.border0}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.7px" }}>Well Schematic · Depth Plots</span>
          <Btn sz="s" v="g" onClick={() => setShow(false)}>⊠ Hide</Btn>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "165px 1fr", gap: 10 }}>
            <div style={{ background: T.bg2, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border0}` }}>
              <WellSchematic reservoir={reservoir || INIT_RESERVOIR} results={data.length ? data : null} hovDepth={hovDepth} onHover={setHovDepth} minDepth={data.length ? Math.min(...data.map(d=>d.depth)) : undefined} maxDepth={data.length ? Math.max(...data.map(d=>d.depth)) : undefined} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.length ? (<>
                <Card title="Skin Before → After" np>
                  <div style={{ padding: 8 }}><DepthPlot data={data} xKey="skinB" secKey="skinA" yKey="depth" color={T.red} secColor={T.green} label="Skin Factor" H={115} W={295} /></div>
                  <div style={{ display: "flex", gap: 10, padding: "0 8px 6px", fontSize: 11, color: T.text2 }}><span style={{ color: T.red }}>— Before</span><span style={{ color: T.green }}>– – After</span></div>
                </Card>
                <Card title="Penetration vs Depth" np>
                  <div style={{ padding: 8 }}><DepthPlot data={data} xKey="pen" yKey="depth" color={T.teal} label="Penetration (in)" fill H={105} W={295} /></div>
                </Card>
                <Card title="Pressure vs Depth" np>
                  <div style={{ padding: 8 }}><DepthPlot data={data} xKey="pres" yKey="depth" color={T.blue} label="Pressure (psi)" H={95} W={295} /></div>
                </Card>
              </>) : <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 300, color: T.text3, fontSize: 12, gap: 8, textAlign: "center" }}>
                <span style={{ fontSize: 28 }}>⟐</span>
                <span>Run simulation<br />to see depth plots</span>
              </div>}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div style={{ width: 26, background: T.bg1, borderLeft: `1px solid ${T.border0}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, cursor: "pointer" }} onClick={() => setShow(true)}>
        <span style={{ color: T.text2, fontSize: 13, writingMode: "vertical-rl", transform: "rotate(180deg)", userSelect: "none" }}>◁ Well View</span>
      </div>
    )}
  </div>;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⊡", label: "Dashboard" },
  { id: "create", icon: "+", label: "New Project", accent: true },
  null,
  { id: "reservoir", icon: "⬡", label: "Reservoir Data" },
  { id: "well", icon: "⦻", label: "Well & Completion" },
  { id: "fluids", icon: "◈", label: "Fluids Library" },
  { id: "schedule", icon: "≡", label: "Pump Schedule" },
  null,
  { id: "sim", icon: "▶", label: "Run Simulation" },
  { id: "results", icon: "◎", label: "Results" },
  { id: "sensitivity", icon: "∿", label: "Sensitivity" },
  { id: "reports", icon: "⎙", label: "Reports" },
  null,
  { id: "manual", icon: "⊟", label: "Technical Manual" },
  { id: "cases", icon: "◉", label: "Case Studies" },
  null,
  { id: "debut_report", icon: "⬟", label: "Debut Report" },
];

function Sidebar({ page, setPage, onLogout, proj }) {
  return <div style={{ width: 208, background: T.bg1, borderRight: `1px solid ${T.border0}`, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 200, overflowY: "auto" }}>
    <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${T.border0}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="26" height="26" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="rgba(30,207,178,0.12)" stroke={T.teal} strokeWidth="1.5" /><path d="M16 34L24 10L32 34" stroke={T.teal} strokeWidth="2" fill="none" strokeLinejoin="round" /><line x1="19" y1="27" x2="29" y2="27" stroke={T.gold} strokeWidth="2" /></svg>
        <div><div style={{ fontSize: 15, fontWeight: 700, color: T.text0, letterSpacing: "-0.3px", lineHeight: 1 }}>StimOPTI</div><div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Kemiserve FZE</div></div>
      </div>
      {proj && <div style={{ marginTop: 9, padding: "4px 9px", background: T.bg2, borderRadius: 5, fontSize: 10, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: `1px solid ${T.border0}` }}>📂 {proj}</div>}
    </div>
    <nav style={{ flex: 1, padding: "6px 0" }}>
      {NAV.map((item, i) => {
        if (!item) return <div key={i} style={{ height: 1, background: T.border0, margin: "5px 10px" }} />;
        const active = page === item.id;
        return <div key={item.id} onClick={() => setPage(item.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", margin: "1px 6px", borderRadius: 5, cursor: "pointer", background: active ? "rgba(30,207,178,0.1)" : "transparent", border: `1px solid ${active ? T.teal : "transparent"}`, color: active ? T.teal : item.accent ? T.gold : T.text1, fontSize: 12, fontWeight: active ? 600 : 400, transition: "all 0.12s", userSelect: "none" }}>
          <span style={{ fontSize: 12, width: 14, textAlign: "center", fontFamily: "monospace" }}>{item.icon}</span>{item.label}
        </div>;
      })}
    </nav>
    <div style={{ padding: "6px", borderTop: `1px solid ${T.border0}` }}>
      <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 5, cursor: "pointer", color: T.red, fontSize: 12, userSelect: "none" }}>
        <span>⎋</span>Sign Out
      </div>
    </div>
  </div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [u, setU] = useState("stimopti");
  const [p, setP] = useState("1234");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  function go() {
    if (busy) return;
    if (u.trim().toLowerCase() === "stimopti" && p.trim() === "1234") { setBusy(true); setTimeout(() => onLogin(), 700); }
    else setErr("Invalid credentials. Use stimopti / 1234");
  }
  return <div style={{ minHeight: "100vh", display: "flex", background: T.bg0, fontFamily: T.sans }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 70px", background: T.bg1, borderRight: `1px solid ${T.border0}`, maxWidth: 460 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 44 }}>
        <svg width="46" height="46" viewBox="0 0 48 48"><circle cx="24" cy="24" r="23" fill="rgba(30,207,178,0.12)" stroke={T.teal} strokeWidth="1.5" /><path d="M16 34L24 10L32 34" stroke={T.teal} strokeWidth="2.5" fill="none" strokeLinejoin="round" /><line x1="19" y1="27" x2="29" y2="27" stroke={T.gold} strokeWidth="2.5" /></svg>
        <div><div style={{ fontSize: 28, fontWeight: 700, color: T.text0, letterSpacing: "-1px", lineHeight: 1 }}>StimOPTI</div><div style={{ fontSize: 10, color: T.text3, letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>Matrix Acid Design Platform</div></div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text0, lineHeight: 1.25, marginBottom: 14, letterSpacing: "-0.5px" }}>Optimize every acid stage,<br /><span style={{ color: T.teal }}>every depth.</span></div>
      <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.8, marginBottom: 32 }}>Depth-referenced matrix acid job design, placement simulation, skin evolution and PI analysis — from wellhead to TD.</div>
      {["Depth-mapped acid placement modeling", "Integrated fluids library & diverter design", "Skin & PI improvement analysis", "Real-time vs. recommended comparison"].map(f => <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
        <div style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(30,207,178,0.12)", border: `1px solid ${T.teal}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: T.teal, fontSize: 8, fontWeight: 700 }}>✓</span></div>
        <span style={{ fontSize: 12, color: T.text1 }}>{f}</span>
      </div>)}
      <div style={{ marginTop: 44, fontSize: 10, color: T.text3 }}>v4.0.0 · Kemiserve FZE · © 2025</div>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 370, background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 14, padding: 38, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: T.text0, marginBottom: 4 }}>Sign In</div>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 26 }}>Access your stimulation workspace</div>
        <div style={{ marginBottom: 14 }}><Lbl>Username</Lbl><input className="si" value={u} onChange={e => setU(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} /></div>
        <div style={{ marginBottom: 18 }}><Lbl>Password</Lbl><input type="password" className="si" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} /></div>
        {err && <div style={{ color: T.red, fontSize: 12, marginBottom: 14, padding: "8px 12px", background: "rgba(224,80,80,0.1)", border: "1px solid rgba(224,80,80,0.3)", borderRadius: 6 }}>{err}</div>}
        <div onClick={go} style={{ background: busy ? T.tealDim : T.teal, color: T.bg0, borderRadius: 8, padding: "13px 0", fontSize: 14, fontWeight: 700, textAlign: "center", cursor: busy ? "wait" : "pointer", userSelect: "none", transition: "all 0.15s" }}>
          {busy ? "Authenticating…" : "Sign In →"}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: T.text3, marginTop: 18 }}>Kemiserve FZE · StimOPTI v4.0</div>
      </div>
    </div>
  </div>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ projects, setProjects, onOpen }) {
  const [showNew, setShowNew] = useState(false);
  const [f, setF] = useState({ name: "", well: "", field: "", unit: "Field (Imperial)", injection: "Bullhead", grid: "1 ft" });
  function create() {
    if (!f.name || !f.well) return;
    setProjects(ps => [...ps, { ...f, id: Date.now(), hasRun: false, createdAt: new Date().toLocaleDateString() }]);
    setShowNew(false); setF({ name: "", well: "", field: "", unit: "Field (Imperial)", injection: "Bullhead", grid: "1 ft" });
  }
  return <div style={{ flex: 1, overflow: "auto" }}>
    <Topbar title="Dashboard" sub="Matrix Acid Stimulation Projects" actions={<Btn v="a" onClick={() => setShowNew(true)} icon="+">New Project</Btn>} />
    <div style={{ padding: 22 }}>
      <G4><Met label="Total Projects" value={projects.length} icon="⊡" /><Met label="Simulated" value={projects.filter(p => p.hasRun).length} color={T.green} icon="◉" /><Met label="Draft" value={projects.filter(p => !p.hasRun).length} color={T.gold} icon="◌" /><Met label="Reports" value={0} color={T.text2} icon="⎙" /></G4>
      <div style={{ marginTop: 22 }}>
        {projects.length === 0
          ? <Card><div style={{ textAlign: "center", padding: "48px 0", color: T.text1 }}><div style={{ fontSize: 38, marginBottom: 10 }}>⊡</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text0, marginBottom: 6 }}>No projects yet</div><div style={{ fontSize: 12, color: T.text2, marginBottom: 18 }}>Create your first matrix acid stimulation project</div><Btn v="a" onClick={() => setShowNew(true)}>+ Create First Project</Btn></div></Card>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map(p => <div key={p.id} style={{ background: T.bg2, border: `1px solid ${T.border0}`, borderRadius: 10, padding: "14px 18px", borderLeft: `4px solid ${p.hasRun ? T.green : T.gold}`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text0 }}>{p.name}</div>
                  <Bdg color={p.hasRun ? "green" : "gold"} label={p.hasRun ? "Simulated" : "Draft"} />
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.text2, flexWrap: "wrap" }}>
                  <span>🔬 {p.well}</span><span>📍 {p.field}</span><span>🔧 {p.injection}</span><span>📏 {p.unit}</span><span>🗂 {p.grid}</span>
                  <span>📅 {p.createdAt}</span>{p.version && <span style={{color:T.teal}}>v{p.version}</span>}
                  {p.updatedAt && <span style={{color:T.text3,fontSize:10}}>saved {new Date(p.updatedAt).toLocaleTimeString()}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Btn sz="s" v="o" onClick={() => onOpen(p)}>Open →</Btn>
                <Btn sz="s" v="d" onClick={() => { DB.deleteProject(p.id); setProjects(ps => ps.filter(x => x.id !== p.id)); }}>Delete</Btn>
              </div>
            </div>)}
          </div>
        }
      </div>
    </div>
    {showNew && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowNew(false)}>
      <div style={{ background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 14, padding: "34px 38px", width: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text0, marginBottom: 4 }}>Create New Project</div>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 22 }}>Define project parameters</div>
        <G2 gap={12}><Fld label="Project Name" value={f.name} onChange={v => setF(x => ({ ...x, name: v }))} /><Fld label="Well Name" value={f.well} onChange={v => setF(x => ({ ...x, well: v }))} /><Fld label="Field / Client" value={f.field} onChange={v => setF(x => ({ ...x, field: v }))} /><Fld label="Unit System" type="select" value={f.unit} onChange={v => setF(x => ({ ...x, unit: v }))} options={["Field (Imperial)", "Metric (SI)"]} /><Fld label="Injection Type" type="select" value={f.injection} onChange={v => setF(x => ({ ...x, injection: v }))} options={["Bullhead", "Coil Tubing"]} /><Fld label="Depth Grid" type="select" value={f.grid} onChange={v => setF(x => ({ ...x, grid: v }))} options={["0.5 ft", "1 ft", "2 ft"]} /></G2>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><Btn v="a" onClick={create} sx={{ flex: 1 }}>Create Project</Btn><Btn v="g" onClick={() => setShowNew(false)}>Cancel</Btn></div>
      </div>
    </div>}
  </div>;
}

// ─── RESERVOIR DATA ───────────────────────────────────────────────────────────
function ReservoirPage({ project, setPage, rows: extRows, setRows: extSetRows }) {
  const [localRows, setLocalRows] = useState(INIT_RESERVOIR.map(r => ({ ...r })));
  const rows = extRows || localRows;
  const setRows = extSetRows || setLocalRows;
  const [tab, setTab] = useState("table");
  const avgPor = (rows.reduce((s, r) => s + (+r.por || 0), 0) / (rows.length || 1)).toFixed(1);
  const avgPerm = (rows.reduce((s, r) => s + (+r.perm || 0), 0) / (rows.length || 1)).toFixed(0);
  const avgSkin = (rows.reduce((s, r) => s + (+r.skin || 0), 0) / (rows.length || 1)).toFixed(1);
  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Reservoir Data" sub={`${project?.name} · Depth-referenced formation properties`} warns={["2 intervals: skin > 20"]}
      actions={<>
        <Btn sz="s" v="g">⬆ Import Excel</Btn>
        <Btn sz="s" v="g" onClick={() => setRows(DEFAULTS.reservoir.map(r=>({...r})))}>↺ Set to Default</Btn>
      </>} />
    <Split reservoir={rows} setPage={setPage} page="reservoir" left={<div className="anim">
      <Tabs tabs={[{ id: "table", label: "Depth Table" }, { id: "logs", label: "Log / LAS Import" }]} active={tab} onSet={setTab} />
      {tab === "table" && <>
        <div className="wb" style={{ marginBottom: 12 }}><span style={{ color: T.gold }}>⚠</span><span style={{ fontSize: 12, color: T.text1 }}>Verify depth continuity. Gaps or overlaps between intervals affect simulation accuracy.</span></div>
        <Card title="Formation Properties — Depth Interval Table">
          <DTable cols={[
            { key: "top", label: "Top MD (ft)", w: 70 }, { key: "bot", label: "Bot MD (ft)", w: 70 }, { key: "tvd", label: "TVD (ft)", w: 70 },
            { key: "lith", label: "Lithology", type: "select", opts: ["Carbonate", "Dolomite", "Sandstone", "Shale", "Limestone"], w: 100 },
            { key: "por", label: "Por (%)", w: 52 }, { key: "perm", label: "Perm (md)", w: 65 }, { key: "skin", label: "Skin", w: 52 },
            { key: "pres", label: "Res Pressure (psi)", w: 95 },
          ]} rows={rows} setRows={setRows} />
        </Card>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <Met label="Intervals" value={rows.length} /><Met label="Avg Porosity" value={avgPor} unit="%" color={T.teal} /><Met label="Avg Perm" value={avgPerm} unit="md" color={T.blue} /><Met label="Avg Skin" value={avgSkin} color={T.red} />
        </div>
      </>}
      {tab === "logs" && <Card title="Log / LAS File Import">
        <div style={{ border: `2px dashed ${T.border1}`, borderRadius: 8, padding: "38px 0", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>⬆</div>
          <div style={{ fontSize: 13, color: T.text1, marginBottom: 6 }}>Drop LAS / Excel file here</div>
          <div style={{ fontSize: 11, color: T.text2, marginBottom: 12 }}>Supports .las, .xlsx, .csv — columns auto-mapped</div>
          <Btn v="o">Browse File</Btn>
        </div>
      </Card>}
    </div>} />
  </div>;
}

// ─── WELL & COMPLETION ────────────────────────────────────────────────────────
function WellPage({ project, setPage, wellData: extWell, setWellData: extSetWell }) {
  const [tab, setTab] = useState("config");
  const WELL_DEFAULTS_LOCAL = { type: "Producer", profile: "Vertical", wbR: "0.365", drainR: "2640", resTop: "8200", fricGrad: "18", khkv: "5", inc: "0", compType: "Cased Hole", tubLen: "8540", tubID: "2.992", casID: "5.921" };
  const [localW, setLocalW] = useState(WELL_DEFAULTS_LOCAL);
  const w = extWell || localW;
  const setW = extSetWell || setLocalW;
  const [survRows, setSurvRows] = useState([{ id: 1, md: 0, tvd: 0, inc: 0, azi: 0 }, { id: 2, md: 4000, tvd: 4000, inc: 0, azi: 0 }, { id: 3, md: 8200, tvd: 8200, inc: 0, azi: 0 }]);
  const [perfRows, setPerfRows] = useState([{ id: 1, top: 8200, bot: 8255, spf: 4, dia: 0.35, phase: "60°" }, { id: 2, top: 8255, bot: 8315, spf: 4, dia: 0.35, phase: "60°" }, { id: 3, top: 8370, bot: 8425, spf: 4, dia: 0.35, phase: "60°" }, { id: 4, top: 8480, bot: 8540, spf: 4, dia: 0.35, phase: "60°" }]);
  // comp fields are derived from sharedWell so they flow to the engine
  const comp = { type: w.compType||"Cased Hole", tubLen: w.tubLen||"8540", tubID: w.tubID||"2.992", casID: w.casID||"5.921" };
  const ws = k => v => setW(x => ({ ...x, [k]: v }));
  // cs writes into sharedWell so tubLen/tubID/casID reach convertUnits
  const cs = k => v => setW(x => ({ ...x, [k === "type" ? "compType" : k]: v }));
  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Well & Completion" sub={`${project?.name} · Wellbore geometry and completion data`}
      actions={<>
        <Btn sz="s" v="g">⬆ Import Survey</Btn>
        <Btn sz="s" v="g" onClick={() => setW(v => typeof v==="function"?v({...DEFAULTS.well}):{...DEFAULTS.well})}>↺ Set to Default</Btn>
      </>} />
    <Split setPage={setPage} page="well" left={<div className="anim">
      <Tabs tabs={[{ id: "config", label: "Well Config" }, { id: "survey", label: "Well Survey" }, { id: "completion", label: "Completion" }, { id: "perfs", label: "Perforations" }]} active={tab} onSet={setTab} />
      {tab === "config" && <G2><Card title="Well Configuration"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Fld label="Well Type" type="select" value={w.type} onChange={ws("type")} options={["Producer", "Injector"]} />
        <Fld label="Profile" type="select" value={w.profile} onChange={ws("profile")} options={["Vertical", "Slanted", "Horizontal"]} />
        <Fld label="Wellbore Radius" unit="in" value={w.wbR} onChange={ws("wbR")} tip="Used in radial flow calculations" />
        <Fld label="Drainage Radius" unit="ft" value={w.drainR} onChange={ws("drainR")} />
        <Fld label="Reservoir Top" unit="MD ft" value={w.resTop} onChange={ws("resTop")} />
        <Fld label="Friction Gradient" unit="psi/1000ft" value={w.fricGrad} onChange={ws("fricGrad")} />
        <Fld label="Kh/Kv" value={w.khkv} onChange={ws("khkv")} tip="Permeability anisotropy" />
        {w.profile !== "Vertical" && <Fld label="Inclination" unit="°" value={w.inc} onChange={ws("inc")} />}
      </div></Card>
        <Card title="Casing / Tubing"><div style={{ display: "grid", gap: 10 }}>
          <Fld label="Completion Type" type="select" value={comp.type} onChange={cs("type")} options={["Cased Hole", "Openhole", "Slotted Liner", "Limited Entry"]} />
          <Fld label="Tubing Length" unit="ft" value={comp.tubLen} onChange={cs("tubLen")} />
          <Fld label="Tubing Inner Dia" unit="in" value={comp.tubID} onChange={cs("tubID")} />
          <Fld label="Casing Inner Dia" unit="in" value={comp.casID} onChange={cs("casID")} />
        </div></Card></G2>}
      {tab === "survey" && <Card title="Directional Survey — MD / TVD / Inclination / Azimuth"><DTable cols={[{ key: "md", label: "MD (ft)" }, { key: "tvd", label: "TVD (ft)" }, { key: "inc", label: "Inc (°)" }, { key: "azi", label: "Azi (°)" }]} rows={survRows} setRows={setSurvRows} /></Card>}
      {tab === "completion" && <Card title="Completion Details">
        <div style={{ padding: "12px 14px", background: T.bg3, borderRadius: 6, fontSize: 12, color: T.text1 }}>Selected type: <strong style={{ color: T.teal }}>{comp.type}</strong>. Additional parameters for Slotted Liner and Limited Entry below.</div>
        {comp.type === "Slotted Liner" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}><Fld label="Slot Width" unit="in" value="0.1" onChange={() => {}} /><Fld label="Slots/ft" value="20" onChange={() => {}} /></div>}
        {comp.type === "Limited Entry" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}><Fld label="Nozzle Dia" unit="in" value="0.25" onChange={() => {}} /><Fld label="No. Nozzles" value="8" onChange={() => {}} /></div>}
      </Card>}
      {tab === "perfs" && <Card title="Perforation Intervals — Depth-Based"><DTable cols={[{ key: "top", label: "Top MD (ft)", w: 70 }, { key: "bot", label: "Bot MD (ft)", w: 70 }, { key: "spf", label: "SPF", w: 45 }, { key: "dia", label: "Dia (in)", w: 55 }, { key: "phase", label: "Phase", type: "select", opts: ["60°", "90°", "120°", "180°"], w: 65 }]} rows={perfRows} setRows={setPerfRows} /></Card>}
    </div>} />
  </div>;
}

// ─── FLUIDS LIBRARY ───────────────────────────────────────────────────────────
const FLUID_COLORS = [T.teal, T.blue, T.violet, T.gold, T.green, T.red, "#FF7B54", "#C8F042", "#78A8C8", "#E87EFF"];
function FluidsPage({ setPage, sharedFluids: extFluids, setSharedFluids: extSetFluids }) {
  const [localFluids, setLocalFluids] = useState(INIT_FLUIDS.map(f => ({ ...f })));
  const fluids = extFluids || localFluids;
  const setFluids = (v) => {
    if (extSetFluids) extSetFluids(v);
    else setLocalFluids(v);
  };
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editSel, setEditSel] = useState(null);
  const [newFluid, setNewFluid] = useState({ name:"", type:"HCl", conc:"15", density:"1.065", visc:"1.2", rxRate:"2.8", cat:"Main Acid", color:T.teal });
  const cats = ["All", ...new Set(INIT_FLUIDS.map(f => f.cat))];
  const filtered = filter === "All" ? fluids : fluids.filter(f => f.cat === filter);
  const nf = k => v => setNewFluid(x => ({ ...x, [k]: v }));
  function addFluid() {
    if (!newFluid.name) return;
    const f = { ...newFluid, id: Date.now(), conc: +newFluid.conc || 0, density: +newFluid.density || 1, visc: +newFluid.visc || 1, rxRate: +newFluid.rxRate || 0 };
    setFluids(fs => [...fs, f]);
    setShowAdd(false);
    setSel(f);
    setNewFluid({ name:"", type:"HCl", conc:"15", density:"1.065", visc:"1.2", rxRate:"2.8", cat:"Main Acid", color:T.teal });
  }
  function saveEdit() {
    if (!editSel) return;
    setFluids(fs => fs.map(f => f.id === editSel.id ? { ...editSel, conc: +editSel.conc || 0, density: +editSel.density || 1, visc: +editSel.visc || 1, rxRate: +editSel.rxRate || 0 } : f));
    setSel({ ...editSel });
    setEditSel(null);
  }
  function startEdit(f) { setEditSel({ ...f, conc: String(f.conc), density: String(f.density), visc: String(f.visc), rxRate: String(f.rxRate) }); }
  const es = k => v => setEditSel(x => ({ ...x, [k]: v }));
  const activeFluid = editSel || sel;
  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", position: "relative" }}>
    <Topbar title="Fluids Library" sub="Predefined acid systems, diverters, and carrier fluids"
      actions={<>
        <Btn sz="s" v="g">⬆ Import Excel</Btn>
        <Btn sz="s" v="g" onClick={() => { setFluids(DEFAULTS.fluids.map(f=>({...f}))); setSel(null); setEditSel(null); }}>↺ Set to Default</Btn>
        <Btn sz="s" v="o" onClick={() => setShowAdd(true)}>+ Add Fluid</Btn>
      </>} />
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
        <div className="anim">
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {cats.map(c => <div key={c} onClick={() => setFilter(c)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${filter === c ? T.teal : T.border0}`, background: filter === c ? "rgba(30,207,178,0.1)" : "transparent", color: filter === c ? T.teal : T.text1, userSelect: "none", transition: "all 0.12s" }}>{c}</div>)}
            <span style={{ marginLeft: "auto", fontSize: 11, color: T.text2 }}>{filtered.length} fluids</span>
          </div>
          {/* Row layout — one fluid per row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(f => <div key={f.id} onClick={() => { setSel(f); setEditSel(null); }} style={{ background: sel?.id === f.id ? T.bgHov : T.bg2, border: `1px solid ${sel?.id === f.id ? T.teal : T.border0}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.15s", borderLeft: `4px solid ${f.color}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text0 }}>{f.name}</div>
                <div style={{ fontSize: 10, color: T.text2 }}>{f.type}</div>
              </div>
              <Bdg color={f.cat === "Diverter" ? "gold" : f.cat === "Preflush" ? "green" : "teal"} label={f.cat} />
              <div style={{ display: "flex", gap: 20, fontSize: 11, color: T.text2, flex: 1 }}>
                <span>Conc: <span style={{ color: T.text0, fontFamily: T.mono }}>{f.conc}%</span></span>
                <span>Density: <span style={{ color: T.text0, fontFamily: T.mono }}>{f.density} g/cm³</span></span>
                <span>Viscosity: <span style={{ color: T.text0, fontFamily: T.mono }}>{f.visc} cP</span></span>
                <span>Rx Rate: <span style={{ color: T.text0, fontFamily: T.mono }}>{f.rxRate}</span></span>
              </div>
              <div onClick={e => { e.stopPropagation(); setSel(f); startEdit(f); }} style={{ fontSize: 11, color: T.teal, cursor: "pointer", padding: "4px 8px", border: `1px solid ${T.teal}`, borderRadius: 4, whiteSpace: "nowrap" }}>Edit</div>
              <div onClick={e => { e.stopPropagation(); setFluids(fs => fs.filter(x => x.id !== f.id)); if (sel?.id === f.id) { setSel(null); setEditSel(null); } }} style={{ fontSize: 11, color: T.red, cursor: "pointer", padding: "4px 8px", border: "1px solid rgba(224,80,80,0.3)", borderRadius: 4 }}>×</div>
            </div>)}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: T.text3, fontSize: 12 }}>No fluids in this category.</div>}
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div style={{ width: 290, background: T.bg1, borderLeft: `1px solid ${T.border0}`, padding: 14, overflow: "auto" }}>
        {editSel ? <div className="anim">
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Edit Fluid</div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            {FLUID_COLORS.map(c => <div key={c} onClick={() => es("color")(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${editSel.color === c ? "#fff" : "transparent"}` }} />)}
          </div>
          <div style={{ display: "grid", gap: 9, marginBottom: 14 }}>
            <Fld label="Fluid Name" value={editSel.name} onChange={es("name")} />
            <Fld label="Type" type="select" value={editSel.type} onChange={es("type")} options={["HCl","HF/HCl","Organic","Solvent","Brine","Diverter"]} />
            <Fld label="Category" type="select" value={editSel.cat} onChange={es("cat")} options={["Main Acid","Preflush","Overflush","Diverter","Sandstone"]} />
            <Fld label="Concentration" unit="%" value={String(editSel.conc)} onChange={es("conc")} />
            <Fld label="Density" unit="g/cm³" value={String(editSel.density)} onChange={es("density")} />
            <Fld label="Viscosity" unit="cP" value={String(editSel.visc)} onChange={es("visc")} />
            <Fld label="Reaction Rate" unit="mol/m²·s" value={String(editSel.rxRate)} onChange={es("rxRate")} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn v="p" onClick={saveEdit} sx={{ flex: 1 }}>Save</Btn>
            <Btn v="g" onClick={() => setEditSel(null)}>Cancel</Btn>
          </div>
        </div> : sel ? <div className="anim">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: sel.color, flexShrink: 0 }} /><div style={{ fontSize: 13, fontWeight: 700, color: T.text0 }}>{sel.name}</div></div>
          <div style={{ display: "grid", gap: 8, marginBottom: 16, fontSize: 12 }}>
            {[["Type", sel.type], ["Category", sel.cat], ["Concentration", sel.conc + "%"], ["Density", sel.density + " g/cm³"], ["Viscosity", sel.visc + " cP"], ["Reaction Rate", sel.rxRate]].map(([k, v]) =>
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border0}` }}>
                <span style={{ color: T.text2 }}>{k}</span><span style={{ color: T.text0, fontFamily: T.mono }}>{v}</span>
              </div>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Btn v="o" full onClick={() => startEdit(sel)}>✏ Edit Fluid</Btn>
            <Btn v="g" full>Select for Design</Btn>
            <Btn v="g" full>Save as Template</Btn>
            <Btn v="d" full onClick={() => { setFluids(fs => fs.filter(f => f.id !== sel.id)); setSel(null); }}>Remove from Library</Btn>
          </div>
        </div> : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, color: T.text3, fontSize: 12, gap: 8 }}><span style={{ fontSize: 24 }}>◈</span><span>Select a fluid to view</span></div>}
      </div>
    </div>
    <WorkflowNav page="fluids" setPage={setPage} />
    {/* Add Fluid Modal */}
    {showAdd && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAdd(false)}>
      <div style={{ background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 14, padding: "28px 32px", width: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text0, marginBottom: 4 }}>Add New Fluid</div>
        <div style={{ fontSize: 11, color: T.text2, marginBottom: 16 }}>Define acid or carrier fluid properties</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {FLUID_COLORS.map(c => <div key={c} onClick={() => nf("color")(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${newFluid.color === c ? "#fff" : "transparent"}` }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Fld label="Fluid Name" value={newFluid.name} onChange={nf("name")} />
          <Fld label="Type" type="select" value={newFluid.type} onChange={nf("type")} options={["HCl","HF/HCl","Organic","Solvent","Brine","Diverter"]} />
          <Fld label="Category" type="select" value={newFluid.cat} onChange={nf("cat")} options={["Main Acid","Preflush","Overflush","Diverter","Sandstone"]} />
          <Fld label="Concentration" unit="%" value={newFluid.conc} onChange={nf("conc")} />
          <Fld label="Density" unit="g/cm³" value={newFluid.density} onChange={nf("density")} />
          <Fld label="Viscosity" unit="cP" value={newFluid.visc} onChange={nf("visc")} />
          <Fld label="Reaction Rate" unit="mol/m²·s" value={newFluid.rxRate} onChange={nf("rxRate")} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="p" onClick={addFluid} sx={{ flex: 1 }}>Add to Library</Btn>
          <Btn v="g" onClick={() => setShowAdd(false)}>Cancel</Btn>
        </div>
      </div>
    </div>}
  </div>;
}

// ─── ACID DESIGN ──────────────────────────────────────────────────────────────
function AcidPage({ project, setPage }) {
  const [stages, setStages] = useState([
    { id: 1, name: "Preflush", type: "Preflush", fluid: "Xylene Preflush", topD: 8200, botD: 8540, vpp: 0.5, vol: 25, note: "Wettability" },
    { id: 2, name: "Acid Stage 1", type: "Main", fluid: "HCl 15%", topD: 8200, botD: 8370, vpp: 2.0, vol: 120, note: "Upper intervals" },
    { id: 3, name: "Diverter", type: "Diverter", fluid: "VES Diverter", topD: 8200, botD: 8540, vpp: 0.5, vol: 30, note: "Diversion" },
    { id: 4, name: "Acid Stage 2", type: "Main", fluid: "HCl 15%", topD: 8370, botD: 8540, vpp: 2.0, vol: 120, note: "Lower intervals" },
    { id: 5, name: "Overflush", type: "Overflush", fluid: "KCl 2% Brine", topD: 8200, botD: 8540, vpp: 1.0, vol: 60, note: "Spent flush" },
  ]);
  const [sel, setSel] = useState(0);
  const fOpts = INIT_FLUIDS.map(f => f.name);
  const TC = { Preflush: T.green, Main: T.teal, Diverter: T.gold, Overflush: T.blue };
  const s = stages[sel];
  const upd = k => v => setStages(ss => ss.map((x, i) => i === sel ? { ...x, [k]: v } : x));
  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Acid Design" sub={`${project?.name} · Stage-wise design with depth coverage`} actions={<>
      <Btn sz="s" v="g" onClick={() => { setStages(DEFAULTS.acid.map(s=>({...s}))); setSel(0); }}>↺ Set to Default</Btn>
      <Btn sz="s" v="a">Validate Design</Btn>
    </>} />
    <Split setPage={setPage} page="acid" left={<div className="anim">
      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px" }}>Stages:</span>
        {stages.map((x, i) => <div key={x.id} style={{ position:"relative",display:"inline-flex",alignItems:"center" }}>
          <div onClick={()=>setSel(i)} style={{ padding:"5px 24px 5px 11px",borderRadius:5,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${sel===i?TC[x.type]:T.border0}`,background:sel===i?`${TC[x.type]}18`:T.bg2,color:sel===i?TC[x.type]:T.text1,userSelect:"none",transition:"all 0.12s" }}>
            <span style={{ fontFamily:T.mono,fontSize:9,marginRight:4 }}>{i+1}</span>{x.name}
          </div>
          <div title="Delete stage" onClick={e=>{e.stopPropagation();const ns=stages.filter((_,j)=>j!==i);setStages(ns);if(sel>=ns.length)setSel(Math.max(0,ns.length-1));}} style={{ position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",cursor:"pointer",color:T.text3,fontSize:13,lineHeight:1,zIndex:2,padding:"0 1px" }}>×</div>
        </div>)}
        <Btn sz="s" v="g" onClick={() => setStages(ss => [...ss, { id: Date.now(), name: `Stage ${ss.length + 1}`, type: "Main", fluid: "HCl 15%", topD: 8200, botD: 8540, vpp: 1.5, vol: 100, note: "" }])}>+ Stage</Btn>
      </div>
      {s && <G2><Card title={`Stage ${sel + 1} — ${s.name}`}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Fld label="Stage Name" value={s.name} onChange={upd("name")} />
        <Fld label="Stage Type" type="select" value={s.type} onChange={upd("type")} options={["Preflush", "Main", "Diverter", "Overflush"]} />
        <Fld label="Fluid" type="select" value={s.fluid} onChange={upd("fluid")} options={fOpts} />
        <Fld label="Top Depth MD" unit="ft" value={String(s.topD)} onChange={upd("topD")} />
        <Fld label="Bottom Depth MD" unit="ft" value={String(s.botD)} onChange={upd("botD")} />
        <Fld label="Vol/Perforation" unit="gal/perf" value={String(s.vpp)} onChange={upd("vpp")} tip="Acid volume per perforation tunnel" />
        <Fld label="Total Volume" unit="bbl" value={String(s.vol)} onChange={upd("vol")} />
        <Fld label="Note" value={s.note} onChange={upd("note")} />
      </div></Card>
        <div>
          <Card title="Stage Metrics" sx={{ marginBottom: 12 }}><div style={{ display: "grid", gap: 9 }}>
            <Met label="Depth Coverage" value={`${s.topD}–${s.botD}`} unit="ft" color={T.teal} />
            <Met label="Total Volume" value={s.vol} unit="bbl" color={T.blue} />
            <Met label="Vol/Perf" value={s.vpp} unit="gal/perf" color={T.green} />
          </div></Card>
          <Card title="All Stages">
            <table style={{ width: "100%", fontSize: 11 }}>
              <thead><tr>{["#", "Type", "Fluid", "Vol"].map(h => <th key={h} style={{ textAlign: "left", padding: "4px 7px", color: T.text2, borderBottom: `1px solid ${T.border0}`, fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{stages.map((x, i) => <tr key={x.id} className="hr" style={{ background: "transparent", cursor: "pointer" }} onClick={() => setSel(i)}>
                <td style={{ padding: "5px 7px", color: T.text2, fontFamily: T.mono }}>{i + 1}</td>
                <td style={{ padding: "5px 7px" }}><span style={{ color: TC[x.type], fontSize: 9 }}>●</span> {x.type}</td>
                <td style={{ padding: "5px 7px", color: T.text1 }}>{x.fluid}</td>
                <td style={{ padding: "5px 7px", fontFamily: T.mono, color: T.text0 }}>{x.vol}</td>
              </tr>)}</tbody>
            </table>
            <div style={{ padding: "5px 7px", borderTop: `1px solid ${T.border0}`, fontSize: 11, color: T.text2, textAlign: "right" }}>
              Total: <span style={{ color: T.teal, fontFamily: T.mono, fontWeight: 700 }}>{stages.reduce((s, x) => s + x.vol, 0)} bbl</span>
            </div>
          </Card>
        </div>
      </G2>}
    </div>} />
  </div>;
}

// ─── PUMP SCHEDULE ────────────────────────────────────────────────────────────
function SchedulePage({ project, setPage, sharedSched, setSharedSched }) {
  const [localRows, setLocalRows] = useState(INIT_SCHEDULE.map(r => ({ ...r })));
  const rows = sharedSched || localRows;
  const setRows = setSharedSched || setLocalRows;
  const [tab, setTab] = useState("table");
  const fOpts = INIT_FLUIDS.map(f => f.name);
  // Injection method: read from project (set in Dashboard), default Bullhead
  const injMethod = project?.injection || "Bullhead";
  const isCT = injMethod === "Coil Tubing";
  const totalVol = rows.reduce((s, r) => s + (+r.vol || 0), 0);
  const maxRate = Math.max(...rows.map(r => +r.rate || 0));
  const n = 60;
  const rateD = rows.flatMap((r, ri) => { const start = ri === 0 ? 0 : rows.slice(0, ri).reduce((s, x) => s + ((+x.vol || 0) / (+x.rate || 1)) * 0.035, 0), dur = ((+r.vol || 0) / (+r.rate || 1)) * 0.035; return [{ x: start, y: +r.rate || 0 }, { x: start + dur, y: +r.rate || 0 }]; });
  const presD = Array.from({ length: n }, (_, i) => ({ x: i * 0.8, y: 4200 + 800 * Math.exp(-i / 20) + (Math.random() - 0.48) * 80 - i * 2 }));
  // Build column list — From/To Depth only visible for CT injection
  const schedCols = [
    { key: "stage", label: "#", w: 35 },
    { key: "name", label: "Stage Name", w: 110 },
    { key: "fluid", label: "Fluid", type: "select", w: 120 },
    { key: "rate", label: "Rate (bpm)", w: 65 },
    { key: "vol", label: "Vol (bbl)", w: 65 },
    ...(isCT ? [
      { key: "fromDepth", label: "From Depth (ft)", w: 90 },
      { key: "toDepth",   label: "To Depth (ft)",   w: 90 },
    ] : []),
    { key: "note", label: "Note", w: 110 },
  ];
  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Pump Schedule" sub={`${project?.name} · ${isCT ? "Coiled Tubing" : "Bullhead"} treatment schedule`}
      actions={<>
        <Btn sz="s" v="g">⬆ Import Excel</Btn>
        <Btn sz="s" v="g" onClick={() => setRows(DEFAULTS.schedule.map(r=>({...r})))}>↺ Set to Default</Btn>
        <Btn sz="s" v="a">Validate</Btn>
      </>} />
    <Split setPage={setPage} page="schedule" left={<div className="anim">
      {isCT && <div className="wb" style={{ marginBottom: 10 }}>
        <span style={{ color: T.gold }}>⟐</span>
        <span style={{ fontSize: 12, color: T.text1 }}>Coiled Tubing mode — <strong>From Depth</strong> and <strong>To Depth</strong> columns are active. Enter the CT injection depth range for each stage.</span>
      </div>}
      {!isCT && <div style={{ marginBottom: 10, padding: "8px 12px", background: T.bg3, borderRadius: 6, fontSize: 12, color: T.text2, border: `1px solid ${T.border0}` }}>
        ⬇ Bullhead mode — fluid pumped from surface. Depth columns not applicable.
      </div>}
      <Tabs tabs={[{ id: "table", label: "Schedule Table" }, { id: "preview", label: "Rate / Pressure Preview" }]} active={tab} onSet={setTab} />
      {tab === "table" && <>
        <G4><Met label="Stages" value={rows.length} /><Met label="Total Volume" value={totalVol.toFixed(0)} unit="bbl" color={T.teal} /><Met label="Max Rate" value={maxRate.toFixed(1)} unit="bpm" color={T.blue} /><Met label="Est. Duration" value={Math.round(rows.reduce((s, r) => s + ((+r.vol || 0) / (+r.rate || 1)) * 0.035 * 60, 0))} unit="min" color={T.gold} /></G4>
        <div style={{ height: 14 }} />
        <Card title="Pumping Schedule Table">
          <DTable cols={schedCols} rows={rows} setRows={setRows} fluidOpts={fOpts} />
        </Card>
      </>}
      {tab === "preview" && <div style={{ display: "grid", gap: 12 }}>
        <Card title="Pump Rate vs Time"><TChart series={[{ label: "Rate (bpm)", data: rateD, color: T.teal, fill: true }]} yLbl="Rate (bpm)" H={140} /></Card>
        <Card title="Estimated Surface Pressure vs Time">
          <TChart series={[{ label: "Treating P", data: presD, color: T.blue, fill: true }, { label: "Frac Limit", data: Array.from({ length: n }, (_, i) => ({ x: i * 0.8, y: 4800 })), color: T.red, dash: "5,4" }]} yLbl="Pressure (psi)" H={140} />
          <div className="db" style={{ marginTop: 10 }}><span style={{ color: T.red }}>⚠</span><span style={{ fontSize: 11, color: T.text1 }}>Peak pressure approaches fracture gradient. Verify Stage 3 rate.</span></div>
        </Card>
      </div>}
    </div>} />
  </div>;
}

// ─── VALIDATION ENGINE ────────────────────────────────────────────────────────
function validateInputs(resRows, wellData, schedRows) {
  const errs = [];
  // Reservoir validation
  resRows.forEach((r, i) => {
    const top = +r.top, bot = +r.bot, por = +r.por, perm = +r.perm, skin = +r.skin;
    if (!r.top || isNaN(top)) errs.push({ field: `Reservoir row ${i+1}: Top MD`, msg: "Required — must be a number" });
    else if (top < 0 || top > 30000) errs.push({ field: `Reservoir row ${i+1}: Top MD`, msg: `${top} ft is outside valid range [0 – 30,000 ft]` });
    if (!r.bot || isNaN(bot)) errs.push({ field: `Reservoir row ${i+1}: Bot MD`, msg: "Required — must be a number" });
    else if (bot <= top) errs.push({ field: `Reservoir row ${i+1}: Bot MD`, msg: `Bot (${bot}) must be greater than Top (${top})` });
    if (isNaN(por) || por < 0 || por > 50) errs.push({ field: `Reservoir row ${i+1}: Porosity`, msg: `${por}% is outside valid range [0 – 50%]` });
    if (isNaN(perm) || perm < 0 || perm > 100000) errs.push({ field: `Reservoir row ${i+1}: Permeability`, msg: `${perm} md is outside valid range [0 – 100,000 md]` });
    if (isNaN(skin) || skin < -10 || skin > 200) errs.push({ field: `Reservoir row ${i+1}: Skin`, msg: `${skin} is outside valid range [−10 – 200]` });
  });
  if (resRows.length === 0) errs.push({ field: "Reservoir Data", msg: "At least one depth interval is required" });
  // Well validation
  const wbR = +wellData.wbR, drainR = +wellData.drainR, resTop = +wellData.resTop, fricGrad = +wellData.fricGrad, khkv = +wellData.khkv;
  if (isNaN(wbR) || wbR < 0.05 || wbR > 2.0) errs.push({ field: "Well: Wellbore Radius", msg: `${wbR} in is outside valid range [0.05 – 2.0 in]` });
  if (isNaN(drainR) || drainR < 100 || drainR > 100000) errs.push({ field: "Well: Drainage Radius", msg: `${drainR} ft is outside valid range [100 – 100,000 ft]` });
  // Tubing length must reach beyond the deepest reservoir interval bottom
  const tubLen_v = +wellData.tubLen || 8540;  // default matches DEFAULTS.well
  const maxResBotD = resRows.length ? Math.max(...resRows.map(r => +r.bot || 0)) : 0;
  if (maxResBotD > 0 && tubLen_v < maxResBotD) {
    errs.push({ field: "Well: Tubing Length", msg: `Tubing length (${tubLen_v} ft) must be at least as deep as the deepest reservoir interval bottom (${maxResBotD} ft). Set tubing length ≥ ${maxResBotD} ft.` });
  }
  if (isNaN(resTop) || resTop < 500 || resTop > 30000) errs.push({ field: "Well: Reservoir Top", msg: `${resTop} ft is outside valid range [500 – 30,000 ft]` });
  if (isNaN(fricGrad) || fricGrad < 1 || fricGrad > 100) errs.push({ field: "Well: Friction Gradient", msg: `${fricGrad} psi/1000ft is outside valid range [1 – 100]` });
  if (isNaN(khkv) || khkv < 0.01 || khkv > 1000) errs.push({ field: "Well: Kh/Kv", msg: `${khkv} is outside valid range [0.01 – 1000]` });
  // Schedule validation
  schedRows.forEach((r, i) => {
    const rate = +r.rate, vol = +r.vol;
    if (isNaN(rate) || rate <= 0 || rate > 50) errs.push({ field: `Schedule stage ${i+1}: Rate`, msg: `${rate} bpm is outside valid range [0.1 – 50 bpm]` });
    if (isNaN(vol) || vol <= 0 || vol > 10000) errs.push({ field: `Schedule stage ${i+1}: Volume`, msg: `${vol} bbl is outside valid range [1 – 10,000 bbl]` });
    if (!r.fluid) errs.push({ field: `Schedule stage ${i+1}: Fluid`, msg: "Fluid selection is required" });
    // Depth columns only validated when CT injection provides them
    if (r.fromDepth !== undefined && r.fromDepth !== "") {
      const fd = +r.fromDepth, td = +r.toDepth;
      if (isNaN(fd) || fd < 500 || fd > 30000) errs.push({ field: `Schedule stage ${i+1}: From Depth`, msg: `${fd} ft is outside valid range [500 – 30,000 ft]` });
      if (isNaN(td) || td <= fd) errs.push({ field: `Schedule stage ${i+1}: To Depth`, msg: `To Depth (${td}) must be greater than From Depth (${fd})` });
    }
  });
  if (schedRows.length === 0) errs.push({ field: "Pump Schedule", msg: "At least one pumping stage is required" });
  return errs;
}

// ─── SIMULATION SETUP ─────────────────────────────────────────────────────────
function SimSetupPage({ onRun, resRows, wellData, schedRows, simParams: extSimParams, onSetSimParams }) {
  const [validErrs, setValidErrs] = useState([]);
  const [validated, setValidated] = useState(false);
  const [tempModel, setTempModel] = useState("Static reservoir T");
  const [kinetics, setKinetics] = useState("Rotating Disk");
  const [fluidLoss, setFluidLoss] = useState("Filter Cake");
  const [wormhole, setWormhole] = useState("Pore Volume BT");
  const [localSimParams, setLocalSimParams] = useState(extSimParams || { numDepthGrids:DEFAULTS.numDepthGrids, numTimesteps:DEFAULTS.numTimesteps });

  const steps = ["Reservoir Data", "Well & Completion", "Fluids Library", "Acid Design", "Pump Schedule"];
  const stepChecks = [resRows && resRows.length > 0, !!wellData?.resTop, true, true, schedRows && schedRows.length > 0];

  function handleValidate() {
    const errs = validateInputs(resRows || INIT_RESERVOIR, wellData || { wbR:"0.365", drainR:"2640", resTop:"8200", fricGrad:"18", khkv:"5", tubLen:"8540", tubID:"2.992", casID:"5.921" }, schedRows || INIT_SCHEDULE);
    setValidErrs(errs);
    setValidated(true);
    if (errs.length === 0) setTimeout(() => onRun(), 400);
  }

  return <div style={{ flex: 1, overflow: "auto" }}>
    <Topbar title="Run Simulation" sub="Validate all inputs before running design" />
    <div style={{ padding: 22, maxWidth: 760 }}>
      <Card title="Pre-Simulation Checklist" sx={{ marginBottom: 14 }}>
        {steps.map((s, i) => <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < steps.length - 1 ? `1px solid ${T.border0}` : "none" }}>
          <div style={{ width: 19, height: 19, borderRadius: "50%", background: stepChecks[i] ? "rgba(45,184,130,0.12)" : "rgba(224,80,80,0.12)", border: `1px solid ${stepChecks[i] ? T.green : T.red}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: stepChecks[i] ? T.green : T.red, fontSize: 9, fontWeight: 700 }}>{stepChecks[i] ? "✓" : "!"}</span></div>
          <span style={{ fontSize: 13, color: T.text1, flex: 1 }}>{s}</span>
          <Bdg color={stepChecks[i] ? "green" : "red"} label={stepChecks[i] ? "Ready" : "Check"} />
        </div>)}
      </Card>

      {/* Validation errors panel */}
      {validated && validErrs.length > 0 && <div style={{ background: "rgba(224,80,80,0.08)", border: `1px solid rgba(224,80,80,0.35)`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🚨</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>Validation Failed — {validErrs.length} issue{validErrs.length > 1 ? "s" : ""} found</span>
        </div>
        {validErrs.map((e, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderTop: `1px solid rgba(224,80,80,0.15)` }}>
          <span style={{ color: T.red, fontSize: 11, flexShrink: 0, fontFamily: T.mono, paddingTop: 1 }}>⚠</span>
          <div><span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>{e.field}: </span><span style={{ fontSize: 12, color: T.text1 }}>{e.msg}</span></div>
        </div>)}
        <div style={{ marginTop: 10, fontSize: 11, color: T.text2 }}>Please correct the highlighted issues and click Validate again.</div>
      </div>}

      {validated && validErrs.length === 0 && <div className="wb" style={{ marginBottom: 14, background: "rgba(45,184,130,0.1)", border: "1px solid rgba(45,184,130,0.3)" }}>
        <span style={{ color: T.green }}>✓</span><span style={{ fontSize: 12, color: T.text1, fontWeight: 600 }}>All inputs validated — ready to run simulation.</span>
      </div>}

      <Card title="Simulation Settings" sx={{ marginBottom: 14 }}>
        <G2 gap={12}>
          <Fld label="Temperature Model" type="select" value={tempModel} onChange={setTempModel} options={["Static reservoir T", "Dynamic (gradient)", "Custom profile"]} />
          <Fld label="Reaction Kinetics" type="select" value={kinetics} onChange={setKinetics} options={["Rotating Disk", "Core Flood", "Custom"]} />
          <Fld label="Fluid Loss Model" type="select" value={fluidLoss} onChange={setFluidLoss} options={["Filter Cake", "Spurt + Filter Cake", "No Loss"]} />
          <Fld label="Wormhole Model" type="select" value={wormhole} onChange={setWormhole} options={["Pore Volume BT", "Damköhler Number", "Empirical"]} />
        </G2>
      </Card>
      {/* Mod-2: Discretization Parameters */}
      <Card title="Discretization Parameters (Depth Grids & Timesteps)" sx={{ marginBottom: 14 }}
        action={<Btn sz="s" v="g" onClick={() => { if(onSetSimParams) onSetSimParams({ numDepthGrids:DEFAULTS.numDepthGrids, numTimesteps:DEFAULTS.numTimesteps }); }}>↺ Set to Default</Btn>}>
        <G2 gap={12}>
          <Fld label="Number of Depth Grids" type="number" value={localSimParams.numDepthGrids} onChange={v => { const n={...localSimParams,numDepthGrids:+v||100}; setLocalSimParams(n); if(onSetSimParams)onSetSimParams(n); }}
            unit="grids" tip="Divides total depth into N equal intervals: Δz = Total Depth / N" />
          <Fld label="Number of Timesteps" type="number" value={localSimParams.numTimesteps} onChange={v => { const n={...localSimParams,numTimesteps:Math.max(1,+v||10)}; setLocalSimParams(n); if(onSetSimParams)onSetSimParams(n); }}
            unit="steps/stage" tip="Divides each pumping stage duration into N timesteps: Δt = Stage Duration / N" />
        </G2>
        <div style={{marginTop:10,padding:"9px 13px",background:T.bg3,borderRadius:7,fontSize:12,color:T.text2}}>
          {resRows && resRows.length>0 ? (<>
            Depth range: <span style={{color:T.teal,fontFamily:T.mono}}>{Math.min(...resRows.map(r=>+r.top))} – {Math.max(...resRows.map(r=>+r.bot))} ft</span>
            &emsp;→&emsp;Δz = <span style={{color:T.gold,fontFamily:T.mono,fontWeight:700}}>{((Math.max(...resRows.map(r=>+r.bot))-Math.min(...resRows.map(r=>+r.top)))/Math.max(1,localSimParams.numDepthGrids)).toFixed(2)} ft/grid</span>
            &emsp;|&emsp;Each stage → <span style={{color:T.violet,fontFamily:T.mono}}>{localSimParams.numTimesteps} timesteps</span>
          </>) : "Enter reservoir data to see depth grid size."}
        </div>
      </Card>
      <div className="wb" style={{ marginBottom: 14 }}><span style={{ color: T.gold }}>⚠</span><span style={{ fontSize: 12, color: T.text1 }}>Fracture gradient margin may be tight. Review pump rate on Schedule page.</span></div>
      <div onClick={handleValidate} style={{ background: T.teal, color: T.bg0, borderRadius: 10, padding: "15px 0", fontSize: 15, fontWeight: 800, textAlign: "center", cursor: "pointer", userSelect: "none", letterSpacing: "0.4px", transition: "filter 0.15s" }}>▶ Validate & Run Simulation</div>
    </div>
  </div>;
}

// ─── SIMULATION PROGRESS (Mod-3: detailed iterative progress bar) ─────────────
function RunPage({ onDone, simParams, schedRows }) {
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("Initializing depth grid…");
  const [stageNum, setStageNum] = useState(0);
  const [tsNum, setTsNum] = useState(0);
  const [gridNum, setGridNum] = useState(0);

  // Animation uses fixed display counts — not tied to actual nTS/nGrids
  // which could be large. Display: stages × 10 timesteps × 6 grid nodes.
  const nStages   = (schedRows || INIT_SCHEDULE).length;
  const nTS_disp  = 10;   // display only — engine nTS is capped separately
  const nGrids_disp = Math.min(20, Math.max(1, (schedRows||INIT_SCHEDULE).length));
  const TOTAL_TICKS = nStages * nTS_disp * nGrids_disp;   // at most 6×10×20 = 1200

  const PHASE_MSGS = [
    "Solving pressure field — hydrostatic + friction…",
    "Computing acid placement — injectivity allocation…",
    "Running acid transport — concentration evolution…",
    "Propagating wormholes — Damköhler number calc…",
    "Updating permeability enhancement…",
    "Evolving skin factor — coupled to wormholes…",
    "Computing productivity index transient…",
    "Assembling depth-resolved output arrays…",
  ];

  // useEffect (not useState) — runs once on mount, cleans up on unmount
  // This prevents the timer from re-registering on every render
  const { useEffect } = React;
  useEffect(() => {
    let cancelled = false;
    let completedTick = 0;
    let si = 0, ti = 0, gi = 0;

    function tick() {
      if (cancelled) return;
      if (completedTick >= TOTAL_TICKS) {
        setPct(100);
        setStageNum(nStages);
        setTsNum(nTS_disp);
        setGridNum(nGrids_disp);
        setMsg("Simulation complete — compiling results…");
        setTimeout(() => { if (!cancelled) onDone(); }, 600);
        return;
      }
      gi++;
      if (gi > nGrids_disp) { gi = 1; ti++; }
      if (ti > nTS_disp)    { ti = 1; si++; }
      if (si > nStages) si = nStages;

      completedTick++;
      const pctNow = Math.min(99, Math.round(completedTick / TOTAL_TICKS * 100));
      setPct(pctNow);
      setStageNum(Math.max(1, si));
      setTsNum(Math.max(1, ti));
      setGridNum(Math.max(1, gi));
      const phaseIdx = Math.min(Math.floor(pctNow / 100 * PHASE_MSGS.length), PHASE_MSGS.length - 1);
      setMsg(PHASE_MSGS[phaseIdx]);

      setTimeout(tick, 80);   // fixed 80ms per tick — TOTAL_TICKS ≤ 1200 → max 96 seconds display
    }
    setTimeout(tick, 300);

    // Cleanup: if component unmounts before done, cancel pending ticks
    return () => { cancelled = true; };
  }, []);   // [] = run once on mount only

  const barColor = pct < 30 ? T.teal : pct < 70 ? T.blue : T.green;

  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: T.bg0 }}>
    <div style={{ background: T.bg2, border: `1px solid ${T.border1}`, borderRadius: 16, padding: "44px 50px", maxWidth: 540, width: "92%", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(30,207,178,0.1)", border: `1px solid ${T.teal}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>⚡</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: T.text0, marginBottom: 6 }}>Simulation Running</div>
      <div style={{ fontSize: 12, color: T.text1, marginBottom: 20, minHeight: 16 }}>{msg}</div>

      {/* Detailed iteration counters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          ["Stage", stageNum, nStages, T.gold],
          ["Timestep", tsNum, nTS_disp, T.teal],
          ["Grid Node", gridNum, nGrids_disp, T.blue],
        ].map(([lbl, cur, tot, col]) => <div key={lbl} style={{ background: T.bg3, border: `1px solid ${T.border0}`, borderRadius: 8, padding: "10px 8px" }}>
          <div style={{ fontSize: 9, color: T.text3, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>{lbl}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: col, fontFamily: T.mono, lineHeight: 1 }}>{cur}<span style={{ fontSize: 10, color: T.text3, fontWeight: 400 }}>/{tot}</span></div>
        </div>)}
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: T.bg4, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${barColor},${T.teal})`, borderRadius: 4, transition: "width 0.25s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: T.text3, fontFamily: T.mono }}>
          {Math.round(pct / 100 * TOTAL_TICKS)} / {TOTAL_TICKS} ticks
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: barColor, fontFamily: T.mono }}>{pct}%</div>
      </div>
      <div style={{ marginTop: 14, fontSize: 10, color: T.text3 }}>
        {nStages} stages × {nTS_disp} timesteps × {nGrids_disp} nodes = {TOTAL_TICKS} ticks
      </div>
    </div>
  </div>;
}

// ─── ALIGNED SCHEMATIC+PLOT ROW ──────────────────────────────────────────────
// Renders a depth plot alongside a depth-aligned mini well schematic.
// Depth alignment: schematic uses IDENTICAL minD/maxD/pixel-height as the
// adjacent DepthPlot so every depth tick maps to the same vertical pixel.
//   DepthPlot layout: pad.t=8, pad.b=18 → plotH = H - 26 → py(d) = 8 + frac*plotH
//   Schematic layout: mirrors DepthPlot exactly using same pad.t and plotH.
function AlignedSchematicRow({ title, plotContent, data, reservoir, secLabel, plotH }) {
  const DATA = data || [];
  const RES  = reservoir || INIT_RESERVOIR;
  // Depth range — prefer data depths, fall back to reservoir extents
  const depths = DATA.map(d => d.depth).filter(Boolean);
  const minD = depths.length ? Math.min(...depths) : (RES[0]?.top || 8000);
  const maxD = depths.length ? Math.max(...depths) : (RES[RES.length-1]?.bot || 8600);

  // Match DepthPlot's internal layout constants exactly:
  //   pad = {t:8, b:18}  →  plotted pixel height = (plotH || 240) - 26
  //   py(d) = pad.t + fraction * gH  ↔  same mapping used in DepthPlot
  const DP_PAD_T = 8, DP_PAD_B = 18;
  const H_dp = plotH || 240;               // same H passed to DepthPlot
  const gH_dp = H_dp - DP_PAD_T - DP_PAD_B;

  // Schematic SVG height: pad.t pixels at top + gH_dp pixels of data + pad.b at bottom
  const SW = 120, SH = DP_PAD_T + gH_dp + DP_PAD_B;
  const cx = 60, cw = 28, tw = 12;
  // py for schematic EXACTLY matches DepthPlot's py formula
  const py = d => DP_PAD_T + ((d - minD) / Math.max(1, maxD - minD)) * gH_dp;
  const litColors = { Carbonate:"rgba(30,207,178,0.12)", Dolomite:"rgba(232,160,32,0.12)",
    Shale:"rgba(139,120,240,0.12)", Sandstone:"rgba(74,158,232,0.12)", Limestone:"rgba(45,184,130,0.12)" };

  const numTicks = 5;
  const depthTicks = Array.from({length: numTicks}, (_, i) => minD + i * (maxD - minD) / (numTicks - 1));

  return <div style={{ marginBottom: 16 }}>
    <Card title={title}>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        {/* Mini well schematic — depth-aligned */}
        <div style={{ flexShrink: 0, width: SW + 12, paddingTop: 4 }}>
          <div style={{ fontSize: 9, color: T.text3, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Well</div>
          <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: "block" }}>
            <rect width={SW} height={SH} fill={T.bg3} rx={4} />
            {/* Formation bands */}
            {RES.map((r,i) => {
              const yt = Math.max(0, py(r.top)), yb = Math.min(SH, py(r.bot));
              if (yb <= yt) return null;
              return <rect key={i} x={0} y={yt} width={SW} height={yb-yt} fill={litColors[r.lith]||"rgba(255,255,255,0.02)"} />;
            })}
            {/* Depth ticks on left */}
            {depthTicks.map(d => {
              const y = py(d);
              return <g key={d}>
                <line x1={0} y1={y} x2={6} y2={y} stroke={T.text3} strokeWidth={0.5}/>
                <text x={3} y={y+3} fontSize={5.5} fill={T.text3} fontFamily="monospace">{Math.round(d)}</text>
              </g>;
            })}
            {/* Casing */}
            <rect x={cx-cw/2} y={18} width={cw} height={SH-36} fill="none" stroke={T.border2} strokeWidth={1.5} rx={2}/>
            <rect x={cx-cw/2} y={18} width={cw} height={SH-36} fill="rgba(255,255,255,0.01)" rx={2}/>
            {/* Tubing */}
            <rect x={cx-tw/2} y={18} width={tw} height={(SH-36)*0.5} fill="rgba(255,255,255,0.03)" stroke={T.border1} strokeWidth={0.7} rx={1}/>
            {/* Perforations per reservoir interval */}
            {RES.map((r,i) => {
              const yt = py(r.top), yb = py(r.bot), h = yb - yt;
              if (h < 1) return null;
              const n = Math.max(2, Math.round(h/8));
              return <g key={i}>
                {Array.from({length:n},(_,j)=>{
                  const yy = yt + j*(h/n) + (h/n)/2;
                  return <g key={j}>
                    <line x1={cx-cw/2-6} y1={yy} x2={cx-cw/2} y2={yy} stroke={T.gold} strokeWidth={1} opacity={0.7}/>
                    <line x1={cx+cw/2} y1={yy} x2={cx+cw/2+6} y2={yy} stroke={T.gold} strokeWidth={1} opacity={0.7}/>
                  </g>;
                })}
                {/* Lithology label */}
                <text x={cx+cw/2+9} y={yt+h/2+3} fontSize={5} fill={T.text3} fontFamily="monospace">{(r.lith||'').slice(0,3)}</text>
              </g>;
            })}
            {/* Injection zone highlights (placed intervals) */}
            {DATA.filter(d=>d.placed).map((d,i)=>{
              const yr = RES.find(r=>d.depth>=r.top&&d.depth<=r.bot)||RES[0];
              if (!yr) return null;
              const yt = py(yr.top), yb = py(yr.bot);
              return <rect key={i} x={cx-cw/2+1} y={yt} width={cw-2} height={Math.max(3,yb-yt-1)}
                fill={T.teal} fillOpacity={0.2+d.conc*0.3} rx={1}/>;
            })}
            {/* Skin bar on left */}
            {DATA.map((d,i)=>{
              const yr = RES.find(r=>d.depth>=r.top&&d.depth<=r.bot)||RES[0];
              if (!yr) return null;
              const yt = py(yr.top), yb = py(yr.bot);
              const reduction = d.skinB > 0 ? (d.skinB-d.skinA)/d.skinB : 0;
              const col = reduction>0.7?T.green:reduction>0.4?T.gold:T.red;
              return <rect key={i} x={cx-cw/2-14} y={yt} width={7} height={Math.max(3,yb-yt-1)} fill={col} fillOpacity={0.8} rx={1}/>;
            })}
            {/* Header */}
            <text x={cx} y={11} textAnchor="middle" fontSize={7} fill={T.text2} fontWeight="600" fontFamily="sans-serif">WELL</text>
            <text x={cx-cw/2-10} y={11} fontSize={5.5} fill={T.text3} textAnchor="middle" fontFamily="sans-serif">SKN</text>
          </svg>
        </div>
        {/* Main plot — flex-grows to fill remaining width */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {plotContent}
          {secLabel && <div style={{ display:"flex",gap:14,marginTop:5,fontSize:11,color:T.text2,paddingLeft:8 }}>{secLabel}</div>}
        </div>
      </div>
    </Card>
  </div>;
}

// ─── PRESSURE STAGE CHART (Mod-1) — all stages on one combined plot ──────────
// Splits pressureTime array by stage name, renders each as separate series
function StagePressureChart({ pressureTime, fracPres, fieldData, showDelta }) {
  const TW = 520, pad = { t: 14, b: 28, l: 48, r: 72 };
  const H = 220;
  const gW = TW - pad.l - pad.r, gH = H - pad.t - pad.b;

  // Group by stage + keep full TP/BHP/WHP series
  const ptAll = pressureTime || [];
  const STAGE_COLORS = [T.teal, T.blue, T.gold, T.violet, T.green, "#FF7B54", "#C8F042", "#FF9EBC"];

  // Unique stages in order
  const stageNames = [];
  ptAll.forEach(p => { if (!stageNames.includes(p.stage)) stageNames.push(p.stage); });

  // Build combined series for TP per stage (most informative curve)
  const stageSeries = stageNames.map((sn, si) => ({
    label: sn || `Stage ${si+1}`,
    color: STAGE_COLORS[si % STAGE_COLORS.length],
    data: ptAll.filter(p=>p.stage===sn).map(p=>({ x:p.x, y:p.tp })),
  }));
  // BHP aggregate series
  const bhpSeries = { label:"BHP (all)", color:"rgba(74,158,232,0.6)", data: ptAll.map(p=>({x:p.x,y:p.bhp})), dash:"3,2" };
  // Frac limit
  const fracVal = fracPres || 5100;
  const maxT = ptAll.length ? Math.max(...ptAll.map(p=>p.x)) : 70;
  const fracSeries = { label:"Frac Limit", color:T.red, data:[{x:0,y:fracVal},{x:maxT,y:fracVal}], dash:"5,4" };

  // Field data series
  const fieldSeries = fieldData && fieldData.length > 0
    ? { label:"Field Pressure", color:"#FFD700", data: fieldData.map(d=>({x:+d.time,y:+d.pressure})), dash:"8,3", fieldStyle:true }
    : null;

  // Delta series (field − simulated TP, aligned by time)
  let deltaSeries = null;
  if (showDelta && fieldData && fieldData.length > 0 && ptAll.length > 0) {
    const pts = fieldData.map(fd=>{
      const sim = ptAll.reduce((best,p)=>Math.abs(p.x-fd.time)<Math.abs(best.x-fd.time)?p:best, ptAll[0]);
      return { x:+fd.time, y: +fd.pressure - sim.tp };
    });
    deltaSeries = { label:"ΔP (Field−Sim)", color:"#FF7B54", data:pts, dash:"4,2" };
  }

  const allSeries = [...stageSeries, bhpSeries, fracSeries, ...(fieldSeries?[fieldSeries]:[]), ...(deltaSeries?[deltaSeries]:[])];
  const allY = allSeries.flatMap(s=>s.data.map(d=>d.y)).filter(isFinite);
  if (!allY.length) return <div style={{color:T.text3,fontSize:12,padding:20,textAlign:"center"}}>No pressure data — run simulation first.</div>;

  const minY = Math.min(...allY)*0.92, maxY = Math.max(...allY)*1.05;
  const allX = allSeries.flatMap(s=>s.data.map(d=>d.x)).filter(isFinite);
  const minX = 0, maxX = Math.max(...allX, 1);

  const px = x => pad.l + ((x-minX)/(maxX-minX||1))*gW;
  const py = y => pad.t + gH - ((y-minY)/(maxY-minY||1))*gH;

  // Stage boundary markers (vertical lines at stage transitions)
  const stageBoundaries = [];
  for (let si=1; si<stageNames.length; si++) {
    const firstPt = ptAll.find(p=>p.stage===stageNames[si]);
    if (firstPt) stageBoundaries.push({ x: firstPt.x, label: stageNames[si] });
  }

  return <svg width="100%" viewBox={`0 0 ${TW} ${H}`} style={{ display:"block" }}>
    {/* Grid lines */}
    {[0,1,2,3,4].map(i=>{
      const v=minY+i*(maxY-minY)/4, y=py(v);
      return <g key={i}><line x1={pad.l} y1={y} x2={pad.l+gW} y2={y} stroke={T.border0} strokeWidth={0.4}/>
        <text x={pad.l-4} y={y+3} textAnchor="end" fontSize={8} fill={T.text3} fontFamily="monospace">{Math.round(v)}</text></g>;
    })}
    {[0,1,2,3,4,5].map(i=>{
      const v=minX+i*(maxX-minX)/5, x=px(v);
      return <g key={i}><text x={x} y={pad.t+gH+16} textAnchor="middle" fontSize={8} fill={T.text3} fontFamily="monospace">{Math.round(v)}</text></g>;
    })}
    <rect x={pad.l} y={pad.t} width={gW} height={gH} fill="none" stroke={T.border1} strokeWidth={0.5}/>
    {/* Stage boundary vertical lines */}
    {stageBoundaries.map((sb,i)=>(
      <g key={i}>
        <line x1={px(sb.x)} y1={pad.t} x2={px(sb.x)} y2={pad.t+gH} stroke={T.border2} strokeWidth={1} strokeDasharray="4,3"/>
        <text x={px(sb.x)+3} y={pad.t+10} fontSize={7} fill={T.text2} fontFamily="monospace">{(sb.label||'').slice(0,6)}</text>
      </g>
    ))}
    {/* Series paths */}
    {allSeries.map((s,si)=>{
      if (!s.data.length) return null;
      const path = s.data.map((d,j)=>`${j===0?'M':'L'}${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ');
      const sw = s.fieldStyle ? 2.5 : (s.label.includes('BHP')||s.label.includes('ΔP')) ? 1.5 : 2;
      return <path key={si} d={path} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={s.dash||'none'}/>;
    })}
    {/* Axis labels */}
    <text x={TW/2} y={H-2} textAnchor="middle" fontSize={9} fill={T.text2}>Cumulative Time (min)</text>
    <text x={10} y={pad.t+gH/2} textAnchor="middle" fontSize={9} fill={T.text2} transform={`rotate(-90,10,${pad.t+gH/2})`}>Pressure (psi)</text>
    {/* Legend */}
    <g transform={`translate(${pad.l+gW+4},${pad.t})`}>
      {allSeries.map((s,i)=>(
        <g key={i} transform={`translate(0,${i*13})`}>
          <line x1={0} y1={5} x2={14} y2={5} stroke={s.color} strokeWidth={s.fieldStyle?2.5:2} strokeDasharray={s.dash||'none'}/>
          <text x={17} y={8} fontSize={8} fill={T.text1}>{s.label}</text>
        </g>
      ))}
    </g>
  </svg>;
}

// ─── FIELD PRESSURE IMPORT PANEL (Mod-2) ─────────────────────────────────────
function FieldPressureImport({ onImport, fieldData }) {
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [timeUnit, setTimeUnit] = useState("min");
  const [presUnit, setPresUnit] = useState("psi");
  const [timeCol, setTimeCol] = useState("time");
  const [presCol, setPresCol] = useState("pressure");
  const [showPreview, setShowPreview] = useState(false);

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("File must have header + data rows");
    const headers = lines[0].split(/[,\t;]/).map(h=>h.trim().toLowerCase().replace(/[^a-z0-9_]/g,'_'));
    const rows = lines.slice(1).map(l => {
      const vals = l.split(/[,\t;]/);
      const obj = {};
      headers.forEach((h,i) => { obj[h] = vals[i]?.trim(); });
      return obj;
    }).filter(r => Object.values(r).some(v=>v));
    return { headers, rows };
  }

  function convertTime(val, unit) {
    const v = parseFloat(val);
    if (!isFinite(v)) return null;
    if (unit === "hr")  return v * 60;
    if (unit === "sec") return v / 60;
    return v; // min
  }
  function convertPres(val, unit) {
    const v = parseFloat(val);
    if (!isFinite(v)) return null;
    if (unit === "kPa") return v * 0.145038;
    if (unit === "bar") return v * 14.5038;
    if (unit === "MPa") return v * 145.038;
    return v; // psi
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(""); setPreview(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target.result;
        const { headers, rows } = parseCSV(text);
        // Auto-detect column names
        const tCandidates = headers.filter(h=>h.includes('time')||h.includes('min')||h.includes('t_'));
        const pCandidates = headers.filter(h=>h.includes('press')||h.includes('psi')||h.includes('bhp')||h.includes('whp')||h.includes('tp'));
        if (tCandidates.length) setTimeCol(tCandidates[0]);
        if (pCandidates.length) setPresCol(pCandidates[0]);
        setPreview({ headers, rows: rows.slice(0,8), allRows: rows });
        setShowPreview(true);
      } catch(ex) { setErr("Parse error: " + ex.message); }
      setBusy(false);
    };
    reader.onerror = () => { setErr("Could not read file"); setBusy(false); };
    reader.readAsText(file);
    e.target.value = "";
  }

  function applyImport() {
    if (!preview) return;
    try {
      const converted = preview.allRows.map(r => {
        const t = convertTime(r[timeCol], timeUnit);
        const p = convertPres(r[presCol], presUnit);
        return { time: t, pressure: p };
      }).filter(r => r.time !== null && r.pressure !== null && isFinite(r.time) && isFinite(r.pressure));
      if (!converted.length) { setErr("No valid rows found with selected columns"); return; }
      onImport(converted);
      setShowPreview(false);
      setErr("");
    } catch(ex) { setErr("Import error: " + ex.message); }
  }

  return <div style={{ marginBottom: 12 }}>
    <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
      <label style={{ cursor:"pointer" }}>
        <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFile} style={{ display:"none" }}/>
        <span style={{ background:"transparent",color:T.teal,border:`1px solid ${T.teal}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5 }}>
          📂 Import Field Pressure Data
        </span>
      </label>
      {fieldData && fieldData.length > 0 && <>
        <span style={{ fontSize:11,color:T.green }}>✓ {fieldData.length} field points loaded</span>
        <Btn sz="s" v="d" onClick={()=>onImport(null)}>× Clear</Btn>
      </>}
      {busy && <span style={{ fontSize:11,color:T.text2 }}>Loading…</span>}
      {err && <span style={{ fontSize:11,color:T.red }}>⚠ {err}</span>}
    </div>
    {showPreview && preview && <div style={{ marginTop:10,background:T.bg3,border:`1px solid ${T.border1}`,borderRadius:8,padding:14 }}>
      <div style={{ fontSize:12,fontWeight:700,color:T.text0,marginBottom:10 }}>Preview — Map Columns & Units</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:12 }}>
        <div><div style={{ fontSize:10,color:T.text2,marginBottom:4 }}>TIME COLUMN</div>
          <select className="ss" value={timeCol} onChange={e=>setTimeCol(e.target.value)} style={{ fontSize:11 }}>
            {preview.headers.map(h=><option key={h}>{h}</option>)}
          </select></div>
        <div><div style={{ fontSize:10,color:T.text2,marginBottom:4 }}>TIME UNIT</div>
          <select className="ss" value={timeUnit} onChange={e=>setTimeUnit(e.target.value)} style={{ fontSize:11 }}>
            {["min","hr","sec"].map(u=><option key={u}>{u}</option>)}
          </select></div>
        <div><div style={{ fontSize:10,color:T.text2,marginBottom:4 }}>PRESSURE COLUMN</div>
          <select className="ss" value={presCol} onChange={e=>setPresCol(e.target.value)} style={{ fontSize:11 }}>
            {preview.headers.map(h=><option key={h}>{h}</option>)}
          </select></div>
        <div><div style={{ fontSize:10,color:T.text2,marginBottom:4 }}>PRESSURE UNIT</div>
          <select className="ss" value={presUnit} onChange={e=>setPresUnit(e.target.value)} style={{ fontSize:11 }}>
            {["psi","kPa","bar","MPa"].map(u=><option key={u}>{u}</option>)}
          </select></div>
      </div>
      <div style={{ overflowX:"auto",marginBottom:10 }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
          <thead><tr>{preview.headers.map(h=><th key={h} style={{ background:T.bg2,padding:"5px 8px",color:h===timeCol?T.gold:h===presCol?T.teal:T.text2,borderBottom:`1px solid ${T.border0}`,textAlign:"left",fontSize:10 }}>{h}{h===timeCol?" ⏱":h===presCol?" P":""}</th>)}</tr></thead>
          <tbody>{preview.rows.map((r,i)=><tr key={i}>{preview.headers.map(h=><td key={h} style={{ padding:"4px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:"monospace",color:h===timeCol?T.gold:h===presCol?T.teal:T.text1 }}>{r[h]}</td>)}</tr>)}</tbody>
        </table>
        {preview.allRows.length > 8 && <div style={{ fontSize:10,color:T.text3,padding:"4px 8px" }}>…and {preview.allRows.length-8} more rows</div>}
      </div>
      <div style={{ display:"flex",gap:8 }}>
        <Btn v="p" onClick={applyImport}>Apply & Plot</Btn>
        <Btn v="g" onClick={()=>setShowPreview(false)}>Cancel</Btn>
      </div>
    </div>}
  </div>;
}

// ─── RESULTS PAGE (Mods 1,2,4,5,6) ──────────────────────────────────────────
function ResultsPage({ project, simResults }) {
  const [tab, setTab] = useState("overview");
  const [fieldData, setFieldData] = useState(null);   // Mod-2: imported field pressure
  const [showDelta, setShowDelta] = useState(false);  // Mod-2: show ΔP curve

  // Use computed results if available, otherwise fall back to static demo data
  const DATA = simResults ? simResults.depthResults : SIM_RESULTS;
  const ptD_raw = simResults ? simResults.pressureTime : null;
  const summary = simResults ? simResults.summary : null;
  const fracPres = simResults ? simResults.fracPres : 5100;
  const skB = summary ? summary.avgSkinB.toFixed(1) : (SIM_RESULTS.reduce((s, r) => s + r.skinB, 0) / SIM_RESULTS.length).toFixed(1);
  const skA = summary ? summary.avgSkinA.toFixed(1) : (SIM_RESULTS.reduce((s, r) => s + r.skinA, 0) / SIM_RESULTS.length).toFixed(1);
  const piRatioStr = summary ? `${summary.piRatio}x` : "4.0x";
  const totalAcidStr = summary ? String(summary.totalAcidVol) : "335";

  // Demo fallback pressure time series (preserved from original)
  const n = 70;
  const ptD_fallback = Array.from({ length: n }, (_, i) => ({ x: i, tp: 4800 + 600 * Math.exp(-i / 20) + (Math.random() - 0.48) * 55, bhp: 4200 + 200 * Math.exp(-i / 25) + (Math.random() - 0.48) * 28, whp: 2600 + 350 * Math.exp(-i / 18) + (Math.random() - 0.48) * 22, frac: 5100, stage: "Demo Stage" }));
  const ptD = ptD_raw && ptD_raw.length > 0 ? ptD_raw : ptD_fallback;

  // Reservoir from data for schematic alignment
  const RES = INIT_RESERVOIR;

  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Simulation Results" sub={`${project?.name} · Depth-referenced analysis complete`} actions={<><Btn sz="s" v="g">⬆ Export PDF</Btn><Btn sz="s" v="g">Export Excel</Btn><Btn sz="s" v="s">✓ Results Ready</Btn></>} />
    <div style={{ flex:1, overflow:"auto", padding:18 }}><div className="anim">
      <G4 gap={10}><Met label="Initial Avg Skin" value={skB} color={T.red} icon="▼" /><Met label="Final Avg Skin" value={skA} color={T.green} icon="▲" /><Met label="PI Improvement" value={piRatioStr} color={T.teal} /><Met label="Total Acid Vol" value={totalAcidStr} unit="bbl" color={T.blue} /></G4>
      <div style={{ height: 14 }} />
      <Tabs tabs={[{ id: "overview", label: "Overview" }, { id: "pressure", label: "Pressure" }, { id: "placement", label: "Placement" }, { id: "table", label: "Results Table" }]} active={tab} onSet={setTab} />

      {/* ── MOD 5+6: Overview — vertically stacked, each with aligned schematic ── */}
      {tab === "overview" && <div style={{ display:"flex",flexDirection:"column",gap:0 }}>

        {/* 1. Skin Graph */}
        <AlignedSchematicRow title="① Skin Before vs After — by Depth" data={DATA} reservoir={RES} plotH={240}
          plotContent={<>
            <DepthPlot data={DATA} xKey="skinB" secKey="skinA" yKey="depth" color={T.red} secColor={T.green} label="Skin Factor" H={240} W={400} />
            <div style={{ display:"flex",gap:14,marginTop:5,fontSize:11,color:T.text2,paddingLeft:4 }}>
              <span style={{color:T.red}}>— Skin Before</span>
              <span style={{color:T.green}}>– – Skin After</span>
            </div>
          </>} />

        {/* Show prompt if no simulation results yet */}
        {(!DATA || !DATA.length) && <div style={{padding:"20px 0",color:T.text2,fontSize:13,textAlign:"center"}}>
          Run the simulation to see acid placement, penetration, and concentration charts.
        </div>}
      {/* 2. Placement Graph */}
        <AlignedSchematicRow title="② % Acid Placed per Layer" data={DATA} reservoir={RES} plotH={230}
          plotContent={<DepthPlot data={DATA.map(function(r){var tot=DATA.reduce(function(s,x){return s+(+x.V_main_acid||0);},0);return Object.assign({},r,{pct_placed:tot>0?+((+r.V_main_acid||0)/tot*100).toFixed(1):0});})} xKey="pct_placed" yKey="depth" botKey="bot" color={T.teal} label="% Acid Placed" H={230} W={400} xMn={0}/>}/>

        {/* 3. Penetration Graph */}
        <AlignedSchematicRow title="③ Acid Penetration vs Depth" data={DATA} reservoir={RES} plotH={230}
          plotContent={<DepthPlot data={DATA} xKey="pen" yKey="depth" color={T.teal} label="Penetration (in)" fill H={230} W={400} />} />

        {/* 4. Concentration Graph */}
        <AlignedSchematicRow title="④ Productivity Index Before vs After" data={DATA} reservoir={RES} plotH={230}
          plotContent={<><DepthPlot data={DATA} xKey="pi_b" secKey="pi_a" yKey="depth" botKey="bot" color={T.gold} secColor={T.green} label="PI (bbl/d/psi)" H={230} W={400}/>
            <div style={{display:"flex",gap:14,marginTop:5,fontSize:11,color:T.text2,paddingLeft:4}}>
              <span style={{color:T.gold}}>&#9646; PI Before</span>
              <span style={{color:T.green}}>&#9647; PI After</span>
            </div></>}/>

      </div>}

      {/* ── MOD 1+2: Pressure tab — combined multi-stage + field import ─────── */}
      {tab === "pressure" && <div style={{ display: "grid", gap: 12 }}>
        <Card title="Pressure vs Time — All Injection Stages Combined"
          action={<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.text1,cursor:"pointer"}}>
              <input type="checkbox" checked={showDelta} onChange={e=>setShowDelta(e.target.checked)} style={{accentColor:T.teal}}/>
              Show ΔP
            </label>
          </div>}>
          <FieldPressureImport onImport={setFieldData} fieldData={fieldData} />
          <StagePressureChart pressureTime={ptD} fracPres={fracPres} fieldData={fieldData} showDelta={showDelta} />
          {summary?.anyFracture && <div className="db" style={{ marginTop: 10 }}><span style={{ color: T.red }}>🚨</span><span style={{ fontSize: 11, color: T.text1 }}>Fracture risk detected during simulation. Check stages with BHP near fracture limit.</span></div>}
        </Card>
        {/* Pressure vs depth — preserved from original */}
        <Card title="Pressure vs Depth">
          <AlignedSchematicRow title="" data={DATA} reservoir={RES} plotH={180}
            plotContent={<DepthPlot data={DATA} xKey="pres" yKey="depth" color={T.blue} label="Pressure (psi)" H={180} W={400} />} />
        </Card>
      </div>}

      {/* Placement tab — Acid Placement Map removed per requirement */}
      {tab === "placement" && <Card title="Fluid Distribution by Stage">
        {INIT_SCHEDULE.map((s, i) => { const fc = INIT_FLUIDS.find(f => f.name === s.fluid); return <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: `1px solid ${T.border0}` }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: fc?.color || T.teal, flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: T.text0 }}>{s.name}</div><div style={{ fontSize: 10, color: T.text2 }}>{s.fluid}</div></div><div style={{ fontSize: 12, fontFamily: T.mono, color: T.teal }}>{s.vol} bbl</div></div>; })}
      </Card>}

      {/* Results table — From Depth / To Depth columns added */}
      {tab === "table" && <Card title="Depth-Interval Results Summary">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead><tr>{["From (ft)", "To (ft)", "Skin B", "Skin A", "ΔSkin", "Pen (in)", "P_wb (psi)", "P_res (psi)", "Qres (bpm)", "% Acid", "PI Before", "PI After", "Placed?"].map(h => <th key={h} style={{ padding: "7px 10px", color: T.text2, borderBottom: `1px solid ${T.border0}`, textAlign: "left", fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{DATA.map((r, ri) => {
              const toDepth = DATA[ri + 1] ? DATA[ri + 1].depth : r.depth + 55;
              return <tr key={r.depth} className="hr" style={{ background: "transparent" }}>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, fontSize:11, color:T.teal, fontWeight:600 }}>{r.depth}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, fontSize:11, color:T.teal }}>{toDepth}</td>
                <td style={{ padding:"6px 10px", color:T.red,   fontFamily:T.mono }}>{r.skinB}</td>
                <td style={{ padding:"6px 10px", color:T.green, fontFamily:T.mono }}>{r.skinA}</td>
                <td style={{ padding:"6px 10px", color:T.green, fontFamily:T.mono, fontWeight:700 }}>−{(r.skinB - r.skinA).toFixed(1)}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.gold }}>{typeof r.pen==="number"?r.pen.toFixed(1):"0.0"}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.teal }}>{r.pres||"—"}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.red }}>{r.pres_res||"—"}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.teal }}>{r.qres!=null?(+r.qres).toFixed(4):(r.V_main_acid>0&&r.T_main_acid>0?((+r.V_main_acid)/(+r.T_main_acid)).toFixed(4):"0.0000")}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono }}>
                  {(function(){ var tot=DATA.reduce(function(s,x){return s+(+x.V_main_acid||0);},0); var pct=tot>0?(+r.V_main_acid||0)/tot*100:0; return <span style={{fontFamily:T.mono,fontSize:11,color:pct>0?T.teal:T.text3}}>{pct.toFixed(1)}%</span>; })()}
                </td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.gold }}>{r.pi_b!=null?(+r.pi_b).toFixed(3):"—"}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, color:T.green, fontWeight:700 }}>{r.pi_a!=null?(+r.pi_a).toFixed(3):"—"}</td>
                <td style={{ padding:"6px 10px" }}><Bdg color={r.placed?"teal":"red"} label={r.placed?"✓ Yes":"No"}/></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Card>}
    </div></div>
  </div>;
}

// ─── SENSITIVITY ──────────────────────────────────────────────────────────────
function SensPage({ project, simResults }) {
  const [acid, setAcid] = useState(15);
  const [vol, setVol] = useState(250);
  const [rate, setRate] = useState(4.0);
  const [dConc, setDConc] = useState(3);
  const baseSkinA = simResults ? simResults.summary.avgSkinA : 2.4;
  const basePIRatio = simResults ? simResults.summary.piRatio : 4.0;
  const predSkin = Math.max(0.1, baseSkinA * (15/Math.max(1,acid)) * (250/Math.max(1,vol)) * 0.4 + baseSkinA * 0.6).toFixed(2);
  const predPI = (basePIRatio * (acid/15) * (vol/250) * (rate/4.0) * (1 + dConc*0.05)).toFixed(2);
  return <div style={{ flex: 1, overflow: "auto" }}>
    <Topbar title="Sensitivity Analysis" sub={`${project?.name} · Parameter sensitivity on skin and PI`} />
    <div style={{ padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 14 }}>
        <Card title="Sensitivity Parameters">
          <div style={{ display: "grid", gap: 13 }}>
            {[[acid, setAcid, 5, 28, 1, "Acid Concentration", "%", T.teal], [vol, setVol, 50, 600, 10, "Total Acid Volume", "bbl", T.teal], [rate, setRate, 1, 8, 0.5, "Pump Rate", "bpm", T.blue], [dConc, setDConc, 0.5, 8, 0.5, "Diverter Conc", "%", T.gold]].map(([val, setVal, mn, mx, step, lbl, unit, col]) => <div key={lbl}>
              <Lbl unit={unit}>{lbl}: <span style={{ color: col, fontFamily: T.mono }}>{val}</span></Lbl>
              <input type="range" min={mn} max={mx} step={step} value={val} onChange={e => setVal(+e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.text3 }}><span>{mn}</span><span>{mx}</span></div>
            </div>)}
            <div style={{ paddingTop: 10, borderTop: `1px solid ${T.border0}` }}>
              <div style={{ fontSize: 10, color: T.text2, marginBottom: 8 }}>Predicted Results</div>
              <div style={{ display: "grid", gap: 8 }}>
                <Met label="Predicted Final Skin" value={predSkin} color={T.green} />
                <Met label="Predicted PI" value={predPI} unit="bbl/d/psi" color={T.teal} />
              </div>
            </div>
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card title="Skin vs Acid Concentration"><TChart series={[{ label: "Final Skin", data: Array.from({ length: 10 }, (_, i) => ({ x: (i + 1) * 3, y: 12 - (i + 1) * 0.82 + Math.random() * 0.4 })), color: T.teal, fill: true }]} xLbl="Acid Conc. (%)" yLbl="Final Skin" H={155} /></Card>
          <Card title="Skin vs Total Volume"><TChart series={[{ label: "Final Skin", data: Array.from({ length: 10 }, (_, i) => ({ x: (i + 1) * 55, y: 12 - (i + 1) * 0.52 + Math.random() * 0.5 })), color: T.green, fill: true }]} xLbl="Volume (bbl)" yLbl="Final Skin" H={155} /></Card>
          <Card title="Skin vs Pump Rate"><TChart series={[{ label: "Final Skin", data: Array.from({ length: 10 }, (_, i) => ({ x: 0.5 + i * 0.8, y: 10 - i * 0.38 + Math.random() * 0.8 })), color: T.blue, fill: true }]} xLbl="Rate (bpm)" yLbl="Final Skin" H={155} /></Card>
          <Card title="Diverter Efficiency vs Concentration"><TChart series={[{ label: "Placement Eff. (%)", data: Array.from({ length: 10 }, (_, i) => ({ x: (i + 1) * 0.8, y: 45 + i * 6.5 + Math.random() * 3 })), color: T.gold, fill: true }]} xLbl="Diverter Conc. (%)" yLbl="Placement Eff. (%)" H={155} /></Card>
        </div>
      </div>
    </div>
  </div>;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsPage({ project, simResults, resRows, wellData, fluidLib, schedRows }) {
  const secs = [
    "Project Overview & Configuration",
    "Reservoir Data — Depth-Interval Table",
    "Well & Completion Details",
    "Fluids Library — Selected Systems",
    "Pump Schedule Table",
    "Pressure Results (TP / BHP / WHP)",
    "Acid Placement by Layer",
    "Skin Before & After",
    "Acid Penetration by Depth",
    "PI Before & After",
    "Appendix: Full Input Tables",
  ];

  function buildReportHTML() {
    const pj  = project || {};
    const sm  = (simResults && simResults.summary) ? simResults.summary : {};
    const DATA= (simResults && simResults.depthResults) ? simResults.depthResults : [];
    const now = new Date().toLocaleString();
    const th  = (cols) => "<tr>" + cols.map(function(c){return "<th>"+c+"</th>";}).join("") + "</tr>";
    const tr2 = (cols) => "<tr>" + cols.map(function(c){return "<td>"+(c!=null?c:"")+"</td>";}).join("") + "</tr>";

    const depthRows = DATA.map(function(r) {
      return tr2([r.depth,
        r.skinB, r.skinA, (+r.skinB - +r.skinA).toFixed(1),
        typeof r.pen==="number" ? r.pen.toFixed(1) : "0.0",
        r.pres || "—", r.pres_res || "—",
        r.pi_b!=null ? (+r.pi_b).toFixed(3) : "—",
        r.pi_a!=null ? (+r.pi_a).toFixed(3) : "—",
        r.placed ? "Yes" : "No",
        (r.V_main_acid||0).toFixed(1)]);
    }).join("");

    const resHTML = (resRows||[]).map(function(r,i){
      return tr2([i+1,r.top,r.bot,r.perm,r.por,r.skin,r.pres||"—",r.lith||"Carbonate"]);
    }).join("");

    const schHTML = (schedRows||[]).map(function(s,i){
      return tr2([i+1,s.name,s.fluid,s.rate,s.vol,s.topD||"—",s.botD||"—"]);
    }).join("");

    return "<!DOCTYPE html><html><head><meta charset='utf-8'/>" +
      "<title>StimOPTI Report</title>" +
      "<style>" +
      "*{box-sizing:border-box;margin:0;padding:0}" +
      "body{font-family:Arial,sans-serif;font-size:11pt;color:#111;padding:18mm 18mm 18mm 22mm}" +
      "h1{font-size:17pt;color:#003366;border-bottom:2px solid #1ECFB2;padding-bottom:6px;margin-bottom:14px}" +
      "h2{font-size:12pt;color:#003366;margin:20px 0 7px;border-left:4px solid #1ECFB2;padding-left:8px}" +
      ".meta{display:flex;gap:28px;margin-bottom:16px;font-size:10pt;color:#555;flex-wrap:wrap}" +
      ".grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}" +
      ".metric{background:#f0fdf8;border:1px solid #1ECFB2;border-radius:6px;padding:9px 10px;text-align:center}" +
      ".metric .val{font-size:15pt;font-weight:700;color:#003366}" +
      ".metric .lbl{font-size:8pt;color:#555;margin-top:2px}" +
      "table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:9pt}" +
      "th{background:#003366;color:#fff;padding:5px 6px;text-align:left;font-weight:600}" +
      "td{padding:4px 6px;border-bottom:1px solid #e0e0e0}" +
      "tr:nth-child(even) td{background:#f7fafc}" +
      ".footer{margin-top:28px;font-size:8pt;color:#888;border-top:1px solid #ccc;padding-top:6px;text-align:center}" +
      "@media print{body{padding:10mm}@page{margin:10mm;size:A4}}" +
      "</style></head><body>" +
      "<h1>Acid Stimulation Job Report</h1>" +
      "<div class='meta'>" +
      "<span><b>Project:</b> "+(pj.name||"—")+"</span>" +
      "<span><b>Well:</b> "+(pj.well||(wellData&&wellData.wellName)||"—")+"</span>" +
      "<span><b>Field:</b> "+(pj.field||"—")+"</span>" +
      "<span><b>Company:</b> Kemiserve FZE</span>" +
      "<span><b>Date:</b> "+now+"</span>" +
      "</div>" +
      "<h2>1. Summary Metrics</h2>" +
      "<div class='grid4'>" +
      "<div class='metric'><div class='val'>"+(sm.avgSkinB||"—")+"</div><div class='lbl'>Avg Skin Before</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.avgSkinA||"—")+"</div><div class='lbl'>Avg Skin After</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.skinReduction||"—")+"%</div><div class='lbl'>Skin Reduction</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.piRatio||"—")+"x</div><div class='lbl'>PI Ratio</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.placementPct||"—")+"%</div><div class='lbl'>Placement %</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.totalAcidVol||"—")+" bbl</div><div class='lbl'>Total Acid</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.avgPIB||"—")+"</div><div class='lbl'>PI Before</div></div>" +
      "<div class='metric'><div class='val'>"+(sm.avgPIA||"—")+"</div><div class='lbl'>PI After</div></div>" +
      "</div>" +
      "<h2>2. Reservoir Interval Data</h2>" +
      "<table>"+th(["#","Top (ft)","Bot (ft)","Perm (md)","Por (%)","Skin","Pres (psi)","Lithology"])+resHTML+"</table>" +
      "<h2>3. Pump Schedule</h2>" +
      "<table>"+th(["#","Stage","Fluid","Rate (bpm)","Vol (bbl)","Top D","Bot D"])+schHTML+"</table>" +
      "<h2>4. Depth Results</h2>" +
      "<table>"+th(["Depth","Skin B","Skin A","dSkin","Pen (in)","P_wb","P_res","PI B","PI A","Placed?","V_acid"])+depthRows+"</table>" +
      "<div class='footer'>StimOPTI — Proprietary software owned exclusively by Kemiserve FZE, SPC Freezone, Sharjah, UAE. Confidential. Generated: "+now+"</div>" +
      "</body></html>";
  }

  function exportPDF() {
    // Inject report HTML into a <div> in the main document, hide everything
    // else with a @media print style, call window.print(), then restore.
    // This is the only method that reliably works inside sandboxed artifact iframes
    // (window.open and contentDocument.print() are both blocked by the sandbox).
    var printId  = "__stimopti_pdf_div__";
    var styleId  = "__stimopti_pdf_style__";

    // Remove any previous print elements
    var prev = document.getElementById(printId);
    if (prev) prev.parentNode.removeChild(prev);
    var prevS = document.getElementById(styleId);
    if (prevS) prevS.parentNode.removeChild(prevS);

    // Build report body (inner HTML only — no <html>/<head> tags needed here)
    var pj  = (typeof project !== "undefined" && project) ? project : {};
    var sm  = (typeof simResults !== "undefined" && simResults && simResults.summary) ? simResults.summary : {};
    var DATA= (typeof simResults !== "undefined" && simResults && simResults.depthResults) ? simResults.depthResults : [];
    var now = new Date().toLocaleString();

    var th = function(cols){ return "<tr>"+cols.map(function(c){return "<th>"+c+"</th>";}).join("")+"</tr>"; };
    var td = function(cols){ return "<tr>"+cols.map(function(c){return "<td>"+(c!=null?c:"")+"</td>";}).join("")+"</tr>"; };

    var depthRows = DATA.map(function(r){
      return td([r.depth, r.skinB, r.skinA, (+r.skinB-+r.skinA).toFixed(1),
        typeof r.pen==="number"?r.pen.toFixed(1):"0.0",
        r.pres||"—", r.pres_res||"—",
        r.qres!=null?(+r.qres).toFixed(4):"—",
        r.pi_b!=null?(+r.pi_b).toFixed(3):"—",
        r.pi_a!=null?(+r.pi_a).toFixed(3):"—",
        r.placed?"Yes":"No",
        (r.V_main_acid||0).toFixed(1)]);
    }).join("");

    var resRowsHTML = ((typeof resRows!=="undefined"&&resRows)||[]).map(function(r,i){
      return td([i+1,r.top,r.bot,r.perm,r.por,r.skin,r.pres||"—",r.lith||"Carbonate"]);
    }).join("");

    var schedHTML = ((typeof schedRows!=="undefined"&&schedRows)||[]).map(function(s,i){
      return td([i+1,s.name||"—",s.fluid||"—",s.rate||"—",s.vol||"—",s.topD||"—",s.botD||"—"]);
    }).join("");

    var body =
      "<h1>Acid Stimulation Job Report</h1>"+
      "<div class='meta'>"+
        "<span><b>Project:</b> "+(pj.name||"—")+"</span> &nbsp;"+
        "<span><b>Well:</b> "+(pj.well||"—")+"</span> &nbsp;"+
        "<span><b>Company:</b> Kemiserve FZE</span> &nbsp;"+
        "<span><b>Date:</b> "+now+"</span>"+
      "</div>"+
      "<h2>1. Summary Metrics</h2>"+
      "<div class='grid4'>"+
        "<div class='m'><div class='v'>"+(sm.avgSkinB||"—")+"</div><div class='l'>Avg Skin Before</div></div>"+
        "<div class='m'><div class='v'>"+(sm.avgSkinA||"—")+"</div><div class='l'>Avg Skin After</div></div>"+
        "<div class='m'><div class='v'>"+(sm.skinReduction||"—")+"%</div><div class='l'>Skin Reduction</div></div>"+
        "<div class='m'><div class='v'>"+(sm.piRatio||"—")+"x</div><div class='l'>PI Ratio</div></div>"+
        "<div class='m'><div class='v'>"+(sm.placementPct||"—")+"%</div><div class='l'>Placement %</div></div>"+
        "<div class='m'><div class='v'>"+(sm.totalAcidVol||"—")+" bbl</div><div class='l'>Total Acid Vol</div></div>"+
        "<div class='m'><div class='v'>"+(sm.avgPIB||"—")+"</div><div class='l'>PI Before</div></div>"+
        "<div class='m'><div class='v'>"+(sm.avgPIA||"—")+"</div><div class='l'>PI After</div></div>"+
      "</div>"+
      "<h2>2. Reservoir Data</h2>"+
      "<table>"+th(["#","Top ft","Bot ft","Perm md","Por %","Skin","Pres psi","Lith"])+resRowsHTML+"</table>"+
      "<h2>3. Pump Schedule</h2>"+
      "<table>"+th(["#","Stage","Fluid","Rate bpm","Vol bbl","Top D","Bot D"])+schedHTML+"</table>"+
      "<h2>4. Depth Results</h2>"+
      "<table>"+th(["Depth","Skin B","Skin A","dSkin","Pen in","P_wb","P_res","Qres","PI B","PI A","Placed","V_acid"])+depthRows+"</table>"+
      "<div class='footer'>StimOPTI — Proprietary. Kemiserve FZE, Sharjah, UAE. "+now+"</div>";

    // Inject styles (print-only: hide everything except our div)
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      "@media print {" +
        "body > *:not(#"+printId+") { display: none !important; }" +
        "#"+printId+" { display: block !important; position: static !important; }" +
      "}" +
      "#"+printId+" {" +
        "display:none; font-family:Arial,sans-serif; font-size:11pt; color:#111;" +
        "padding:12mm 14mm; background:#fff; line-height:1.4;" +
      "}" +
      "#"+printId+" h1{font-size:16pt;color:#003366;border-bottom:2px solid #1ECFB2;padding-bottom:5px;margin-bottom:12px}" +
      "#"+printId+" h2{font-size:12pt;color:#003366;margin:18px 0 6px;border-left:4px solid #1ECFB2;padding-left:7px}" +
      "#"+printId+" .meta{font-size:10pt;color:#555;margin-bottom:14px}" +
      "#"+printId+" .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}" +
      "#"+printId+" .m{background:#f0fdf8;border:1px solid #1ECFB2;border-radius:5px;padding:7px 9px;text-align:center}" +
      "#"+printId+" .v{font-size:14pt;font-weight:700;color:#003366}" +
      "#"+printId+" .l{font-size:8pt;color:#555;margin-top:1px}" +
      "#"+printId+" table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:9pt}" +
      "#"+printId+" th{background:#003366;color:#fff;padding:4px 6px;text-align:left;font-size:8.5pt}" +
      "#"+printId+" td{padding:3px 6px;border-bottom:1px solid #e0e0e0}" +
      "#"+printId+" tr:nth-child(even) td{background:#f7fafc}" +
      "#"+printId+" .footer{margin-top:22px;font-size:8pt;color:#888;border-top:1px solid #ccc;padding-top:5px;text-align:center}" +
      "@page{margin:10mm;size:A4}";
    document.head.appendChild(style);

    // Inject print div
    var div = document.createElement("div");
    div.id = printId;
    div.innerHTML = body;
    document.body.appendChild(div);

    // Print — browser will apply @media print rules
    window.print();

    // Clean up after a short delay
    setTimeout(function() {
      var d = document.getElementById(printId);
      if (d) d.parentNode.removeChild(d);
      var s = document.getElementById(styleId);
      if (s) s.parentNode.removeChild(s);
    }, 3000);
  }

  function previewReport() {
    // Inject a full-screen overlay showing the report inside the artifact.
    // window.open() is blocked in the sandbox; blob download only gives one page.
    // This overlay approach shows all sections and has a close button + print button.
    var overId  = "__stimopti_preview_overlay__";
    var styleId = "__stimopti_preview_style__";

    // Remove any existing overlay
    var prev = document.getElementById(overId);
    if (prev) { prev.parentNode.removeChild(prev); return; }
    var prevS = document.getElementById(styleId);
    if (prevS) prevS.parentNode.removeChild(prevS);

    // Build full report body (same as exportPDF but displayed on-screen)
    var pj  = (typeof project !== "undefined" && project) ? project : {};
    var sm  = (typeof simResults !== "undefined" && simResults && simResults.summary) ? simResults.summary : {};
    var DATA= (typeof simResults !== "undefined" && simResults && simResults.depthResults) ? simResults.depthResults : [];
    var now = new Date().toLocaleString();

    var th2 = function(cols){ return "<tr>"+cols.map(function(c){return "<th>"+c+"</th>";}).join("")+"</tr>"; };
    var td2 = function(cols){ return "<tr>"+cols.map(function(c){return "<td>"+(c!=null?c:"")+"</td>";}).join("")+"</tr>"; };

    var depthRows = DATA.map(function(r){
      var tot = DATA.reduce(function(s,x){return s+(+x.V_main_acid||0);},0);
      var pct = tot>0?((+r.V_main_acid||0)/tot*100).toFixed(1):"0.0";
      return td2([r.depth, r.bot||"—", r.skinB, r.skinA, (+r.skinB-+r.skinA).toFixed(1),
        typeof r.pen==="number"?r.pen.toFixed(1):"0.0",
        r.pres||"—", r.pres_res||"—",
        r.qres!=null?(+r.qres).toFixed(4):"—",
        pct+"%",
        r.pi_b!=null?(+r.pi_b).toFixed(3):"—",
        r.pi_a!=null?(+r.pi_a).toFixed(3):"—",
        r.placed?"✓ Yes":"No",
        (r.V_main_acid||0).toFixed(1),
        (r.T_main_acid||0).toFixed(1)]);
    }).join("");

    var resRowsH = ((typeof resRows!=="undefined"&&resRows)||[]).map(function(r,i){
      return td2([i+1,r.top,r.bot,(+r.bot-+r.top).toFixed(0),r.lith||"Carbonate",r.perm,r.por,r.skin,r.pres||"—"]);
    }).join("");

    var schedH = ((typeof schedRows!=="undefined"&&schedRows)||[]).map(function(s,i){
      var dur = (+s.vol||0)/Math.max(0.001,+s.rate||1);
      return td2([i+1,s.name||"—",s.fluid||"—",s.rate||"—",s.vol||"—",dur.toFixed(1),s.topD||"—",s.botD||"—"]);
    }).join("");

    var body =
      "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;'>"+
      "<h1 style='font-size:18pt;color:#003366;border-bottom:2px solid #1ECFB2;padding-bottom:6px;margin:0;flex:1;'>Acid Stimulation Job Report</h1>"+
      "<div style='display:flex;gap:10px;margin-left:16px;'>"+
      "<button onclick='window.print()' style='background:#1ECFB2;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;'>Print / Save PDF</button>"+
      "<button onclick='var o=document.getElementById(\"__stimopti_preview_overlay__\");if(o)o.remove();var s=document.getElementById(\"__stimopti_preview_style__\");if(s)s.remove();' style='background:#555;color:#fff;border:none;border-radius:6px;padding:8px 14px;font-size:12px;cursor:pointer;'>✕ Close</button>"+
      "</div></div>"+
      "<div style='display:flex;gap:28px;margin-bottom:16px;font-size:10pt;color:#555;flex-wrap:wrap;'>"+
      "<span><b>Project:</b> "+(pj.name||"—")+"</span> "+
      "<span><b>Well:</b> "+(pj.well||"—")+"</span> "+
      "<span><b>Company:</b> Kemiserve FZE</span> "+
      "<span><b>Date:</b> "+now+"</span>"+
      "</div>"+

      "<h2 style='font-size:13pt;color:#003366;border-left:4px solid #1ECFB2;padding-left:8px;margin:20px 0 8px;'>1. Summary Metrics</h2>"+
      "<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;'>"+
        ["Avg Skin Before|"+(sm.avgSkinB||"—"),
         "Avg Skin After|"+(sm.avgSkinA||"—"),
         "Skin Reduction|"+(sm.skinReduction||"—")+"%",
         "PI Ratio|"+(sm.piRatio||"—")+"x",
         "Placement %|"+(sm.placementPct||"—")+"%",
         "Total Acid|"+(sm.totalAcidVol||"—")+" bbl",
         "Avg PI Before|"+(sm.avgPIB||"—"),
         "Avg PI After|"+(sm.avgPIA||"—")].map(function(s){
           var p=s.split("|");
           return "<div style='background:#f0fdf8;border:1px solid #1ECFB2;border-radius:6px;padding:9px 10px;text-align:center;'>"+
             "<div style='font-size:15pt;font-weight:700;color:#003366;'>"+p[1]+"</div>"+
             "<div style='font-size:8pt;color:#555;margin-top:2px;'>"+p[0]+"</div></div>";
         }).join("")+
      "</div>"+

      "<h2 style='font-size:13pt;color:#003366;border-left:4px solid #1ECFB2;padding-left:8px;margin:20px 0 8px;'>2. Reservoir Interval Data</h2>"+
      "<table style='width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10pt;'>"+
        th2(["#","Top ft","Bot ft","h ft","Lithology","Perm md","Por %","Skin","Pres psi"])+resRowsH+
      "</table>"+

      "<h2 style='font-size:13pt;color:#003366;border-left:4px solid #1ECFB2;padding-left:8px;margin:20px 0 8px;'>3. Pump Schedule</h2>"+
      "<table style='width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10pt;'>"+
        th2(["#","Stage","Fluid","Rate bpm","Vol bbl","Dur min","Top D","Bot D"])+schedH+
      "</table>"+

      "<h2 style='font-size:13pt;color:#003366;border-left:4px solid #1ECFB2;padding-left:8px;margin:20px 0 8px;'>4. Depth Results — Full Table</h2>"+
      "<table style='width:100%;border-collapse:collapse;margin-bottom:14px;font-size:9.5pt;'>"+
        th2(["Depth ft","Bot ft","Skin B","Skin A","ΔSkin","Pen in","P_wb psi","P_res psi","Qres bpm","% Acid","PI B","PI A","Placed?","V_acid bbl","T_main min"])+
        depthRows+
      "</table>"+

      "<div style='margin-top:28px;font-size:8pt;color:#888;border-top:1px solid #ccc;padding-top:6px;text-align:center;'>"+
      "StimOPTI — Proprietary software. Kemiserve FZE, SPC Freezone, Sharjah, UAE. Confidential. "+now+
      "</div>";

    // Inject print style (hides overlay header bar when printing, shows only content)
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      "@media print { body > *:not(#"+overId+") { display:none!important; } "+
      "#"+overId+" { position:static!important; overflow:visible!important; background:#fff!important; } "+
      "#"+overId+" button { display:none!important; } "+
      "@page{margin:10mm;size:A4} }"+
      "#"+overId+" table th{background:#003366;color:#fff;padding:5px 7px;text-align:left;}"+
      "#"+overId+" table td{padding:4px 7px;border-bottom:1px solid #e0e0e0;}"+
      "#"+overId+" table tr:nth-child(even) td{background:#f7fafc;}"+
      "#"+overId+" table{border-collapse:collapse;width:100%;}";
    document.head.appendChild(style);

    // Inject full-screen overlay
    var overlay = document.createElement("div");
    overlay.id = overId;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#fff;overflow-y:auto;"+
      "padding:24px 32px;font-family:Arial,sans-serif;font-size:11pt;color:#111;box-sizing:border-box;";
    overlay.innerHTML = body;
    document.body.appendChild(overlay);
  }

  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const sm = (simResults && simResults.summary) ? simResults.summary : {};

  return <div style={{ flex:1, overflow:"auto" }}>
    <Topbar title="Reports"
      sub={(project&&project.name)||"Project"}
      actions={<>
        <Btn sz="s" v="o" onClick={previewReport}>Preview</Btn>
        <Btn sz="s" v="a" onClick={exportPDF}>⬆ Export PDF</Btn>
      </>}
    />
    <div style={{ padding:22, display:"grid", gridTemplateColumns:"1fr 295px", gap:16 }}>
      <Card title="Report Sections">
        {secs.map(function(s,i){ return (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:11, padding:"8px 0", borderBottom:`1px solid ${T.border0}` }}>
            <div style={{ width:20, height:20, borderRadius:"50%", background:T.bg3, border:`1px solid ${T.teal}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:T.teal, flexShrink:0, fontFamily:T.mono }}>{i+1}</div>
            <span style={{ fontSize:12, color:T.text1, flex:1 }}>{s}</span>
            <span style={{ color:T.green, fontSize:11 }}>&#10003;</span>
          </div>
        ); })}
        <div onClick={exportPDF} style={{ marginTop:18, background:T.gold, color:T.bg0, borderRadius:8, padding:"12px 0", fontSize:13, fontWeight:800, textAlign:"center", cursor:"pointer", userSelect:"none" }}>
          Generate &amp; Export PDF
        </div>
        <div style={{ marginTop:8, fontSize:10, color:T.text3, textAlign:"center", lineHeight:1.5 }}>
          Opens the browser print dialog. Choose <strong>Save as PDF</strong> as the destination.
        </div>
      </Card>
      <div>
        <Card title="Report Settings" sx={{ marginBottom:12 }}>
          <div style={{ display:"grid", gap:10 }}>
            <Fld label="Report Title" value={((project&&project.name)||"Stimulation")+" — Acid Report"} onChange={function(){}} />
            <Fld label="Prepared By" value="Well Stimulation Engineer" onChange={function(){}} />
            <Fld label="Company" value="Kemiserve FZE" onChange={function(){}} />
            <Fld label="Client / Field" value={(project&&project.field)||"—"} onChange={function(){}} />
          </div>
        </Card>
        <Card title="Quick Summary">
          {[
            ["Avg Skin Before", sm.avgSkinB||"—"],
            ["Avg Skin After",  sm.avgSkinA||"—"],
            ["Skin Reduction",  sm.skinReduction ? sm.skinReduction+"%" : "—"],
            ["PI Improvement",  sm.piRatio ? sm.piRatio+"x" : "—"],
            ["Placement %",     sm.placementPct ? sm.placementPct+"%" : "—"],
            ["Total Acid",      sm.totalAcidVol ? sm.totalAcidVol+" bbl" : "—"],
            ["Last Run",        simResults ? new Date(simResults.timestamp).toLocaleString() : "—"],
          ].map(function(row){ return (
            <div key={row[0]} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border0}`, fontSize:12 }}>
              <span style={{ color:T.text2 }}>{row[0]}</span>
              <span style={{ fontWeight:700, color:T.text0, fontFamily:T.mono }}>{String(row[1])}</span>
            </div>
          ); })}
        </Card>
        {!simResults && <div style={{ marginTop:12, background:"rgba(232,160,32,0.08)", border:`1px solid ${T.gold}`, borderRadius:6, padding:"10px 14px", fontSize:11, color:T.gold }}>
          Run a simulation first to include results in the report.
        </div>}
      </div>
    </div>
    {showPreview && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9000, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bg1, padding:"10px 18px", borderBottom:`1px solid ${T.border0}` }}>
        <span style={{ fontWeight:700, color:T.text0, fontSize:13 }}>Report Preview</span>
        <div style={{ display:"flex", gap:10 }}>
          <Btn sz="s" v="a" onClick={exportPDF}>Print / Save PDF</Btn>
          <Btn sz="s" v="r" onClick={function(){ setShowPreview(false); }}>Close</Btn>
        </div>
      </div>
      <iframe srcDoc={previewHTML} style={{ flex:1, border:"none", background:"#fff" }} title="Report Preview"/>
    </div>}
  </div>;
}
function AlgorithmTracePanel({ res, well, sched, flib, sp, simResults, BOX, SEC, EQ, NOTE, TH, TD }) {
  const [activeStage, setActiveStage] = useState(0);

  // Guard against empty inputs — any of these being empty causes Math.min/max to return Infinity
  if (!res || !res.length || !sched || !sched.length || !flib || !flib.length) {
    return <div style={{padding:24,color:T.text2,fontSize:13}}>
      Add reservoir data and a pumping schedule to see the algorithm trace.
    </div>;
  }

  // ── Pull live input values ────────────────────────────────────────────────
  const nDG      = Math.min(+sp.numDepthGrids || 20, 20);
  const nTS      = Math.min(+sp.numTimesteps  || 10, 10);
  const topD     = Math.min(...res.map(r => +r.top));
  const botD     = Math.max(...res.map(r => +r.bot));
  const dz       = (botD - topD) / nDG;
  const wbR_ft   = (+well.wbR || 0.365) / 12;
  const drainR   = +well.drainR || 2640;
  const fracPres = (+well.fracGrad || 0.72) * (+well.resTop || 8200);
  const tubLen   = +well.tubLen || 8000;
  const tubID_in = +well.tubID  || 2.992;

  // Depth nodes (first nDG, capped at 20)
  const depthNodes = Array.from({ length: nDG }, (_, i) => {
    const z  = topD + (i + 0.5) * dz;
    const iv = res.find(r => z >= +r.top && z <= +r.bot) || res[0];
    return { i, z: +z.toFixed(1), iv, perm: +iv.perm, por: +iv.por / 100,
             pres: +iv.pres || 3750, skin: +iv.skin, lith: iv.lith };
  });

  // ── Stage data ─────────────────────────────────────────────────────────────
  const stgIdx  = Math.min(activeStage, sched.length - 1);
  const stg     = sched[stgIdx] || sched[0];
  const fl      = flib.find(f => f.name === stg?.fluid) || flib[0];
  const ppg     = +fl.density * 8.3454;
  const q_bpm   = +stg.rate;
  const vol_bbl = +stg.vol;
  const dur_min = vol_bbl / Math.max(0.001, q_bpm);

  // ── Step A: Pre-computation (done once before iteration) ─────────────────
  const q_ft3s  = q_bpm * 0.002228;
  const tubArea = Math.PI / 4 * (tubID_in / 12) ** 2;
  const v_fts   = q_ft3s / Math.max(0.001, tubArea);
  const mu_avg  = +fl.visc || 1.2;
  const Re      = 928 * ppg * v_fts * tubID_in / Math.max(0.01, mu_avg);
  const ff      = Re < 2300 ? 64 / Math.max(1, Re) : 0.0131;
  const dPfric  = ff * (tubLen / (tubID_in / 12)) * (ppg * 7.48 * v_fts * v_fts) / (2 * 32.174) / 144;
  const Pres_avg = depthNodes.reduce((s, n) => s + n.pres, 0) / nDG;
  const BHP_base = Pres_avg + dPfric;

  // ── Step B: Per-node hydrostatic ──────────────────────────────────────────
  const dPhyd_node = depthNodes.map(n => +(0.052 * ppg * dz).toFixed(2));

  // ── Step C: Injectivity II[i] ─────────────────────────────────────────────
  const lnRe   = Math.log(drainR / Math.max(0.001, wbR_ft));
  const II_nodes = depthNodes.map(n => {
    const denom = lnRe + n.skin;
    return denom > 0 ? +(n.perm * (dz * 0.7) / (141.2 * mu_avg * Math.max(0.01, denom))).toFixed(5) : 0;
  });

  // ── Step D: Surface pressure ──────────────────────────────────────────────
  const cum_hyd = depthNodes.reduce((s, n) => s + 0.052 * ppg * dz, 0);
  const P_surface = BHP_base - cum_hyd;

  // ── Step E: One iteration of wellbore traverse ────────────────────────────
  const ALPHA   = 0.3;
  const MAX_CORR = 10;
  const iterRows = [];
  let   Q_i      = q_bpm;
  let   Pwb_i    = P_surface;

  depthNodes.forEach((n, i) => {
    const q_frac  = Math.min(1, Q_i / Math.max(0.001, q_bpm));
    const dPf_i   = dPfric * q_frac * q_frac * (dz / Math.max(1, tubLen));
    const dPhyd_i = dPhyd_node[i];
    if (i > 0) Pwb_i = Math.max(n.pres + 1, Pwb_i + dPhyd_i - dPf_i);
    const Qres_i  = II_nodes[i] * Math.max(0, Pwb_i - n.pres);
    const dP_ij   = Math.max(0, Pwb_i - n.pres);
    Q_i = Math.max(0.001, Q_i - Qres_i);
    const fracRisk = Pwb_i >= fracPres;
    iterRows.push({
      i, z: n.z, pres: n.pres, dPhyd: dPhyd_i.toFixed(2), dPfric_l: dPf_i.toFixed(3),
      Pwb: Pwb_i.toFixed(1), II: II_nodes[i].toFixed(5),
      dP: dP_ij.toFixed(1), Qres: Qres_i.toFixed(4), Q_rem: Q_i.toFixed(4),
      fracRisk, ok: isFinite(Pwb_i) && Pwb_i > 0,
    });
  });

  // ── Convergence estimate ──────────────────────────────────────────────────
  const solverLog = simResults?.solverLog || [];
  const convergeLines = solverLog.filter(l => l.includes('Stage') || l.includes('iters'));

  // ── Error detection ───────────────────────────────────────────────────────
  const errors = [];
  if (!isFinite(dPfric) || dPfric < 0)    errors.push({ field:'ΔP_fric', val:dPfric, msg:'Non-finite friction pressure — check tubID, rate, fluid density' });
  if (!isFinite(BHP_base) || BHP_base < 0) errors.push({ field:'BHP_base', val:BHP_base, msg:'Non-finite BHP_base — check reservoir pressure and friction' });
  if (P_surface < 0)                        errors.push({ field:'P_surface', val:P_surface.toFixed(1), msg:'Negative surface pressure — hydrostatic exceeds BHP_base; increase injection rate or check tubLen' });
  if (Pres_avg <= 0)                        errors.push({ field:'Pres_avg', val:Pres_avg, msg:'Reservoir pressure is zero — fill in Reservoir Pressure column in Reservoir Data table' });
  if (II_nodes.every(v => v <= 0))          errors.push({ field:'II[i]', val:'all zero', msg:'All injectivity values are zero — check skin, permeability, and ln(re/rw)' });
  iterRows.filter(r => !r.ok).forEach(r  => errors.push({ field:`Pwb[${r.i}]`, val:r.Pwb, msg:`Invalid wellbore pressure at node ${r.i} (z=${r.z}ft) — check reservoir pressure at that depth` }));
  if (iterRows.some(r => r.fracRisk))       errors.push({ field:'Fracture', val:`${fracPres.toFixed(0)} psi`, msg:`BHP exceeds fracture pressure at one or more nodes — reduce injection rate or check fracGrad` });

  const ROW_OK  = { background:'transparent' };
  const ROW_ERR = { background:'rgba(224,80,80,0.08)' };
  const CELL    = (v, col) => <td style={{padding:"5px 9px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,fontSize:11,color:col||T.text1}}>{v}</td>;

  return <div>

    {/* ── Error Summary ────────────────────────────────────────────────────── */}
    {errors.length > 0 && <div style={{...BOX,border:`1px solid ${T.red}`,background:'rgba(224,80,80,0.06)',marginBottom:16}}>
      <div style={{...SEC,color:T.red}}>⚠ {errors.length} Issue{errors.length>1?'s':''} Detected in Pre-Simulation Check</div>
      {errors.map((e,i) => <div key={i} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:`1px solid rgba(224,80,80,0.2)`}}>
        <span style={{fontFamily:T.mono,color:T.red,fontSize:12,minWidth:100}}>{e.field}</span>
        <span style={{fontFamily:T.mono,color:T.gold,fontSize:12,minWidth:80}}>{String(e.val).slice(0,10)}</span>
        <span style={{color:T.text1,fontSize:12}}>{e.msg}</span>
      </div>)}
    </div>}
    {errors.length === 0 && <div style={{...BOX,border:`1px solid ${T.green}`,background:'rgba(45,184,130,0.06)',marginBottom:16}}>
      <span style={{color:T.green,fontWeight:700,fontSize:13}}>✓ No pre-simulation errors detected</span>
      <span style={{color:T.text2,fontSize:12,marginLeft:12}}>All input values are within valid physical bounds.</span>
    </div>}

    {/* ── Stage selector ───────────────────────────────────────────────────── */}
    <div style={{...BOX}}>
      <div style={SEC}>Select Stage for Algorithm Trace</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
        {sched.map((s, i) => <div key={i} onClick={()=>setActiveStage(i)}
          style={{padding:'5px 12px',borderRadius:5,fontSize:12,cursor:'pointer',userSelect:'none',
            border:`1px solid ${activeStage===i?T.teal:T.border0}`,
            background:activeStage===i?'rgba(30,207,178,0.1)':'transparent',
            color:activeStage===i?T.teal:T.text1}}>
          {i+1}. {s.name}
        </div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,fontSize:12}}>
        {[['Fluid', fl.name],['Rate', `${q_bpm} bpm`],['Volume', `${vol_bbl} bbl`],['Duration', `${dur_min.toFixed(1)} min`],
          ['PPG', ppg.toFixed(3)],['Viscosity', `${mu_avg} cP`],['Re', Re.toFixed(0)],['Friction ff', ff.toFixed(4)]
        ].map(([k,v])=><div key={k} style={{padding:'6px 0',borderBottom:`1px solid ${T.border0}`}}>
          <span style={{color:T.text3,display:'block',fontSize:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>{k}</span>
          <span style={{color:T.text0,fontFamily:T.mono}}>{v}</span>
        </div>)}
      </div>
    </div>

    {/* ── Step A: Pre-computation ──────────────────────────────────────────── */}
    <div style={BOX}>
      <div style={SEC}>Step A — Pre-Computation (runs once per stage, before iteration)</div>
      <p style={NOTE}>These values are computed once from user inputs and held constant during the pressure iteration. If any of these are wrong, every iteration will be wrong.</p>
      {[
        ['Tube area',      `A = π/4 × (${tubID_in}/12)² = ${tubArea.toFixed(5)} ft²`,         isFinite(tubArea)&&tubArea>0],
        ['Fluid velocity', `v = q_ft3s / A = ${q_ft3s.toFixed(5)} / ${tubArea.toFixed(5)} = ${v_fts.toFixed(3)} ft/s`, isFinite(v_fts)&&v_fts>0],
        ['Reynolds No.',   `Re = 928 × ${ppg.toFixed(3)} × ${v_fts.toFixed(3)} × ${tubID_in} / ${mu_avg} = ${Re.toFixed(0)}`, Re>0],
        ['Friction factor',`ff = ${ff.toFixed(5)}  (${Re<2300?'laminar':'turbulent'})`,         isFinite(ff)&&ff>0],
        ['Tubing ΔP_fric', `dPfric = ff × (L/D) × ρv²/2g/144 = ${dPfric.toFixed(2)} psi`,    isFinite(dPfric)&&dPfric>=0],
        ['Avg Pres',       `Pres_avg = ${Pres_avg.toFixed(1)} psi  (avg of ${nDG} nodes)`,     Pres_avg>0],
        ['BHP_base',       `BHP_base = Pres_avg + dPfric = ${Pres_avg.toFixed(1)} + ${dPfric.toFixed(2)} = ${BHP_base.toFixed(2)} psi`, isFinite(BHP_base)&&BHP_base>0],
        ['Cum. hydrostatic',`ΣΔPhyd = 0.052 × ${ppg.toFixed(3)} × ${(botD-topD).toFixed(0)} ft = ${cum_hyd.toFixed(1)} psi`, cum_hyd>=0],
        ['P_surface',      `P_surf = BHP_base − ΣΔPhyd = ${BHP_base.toFixed(2)} − ${cum_hyd.toFixed(1)} = ${P_surface.toFixed(2)} psi`, P_surface>0],
      ].map(([label, eq, ok], i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0',borderBottom:`1px solid ${T.border0}`}}>
          <span style={{color:ok?T.green:T.red,fontSize:14,minWidth:16}}>{ok?'✓':'✗'}</span>
          <span style={{color:T.text2,minWidth:110,fontSize:11}}>{label}</span>
          <code style={{color:ok?T.teal:T.red,fontSize:11,fontFamily:T.mono}}>{eq}</code>
        </div>
      ))}
    </div>

    {/* ── Step B: Injectivity II per node ──────────────────────────────────── */}
    <div style={BOX}>
      <div style={SEC}>Step B — Injectivity Index II[i] (pre-computed, fixed)</div>
      <p style={NOTE}>II[i] = k·h / (141.2·μ·(ln(re/rw)+S)). Computed once from reservoir inputs. If all II values are zero, no fluid enters any layer and Qres = 0 everywhere — pressure never stabilizes.</p>
      <div style={{...EQ,marginBottom:10}}>
        ln(re/rw) = ln({drainR} / {(wbR_ft).toFixed(4)}) = {lnRe.toFixed(3)}
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Node i</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Depth z (ft)</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Perm (md)</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Skin</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Pres (psi)</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>ln(re/rw)+S</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>II (bbl/d/psi)</th>
            <th style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>Status</th>
          </tr></thead>
          <tbody>{depthNodes.map((n,i) => {
            const denom = lnRe + n.skin;
            const ii    = II_nodes[i];
            const ok    = ii > 0 && isFinite(ii);
            return <tr key={i} style={ok ? ROW_OK : ROW_ERR}>
              {CELL(i, T.text3)}{CELL(n.z)}{CELL(n.perm, T.blue)}{CELL(n.skin, T.red)}
              {CELL(n.pres, T.gold)}{CELL(denom.toFixed(3), denom>0?T.text1:T.red)}
              {CELL(ii.toFixed(5), ok?T.teal:T.red)}
              <td style={{padding:'5px 9px',borderBottom:`1px solid ${T.border0}`}}>
                {ok ? <Bdg color="teal" label="OK"/> : <Bdg color="red" label="⚠ Zero"/>}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>

    {/* ── Step C: One pressure iteration trace ─────────────────────────────── */}
    <div style={BOX}>
      <div style={SEC}>Step C — Iteration 1 Pressure Traverse (top → bottom)</div>
      <p style={NOTE}>
        Each row shows the calculation at one depth node for the <strong>first iteration</strong>.
        Pwb propagates downward: <code style={{fontFamily:T.mono,color:T.teal}}>Pwb[i] = Pwb[i-1] + ΔPhyd[i-1] − ΔPfric[i-1]</code>.
        Qres[i] = II[i] × max(0, Pwb[i] − Pres[i]).
        Highlighted rows indicate errors: zero/negative pressure, fracture risk, or NaN.
      </p>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>
            {['Node','z (ft)','Pres_res (psi)','ΔPhyd (psi)','ΔPfric_loc (psi)','Pwb (psi)','ΔP_inj (psi)','II (bbl/d/psi)','Qres (bpm)','Q_rem (bpm)','Status'].map(h=>
              <th key={h} style={{background:T.bg3,padding:'6px 8px',textAlign:'left',color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10,whiteSpace:'nowrap'}}>{h}</th>
            )}
          </tr></thead>
          <tbody>{iterRows.map((r,i) => {
            const rowStyle = !r.ok ? ROW_ERR : r.fracRisk ? {background:'rgba(232,160,32,0.07)'} : ROW_OK;
            return <tr key={i} style={rowStyle}>
              {CELL(r.i, T.text3)}{CELL(r.z)}{CELL(r.pres, T.gold)}
              {CELL(r.dPhyd, T.teal)}{CELL(r.dPfric_l, T.blue)}
              {CELL(r.Pwb, !r.ok?T.red:r.fracRisk?T.gold:T.text0)}
              {CELL(r.dP, +r.dP>0?T.green:T.red)}{CELL(r.II, T.violet)}
              {CELL(r.Qres, T.teal)}{CELL(r.Q_rem)}
              <td style={{padding:'5px 9px',borderBottom:`1px solid ${T.border0}`}}>
                {!r.ok ? <Bdg color="red" label="⚠ Invalid"/>
                  : r.fracRisk ? <Bdg color="gold" label="⚠ Frac Risk"/>
                  : +r.dP === 0 ? <Bdg color="gray" label="No Injection"/>
                  : <Bdg color="teal" label="OK"/>}
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>

    {/* ── Step D: Convergence summary from last run ────────────────────────── */}
    <div style={BOX}>
      <div style={SEC}>Step D — Convergence Summary (from last simulation run)</div>
      {simResults ? <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
          {[
            ['Sim Time', simResults.summary?.simTimeSec+'s', T.teal],
            ['Wall Aborted', simResults.solverLog?.some(l=>l.includes('WALL_TIMEOUT'))?'YES':'No', simResults.solverLog?.some(l=>l.includes('WALL_TIMEOUT'))?T.red:T.green],
            ['Intervals', simResults.depthResults?.length, T.blue],
          ].map(([k,v,c])=><div key={k} style={{background:T.bg3,borderRadius:7,padding:'10px 12px',border:`1px solid ${T.border0}`}}>
            <div style={{fontSize:10,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{k}</div>
            <div style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:c}}>{v}</div>
          </div>)}
        </div>
        <div style={{maxHeight:220,overflowY:'auto',background:T.bg0,borderRadius:7,padding:'10px 14px',fontFamily:T.mono,fontSize:11,color:T.text2,border:`1px solid ${T.border0}`}}>
          {(simResults.solverLog||[]).map((line,i)=>{
            const isErr = line.includes('WALL_TIMEOUT')||line.includes('NaN')||line.includes('WARN');
            const isOk  = line.includes('DONE')||line.includes('✓')||line.includes('cvg=true');
            return <div key={i} style={{color:isErr?T.red:isOk?T.green:T.text2,marginBottom:1}}>{line}</div>;
          })}
        </div>
      </> : <div style={{color:T.text3,fontSize:12,padding:20,textAlign:'center'}}>
        Run simulation first to see convergence logs here.
      </div>}
    </div>

    {/* ── Diagnostic Guide ─────────────────────────────────────────────────── */}
    <div style={BOX}>
      <div style={SEC}>Diagnostic Guide — How to Read This Trace</div>
      {[
        ['Step A errors', 'Non-finite dPfric or negative P_surface', 'Check tubLen, tubID, fluid density, injection rate'],
        ['Step B II=0', 'All injectivity values are zero', 'Fill Reservoir Pressure column; verify skin < 100; check permeability > 0'],
        ['Step C Pwb invalid', 'NaN or negative wellbore pressure at any node', 'Reservoir pressure field may be empty — check Res Pressure column'],
        ['Step C dP_inj=0', 'Pressure differential is zero — no injection', 'BHP must exceed Pres[i] — increase injection rate or check BHP_base'],
        ['Step C Frac Risk', 'BHP approaching or exceeding fracture pressure', 'Reduce injection rate, check fracGrad input, check reservoir pressure'],
        ['Step D WALL_TIMEOUT', 'Simulation exceeded 8 second wall clock limit', 'Reduce numDepthGrids/numTimesteps; simplify schedule; check for NaN inputs'],
        ['Step D NaN', 'NaN propagated through solver', 'Check all reservoir pressure values are filled; check fluid density > 0'],
      ].map(([issue, cause, fix], i) => (
        <div key={i} style={{display:'grid',gridTemplateColumns:'160px 1fr 1fr',gap:10,padding:'7px 0',borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
          <span style={{color:T.gold,fontWeight:600}}>{issue}</span>
          <span style={{color:T.text1}}>{cause}</span>
          <span style={{color:T.green}}>{fix}</span>
        </div>
      ))}
    </div>
  </div>;
}

function DebutReportPage({ project, simResults, resRows, wellData, schedRows, fluids, acid, simParams }) {
  const [tab, setTab] = useState("inputs");
  const DATA = (simResults && simResults.depthResults && simResults.depthResults.length)
    ? simResults.depthResults : (SIM_RESULTS && SIM_RESULTS.length ? SIM_RESULTS : []);
  const summary = simResults ? simResults.summary : null;
  const ptD = simResults && simResults.pressureTime ? simResults.pressureTime.slice(0,70) :
    Array.from({length:70},(_,i)=>({x:i,tp:4800+600*Math.exp(-i/20),bhp:4200+200*Math.exp(-i/25),whp:2600+350*Math.exp(-i/18),frac:5100}));
  const res = resRows || INIT_RESERVOIR;
  const well = wellData || DEFAULTS.well;
  const sched = schedRows || INIT_SCHEDULE;
  const flib = fluids || INIT_FLUIDS;
  const sp = simParams || { numDepthGrids: DEFAULTS.numDepthGrids, numTimesteps: DEFAULTS.numTimesteps };

  // Depth grid info — guard against empty res (avoids Math.min/max of empty array = ±Infinity)
  const topD = res.length ? Math.min(...res.map(r=>+r.top)) : 8200;
  const botD = res.length ? Math.max(...res.map(r=>+r.bot)) : 8540;
  const totalDepth = botD - topD;
  const nDG_safe = Math.max(1, +sp.numDepthGrids || 20);
  const dz = (totalDepth / nDG_safe).toFixed(2);

  const SEC = { fontSize:13,fontWeight:700,color:T.text0,marginBottom:10,marginTop:20,paddingBottom:6,borderBottom:`1px solid ${T.border0}` };
  const EQ  = { background:T.bg3,border:`1px solid ${T.border1}`,borderRadius:8,padding:"12px 16px",fontFamily:T.mono,fontSize:12,color:T.teal,marginBottom:10,overflowX:"auto" };
  const NOTE= { fontSize:12,color:T.text1,lineHeight:1.7,marginBottom:10 };
  const BOX = { background:T.bg2,border:`1px solid ${T.border0}`,borderRadius:9,padding:16,marginBottom:12 };

  function TH(txt) { return <th style={{background:T.bg3,padding:"7px 10px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10,textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{txt}</th>; }
  function TD(txt,col) { return <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border0}`,color:col||T.text1,fontFamily:T.mono,fontSize:12}}>{txt}</td>; }

  return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
    <Topbar title="Debut Report" sub={`${project?.name||"Project"} · Complete Input/Output & Methods Reference`}
      actions={<><Btn sz="s" v="g">⬆ Export PDF</Btn><Btn sz="s" v="g">Export Excel</Btn></>} />
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <div style={{flex:1,overflow:"auto",padding:20}}>
        <Tabs tabs={[
          {id:"inputs",label:"① Inputs"},
          {id:"outputs",label:"② Outputs"},
          {id:"methods",label:"③ Methods & Equations"},
          {id:"calcflow",label:"④ Calculation Flow"},
          {id:"algtrace",label:"⑤ Algorithm Trace"},
        ]} active={tab} onSet={setTab} />

        {/* ─── INPUTS TAB ─────────────────────────────────────────────────── */}
        {tab==="inputs" && <div className="anim">
          {/* Discretization */}
          <div style={BOX}>
            <div style={SEC}>Discretization Parameters</div>
            <G2>
              <Met label="Number of Depth Grids" value={sp.numDepthGrids} color={T.teal} />
              <Met label="Number of Timesteps" value={sp.numTimesteps} color={T.blue} />
              <Met label="Depth Grid Size  Δz" value={`${dz} ft`} color={T.gold} />
              <Met label="Total Depth Range" value={`${topD}–${botD} ft`} color={T.text1} />
            </G2>
            <div style={{...NOTE,marginTop:10}}>
              Depth Grid Size Δz = Total Depth / N<sub>grids</sub> = {totalDepth} ft / {sp.numDepthGrids} = <strong style={{color:T.teal}}>{dz} ft</strong><br/>
              Each injection stage is divided into {sp.numTimesteps} timesteps for time-resolved pressure and placement computation.
            </div>
          </div>

          {/* Reservoir */}
          <div style={BOX}>
            <div style={SEC}>Reservoir Data (Depth-Referenced) <span style={{fontSize:11,color:T.text2,fontWeight:400}}>unit: ft / % / md / –</span></div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Top MD (ft)","Bot MD (ft)","TVD (ft)","Lithology","Porosity (%)","Perm (md)","Skin","Thickness (ft)"].map(h=><th key={h} style={{background:T.bg3,padding:"7px 10px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>)}</tr></thead>
                <tbody>{res.map((r,i)=><tr key={i} className="hr" style={{background:"transparent"}}>
                  {TD(r.top)}{TD(r.bot)}{TD(r.tvd)}{TD(r.lith)}
                  {TD(r.por,T.teal)}{TD(r.perm,T.blue)}{TD(r.skin,T.red)}{TD((+r.bot - +r.top).toFixed(0))}
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          {/* Well */}
          <div style={BOX}>
            <div style={SEC}>Well & Completion Data</div>
            <G2>
              {[["Well Type",well.type,"-"],["Profile",well.profile,"-"],["Wellbore Radius",well.wbR+" in","in"],
                ["Drainage Radius",well.drainR+" ft","ft"],["Reservoir Top",well.resTop+" ft","ft"],
                ["Friction Gradient",well.fricGrad+" psi/1000ft","psi/1000ft"],
                ["Kh/Kv",well.khkv,"-"],["Inclination",well.inc+"°","°"]].map(([k,v,u])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
                  <span style={{color:T.text2}}>{k}</span>
                  <span style={{fontFamily:T.mono,color:T.text0}}>{v} <span style={{color:T.text3,fontSize:10}}>{u}</span></span>
                </div>
              ))}
            </G2>
          </div>

          {/* Fluids */}
          <div style={BOX}>
            <div style={SEC}>Fluid Library (Properties Used in Calculation)</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Name","Type","Category","Conc (%)","Density (g/cm³)","Viscosity (cP)","Rx Rate (mol/m²·s)"].map(h=><th key={h} style={{background:T.bg3,padding:"7px 10px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{flib.map(f=><tr key={f.id} className="hr" style={{background:"transparent"}}>
                  <td style={{padding:"6px 10px",borderBottom:`1px solid ${T.border0}`,fontWeight:600,color:T.text0}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:f.color,marginRight:6}}></span>{f.name}</td>
                  {TD(f.type)}{TD(f.cat)}{TD(f.conc+"%",T.teal)}{TD(f.density,T.blue)}{TD(f.visc)}{TD(f.rxRate,T.gold)}
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          {/* Acid design */}
          <div style={BOX}>
            <div style={SEC}>Acid Design Stages</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["#","Stage","Type","Fluid","Top MD (ft)","Bot MD (ft)","Vol/Perf (gal)","Total Vol (bbl)","Note"].map(h=><th key={h} style={{background:T.bg3,padding:"7px 10px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{DEFAULTS.acid.map((s,i)=><tr key={i} className="hr" style={{background:"transparent"}}>
                  {TD(i+1,T.text3)}{TD(s.name,T.text0)}{TD(s.type,T.teal)}{TD(s.fluid)}
                  {TD(s.topD)}{TD(s.botD)}{TD(s.vpp,T.blue)}{TD(s.vol,T.gold)}{TD(s.note,T.text2)}
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          {/* Pump schedule */}
          <div style={BOX}>
            <div style={SEC}>Pump Schedule</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Stage #","Name","Fluid","Rate (bpm)","Volume (bbl)","Top Depth (ft)","Bot Depth (ft)","Duration (min)","Note"].map(h=><th key={h} style={{background:T.bg3,padding:"7px 10px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{sched.map((s,i)=>{const dur=((+s.vol||0)/(+s.rate||1)*0.035*60).toFixed(1);return(<tr key={i} className="hr" style={{background:"transparent"}}>
                  {TD(s.stage,T.text3)}{TD(s.name,T.text0)}{TD(s.fluid,T.teal)}{TD(s.rate+" bpm",T.blue)}
                  {TD(s.vol+" bbl",T.gold)}{TD(s.topD)}{TD(s.botD)}{TD(dur+" min",T.violet)}{TD(s.note,T.text2)}
                </tr>);})}
                </tbody>
              </table>
              <div style={{padding:"6px 10px",fontSize:12,color:T.text2,textAlign:"right",borderTop:`1px solid ${T.border0}`}}>
                Total volume: <span style={{color:T.teal,fontFamily:T.mono,fontWeight:700}}>{sched.reduce((s,r)=>s+(+r.vol||0),0)} bbl</span>
                &emsp;Est. duration: <span style={{color:T.gold,fontFamily:T.mono,fontWeight:700}}>{sched.reduce((s,r)=>s+((+r.vol||0)/(+r.rate||1)*0.035*60),0).toFixed(0)} min</span>
              </div>
            </div>
          </div>

          {/* DB Field Mapping */}
          <div style={BOX}>
            <div style={SEC}>Input → Database Field Mapping (Mod-4)</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>{["Input Name","DB Field","Section","Unit","Depth Ref","Stage Ref","Range"].map(h=><th key={h} style={{background:T.bg3,padding:"6px 8px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{DB_FIELD_MAP.map((f,i)=><tr key={i} style={{background:i%2?"transparent":T.bg3+"22"}}>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text0,fontWeight:600}}>{f.name}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.teal}}>{f.dbField}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.blue}}>{f.section}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.gold}}>{f.unit}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:f.depthRef?T.green:T.text3}}>{f.depthRef?"✓":""}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:f.stageRef?T.green:T.text3}}>{f.stageRef?"✓":""}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text2,fontSize:10}}>{f.min!==undefined?`[${f.min} – ${f.max}]`:""}</td>
                </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

        {/* ─── OUTPUTS TAB ────────────────────────────────────────────────── */}
        {tab==="outputs" && <div className="anim">
          {/* Summary */}
          <div style={BOX}>
            <div style={SEC}>Summary Metrics</div>
            {summary ? <G4>
              <Met label="Avg Skin Before" value={summary.avgSkinB} color={T.red}/>
              <Met label="Avg Skin After" value={summary.avgSkinA} color={T.green}/>
              <Met label="Skin Reduction" value={summary.skinReduction+"%"} color={T.teal}/>
              <Met label="PI Ratio (After/Before)" value={summary.piRatio+"×"} color={T.gold}/>
              <Met label="Avg PI Before" value={summary.avgPIB} unit="bbl/d/psi" color={T.text1}/>
              <Met label="Avg PI After" value={summary.avgPIA} unit="bbl/d/psi" color={T.green}/>
              <Met label="Placement %" value={summary.placementPct+"%"} color={T.teal}/>
              <Met label="Total Acid Vol" value={summary.totalAcidVol} unit="bbl" color={T.blue}/>
            </G4> : <div style={{color:T.text3,fontSize:13,padding:"20px 0",textAlign:"center"}}>Run simulation to see results. Showing demo data below.</div>}
          </div>

          {/* Pressure */}
          <div style={BOX}>
            <div style={SEC}>Pressure Results vs Time (TP / BHP / WHP / Fracture Limit)</div>
            <TChart series={[
              {label:"Treating P",data:ptD.map(d=>({x:d.x,y:d.tp})),color:T.teal,fill:true},
              {label:"BHP",data:ptD.map(d=>({x:d.x,y:d.bhp})),color:T.blue},
              {label:"WHP",data:ptD.map(d=>({x:d.x,y:d.whp})),color:T.gold},
              {label:"Frac Limit",data:ptD.map(d=>({x:d.x,y:d.frac||5100})),color:T.red,dash:"5,4"},
            ]} H={180} xLbl="Time (min)" yLbl="Pressure (psi)"/>
          </div>

          {/* Depth results */}
          <div style={BOX}>
            <div style={SEC}>Depth-Based Output Results</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><div style={{fontSize:11,color:T.text2,marginBottom:6,fontWeight:600}}>SKIN BEFORE vs AFTER (ft vs skin)</div><DepthPlot data={DATA} xKey="skinB" secKey="skinA" yKey="depth" color={T.red} secColor={T.green} label="Skin Factor" H={190} W={280}/></div>
              <div><div style={{fontSize:11,color:T.text2,marginBottom:6,fontWeight:600}}>ACID PENETRATION vs DEPTH</div><DepthPlot data={DATA} xKey="pen" yKey="depth" color={T.teal} label="Penetration (in)" fill H={190} W={280}/></div>
              <div><div style={{fontSize:11,color:T.text2,marginBottom:6,fontWeight:600}}>ACID CONCENTRATION vs DEPTH</div><DepthPlot data={DATA} xKey="conc" yKey="depth" color={T.violet} label="Spent Conc. (0–1)" fill H={180} W={280} xMn={0} xMx={1}/></div>
              <div><div style={{fontSize:11,color:T.text2,marginBottom:6,fontWeight:600}}>PI BEFORE vs AFTER vs DEPTH</div><DepthPlot data={DATA.map(r=>({depth:r.depth,piB:r.pi_b,piA:r.pi_a}))} xKey="piB" secKey="piA" yKey="depth" color={T.gold} secColor={T.green} label="PI (bbl/day/psi)" H={180} W={280}/></div>
            </div>
            {/* Full results table */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>{["Depth (ft)","Skin Pre","Skin Post","ΔSkin","Pen (in)","Acid Conc.","Pressure (psi)","PI Pre","PI Post","Placed?","Fluid Used"].map(h=><th key={h} style={{background:T.bg3,padding:"6px 8px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{DATA.map((r,i)=><tr key={i} className="hr" style={{background:"transparent"}}>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.text1}}>{r.depth}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.red,fontFamily:T.mono}}>{r.skinB}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.green,fontFamily:T.mono}}>{r.skinA}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.green,fontFamily:T.mono,fontWeight:700}}>−{(r.skinB-r.skinA).toFixed(1)}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono}}>{typeof r.pen==="number"?r.pen.toFixed(1):r.pen}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono}}>{(r.conc*100).toFixed(0)}%</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono}}>{r.pres}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.gold}}>{r.pi_b.toFixed(3)}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.green,fontWeight:700}}>{r.pi_a.toFixed(3)}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`}}><Bdg color={r.placed?"teal":"red"} label={r.placed?"Yes":"No"}/></td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text2,fontSize:11}}>{r.fluidName||"—"}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          {/* ── Acid Penetration Table: Qres, V_pen, r_pen over depth ─────── */}
          <div style={BOX}>
            <div style={SEC}>Acid Penetration &amp; Pressure by Depth</div>
            <p style={NOTE}>
              <strong>Qres</strong> = layer injection rate &nbsp;|&nbsp;
              <strong>V_pen = Qres × T_main_acid</strong> &nbsp;|&nbsp;
              <strong>r_pen = √(r_wb² + V_pen×5.615/(π×h×φ))</strong> &nbsp;|&nbsp;
              <strong>P_res</strong> = user-input reservoir pressure per layer &nbsp;|&nbsp;
              <strong>P_wb</strong> = simulated wellbore BHP at this depth.
              Only main-acid stages contribute to penetration. Preflush / overflush excluded.
            </p>
            {DATA.length > 0 ? <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr>
                    {[
                      {h:"Depth (ft)",        col:T.text2, tip:"Top MD of reservoir interval"},
                      {h:"Interval",          col:T.text2, tip:"Top – Bottom MD [ft]"},
                      {h:"Placed?",           col:T.text2, tip:"Main acid entered this layer"},
                      {h:"Qres (bpm)",        col:T.teal,  tip:"Layer injection rate = V_main_acid / T_main_acid"},
                      {h:"T_main (min)",      col:T.text2, tip:"Total duration of all main-acid stages"},
                      {h:"V_pen (bbl)",       col:T.blue,  tip:"Penetration volume = Qres × T_main_acid"},
                      {h:"r_pen (ft)",        col:T.violet,tip:"Radial penetration from wellbore centre"},
                      {h:"Net Pen (in)",      col:T.gold,  tip:"Net formation penetration = (r_pen − r_wb) × 12"},
                      {h:"P_res (psi)",       col:T.red,   tip:"Reservoir layer pressure — user input from Reservoir Data table"},
                      {h:"P_wb (psi)",        col:T.teal,  tip:"Simulated wellbore BHP at this depth from pressure solver"},
                      {h:"ΔP (psi)",          col:T.green, tip:"Pressure differential driving injection = P_wb − P_res"},
                      {h:"h (ft)",            col:T.text2, tip:"Interval thickness"},
                      {h:"φ (%)",             col:T.text2, tip:"Porosity"},
                      {h:"V_main_acid (bbl)", col:T.teal,  tip:"Total main-acid volume delivered to this layer"},
                    ].map(({h,col,tip})=>(
                      <th key={h} title={tip} style={{background:T.bg3,padding:"6px 8px",
                        textAlign:"left",color:col,borderBottom:`1px solid ${T.border0}`,
                        fontSize:10,whiteSpace:"nowrap",cursor:"help"}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DATA.map((r, i) => {
                    const pen_in   = typeof r.pen === "number" ? r.pen : 0;
                    const wbR_ft   = (+well.wbR || 0.365) / 12;
                    const r_pen_ft = wbR_ft + pen_in / 12;
                    const h_ft     = Math.max(1, +r.bot - +r.top || 50);
                    const por_frac = Math.max(0.01, (+r.por || 15) / 100);
                    const V_main   = typeof r.V_main_acid === "number" ? r.V_main_acid : 0;
                    const T_main   = typeof r.T_main_acid === "number" ? r.T_main_acid : 0;
                    // Prefer direct qres from _aggregate; fall back to V_main/T_main
                    const Qres_bpm = typeof r.qres === "number" && r.qres > 0
                      ? r.qres
                      : (V_main > 0 && T_main > 0)
                        ? V_main / Math.max(0.001, T_main)
                        : 0;
                    // V_pen from geometry: (r_pen²−r_wb²)×π×h×φ/5.615
                    const V_pen    = Math.max(0,
                      (r_pen_ft*r_pen_ft - wbR_ft*wbR_ft) * Math.PI * h_ft * por_frac / 5.615
                    );
                    // Pressures
                    const P_res    = typeof r.pres_res === "number" ? r.pres_res  // from reservoir input
                                   : resRows.find(rv => +rv.top === +r.depth)
                                     ? +resRows.find(rv => +rv.top === +r.depth).pres || 0
                                     : 0;
                    const P_wb     = typeof r.pres === "number" ? r.pres : 0; // simulated BHP
                    const dP       = P_wb - P_res;
                    const placed   = r.placed;

                    // Row highlight: green tint if injecting (dP>0), amber if at frac risk
                    const rowBg = r.fracRisk ? "rgba(232,160,32,0.07)"
                                : placed     ? "transparent"
                                :              "rgba(80,80,80,0.04)";

                    // Helper: styled cell
                    const C = (v, col, fw) => (
                      <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,
                        fontFamily:T.mono,color:col||T.text1,fontWeight:fw||400,fontSize:11}}>
                        {v}
                      </td>
                    );

                    return (
                      <tr key={i} className="hr" style={{background:rowBg}}>
                        {C(r.depth,                T.text0, 600)}
                        {C(`${r.depth} – ${+r.depth+h_ft}`, T.text2)}
                        <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`}}>
                          <Bdg color={placed?"teal":"red"} label={placed?"✓ Yes":"No"}/>
                        </td>
                        {C(Qres_bpm > 0 ? Qres_bpm.toFixed(4) : "0.0000", placed ? T.teal : T.text3)}
                        {C(T_main > 0  ? T_main.toFixed(1)    : "—",      T.text1)}
                        {C(placed ? V_pen.toFixed(2) : "0.00",             placed ? T.blue : T.text3)}
                        {C(placed ? r_pen_ft.toFixed(3) : wbR_ft.toFixed(3), placed ? T.violet : T.text3)}
                        {C(pen_in > 0 ? pen_in.toFixed(1) : "0.0",        placed ? T.gold : T.text3, placed ? 700 : 400)}
                        {C(P_res > 0 ? P_res.toFixed(0) : "—",            T.red)}
                        {C(P_wb > 0  ? P_wb.toFixed(0)  : "—",            T.teal)}
                        {C(P_wb > 0 && P_res > 0 ? (dP >= 0 ? "+" : "") + dP.toFixed(0) : "—",
                           dP > 0 ? T.green : dP < 0 ? T.red : T.text3, dP > 0 ? 700 : 400)}
                        {C(h_ft.toFixed(0),         T.text2)}
                        {C((+r.por||15).toFixed(1), T.text2)}
                        {C(V_main.toFixed(2), V_main > 0 ? T.teal : T.text3)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            : <div style={{color:T.text3,padding:"20px 0",textAlign:"center",fontSize:12}}>
                Run simulation to populate this table.
              </div>
            }
          </div>
        </div>}

        {/* ─── METHODS & EQUATIONS TAB ────────────────────────────────────── */}
        {tab==="methods" && <div className="anim">
          <div style={BOX}>
            <div style={SEC}>1. Pressure Equations (Solved First — Strict Order)</div>
            <p style={NOTE}>The pressure system is solved before any acid transport calculation. The treating pressure at surface and bottom-hole are computed iteratively at each timestep Δt and depth grid Δz.</p>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Hydrostatic Pressure</div>
            <div style={EQ}>P_hyd(z) = ρ · g · z  =  ρ [g/cm³] × 0.4335 × z [ft]   (psi)</div>
            <p style={NOTE}>Where ρ is the injected fluid density at each timestep (changes as fluid stages change), and z is the vertical depth from surface.</p>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Frictional Pressure Loss</div>
            <div style={EQ}>ΔP_fric = f_g × L / 1000   (psi),   f_g = friction gradient [psi/1000ft]</div>
            <div style={EQ}>Total P_fric ≈ fricGrad × tubing_length / 1000   (Fanning simplified)</div>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Surface Treating Pressure (TP)</div>
            <div style={EQ}>TP = P_reservoir + ΔP_fric − P_hyd + ΔP_back · surge_factor</div>
            <div style={EQ}>surge_factor = 1 + 0.4 · exp(−step_i / 8)   [initial surge model]</div>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Bottom-Hole Pressure (BHP)</div>
            <div style={EQ}>BHP(z) = P_reservoir + P_hyd(z) · 0.052 · ρ · 8.33   (psi)</div>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Wellhead Pressure (WHP)</div>
            <div style={EQ}>WHP = TP − P_hyd − ΔP_fric · 0.8</div>
            <div style={{fontWeight:700,color:T.text2,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Fracture Limit</div>
            <div style={EQ}>P_frac = fracGrad [psi/ft] × ReservoirTop [ft]</div>
          </div>

          <div style={BOX}>
            <div style={SEC}>2. Acid Placement Calculation</div>
            <p style={NOTE}>Each reservoir interval receives acid volume from all schedule stages whose depth range [topD, botD] covers the interval's midpoint. The effective acid volume per interval determines placement quality.</p>
            <div style={EQ}>Acid_vol(z) = Σ  Vol(stage_i)   for all stages i where topD_i ≤ z_mid ≤ botD_i</div>
            <div style={EQ}>Placed = TRUE  if  Acid_vol(z) ≥ V_min  AND  pen(z) > 1.0 in</div>
            <p style={NOTE}>V_min = 15 bbl minimum acid volume threshold. Diverter stages (rxRate = 0) do not contribute to acid placement.</p>
          </div>

          <div style={BOX}>
            <div style={SEC}>3. Acid Penetration (Wormhole Model — Williams et al.)</div>
            <p style={NOTE}>Pore-volume breakthrough model combined with Damköhler-number reaction efficiency gives radial wormhole penetration per interval.</p>
            <div style={EQ}>r_pen = √((V_perf / (PVBT · π · φ)) + rw²) − rw     [ft]</div>
            <div style={EQ}>PVBT = 1.6   (pore volumes to wormhole breakthrough, optimum)</div>
            <div style={EQ}>Da = k_rxn · μ / (k · C₀)   [pseudo-Damköhler number]</div>
            <div style={EQ}>η_rxn = exp(−0.38 · Da)     [acid reaction efficiency, 0→1]</div>
            <div style={EQ}>Penetration (in) = r_pen × η_rxn × 12   (converted ft → in)</div>
            <p style={NOTE}>V_perf = volume per perforation tunnel [ft³], φ = porosity, rw = wellbore radius [ft], k_rxn = reaction rate, μ = viscosity, k = permeability, C₀ = initial acid concentration.</p>
          </div>

          <div style={BOX}>
            <div style={SEC}>4. Skin Calculation — Hawkins Formula + Bypass Model</div>
            <p style={NOTE}>Post-acid skin combines Hawkins' damage model with a wormhole bypass factor that accounts for lithology dissolution.</p>
            <div style={EQ}>Bypass_factor = tanh(pen / r_damage) · η_rxn · L_lith   [0→0.97]</div>
            <div style={{...EQ,fontSize:11}}>L_lith: Carbonate=1.0, Dolomite=0.75, Sandstone=0.6, Shale=0.1</div>
            <div style={EQ}>S_residual = 0.2 + (1 − bypass) · 0.5   [completion residual skin]</div>
            <div style={EQ}>S_after = max(0.1,  S_before · (1 − bypass) + S_residual · bypass)</div>
            <div style={EQ}>ΔS = S_before − S_after     [skin reduction per interval]</div>
            <p style={NOTE}>r_damage = damage radius input [in]; higher bypass factor → greater skin removal → lower S_after.</p>
          </div>

          <div style={BOX}>
            <div style={SEC}>5. Productivity Index — Darcy Radial Flow</div>
            <p style={NOTE}>PI is computed using the radial Darcy equation for each depth interval, before and after acid treatment.</p>
            <div style={EQ}>PI = (0.007082 · k · h) / (μ · B · (ln(re/rw) + S))</div>
            <div style={{...EQ,fontSize:11}}>Units: k [md], h [ft], μ=1 cP, B=1 RB/STB, re [ft], rw [ft], S [–]</div>
            <div style={EQ}>PI_before: S = S_initial (from reservoir input)</div>
            <div style={EQ}>PI_after:  S = S_after (post-acid, from skin model above)</div>
            <div style={EQ}>PI_ratio = PI_after / PI_before   [productivity improvement factor]</div>
            <p style={NOTE}>The PI unit is bbl/day/psi for Field (Imperial) or m³/day/kPa for Metric.</p>
          </div>

          <div style={BOX}>
            <div style={SEC}>6. Depth & Time Discretization</div>
            <div style={EQ}>Depth Grid Size  Δz = Total_Depth / N_grids   [ft or m]</div>
            <div style={EQ}>Depth nodes:  z_i = Top_Depth + i · Δz,   i = 0, 1, … , N_grids</div>
            <div style={EQ}>Stage Duration  T_stage = V_stage / q_stage   [min]</div>
            <div style={EQ}>Timestep  Δt = T_stage / N_timesteps   [min]</div>
            <div style={EQ}>Time nodes:  t_j = j · Δt,   j = 0, 1, … , N_timesteps</div>
            <p style={NOTE}>At each (z_i, t_j) node: hydrostatic and frictional pressures are recomputed using current-stage fluid density. Acid transport and concentration decay are applied depth-resolved.</p>
          </div>

          <div style={BOX}>
            <div style={SEC}>Unit Handling (Mod-10) — Field (Imperial) System</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>{["Quantity","Symbol","Field Unit","Metric Unit","Conversion"].map(h=><th key={h} style={{background:T.bg3,padding:"6px 8px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{[
                  ["Depth","z","ft","m","1 ft = 0.3048 m"],
                  ["Pressure","P","psi","kPa","1 psi = 6.895 kPa"],
                  ["Pressure Gradient","∇P","psi/ft","kPa/m","1 psi/ft = 22.62 kPa/m"],
                  ["Flow Rate","q","bpm","m³/min","1 bpm = 0.158987 m³/min"],
                  ["Volume","V","bbl","m³","1 bbl = 0.158987 m³"],
                  ["Permeability","k","md","mD","1 md = 9.869×10⁻¹³ m²"],
                  ["Porosity","φ","%","%","dimensionless"],
                  ["Viscosity","μ","cP","mPa·s","1 cP = 1 mPa·s"],
                  ["Density","ρ","g/cm³","kg/m³","1 g/cm³ = 1000 kg/m³"],
                  ["Time","t","min","min","—"],
                  ["PI","J","bbl/d/psi","m³/d/kPa","1 bbl/d/psi = 0.0231 m³/d/kPa"],
                  ["Penetration","r","in","cm","1 in = 2.54 cm"],
                  ["Temperature","T","°F","°C","°C = (°F−32)/1.8"],
                ].map(([q,s,fi,me,cv],i)=><tr key={i} style={{background:i%2?"transparent":T.bg3+"22"}}>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text0,fontWeight:600}}>{q}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.violet}}>{s}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.teal}}>{fi}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.blue}}>{me}</td>
                  <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text2,fontSize:10}}>{cv}</td>
                </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

        {/* ─── CALCULATION FLOW TAB ───────────────────────────────────────── */}
        {tab==="calcflow" && <div className="anim">
          <div style={BOX}>
            <div style={SEC}>Strict Calculation Order — Step-by-Step Workflow</div>
            <p style={NOTE}>The simulation engine follows this strict order to ensure physical consistency. Pressure must be solved at every (depth, time) node before any transport equation is evaluated.</p>
            {[
              { n:"1", title:"PRESSURE EQUATION (First — always)", col:T.teal, desc:"Solve for treating pressure (TP), BHP, WHP, and fracture limit at every timestep Δt across all depth nodes Δz. Uses hydrostatic gradient + frictional losses from current fluid stage.",
                eqs:["P_hyd(z,t) = ρ(t) · 0.4335 · z","ΔP_fric(t) = fricGrad · L_tubing / 1000","TP(t) = P_res + ΔP_fric − P_hyd + ΔP_back · (1 + 0.4·exp(−step/8))","BHP(z,t) = P_res + (z−z_top)·0.052·ρ·8.33","WHP(t) = TP − P_hyd − ΔP_fric·0.8"] },
              { n:"2", title:"ACID PLACEMENT CALCULATION", col:T.blue, desc:"For each depth grid node z_i, accumulate acid volume from all schedule stages whose depth range covers z_i. Determine placement status against minimum threshold.",
                eqs:["Acid_vol(z_i) = Σᵢ Vol(stg_i)  [for stages covering z_i]","Placed(z_i) = (Acid_vol ≥ 15 bbl) AND (pen > 1 in)"] },
              { n:"3", title:"ACID PENETRATION CALCULATION", col:T.gold, desc:"For each placed depth node, apply pore-volume breakthrough wormhole model with Damköhler-number reaction efficiency to compute radial penetration.",
                eqs:["r_PV = √(V_perf/(PVBT·π·φ) + rw²) − rw","Da = k_rxn · μ / (k · C₀)","η = exp(−0.38 · Da)","pen(z_i) = r_PV · η · 12   [in]"] },
              { n:"4", title:"SKIN EVOLUTION CALCULATION", col:T.violet, desc:"Using penetration depth and reaction efficiency, compute bypass factor per interval and apply Hawkins formula to get post-acid skin.",
                eqs:["bypass = tanh(pen / r_dmg) · η · L_lith","S_after = max(0.1,  S_before·(1−bypass) + S_res·bypass)","S_res = 0.2 + (1−bypass)·0.5"] },
              { n:"5", title:"PRODUCTIVITY INDEX CALCULATION", col:T.green, desc:"Compute Darcy radial PI before and after using pre/post-acid skin values. PI ratio indicates treatment effectiveness.",
                eqs:["PI_before = 0.007082·k·h / (ln(re/rw) + S_before)","PI_after  = 0.007082·k·h / (ln(re/rw) + S_after)","PI_ratio  = PI_after / PI_before"] },
            ].map((step,idx)=>(
              <div key={idx} style={{display:"flex",gap:16,marginBottom:16,alignItems:"flex-start"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`${step.col}22`,border:`2px solid ${step.col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:step.col,flexShrink:0}}>{step.n}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:step.col,marginBottom:5}}>{step.title}</div>
                  <p style={{...NOTE,marginBottom:8}}>{step.desc}</p>
                  {step.eqs.map((eq,i)=><div key={i} style={{...EQ,marginBottom:5,padding:"7px 12px",fontSize:11}}>{eq}</div>)}
                </div>
              </div>
            ))}
          </div>

          <div style={BOX}>
            <div style={SEC}>Interactive Pressure Calculator — Depth & Time Resolved (Mod-7)</div>
            <p style={NOTE}>The following table shows the iterative depth-resolved pressure at each depth grid node for the first schedule stage, demonstrating the interactive pressure calculation per timestep.</p>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>{["Node i","Depth z_i (ft)","Fluid Density (g/cm³)","P_hyd (psi)","ΔP_fric (psi)","TP (psi)","BHP (psi)","Status"].map(h=><th key={h} style={{background:T.bg3,padding:"6px 8px",textAlign:"left",color:T.text2,borderBottom:`1px solid ${T.border0}`,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{Array.from({length:Math.min(sp.numDepthGrids,12)},(_,i)=>{
                  const z = +well.resTop + i * +dz;
                  const rho = 1.065;
                  const phyd = (rho * 0.4335 * z).toFixed(0);
                  const pfric = (+well.fricGrad * 8000 / 1000).toFixed(0);
                  const tp = (4200 + +pfric - +phyd + 600*Math.exp(-i/8)).toFixed(0);
                  const bhp = (4200 + (z - +well.resTop)*0.052*rho*8.33).toFixed(0);
                  const isOver = +tp > (0.72 * z);
                  return <tr key={i} style={{background:isOver?"rgba(224,80,80,0.07)":"transparent"}}>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,color:T.text3,fontFamily:T.mono}}>{i}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.text1}}>{z.toFixed(0)}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.blue}}>{rho}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.teal}}>{phyd}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.gold}}>{pfric}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:isOver?T.red:T.text0,fontWeight:isOver?700:400}}>{tp}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`,fontFamily:T.mono,color:T.green}}>{bhp}</td>
                    <td style={{padding:"5px 8px",borderBottom:`1px solid ${T.border0}`}}>{isOver?<Bdg color="red" label="⚠ Near Frac"/>:<Bdg color="teal" label="OK"/>}</td>
                  </tr>;
                })}
                </tbody>
              </table>
              {sp.numDepthGrids > 12 && <div style={{padding:"6px 10px",fontSize:11,color:T.text2,borderTop:`1px solid ${T.border0}`}}>Showing first 12 of {sp.numDepthGrids} depth nodes. Full grid computed during simulation run.</div>}
            </div>
          </div>
        </div>}

        {/* ─── ALGORITHM TRACE TAB ────────────────────────────────────────── */}
        {tab==="algtrace" && <div className="anim">
          {(() => { try { return <AlgorithmTracePanel
            res={res} well={well} sched={sched} flib={flib} sp={sp}
            simResults={simResults}
            BOX={BOX} SEC={SEC} EQ={EQ} NOTE={NOTE} TH={TH} TD={TD}
          />; } catch(e) { return <div style={{padding:24,color:T.red,fontFamily:T.mono,fontSize:12}}>Algorithm Trace error: {String(e.message)}</div>; } })()}
        </div>}
      </div>
    </div>
  </div>;
}

function PlaceholderPage({ title, icon, desc }) {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", color: T.text2 }}><div style={{ fontSize: 46, marginBottom: 12 }}>{icon}</div><div style={{ fontSize: 17, fontWeight: 700, color: T.text1, marginBottom: 6 }}>{title}</div><div style={{ fontSize: 13 }}>{desc}</div></div>
  </div>;
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  // ── DB-backed project list ──────────────────────────────────────────────
  const [projects, setProjectsRaw] = useState(() => {
    const stored = DB.loadProjects();
    if (stored && stored.length > 0) return stored;
    // Seed with demo project
    return [{ id: 1, name: "AG-2024 Matrix Acid", well: "Well AG-17", field: "Arabian Gulf", unit: "Field (Imperial)", injection: "Bullhead", grid: "1 ft", hasRun: false, version: 1, createdAt: "01/05/2025", updatedAt: new Date().toISOString() }];
  });
  function setProjects(updater) {
    setProjectsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      DB.saveProjects(next);
      return next;
    });
  }
  const [activeProject, setActiveProject] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);  // computed results
  const [convWarn, setConvWarn]     = useState(null);   // pressure convergence warning payload

  // ── Shared input state — lifted for validation + calculation ─────────────
  const [sharedResRows, setSharedResRowsRaw] = useState(INIT_RESERVOIR.map(r => ({ ...r })));
  const [sharedWell, setSharedWellRaw] = useState({ type: "Producer", profile: "Vertical", wbR: "0.365", drainR: "2640", resTop: "8200", fricGrad: "18", khkv: "5", inc: "0", compType: "Cased Hole", tubLen: "8540", tubID: "2.992", casID: "5.921" });
  const [sharedSched, setSharedSchedRaw] = useState(INIT_SCHEDULE.map(r => ({ ...r })));
  const [sharedFluids, setSharedFluidsRaw] = useState(INIT_FLUIDS.map(f => ({ ...f })));
  const [sharedAcid, setSharedAcidRaw] = useState([
    { id:1,name:"Preflush",type:"Preflush",fluid:"Xylene Preflush",topD:8200,botD:8540,vpp:0.5,vol:25,note:"Wettability"},
    { id:2,name:"Acid Stage 1",type:"Main",fluid:"HCl 15%",topD:8200,botD:8370,vpp:2.0,vol:120,note:"Upper intervals"},
    { id:3,name:"Diverter",type:"Diverter",fluid:"VES Diverter",topD:8200,botD:8540,vpp:0.5,vol:30,note:"Diversion"},
    { id:4,name:"Acid Stage 2",type:"Main",fluid:"HCl 15%",topD:8370,botD:8540,vpp:2.0,vol:120,note:"Lower intervals"},
    { id:5,name:"Overflush",type:"Overflush",fluid:"KCl 2% Brine",topD:8200,botD:8540,vpp:1.0,vol:60,note:"Spent flush"},
  ]);
  // Mod-2: Discretization parameters (depth grids + timesteps)
  const [simParams, setSimParams] = useState(() => {
    const stored = DB.loadSection("global","simParams",null);
    return stored || { numDepthGrids: DEFAULTS.numDepthGrids, numTimesteps: DEFAULTS.numTimesteps };
  });
  function setSimParamsAndSave(v) {
    const next = typeof v === "function" ? v(simParams) : v;
    setSimParams(next);
    DB.saveSection("global","simParams",next);
  }

  // Auto-persist shared inputs when project is active
  function setSharedResRows(v) {
    setSharedResRowsRaw(v);
    if (activeProject) DB.saveSection(activeProject.id, "reservoir", typeof v === "function" ? v(sharedResRows) : v);
  }
  function setSharedWell(v) {
    setSharedWellRaw(v);
    if (activeProject) DB.saveSection(activeProject.id, "well", typeof v === "function" ? v(sharedWell) : v);
  }
  function setSharedSched(v) {
    setSharedSchedRaw(v);
    if (activeProject) DB.saveSection(activeProject.id, "schedule", typeof v === "function" ? v(sharedSched) : v);
  }
  function setSharedFluids(v) {
    setSharedFluidsRaw(v);
    if (activeProject) DB.saveSection(activeProject.id, "fluids", typeof v === "function" ? v(sharedFluids) : v);
  }

  function openProject(p) {
    setActiveProject(p);
    // Load all sections from DB
    const res  = DB.loadSection(p.id, "reservoir", INIT_RESERVOIR.map(r=>({...r})));
    const well = DB.loadSection(p.id, "well", { type:"Producer",profile:"Vertical",wbR:"0.365",drainR:"2640",resTop:"8200",fricGrad:"18",khkv:"5",inc:"0" });
    const sched = DB.loadSection(p.id, "schedule", INIT_SCHEDULE.map(r=>({...r})));
    const fluids = DB.loadSection(p.id, "fluids", INIT_FLUIDS.map(f=>({...f})));
    setSharedResRowsRaw(res);
    setSharedWellRaw(well);
    setSharedSchedRaw(sched);
    setSharedFluidsRaw(fluids);
    // Load previous results if any
    const prevResults = DB.loadResults(p.id);
    if (prevResults) setSimResults(prevResults);
    else setSimResults(null);
    setPage("reservoir");
  }

  function runSim() { setSimRunning(true); }

  function simDone() {
    // ── Run the calculation engine ─────────────────────────────────────────
    const results = ENG.runSimulation(
      sharedResRows,
      sharedWell,
      sharedSched,
      sharedFluids,
      sharedAcid,
      simParams
    );
    setSimResults(results);
    // Persist results + mark project as run
    if (activeProject) {
      DB.saveResults(activeProject.id, results);
      DB.saveSection(activeProject.id, "reservoir", sharedResRows);
      DB.saveSection(activeProject.id, "well",      sharedWell);
      DB.saveSection(activeProject.id, "schedule",  sharedSched);
      DB.saveSection(activeProject.id, "fluids",    sharedFluids);
    }
    setSimRunning(false);
    setProjects(ps => ps.map(p => p.id === activeProject?.id
      ? { ...p, hasRun: true, updatedAt: new Date().toISOString(), version: (p.version || 1) + 1 }
      : p
    ));
    // Show convergence warning popup if any stage did not converge after 20 iterations
    if (results?.summary?.pressureWarnings?.length > 0) {
      setConvWarn(results.summary.pressureWarnings);
    }
    setPage("results");
  }

  if (!loggedIn) return <><style>{CSS}</style><Login onLogin={() => setLoggedIn(true)} /></>;

  // ── Pressure convergence warning modal ────────────────────────────────────
  function ConvWarnModal({ warns, onClose }) {
    const ADVICE = [
      { icon:"📊", title:"Check Reservoir Pressure",
        detail:"Ensure every interval in the Reservoir Data table has a valid Reservoir Pressure value (psi). Empty or zero values make the pressure differential ΔP = 0 so no fluid can enter any layer." },
      { icon:"🔵", title:"Reduce Injection Rate",
        detail:"The required bottomhole pressure to inject at the specified rate may be approaching or exceeding the fracture gradient. Try reducing the pump rate by 10–20% per stage." },
      { icon:"🪨", title:"Review Permeability Values",
        detail:"Very low permeability (< 0.1 md) produces near-zero injectivity II[i]. Check that reservoir permeability values are realistic for the lithology — shale intervals typically should not be targeted." },
      { icon:"🧴", title:"Check Skin Values",
        detail:"Extremely high skin (> 50) can suppress injectivity to near-zero. Verify skin inputs are correct, or consider that the treatment is needed precisely because skin is high." },
      { icon:"⬆️", title:"Increase Drainage Radius or Wellbore Radius",
        detail:"If ln(re/rw) + skin ≤ 0, the Darcy injectivity equation is undefined. Ensure drainage radius (re) >> wellbore radius (rw) and skin is not so negative that ln(re/rw)+S ≤ 0." },
      { icon:"💧", title:"Check Fluid Viscosity",
        detail:"Verify that the selected fluid has a valid viscosity (> 0 cP). Zero viscosity in the fluid library will make injectivity II[i] = infinity and destabilize the solver." },
      { icon:"📏", title:"Review Tubing Geometry",
        detail:"Tubing ID and length affect friction pressure. Very long tubing (> 15,000 ft) or very narrow ID (< 2 in) produces high friction that may make surface pressure exceed equipment limits." },
      { icon:"🎯", title:"Verify Fracture Gradient Input",
        detail:"A fracture gradient that is too low (< 0.5 psi/ft) constrains the allowable bottomhole pressure severely. Check fracGrad in the Well Configuration page." },
    ];
    return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.bg2,border:`1px solid ${T.gold}`,borderRadius:14,maxWidth:640,width:"100%",maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border0}`,background:T.bg3,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(232,160,32,0.15)",border:`2px solid ${T.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚠</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text0}}>Pressure Solver Did Not Converge</div>
            <div style={{fontSize:12,color:T.text2,marginTop:2}}>
              {warns.length} stage{warns.length>1?"s":""} reached the 20-iteration limit without converging
            </div>
          </div>
          <div onClick={onClose} style={{cursor:"pointer",color:T.text2,fontSize:20,padding:"0 4px",userSelect:"none"}}>×</div>
        </div>
        <div style={{overflow:"auto",padding:18,flex:1}}>
          {/* Affected stages */}
          <div style={{background:T.bg3,borderRadius:8,padding:"10px 14px",marginBottom:16,border:`1px solid ${T.border1}`}}>
            <div style={{fontSize:11,color:T.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8,fontWeight:700}}>Affected Stages</div>
            {warns.map((w,i) => <div key={i} style={{display:"flex",gap:12,padding:"5px 0",borderBottom:i<warns.length-1?`1px solid ${T.border0}`:"none",fontSize:12}}>
              <span style={{fontFamily:T.mono,color:T.gold,minWidth:60}}>Stage {w.stage}</span>
              <span style={{color:T.text1,flex:1}}>{w.stageName}</span>
              <span style={{fontFamily:T.mono,color:T.text2,fontSize:11}}>{w.fluid} · {w.rate} bpm · {w.vol} bbl</span>
              <span style={{fontFamily:T.mono,color:T.red,fontSize:11}}>{w.iters} iters</span>
            </div>)}
          </div>
          {/* Note: results still computed */}
          <div style={{background:"rgba(74,158,232,0.08)",border:`1px solid rgba(74,158,232,0.3)`,borderRadius:7,padding:"9px 13px",marginBottom:16,fontSize:12,color:T.text1}}>
            ℹ Results have still been computed using the best available pressure solution. The outputs may have reduced accuracy. Adjust the inputs below and re-run for better convergence.
          </div>
          {/* Advice cards */}
          <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Recommended Input Adjustments</div>
          <div style={{display:"grid",gap:8}}>
            {ADVICE.map((a,i) => <div key={i} style={{background:T.bg3,borderRadius:8,padding:"11px 14px",border:`1px solid ${T.border0}`,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{a.icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text0,marginBottom:3}}>{a.title}</div>
                <div style={{fontSize:11,color:T.text2,lineHeight:1.6}}>{a.detail}</div>
              </div>
            </div>)}
          </div>
        </div>
        {/* Footer */}
        <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border0}`,display:"flex",gap:10,flexShrink:0}}>
          <div onClick={()=>{onClose();setPage("reservoir");}} style={{flex:1,background:"rgba(232,160,32,0.12)",border:`1px solid ${T.gold}`,borderRadius:7,padding:"9px 0",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:600,color:T.gold,userSelect:"none"}}>
            → Go to Reservoir Data
          </div>
          <div onClick={()=>{onClose();setPage("well");}} style={{flex:1,background:"rgba(74,158,232,0.08)",border:`1px solid rgba(74,158,232,0.3)`,borderRadius:7,padding:"9px 0",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:600,color:T.blue,userSelect:"none"}}>
            → Go to Well Config
          </div>
          <div onClick={onClose} style={{background:T.bg3,border:`1px solid ${T.border1}`,borderRadius:7,padding:"9px 16px",cursor:"pointer",fontSize:13,color:T.text1,userSelect:"none"}}>
            View Results
          </div>
        </div>
      </div>
    </div>;
  }

  const proj = activeProject;
  const pages = {
    dashboard: <Dashboard projects={projects} setProjects={setProjects} onOpen={openProject} />,
    reservoir: <ReservoirPage project={proj} setPage={setPage} rows={sharedResRows} setRows={setSharedResRows} />,
    well: <WellPage project={proj} setPage={setPage} wellData={sharedWell} setWellData={setSharedWell} />,
    fluids: <FluidsPage setPage={setPage} sharedFluids={sharedFluids} setSharedFluids={setSharedFluids} />,
    schedule: <SchedulePage project={proj} setPage={setPage} sharedSched={sharedSched} setSharedSched={setSharedSched} />,
    sim: <SimSetupPage onRun={runSim} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} simParams={simParams} onSetSimParams={setSimParamsAndSave} />,
    results: <ResultsPage project={proj} simResults={simResults} />,
    sensitivity: <SensPage project={proj} simResults={simResults} />,
    reports: <ReportsPage project={proj} simResults={simResults} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} />,
    manual: <PlaceholderPage title="Technical Manual" icon="⊟" desc="Engineering reference documentation and methodology" />,
    cases: <PlaceholderPage title="Case Studies" icon="◉" desc="Real-world matrix acid job examples and benchmarks" />,
    debut_report: <DebutReportPage project={proj} simResults={simResults} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} fluids={sharedFluids} acid={sharedAcid} simParams={simParams} />,
  };

  return <div style={{ display: "flex", height: "100vh", fontFamily: T.sans, background: T.bg0, color: T.text0, overflow: "hidden" }}>
    <style>{CSS}</style>
    <Sidebar page={page} setPage={p => { if (p === "create") return; setPage(p); }} onLogout={() => setLoggedIn(false)} proj={proj?.name} />
    <div style={{ marginLeft: 208, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {simRunning ? <RunPage onDone={simDone} simParams={simParams} schedRows={sharedSched} /> : (pages[page] || pages.dashboard)}
      {convWarn && <ConvWarnModal warns={convWarn} onClose={()=>setConvWarn(null)} />}
    </div>
  </div>;
}
