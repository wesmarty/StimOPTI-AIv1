import { useState, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  // StimPRO-style engineering platform palette
  // Light gray application chrome, dark navy sidebar, dense data panels
  bg0:     "#D0D8E0",   // app chrome / outer background
  bg1:     "#1A2332",   // sidebar (dark navy)
  bg2:     "#E8EDF2",   // panel / card background
  bg3:     "#C8D4DC",   // panel header / section divider
  bg4:     "#F0F4F7",   // input field background
  bgHov:   "#DDE5EC",   // row hover

  // Engineering accent colors — purposeful, never decorative
  teal:    "#0078A8",   // primary action / highlight (petroleum blue)
  tealDim: "#005A80",   // dimmed petroleum blue
  tealGlow:"rgba(0,120,168,0.10)",
  gold:    "#C87000",   // warning / diverter / advisory
  goldDim: "#9A5600",
  red:     "#B82020",   // alarm / high skin / failure
  redDim:  "#8A1818",
  green:   "#1A7A40",   // success / acid placed / PI gain
  greenDim:"#145E30",
  blue:    "#1E4E8C",   // secondary data (pressure)
  blueDim: "#163A6A",
  violet:  "#5B3A9A",   // penetration / tertiary

  // Text hierarchy — high contrast for data-dense UI
  text0:   "#0A0E14",   // primary labels, values
  text1:   "#2A3848",   // secondary labels
  text2:   "#506070",   // metadata, units
  text3:   "#8098A8",   // disabled, placeholders

  // Borders — subtle gray system
  border0: "#B0BEC8",   // default border
  border1: "#94A8B8",   // medium border
  border2: "#6A8298",   // strong border / active

  mono: "'Courier New','Consolas',monospace",
  sans: "'Segoe UI','Arial',sans-serif",
};

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const INIT_RESERVOIR = [
  { id:1,top:8200,bot:8255,tvd:8200,lith:"Carbonate",por:18.5,perm:85, skin:12.4,pres:3690,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1.0 },
  { id:2,top:8255,bot:8315,tvd:8255,lith:"Carbonate",por:22.1,perm:142,skin:8.7, pres:3715,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1.0 },
  { id:3,top:8315,bot:8370,tvd:8315,lith:"Dolomite", por:14.8,perm:38, skin:18.2,pres:3742,khkv:1,calcite:60, dolomite:40,shale:0,dmgR:1.0 },
  { id:4,top:8370,bot:8425,tvd:8370,lith:"Carbonate",por:25.3,perm:210,skin:6.1, pres:3767,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1.0 },
  { id:5,top:8425,bot:8480,tvd:8425,lith:"Shale",    por:8.2, perm:0.8,skin:24.5,pres:3791,khkv:1,calcite:0,  dolomite:0, shale:100,dmgR:1.0},
  { id:6,top:8480,bot:8540,tvd:8480,lith:"Carbonate",por:20.7,perm:165,skin:9.3, pres:3816,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1.0 },
];

const INIT_FLUIDS = [
  { id: 1, name: "HCl 15%",        type: "HCl",      conc: 15, density: 1.065, visc: 1.2,  rxRate: 2.8, rxCalcite: 2.8, rxDolomite: 1.4, rxShale: 0.3,  color: T.teal,    cat: "Main Acid Fluids" },
  { id: 2, name: "HCl 28%",        type: "HCl",      conc: 28, density: 1.14,  visc: 1.8,  rxRate: 4.2, rxCalcite: 4.2, rxDolomite: 2.1, rxShale: 0.5,  color: T.blue,    cat: "Main Acid Fluids" },
  { id: 3, name: "HCl 5%",         type: "HCl",      conc: 5,  density: 1.02,  visc: 0.9,  rxRate: 1.1, rxCalcite: 1.1, rxDolomite: 0.6, rxShale: 0.1,  color: T.violet,  cat: "Main Acid Fluids" },
  { id: 4, name: "HF/HCl Mud Acid",type: "HF/HCl",   conc: 15, density: 1.06,  visc: 1.1,  rxRate: 5.5, rxCalcite: 5.5, rxDolomite: 2.8, rxShale: 0.0,  color: T.gold,    cat: "HF Acid Fluids" },
  { id: 5, name: "Xylene Preflush",type: "Solvent",   conc: 0,  density: 0.864, visc: 0.6,  rxRate: 0,   rxCalcite: 0,   rxDolomite: 0,   rxShale: 0,    color: T.green,   cat: "Solvents" },
  { id: 6, name: "KCl 2% Brine",   type: "Brine",    conc: 0,  density: 1.012, visc: 1.0,  rxRate: 0,   rxCalcite: 0,   rxDolomite: 0,   rxShale: 0,    color: "#78A8C8", cat: "Brines" },
  { id: 7, name: "VES Diverter",   type: "Diverter", conc: 0,  density: 1.02,  visc: 45,   rxRate: 0,   rxCalcite: 0,   rxDolomite: 0,   rxShale: 0,    color: "#FF7B54", cat: "Diverter Fluids" },
  { id: 8, name: "Acetic Acid 10%",type: "Organic",  conc: 10, density: 1.02,  visc: 1.1,  rxRate: 0.8, rxCalcite: 0.8, rxDolomite: 0.4, rxShale: 0.0,  color: "#C8F042", cat: "Organic Acid Fluids" },
];

// ══════════════════════════════════════════════════════════════════════════════
// MASTER FLUID DATABASE — single source of truth for all stimulation fluids
// ══════════════════════════════════════════════════════════════════════════════
const FLUID_CATEGORIES = [
  // ── Acid Systems ────────────────────────────────────────────────────────
  "Main Acid Fluids","Organic Acid Fluids","HF Acid Fluids","Retarded Acids",
  // ── Aqueous / Carrier Fluids ─────────────────────────────────────────────
  "Brines","Spacer Fluids","Well Control Fluids",
  // ── Diversion ────────────────────────────────────────────────────────────
  "Diverter Fluids","Fluid Loss Control",
  // ── Gas / Foam Systems ───────────────────────────────────────────────────
  "Nitrogen","Foam Additives",
  // ── Surface-Active / Wetting ─────────────────────────────────────────────
  "Surfactants","Solvents",
  // ── Polymer / Viscosifier ────────────────────────────────────────────────
  "Gelling Agents",
  // ── Protection Chemicals ─────────────────────────────────────────────────
  "Clay Stabilizers","Corrosion Inhibitors","Iron Control",
  // ── Scale / Asphaltene / Flow Assurance ──────────────────────────────────
  "Chelating Agents","Flow Assurance Chemicals",
  // ── Cleanup ──────────────────────────────────────────────────────────────
  "Cleanup Chemicals",
  // ── General Additives / Specialty ────────────────────────────────────────
  "Specialty Fluids","Additives",
];
const CAT_TO_STAGE = {
  "Main Acid Fluids":"Main Acid","Organic Acid Fluids":"Main Acid",
  "HF Acid Fluids":"Main Acid","Retarded Acids":"Main Acid",
  "Brines":"Overflush","Spacer Fluids":"Displacement",
  "Well Control Fluids":"Displacement",
  "Diverter Fluids":"Diverter","Fluid Loss Control":"Diverter",
  "Nitrogen":"Additive","Foam Additives":"Additive",
  "Surfactants":"Preflush","Solvents":"Preflush",
  "Gelling Agents":"Main Acid",
  "Clay Stabilizers":"Overflush","Corrosion Inhibitors":"Additive",
  "Iron Control":"Additive","Chelating Agents":"Main Acid",
  "Flow Assurance Chemicals":"Additive",
  "Cleanup Chemicals":"Overflush",
  "Specialty Fluids":"Additive","Additives":"Additive",
};
const CAT_PROPS = {
  "Main Acid Fluids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.065"},{key:"visc",label:"Viscosity (cP)",dflt:"1.2"},
    {key:"conc",label:"Concentration (%)",dflt:"15"},{key:"rxCalcite",label:"Calcite Rxn Rate (mol/m²·s)",dflt:"2.8"},
    {key:"rxDolomite",label:"Dolomite Rxn Rate (mol/m²·s)",dflt:"1.4"},{key:"rxShale",label:"Shale Rxn Rate (mol/m²·s)",dflt:"0.3"},
    {key:"actEnergy",label:"Activation Energy (kJ/mol)",dflt:"62.7"},{key:"retardFactor",label:"Retardation Factor",dflt:"1.0"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"350"},{key:"corrSeverity",label:"Corrosion Severity (1-5)",dflt:"3"},
  ],
  "Organic Acid Fluids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.02"},{key:"visc",label:"Viscosity (cP)",dflt:"1.1"},
    {key:"conc",label:"Concentration (%)",dflt:"10"},{key:"rxCalcite",label:"Calcite Rxn Rate (mol/m²·s)",dflt:"0.8"},
    {key:"rxDolomite",label:"Dolomite Rxn Rate (mol/m²·s)",dflt:"0.5"},{key:"actEnergy",label:"Activation Energy (kJ/mol)",dflt:"55"},
    {key:"retardFactor",label:"Retardation Factor",dflt:"1.5"},{key:"maxTemp",label:"Max Temperature (°F)",dflt:"300"},
    {key:"corrSeverity",label:"Corrosion Severity (1-5)",dflt:"1"},
  ],
  "HF Acid Fluids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.06"},{key:"visc",label:"Viscosity (cP)",dflt:"1.1"},
    {key:"hfConc",label:"HF Concentration (%)",dflt:"1.5"},{key:"hclConc",label:"HCl Concentration (%)",dflt:"7.5"},
    {key:"rxCalcite",label:"Calcite Rxn Rate (mol/m²·s)",dflt:"5.5"},{key:"rxSandstone",label:"Sandstone Rxn Rate (mol/m²·s)",dflt:"8.0"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"200"},{key:"corrSeverity",label:"Corrosion Severity (1-5)",dflt:"5"},
  ],
  "Retarded Acids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.07"},{key:"visc",label:"Viscosity (cP)",dflt:"5.0"},
    {key:"conc",label:"Concentration (%)",dflt:"15"},{key:"rxCalcite",label:"Calcite Rxn Rate (mol/m²·s)",dflt:"0.9"},
    {key:"retardFactor",label:"Retardation Factor",dflt:"3.0"},{key:"maxTemp",label:"Max Temperature (°F)",dflt:"500"},
    {key:"corrSeverity",label:"Corrosion Severity (1-5)",dflt:"2"},
  ],
  "Brines":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.01"},{key:"visc",label:"Viscosity (cP)",dflt:"1.0"},
    {key:"saltConc",label:"Salt Concentration (%)",dflt:"2"},{key:"clayFactor",label:"Clay Stabilization Factor",dflt:"0.8"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"400"},
  ],
  "Diverter Fluids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.02"},{key:"visc",label:"Viscosity (cP)",dflt:"45"},
    {key:"tempStability",label:"Temp Stability (°F)",dflt:"250"},{key:"degradTime",label:"Degradation Time (hr)",dflt:"24"},
    {key:"divEff",label:"Diversion Efficiency (0-1)",dflt:"0.8"},
  ],
  "Solvents":[
    {key:"density",label:"Density (g/cm³)",dflt:"0.86"},{key:"visc",label:"Viscosity (cP)",dflt:"0.6"},
    {key:"cleanupEff",label:"Cleanup Efficiency (0-1)",dflt:"0.9"},{key:"compatibility",label:"Compatibility Notes",dflt:"Hydrocarbon compatible"},
  ],
  "Surfactants":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.02"},{key:"visc",label:"Viscosity (cP)",dflt:"1.1"},
    {key:"conc",label:"Concentration (%)",dflt:"0.5"},{key:"cleanupEff",label:"Cleanup Efficiency (0-1)",dflt:"0.85"},
    {key:"compatibility",label:"Compatibility Notes",dflt:"Check with crude oil"},
  ],
  "Clay Stabilizers":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.01"},{key:"visc",label:"Viscosity (cP)",dflt:"1.0"},
    {key:"conc",label:"Concentration (%)",dflt:"1.0"},{key:"clayFactor",label:"Clay Stabilization Factor",dflt:"0.95"},
  ],
  "Corrosion Inhibitors":[
    {key:"density",label:"Density (g/cm³)",dflt:"0.95"},{key:"conc",label:"Concentration (%)",dflt:"0.2"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"300"},{key:"corrSeverity",label:"Protection Level (1-5)",dflt:"5"},
  ],
  "Chelating Agents":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.05"},{key:"visc",label:"Viscosity (cP)",dflt:"1.2"},
    {key:"conc",label:"Concentration (%)",dflt:"5"},{key:"rxCalcite",label:"Calcite Rxn Rate (mol/m²·s)",dflt:"0.5"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"300"},
  ],
  "Iron Control":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.02"},{key:"conc",label:"Concentration (%)",dflt:"1.0"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"250"},
  ],
  "Nitrogen":[
    {key:"gasDensity",label:"Gas Density (lb/ft³)",dflt:"0.073"},{key:"compressibility",label:"Compressibility (1/psi)",dflt:"0.00045"},
    {key:"foamQuality",label:"Foam Quality (%)",dflt:"70"},{key:"gasFraction",label:"Gas Fraction (vol%)",dflt:"70"},
  ],
  "Gelling Agents":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.01"},{key:"visc",label:"Viscosity (cP)",dflt:"50"},
    {key:"conc",label:"Concentration (lb/Mgal)",dflt:"40"},{key:"retardFactor",label:"Retardation Factor",dflt:"2.5"},
    {key:"maxTemp",label:"Max Temperature (°F)",dflt:"300"},
  ],
  "Specialty Fluids":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.05"},{key:"visc",label:"Viscosity (cP)",dflt:"1.2"},
    {key:"cleanupEff",label:"Cleanup Efficiency (0-1)",dflt:"0.8"},{key:"compatibility",label:"Compatibility Notes",dflt:""},
  ],
  "Additives":[
    {key:"density",label:"Density (g/cm³)",dflt:"1.0"},{key:"conc",label:"Concentration (%)",dflt:"1.0"},
    {key:"compatibility",label:"Compatibility Notes",dflt:""},
  ],
  // ── NEW CATEGORIES ────────────────────────────────────────────────────────
  "Foam Additives":[
    {key:"density",     label:"Density (g/cm³)",           dflt:"1.00"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"1.5"},
    {key:"conc",        label:"Concentration (gal/Mgal)",   dflt:"5"},
    {key:"foamQuality", label:"Foam Quality (%)",           dflt:"70"},
    {key:"foamStability",label:"Foam Half-Life (min)",      dflt:"30"},
    {key:"maxTemp",     label:"Max Temperature (°F)",       dflt:"300"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:""},
  ],
  "Well Control Fluids":[
    {key:"density",     label:"Density (g/cm³)",            dflt:"1.25"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"1.2"},
    {key:"fluidWeight", label:"Fluid Weight (ppg)",         dflt:"10.4"},
    {key:"maxTemp",     label:"Max Temperature (°F)",       dflt:"400"},
    {key:"pH",          label:"pH",                         dflt:"7"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:""},
  ],
  "Spacer Fluids":[
    {key:"density",     label:"Density (g/cm³)",            dflt:"1.01"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"1.0"},
    {key:"saltConc",    label:"Salt Concentration (%)",     dflt:"0"},
    {key:"pH",          label:"pH",                         dflt:"7"},
    {key:"volume",      label:"Typical Volume (bbl)",       dflt:"20"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:"Separates acid from base fluid"},
  ],
  "Fluid Loss Control":[
    {key:"density",     label:"Density (g/cm³)",            dflt:"1.05"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"5"},
    {key:"conc",        label:"Concentration (lb/Mgal)",    dflt:"50"},
    {key:"divEff",      label:"Fluid Loss Reduction (%)",   dflt:"80"},
    {key:"degradTime",  label:"Degradation Time (hr)",      dflt:"24"},
    {key:"maxTemp",     label:"Max Temperature (°F)",       dflt:"300"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:"Acid soluble"},
  ],
  "Flow Assurance Chemicals":[
    {key:"density",     label:"Density (g/cm³)",            dflt:"0.90"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"2.0"},
    {key:"conc",        label:"Concentration (ppm)",        dflt:"100"},
    {key:"treatmentTemp",label:"Treatment Temperature (°F)",dflt:"120"},
    {key:"cloudPoint",  label:"Cloud Point (°F)",           dflt:"40"},
    {key:"cleanupEff",  label:"Treatment Efficiency (0-1)", dflt:"0.85"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:""},
  ],
  "Cleanup Chemicals":[
    {key:"density",     label:"Density (g/cm³)",            dflt:"0.95"},
    {key:"visc",        label:"Viscosity (cP)",             dflt:"1.5"},
    {key:"conc",        label:"Concentration (%)",          dflt:"2"},
    {key:"cleanupEff",  label:"Cleanup Efficiency (0-1)",   dflt:"0.88"},
    {key:"maxTemp",     label:"Max Temperature (°F)",       dflt:"300"},
    {key:"compatibility",label:"Compatibility Notes",       dflt:""},
  ],
};
const MASTER_FLUIDS_DB = [
  {id:1000,name:"HCl 15%",cat:"Main Acid Fluids",density:"1.065",visc:"1.20",conc:"15",rxCalcite:"2.8",rxDolomite:"1.4",rxShale:"0.3",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"350",corrSeverity:"3",active:true,system:true},
  {id:1001,name:"HCl 5%",cat:"Main Acid Fluids",density:"1.020",visc:"0.90",conc:"5",rxCalcite:"1.1",rxDolomite:"0.6",rxShale:"0.1",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"300",corrSeverity:"1",active:true,system:true},
  {id:1002,name:"HCl 7.5%",cat:"Main Acid Fluids",density:"1.033",visc:"0.95",conc:"7.5",rxCalcite:"1.6",rxDolomite:"0.9",rxShale:"0.2",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"325",corrSeverity:"2",active:true,system:true},
  {id:1003,name:"HCl 10%",cat:"Main Acid Fluids",density:"1.047",visc:"1.05",conc:"10",rxCalcite:"2.0",rxDolomite:"1.1",rxShale:"0.25",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"340",corrSeverity:"2",active:true,system:true},
  {id:1005,name:"HCl 20%",cat:"Main Acid Fluids",density:"1.097",visc:"1.50",conc:"20",rxCalcite:"3.5",rxDolomite:"1.8",rxShale:"0.4",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"350",corrSeverity:"4",active:true,system:true},
  {id:1006,name:"HCl 28%",cat:"Main Acid Fluids",density:"1.140",visc:"1.80",conc:"28",rxCalcite:"4.2",rxDolomite:"2.1",rxShale:"0.5",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"300",corrSeverity:"5",active:true,system:true},
  {id:1007,name:"HCl 32%",cat:"Main Acid Fluids",density:"1.158",visc:"2.00",conc:"32",rxCalcite:"4.8",rxDolomite:"2.4",rxShale:"0.6",actEnergy:"62.7",retardFactor:"1.0",maxTemp:"280",corrSeverity:"5",active:true,system:true},
  {id:2001,name:"Acetic Acid 5%",cat:"Organic Acid Fluids",density:"1.005",visc:"1.05",conc:"5",rxCalcite:"0.5",rxDolomite:"0.3",actEnergy:"55",retardFactor:"2.0",maxTemp:"300",corrSeverity:"1",active:true,system:true},
  {id:2002,name:"Acetic Acid 10%",cat:"Organic Acid Fluids",density:"1.020",visc:"1.10",conc:"10",rxCalcite:"0.8",rxDolomite:"0.5",actEnergy:"55",retardFactor:"1.8",maxTemp:"300",corrSeverity:"1",active:true,system:true},
  {id:2003,name:"Formic Acid 5%",cat:"Organic Acid Fluids",density:"1.010",visc:"1.05",conc:"5",rxCalcite:"0.6",rxDolomite:"0.4",actEnergy:"56",retardFactor:"1.8",maxTemp:"350",corrSeverity:"2",active:true,system:true},
  {id:2004,name:"Formic Acid 10%",cat:"Organic Acid Fluids",density:"1.022",visc:"1.10",conc:"10",rxCalcite:"1.0",rxDolomite:"0.6",actEnergy:"56",retardFactor:"1.6",maxTemp:"350",corrSeverity:"2",active:true,system:true},
  {id:2005,name:"Organic Acid Blend",cat:"Organic Acid Fluids",density:"1.015",visc:"1.10",conc:"10",rxCalcite:"0.9",rxDolomite:"0.5",actEnergy:"57",retardFactor:"1.9",maxTemp:"320",corrSeverity:"2",active:true,system:true},
  {id:3001,name:"HF 1.5%",cat:"HF Acid Fluids",density:"1.015",visc:"1.05",hfConc:"1.5",hclConc:"0",rxCalcite:"4.0",rxSandstone:"7.0",maxTemp:"150",corrSeverity:"4",active:true,system:true},
  {id:3002,name:"HF 3%",cat:"HF Acid Fluids",density:"1.030",visc:"1.08",hfConc:"3.0",hclConc:"0",rxCalcite:"6.0",rxSandstone:"9.0",maxTemp:"150",corrSeverity:"5",active:true,system:true},
  {id:3003,name:"Mud Acid 7.5% HCl + 1.5% HF",cat:"HF Acid Fluids",density:"1.048",visc:"1.10",hfConc:"1.5",hclConc:"7.5",rxCalcite:"5.5",rxSandstone:"8.0",maxTemp:"200",corrSeverity:"5",active:true,system:true},
  {id:3004,name:"Mud Acid 12% HCl + 3% HF",cat:"HF Acid Fluids",density:"1.068",visc:"1.15",hfConc:"3.0",hclConc:"12",rxCalcite:"7.0",rxSandstone:"10.0",maxTemp:"200",corrSeverity:"5",active:true,system:true},
  {id:3005,name:"Organic Mud Acid",cat:"HF Acid Fluids",density:"1.025",visc:"1.12",hfConc:"1.5",hclConc:"0",rxCalcite:"3.0",rxSandstone:"6.0",maxTemp:"250",corrSeverity:"3",active:true,system:true},
  {id:4001,name:"Emulsified HCl 15%",cat:"Retarded Acids",density:"1.050",visc:"15",conc:"15",rxCalcite:"0.8",retardFactor:"3.5",maxTemp:"400",corrSeverity:"2",active:true,system:true},
  {id:4002,name:"Gelled HCl 15%",cat:"Retarded Acids",density:"1.065",visc:"50",conc:"15",rxCalcite:"0.9",retardFactor:"3.0",maxTemp:"350",corrSeverity:"2",active:true,system:true},
  {id:4003,name:"VES Acid",cat:"Retarded Acids",density:"1.060",visc:"30",conc:"15",rxCalcite:"0.7",retardFactor:"4.0",maxTemp:"350",corrSeverity:"2",active:true,system:true},
  {id:4004,name:"Retarded Acid",cat:"Retarded Acids",density:"1.065",visc:"5",conc:"15",rxCalcite:"0.6",retardFactor:"4.5",maxTemp:"500",corrSeverity:"2",active:true,system:true},
  {id:4005,name:"Self-Diverting Acid",cat:"Retarded Acids",density:"1.060",visc:"20",conc:"15",rxCalcite:"0.9",retardFactor:"2.5",maxTemp:"350",corrSeverity:"2",active:true,system:true},
  {id:4006,name:"Foam Acid",cat:"Retarded Acids",density:"0.800",visc:"3",conc:"15",rxCalcite:"0.8",retardFactor:"3.0",maxTemp:"300",corrSeverity:"2",active:true,system:true},
  {id:4007,name:"Nitrified Acid",cat:"Retarded Acids",density:"0.850",visc:"2",conc:"15",rxCalcite:"0.8",retardFactor:"2.8",maxTemp:"300",corrSeverity:"2",active:true,system:true},
  {id:5000,name:"NH4Cl 4%",cat:"Brines",density:"1.024",visc:"1.02",conc:"4",rxCalcite:"0",rxDolomite:"0",rxShale:"0",actEnergy:"0",retardFactor:"1.0",maxTemp:"300",corrSeverity:"0",active:true,system:true},
  {id:5001,name:"NH4Cl 2%",cat:"Brines",density:"1.008",visc:"1.0",saltConc:"2",clayFactor:"0.7",maxTemp:"400",active:true,system:true},
  {id:5002,name:"NH4Cl 3%",cat:"Brines",density:"1.012",visc:"1.0",saltConc:"3",clayFactor:"0.8",maxTemp:"400",active:true,system:true},
  {id:5003,name:"NH4Cl 4%",cat:"Brines",density:"1.016",visc:"1.0",saltConc:"4",clayFactor:"0.85",maxTemp:"400",active:true,system:true},
  {id:5004,name:"NH4Cl 5%",cat:"Brines",density:"1.020",visc:"1.0",saltConc:"5",clayFactor:"0.9",maxTemp:"400",active:true,system:true},
  {id:5005,name:"KCl 2%",cat:"Brines",density:"1.012",visc:"1.0",saltConc:"2",clayFactor:"0.9",maxTemp:"400",active:true,system:true},
  {id:5006,name:"KCl 3%",cat:"Brines",density:"1.018",visc:"1.0",saltConc:"3",clayFactor:"0.95",maxTemp:"400",active:true,system:true},
  {id:5007,name:"KCl 2% Brine",cat:"Brines",density:"1.012",visc:"1.0",saltConc:"2",clayFactor:"0.9",maxTemp:"400",active:true,system:true},
  {id:5008,name:"KCl 5%",cat:"Brines",density:"1.030",visc:"1.0",saltConc:"5",clayFactor:"0.98",maxTemp:"400",active:true,system:true},
  {id:5009,name:"NaCl Brine",cat:"Brines",density:"1.020",visc:"1.0",saltConc:"3",clayFactor:"0.7",maxTemp:"400",active:true,system:true},
  {id:5010,name:"CaCl2 Brine",cat:"Brines",density:"1.080",visc:"1.1",saltConc:"10",clayFactor:"0.6",maxTemp:"400",active:true,system:true},
  {id:5011,name:"Fresh Water",cat:"Brines",density:"1.000",visc:"1.0",saltConc:"0",clayFactor:"0.1",maxTemp:"400",active:true,system:true},
  {id:5012,name:"Produced Water",cat:"Brines",density:"1.015",visc:"1.0",saltConc:"2",clayFactor:"0.5",maxTemp:"400",active:true,system:true},
  {id:5013,name:"Sea Water",cat:"Brines",density:"1.025",visc:"1.0",saltConc:"3.5",clayFactor:"0.4",maxTemp:"400",active:true,system:true},
  {id:6001,name:"VES Diverter",cat:"Diverter Fluids",density:"1.020",visc:"45",tempStability:"250",degradTime:"24",divEff:"0.85",active:true,system:true},
  {id:6002,name:"Foam Diverter",cat:"Diverter Fluids",density:"0.500",visc:"3",tempStability:"200",degradTime:"4",divEff:"0.75",active:true,system:true},
  {id:6003,name:"Particulate Diverter",cat:"Diverter Fluids",density:"1.100",visc:"2",tempStability:"300",degradTime:"48",divEff:"0.80",active:true,system:true},
  {id:6004,name:"Polymer Diverter",cat:"Diverter Fluids",density:"1.015",visc:"80",tempStability:"200",degradTime:"12",divEff:"0.82",active:true,system:true},
  {id:6005,name:"Fiber Diverter",cat:"Diverter Fluids",density:"1.010",visc:"10",tempStability:"250",degradTime:"36",divEff:"0.78",active:true,system:true},
  {id:6006,name:"Benzoic Acid Diverter",cat:"Diverter Fluids",density:"1.050",visc:"2",tempStability:"350",degradTime:"6",divEff:"0.72",active:true,system:true},
  {id:6007,name:"Biodegradable Diverter",cat:"Diverter Fluids",density:"1.010",visc:"15",tempStability:"200",degradTime:"8",divEff:"0.70",active:true,system:true},
  {id:6008,name:"Viscoelastic Diverter",cat:"Diverter Fluids",density:"1.025",visc:"120",tempStability:"300",degradTime:"18",divEff:"0.92",active:true,system:true},
  {id:7001,name:"Mutual Solvent",cat:"Solvents",density:"0.920",visc:"1.5",cleanupEff:"0.85",compatibility:"Both oil and water phases",active:true,system:true},
  {id:7002,name:"Xylene",cat:"Solvents",density:"0.864",visc:"0.6",cleanupEff:"0.90",compatibility:"Hydrocarbon compatible",active:true,system:true},
  {id:7003,name:"Xylene Preflush",cat:"Solvents",density:"0.864",visc:"0.6",cleanupEff:"0.90",compatibility:"Hydrocarbon compatible",active:true,system:true},
  {id:7004,name:"Toluene",cat:"Solvents",density:"0.867",visc:"0.6",cleanupEff:"0.88",compatibility:"Hydrocarbon compatible",active:true,system:true},
  {id:7005,name:"Diesel",cat:"Solvents",density:"0.840",visc:"2.5",cleanupEff:"0.75",compatibility:"Hydrocarbon compatible",active:true,system:true},
  {id:7006,name:"Condensate",cat:"Solvents",density:"0.750",visc:"0.4",cleanupEff:"0.80",compatibility:"Light hydrocarbon",active:true,system:true},
  {id:7007,name:"Alcohol-Based Solvent",cat:"Solvents",density:"0.880",visc:"2.0",cleanupEff:"0.82",compatibility:"Mixed phase compatible",active:true,system:true},
  {id:8001,name:"Nonionic Surfactant",cat:"Surfactants",density:"1.010",visc:"1.1",conc:"0.5",cleanupEff:"0.85",compatibility:"Broad compatibility",active:true,system:true},
  {id:8002,name:"Cationic Surfactant",cat:"Surfactants",density:"1.010",visc:"1.1",conc:"0.5",cleanupEff:"0.80",compatibility:"Check with anionics",active:true,system:true},
  {id:8003,name:"Anionic Surfactant",cat:"Surfactants",density:"1.010",visc:"1.1",conc:"0.5",cleanupEff:"0.82",compatibility:"Check with cationics",active:true,system:true},
  {id:8004,name:"Foaming Surfactant",cat:"Surfactants",density:"1.005",visc:"1.0",conc:"1.0",cleanupEff:"0.75",compatibility:"Nitrogen compatible",active:true,system:true},
  {id:8005,name:"Water-Wetting Surfactant",cat:"Surfactants",density:"1.010",visc:"1.1",conc:"0.5",cleanupEff:"0.88",compatibility:"Formation water compatible",active:true,system:true},
  {id:8006,name:"Emulsifier",cat:"Surfactants",density:"1.015",visc:"1.2",conc:"1.0",cleanupEff:"0.70",compatibility:"Check HLB value",active:true,system:true},
  {id:8007,name:"Demulsifier",cat:"Surfactants",density:"1.005",visc:"1.0",conc:"0.3",cleanupEff:"0.90",compatibility:"Broad",active:true,system:true},
  {id:9001,name:"Liquid Clay Stabilizer",cat:"Clay Stabilizers",density:"1.010",visc:"1.0",conc:"1.0",clayFactor:"0.90",active:true,system:true},
  {id:9002,name:"Organic Clay Stabilizer",cat:"Clay Stabilizers",density:"1.005",visc:"1.0",conc:"0.5",clayFactor:"0.85",active:true,system:true},
  {id:9003,name:"Quaternary Amine Stabilizer",cat:"Clay Stabilizers",density:"1.010",visc:"1.0",conc:"0.5",clayFactor:"0.95",active:true,system:true},
  {id:9004,name:"Potassium-Based Stabilizer",cat:"Clay Stabilizers",density:"1.015",visc:"1.0",conc:"1.0",clayFactor:"0.92",active:true,system:true},
  {id:10001,name:"Standard Corrosion Inhibitor",cat:"Corrosion Inhibitors",density:"0.950",conc:"0.2",maxTemp:"250",corrSeverity:"5",active:true,system:true},
  {id:10002,name:"High-Temperature Corrosion Inhibitor",cat:"Corrosion Inhibitors",density:"0.960",conc:"0.5",maxTemp:"450",corrSeverity:"5",active:true,system:true},
  {id:10003,name:"Corrosion Inhibitor Intensifier",cat:"Corrosion Inhibitors",density:"0.940",conc:"0.1",maxTemp:"350",corrSeverity:"5",active:true,system:true},
  {id:10004,name:"Organic Corrosion Inhibitor",cat:"Corrosion Inhibitors",density:"0.955",conc:"0.3",maxTemp:"300",corrSeverity:"4",active:true,system:true},
  {id:11001,name:"Citric Acid",cat:"Chelating Agents",density:"1.060",visc:"1.1",conc:"5",rxCalcite:"0.5",maxTemp:"300",active:true,system:true},
  {id:11002,name:"EDTA",cat:"Chelating Agents",density:"1.080",visc:"1.2",conc:"5",rxCalcite:"0.3",maxTemp:"300",active:true,system:true},
  {id:11003,name:"HEDTA",cat:"Chelating Agents",density:"1.085",visc:"1.2",conc:"5",rxCalcite:"0.4",maxTemp:"300",active:true,system:true},
  {id:11004,name:"GLDA",cat:"Chelating Agents",density:"1.075",visc:"1.2",conc:"5",rxCalcite:"0.6",maxTemp:"350",active:true,system:true},
  {id:12001,name:"Iron Control Agent",cat:"Iron Control",density:"1.020",conc:"1.0",maxTemp:"250",active:true,system:true},
  {id:12002,name:"Chelating Agent",cat:"Iron Control",density:"1.025",conc:"1.0",maxTemp:"250",active:true,system:true},
  {id:13001,name:"Nitrogen",cat:"Nitrogen",gasDensity:"0.073",compressibility:"0.00045",foamQuality:"70",gasFraction:"70",active:true,system:true},
  {id:13002,name:"Foam Nitrogen",cat:"Nitrogen",gasDensity:"0.073",compressibility:"0.00045",foamQuality:"70",gasFraction:"70",active:true,system:true},
  {id:13003,name:"Energized Nitrogen",cat:"Nitrogen",gasDensity:"0.073",compressibility:"0.00045",foamQuality:"60",gasFraction:"60",active:true,system:true},
  {id:13004,name:"CO2 Energized Fluid",cat:"Nitrogen",gasDensity:"0.115",compressibility:"0.00060",foamQuality:"50",gasFraction:"50",active:true,system:true},
  {id:14001,name:"Guar Gel",cat:"Gelling Agents",density:"1.005",visc:"50",conc:"40",retardFactor:"2.5",maxTemp:"250",active:true,system:true},
  {id:14002,name:"HPG Gel",cat:"Gelling Agents",density:"1.005",visc:"60",conc:"35",retardFactor:"3.0",maxTemp:"300",active:true,system:true},
  {id:14003,name:"Linear Gel",cat:"Gelling Agents",density:"1.005",visc:"30",conc:"25",retardFactor:"2.0",maxTemp:"200",active:true,system:true},
  {id:14004,name:"Crosslinked Gel",cat:"Gelling Agents",density:"1.010",visc:"200",conc:"40",retardFactor:"4.0",maxTemp:"300",active:true,system:true},
  {id:14005,name:"Polymer Gel",cat:"Gelling Agents",density:"1.010",visc:"80",conc:"30",retardFactor:"3.5",maxTemp:"280",active:true,system:true},
  {id:14006,name:"Viscoelastic Gel",cat:"Gelling Agents",density:"1.010",visc:"100",conc:"30",retardFactor:"3.0",maxTemp:"250",active:true,system:true},
  {id:15001,name:"Scale Dissolver",cat:"Specialty Fluids",density:"1.060",visc:"1.2",cleanupEff:"0.80",compatibility:"Scale specific",active:true,system:true},
  {id:15002,name:"H2S Scavenger",cat:"Specialty Fluids",density:"1.030",visc:"1.1",cleanupEff:"0.90",compatibility:"Sour gas service",active:true,system:true},
  {id:15003,name:"Oxygen Scavenger",cat:"Specialty Fluids",density:"1.020",visc:"1.0",cleanupEff:"0.95",compatibility:"Water injection",active:true,system:true},
  {id:15004,name:"Paraffin Dissolver",cat:"Specialty Fluids",density:"0.870",visc:"1.5",cleanupEff:"0.85",compatibility:"Hot oil alternative",active:true,system:true},
  {id:15005,name:"Asphaltene Dissolver",cat:"Specialty Fluids",density:"0.900",visc:"2.0",cleanupEff:"0.80",compatibility:"Aromatic base",active:true,system:true},
  {id:15006,name:"Wax Solvent",cat:"Specialty Fluids",density:"0.850",visc:"1.5",cleanupEff:"0.82",compatibility:"Paraffin deposits",active:true,system:true},
  {id:15007,name:"Biocide",cat:"Specialty Fluids",density:"1.010",visc:"1.0",cleanupEff:"0.95",compatibility:"Injection water",active:true,system:true},
  {id:15008,name:"Scale Inhibitor",cat:"Specialty Fluids",density:"1.020",visc:"1.1",cleanupEff:"0.90",compatibility:"Squeeze treatment",active:true,system:true},

  // ── FOAM ADDITIVES ────────────────────────────────────────────────────────
  {id:16001,name:"Foam Stabilizer",          cat:"Foam Additives",density:"1.010",visc:"1.5",conc:"5",foamQuality:"70",foamStability:"45",maxTemp:"250",compatibility:"N2 and CO2 compatible",active:true,system:true},
  {id:16002,name:"Foam Booster",             cat:"Foam Additives",density:"1.005",visc:"1.2",conc:"3",foamQuality:"75",foamStability:"30",maxTemp:"250",compatibility:"Surfactant compatible",active:true,system:true},
  {id:16003,name:"Foam Breaker",             cat:"Foam Additives",density:"0.990",visc:"1.0",conc:"2",foamQuality:"0",foamStability:"5",maxTemp:"300",compatibility:"Post-job cleanup",active:true,system:true},
  {id:16004,name:"Antifoam Agent",           cat:"Foam Additives",density:"0.970",visc:"50",conc:"0.5",foamQuality:"0",foamStability:"0",maxTemp:"400",compatibility:"Silicone or glycol base",active:true,system:true},
  {id:16005,name:"Defoamer",                 cat:"Foam Additives",density:"0.960",visc:"80",conc:"0.3",foamQuality:"0",foamStability:"0",maxTemp:"350",compatibility:"Check crude compatibility",active:true,system:true},
  {id:16006,name:"N2 Foam System",           cat:"Foam Additives",density:"0.600",visc:"3",conc:"5",foamQuality:"65",foamStability:"40",maxTemp:"300",compatibility:"N2 energized",active:true,system:true},
  {id:16007,name:"Energized Acid",           cat:"Foam Additives",density:"0.750",visc:"2",conc:"5",foamQuality:"55",foamStability:"25",maxTemp:"250",compatibility:"HCl system",active:true,system:true},
  {id:16008,name:"Foam Stabilized Acid",     cat:"Foam Additives",density:"0.700",visc:"4",conc:"5",foamQuality:"68",foamStability:"35",maxTemp:"280",compatibility:"Carbonate acid",active:true,system:true},
  {id:16009,name:"Nitrogen Kickoff Fluid",   cat:"Foam Additives",density:"0.550",visc:"2",conc:"5",foamQuality:"75",foamStability:"20",maxTemp:"300",compatibility:"Unloading fluid",active:true,system:true},
  {id:16010,name:"Energized Foam Fluid",     cat:"Foam Additives",density:"0.650",visc:"5",conc:"5",foamQuality:"70",foamStability:"45",maxTemp:"280",compatibility:"CT compatible",active:true,system:true},
  {id:16011,name:"Methanol",                 cat:"Foam Additives",density:"0.791",visc:"0.6",conc:"5",foamQuality:"0",foamStability:"0",maxTemp:"150",compatibility:"Gas hydrate inhibitor",active:true,system:true},
  {id:16012,name:"Glycol",                   cat:"Foam Additives",density:"1.110",visc:"16",conc:"20",foamQuality:"0",foamStability:"0",maxTemp:"250",compatibility:"Freeze protection",active:true,system:true},

  // ── WELL CONTROL FLUIDS ───────────────────────────────────────────────────
  {id:17001,name:"Kill Fluid",               cat:"Well Control Fluids",density:"1.200",visc:"1.2",fluidWeight:"10.0",maxTemp:"400",pH:"7",compatibility:"Well kill operations",active:true,system:true},
  {id:17002,name:"Heavy Brine",              cat:"Well Control Fluids",density:"1.400",visc:"1.5",fluidWeight:"11.7",maxTemp:"400",pH:"7",compatibility:"CaBr2 / ZnBr2 system",active:true,system:true},
  {id:17003,name:"Completion Brine",         cat:"Well Control Fluids",density:"1.080",visc:"1.1",fluidWeight:"9.0",maxTemp:"400",pH:"7",compatibility:"CaCl2 base",active:true,system:true},
  {id:17004,name:"Produced Brine",           cat:"Well Control Fluids",density:"1.030",visc:"1.0",fluidWeight:"8.6",maxTemp:"400",pH:"6.5",compatibility:"Field specific",active:true,system:true},
  {id:17005,name:"Crude Oil",                cat:"Well Control Fluids",density:"0.870",visc:"5",fluidWeight:"7.3",maxTemp:"300",pH:"7",compatibility:"Dead crude",active:true,system:true},
  {id:17006,name:"Wash Fluid",               cat:"Well Control Fluids",density:"1.000",visc:"1.0",fluidWeight:"8.33",maxTemp:"300",pH:"7",compatibility:"Pipe cleaning",active:true,system:true},

  // ── SPACER FLUIDS ─────────────────────────────────────────────────────────
  {id:18001,name:"Spacer Fluid",             cat:"Spacer Fluids",density:"1.010",visc:"1.0",saltConc:"0",pH:"7",volume:"20",compatibility:"Between incompatible fluids",active:true,system:true},
  {id:18002,name:"Brine Spacer",             cat:"Spacer Fluids",density:"1.015",visc:"1.0",saltConc:"2",pH:"7",volume:"15",compatibility:"KCl or NaCl base",active:true,system:true},
  {id:18003,name:"Fresh Water Spacer",       cat:"Spacer Fluids",density:"1.000",visc:"1.0",saltConc:"0",pH:"7",volume:"10",compatibility:"General purpose",active:true,system:true},
  {id:18004,name:"Gas-Liquid Spacer",        cat:"Spacer Fluids",density:"0.700",visc:"1.5",saltConc:"0",pH:"7",volume:"5",compatibility:"Energized system",active:true,system:true},
  {id:18005,name:"Displacement Spacer",      cat:"Spacer Fluids",density:"1.010",visc:"1.0",saltConc:"2",pH:"7",volume:"30",compatibility:"Post-job displacement",active:true,system:true},

  // ── FLUID LOSS CONTROL ────────────────────────────────────────────────────
  {id:19001,name:"Fluid Loss Additive",          cat:"Fluid Loss Control",density:"1.050",visc:"5",conc:"50",divEff:"75",degradTime:"24",maxTemp:"250",compatibility:"Acid soluble",active:true,system:true},
  {id:19002,name:"Acid Soluble Resin",            cat:"Fluid Loss Control",density:"1.100",visc:"3",conc:"30",divEff:"85",degradTime:"48",maxTemp:"300",compatibility:"HCl acid soluble",active:true,system:true},
  {id:19003,name:"Resin Diverter",                cat:"Fluid Loss Control",density:"1.080",visc:"2",conc:"25",divEff:"80",degradTime:"36",maxTemp:"250",compatibility:"Acid and water soluble",active:true,system:true},
  {id:19004,name:"Degradable Particulate Diverter",cat:"Fluid Loss Control",density:"1.050",visc:"2",conc:"20",divEff:"78",degradTime:"12",maxTemp:"250",compatibility:"Biodegradable",active:true,system:true},

  // ── FLOW ASSURANCE CHEMICALS ──────────────────────────────────────────────
  {id:20001,name:"Paraffin Inhibitor",            cat:"Flow Assurance Chemicals",density:"0.890",visc:"3",conc:"200",treatmentTemp:"140",cloudPoint:"60",cleanupEff:"0.80",compatibility:"Crude oil compatible",active:true,system:true},
  {id:20002,name:"Asphaltene Inhibitor",          cat:"Flow Assurance Chemicals",density:"0.910",visc:"5",conc:"150",treatmentTemp:"160",cloudPoint:"80",cleanupEff:"0.82",compatibility:"Aromatic base",active:true,system:true},
  {id:20003,name:"Wax Solvent",                   cat:"Flow Assurance Chemicals",density:"0.860",visc:"1.5",conc:"500",treatmentTemp:"120",cloudPoint:"50",cleanupEff:"0.85",compatibility:"Paraffin deposits",active:true,system:true},
  {id:20004,name:"Paraffin Dissolver",            cat:"Flow Assurance Chemicals",density:"0.870",visc:"2",conc:"500",treatmentTemp:"120",cloudPoint:"55",cleanupEff:"0.88",compatibility:"Hot oil alternative",active:true,system:true},
  {id:20005,name:"Scale Converter",               cat:"Flow Assurance Chemicals",density:"1.050",visc:"1.5",conc:"100",treatmentTemp:"180",cloudPoint:"100",cleanupEff:"0.75",compatibility:"Carbonate/sulfate scales",active:true,system:true},
  {id:20006,name:"Relative Permeability Modifier",cat:"Flow Assurance Chemicals",density:"1.010",visc:"2",conc:"50",treatmentTemp:"200",cloudPoint:"120",cleanupEff:"0.70",compatibility:"Water-wet formations",active:true,system:true},
  {id:20007,name:"Wettability Modifier",          cat:"Flow Assurance Chemicals",density:"1.010",visc:"1.5",conc:"50",treatmentTemp:"180",cloudPoint:"100",cleanupEff:"0.75",compatibility:"Carbonate surfaces",active:true,system:true},

  // ── CLEANUP CHEMICALS ─────────────────────────────────────────────────────
  {id:21001,name:"Water Wetter",                  cat:"Cleanup Chemicals",density:"1.005",visc:"1.1",conc:"2",cleanupEff:"0.88",maxTemp:"300",compatibility:"Post-acid cleanup",active:true,system:true},
  {id:21002,name:"Non-Emulsifier",                cat:"Cleanup Chemicals",density:"1.010",visc:"1.2",conc:"1.5",cleanupEff:"0.90",maxTemp:"350",compatibility:"Oil/water systems",active:true,system:true},
  {id:21003,name:"Emulsion Breaker",              cat:"Cleanup Chemicals",density:"0.990",visc:"2",conc:"1",cleanupEff:"0.92",maxTemp:"300",compatibility:"Check HLB",active:true,system:true},
  {id:21004,name:"Demulsifier",                   cat:"Cleanup Chemicals",density:"0.985",visc:"1.5",conc:"0.5",cleanupEff:"0.95",maxTemp:"350",compatibility:"Field specific",active:true,system:true},
  {id:21005,name:"Solvent Surfactant Blend",      cat:"Cleanup Chemicals",density:"0.920",visc:"2",conc:"3",cleanupEff:"0.88",maxTemp:"280",compatibility:"Mixed hydrocarbon/water",active:true,system:true},
  {id:21006,name:"Organic Solvent Blend",         cat:"Cleanup Chemicals",density:"0.870",visc:"1.8",conc:"5",cleanupEff:"0.85",maxTemp:"250",compatibility:"Aromatic blend",active:true,system:true},
  {id:21007,name:"Oxygen Scavenger",              cat:"Cleanup Chemicals",density:"1.020",visc:"1.0",conc:"0.5",cleanupEff:"0.98",maxTemp:"300",compatibility:"Injection water",active:true,system:true},
  {id:21008,name:"H2S Scavenger",                 cat:"Cleanup Chemicals",density:"1.030",visc:"1.1",conc:"0.5",cleanupEff:"0.98",maxTemp:"300",compatibility:"Sour gas service",active:true,system:true},
  {id:21009,name:"Iron Sequestering Agent",       cat:"Cleanup Chemicals",density:"1.025",visc:"1.1",conc:"1",cleanupEff:"0.90",maxTemp:"250",compatibility:"HCl acid system",active:true,system:true},
  {id:21010,name:"Anti-Sludge Agent",             cat:"Cleanup Chemicals",density:"1.010",visc:"1.2",conc:"1.5",cleanupEff:"0.88",maxTemp:"300",compatibility:"Crude oil/acid contact",active:true,system:true},
  {id:21011,name:"Friction Reducer",              cat:"Cleanup Chemicals",density:"1.005",visc:"1.0",conc:"0.5",cleanupEff:"0.75",maxTemp:"300",compatibility:"CT and coiled tubing",active:true,system:true},
  {id:21012,name:"Biocide",                       cat:"Cleanup Chemicals",density:"1.010",visc:"1.0",conc:"0.3",cleanupEff:"0.99",maxTemp:"300",compatibility:"Injection water",active:true,system:true},
  {id:21013,name:"Corrosion Inhibitor Intensifier",cat:"Cleanup Chemicals",density:"0.950",visc:"1.0",conc:"0.1",cleanupEff:"0.95",maxTemp:"350",compatibility:"CI booster",active:true,system:true},
  {id:21014,name:"Acid Corrosion Intensifier",    cat:"Cleanup Chemicals",density:"0.950",visc:"1.0",conc:"0.1",cleanupEff:"0.90",maxTemp:"300",compatibility:"With main CI",active:true,system:true},
];
// Helper: get rxRate for engine from master DB entry
function masterFluidRxRate(fl) {
  if (!fl) return 0;
  const r = parseFloat(fl.rxCalcite || fl.rxSandstone || 0);
  return isNaN(r) ? 0 : r;
}
// Build INIT_FLUIDS-compatible view from MASTER_FLUIDS_DB for engine compatibility
function masterToEngineFluid(fl) {
  return {
    id:       fl.id,
    name:     fl.name,
    type:     fl.cat.split(" ")[0],
    conc:     parseFloat(fl.conc || fl.hfConc || 0) || 0,
    density:  parseFloat(fl.density || 1.0),
    visc:     parseFloat(fl.visc || 1.0),
    rxRate:   masterFluidRxRate(fl),
    color:    T.teal,
    cat:      CAT_TO_STAGE[fl.cat] || "Additive",
    active:   fl.active !== false,
  };
}


const INIT_SCHEDULE = [
  { id:1, stage:"Pre-Flush",      fluid:"Standard Preflush", rate:3, vol:200, dir:"Surface", injDepth:0 },
  { id:2, stage:"Main Injection", fluid:"HCl 15% Main Acid", rate:3, vol:500, dir:"Surface", injDepth:0 },
  { id:3, stage:"Overflush",      fluid:"KCl 2% Overflush",  rate:3, vol:150, dir:"Surface", injDepth:0 },
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
    ADAPT_MAX_RETRY:3, ADAPT_DT_FACTOR:0.5, ADAPT_ALPHA_MIN:0.10, ADAPT_ALPHA_MAX:0.50,
    SKIN_RELAX_BASE:0.35, SKIN_RELAX_MIN:0.10, MASS_BAL_TOL:0.02,
    SKIN_PHYSICAL_MIN:-0.5, PI_RATIO_MAX:8.0,  WATER_RXN_THRESH:0.01,
    // ── Per-timestep chemistry limiters (physically calibrated) ──────────
    K_STEP_MAX:     1.30,   // max k growth per stage: 30% (realistic acid stage)
    K_ABS_MAX:       8.0,   // hard cap: k_eff ≤ 8× initial perm (matrix acid field range)
    S_STEP_MAX:     0.25,   // max skin drop per timestep: 25% of |S| (realistic for acid)
    S_SMOOTH_W:     0.25,   // wormhole boost under-relaxation
    PI_CONV_MAX:     8.0,   // hard cap on PI_final/PI_init (field data: matrix acid 3–8×)
    DENOM_MIN_MULT:  0.30,  // PI denom floor = 0.30×lnR (prevents zero-skin denominator spike)
    // ── Per-variable damping (α) for all coupled variables ───────────────
    // X_new = X_old + α × (X_calc − X_old)   for each variable below.
    // All α are in [0,1]. Lower = more damped (slower to change). 
    ALPHA_K_STAGE:  0.80,   // k per-stage relaxation: k_new = k_old + 0.80×(k_calc−k_old)
    ALPHA_S_BASE:   0.50,   // skin relaxation α: S_new = S_old + α×(S_target−S_old)
    ALPHA_S_TIGHT:  0.10,   // skin tight relaxation (poor convergence)
    ALPHA_WH:       0.25,   // wormhole boost relaxation (matches S_SMOOTH_W)
    ALPHA_POR:      0.40,   // porosity relaxation: gradual update each stage
    // ── Automatic Solver Stabilisation ───────────────────────────────────
    STAB_MAX_ITER:   50,    // extended iteration cap for stabilised retry
    STAB_ALPHA:      0.20,  // tighter under-relaxation on P_wh during retry
    STAB_MAX_DP:     80,    // psi — tighter max P_wh step during retry
    STAB_TOL_Q:      1.0,   // relaxed mass-balance tolerance for retry
    STAB_J_CLAMP:    0.40,  // max fractional J change per iter (injectivity limiter)
    STAB_DT_FACTOR:  0.50,  // sub-divide timestep by this when retrying
    STAB_SMOOTH_W:   0.25,  // spatial smoothing weight for pressure redistribution
    // ── Adaptive timestep control ─────────────────────────────────────────
    ATS_SUB_MAX:     4,     // max sub-divisions of a single failed timestep
    ATS_GROW_AFTER:  3,     // converge this many ts in a row before allowing dt growth
    ATS_GROW_FACTOR: 1.25,  // dt growth factor per stable run (max 2×base dt)
    ATS_SHRINK:      0.50,  // dt shrink factor on retry
    ATS_RES_GOOD:    0.5,   // residual below this = "good" (bpm, same as TOL_Q)
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
  function getTempF(z,w)     { return clamp((+w.T_surface||59)+(+w.T_grad||1.5)*z/100,60,400); }

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
      T_surface:(+wellData.T_surface||59),   // use || so empty string → default 80°F
      T_grad:   (+wellData.T_grad   ||1.5),
      roughness:safe(+wellData.roughness,0.0018),
      tubRough_rel:0,
      // khkv (permeability anisotropy) mapped from wellData
      khkv:clamp(safe(+wellData.khkv,5),0.001,1000),
      // Reservoir span — derived directly from res[] (always accurate)
      resBot:    res.length ? Math.max(...res.map(r => r.bot)) : 0,
      resTopAct: res.length ? Math.min(...res.map(r => r.top)) : 0,
      resBotAct: res.length ? Math.max(...res.map(r => r.bot)) : 0,
    };
    w.tubRough_rel = w.roughness/(w.tubID_in*1000);
    // ── Single fluid source: MASTER_FLUIDS_DB ──────────────────────────────
    // Build engine fluid objects from MASTER_FLUIDS_DB only (authoritative).
    // User-custom fluids from fluidLib that have no matching name in MASTER_FLUIDS_DB
    // are appended so custom fluids still work.
    // This eliminates dual-DB inconsistency: all rxCalcite, conc, type, cat
    // come from one place.
    const CAT_TO_KINTYPE = {
      "Main Acid Fluids":    "HCl",
      "Retarded Acids":      "HCl",
      "HF Acid Fluids":      "HF/HCl",
      "Organic Acid Fluids": "Organic",
      "Brines":              "Brine",
      "Solvents":            "Solvent",
      "Spacer Fluids":       "Spacer",
      "Diverter Fluids":     "Diverter",
    };
    function mfToEngineFluid(f) {
      const cat    = f.cat || "Main Acid Fluids";
      const kinType= CAT_TO_KINTYPE[cat] || f.type || "HCl";
      const rxRate = clamp(safe(parseFloat(f.rxCalcite ?? f.rxRate), 0), 0, 50);
      const conc   = clamp(safe(parseFloat(f.conc), 15) / 100, 0, 1);
      return {
        id:      f.id,
        name:    f.name,
        type:    kinType,
        cat:     CAT_TO_STAGE[cat] || "Additive",
        conc,
        density: clamp(safe(parseFloat(f.density), 1.065), 0.7, 2.5),
        ppg:     gcm3ppg(safe(parseFloat(f.density), 1.065)),
        visc0:   clamp(safe(parseFloat(f.visc), 1.2), 0.1, 500),
        rxRate,
        color:   f.color || "#1ECFB2",
        isDiverter: cat.toLowerCase().includes("divert"),
        isMainAcid: ["Main Acid Fluids","Sandstone"].includes(cat),
      };
    }
    // Merge: MASTER_FLUIDS_DB first, then any custom user fluids not in master DB
    const masterNames = new Set(MASTER_FLUIDS_DB.map(f => f.name));
    const customFluids = (fluidLib || []).filter(f => !masterNames.has(f.name));
    const allFluidsRaw = [
      ...MASTER_FLUIDS_DB.filter(f => f.active !== false),
      ...customFluids,
    ];
    const fluids = allFluidsRaw.map(mfToEngineFluid);
    const sched = schedRows.map((s,i)=>{
      // Step 1: look up fluid by name in engine fluidLib
      let fl = fluids.find(f => f.name === s.fluid) || null;

      // Step 2: if still not found (user-entered recipe name), fl stays null.
      // The engine will use recipe props (rp) for rates/density/visc in Steps 3+.

      // Step 3: recipe mixture props — ALWAYS recompute from _recipeAdditives at engine time.
      // Root cause of stale results: _recipeProps is set once when the user picks a recipe
      // from the schedule dropdown, but if they later edit the recipe (change HCl 15%→32%)
      // and save, the schedule row keeps the OLD _recipeProps. The fix: ignore _recipeProps
      // and always recompute from the current additive list via MASTER_FLUIDS_DB.
      let rp = {};
      if (s._recipeAdditives && s._recipeAdditives.length) {
        // Recompute volume-weighted mixture props from current additives → MASTER_FLUIDS_DB
        const _adds = s._recipeAdditives;
        const _vols = _adds.map(a => Math.max(0.001, parseFloat(a.vol || a.conc || 1)));
        const _totV = _vols.reduce((x,v) => x+v, 0) || 1;
        let _rxC=0, _rxD=0, _rxS=0, _dens=0, _visc=0, _conc=0;
        _adds.forEach((a, ai) => {
          const mf = MASTER_FLUIDS_DB.find(f => f.name === a.name) || {};
          const wt = _vols[ai] / _totV;
          _rxC  += parseFloat(mf.rxCalcite  || 0) * wt;
          _rxD  += parseFloat(mf.rxDolomite || 0) * wt;
          _rxS  += parseFloat(mf.rxShale    || 0) * wt;
          _dens += parseFloat(mf.density    || 1.065) * wt;
          _visc += parseFloat(mf.visc       || 1.2)   * wt;
          _conc += parseFloat(mf.conc       || 0)     * wt;
        });
        rp = { rxCalcite:_rxC, rxDolomite:_rxD, rxShale:_rxS,
               density:_dens, visc:_visc,
               conc: Math.min(1, Math.max(0, _conc/100)) };  // conc is % in DB → fraction
      } else if (s._recipeProps && Object.keys(s._recipeProps).length) {
        // Fallback: use stored props if no additives list (e.g. legacy saved schedules)
        rp = s._recipeProps;
      } else {
        // Last resort: try to match s.fluid directly in MASTER_FLUIDS_DB
        // (handles case where user selects a DB fluid directly without a recipe wrapper)
        const _directMatch = MASTER_FLUIDS_DB.find(f => f.name === s.fluid);
        if (_directMatch) {
          rp = {
            rxCalcite: parseFloat(_directMatch.rxCalcite || 0),
            rxDolomite: parseFloat(_directMatch.rxDolomite || 0),
            rxShale:    parseFloat(_directMatch.rxShale || 0),
            density:    parseFloat(_directMatch.density || 1.065),
            visc:       parseFloat(_directMatch.visc || 1.2),
            conc:       Math.min(1, Math.max(0, parseFloat(_directMatch.conc || 0) / 100)),
          };
        }
      }
      const hasRecipe = Object.keys(rp).length > 0;
      let recipeRxRate = hasRecipe
        ? clamp(safe(parseFloat(rp.rxCalcite || 0), 0), 0, 50)
        : 0;

      // Step 4: classify stage type
      // PRIMARY: use fluid library category (fl.cat) — most reliable signal.
      // FALLBACK: stage name keywords when library category is not available.
      const flCatLow      = (fl?.cat || '').toLowerCase().trim();
      const stageName     = (s.stage || s.name || '').toLowerCase();
      const fluidNameLow  = (s.fluid || '').toLowerCase();
      // Main injection: fl.cat = "Main Acid" or "Sandstone", or name clearly indicates main acid.
      // IMPORTANT: 'inject' alone is NOT enough — "Main Injection" with NH4Cl is a preflush.
      // The fluid itself must also be acid (rxRate > 0) to qualify as main acid stage.
      const isMainInjStage = ['main acid','sandstone'].includes(flCatLow)
                          || stageName.includes('main acid')
                          || (stageName.includes('main') && !stageName.includes('pre') && !stageName.includes('over'))
                          || fluidNameLow.includes('main acid')
                          || (fluidNameLow.includes('hcl') && !flCatLow.includes('pre') && !stageName.includes('pre'));
      // Overflush: fl.cat = "Overflush"/"Brine"/"Displacement", or name keywords
      const isOverflush   = ['overflush','brine','displacement'].includes(flCatLow)
                          || stageName.includes('over') || stageName.includes('displac') || stageName.includes('post');
      // Preflush: fl.cat = "Preflush"/"Solvent", or name keywords — not main/over
      const isPreflush    = !isMainInjStage && !isOverflush && (
                            ['preflush','solvent','spacer'].includes(flCatLow)
                          || stageName.includes('pre') || stageName.includes('spearhead') || stageName.includes('condition')
                          || (stageName.includes('flush') && !stageName.includes('over'))
                          || fluidNameLow.includes('nh4') || fluidNameLow.includes('ammonium')
                          );
      const isAcidRecipe  = recipeRxRate > 0;

      // Step 5: resolve rxRate — prefer recipe, then library, then stage-default
      // Main acid stages MUST have rxRate > 0 for wormholing to occur
      const libRxRate  = safe(fl?.rxRate, 0);
      // Concentration scaling: rxRate ∝ conc^0.63 (Fredd-Fogler 1996, HCl-calcite kinetics)
      // concFrac: use stored recipe conc (fraction 0-1). If 0 (old recipe bug),
      // derive from the primary additive's conc in MASTER_FLUIDS_DB.
      let concFrac = (hasRecipe && +rp.conc > 0) ? +rp.conc : (fl?.conc || 0.15);
      if (hasRecipe && concFrac <= 0 && s._recipeAdditives && s._recipeAdditives.length) {
        const mainAdditiveDB = MASTER_FLUIDS_DB.find(f =>
          f.name === (s._recipeAdditives.find(a => +a.vol > 0 || +a.conc > 0) || {}).name
        ) || {};
        if (mainAdditiveDB.conc) concFrac = parseFloat(mainAdditiveDB.conc) / 100;
      }
      const concScalar = Math.pow(Math.max(0.005, concFrac) / 0.15, 0.63);
      const stageDefaultRxRate = isMainInjStage ? 2.8    // HCl 15% equivalent
                                : isPreflush    ? 0.0
                                : isOverflush   ? 0.0
                                : 0.0;
      // baseRxRate: recipe > library > stage-default (fallback only when truly missing).
      // NEVER floor to stageDefaultRxRate — that would make every acid behave like HCl 15%.
      const baseRxRate = (hasRecipe && recipeRxRate > 0)
        ? recipeRxRate                                    // recipe value (most accurate)
        : (libRxRate > 0 ? libRxRate : stageDefaultRxRate); // library or fallback
      // effectiveRxRate: scale by concentration vs HCl 15% reference.
      // Non-main stages always get 0 — this is the single point of truth.
      const effectiveRxRate = isMainInjStage
        ? Math.max(0, isNaN(baseRxRate) ? stageDefaultRxRate : baseRxRate) * concScalar
        : 0.0;

      // Build effective fluid for engine
      const flEff = {
        id:         fl?.id    || 9999,
        // Display name: show primary additive (e.g. "HCl 32%") not recipe name.
        // Recipe name ("HCl 15% Main Acid") is the container; the additive is the acid.
        name: (s._recipeAdditives && s._recipeAdditives.length > 0
          ? (s._recipeAdditives.find(a => {
              const mf = MASTER_FLUIDS_DB.find(f => f.name === a.name);
              return mf && parseFloat(mf.rxCalcite || 0) > 0;
            }) || s._recipeAdditives[0])?.name || s.fluid
          : s.fluid) || 'Unknown',
        type:       fl?.type  || 'HCl',
        cat:        fl?.cat   || (isMainInjStage ? 'Main Acid' : isPreflush ? 'Preflush' : 'Overflush'),
        // Use recipe concentration if available (rp.conc = vol-weighted acid fraction)
        conc:       hasRecipe && +rp.conc > 0 ? clamp(+rp.conc, 0, 1)
                  : hasRecipe && +rp.rxCalcite > 0 ? clamp(+rp.rxCalcite / 20.0, 0.01, 1)
                  : (fl?.conc || (isMainInjStage ? 0.15 : 0.02)),
        density:    +(hasRecipe ? (+rp.density || fl?.density  || 1.065) : (fl?.density  || 1.065)),
        ppg:        gcm3ppg(+(hasRecipe ? (+rp.density || fl?.density || 1.065) : (fl?.density  || 1.065))),
        visc0:      +(hasRecipe ? (+rp.visc    || fl?.visc0    || 1.2)   : (fl?.visc0    || 1.2)),
        rxRate:     +effectiveRxRate,
        color:      fl?.color || T.teal,
        isDiverter:  !!(fl?.isDiverter) || (fl?.cat||'').toLowerCase().includes('divert'),
        // isMainAcid: ONLY main injection stages with rxRate > 0 can change skin/k/PI.
        // isAcidRecipe alone is NOT sufficient — a preflush recipe with acid additives
        // is still a preflush. The stage classification (isMainInjStage) must agree.
        // NH4Cl, KCl, fresh water, brine → isMainAcid = false → no chemistry changes.
        isMainAcid:  isMainInjStage && (+effectiveRxRate > SOLVER.WATER_RXN_THRESH),
        isPreflush:  !!(isPreflush  && !isMainInjStage),   // preflush or conditioning stage
        isOverflush: !!(isOverflush && !isMainInjStage),   // overflush or displacement stage
      };

      // Rate stored in BPM (barrels per minute) — used directly
      const rate = clamp(safe(+s.rate, 3), 0.001, 30);
      // Volume stored in BBL (barrels) — used directly
      const vol  = clamp(safe(+s.vol,  500), 0.1, 50000);
      // topD/botD: stage injection interval — default to full reservoir span
      // Depth range for this stage: use explicit user values if set,
      // otherwise default to FULL RESERVOIR SPAN from res[] data.
      // This ensures all reservoir nodes receive fluid in bullhead injection.
      const topD = s.fromDepth > 0 ? +s.fromDepth
                 : s.topD     > 0  ? +s.topD
                 : w.resTopAct;   // min(res[*].top) — always covers first layer
      const botD = s.toDepth  > 0 ? +s.toDepth
                 : s.botD     > 0 ? +s.botD
                 : w.resBotAct;   // max(res[*].bot) — always covers last layer
      return { idx:i, name:s.stage||s.name||`Stage ${i+1}`,
               stageName:s.stage||'', fluid:flEff, rate, vol,
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
      let z_a;  // hoisted for JSC TDZ safety
      for (let i = 0; i < nAbove; i++) {
        z_a = dzA * (i + 0.5);
        nodeList.push({ z: z_a, dz: dzA, hasReservoir: false, interval: null });
      }
    }

    // Section 2: reservoir intervals + depth-gap nodes between them.
    // Each reservoir interval is subdivided into nGridsPerLayer simulation nodes.
    // nGridsPerLayer = max(1, floor(numDepthGrids / nLayers)) so total nodes ≈ numDepthGrids.
    // Each node has its own z, T_F, viscLUT, kRxnLUT — real physics at that depth.
    const sortedRes = [...res].sort((a, b) => a.top - b.top);
    const nLayers   = sortedRes.length;
    const nGridsTot = Math.max(nLayers, Math.min(200, safe(simParams?.numDepthGrids, 100)));
    const nGPL      = Math.max(1, Math.floor(nGridsTot / Math.max(1, nLayers)));  // grids per layer

    sortedRes.forEach((iv, idx) => {
      // Gap BEFORE this interval (between previous interval's bot and this top)
      if (idx > 0) {
        const prevBot = sortedRes[idx - 1].bot;
        const gapTop  = prevBot;
        const gapBot  = iv.top;
        const gapH    = gapBot - gapTop;
        if (gapH > 0.5) {
          const z  = (gapTop + gapBot) / 2;
          const dz = Math.max(0.5, gapH);
          nodeList.push({ z, dz, hasReservoir: false, interval: null, isGap: true,
                          gapTop, gapBot });
        }
      }
      // Subdivide into nGPL equally-spaced nodes.
      // Guard: iv.top=0 means unset — default to 8000 ft so z is always realistic.
      const ivTop  = iv.top > 0 ? iv.top : (iv.bot > 50 ? Math.max(1, iv.bot - Math.max(0.5, iv.h || 50)) : 8000);
      const ivBot  = iv.bot > ivTop ? iv.bot : ivTop + Math.max(0.5, iv.h || 50);
      const ivH    = Math.max(0.5, ivBot - ivTop);
      const dzSub  = ivH / nGPL;
      let z_g;  // hoisted for JSC TDZ safety
      for (let g = 0; g < nGPL; g++) {
        z_g = ivTop + dzSub * (g + 0.5);  // absolute depth from surface [ft]
        nodeList.push({ z: z_g, dz: dzSub, hasReservoir: true, interval: iv,
                        subIdx: g, nSub: nGPL });
      }
    });

    // Section 3: below last reservoir interval to tubing bottom (wellbore only)
    if (resBotD < tubLen) {
      const nBelow = Math.min(5, Math.max(1, Math.round((tubLen - resBotD) / 100)));  // cap at 5
      const dzB    = (tubLen - resBotD) / nBelow;
      let z_b;  // hoisted for JSC TDZ safety
      for (let i = 0; i < nBelow; i++) {
        z_b = resBotD + dzB * (i + 0.5);
        nodeList.push({ z: z_b, dz: dzB, hasReservoir: false, interval: null });
      }
    }

    const nDG = nodeList.length;

    // Null reservoir interval for wellbore-only nodes
    // (provides default values so shared code doesn't crash)
    // NULL_INTERVAL: used for wellbore-only and gap nodes.
    // perm=0 and hasReservoir=false means: no radial flow, no acid placement,
    // no skin reduction, no PI contribution. Purely hydrostatic / friction node.
    const NULL_INTERVAL = {
      top:0, bot:0, tvd:0, lith:'Gap', por:0.01, perm:0,
      skin:0, dmgR:12, pres:0, h:50,
      mineral:{ dissolveRate:0, calcite:0, dolomite:0, quartz:0, clay:0 },
    };

    // Build full node objects
    const nodes = nodeList.map((nd, i) => {
      const iv   = nd.hasReservoir ? nd.interval : NULL_INTERVAL;
      const z    = nd.z;
      const T_F  = getTempF(z, w);
      const T_K  = degF_to_K(T_F);
      const viscLUT = sched.map(stg => {
        const fl_v = stg.fluid, B = (fl_v.type==='Diverter') ? 3500 : 1600;
        return clamp(fl_v.visc0 * Math.exp(B * (1/T_K - 1/C.T_ref_K)), 0.01, 500);
      });
      const kRxnLUT = sched.map(stg => {
        const fl_k = stg.fluid;
        if (fl_k.rxRate <= 0) return 0;
        const kin      = KINETICS[fl_k.type] || KINETICS['HCl'];
        const T_ref_K  = C.T_ref_K;
        const tempCorr = Math.exp(clamp(-kin.Ea / C.R_gas * (1/T_K - 1/T_ref_K), -20, 10));
        return clamp(fl_k.rxRate * tempCorr, 0, 1e6);
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
        wbR_ft: w.wbR_ft,  // wellbore radius for Hawkins calculation
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
      // Per-stage timestep count: proportional to stage duration.
      // Longer stages get more timesteps; short preflush/overflush get fewer.
      // Range: [4, numTimesteps]. Base: 1 ts per 5 min injection.
      const nTS_stage = Math.min(nTS, Math.max(4, Math.ceil(stg.dur / 5)));
      const dt=Math.max(1e-4,stg.dur/nTS_stage);
      return {fl,q_bpm,ppg,rho,dPfric,dPperf,BHP_base,p_hyd_lut,Re,ff,dt,nTS_stage,tubLen:w.tubLen};
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
  // ═══════════════════════════════════════════════════════════════════════════
  // ROBUST PRESSURE SOLVER  v2.0  — Adaptive Convergence + Full Stabilisation
  // ═══════════════════════════════════════════════════════════════════════════
  // Numerical controls only — engineering inputs (perm, pres, skin, rate) never touched.
  // Req 1: Adaptive α — starts at 0.4, auto-reduces toward 0.1 on oscillation.
  // Req 2: J-limiter  — caps injectivity change per iter (±40%) → no runaway redistribution.
  // Req 3: P-smoothing — spatial Laplacian damps node-to-node oscillation.
  // Req 4: Residual divergence detection — reject iteration if residual increases 3× best.
  // Req 5: Warm-start  — smoothed previous-timestep BHP as initial guess.
  // Req 6: Residual + oscillation tracking in iterLog for diagnostics.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // DYNAMIC HYDRAULIC COUPLING SOLVER  v3.0
  // Every iteration recomputes: P_wb(i) → J(i) → q(i) → R_Q → ΔP_wh
  // Single execution path. No analytical bypass that can freeze state.
  // Convergence: R_norm = |R_Q| / Q_pump < 1%
  // ═══════════════════════════════════════════════════════════════════════════
  function solveCoupledPressure(depthNodes, si, sf, S_arr, k_eff_arr, divertFac_arr, prevBHP_arr, w) {

    const MAX_ITER = sf._stab_max_iter || 25;
    const TOL_Q    = sf._stab_tol      || 0.5;
    const TOL_NORM = 0.01;
    const ALPHA0   = sf._stab_alpha    || 0.40;
    const ALPHA_MAX = 0.80;
    const ALPHA_MIN = 0.10;
    const Q_MIN     = 1e-6;

    const nN   = depthNodes.length;
    const ppg  = safe(sf.ppg, 8.88);
    const L_tub = Math.max(1, safe(sf.tubLen, safe(w.tubLen, 8000)));

    // Reservoir pressure per node
    const Pres = depthNodes.map(nd => {
      const p = nd?.interval?.pres;
      return (isValid(+p) && +p > 0) ? +p : 3500;
    });
    const res_indices = depthNodes.reduce((a,nd,i)=>{ if(nd.hasReservoir) a.push(i); return a; },[]);
    const Pres_res = res_indices.length
      ? res_indices.reduce((s,i)=>s+Pres[i],0)/res_indices.length
      : 3500;
    const P_floor = clamp(Pres_res + 1, SOLVER.P_MIN, w.fracPres * 0.98);
    const P_ceil  = w.fracPres * 1.10;

    // ── Injectivity per node — computed once (k, S fixed during this solve call) ──
    // h is per-INTERVAL thickness, not per-node. Use nd.interval.h for the full layer.
    // For multi-node single-interval: each node computes J using the full h
    // then divides by the node count in that interval to avoid double-counting.
    const intervalNodeCount = {};
    depthNodes.forEach((nd,i) => {
      if (!nd.hasReservoir) return;
      const key = nd.interval.top + '_' + nd.interval.bot;
      intervalNodeCount[key] = (intervalNodeCount[key]||0) + 1;
    });
    const J_node = depthNodes.map((nd, i) => {
      if (!nd.hasReservoir) return 0;
      const visc_ok = nd.viscLUT && nd.viscLUT.length > si && isValid(nd.viscLUT[si]) && nd.viscLUT[si] > 0;
      const mu  = visc_ok ? nd.viscLUT[si] : safe(sf.fl?.visc0, 1.2);
      const k_i = clamp(safe(k_eff_arr[i], nd.interval.perm), 0.0001, 1e6)
                  * (1 - clamp(safe(divertFac_arr[i]), 0, 0.98));
      const lnR = Math.max(0.01, nd.lnR || safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
      const S_i = clamp(safe(S_arr[i]), -5, 200);
      const key = nd.interval.top + '_' + nd.interval.bot;
      const nNodes = intervalNodeCount[key] || 1;
      // Divide h by nNodes so total J for this interval = k×h/(141.2×μ×(lnR+S))
      const h_eff = nd.interval.h / nNodes;
      const j = safeDiv(k_i * h_eff, 141.2 * mu * Math.max(0.01, lnR + S_i));
      return (isValid(j) && j > 0) ? j : 0;
    });
    const J_total = J_node.reduce((s,v)=>s+v, 0);

    // ── P_wh warm-start from previous timestep BHP ───────────────────────────
    const z_mid   = Math.max(1, safe(depthNodes[res_indices[Math.floor(res_indices.length/2)] || 0]?.z, 5000));
    const hyd_mid = C.psi_ppg_ft * ppg * z_mid;
    const fric_mid= sf.dPfric * safeDiv(z_mid, L_tub);
    const BHP_prev_avg = res_indices.length
      ? res_indices.reduce((s,i)=>s+Math.max(0, prevBHP_arr[i]||0),0)/res_indices.length
      : Pres_res;
    let P_wh = BHP_prev_avg > SOLVER.P_MIN + 10
      ? clamp(BHP_prev_avg - hyd_mid + fric_mid, SOLVER.P_MIN, P_ceil)
      : clamp(Pres_res - hyd_mid + fric_mid + sf.dPfric, SOLVER.P_MIN, P_ceil);
    // Ensure P_wh gives BHP > P_floor at mid-reservoir
    const P_wh_min = P_floor - hyd_mid + fric_mid;
    if (P_wh < P_wh_min) P_wh = clamp(P_wh_min, SOLVER.P_MIN, P_ceil);

    // ── Single-interval exact solution ────────────────────────────────────────
    // For wells where all reservoir nodes share one interval: exact 1-step.
    // P_wh* = Q_pump/J_total + Pres_avg - hyd_avg + fric_avg
    const allSameInterval = res_indices.length > 0 && res_indices.every(
      i => depthNodes[i].interval === depthNodes[res_indices[0]].interval
    );
    if (allSameInterval && J_total > Q_MIN) {
      const hyd_avg  = res_indices.reduce((s,i)=>s + C.psi_ppg_ft*ppg*Math.max(0,safe(depthNodes[i].z,0)),0)/res_indices.length;
      const fric_avg = res_indices.reduce((s,i)=>s + sf.dPfric*safeDiv(Math.max(0,safe(depthNodes[i].z,0)),L_tub),0)/res_indices.length;
      const Pres_avg = res_indices.reduce((s,i)=>s+Pres[i],0)/res_indices.length;
      const P_wh_exact = sf.q_bpm * C.day_min / J_total + Pres_avg - hyd_avg + fric_avg;
      P_wh = clamp(P_wh_exact, SOLVER.P_MIN, P_ceil);
      // Build output with exact solution
      const out_exact = depthNodes.map((nd,i) => {
        const z_i  = Math.max(0, safe(nd.z,0));
        const bhp  = clamp(P_wh + C.psi_ppg_ft*ppg*z_i - sf.dPfric*safeDiv(z_i,L_tub), P_floor, P_ceil);
        const dp_i = Math.max(0, bhp - Pres[i]);
        const q_i  = nd.hasReservoir ? J_node[i] * dp_i / C.day_min : 0;
        const R_Q_exact = sf.q_bpm - res_indices.reduce((s,ii)=>{
          const z2=Math.max(0,safe(depthNodes[ii].z,0));
          const b2=clamp(P_wh+C.psi_ppg_ft*ppg*z2-sf.dPfric*safeDiv(z2,L_tub),P_floor,P_ceil);
          return s+J_node[ii]*Math.max(0,b2-Pres[ii])/C.day_min;
        },0);
        const R_norm_ex = sf.q_bpm > Q_MIN ? Math.abs(R_Q_exact)/sf.q_bpm : Math.abs(R_Q_exact);
        const tp  = clamp(bhp - safe(sf.p_hyd_lut?.[i],0) + sf.dPfric, SOLVER.P_MIN, bhp*1.5);
        return { bhp, tp, whp:clamp(tp-sf.dPfric*0.4,SOLVER.P_MIN,tp),
          qres: q_i, dPfric:sf.dPfric, dPperf:sf.dPperf, dP_nb:0,
          fracRisk:bhp>=w.fracPres, Re:sf.Re, ff:sf.ff,
          converged: R_norm_ex < TOL_NORM, iters:1,
          iterLog:[{iter:1, P_wh:+P_wh.toFixed(1), Q_calc:+(res_indices.reduce((s,ii)=>{
            const z2=Math.max(0,safe(depthNodes[ii].z,0));
            const b2=clamp(P_wh+C.psi_ppg_ft*ppg*z2-sf.dPfric*safeDiv(z2,L_tub),P_floor,P_ceil);
            return s+J_node[ii]*Math.max(0,b2-Pres[ii])/C.day_min;
          },0)).toFixed(3), R_Q:+R_Q_exact.toFixed(3),
          R_pct:+(R_norm_ex*100).toFixed(2), mode:R_norm_ex<TOL_NORM?'ANALYTIC':'ANALYTIC-INFEASIBLE'}],
          residual:Math.abs(R_Q_exact), R_Q:R_Q_exact, R_norm:R_norm_ex,
          freezeChemistry:false, Pwf:+bhp.toFixed(1) };
      });
      // If exact solution converged, return it directly
      if (out_exact[0].converged) return out_exact;
      // Otherwise fall through to Newton (infeasible case)
    }

    // ── Newton-Raphson iteration ──────────────────────────────────────────────
    let best_P_wh  = P_wh;
    let best_R_Q   = 1e9;
    let _zi_n = 0, _bhp_n = 0, _dp_n = 0, dP_newton = 0;  // hoisted Newton loop vars
    let converged  = false;
    let iter_done  = 0;
    let alpha_dyn  = ALPHA0;
    let R_Q = 0, R_norm = 1, Q_bpm_val = 0;
    let P_wh_prev0 = P_wh;  // for stagnation detection
    let stag_count = 0;
    const iterLog  = [];

    for (let iter = 0; iter < MAX_ITER; iter++) {
      iter_done = iter + 1;

      // Compute Q_total from current P_wh
      Q_bpm_val = 0;
      for (let i = 0; i < nN; i++) {
        if (!depthNodes[i].hasReservoir) continue;
        _zi_n  = Math.max(0, safe(depthNodes[i].z, 0));
        _bhp_n = P_wh + C.psi_ppg_ft * ppg * _zi_n - sf.dPfric * safeDiv(_zi_n, L_tub);
        _dp_n  = Math.max(0, _bhp_n - Pres[i]);
        Q_bpm_val  += J_node[i] * _dp_n / C.day_min;
      }

      R_Q    = sf.q_bpm - Q_bpm_val;
      R_norm = sf.q_bpm > Q_MIN ? Math.abs(R_Q) / sf.q_bpm : Math.abs(R_Q);

      iterLog.push({
        iter: iter_done,
        P_wh: +P_wh.toFixed(1),
        Q_calc: +Q_bpm_val.toFixed(3),
        J_sum: +J_total.toFixed(4),
        R_Q: +R_Q.toFixed(3),
        R_pct: +(R_norm*100).toFixed(2),
        alpha: +alpha_dyn.toFixed(3),
        mode: R_norm < TOL_NORM ? 'CVG'
            : stag_count > 3 ? 'STAG'
            : iter > 1 && Math.abs(R_Q) > best_R_Q * 1.1 ? 'DIV'
            : 'converging',
      });

      if (Math.abs(R_Q) < best_R_Q) { best_R_Q = Math.abs(R_Q); best_P_wh = P_wh; }
      if (R_norm < TOL_NORM || Math.abs(R_Q) < TOL_Q) { converged = true; break; }

      // Stagnation: P_wh not moving
      stag_count = Math.abs(P_wh - P_wh_prev0) < 0.5 ? stag_count + 1 : 0;
      P_wh_prev0 = P_wh;
      if (stag_count > 3) {
        // Force a step in the correct direction equal to the full Newton step
        P_wh = clamp(P_wh + (R_Q > 0 ? 1 : -1) * Math.min(500, Math.abs(R_Q) * C.day_min / Math.max(Q_MIN, J_total)),
                     SOLVER.P_MIN, P_ceil);
        stag_count = 0; alpha_dyn = ALPHA0;
        continue;
      }

      dP_newton = J_total > Q_MIN
        ? alpha_dyn * R_Q * C.day_min / J_total
        : alpha_dyn * (R_Q > 0 ? 500 : -500);
      P_wh = clamp(P_wh + dP_newton, SOLVER.P_MIN, P_ceil);

      // Adaptive α
      if (iter > 1 && Math.abs(R_Q) > best_R_Q * 1.1)
        alpha_dyn = Math.max(ALPHA_MIN, alpha_dyn * 0.6);
      else if (R_norm < 0.1 && alpha_dyn < ALPHA_MAX)
        alpha_dyn = Math.min(ALPHA_MAX, alpha_dyn * 1.15);
    }

    if (!converged) {
      P_wh = best_P_wh;  // use best seen
      iterLog.push({ iter:iter_done, event:`MAX_ITER(${MAX_ITER}). R_Q=${R_Q?.toFixed(3)} bpm (${(R_norm*100).toFixed(1)}%). J_total=${J_total.toFixed(4)}. P_wh=${P_wh.toFixed(1)}.` });
    }

    // ── Build output ──────────────────────────────────────────────────────────
    return depthNodes.map((nd, i) => {
      const z_i  = Math.max(0, safe(nd.z, 0));
      const bhp  = clamp(P_wh + C.psi_ppg_ft*ppg*z_i - sf.dPfric*safeDiv(z_i,L_tub), P_floor, P_ceil);
      const dp_i = Math.max(0, bhp - Pres[i]);
      const tp   = clamp(bhp - safe(sf.p_hyd_lut?.[i],0) + sf.dPfric, SOLVER.P_MIN, bhp*1.5);
      return {
        bhp, tp, whp: clamp(tp - sf.dPfric*0.4, SOLVER.P_MIN, tp),
        qres: nd.hasReservoir ? J_node[i] * dp_i / C.day_min : 0,
        dPfric:sf.dPfric, dPperf:sf.dPperf, dP_nb:0,
        fracRisk: bhp >= w.fracPres,
        Re:sf.Re, ff:sf.ff,
        converged, iters:iter_done, iterLog,
        residual:best_R_Q, R_Q, R_norm,
        // Freeze chemistry only on near-total solver failure (>50%).
        // R_norm 10-50% = capacity-limited (pump > frac capacity) — acid that entered DOES react.
        freezeChemistry: R_norm > 0.50,
        capacityLimited: !converged && R_norm > 0.05 && R_norm <= 0.50,  // physics limit, not numerical failure
        Q_achievable_bpm: converged ? sf.q_bpm : Q_bpm_val,
        Pwf:+bhp.toFixed(1),
      };
    });
  }
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
  function calcChemistry(nd, si, fl, S_prev, k_eff, k_0, por, r_pen, dV, dt, C_curr, nNodesInterval) {
    // ── Hard early exit for non-reactive fluids ──────────────────────────────
    // If rxRate < WATER_RXN_THRESH the fluid cannot dissolve rock.
    // Return identity: S unchanged, k unchanged, r unchanged, PI from current state.
    // h_eff: effective thickness for this node (interval.h / nodes_in_interval).
    // dV is per-node volume, so pore volumes and areas must use per-node h.
    const h_eff = Math.max(0.01, nd.interval.h / Math.max(1, nNodesInterval || 1));
    if ((fl.rxRate || 0) < SOLVER.WATER_RXN_THRESH) {
      const S_c0  = clamp(S_prev, -8, 200);
      const mu0   = nd.viscLUT[si] || 1.2;
      const PI0   = safeDiv(k_eff * h_eff, 141.2 * mu0 * Math.max(0.01, nd.lnR + S_c0));
      return { C_new:C_curr||1, r_new:r_pen, k_new:k_eff, por_out:por,
               S_new:S_prev, bypass:0, Da:0, eta_wh:0, wh_boost:1,
               isReactive:false, reactionFactor:0,
               PI:clamp(PI0,0,1e6), FE:safeDiv(nd.lnR, Math.max(0.01, nd.lnR+S_c0)) };
    }
    // Pore velocity (no sqrt — r_pen already has sqrt built in from prior step)
    const A_cross = 2*3.14159*Math.max(0.001,r_pen)*h_eff;
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
    // η_wh floor at 0.20: even at high flow rates wormhole initiation occurs.
    // Field data: carbonate matrix acid initiates wormholes at η ≈ 0.15–0.25 even far from Da_opt.
    const eta_wh = clamp(Math.exp(-0.38*lnr2*lnr2), 0.20, 1.0);
    const dR     = nd.mineral.dissolveRate;

    // Wormhole boost — approximate with linear interpolation around Da_opt
    // Full formula: base×exp(-0.5×(ln(Da/Da_opt))²) — reuse lnr2
    const base   = 1.8+0.8*safePow(safeDiv(nd.interval.perm,100),0.15);
    const wh_boost = clamp(base*Math.exp(-0.5*lnr2*lnr2), 0.6, 3.5);  // one exp call

    // Acid concentration decay — explicit Euler, no loop
    const kin    = KINETICS[fl.type]||KINETICS['default'];
    // C_curr: current acid concentration (depleted from previous ts), normalised [0..1]
    // fl.conc: initial recipe concentration [fraction]
    // C_prev = C_curr × fl.conc = actual current molar concentration
    const C_init  = fl.conc;                                 // initial acid fraction
    const C_prev  = C_curr != null ? clamp(+C_curr * C_init, 0, C_init) : C_init;
    const rate    = clamp(k_rxn_T*safePow(Math.max(1e-6, C_prev/Math.max(1e-6,C_init)), kin.n_rxn)*k_rxn_T, 0, 1e6);
    const C_new_abs = clamp(C_prev - rate*dt, 0, C_init);
    const C_new   = C_init > 0 ? C_new_abs / C_init : 0;    // normalised for next ts

    // ── REACTION FACTOR — computed FIRST, gates ALL chemistry outputs ─────────
    // ReactionFactor = f(rxRate, conc, mineralogy, acid spending, temperature)
    // Non-reactive fluids (KCl, fresh water, brine): rxRate < WATER_RXN_THRESH
    //   → reactionFactor = 0 → no skin, no k boost, no wormhole growth, no PI change.
    // ── REACTION FACTOR gates ALL skin reduction — ΔS ∝ V_acid × ReactionFactor
    // ReactionFactor = f(rxRate, conc, mineralogy, acid spending, temperature)
    // Fresh water: rxRate < WATER_RXN_THRESH → ReactionFactor=0 → bypass=0 → no ΔS
    const rxRate_fl  = safe(fl.rxRate, 0);
    const isReactive = rxRate_fl >= SOLVER.WATER_RXN_THRESH;
    // spendFrac: fraction of acid consumed (0=fresh, 1=spent)
    // availFrac: acid still capable of reacting (even spent acid reacts somewhat)
    const spendFrac   = isReactive ? clamp(1 - safeDiv(C_new_abs, Math.max(1e-6,C_init)), 0, 1) : 0;
    const availFrac   = isReactive ? clamp(1 - spendFrac * 0.5, 0.5, 1.0) : 0;
    const calcFrac    = clamp(safe(nd.interval.mineral?.calcite, 0.9), 0, 1);
    const minReact    = 0.3 + 0.7 * calcFrac;   // 0.3 (shale) → 1.0 (pure calcite)
    const concFl      = clamp(fl.conc || 0.15, 0.005, 1.0);
    const concFactor  = safePow(concFl / 0.15, 0.63);
    // reactionFactor: availFrac × mineralogy × concentration × wormhole efficiency
    // eta_wh already encodes temperature effect via kRxnLUT — no separate tempFactor needed
    // reactionFactor: fraction of maximum possible skin removal this timestep.
    // = f(availability, mineralogy, concentration, rxRate vs HCl15% reference).
    // rxRate is normalised to HCl 15% (rxRate=2.8) so stronger acids give higher
    // reactionFactor and faster skin removal; retarded/organic acids give lower.
    // Does NOT include eta_wh (that gates dV_eff, k_enh, bypass_geo — no double-damping).
    const rxNorm = isReactive ? clamp(safe(fl.rxRate, 0) / 2.8, 0.05, 3.0) : 0;
    const reactionFactor = isReactive
      ? clamp(availFrac * minReact * concFactor * rxNorm, 0, 1.0) : 0;

    // ── All chemistry outputs gated by isReactive ────────────────────────────
    // Penetration — only acid grows wormholes (r_new needed before skin calculation)
    const dV_eff  = isReactive ? dV*eta_wh*wh_boost : 0;
    const r_old   = Math.max(0.001, r_pen);
    const r_calc  = safeSqrt(r_old*r_old+safeDiv(dV_eff*C.bbl_ft3,3.14159*h_eff*nd.interval.por));
    const r_new   = isReactive
      ? clamp(relax(r_old,clamp(r_calc,r_old,r_old+10),SOLVER.ALPHA_PEN),r_old,SOLVER.R_PEN_MAX)
      : r_old;  // non-reactive: wormhole radius unchanged

    // Permeability enhancement — gated: non-reactive cannot dissolve rock
    const dis_frac= isReactive ? clamp(1-safeDiv(C_new_abs,Math.max(1e-6,C_init)),0,1) : 0;
    const dpor    = clamp(dis_frac*dR*0.15,0,0.25);
    const por_new = clamp(por+dpor,por,0.6);
    const kc      = safePow(safeDiv(por_new,Math.max(0.001,por)),3)
                   *safePow(safeDiv(1-por,Math.max(0.001,1-por_new)),2);
    const r_dm    = Math.max(0.001,0.001)*3;
    const wh_reach  = isReactive ? clamp(safeDiv(r_new-0.001,Math.max(0.01,r_dm)),0,1) : 0;
    // k_enh: skin-coupled — when skin is still high, wormholes work on damage bypass
    // not bulk k enhancement. As skin drops toward 0, k enhancement grows.
    // skin_damp: 1.0 when S=0 (full enhancement), 0.2 when S=S_init (mostly bypass).
    const S_init_nd = nd.interval.skin || 0;
    // skin_damp: reduces k enhancement when skin is still high (wormholes work on damage first).
    // Coupling factor reduced from 0.6→0.3 so k enhancement is visible even with high initial skin.
    const skin_damp = S_init_nd > 0
      ? clamp(1.0 - 0.3 * safeDiv(Math.max(0, S_prev), S_init_nd), 0.4, 1.0)
      : 1.0;
    const k_enh   = isReactive ? clamp(kc*(1+5.0*eta_wh*wh_reach*skin_damp), 1, SOLVER.K_ABS_MAX) : 1.0;
    // k_new: wormhole enhancement multiplies the CURRENT effective k (not initial k_0).
    // This correctly accumulates enhancement across multiple acid stages.
    // Floor = k_eff (k cannot decrease from dissolution); ceiling = k_0×K_ABS_MAX.
    const k_new   = isReactive
      ? clamp(k_eff * k_enh, k_eff, k_0 * SOLVER.K_ABS_MAX)
      : k_eff;
    const por_out = isReactive ? clamp(por+dis_frac*dR*0.01,por,0.5) : por;

    // ── SKIN — volume-based bypass + Hawkins geometry ───────────────────────
    const dmgR_ft    = Math.max(0.01, nd.interval.dmgR / 12);
    const wbR_ft     = Math.max(0.001, nd.wbR_ft || 0.030);
    // Mechanism 1: volume bypass — acid dissolving damage zone pore space directly.
    // V_pore_dmg = π×dmgR²×h×por [ft³].  scale=3 accounts for wormhole channelling.
    const V_pore_dmg  = Math.max(0.001, 3.14159*dmgR_ft*dmgR_ft*h_eff*nd.interval.por);
    const bypass_vol  = clamp(safeDiv(Math.max(0,dV)*C.bbl_ft3, V_pore_dmg)*3.0, 0, 0.70);
    // Mechanism 2: geometry bypass — wormhole penetration past damage radius.
    const r_pen_net   = Math.max(0, r_new - wbR_ft);
    const divCov      = clamp(safe(nd.divCoverage, 0), 0, 1);
    const arg_hw      = safeDiv(r_pen_net * wh_boost * (1+divCov), dmgR_ft);
    const tanh_hw     = safeDiv(arg_hw, 1+Math.abs(arg_hw));
    const bypass_geo  = clamp(tanh_hw * eta_wh * dR * (1+0.5*divCov), 0, 0.75);
    // bypass: geometric/volumetric fraction of damage removed; gate on isReactive only.
    // reactionFactor scales removal RATE per timestep, not the maximum achievable bypass.
    const bypass_raw  = clamp(Math.max(bypass_vol, bypass_geo), 0, 0.80);
    const bypass      = isReactive ? bypass_raw : 0;
    const S_mech      = Math.max(0.0, nd.interval.skin * 0.05);
    const S_target    = Math.max(S_mech, nd.interval.skin * (1 - bypass));
    const alpha_S     = isReactive
      ? clamp(SOLVER.ALPHA_S_BASE * (0.3 + 0.7*reactionFactor), SOLVER.SKIN_RELAX_MIN, SOLVER.ALPHA_S_BASE)
      : 0;
    const S_new       = alpha_S > 0
      ? clamp(relax(S_prev, Math.min(S_prev, S_target), alpha_S), SOLVER.SKIN_PHYSICAL_MIN, S_prev)
      : S_prev;

    // PI = k×h / (141.2×μ×(lnR+S))
    // Denominator floor prevents zero-skin from collapsing lnR+S and causing PI spike.
    // Near-wellbore resistance (completion, turbulence) always remains — floor = 30%×lnR.
    const S_c       = clamp(S_new,-8,200);
    const denom_raw = nd.lnR + S_c;
    const denom_fl  = Math.max(0.01, nd.lnR * SOLVER.DENOM_MIN_MULT);
    const denom     = Math.max(denom_fl, denom_raw);
    const mu_nd     = nd.viscLUT[si];
    const PI        = safeDiv(k_new*h_eff, 141.2*mu_nd*denom);
    const FE        = safeDiv(nd.lnR, denom);

    return {C_new,r_new,k_new,por_out,S_new,bypass,Da,eta_wh,wh_boost,isReactive,reactionFactor,
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
    const V_acid_cum      = depthNodes.map(() => 0);
    const C_acid          = depthNodes.map(() => 1.0);   // normalised acid conc [0..1], 1=fresh
    // C_acid[ni] tracks depleted acid concentration [fraction] per node, per timestep  // all fluid (non-diverter) [bbl]
    const V_main_acid_cum = depthNodes.map(() => 0);  // main-acid only [bbl]
    const V_total_cum     = depthNodes.map(() => 0);  // ALL fluid including overflush/preflush [bbl]
    const V_pre_cum       = depthNodes.map(() => 0);  // preflush [bbl]
    const V_main_cum      = depthNodes.map(() => 0);  // main injection [bbl]
    const V_over_cum      = depthNodes.map(() => 0);  // overflush [bbl]
    const T_main_acid_cum = depthNodes.map(() => 0);  // total main-injection duration [min]
    const V_div_cum       = depthNodes.map(() => 0);
    // Per-node Qres [bpm] stored each timestep — last value used for output
    const Qres_node       = depthNodes.map(() => 0);  // latest Qres from solver [bpm]
    // Per-stage, per-node volume accumulator (reset each stage)
    // dV_stage defined below inside LOOP 1
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
      z: nd.z, T_F: nd.T_F, dz: nd.dz, interval: nd.interval, hasReservoir: nd.hasReservoir,
      S_init: S_init[ni], S_final: S_init[ni],
      r_pen_in: 0, V_acid: 0, V_main_acid: 0, T_main_acid: 0, V_div: 0, bhp_main: 0,
      fluid_density: 0, fluid_visc: 0, fluid_rxRate: 0, fluid_T_F: 0, isReactiveStage: false,
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
    const stageResults = [];   // per-stage summary

    // ── PRESSURE TIME SERIES — flatMap produces array without any loop ────
    // Pressure time series: run coupled solver once per stage with initial node state
    // to get realistic BHP profile. Produces up to 10 points per stage.
    const pressureTimeSeries = sched.flatMap((stg, si) => {
      const sf_ts = stageFric[si];
      const t0  = sched.slice(0, si).reduce((s, x) => s + x.dur, 0);
      // Use initial node pressures as warm start for the time-series solve
      const prevBHP0 = nodeState.map(ns => ns.presField.bhp);
      const nodeP_ts = solveCoupledPressure(depthNodes, si, sf_ts, S, k_eff, divertFac, prevBHP0, w);
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
          x:       +(t0 + ts * sf_ts.dt).toFixed(2),
          tp:      +(tp_avg  * decay).toFixed(1),
          bhp:     +(bhp_avg * decay).toFixed(1),
          whp:     +(whp_avg * decay).toFixed(1),
          frac:    +w.fracPres.toFixed(1),
          dPfric:  +sf_ts.dPfric.toFixed(1),
          dPperf:  +sf_ts.dPperf.toFixed(1),
          Re:      +sf_ts.Re.toFixed(0),
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
    // Convergence history
    const conv_hist = { massBalanceErr:0, adaptRetries:0, permContrast:1 };
    // Permeability contrast analysis with actionable guidance
    const _res_perms = res.map(r => +r.perm).filter(v => v > 0);
    const _perm_min  = _res_perms.length ? Math.min(..._res_perms) : 1;
    const _perm_max  = _res_perms.length ? Math.max(..._res_perms) : 1;
    conv_hist.permContrast = _res_perms.length > 1 ? _perm_max / Math.max(0.001,_perm_min) : 1;
    const _nGrids = depthNodes.filter(n=>n.hasReservoir).length;
    log.push(`[INIT] ${res.length} layers | ${_nGrids} grids | k: ${_perm_min.toFixed(1)}–${_perm_max.toFixed(1)} md | contrast: ${conv_hist.permContrast.toFixed(0)}×`);
    if (conv_hist.permContrast > 100) {
      log.push(`[WARN] Perm contrast ${conv_hist.permContrast.toFixed(0)}× > 100× — injectivity instability risk`);
      log.push(`  ► Increase depth grids: ${_nGrids} → ${Math.min(200,_nGrids*3)} recommended`);
      log.push(`  ► Add Diverter stage to redistribute acid placement`);
    } else if (conv_hist.permContrast > 20) {
      log.push(`[DIAG] Moderate perm contrast ${conv_hist.permContrast.toFixed(0)}× — monitor convergence`);
    }

    // ── LOOP 1: Injection Stage ──────────────────────────────────────────────
    let stg, sf, fl, dt, nTS_base_stage, _lastMode, _isReactiveFluid, cumVolStage, dV_stage, lastNodeP, stab_subdivide, nTS_eff, dt_eff, stage_ncvg, dt_scale, stable_run, dt_ts, t_global, sub_n, sub_pass, nodeP, prevBHP_arr, ats_nodeP, ats_res, ats_converged, ats_attempt, dt_sub, ats_all_ok, sub_prevBHP, sub_si, sf_sub, retry, alpha_retry, bestNodeP_s, bestRes_s, bhp_prev_r, sw2_r, bhp_sm2_r, smBHP2_r, sf_r2, nodeP_r2, res_r2, bL2, bR2, unstable, kVals, kContr, noFlowD, rootCause, diagMsg, severity, recs, avg_pres_diag, J_node, qres_total, J_total_ts, use_fallback, V_ts_surface, raw_weights, raw_total, active_nodes, active_count, dV_ts, nd, bhp_ts, nd_ni, dV_ni, q_solver, dV, dur, nd_ref, h_por, C_curr, ch, k_max_step, alpha_S_stab, S_unclamped, S_drop_max, S_relaxed, Qres_bpm, T_total_min, V_pen_bbl, h_nd, phi_nd, r_old, r_sq_new, r_pen_new, V_main_layer_sum, V_conservation_err, firstResNode, cvg_pct, _rxR, _isRx, _nd, _ns, _dV, _sb, _sa, _kb, _ka, _pb, _pa, _flags, _f, _pfx, nodeStageData, v_stage, q_avg, qres_last_raw, qres_last_val, vol_check, h_s, por_s, rwb, r_tot, hc, rw2, rt2, totalQresStage, mu_f2, S_f2, d_f2, mu_nr, S_nr, denom_nr, _Q_achievable, _ivNodeCount, _ivKey, key_c, S_stage_start, k_stage_start, _mu_s, _d_s, _lnR_s, _denom_min, _d_a;  // hoisted for JSC TDZ safety
    for (let si = 0; si < sched.length; si++) {

      if (wall_aborted) break;
      if (Date.now() - ts_start > MAX_WALL_MS) {
        wall_aborted = true;
        log.push(`[WALL_TIMEOUT] >8s — aborting at stage ${si+1}`);
        break;
      }

      stg = sched[si];
      sf  = stageFric[si];
      fl  = stg.fluid;
      dt  = sf.dt;               // dt = stage_duration / nTS
      cumVolStage = 0;

      // Reset acid concentration to recipe value at start of each new stage
      // (fresh fluid is injected, so concentration resets to fl.conc for this stage)
      depthNodes.forEach((nd, ni) => { C_acid[ni] = 1.0; });  // normalised: 1.0 = fresh

      // Snapshot skin and k at START of this stage
      S_stage_start = S.slice();
      k_stage_start = k_eff.slice();
      // Reset S_stage_bef on all nodes so this stage gets fresh values
      depthNodes.forEach((_, _ni) => { nodeState[_ni].S_stage_bef = undefined; });

      // Per-node accumulators for this stage (reset each stage)
      dV_stage    = new Array(nN).fill(0);
      // lastNodeP[ni]  = final pressure solution for node ni (from last timestep)
      lastNodeP   = new Array(nN);

      // Compute nTS_eff and dt_eff BEFORE using them in log.push
      stab_subdivide = conv_hist.adaptRetries > 0 && si > 0;
      nTS_base_stage = sf.nTS_stage || nTS;
      nTS_eff  = stab_subdivide ? Math.round(nTS_base_stage / SOLVER.STAB_DT_FACTOR) : nTS_base_stage;
      dt_eff   = Math.max(0.01, stg.dur / nTS_eff);
      log.push(
        `Stage ${si+1}/${sched.length}: "${stg.name}"` +
        `  fluid="${fl.name}"` +
        `  conc=${(fl.conc>0?(fl.conc<1?fl.conc*100:fl.conc):0).toFixed(1)}%` +
        `  rxRate=${fl.rxRate.toFixed(3)} mol/m²·s` +
        `  visc=${(fl.visc0||fl.visc||1.2).toFixed(2)} cp` +
        `  rate=${stg.rate.toFixed(2)} bpm  vol=${stg.vol.toFixed(0)} bbl` +
        `  dur=${stg.dur.toFixed(1)} min  nTS=${nTS_eff}  dt=${dt_eff.toFixed(3)} min` +
        (fl.isMainAcid ? `  [REACTIVE rxRate=${fl.rxRate.toFixed(3)}]` : fl.isDiverter ? `  [DIVERTER]` : `  [inert rxRate=0]`)
      );
      if (stab_subdivide) {
        log.push(`  [STAB] Stage ${si+1}: sub-divided to ${nTS_eff} timesteps (dt=${dt_eff.toFixed(3)} min) due to prior convergence issues`);
      }
      stage_ncvg = 0;   // non-converged timestep counter for this stage
      // Adaptive timestep state — tracks dt health across this stage's timesteps.
      // dt_scale: grows toward ATS_GROW_FACTOR after stable convergence,
      //           shrinks on failure. Applied to dt_eff for the NEXT timestep.
      // stable_run: count of consecutive first-pass convergences.
      // Only dt_scale is modified — never perm, skin, rate, or concentrations.
      dt_scale   = 1.0;   // multiplier on base dt_eff (1.0 = no change)
      stable_run = 0;     // consecutive converged timesteps

      // ── LOOP 2: Timestep ───────────────────────────────────────────────────
      for (let ts = 0; ts < nTS_eff; ts++) {
        // Wall-clock guard inside timestep loop — prevents hang on slow devices
        if (Date.now() - ts_start > MAX_WALL_MS) {
          wall_aborted = true;
          log.push(`[WALL_TIMEOUT] stage ${si+1} ts ${ts+1} — aborting`);
          break;
        }
        // ── Adaptive timestep: apply dt_scale to this timestep's effective dt ──
        // dt_scale grows after stable runs, shrinks on failure.
        // The sub-step loop below handles the actual sub-division on failure.
        dt_ts  = clamp(dt_eff * dt_scale, dt_eff * 0.25, dt_eff * 2.0);
        t_global = cumTime + ts * dt_eff;

        // ── ATS Sub-step loop ─────────────────────────────────────────────────
        // On first-pass convergence failure, split this timestep into sub-steps.
        // sub_n: number of sub-steps (1 = no split, up to ATS_SUB_MAX).
        // Only dt is reduced; all engineering inputs remain unchanged.
        sub_n     = 1;          // start with full timestep
        sub_pass  = false;      // did any sub-step configuration converge?
        // nodeP will be set by inner loop
        prevBHP_arr = nodeState.map(ns => ns.presField.bhp);

        // Outer attempt: try full dt, then sub-divided if needed
        // ats_nodeP, ats_res, ats_converged declared in outer hoist
        ats_attempt = 0;
        while (ats_attempt < 2 && !sub_pass) {
          ats_attempt++;
          dt_sub = dt_ts / sub_n;
          ats_all_ok = true;

          // Run sub_n sub-steps
          sub_prevBHP = prevBHP_arr.slice();
          sub_si = 0;
          while (sub_si < sub_n) {
            sub_si++;

            // Solve pressure for this sub-step
            sf_sub = sub_n > 1
              ? { ...sf, _stab_alpha: SOLVER.STAB_ALPHA,
                  _stab_max_iter: SOLVER.STAB_MAX_ITER,
                  _stab_max_dp: SOLVER.STAB_MAX_DP,
                  _stab_tol: SOLVER.STAB_TOL_Q }
              : sf;
            ats_nodeP = solveCoupledPressure(
              depthNodes, si, sf_sub, S, k_eff, divertFac, sub_prevBHP, w
            );

            // ── Recovery: retry with progressively higher BHP warm-start ──
            // Each retry shifts warm-start BHP upward by 200 psi × retry count,
            // exploring different P_wh starting points. The solver's own
            // adaptive logic handles convergence from each starting point.
            if (!ats_nodeP[0].converged) {
              retry = 0;
              bestNodeP_s = ats_nodeP;
              bestRes_s   = ats_nodeP[0].residual ?? 1e9;
              log.push(`  [REC] St${si+1} ts${ts+1}: R_Q=${bestRes_s.toFixed(3)} bpm  R_norm=${((ats_nodeP[0].R_norm||1)*100).toFixed(1)}%`);

              while (retry < SOLVER.ADAPT_MAX_RETRY && !bestNodeP_s[0].converged) {
                retry++;
                bhp_prev_r = bestNodeP_s.map(p => p.bhp);
                // Shift BHP upward by 200 psi per retry: explores higher operating points
                sw2_r    = retry * 200;
                smBHP2_r = bhp_prev_r.map((b2, ii2) =>
                  clamp(b2 + sw2_r, SOLVER.P_MIN, w.fracPres * 1.05)
                );
                sf_r2 = { ...sf_sub, _stab_max_iter: SOLVER.STAB_MAX_ITER + retry * 20 };
                nodeP_r2 = solveCoupledPressure(depthNodes, si, sf_r2, S, k_eff, divertFac, smBHP2_r, w);
                res_r2 = nodeP_r2[0]?.residual ?? 1e9;
                if (res_r2 < bestRes_s || nodeP_r2[0].converged) {
                  bestRes_s   = res_r2;
                  bestNodeP_s = nodeP_r2;
                  conv_hist.adaptRetries++;
                  log.push(`  [REC] retry${retry}: R_Q=${bestRes_s.toFixed(3)} bpm${nodeP_r2[0].converged?" ✓CVG":""}`);
                } else {
                  log.push(`  [REC] retry${retry}: no improvement — keeping best`);
                  break;
                }
              }
              ats_nodeP = bestNodeP_s;
              if (!bestNodeP_s[0].converged)
                log.push(`  [REC] St${si+1} ts${ts+1}: best R_Q=${bestRes_s.toFixed(3)} bpm  R_norm=${((bestNodeP_s[0]?.R_norm||1)*100).toFixed(1)}%`);
            }
            ats_res       = ats_nodeP[0]?.residual ?? 1e9;
            ats_converged = ats_nodeP[0]?.converged ?? false;
            if (!ats_converged && ats_res > SOLVER.ATS_RES_GOOD * 2) {
              ats_all_ok = false;
              break;  // this sub-step failed — will retry with more sub-steps
            }

            // Sub-step passed — update BHP warm-start for next sub-step
            sub_prevBHP = ats_nodeP.map(p => p.bhp);
          }  // end sub_si while

          if (ats_all_ok) {
            sub_pass = true;  // all sub-steps converged acceptably
          } else if (sub_n < SOLVER.ATS_SUB_MAX && ats_attempt === 1) {
            // First attempt failed — sub-divide and retry
            sub_n = Math.min(SOLVER.ATS_SUB_MAX, sub_n * 2);
            log.push(`  [ATS] St${si+1} ts${ts+1}: sub-dividing to ${sub_n} sub-steps (dt=${(dt_ts/sub_n).toFixed(3)} min)`);
            conv_hist.adaptRetries++;
            dt_scale = Math.max(0.25, dt_scale * SOLVER.ATS_SHRINK);
          }
          // If sub_n already at max, accept best result
        }  // end ats_attempt while

        // Use final ats_nodeP as the timestep's pressure solution
        nodeP = ats_nodeP;

        // ── Tier 3: dt growth after stable convergence ────────────────────────
        if (ats_converged && sub_n === 1) {
          stable_run++;
          if (stable_run >= SOLVER.ATS_GROW_AFTER) {
            dt_scale = Math.min(2.0, dt_scale * SOLVER.ATS_GROW_FACTOR);
          }
        } else {
          stable_run = 0;
        }

        // Log ATS outcome (only when interesting)
        if (sub_n > 1) {
          log.push(`  [ATS] St${si+1} ts${ts+1}: ran ${sub_n} sub-steps  R_Q=${(ats_nodeP?.[0]?.R_Q??ats_res).toFixed(3)} R_S=${(ats_nodeP?.[0]?.R_S??0).toFixed(3)} ${ats_converged?"✓CVG":"~partial"}`);
        }

        // Compute J_node here so it's available for diagnostics below
        // AND for volume allocation further down.
        J_node = depthNodes.map((nd, ni) =>
          (nd.hasReservoir && nd.z >= stg.topD - 0.5 && nd.z <= stg.botD + 0.5)
            ? Math.max(0, calcJ(nd, si, S[ni], k_eff[ni], divertFac[ni]))
            : 0
        );

        // ── Track convergence and build intelligent diagnostics ────────────────
        if (nodeP[0] && !nodeP[0].converged) {
          stage_ncvg++;
          if (nodeP[0]?.capacityLimited) {
            log.push(`  [CAP] St${si+1} ts${ts+1}: capacity-limited R_norm=${((nodeP[0].R_norm||1)*100).toFixed(1)}% Q_ach=${(nodeP[0].Q_achievable_bpm||0).toFixed(2)} bpm`);
          } else {
            log.push(`  [NCVG] St${si+1} ts${ts+1}: R_norm=${((nodeP[0].R_norm||1)*100).toFixed(1)}%${(nodeP[0].R_norm||1)>0.50?' [chemistry frozen]':' [chemistry active]'}`);
          }
        }
        if (nodeP[0] && !nodeP[0].converged && (nodeP[0].iters || 0) >= (sf._stab_max_iter || 25)) {
          if (!pressureWarnings.find(pw => pw.stage === si + 1)) {
            // Failure mode from last iterLog entry
            _lastMode = nodeP[0]?.iterLog?.slice(-2,-1)[0]?.mode || 'unknown';

            // ── Per-layer analysis ──────────────────────────────────────────
            // avg_pres_diag: local avg reservoir pressure (Pres_res is inside solveCoupledPressure scope)
            avg_pres_diag = res.length ? res.reduce((s,r)=>s+(+r.pres||0),0)/res.length : 3500;
            kVals   = depthNodes.filter(n=>n.hasReservoir).map(n=>n.interval?.perm||0).filter(v=>v>0);
            kContr  = kVals.length>1 ? (Math.max(...kVals)/Math.min(...kVals)).toFixed(0) : "1";

            // Identify unstable layers: reservoir nodes with near-zero flow
            unstable = depthNodes.map((nd,ni)=>({
              depth:   nd.z?.toFixed(0)+"ft",
              perm:    (nd.interval?.perm||0).toFixed(1),
              pres:    (nd.interval?.pres||0).toFixed(0),
              bhp:     (nodeP[ni]?.bhp||0).toFixed(0),
              qres:    (nodeP[ni]?.qres||0).toFixed(4),
              skin:    (S[ni]||0).toFixed(1),
              J:       (J_node[ni]||0).toFixed(5),
              noFlow:  nd.hasReservoir && (nodeP[ni]?.qres||0) < 1e-4,
              bhpLow:  nd.hasReservoir && (nodeP[ni]?.bhp||0) < (nd.interval?.pres||0),
            })).filter(x=>x.noFlow || x.bhpLow);

            noFlowD = unstable.slice(0,4).map(x=>x.depth).join(", ");

            // ── Root cause classification ───────────────────────────────────
            // rootCause, diagMsg, severity declared in outer hoist
            if (unstable.filter(x=>x.bhpLow).length > 0) {
              severity  = "critical";
              rootCause = "BHP below reservoir pressure";
              diagMsg   = `BHP < P_res in ${unstable.filter(x=>x.bhpLow).length} layer(s) — `+
                          `pump rate ${stg.rate} BPM may be insufficient to overcome ${avg_pres_diag.toFixed(0)} psi reservoir pressure`;
            } else if (unstable.length === depthNodes.filter(n=>n.hasReservoir).length) {
              severity  = "critical";
              rootCause = "Zero injectivity — all layers";
              diagMsg   = `No flow in any layer — BHP never exceeded P_res. `+
                          `Check reservoir pressure (avg ${avg_pres_diag.toFixed(0)} psi) vs BHP.`;
            } else if (+kContr > 100) {
              severity  = "warning";
              rootCause = `Permeability contrast ${kContr}×`;
              diagMsg   = `k-contrast ${kContr}× causing flow instability. `+
                          `High-perm layers dominate; tight layers starved. k range: ${Math.min(...kVals).toFixed(1)}–${Math.max(...kVals).toFixed(1)} md.`;
            } else if (unstable.length > 0) {
              severity  = "warning";
              rootCause = `Partial injectivity failure (${unstable.length} layers)`;
              diagMsg   = `${unstable.length} layer(s) at ${noFlowD} received no flow. `+
                          `High skin or low k prevents BHP from overcoming local resistance.`;
            } else {
              severity  = "info";
              rootCause = "Pressure oscillation";
              diagMsg   = `Solver oscillated for ${nodeP[0].iters} iterations without converging. `+
                          `Q-Residual: ${(nodeP[0].residual??1e9).toFixed(3)} bpm (pump−layer flow). Results are partially converged.`;
            }

            // ── Recommendations ─────────────────────────────────────────────
            recs = [];
            if (+kContr > 50)
              recs.push(`Increase depth grids from ${depthNodes.filter(n=>n.hasReservoir).length} → ${Math.min(200,depthNodes.filter(n=>n.hasReservoir).length*3)} (k-contrast ${kContr}×)`);
            if (unstable.filter(x=>x.bhpLow).length > 0)
              recs.push(`Increase pump rate above ${(stg.rate*1.3).toFixed(1)} BPM to raise BHP above P_res`);
            else
              recs.push(`Reduce pump rate to ${(stg.rate*0.7).toFixed(1)} BPM to reduce friction and stabilise BHP`);
            if (unstable.length > 0)
              recs.push(`Verify P_res for layers at ${noFlowD}`);
            recs.push(`Add Diverter stage before "${stg.name}" to equalise flow distribution`);
            if (+kContr > 20)
              recs.push(`Reduce timestep (current nTS=${nTS_eff}) for better numerical stability`);

            pressureWarnings.push({
              stage:si+1, stageName:stg.name, iters:nodeP[0].iters,
              fluid:fl.name, rate:stg.rate, vol:stg.vol,
              severity, rootCause, diagMsg,
              residual:(nodeP[0].residual??1e9).toFixed(3),
              kContrast:kContr,
              kRange:`${kVals.length?Math.min(...kVals).toFixed(1):"-"}–${kVals.length?Math.max(...kVals).toFixed(1):"-"} md`,
              noFlowLayers:unstable.length,
              noFlowDepths:noFlowD,
              layerDetail:unstable.slice(0,8),   // up to 8 layers for display
              recommendations:recs,
              avgPres:avg_pres_diag.toFixed(0),
              fracPres:(w.fracPres||9999).toFixed(0),
            });

            // Solver log entry with key numbers
            log.push(`  [WARN] St${si+1} "${stg.name}": ${rootCause} | res=${((nodeP[0].residual??1e9)).toFixed(3)} bpm(Q-res) | k-contrast=${kContr}× | noFlow=${unstable.length} layers`);
            recs.forEach(r => log.push(`    ► ${r}`));
          }
        }

        // Incremental volume per node this timestep.
        // Primary: use qres from solver (mass-balance-corrected layer rate).
        // Fallback: if all qres=0 (solver returned zero flow, e.g. BHP never
        // exceeded Pres), distribute total pump volume proportionally by J_node
        // so chemistry always has non-zero dV for reservoir intervals in stage range.
        // (J_node already computed above before diagnostics)
        qres_total = depthNodes.reduce((s, nd, ni) =>
          s + (nd.hasReservoir ? safe(nodeP[ni].qres, 0) : 0), 0
        );
        J_total_ts = J_node.reduce((a, v) => a + v, 0);
        use_fallback = qres_total < 1e-6;   // all solver qres are zero

        // ── STEP 4-5: Normalised volume allocation (strict mass balance) ─────
        // Per specification: q_i_corrected = q_i_raw / q_total_raw × Q_surface
        // Then V_i = q_i_corrected × dt
        // This ensures Σ V_i = Q_surface × dt exactly every timestep.
        //
        // The timestep surface volume = stg.rate [bpm] × dt [min]
        // Capacity-limited case: inject at max achievable rate, not pump rate.
        _Q_achievable = nodeP[0]?.capacityLimited
          ? Math.min(stg.rate, nodeP[0].Q_achievable_bpm || stg.rate)
          : stg.rate;
        V_ts_surface = _Q_achievable * dt_eff;
        if (nodeP[0]?.capacityLimited && ts === 0)
          log.push(`  [CAP] St${si+1}: capacity-limited. Pump=${stg.rate.toFixed(2)} bpm, Achievable=${_Q_achievable.toFixed(2)} bpm (${(100*_Q_achievable/Math.max(0.001,stg.rate)).toFixed(0)}%). Consider reducing rate.`);

        // Compute raw allocation weights for reservoir nodes in this stage range
        raw_weights = depthNodes.map((nd, ni) => {
          if (!nd.hasReservoir) return 0;
          // Depth gate: node must be within stage injection interval.
          // Use 0.5ft tolerance to handle floating-point edge cases at layer boundaries.
          if (nd.z < stg.topD - 0.5 || nd.z > stg.botD + 0.5) return 0;
          if (!use_fallback) {
            return Math.max(0, safe(nodeP[ni].qres, 0));  // raw solver qres [bpm]
          } else {
            return J_total_ts > 0 ? J_node[ni] / J_total_ts
              : 1 / Math.max(1, depthNodes.filter(n => n.hasReservoir && n.z >= stg.topD && n.z <= stg.botD).length);
          }
        });

        // Total raw weight (sum of all node contributions)
        raw_total = raw_weights.reduce((a, v) => a + v, 0);

        // Normalise: each node gets fraction × V_ts_surface
        // If raw_total = 0 (no injectivity), distribute equally among active nodes
        // Count active nodes (those with non-zero weight)
        active_nodes = depthNodes.filter((nd,ni) => nd.hasReservoir &&
          nd.z >= stg.topD - 0.5 && nd.z <= stg.botD + 0.5);
        active_count = active_nodes.length || depthNodes.filter(nd=>nd.hasReservoir).length || 1;
        dV_ts = raw_weights.map((w_i, ni) => {
          if (raw_total > 1e-10) {
            // Normal path: weight proportional to Qres or J
            return w_i > 0 ? (w_i / raw_total) * V_ts_surface : 0;
          } else {
            // Zero-total fallback: equal split among ALL reservoir nodes in range
            nd = depthNodes[ni];
            if (!nd.hasReservoir) return 0;
            if (nd.z < stg.topD - 0.5 || nd.z > stg.botD + 0.5) return 0;
            return V_ts_surface / active_count;
          }
        });

        // ── STEP 7: Verify conservation (development assertion) ──────────────
        // Σ dV_ts must equal V_ts_surface within floating-point tolerance
        // const dV_check = dV_ts.reduce((a,b)=>a+b,0);
        // if (Math.abs(dV_check - V_ts_surface) > 0.01) log.push(`[WARN] ts vol ${dV_check.toFixed(3)} != ${V_ts_surface.toFixed(3)}`);

        // Fracture detection
        bhp_ts = nodeP.reduce((mx, p) => Math.max(mx, p.bhp), 0);
        if (bhp_ts >= w.fracPres && !anyFracture) {
          anyFracture = true;
          fracEvents.push({ t: t_global, stage: stg.name, bhp: bhp_ts, fracPres: w.fracPres });
          log.push(`  [FRAC] t=${t_global.toFixed(1)} bhp=${bhp_ts.toFixed(0)}`);
        }

        // ── LOOP 3: Depth Node — iterates ni = 0 … nN-1 every timestep ────────
        // For EVERY timestep ts, ALL nN depth nodes are processed.
        // ni advances from 0 to nN-1 before ts increments.
        for (let ni = 0; ni < nN; ni++) {
          nd_ni = depthNodes[ni];
          // Pressure state: store converged BHP/TP for this node at this ts
          nodeState[ni].presField = { bhp: nodeP[ni].bhp, tp: nodeP[ni].tp };

          // ── Volume this timestep ─────────────────────────────────────────
          // dV_ts[ni] = (Qres[ni]/Qres_total) × Q_pump × dt  [bbl]
          // Already mass-balance-corrected so Σ dV_ts = Q_pump × dt exactly.
          dV_ni = safe(dV_ts[ni], 0);
          dV_stage[ni]    += dV_ni;
          V_total_cum[ni] += dV_ni;

          // ── Qres for this node this timestep [bbl/min] ──────────────────
          // Primary: use nodeP[ni].qres = J[i] × (P_wb[i]-P_res[i]) / 1440
          //          directly from the iterative pressure solver.
          // Fallback: when solver qres=0 (use_fallback path), derive from
          //           J-weighted allocation: Qres[i] = (J[i]/J_total) × Q_pump
          if (nd_ni.hasReservoir) {
            q_solver = safe(nodeP[ni].qres, 0);  // J×drawdown/1440 [bbl/min]
            if (q_solver > 0) {
              Qres_node[ni] = q_solver;   // direct solver value (primary)
            } else if (J_total_ts > 0 && J_node[ni] > 0) {
              // Fallback: proportional by injectivity
              Qres_node[ni] = (J_node[ni] / J_total_ts) * stg.rate;   // [bbl/min]
            } else if (dt > 0 && dV_ni > 0) {
              Qres_node[ni] = dV_ni / dt;   // last resort: volume/time
            }
            // else: Qres_node[ni] stays 0 (non-reservoir or truly no flow)
          }
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
      // Pre-count nodes per interval (needed for h_eff in calcChemistry)
      _ivNodeCount = {};
      depthNodes.forEach((nd_c, ni_c) => {
        if (!nd_c.hasReservoir) return;
        key_c = nd_c.interval.top + '_' + nd_c.interval.bot;
        _ivNodeCount[key_c] = (_ivNodeCount[key_c]||0)+1;
      });
      for (let ni = 0; ni < nN; ni++) {
        nd  = depthNodes[ni];
        dV  = dV_stage[ni];                  // total stage volume for this node
        dur = stg.dur;                        // total stage duration

        // Diverter: only applies to reservoir-connected nodes
        if (fl.isDiverter && dV > 0 && nd.hasReservoir) {
          V_div_cum[ni] += dV;
          divertFac[ni]  = clamp(
            safeDiv(V_div_cum[ni] * 0.5, 1 + V_div_cum[ni] * 0.5), 0, 0.92
          );
          // divCoverage [0..1]: cumulative coverage from diverter
          // More diverter → higher coverage → bypass boost in next acid stage
          nd_ref = depthNodes[ni];
          h_por  = Math.max(0.01, nd_ref.interval.h * nd_ref.interval.por);
          nd_ref.divCoverage = clamp(safeDiv(V_div_cum[ni] * C.bbl_ft3, h_por * 0.5), 0, 1);
        }

        // Track injected volume for ALL non-diverter fluids (display/concentration)
        // V_acid_cum = total fluid placed in this node [bbl], all stages
        if (!fl.isDiverter && dV > 0 && nd.hasReservoir) {
          V_acid_cum[ni]  += dV;
          if (fl.isPreflush)   V_pre_cum[ni]  += dV;
          if (fl.isMainAcid)   V_main_cum[ni] += dV;
          if (fl.isOverflush)  V_over_cum[ni] += dV;
        }

        // ── SKIN REMOVAL · PI GAIN · PENETRATION ────────────────────────────
        // ONLY main-acid stages (cat = "Main Acid" or "Sandstone") contribute.
        // Preflush, Overflush, Brine, Solvent → no skin change, no PI gain.
        // This isolates the productive acid effect from conditioning fluids.
        // Hard gate: ONLY reactive main-acid stages modify skin, k, PI, penetration.
        // NH4Cl/brine/overflush/KCl → isMainAcid=false OR rxRate=0 → skip entirely.
        // Also gate on: fl.isReactive (belt-and-suspenders for all non-acid fluids).
        // Chemistry gate: ALL THREE conditions required.
        // freezeChemistry=true when R_norm>1% — prevents fake stimulation from bad hydraulics.
        // Capacity-limited = physics limit (pump > frac capacity), NOT a solver failure.
        // Acid that DID enter the formation (Q_achievable fraction) must react.
        // Only freeze when solver truly collapses (R_norm > 50%, not capacity-limited).
        _isReactiveFluid = fl.isMainAcid
                         && (fl.rxRate || 0) >= SOLVER.WATER_RXN_THRESH
                         && (fl.isReactive !== false)
                         && !(nodeP[0]?.freezeChemistry && !nodeP[0]?.capacityLimited);
        if (_isReactiveFluid && dV > 0 && nd.hasReservoir) {
          V_main_acid_cum[ni] += dV;
          T_main_acid_cum[ni] += dur;   // accumulate total main-injection duration [min]

          // Pass current acid concentration (depleted by previous timesteps)
          // C_acid[ni] starts at fl.conc and depletes each timestep via ch.C_new
          C_curr = Math.max(0, safe(C_acid[ni], fl.conc));
          _ivKey = nd.interval.top + '_' + nd.interval.bot;
          ch = calcChemistry(
            nd, si, fl, S[ni], k_eff[ni],
            nd.interval.perm, por_curr[ni],
            Math.max(w.wbR_ft, r_pen[ni]), dV, dur, C_curr,
            _ivNodeCount[_ivKey] || 1
          );
          C_acid[ni] = ch.C_new;   // update depleted concentration for next timestep

          // ══════════════════════════════════════════════════════════════════════
          // UNIFORM DAMPING: X_new = X_old + α × (X_calc − X_old) for ALL variables.
          // Engineering inputs (k_init, S_init, pres, rate, conc) are NEVER modified.
          // Only computed/state variables (k_eff, S, por, wh_boost, C_acid) are damped.
          // ══════════════════════════════════════════════════════════════════════

          // ── [1] Permeability (k) ─────────────────────────────────────────────
          // ch.k_new = k_eff × k_enh (direct multiplication, no internal relaxation).
          // Apply per-stage growth cap (K_STEP_MAX) and absolute cap (K_ABS_MAX).
          // Under-relaxation (ALPHA_K_STAGE) smooths the update across stages.
          k_max_step = Math.min(
            k_eff[ni] * SOLVER.K_STEP_MAX,           // max 30% growth per stage
            nd.interval.perm * SOLVER.K_ABS_MAX       // absolute ceiling 8× initial
          );
          k_eff[ni] = clamp(
            k_eff[ni] + SOLVER.ALPHA_K_STAGE * (ch.k_new - k_eff[ni]),
            k_eff[ni],       // k can only grow (wormholes dissolve, not compact)
            k_max_step
          );

          // ── [2] Porosity ──────────────────────────────────────────────────────
          // por_new = por_old + α_por × (por_calc − por_old)
          // α_por = ALPHA_POR = 0.40  (gradual pore structure change)
          por_curr[ni] = por_curr[ni] + SOLVER.ALPHA_POR * (ch.por_out - por_curr[ni]);

          // ── [3] Acid concentration ────────────────────────────────────────────
          // Direct update — concentration depletes monotonically; no relaxation needed.
          // C_acid tracks how spent the acid is; damping here would under-spend it.
          C_acid[ni] = ch.C_new;

          // ── [4] Wormhole boost (penetration surrogate) ───────────────────────
          // wh_new = wh_old + α_WH × (wh_calc − wh_old)
          // α_WH = ALPHA_WH = 0.25  (wormhole geometry evolves slowly)
          nodeState[ni].wormholeBoost = nodeState[ni].wormholeBoost > 0
            ? nodeState[ni].wormholeBoost + SOLVER.ALPHA_WH * (ch.wh_boost - nodeState[ni].wormholeBoost)
            : ch.wh_boost;

          // ── [5] Skin ──────────────────────────────────────────────────────────
          nodeState[ni].S_stage_bef = S[ni];   // save start-of-stage skin for grid log
          S[ni] = clamp(ch.S_new, SOLVER.SKIN_PHYSICAL_MIN, S_init[ni]);

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
          Qres_bpm    = Math.max(0, safeDiv(dV, dur));               // [bbl/min] ≡ bpm for this node
          T_total_min = T_main_acid_cum[ni];                         // total main-acid duration [min]
          V_pen_bbl   = Math.max(0, Qres_bpm * T_total_min);        // penetration volume [bbl]
          h_nd        = Math.max(0.5, nd.interval.h);                 // interval thickness [ft]
          phi_nd      = Math.max(0.01, nd.interval.por);              // porosity [fraction]
          r_old       = Math.max(w.wbR_ft, r_pen[ni]);
          // Radial penetration from volume balance
          r_sq_new    = r_old * r_old
            + safe(V_pen_bbl * C.bbl_ft3 / (Math.PI * h_nd * phi_nd));
          r_pen_new   = clamp(
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
          // PI_final from CAPPED k_eff and CAPPED S — not ch.PI (uses raw uncapped k_new)
          {
            nd_ref   = depthNodes[ni];
            mu_f2 = nd_ref.viscLUT?.[si] || 1.2;
            S_f2  = clamp(S[ni], -8, 200);
            d_f2  = Math.max(0.01, (nd_ref.lnR || 1) + S_f2);
            nodeState[ni].PI_final = safeDiv(k_eff[ni] * nd_ref.interval.h, 141.2 * mu_f2 * d_f2);
          }
          nodeState[ni].FE_final      = ch.FE;
          nodeState[ni].k_eff_final   = k_eff[ni];
          nodeState[ni].bypassFrac    = ch.bypass;
        }

        // Save stage-start skin for ALL nodes (reactive and inert)
        // so grid log shows the correct S_bef regardless of stage type
        if (nodeState[ni].S_stage_bef === undefined) {
          nodeState[ni].S_stage_bef = S_stage_start[ni] !== undefined ? S_stage_start[ni] : S[ni];
        }

        // ── ACID PLACEMENT — total main-acid volume this layer ───────────────
        nodeState[ni].V_acid          = V_acid_cum[ni];           // non-diverter fluid [bbl]
        nodeState[ni].V_main_acid     = V_main_acid_cum[ni];      // main-acid only [bbl]
        nodeState[ni].V_total         = V_total_cum[ni];
        nodeState[ni].V_pre           = V_pre_cum[ni];
        nodeState[ni].V_main          = V_main_cum[ni];
        nodeState[ni].V_over          = V_over_cum[ni];
        nodeState[ni].T_main_acid     = T_main_acid_cum[ni];      // main-injection duration [min]
        // Qres: last timestep value from solver [bbl/min = bpm]
        // This is the iteratively-solved per-layer flow rate at end of treatment
        nodeState[ni].qres_solver     = Math.max(0, Qres_node[ni]);
        // Store BHP during main acid injection for depth-varying P_wb display
        if (fl.isMainAcid && nodeState[ni].presField && nodeState[ni].presField.bhp > 0) {
          nodeState[ni].bhp_main = nodeState[ni].presField.bhp;
        }
        if (fl.rxRate >= SOLVER.WATER_RXN_THRESH) {
          nodeState[ni].isReactiveStage = true;
        } else {
          // Nonreactive stage: explicitly zero out any residual acid effect fields
          // so they don't carry forward from a previous reactive stage.
          nodeState[ni].Da            = 0;
          nodeState[ni].etaRxn        = 0;
          nodeState[ni].wormholeBoost = 1.0;
          nodeState[ni].bypassFrac    = 0;
          nodeState[ni].C_acid_final  = 0;
          nodeState[ni].regime        = 'none';
        }
        // Store main-injection fluid properties (temperature-corrected) for results table
        if (fl.isMainAcid && nd.hasReservoir) {
          nodeState[ni].fluid_density = +(fl.ppg * 7.48052).toFixed(3);        // lbs/ft³ → display as ppg
          nodeState[ni].fluid_density_ppg = +fl.ppg.toFixed(3);
          nodeState[ni].fluid_visc    = +safe(nd.viscLUT[si], fl.visc0).toFixed(3);  // cp at layer T
          nodeState[ni].fluid_rxRate  = +safe(nd.kRxnLUT[si], fl.rxRate).toFixed(4); // 1/s at layer T
          nodeState[ni].fluid_T_F     = +nd.T_F.toFixed(1);                    // layer temperature °F
        }
        nodeState[ni].placed          = V_main_acid_cum[ni] > 0
                                        && r_pen[ni] > w.wbR_ft
                                        && nd.hasReservoir;
      }  // ── chemistry pass complete for all nN nodes ────────────────────────

      cumTime += stg.dur;
      V_main_layer_sum = fl.isMainAcid
        ? depthNodes.reduce((s, _, ni) => s + safe(V_main_acid_cum[ni]), 0)
        : 0;
      V_conservation_err = fl.isMainAcid
        ? Math.abs(V_main_layer_sum - stg.vol) / Math.max(0.001, stg.vol) * 100
        : 0;
      // Log Qres for first reservoir node (diagnostic)
      firstResNode = depthNodes.findIndex(nd => nd.hasReservoir);
      if (firstResNode >= 0) {
        log.push(
          `  Stage ${si+1} node[${firstResNode}] Qres=${Qres_node[firstResNode].toFixed(5)} bbl/min` +
          `  V_stage=${dV_stage[firstResNode].toFixed(4)} bbl` +
          `  V_total=${V_total_cum[firstResNode].toFixed(4)} bbl`
        );
      }
      // Post-stage: log convergence quality and issue guidance if poor
      cvg_pct = Math.round((1 - stage_ncvg / Math.max(1, nTS_eff)) * 100);
      if (stage_ncvg > 0) {
        log.push(`  [CONV] Stage ${si+1}: ${cvg_pct}% timesteps converged (${nTS_eff - stage_ncvg}/${nTS_eff}). Note: residual is Q-balance in bpm, not pressure.`);
        if (cvg_pct < 50) {
          log.push(`  [STAB_REC] Recommend: increase Depth Grids, verify P_res and pump rate for "${stg.name}"`);
        }
      }
      log.push(
        `  Stage ${si+1} done: surfaceVol=${stg.vol.toFixed(2)} bbl` +
        `  layerSum=${cumVolStage.toFixed(2)} bbl` +
        (fl.isMainAcid ? `  mainAcidLayers=${V_main_layer_sum.toFixed(2)} bbl  conservErr=${V_conservation_err.toFixed(2)}%` : '') +
        `  t=${cumTime.toFixed(1)} min  cvg=${cvg_pct}%` +
        (fl.isMainAcid && V_main_layer_sum > 0 ? `  acid_placed=${V_main_layer_sum.toFixed(2)} bbl` : '') +
        (fl.isMainAcid ? `  ΔS_avg=${(depthNodes.filter(n=>n.hasReservoir).reduce((s,nd,ni)=>s+(S_init[ni]-S[ni]),0)/Math.max(1,depthNodes.filter(n=>n.hasReservoir).length)).toFixed(3)}  k_avg=${(depthNodes.filter(n=>n.hasReservoir).reduce((s,nd,ni)=>s+k_eff[ni],0)/Math.max(1,depthNodes.filter(n=>n.hasReservoir).length)).toFixed(1)} md` : '')
      );

      // ── Grid-wise output: one line per reservoir node ─────────────────────
      _rxR = fl.rxRate || 0;
      _isRx = _rxR >= SOLVER.WATER_RXN_THRESH;
      log.push(`  --- Grid stage ${si+1} [${fl.name}] rxRate=${_rxR.toFixed(3)} reactive=${_isRx} ---`);
      log.push(`  ${"Depth".padEnd(6)} ${"k(md)".padEnd(8)} ${"S_bef".padEnd(6)} ${"S_aft".padEnd(6)} ${"dV(bbl)".padEnd(8)} ${"Da".padEnd(6)} ${"eta".padEnd(6)} ${"k_aft".padEnd(8)} ${"PI_b".padEnd(7)} ${"PI_a".padEnd(7)} Flag`);
      for (let _ni = 0; _ni < nN; _ni++) {
        _nd = depthNodes[_ni];
        if (!_nd.hasReservoir) continue;
        _ns = nodeState[_ni];
        _dV = dV_stage[_ni];
        // S_bef: skin at start of THIS stage.
        // Use nodeState.S_stage_bef (saved just before S[ni] was updated this stage),
        // falling back to S_stage_start snapshot.
        _sb = (_ns.S_stage_bef !== undefined) ? _ns.S_stage_bef
            : (S_stage_start ? S_stage_start[_ni] : S_init[_ni]);
        _sa = S[_ni];               // skin at END of this stage
        _kb = k_stage_start ? k_stage_start[_ni] : _nd.interval.perm;
        _ka = k_eff[_ni];
        // PI_bef and PI_aft: always recompute from actual k/S at start/end of THIS stage.
        // Never read from cached nodeState.PI_final — that holds the acid-stage value
        // and would make inert stages (overflush, preflush) show a false PI change.
        {
          _mu_s = _nd.viscLUT?.[si] || 1.2;
          _lnR_s = Math.max(0.01, _nd.lnR);
          _denom_min = Math.max(0.01, _lnR_s * SOLVER.DENOM_MIN_MULT);
          _d_s  = Math.max(_denom_min, _lnR_s + clamp(_sb, -8, 200));
          _pb   = safeDiv(_kb * _nd.interval.h, 141.2 * _mu_s * _d_s);
          // PI_aft: same formula, end-of-stage k and S
          _d_a = Math.max(_denom_min, _lnR_s + clamp(_sa, -8, 200));
          _pa   = safeDiv(_ka * _nd.interval.h, 141.2 * _mu_s * _d_a);
        }
        _flags = [];
        if (_sa < SOLVER.SKIN_PHYSICAL_MIN)                 _flags.push("SKN_LOW");
        if (_pb > 0 && _pa/_pb > SOLVER.PI_RATIO_MAX)       _flags.push("PI_SPIKE");
        if (!_isRx && _sa < _sb * 0.95)                     _flags.push("NONREACT_SKN!");
        if (!_isRx && _ka > _kb * 1.02)                     _flags.push("NONREACT_K!");
        if (_dV < 1e-6 && _nd.hasReservoir)                 _flags.push("NO_FLOW");
        _f = _flags.length ? "["+_flags.join(",")+"]" : "OK";
        _pfx = _flags.some(f=>f.includes("!")) ? "[!]" : "   ";
        log.push(
          `${_pfx} ${String(_nd.z.toFixed(0)).padEnd(6)}` +
          ` ${String(_kb.toFixed(1)).padEnd(8)}` +
          ` ${String(_sb.toFixed(2)).padEnd(6)}` +
          ` ${String(_sa.toFixed(2)).padEnd(6)}` +
          ` ${String(_dV.toFixed(3)).padEnd(8)}` +
          ` ${String((_ns.Da||0).toFixed(3)).padEnd(6)}` +
          ` ${String((_ns.etaRxn||0).toFixed(3)).padEnd(6)}` +
          ` ${String(_ka.toFixed(1)).padEnd(8)}` +
          ` ${String(_pb.toFixed(4)).padEnd(7)}` +
          ` ${String(_pa.toFixed(4)).padEnd(7)}` +
          ` ${_f}`
        );
      }
      log.push(`  --- End grid stage ${si+1} ---`);

      // Per-node summary for this stage
      nodeStageData = depthNodes.map((nd, ni) => {
        // Skip non-reservoir and gap nodes
        if (!nd.hasReservoir) return null;
        if (!nd.interval || nd.interval.perm <= 0) return null;
        v_stage = dV_stage[ni];                    // volume to this node this stage [bbl]
        q_avg   = stg.dur > 0 ? safeDiv(v_stage, stg.dur) : 0;   // avg Qres [bbl/min]
        // qres_last: solver value (J×drawdown/1440). If zero, derive from V/dur.
        qres_last_raw = Qres_node[ni];
        qres_last_val = qres_last_raw > 0
          ? qres_last_raw
          : (stg.dur > 0 ? safeDiv(v_stage, stg.dur) : 0);  // fallback: avg from accumulated vol
        // vol_stage: Σ(Qres×dt) — exact accumulated volume from all timesteps
        // vol_check: qres_last × dur — user verification formula
        vol_check = qres_last_val * stg.dur;
        return {
          z:          +nd.z.toFixed(1),
          top:        +nd.interval.top.toFixed(1),
          bot:        +nd.interval.bot.toFixed(1),
          perm:       +Math.max(0, nd.interval.perm||0).toFixed(3),
          vol_stage:  +v_stage.toFixed(4),       // Σ(Qres×dt) exact [bbl]
          vol_exact:  +v_stage.toFixed(4),       // alias for vol_stage
          vol_check:  +vol_check.toFixed(4),      // qres_last × dur [bbl] (user formula)
          qres_avg:   +q_avg.toFixed(5),          // avg = vol/dur [bbl/min]
          qres_last:  +qres_last_val.toFixed(5),  // last-TS Qres [bbl/min]
          // Volumetric radial penetration for this stage [inches beyond wellbore wall]
          // net_pen = (sqrt(r_wb² + V×5.615/(π×h×φ)) − r_wb) × 12
          // nd.interval.por is already a fraction (converted by convertUnits)
          // nd.interval.h is in feet
          pen_stage:  +(()=>{
            if (v_stage <= 0) return 0;
            h_s   = Math.max(0.5, +nd.interval.h || Math.max(0.5, +nd.interval.bot - +nd.interval.top) || 50);
            por_s = Math.max(0.005, +nd.interval.por);  // already fraction 0.01–0.5
            rwb   = 0.0304;  // typical wellbore radius [ft]
            r_tot = Math.sqrt(rwb*rwb + v_stage * 5.61458 / (Math.PI * h_s * por_s));
            return Math.max(0, r_tot - rwb) * 12;
          })().toFixed(2),
          V_total:    +V_total_cum[ni].toFixed(4),
          // Cumulative penetration front at end of this stage (all fluid so far)
          pen_cumul:  +(()=>{
            if (V_total_cum[ni] <= 0) return 0;
            hc   = Math.max(0.5, nd.interval.h || 50);
            pc   = Math.max(0.005, nd.interval.por);
            rw2  = 0.0304;
            rt2  = Math.sqrt(rw2*rw2 + V_total_cum[ni] * 5.61458 / (Math.PI * hc * pc));
            return Math.max(0, rt2 - rw2) * 12;
          })().toFixed(2),
        };
      }).filter(Boolean);

      // Total Qres for this stage = sum of all reservoir node avg Qres
      totalQresStage = nodeStageData.reduce((s, n) => s + n.qres_avg, 0);

      stageResults.push({
        stageNum:     si + 1,
        stageName:    stg.stageName || stg.name || `Stage ${si+1}`,
        fluidName:    stg.fluid.name || '—',
        isMainAcid:   !!stg.fluid.isMainAcid,
        rate_bpm:     +stg.rate.toFixed(3),
        vol_bbl:      +stg.vol.toFixed(2),
        dur_min:      +stg.dur.toFixed(2),
        volInjected:  +cumVolStage.toFixed(4),   // total to all layers this stage [bbl]
        qres_total:   +totalQresStage.toFixed(5),// sum of layer Qres [bbl/min]
        conservErr:   +V_conservation_err.toFixed(2),
        nodeData:     nodeStageData,             // per-node breakdown for this stage
      });
    }  // ── end LOOP 1 (stage si) — all stages complete ──────────────────────

    // ── OUTPUT AGGREGATION — always runs, even if wall_aborted or non-convergent
    // nodeState contains the best available results for each node processed so far.
    // Nodes not yet reached by the solver retain their initial values (skin=S_init, placed=false).
    if (wall_aborted) {
      log.push(`[OUTPUT] Simulation aborted early — returning best available results`);
    } else {
      log.push(`[OUTPUT] All stages complete — aggregating results`);
    }
    // ══════════════════════════════════════════════════════════════════════════
    // PRE-VALIDATION: Enforce zero-change for nonreactive nodes.
    // Any node that never received main-acid (V_main_acid_cum == 0) must have:
    //   k_eff = k_init, S = S_init, r_pen = wbR, wormholeBoost = 1, PI = PI_init.
    // This is the unconditional guarantee — even if any upstream logic leaked
    // a small change, this pass corrects it before results are aggregated.
    // ══════════════════════════════════════════════════════════════════════════
    for (let ni = 0; ni < nN; ni++) {
      if (!depthNodes[ni].hasReservoir) continue;
      if (V_main_acid_cum[ni] > 0) continue;   // had acid — skip
      // No acid ever reached this node — restore all chemistry-derived state
      k_eff[ni]                       = depthNodes[ni].interval.perm;  // k = k_init
      S[ni]                           = S_init[ni];                    // S = S_init
      r_pen[ni]                       = w.wbR_ft;                      // r_pen = wellbore wall
      por_curr[ni]                    = depthNodes[ni].interval.por;   // porosity unchanged
      nodeState[ni].wormholeBoost     = 1.0;   // no wormhole growth
      nodeState[ni].S_final           = S_init[ni];
      nodeState[ni].k_eff_final       = depthNodes[ni].interval.perm;
      nodeState[ni].r_pen_in          = 0;
      nodeState[ni].bypassFrac        = 0;
      nodeState[ni].etaRxn            = 0;
      nodeState[ni].Da                = 0;
      nodeState[ni].C_acid_final      = 0;
      nodeState[ni].regime            = 'none';
      // PI_final = PI_init (recalculate to be safe — uses k_init and S_init)
      {
        mu_nr   = depthNodes[ni].viscLUT?.[sched.length-1] || 1.2;
        S_nr    = clamp(S_init[ni], -8, 200);
        denom_nr = Math.max(0.01, (depthNodes[ni].lnR||1) + S_nr);
        nodeState[ni].PI_final = safeDiv(
          depthNodes[ni].interval.perm * depthNodes[ni].interval.h,
          141.2 * mu_nr * denom_nr
        );
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LAYER 3: Physics Validation — validate nodeState before final aggregation
    // ══════════════════════════════════════════════════════════════════════════
    let sqi = 100;
    const physViolations = [];
    // SQI downgrade: fraction of non-converged timesteps
    const _ncvgTotal = stageResults.reduce((s,sr) => s + (sr.nTS||1), 0) || 1;
    const _ncvgFailed = pressureWarnings.length;
    const _ncvgFrac  = _ncvgFailed / Math.max(1, sched.length);
    if (_ncvgFrac > 0.5) {
      sqi -= 25;
      physViolations.push({ type:'CONV_POOR', value:(_ncvgFrac*100).toFixed(0)+'% stages',
        msg:`${(_ncvgFrac*100).toFixed(0)}% of stages had non-converged timesteps. Chemistry frozen for failed steps. Reduce pump rate or increase depth grids.` });
    } else if (_ncvgFrac > 0.1) {
      sqi -= 10;
    }

    let ns_pv, piRatio, mu_f, S_f, denom, k_f;  // hoisted for JSC TDZ safety
    for (let ni = 0; ni < nN; ni++) {
      nd = depthNodes[ni];
      if (!nd.hasReservoir) continue;
      ns_pv = nodeState[ni];

      // ── V1: Skin below physical minimum ─────────────────────────────────────
      // Matrix acid treatment cannot produce skin more negative than -0.5
      // (that requires hydraulic fracturing). Flag and correct.
      if (ns_pv.S_final < SOLVER.SKIN_PHYSICAL_MIN) {
        physViolations.push({ type:'SKIN_FLOOR', depth:(+nd.z).toFixed(0),
          value:ns_pv.S_final.toFixed(2),
          msg:`Skin ${ns_pv.S_final.toFixed(2)} < floor ${SOLVER.SKIN_PHYSICAL_MIN} — corrected` });
        ns_pv.S_final = SOLVER.SKIN_PHYSICAL_MIN;
        sqi -= 5;
      }

      // ── V2: Unrealistic PI improvement ───────────────────────────────────────
      // PI_RATIO_MAX = 8× (matrix acid realistic upper bound, field data).
      // PI above this is a numerical artifact from convergence failure.
      if (ns_pv.PI_init > 0 && ns_pv.PI_final > 0) {
        piRatio = ns_pv.PI_final / ns_pv.PI_init;
        if (piRatio > SOLVER.PI_RATIO_MAX) {
          physViolations.push({ type:'PI_SPIKE', depth:(+nd.z).toFixed(0),
            value:piRatio.toFixed(1)+"x",
            msg:`PI ${piRatio.toFixed(1)}x exceeds realistic matrix max (${SOLVER.PI_RATIO_MAX}x) — capped` });
          ns_pv.PI_final    = ns_pv.PI_init * SOLVER.PI_RATIO_MAX;
          ns_pv.k_eff_final = Math.min(ns_pv.k_eff_final, nd.interval.perm * SOLVER.PI_RATIO_MAX);
          sqi -= 8;
        }
      }

      // ── V3: Excessive permeability growth ────────────────────────────────────
      // k_eff > K_ABS_MAX × k_init is always nonphysical for matrix acid.
      // (Hydraulic fracturing can create infinite-conductivity, but matrix cannot.)
      if (nd.interval.perm > 0 && ns_pv.k_eff_final > nd.interval.perm * SOLVER.K_ABS_MAX) {
        physViolations.push({ type:'K_GROWTH', depth:(+nd.z).toFixed(0),
          value:(ns_pv.k_eff_final/nd.interval.perm).toFixed(1)+"x",
          msg:`k_eff ${(ns_pv.k_eff_final/nd.interval.perm).toFixed(1)}x initial perm exceeds ${SOLVER.K_ABS_MAX}x cap — corrected` });
        ns_pv.k_eff_final = nd.interval.perm * SOLVER.K_ABS_MAX;
        sqi -= 6;
      }

      // ── V4: PI consistent with skin and k — only for acid-contacted nodes ──────
      // Non-acid nodes already have PI_final = PI_init from pre-validation pass above.
      // Only recalculate for nodes that received acid (V_main_acid_cum > 0).
      if (V_main_acid_cum[ni] > 0) {
        mu_f  = nd.viscLUT?.[sched.length-1] || 1.2;
        S_f   = clamp(ns_pv.S_final, -8, 200);
        denom = Math.max(0.01, (nd.lnR || 1) + S_f);
        k_f   = Math.max(nd.interval.perm, ns_pv.k_eff_final || nd.interval.perm);
        ns_pv.PI_final = safeDiv(k_f * nd.interval.h, 141.2 * mu_f * denom);
      }

      // Final PI ratio check after recalculation
      if (ns_pv.PI_init > 0) {
        piRatio = ns_pv.PI_final / ns_pv.PI_init;
        if (piRatio > SOLVER.PI_CONV_MAX) {
          ns_pv.PI_final = ns_pv.PI_init * SOLVER.PI_CONV_MAX;
          physViolations.push({ type:'PI_CONV', depth:(+nd.z).toFixed(0),
            value:piRatio.toFixed(1)+"x",
            msg:`Recalculated PI ${piRatio.toFixed(1)}x still high — hard-capped at ${SOLVER.PI_CONV_MAX}x` });
          sqi -= 4;
        }
      }
    }

    // Deduct SQI for convergence issues
    sqi -= Math.min(20, pressureWarnings.length * 5);
    if (conv_hist.massBalanceErr > 5)  sqi -= 10;
    if (conv_hist.adaptRetries > 3)    sqi -= 5;
    sqi = Math.max(0, Math.min(100, Math.round(sqi)));
    conv_hist.sqi = sqi;
    conv_hist.nonPhysicalFlags = physViolations;
    let sqiLabel = sqi >= 90 ? "Excellent" : sqi >= 75 ? "Acceptable"
                   : sqi >= 50 ? "Reduced Accuracy" : "Unstable/Nonphysical";
    if (physViolations.length > 0) {
      log.push(`[PHYSICS] SQI=${sqi} (${sqiLabel}) — ${physViolations.length} violation(s) auto-corrected:`);
      physViolations.forEach((v,i) => log.push(`  [${i+1}] ${v.type} @ ${v.depth}ft: ${v.msg}`));
      if (sqi < 50) log.push(`  ► Results may be unreliable — verify P_res, skin, and fluid rxRate`);
    } else {
      log.push(`[PHYSICS] SQI=${sqi} (${sqiLabel}) — all results within physical bounds`);
    }

    const depthResults = _aggregate(res, nodeState, w);
    const placed    = depthResults.filter(r => r.placed);
    const avgSkinB  = safeDiv(depthResults.reduce((s, r) => s + r.skinB, 0), depthResults.length);
    const avgSkinA  = safeDiv(depthResults.reduce((s, r) => s + r.skinA, 0), depthResults.length);
    const avgPIB    = safeDiv(depthResults.reduce((s, r) => s + r.pi_b,  0), depthResults.length);
    const avgPIA    = safeDiv(depthResults.reduce((s, r) => s + r.pi_a,  0), depthResults.length);
    // s.vol stored in Gallons — sum gives totalAcidVol in Gallons
    // totalAcidVol = MAIN INJECTION stage volumes only [Gallons]
    // "Main Injection" = stage name is "Main Injection" OR fluid cat = "Main Acid"
    // This must equal Σ V_acid across all layers (mass conservation for acid).
    const totalAcid = schedRows
      .filter(s => {
        if ((s.stage||s.name||"").toLowerCase().includes("main")) return true;
        const fl_ag = fluidLib.find(x => x.name === s.fluid);
        return fl_ag && (fl_ag.cat === "Main Acid" || +fl_ag.rxRate > 0);
      })
      .reduce((s, r) => s + (+r.vol || 0), 0);  // [Gallons, main injection only]

    const summary = {
      avgSkinB:  +avgSkinB.toFixed(2),   avgSkinA:  +avgSkinA.toFixed(2),
      skinReduction: +(100 * safeDiv(avgSkinB - avgSkinA, Math.max(0.01, avgSkinB))).toFixed(1),
      avgPIB:    +avgPIB.toFixed(3),      avgPIA:    +avgPIA.toFixed(3),
      piRatio:   +safeDiv(avgPIA, Math.max(0.001, avgPIB)).toFixed(2),
      placedCount: placed.length,         totalIntervals: depthResults.length,
      placementPct: +(safeDiv(placed.length, Math.max(1, depthResults.length)) * 100).toFixed(1),
      totalAcidVol: +totalAcid.toFixed(0),   // main injection stages only [Gal]
      totalInjVol:  +schedRows.reduce((s,r)=>s+(+r.vol||0),0).toFixed(0),  // ALL stages [Gal]
      anyFracture, fracEvents,
      simTimeSec: ((Date.now() - ts_start) / 1000).toFixed(2),
      convStats: { pressureIter: sched.length, skinIter: 0,
                   adaptations: conv_hist.adaptRetries, warnings: pressureWarnings.length,
                   massBalanceErr: conv_hist.massBalanceErr.toFixed(2),
                   permContrast: conv_hist.permContrast.toFixed(0) },
      pressureWarnings,
      convergenceHistory: conv_hist,
      sqi, sqiLabel, physicsViolations: physViolations,
    };
    log.push(`DONE ${summary.simTimeSec}s`);
    return {
      timestamp: new Date().toISOString(), version: Date.now(),
      depthResults, stageResults, pressureTime: pressureTimeSeries,
      summary, fracPres: w.fracPres, solverLog: log,
    };
  }

  function _fallback(resRows, msg) {
    console.warn('[ENG v5]', msg);
    const dr = (resRows || []).map((r, i) => ({
      depth: +r.top, skinB: +r.skin, skinA: Math.max(0.1, +r.skin * 0.4),
      pen: 0, pres: 4800 + i * 15, conc: 0.05, placed: false,
      pi_b: 0.3, pi_a: 0.6, bypassFac: 0, etaRxn: 0, Da: 0,
      regime: 'none', wormholeBoost: 1, k_eff: +r.perm || 10,
      fluidName: 'None', V_acid: 0,
    }));
    return {
      timestamp: new Date().toISOString(), version: Date.now(),
      depthResults: dr, stageResults: [], pressureTime: [], fracPres: 5900,
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
    // ════════════════════════════════════════════════════════════════════════
    // PER-NODE OUTPUT: each depth node produces one result row.
    // This gives full depth resolution for all charts (skin, pen, PI, placement).
    // Node spacing = (totalDepth) / nDG — typically 20+ nodes across all layers.
    // Each node's row uses the node's own simulated values (not layer averages).
    // The reservoir interval (r) provides formation properties (k, skin_orig, por).
    // ════════════════════════════════════════════════════════════════════════
    const reservoirNodes = nodeState.filter(ns => ns.hasReservoir !== false);
    if (!reservoirNodes.length) {
      // Full fallback: no simulation nodes → one row per reservoir interval
      return res.map((r, i) => _analyticalFallback(r, w, i));
    }

    // Common constants (same for all nodes)
    const lnR    = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
    const r_wb   = Math.max(0.001, w.wbR_ft);
    const nNodes = reservoirNodes.length;

    // Total main-acid volume across all nodes (for % placement calculation)
    const totalMainAcid = reservoirNodes.reduce((s, n) => s + safe(n.V_main_acid), 0);

    return reservoirNodes.map((n, ni) => {
      // Find the reservoir interval this node belongs to
      const r = res.find(rv => n.z >= +rv.top && n.z <= +rv.bot) ||
                (n.interval ? { ...n.interval } : res[0]);
      if (!r) return null;

      // ── Node-level simulation outputs ─────────────────────────────────────
      const placed      = n.placed || safe(n.V_main_acid, 0) > 0;
      const pen_in      = safe(n.r_pen_in, 0);   // net wormhole penetration [in] at this node
      const k_eff_f     = safe(n.k_eff_final, +r.perm);
      // bhp_main: BHP recorded during main acid injection stage (most diagnostic).
      // Falls back to last-timestep presField.bhp if main acid stage wasn't reached.
      const bhp_main    = n.bhp_main && n.bhp_main > 0 ? n.bhp_main : (n.presField?.bhp || 4800);
      const bhp         = bhp_main;
      // ── Qres: post-stimulation reservoir inflow rate [bbl/day] ─────────────
      // Computed from Darcy's law using POST-TREATMENT PI and a standard production
      // drawdown. BHP during injection is ABOVE reservoir pressure (that's why fluid
      // enters the formation), so we cannot use injection BHP as production drawdown.
      //
      // Production drawdown assumption: wellbore flowing pressure = 80% of P_res
      // (typical for matrix-acidized carbonate wells under normal depletion).
      // This gives a standardised Qres that reflects stimulation improvement.
      //
      // Formula: Qres [bbl/day] = PI_after × (P_res − P_wf_production)
      //   P_res      = user-input reservoir pressure for this layer
      //   P_wf       = 0.80 × P_res  (20% drawdown = industry-typical assumption)
      //   Drawdown   = 0.20 × P_res
      //   PI_after   = k_after × h / (141.2 × μ × (ln(re/rw) + skin_after))
      //
      const p_res_node   = Math.max(100, +r.pres || 3700);  // reservoir pressure [psi]
      const prod_drawdown = 0.20 * p_res_node;               // 20% of P_res [psi]
      const lnR_node     = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
      const skinN        = safe(n.S_final, +r.skin);         // post-treatment skin
      const k_after_node = Math.max(0.001, safe(n.k_eff_final, +r.perm));
      // Sub-node thickness: use n.dz (actual grid spacing) so Qres varies per grid.
      // Each depth grid represents dz feet of reservoir — not the full layer thickness.
      const h_node_ft    = Math.max(0.1, safe(n.dz, Math.max(1, +r.bot - +r.top)));
      // PI_after [bbl/d/psi]: Darcy equation with post-treatment permeability and skin
      const pi_after_node = safeDiv(
        k_after_node * h_node_ft,
        141.2 * 1.0 * Math.max(0.01, lnR_node + Math.max(0, skinN))
      );
      // Qres [bbl/min]:
      // Two values computed:
      // 1. qres_inject: actual injection rate from iterative solver (Σ dV/dt per ts)
      //    This is what was physically pumped into the layer during the job.
      // 2. qres_prod: post-treatment production rate = PI_after × prod_drawdown / 1440
      //    This is the expected production flow rate after stimulation.
      // We report qres_inject in the results table (what the solver actually computed).
      const qres_inject  = Math.max(0, safe(n.qres_solver, 0));    // from solver [bbl/min]
      const qres_prod    = Math.max(0, pi_after_node * prod_drawdown / 1440.0); // [bbl/min]
      // Use injection Qres if available (solver ran), else fall back to PI-based estimate
      const qres_node    = qres_inject > 0 ? qres_inject : qres_prod;
      const vMainAcid   = safe(n.V_main_acid, 0); // [bbl] at this node
      const vAcid       = safe(n.V_acid, 0);

      // ── Formation properties from reservoir interval ──────────────────────
      const k_orig   = Math.max(0.001, +r.perm  || 0.1);
      const skinOrig = clamp(+r.skin, 0, 300);
      // ── Formation properties from reservoir interval ──────────────────────
      const h_ft     = Math.max(1, +r.bot - +r.top || 50);
      const por      = clamp(safe(+r.por, 0.15), 0.01, 0.5);   // already a fraction from convertUnits
      const dmgR_ft  = Math.max(0.01, +r.dmgR || 1.0);
      const dmgR_in  = dmgR_ft * 12;

      // ── Per-stage-type volumes from nodeState ─────────────────────────────
      const vPre    = safe(n.V_pre,  0);   // preflush volume this node [bbl]
      const vMain   = safe(n.V_main, 0);   // main injection volume [bbl]
      const vOver   = safe(n.V_over, 0);   // overflush volume [bbl]
      // Cumulative radial fronts (piston displacement model):
      //   Preflush leading edge  = pushed by EVERYTHING after it → V_pre + V_main + V_over
      //   Main acid leading edge = pushed by overflush            → V_main + V_over
      //   Overflush leading edge = pushed by nothing              → V_over only
      // Each value is the cumulative volume that has displaced that fluid front outward.
      const vForPre  = vPre + vMain + vOver;   // total vol behind preflush front
      const vForMain = vMain + vOver;           // total vol behind main acid front
      const vForOver = vOver;                   // total vol behind overflush front
      // Radial penetration per stage — net inches beyond wellbore wall
      // rNetIn(v): net_pen = (sqrt(r_wb² + V×5.615/(π×h×φ)) − r_wb) × 12  [inches]
      // Cumulative front model:
      //   pen_preflush  (deepest)   = vPre + vMain + vOver displaced outward
      //   pen_main_inj              = vMain + vOver displaced outward
      //   pen_overflush (shallowest)= vOver displaced outward
      // True cumulative front positions — no cap applied
      // so the RATIO between them is always preserved and values stay readable.
      const r_wb_ft = Math.max(0.001, safe(w.wbR_ft, 0.0304));
      const r_wb_sq = r_wb_ft * r_wb_ft;
      // Wormhole efficiency factor E_wh: fraction of pore volume that is actual wormhole channel.
      // Carbonate optimal wormholing: E_wh ≈ 0.04 (Fredd & Fogler 1998, Economides & Nolte 2000).
      // Without this, formula gives total radial sweep (unrealistic for matrix acidizing).
      // With E_wh = 0.04: 500 BBL into h=50ft, φ=18.5% → ~27 in (2.2 ft) — physically correct.
      const E_wh = 0.04;
      const rNetIn  = (v) => {
        if (v <= 0) return 0;
        const denom = Math.PI * Math.max(0.5, h_ft) * Math.max(0.005, por);
        return Math.max(0, Math.sqrt(r_wb_sq + v * E_wh * 5.61458 / denom) - r_wb_ft) * 12;
      };
      // True cumulative front positions — no cap, shows real penetration
      const pen_overflush = +rNetIn(vForOver).toFixed(2);
      const pen_main_inj  = +Math.max(pen_overflush, rNetIn(vForMain)).toFixed(2);
      const pen_preflush  = +Math.max(pen_main_inj,  rNetIn(vForPre)).toFixed(2);

      // ── Main pen_final ────────────────────────────────────────────────────
      let pen_final = pen_in;
      if (pen_final < 0.01 && vMainAcid > 0) {
        pen_final = rNetIn(vMainAcid);
      }

      // ── Hawkins composite skin (per node) ────────────────────────────────
      // ── Hawkins composite skin (per node) ────────────────────────────────
      let skinAfter = skinOrig;
      let k_after   = k_orig;

      if (placed && pen_final > 0) {
        // Only reduce skin when the fluid is acid-reactive
        // k_eff_f > k_orig indicates permeability enhancement → acid worked
        // Acid reactive if: perm enhanced OR acid volume was placed AND rxRate > 0
        // Relaxed check: also reactive if placed with main acid (pen_final > 0 guaranteed above)
        const isAcidReactive = k_eff_f > k_orig * 1.005 || (placed && pen_final > 0.01);
        if (isAcidReactive) {
          const r_wh_ft = r_wb + pen_final / 12;
          const k_wh    = Math.max(k_orig, k_eff_f);
          if (pen_final >= dmgR_in) {
            const S_wh = (safeDiv(k_orig, k_wh) - 1) * safeLog(safeDiv(r_wh_ft, r_wb));
            skinAfter  = clamp(S_wh, SOLVER.S_MIN, skinOrig);
          } else {
            const ln_dmg_wb = Math.max(0.001, safeLog(safeDiv(dmgR_ft, r_wb)));
            const k_s       = safeDiv(k_orig, Math.max(0.001, safeDiv(skinOrig, ln_dmg_wb) + 1));
            const k_s_eff   = clamp(k_s, k_orig * 0.001, k_orig);
            const S_wh2 = (safeDiv(k_orig, k_wh)    - 1) * safeLog(safeDiv(r_wh_ft, r_wb));
            const S_dmg = (safeDiv(k_orig, k_s_eff) - 1) * safeLog(safeDiv(dmgR_ft, r_wh_ft));
            skinAfter   = clamp(S_wh2 + S_dmg, SOLVER.S_MIN, skinOrig);
          }
          k_after = k_wh;
        }
        // Non-acid fluid (brine, solvent, N2): no skin change, no perm enhancement
      }

      // ── PI per node (Darcy) ───────────────────────────────────────────────
      const pi_b_out = safeDiv(k_orig  * h_ft, 141.2 * Math.max(0.01, lnR + skinOrig));
      const pi_a_out = safeDiv(k_after * h_ft, 141.2 * Math.max(0.01, lnR + Math.max(SOLVER.S_MIN, skinAfter)));

      // ── Acid concentration / spending ─────────────────────────────────────
      const pore_vol_proxy  = Math.max(0.1, h_ft * 0.3 * por);
      const conc            = clamp(safeDiv(vAcid, pore_vol_proxy * 15), 0, 0.98);
      const acid_spent_frac = safe(n.C_acid_final, 0);
      // Volume-based placement coverage:
      // What fraction of the damage-zone pore volume was contacted by injected acid?
      // V_pore_dmg [BBL] = π × (r_dmg² - r_wb²) × h_node [ft] × φ / 5.615
      // coverage [%] = V_main_acid / V_pore_dmg × 100
      // >100% means acid penetrated beyond damage zone (excellent placement)
      const dmgR_ft_node = Math.max(r_wb * 1.01, dmgR_ft);
      const V_pore_dmg   = Math.PI * (dmgR_ft_node*dmgR_ft_node - r_wb*r_wb)
                           * Math.max(0.5, h_ft) * Math.max(0.005, por) / 5.61458;
      const vol_coverage = V_pore_dmg > 0
        ? clamp(vMainAcid / V_pore_dmg * 100, 0, 500)
        : 0;
      const bypass_pct   = +vol_coverage.toFixed(1);
      const diss_pore_vol   = placed
        ? +(vMainAcid * (k_eff_f - k_orig) / Math.max(0.001, k_orig) * 0.01).toFixed(4)
        : 0;

      // ── Node depth — exact z position (not layer top) ─────────────────────
      // depth = node centre depth; bot = depth + half-node-spacing
      const nodeSpacing = nNodes > 1
        ? Math.abs(reservoirNodes[Math.min(ni+1, nNodes-1)].z - n.z)
        : h_ft;
      const halfSpacing = Math.max(1, nodeSpacing / 2);

      return {
        depth:       +n.z.toFixed(1),             // exact node depth [ft] — NOT layer top
        bot:         +(n.z + halfSpacing).toFixed(1),
        layer:       res.indexOf(r),              // which reservoir interval
        skinB:       +skinOrig.toFixed(2),
        skinA:       +skinAfter.toFixed(2),
        pen:           +pen_final.toFixed(2),          // main acid wormhole (solver)
        pen_acid:      +pen_final.toFixed(2),
        // Radial penetration fronts: preflush(deepest) > main > overflush(shallowest)
        pen_preflush:  +pen_preflush.toFixed(2),          // preflush front [in]
        pen_main_inj:  +pen_main_inj.toFixed(2),          // main acid front [in]
        pen_overflush: +pen_overflush.toFixed(2),          // overflush front [in]
        pen_other:     +pen_preflush.toFixed(2),           // alias (backward compat)
        pen_total:     +pen_preflush.toFixed(2),           // total = preflush front (deepest)
        dmgR:        +dmgR_ft.toFixed(2),
        bypass_pct,         // volume-based placement coverage [%]
        vol_coverage:  +vol_coverage.toFixed(1),
        pres:        +bhp.toFixed(0),
        pres_res:    +clamp(safe(+r.pres, 0), 0, 30000),
        conc:        +conc.toFixed(3),
        placed,
        V_main_acid: +vMainAcid.toFixed(3),
        V_acid:      +vAcid.toFixed(3),
        V_total:     +safe(n.V_total, vAcid).toFixed(3),
        V_pre:       +safe(n.V_pre,  0).toFixed(3),
        V_main:      +safe(n.V_main, 0).toFixed(3),
        V_over:      +safe(n.V_over, 0).toFixed(3),
        qres_inject: +safe(n.qres_solver, 0).toFixed(5),   // solver Qres [bbl/min]
        qres_prod:   +safe(qres_prod, 0).toFixed(5),        // PI-based production Qres [bbl/min]
        T_main_acid: +safe(n.T_main_acid, 0).toFixed(2),
        por:         +clamp(safe(+r.por, 15), 0, 60).toFixed(1),
        qres:        +qres_node.toFixed(4),   // [bbl/min] reservoir inflow rate
        fracRisk:    !!(n.presField && n.presField.bhp >= w.fracPres),
        pi_b:        +pi_b_out.toFixed(4),
        pi_a:        +pi_a_out.toFixed(4),
        bypassFac:   +clamp(safe(n.bypassFrac, 0), 0, 0.97).toFixed(3),
        etaRxn:      +clamp(safe(n.etaRxn, 0), 0, 1).toFixed(3),
        Da:          +safe(n.Da, 0).toFixed(4),
        regime:      n.regime || 'none',
        wormholeBoost: +safe(n.wormholeBoost, 1).toFixed(3),
        k_before:    +k_orig.toFixed(3),
        k_after:     +k_after.toFixed(3),
        k_eff:       +k_eff_f.toFixed(2),
        acid_spent:  +clamp(1 - acid_spent_frac, 0, 1).toFixed(3),
        wh_radius_in: +((r_wb + pen_final/12)*12).toFixed(2),  // total radius from centre [in]
        diss_pore_vol: +diss_pore_vol.toFixed(4),
        fluidName:   placed ? 'HCl 15%' : 'None',
        // Main-injection fluid properties at layer temperature
        fluid_density_ppg: +safe(n.fluid_density_ppg, 0).toFixed(3),
        fluid_visc:        +safe(n.fluid_visc, 0).toFixed(3),
        fluid_rxRate:      +safe(n.fluid_rxRate, 0).toFixed(5),
        // Temperature at this depth grid [°F] = surface_temp + geothermal_grad × depth/100
        // Use n.z (absolute depth ft) with explicit fallback chain.
        // T_surface from w (passed through convertUnits from wellWithTemp in simDone).
        // Math.max(60,...) prevents physically impossible cold temperatures.
        // T(grid) = T_surface + T_gradient × depth_from_surface [°F]
        // depth_ft: use n.z if it looks like a real reservoir depth (>= 500 ft).
        // Otherwise fall back to midpoint of the reservoir interval r, which comes from
        // convertUnits where top = safe(+userInput, 8000) — reliable and always correct.
        fluid_T_F: +(()=>{
          const ivTop   = +r.top > 0 ? +r.top : 8000;
          const ivBot   = +r.bot > ivTop ? +r.bot : ivTop + 50;
          const depth   = (n.z && n.z >= 500) ? n.z : (ivTop + ivBot) / 2;
          const T_surf  = +w.T_surface || 59;   // °F at surface (default 59°F = 15°C)
          const T_grad  = +w.T_grad    || 1.5;  // °F per 100 ft
          return Math.max(60, T_surf + T_grad * depth / 100);
        })().toFixed(1),
        // Placement fraction (this node's share of total main-acid volume)
        pct_placed_node: totalMainAcid > 0
          ? +(vMainAcid / totalMainAcid * 100).toFixed(1)
          : 0,
      };
    }).filter(Boolean);
    // Each reservoir interval is now subdivided into numDepthGrids/nLayers real nodes,
    // so depthResults already has one row per depth grid — no post-processing expansion needed.
  }

  function _analyticalFallback(r, w, i) {
    const lnr       = Math.max(0.01, safeLog(safeDiv(w.drainR, w.wbR_ft, 1)));
    const skinBefore = safe(+r.skin, 5);
    // Fallback: assume moderate treatment, 40% bypass
    const bypass_fb  = 0.40;
    const S_mech_fb  = Math.max(0.0, skinBefore * 0.02);
    const skinAfter  = Math.max(S_mech_fb, skinBefore * (1 - bypass_fb));
    const pi_b = safeDiv(r.perm * r.h, 141.2 * 1.0 * Math.max(0.01, lnr + skinBefore), 0);
    const pi_a = safeDiv(r.perm * r.h, 141.2 * 1.0 * Math.max(0.01, lnr + skinAfter),  0);
    return {
      depth: +r.top, skinB: +skinBefore, skinA: +skinAfter.toFixed(2),
      pen: 0, pres: 4800 + i * 15, conc: 0.05, placed: false,
      pi_b: +pi_b.toFixed(4), pi_a: +pi_a.toFixed(4),
      bypassFac: bypass_fb, etaRxn: 0, Da: 0, regime: 'none',
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
    // fluidProps.conc is already a fraction [0..1] (converted before calling this fn)
    const conc0=clamp(+fluidProps.conc||0.15,0.001,1);
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
    const skinOrig  = safe(+resRow.skin, 5);
    // dmgR: stored in inches in convertUnits (default 12 in = 1 ft)
    const dmgR_in   = Math.max(0.5, (+resRow.dmgR || 12));
    const pen_in    = Math.max(0, safe(penData.penetration_in, 0));
    const etaRxn    = clamp(safe(penData.etaRxn, 0.5), 0, 1);
    const dR        = (MINERAL[resRow.lith] || MINERAL.Carbonate).dissolveRate;
    // bypass = tanh(pen_in / dmgR_in) * etaRxn * dissolveRate
    const arg       = safeDiv(pen_in, dmgR_in);
    const tanh_v    = safeDiv(arg, 1 + Math.abs(arg));
    const bypassFac = clamp(tanh_v * etaRxn * dR, 0, 0.97);
    // Hawkins: S_after = S_orig * (1 - bypass) + S_mech
    const S_mech    = Math.max(0.5, skinOrig * 0.05);
    const skinAfter = Math.max(S_mech, skinOrig * (1 - bypassFac));
    return { skinAfter: +skinAfter.toFixed(2), bypassFac };
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
  numDepthGrids: 100,       // Number of Depth Grids
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

  // Pumping Data (Bullhead / CT)
  pumpingData: {
    injectionType: "Bullhead",          // "Bullhead" | "CT"
    msp: 2000,                          // max surface pressure [psi]
    // Bullhead only
    frictionGrad: 450,                  // psi/1000ft
    // CT only
    pipeRoughness: "Smooth",
    ctLength: 1000,                     // ft
    ctOD: 1.75,                         // in
    ctID: 1.5,                          // in
    ctFricGrad: 1,                      // psi/100ft
  },

  // Main Injection Fluid (acid properties for primary treatment acid)
  mainFluid: {
    name: "HCl 7.5",
    hclConc: 7.5,                       // %
    diffusionCoeff: 2.01e-4,            // ft2/min
    viscosity: 1.05,                    // cP
    specificGravity: 1.035,
  },

  // Damage Type (keep existing — user selects from list)
  damageType: {
    primary: "Scale (Carbonate)",
    secondary: "Paraffin",
    description: "",
  },

  // Rock Properties
  rockProps: {
    fracGrad: 0.8,                      // psi/ft
    formationTemp: 120,                 // °F
    surfaceTemp: 59,                    // °F surface ambient
    geoGradient: 1.5,                   // °F/100ft geothermal gradient
    rockDensity: 2.65,                  // g/cm3
    leakoffCoeff: 0.0025,              // ft/min^0.5
    // Per-zone mineralogy (mirrors reservoir depth zones)
    zones: [
      { fromMD:8200, toMD:8255, calcite:100, dolomite:0, shale:0, dmgR:1.0 },
      { fromMD:8255, toMD:8315, calcite:100, dolomite:0, shale:0, dmgR:1.0 },
      { fromMD:8315, toMD:8370, calcite:60,  dolomite:40,shale:0, dmgR:1.0 },
      { fromMD:8370, toMD:8425, calcite:100, dolomite:0, shale:0, dmgR:1.0 },
      { fromMD:8425, toMD:8480, calcite:0,   dolomite:0, shale:100,dmgR:1.0},
      { fromMD:8480, toMD:8540, calcite:100, dolomite:0, shale:0, dmgR:1.0 },
    ],
  },

  // Diverter Fluid (default — kept with preset values per reference PDF)
  diverterFluid: {
    name: "VES Diverter",
    type: "VES",                         // VES | Particulate | Foam | BallSealer
    conc: 3.0,                           // gal/Mgal or %
    density: 1.02, visc: 45,
    placementEff: 0.85,
  },

  // Core Flood Data (optional — lab measured wormhole parameters)
  coreflood: {
    useCoreFIood: false,
    pvbt: 0.5,                           // Pore Volumes to Breakthrough
    wormholeDiam: 0.25,                  // in
    wormholeTortuosity: 1.4,
    corePor: 20,                         // %
    corePerm: 100,                       // md
    coreLength: 6,                       // in
    coreFlowRate: 2.0,                   // ml/min
  },

  // Reservoir Fluid Properties (optional)
  resvFluid: {
    oilGravity: 32,                      // °API
    gasSG: 0.72,
    waterSalinity: 80000,               // ppm
    bubblePoint: 1800,                  // psi
    gasOilRatio: 500,                   // scf/stb
    formationVolFactor: 1.18,           // RB/STB
    oilViscosity: 1.8,                  // cP
  },
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
  { name:"Wellbore Radius", unit:"in", dbField:"wbR",    section:"well", min:0.5,  max:18.0 },
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
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body,#root{background:${T.bg0};color:${T.text0};font-family:${T.sans};height:100%;font-size:12px;}

  /* ── Scrollbar — thin, engineering-style ──────────────────────────────── */
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:${T.bg3};}
  ::-webkit-scrollbar-thumb{background:${T.border1};border-radius:0;}
  ::-webkit-scrollbar-thumb:hover{background:${T.border2};}

  /* ── Buttons — flat, bordered, no rounded corners ──────────────────────── */
  .sb{
    border:1px solid ${T.border1};
    border-radius:2px;
    cursor:pointer;
    font-family:${T.sans};
    font-weight:600;
    font-size:11px;
    display:inline-flex;
    align-items:center;
    gap:5px;
    white-space:nowrap;
    transition:background 0.1s,border-color 0.1s;
    letter-spacing:0.2px;
  }
  .sb:hover{filter:brightness(0.93);}
  .sb:active{filter:brightness(0.85);}
  .sb:disabled{opacity:0.4;cursor:default;}

  /* ── Input fields — flat, high-contrast, no radius ─────────────────────── */
  .si{
    background:${T.bg4};
    border:1px solid ${T.border1};
    border-radius:0;
    color:${T.text0};
    padding:4px 7px;
    font-size:12px;
    width:100%;
    outline:none;
    font-family:${T.mono};
    height:24px;
  }
  .si:focus{border-color:${T.teal};background:#fff;}
  .ss{
    background:${T.bg4};
    border:1px solid ${T.border1};
    border-radius:0;
    color:${T.text0};
    padding:4px 7px;
    font-size:12px;
    width:100%;
    outline:none;
    cursor:pointer;
    height:24px;
    font-family:${T.sans};
  }
  .ss:focus{border-color:${T.teal};}

  /* ── Table rows ──────────────────────────────────────────────────────────── */
  .hr:hover{background:${T.bgHov}!important;}
  table{border-collapse:collapse;}

  /* ── Status badges — rectangular ──────────────────────────────────────── */
  .pill{
    display:inline-flex;
    align-items:center;
    padding:1px 7px;
    border-radius:1px;
    font-size:10px;
    font-weight:700;
    letter-spacing:0.4px;
    text-transform:uppercase;
    border:1px solid currentColor;
  }

  /* ── Fade-in for page transitions ──────────────────────────────────────── */
  @keyframes pgfade{from{opacity:0}to{opacity:1}}
  .anim{animation:pgfade 0.15s ease forwards;}

  /* ── Warning / Error banners ──────────────────────────────────────────── */
  .wb{background:#FFF8E6;border:1px solid ${T.gold};border-left:3px solid ${T.gold};padding:6px 11px;display:flex;align-items:center;gap:8px;}
  .db{background:#FFF0F0;border:1px solid ${T.red};border-left:3px solid ${T.red};padding:6px 11px;display:flex;align-items:center;gap:8px;}

  /* ── Range input ─────────────────────────────────────────────────────── */
  input[type=range]{accent-color:${T.teal};}

  /* ── Sidebar nav active/hover ─────────────────────────────────────────── */
  .nav-item{display:flex;align-items:center;gap:10px;padding:8px 14px 8px 16px;cursor:pointer;font-size:14px;color:#A8C4DC;user-select:none;border-left:3px solid transparent;transition:background 0.08s;}
  .nav-item:hover{background:rgba(255,255,255,0.08);color:#D8EAF8;}
  .nav-item.active{background:rgba(0,140,200,0.28);color:#7DD4F4;border-left:3px solid #5BC4F0;font-weight:700;}
  .nav-sep{height:1px;background:rgba(255,255,255,0.1);margin:4px 0;}
`;

// ─── PRIMITIVES — StimPRO engineering style ───────────────────────────────────
function Btn({ children, onClick, v = "p", sz = "m", icon, sx = {}, disabled, full }) {
  // Size: s=small toolbar, m=standard, l=primary action
  const S = {
    s: { padding: "3px 9px",  fontSize: 11, height: 22 },
    m: { padding: "5px 13px", fontSize: 12, height: 26 },
    l: { padding: "7px 18px", fontSize: 13, height: 30 },
  };
  // Variant: p=primary (blue), a=action (amber), g=ghost, d=danger, o=outline, s=success
  const V = {
    p: { background: T.teal,    color: "#fff",    borderColor: T.tealDim },
    a: { background: T.gold,    color: "#fff",    borderColor: T.goldDim },
    g: { background: T.bg3,     color: T.text1,   borderColor: T.border1 },
    d: { background: "#F0DADA", color: T.red,     borderColor: T.redDim  },
    o: { background: "transparent", color: T.teal, borderColor: T.teal   },
    s: { background: "#D6EFE0", color: T.green,   borderColor: T.greenDim},
  };
  return <button className="sb" onClick={onClick} disabled={disabled}
    style={{ ...S[sz], ...V[v], opacity: disabled ? 0.4 : 1, width: full ? "100%" : undefined, ...sx }}>
    {icon && <span style={{ fontSize: 11 }}>{icon}</span>}{children}
  </button>;
}

// Card: flat panel with header band — StimPRO style
function Card({ title, children, action, sx = {}, np }) {
  return <div style={{ background: T.bg2, border: `1px solid ${T.border0}`, borderRadius: 0, overflow: "hidden", ...sx }}>
    {(title || action) && <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "4px 10px", borderBottom: `1px solid ${T.border0}`,
      background: T.bg3, minHeight: 26,
    }}>
      {title && <span style={{ fontSize: 11, fontWeight: 700, color: T.text1, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>}
      {action}
    </div>}
    <div style={np ? {} : { padding: 10 }}>{children}</div>
  </div>;
}

function Lbl({ children, tip, unit }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: T.text1 }}>{children}</span>
    {unit && <span style={{ fontSize: 10, color: T.text2 }}>({unit})</span>}
    {tip && <span title={tip} style={{ fontSize: 10, color: T.teal, cursor: "help" }}>?</span>}
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

// Metric tile — dense KPI display for engineering dashboards
function Met({ label, value, unit, color = T.teal, icon }) {
  return <div style={{
    background: T.bg2, border: `1px solid ${T.border0}`,
    borderTop: `3px solid ${color}`,
    borderRadius: 0, padding: "8px 10px",
  }}>
    <div style={{ fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4, fontWeight: 700 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono, lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 10, color: T.text2 }}>{unit}</span>}
    </div>
  </div>;
}

// Tabs — engineering style: flat, rectangle tabs, no pill shape
function Tabs({ tabs, active, onSet }) {
  return <div style={{ display: "flex", borderBottom: `2px solid ${T.border0}`, marginBottom: 12, overflowX: "auto", flexShrink: 0, gap: 0 }}>
    {tabs.map(t => <button key={t.id} onClick={() => onSet(t.id)} className="sb" style={{
      background: active === t.id ? T.bg2 : T.bg3,
      border: "1px solid " + T.border0,
      borderBottom: active === t.id ? "2px solid " + T.teal : "none",
      borderRadius: 0,
      color: active === t.id ? T.text0 : T.text2,
      padding: "5px 14px", fontSize: 11,
      fontWeight: active === t.id ? 700 : 400,
      whiteSpace: "nowrap", marginBottom: -2,
    }}>
      {t.label}
    </button>)}
  </div>;
}

// Badge — rectangular status indicator
function Bdg({ color, label }) {
  const M = {
    teal:  [T.teal,  "#E0F4FA"],
    gold:  [T.gold,  "#FFF3D8"],
    red:   [T.red,   "#FCE8E8"],
    green: [T.green, "#E2F4EA"],
    blue:  [T.blue,  "#E4EEF9"],
    gray:  [T.text2, T.bg3   ],
  };
  const [fg, bg] = M[color] || [T.text2, T.bg3];
  return <span className="pill" style={{ color: fg, background: bg }}>{label}</span>;
}

function G2({ children, gap = 14 }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>; }
function G3({ children, gap = 14 }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap }}>{children}</div>; }
function G4({ children, gap = 10 }) { return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap }}>{children}</div>; }

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
function DTable({ cols, rows, setRows, fluidOpts, compact }) {
  const th = { background: T.bg3, padding: compact ? "3px 7px" : "5px 8px", textAlign: "left", color: T.text1, borderBottom: `2px solid ${T.border0}`, borderRight: `1px solid ${T.border0}`, whiteSpace: "nowrap", fontSize: 10, fontWeight: 700, letterSpacing: "0.4px" };
  const td = { padding: compact ? "3px 6px" : "4px 7px", borderBottom: `1px solid ${T.border0}`, borderRight: `1px solid rgba(0,0,0,0.04)`, fontSize: 12 };
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

// ─── WORKFLOW NAV — engineering step strip ────────────────────────────────────
const WORKFLOW = ["reservoir","well","fluids","acid","schedule","sim"];
const WORKFLOW_LABELS = { reservoir:"Reservoir Data", well:"Well & Completion", fluids:"Fluids Library", acid:"Acid Design", schedule:"Pump Schedule", sim:"Run Simulation" };
function WorkflowNav({ page, setPage }) {
  const idx = WORKFLOW.indexOf(page);
  if (idx < 0) return null;
  const prev = idx > 0 ? WORKFLOW[idx - 1] : null;
  const next = idx < WORKFLOW.length - 1 ? WORKFLOW[idx + 1] : null;
  return <div style={{
    display:"flex", alignItems:"center", gap:0,
    background: T.bg3, borderTop:`1px solid ${T.border0}`,
    flexShrink:0, height: 30,
  }}>
    {/* Step indicators */}
    <div style={{ display:"flex", flex:1, height:"100%", overflow:"hidden" }}>
      {WORKFLOW.map((w,i) => {
        const done = i < idx, cur = i === idx;
        return <div key={w} style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: 10, fontWeight: cur ? 700 : 400,
          color: cur ? "#fff" : done ? T.teal : T.text2,
          background: cur ? T.teal : done ? "rgba(0,120,168,0.12)" : "transparent",
          borderRight: `1px solid ${T.border0}`,
          cursor: done ? "pointer" : "default",
          gap: 4,
        }} onClick={() => done && setPage(w)}>
          <span style={{ fontFamily:T.mono, fontSize:9 }}>{i+1}</span>
          <span style={{ display: cur || done ? "inline" : "none" }}>{WORKFLOW_LABELS[w].split(" ")[0]}</span>
        </div>;
      })}
    </div>
    {/* Nav buttons */}
    <div style={{ display:"flex", gap:4, padding:"0 8px", borderLeft:`1px solid ${T.border0}` }}>
      {prev && <Btn sz="s" v="g" onClick={()=>setPage(prev)}>&#9664; Back</Btn>}
      {next && <Btn sz="s" v={next==="sim"?"a":"p"} onClick={()=>setPage(next)}>{next==="sim"?"Run Simulation ▶":`Next ▶`}</Btn>}
    </div>
  </div>;
}

// ─── TOPBAR — StimPRO style: compact toolbar band ─────────────────────────────
function Topbar({ title, sub, actions, warns }) {
  return <div style={{
    background: T.bg3,
    borderBottom: `2px solid ${T.border0}`,
    padding: "0 14px",
    height: 36,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text0, letterSpacing: "0.1px" }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: T.text2, borderLeft: `1px solid ${T.border0}`, paddingLeft: 10 }}>{sub}</span>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {(Array.isArray(warns) ? warns : warns ? [warns] : []).map((w, i) =>
        <span key={i} style={{ fontSize: 10, color: T.gold, background: "#FFF8E6", padding: "2px 7px", border: `1px solid ${T.gold}`, fontWeight: 700 }}>! {w}</span>
      )}
      {actions}
    </div>
  </div>;
}

// ─── WELL SCHEMATIC SVG ───────────────────────────────────────────────────────
function WellSchematic({ reservoir, results, hovDepth, onHover, minDepth, maxDepth }) {
  const W = 175, H = 500;
  const cx = 87, cw = 32, tw = 14;
  const depths = reservoir && reservoir.length > 0 ? reservoir.flatMap(r => [+r.top || 0, +r.bot || 0]).filter(v => v > 0) : [7900, 8600];
  // Also include results depths to ensure result bars are visible
  const resDeps = results ? results.flatMap(r => [+r.depth||0, +(r.bot||r.depth+55)||0]).filter(v=>v>0) : [];
  const allDeps = [...depths, ...resDeps].filter(v=>v>0);
  const dataTop = allDeps.length ? Math.min(...allDeps) : 7900;
  const dataBot = allDeps.length ? Math.max(...allDeps) : 8600;
  // Use caller-supplied depth range when available — aligns with DepthPlot axes
  const top = minDepth !== undefined ? minDepth : Math.max(0, dataTop - (dataBot - dataTop) * 0.08);
  const bot = maxDepth !== undefined ? maxDepth : dataBot + (dataBot - dataTop) * 0.08;
  const py = d => 28 + ((d - top) / (bot - top)) * (H - 56);

  const perfs = reservoir.map(r => ({ t: r.top, b: r.bot }));
  const litColors = { Carbonate: "rgba(30,207,178,0.08)", Dolomite: "rgba(232,160,32,0.08)", Shale: "rgba(139,120,240,0.08)", Sandstone: "rgba(74,158,232,0.08)", Limestone: "rgba(45,184,130,0.08)" };

  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
    <rect width={W} height={H} fill={T.bg2} rx={0} stroke={T.border0} strokeWidth={0.5}/>
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
    {/* Casing — spans from reservoir top depth to bottom depth, aligned with data */}
    {(()=>{
      const yt = py(minD), yb = py(maxD);
      const casingH = Math.max(4, yb - yt);
      return <>
        <rect x={cx-cw/2} y={yt} width={cw} height={casingH}
          fill="none" stroke={T.border2} strokeWidth={1.5} rx={2}/>
        <rect x={cx-cw/2} y={yt} width={cw} height={casingH}
          fill="rgba(255,255,255,0.01)" rx={2}/>
        {/* Tubing — upper 60% of casing */}
        <rect x={cx-tw/2} y={yt} width={tw} height={casingH*0.6}
          fill="rgba(255,255,255,0.035)" stroke={T.border1} strokeWidth={0.8} rx={1}/>
      </>;
    })()}
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
function DepthPlot({ data, xKey, secKey, yKey = "depth", botKey = "bot", W = 260, H = 170, color = T.teal, secColor = T.green, label = "", fill = false, xMn, xMx, yMn, yMx }) {
  // Renders horizontal bars from each interval's top depth to its bot depth.
  // For each data row: a filled rect spans from py(top) to py(bot), width = px(val).
  // secKey draws a dashed outline bar for comparison (e.g. skin-after over skin-before).
  const pad = { t: 8, b: 20, l: 42, r: 10 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;

  if (!data || !data.length) return <svg width="100%" viewBox={`0 0 ${W} ${H}`}><text x={W/2} y={H/2} textAnchor="middle" fontSize={10} fill={T.text3}>No data</text></svg>;

  // Collect all top/bot depths for Y axis
  const allTops = data.map(d => +d[yKey] || 0);
  const allBots = data.map(d => +(d[botKey] || d[yKey] + 50) || 0);
  const minD = yMn != null ? yMn : Math.min(...allTops);
  const maxD = yMx != null ? yMx : Math.max(...allBots);

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

  return <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
    preserveAspectRatio="none"
    style={{ display:"block" }}>
    {/* Grid lines */}
    {dticks.map(d => <line key={"hy"+d} x1={pad.l} y1={py(d)} x2={W-pad.r} y2={py(d)} stroke={T.border0} strokeWidth={0.4} strokeDasharray="3,3"/>)}
    {xticks.map(v => <line key={"vx"+v} x1={px(v)} y1={pad.t} x2={px(v)} y2={pad.t+gH} stroke={T.border0} strokeWidth={0.3} strokeDasharray="2,4"/>)}
    {/* Zero line */}
    {minV < 0 && <line x1={px0} y1={pad.t} x2={px0} y2={pad.t+gH} stroke={T.text3} strokeWidth={0.8}/>}

    {/* Node depth ticks on Y axis */}
    {data.map((d, i) => {
      const top = +d[yKey] || 0;
      return <g key={"tick"+i}>
        <line x1={pad.l-3} y1={py(top)} x2={pad.l} y2={py(top)}
          stroke="#78909C" strokeWidth={0.8}/>
        <text x={pad.l-5} y={py(top)+3} textAnchor="end"
          fontSize={6} fill="#78909C" fontFamily="monospace">{Math.round(top)}</text>
      </g>;
    })}
    {/* Primary bars: horizontal rect at each node depth */}
    {data.map((d, i) => {
      const top  = +d[yKey] || 0;
      // Use full spacing to next node for bar height (no gaps)
      const nextTop = data[i+1] ? +data[i+1][yKey] : top + 30;
      const bot  = nextTop;
      const val  = +d[xKey]  || 0;
      const y1   = py(top), y2 = py(bot);
      const barH = Math.max(2, y2 - y1 - 0.5);
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
      <div style={{ width: 510, background: T.bg3, borderLeft: `2px solid ${T.border0}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "7px 12px", borderBottom: `1px solid ${T.border0}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text1, textTransform: "uppercase", letterSpacing: "0.5px" }}>Well Schematic  |  Depth Plots</span>
          <Btn sz="s" v="g" onClick={() => setShow(false)}>⊠ Hide</Btn>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "165px 1fr", gap: 10 }}>
            <div style={{ background: T.bg2, borderRadius: 0, overflow: "hidden", border: `1px solid ${T.border0}` }}>
              <WellSchematic
                reservoir={reservoir || INIT_RESERVOIR}
                results={data.length ? data : null}
                hovDepth={hovDepth}
                onHover={setHovDepth}
                minDepth={data.length ? Math.min(...data.map(d=>+d.depth)) : undefined}
                maxDepth={data.length ? Math.max(...data.map(d=>+(d.bot||d.depth+55))) : undefined}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.length ? (<>
                <Card title="Skin Before → After" np>
                  <div style={{ padding: 8 }}><DepthPlot data={data} xKey="skinB" secKey="skinA" yKey="depth" color={T.red} secColor={T.green} label="Skin Factor" H={115} W={295} /></div>
                  <div style={{ display: "flex", gap: 10, padding: "0 8px 6px", fontSize: 11, color: T.text2 }}><span style={{ color: T.red }}>— Before</span><span style={{ color: T.green }}>– – After</span></div>
                </Card>
                <Card title="Penetration vs Depth — Fluid Fronts" np>
                  <div style={{ padding: 8 }}>
                    {/* Legend — three coloured swatches with labels */}
                    <div style={{display:"flex",gap:16,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                      {[
                        {c:"#7986CB", label:"Preflush Front (deepest)"},
                        {c:"#26A69A", label:"Main Acid Front"},
                        {c:"#E57373", label:"Overflush Front (shallowest)"},
                      ].map(({c,label})=>(
                        <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:22,height:10,background:c,borderRadius:2,flexShrink:0}}/>
                          <span style={{fontSize:10,fontWeight:600,color:c}}>{label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Three-series horizontal bar chart — one bar-group per reservoir layer */}
                    {(()=>{
                      if (!data || !data.length) return <div style={{color:T.text3,fontSize:11,padding:16}}>Run simulation first</div>;
                      // Layout constants
                      const W=395, PAD={l:44,r:12,t:10,b:24};
                      // Row height: 3 bars + gap per layer
                      const BAR_H=6, BAR_GAP=2, GROUP_PAD=4;
                      const GROUP_H=3*(BAR_H+BAR_GAP)+GROUP_PAD;
                      const H=PAD.t+data.length*GROUP_H+PAD.b+20;
                      const dW=W-PAD.l-PAD.r;
                      // X scale: max across all three series
                      const allPen=[
                        ...data.map(d=>+d.pen_preflush||0),
                        ...data.map(d=>+d.pen_main_inj||0),
                        ...data.map(d=>+d.pen_overflush||0),
                      ].filter(v=>v>0);
                      const maxPen=allPen.length ? Math.max(...allPen)*1.15 : 10;
                      const px=v=>PAD.l+Math.max(0,Math.min(v,maxPen))/maxPen*dW;
                      const series=[
                        {key:"pen_preflush", color:"#7986CB", label:"Preflush"},
                        {key:"pen_main_inj", color:"#26A69A", label:"Main"},
                        {key:"pen_overflush",color:"#E57373", label:"Overflush"},
                      ];
                      // Y position of top of bar-group for layer i
                      const gy=i=>PAD.t+i*GROUP_H;
                      return <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%"}}>
                        {/* Y axis */}
                        <line x1={PAD.l} y1={PAD.t-4} x2={PAD.l} y2={PAD.t+data.length*GROUP_H} stroke="#2E4268" strokeWidth={1}/>
                        {/* X gridlines + ticks */}
                        {[0,0.25,0.5,0.75,1.0].map((frac,i)=>{
                          const xv=PAD.l+frac*dW;
                          const lbl=(frac*maxPen).toFixed(1);
                          return <g key={i}>
                            <line x1={xv} y1={PAD.t-4} x2={xv} y2={PAD.t+data.length*GROUP_H} stroke="#1C2D45" strokeWidth={i===0?1:0.5} strokeDasharray={i===0?"none":"3,3"}/>
                            <line x1={xv} y1={PAD.t+data.length*GROUP_H} x2={xv} y2={PAD.t+data.length*GROUP_H+3} stroke="#3A4A60" strokeWidth={0.8}/>
                            <text x={xv} y={PAD.t+data.length*GROUP_H+11} textAnchor="middle" fontSize={7} fill="#607088">{lbl}</text>
                          </g>;
                        })}
                        <text x={W/2} y={H-2} textAnchor="middle" fontSize={7} fill="#A8B8D0">Penetration (in)</text>
                        {/* Per-layer bar groups */}
                        {data.map((d,i)=>{
                          const groupY=gy(i);
                          // Depth label centred on the group
                          const labelY=groupY+GROUP_H/2+3;
                          return <g key={i}>
                            {/* Alternating row background */}
                            <rect x={PAD.l} y={groupY} width={dW} height={GROUP_H-GROUP_PAD}
                              fill={i%2===0?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.00)"}/>
                            {/* Depth tick */}
                            <line x1={PAD.l-3} y1={groupY} x2={PAD.l} y2={groupY} stroke="#3A4A60" strokeWidth={0.7}/>
                            <text x={PAD.l-4} y={labelY} textAnchor="end" fontSize={7} fill="#607088">{d.depth}</text>
                            {/* Three bars for this layer */}
                            {series.map(({key,color,label},si)=>{
                              const val=Math.max(0,+d[key]||0);
                              const bY=groupY+si*(BAR_H+BAR_GAP);
                              const bW=Math.max(val>0?2:0, px(val)-PAD.l);
                              return <g key={key}>
                                {/* Bar fill */}
                                {bW>0 && <rect x={PAD.l} y={bY} width={bW} height={BAR_H}
                                  fill={color} opacity={0.75} rx={1}/>}
                                {/* Front-position line */}
                                {val>0 && <line x1={px(val)} y1={bY} x2={px(val)} y2={bY+BAR_H}
                                  stroke={color} strokeWidth={2}/>}
                                {/* Value label at right of bar */}
                                {val>0.05 && <text x={px(val)+3} y={bY+BAR_H-1} fontSize={6.5} fill={color} fontWeight="600">{val.toFixed(1)}</text>}
                              </g>;
                            })}
                          </g>;
                        })}
                        {/* Series row labels on right margin */}
                        {series.map(({color,label},si)=>(
                          <text key={si} x={W-PAD.r+1} y={gy(0)+si*(BAR_H+BAR_GAP)+BAR_H-1}
                            fontSize={5.5} fill={color} fontWeight="700" textAnchor="start">{label}</text>
                        ))}
                        <text x={PAD.l-4} y={PAD.t-5} textAnchor="end" fontSize={7} fill="#607088">Depth ft</text>
                      </svg>;
                    })()}
                    {/* Numeric summary table */}
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,marginTop:8}}>
                      <thead><tr>
                        {["Depth (ft)","Pen Preflush (in)","Pen Main Inj (in)","Pen Overflush (in)"].map((h,i)=>(
                          <th key={i} style={{padding:"3px 5px",background:"#1A2438",
                            color:["#A8B8D0","#7986CB","#26A69A","#E57373"][i],
                            fontSize:9,textAlign:i===0?"left":"right",
                            borderBottom:"1px solid #1C2D45",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{data.map((r,i)=>(
                        <tr key={i} style={{background:i%2===0?"transparent":"rgba(26,36,56,0.4)"}}>
                          <td style={{padding:"2px 5px",fontSize:9,color:"#A8B8D0",fontFamily:"monospace"}}>{r.depth}</td>
                          {[
                            {v:+r.pen_preflush||0, c:"#7986CB"},
                            {v:+r.pen_main_inj||0, c:"#26A69A"},
                            {v:+r.pen_overflush||0,c:"#E57373"},
                          ].map(({v,c},j)=>(
                            <td key={j} style={{padding:"2px 5px",textAlign:"right",fontSize:9,
                              color:v>0?c:"#3A4A60",fontFamily:"monospace",fontWeight:v>0?600:400}}>
                              {v>0?v.toFixed(2):"—"}
                            </td>
                          ))}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
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
      <div style={{ width: 26, background: T.bg3, borderLeft: `1px solid ${T.border0}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, cursor: "pointer" }} onClick={() => setShow(true)}>
        <span style={{ color: T.text2, fontSize: 13, writingMode: "vertical-rl", transform: "rotate(180deg)", userSelect: "none" }}>◁ Well View</span>
      </div>
    )}
  </div>;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",      label: "Dashboard",               group: "top" },
  { id: "create",         label: "New Project",             group: "top", accent: true },
  null,
  // ── REQUIRED INPUTS ──────────────────────────────────────
  { id: "inputs",         label: "Input Data Hub",          group: "req" },
  { id: "reservoir",      label: "Reservoir Data",          group: "req" },
  { id: "well",           label: "Well & Completion",       group: "req" },
  { id: "pumping_data",   label: "Pumping Data",            group: "req" },
  { id: "recipe_design",  label: "Recipe Design",           group: "req" },
  { id: "damage_type",    label: "Damage Type",             group: "req" },
  { id: "rock_props",     label: "Rock Properties",         group: "req" },
  { id: "schedule",       label: "Pump Schedule",           group: "req" },
  null,
  // ── OPTIONAL INPUTS ───────────────────────────────────────
  { id: "fluids",         label: "Fluids Library",          group: "opt" },
  { id: "coreflood",      label: "Core Flood Data",         group: "opt" },
  { id: "resv_fluid",     label: "Reservoir Fluid Props",   group: "opt" },
  null,
  // ── SIMULATION ────────────────────────────────────────────
  { id: "sim",            label: "Run Simulation",          group: "sim" },
  { id: "results",        label: "Results",                 group: "sim" },
  { id: "sensitivity",    label: "Sensitivity",             group: "sim" },
  null,
  // ── OUTPUT ─────────────────────────────────────
  { id: "reports",      icon: "⎙", label: "Reports" },
  { id: "manual",       icon: "⋟", label: "Technical Manual" },
  { id: "debut_report", icon: "⬟", label: "Debug Report" },
];

function Sidebar({ page, setPage, onLogout, proj }) {
  return <div style={{
    width: 240, background: T.bg1,
    borderRight: `1px solid rgba(255,255,255,0.06)`,
    display: "flex", flexDirection: "column",
    height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 200, overflowY: "auto",
    color: "#C8D8E8",
  }}>
    {/* Brand header — no logo */}
    <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#E8F0F8", letterSpacing: "0.5px", lineHeight: 1 }}>StimOPTI</div>
        <div style={{ fontSize: 9, color: "#6080A0", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 3 }}>Kemiserve FZE</div>
      </div>
      {proj && <div style={{ marginTop: 7, padding: "3px 8px", background: "rgba(0,0,0,0.3)", fontSize: 10, color: "#90A8C0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "2px solid #C87000" }}>
        {proj}
      </div>}
    </div>
    {/* Navigation */}
    <nav style={{ flex: 1, padding: "4px 0", overflowY: "auto" }}>
      {NAV.map((item, i) => {
        if (!item) {
          // Separator — show group label for what follows
          const next = NAV[i+1];
          if (!next) return null;
          const LABELS = {
            req:"Required Inputs", opt:"Optional Inputs",
            sim:"Simulation", output:"Output", top:""
          };
          const lbl = LABELS[next.group] || "";
          return lbl ? (
            <div key={i} style={{
              padding:"8px 14px 3px", fontSize:10, fontWeight:700, color:"#506880",
              textTransform:"uppercase", letterSpacing:"1px", marginTop:6,
              borderTop:"1px solid rgba(255,255,255,0.08)"
            }}>{lbl}</div>
          ) : <div key={i} style={{height:4}}/>;
        }
        const active = page === item.id;
        return <div key={item.id}
          onClick={() => setPage(item.id)}
          className={"nav-item" + (active ? " active" : "")}
          style={item.accent ? {color:"#6ECFF6",fontWeight:700} : {}}>
          <span style={{ fontSize: 14 }}>{item.label}</span>
          {item.group==="opt" && !active && (
            <span style={{fontSize:9,color:"#506880",marginLeft:"auto",flexShrink:0}}>opt</span>
          )}
        </div>;
      })}
    </nav>
    {/* Sign out */}
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "4px 0" }}>
      <div onClick={onLogout} className="nav-item" style={{ color: "#E08080" }}>
        <span style={{ fontSize: 11, width: 16, textAlign: "center" }}>x</span>
        <span style={{ fontSize: 11 }}>Sign Out</span>
      </div>
    </div>
  </div>;
}

// ─── LOGIN — Engineering platform login, StimPRO style ────────────────────────
function Login({ onLogin }) {
  const [u, setU] = useState("stimopti");
  const [p, setP] = useState("1234");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  function go() {
    if (busy) return;
    if (u.trim().toLowerCase() === "stimopti" && p.trim() === "1234") { setBusy(true); setTimeout(() => onLogin(), 600); }
    else setErr("Invalid credentials. Use stimopti / 1234");
  }

  const feats = [
    "Depth-referenced matrix acid placement simulation",
    "Integrated fluids library with HCl / HF / organic acid systems",
    "Pressure solver: BHP / WHP / TP vs time & depth",
    "Skin evolution & PI improvement analysis",
    "Diverter & stage sensitivity optimization",
    "PDF / Excel report generation",
  ];

  return <div style={{ minHeight: "100vh", display: "flex", background: "#B8C8D4", fontFamily: T.sans }}>
    {/* Left panel — product identity */}
    <div style={{
      width: 480, background: T.bg1, display: "flex", flexDirection: "column",
      borderRight: "3px solid #0078A8",
    }}>
      {/* Header band */}
      <div style={{ background: "rgba(0,0,0,0.35)", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="44" height="44" viewBox="0 0 60 60">
            <rect x="22" y="2" width="16" height="44" fill="none" stroke="#6ECFF6" strokeWidth="2"/>
            <rect x="10" y="26" width="40" height="4" fill="#C87000"/>
            <line x1="30" y1="46" x2="30" y2="56" stroke="#6ECFF6" strokeWidth="2.5"/>
            <line x1="18" y1="52" x2="42" y2="52" stroke="#6ECFF6" strokeWidth="2"/>
            <rect x="26" y="6" width="8" height="6" fill="rgba(110,207,246,0.15)" stroke="#6ECFF6" strokeWidth="1"/>
          </svg>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#E8F4FF", letterSpacing: "1px" }}>StimOPTI</div>
            <div style={{ fontSize: 9, color: "#607090", letterSpacing: "2.5px", textTransform: "uppercase", marginTop: 3 }}>
              Matrix Acid Design Platform
            </div>
          </div>
        </div>
      </div>
      {/* Description */}
      <div style={{ padding: "24px 28px", flex: 1 }}>
        <div style={{ fontSize: 11, color: "#607090", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16, fontWeight: 700 }}>Platform Capabilities</div>
        {feats.map(f => <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11 }}>
          <div style={{ width: 14, height: 14, background: "rgba(0,120,168,0.25)", border: "1px solid #0078A8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <span style={{ color: "#6ECFF6", fontSize: 8, fontWeight: 700 }}>+</span>
          </div>
          <span style={{ fontSize: 12, color: "#9AB0C8", lineHeight: 1.5 }}>{f}</span>
        </div>)}
      </div>
      {/* Footer */}
      <div style={{ padding: "12px 28px", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 10, color: "#405060" }}>
        v5.0.0 &nbsp;|&nbsp; Kemiserve FZE, SPC Freezone, Sharjah, UAE &nbsp;|&nbsp; Confidential
      </div>
    </div>

    {/* Right panel — login form */}
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#C8D8E4" }}>
      <div style={{ width: 340, background: T.bg2, border: `1px solid ${T.border1}`, borderTop: `3px solid ${T.teal}`, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text0, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>User Authentication</div>
        <div style={{ fontSize: 11, color: T.text2, marginBottom: 20, borderBottom: `1px solid ${T.border0}`, paddingBottom: 12 }}>Enter your credentials to access StimOPTI</div>

        <div style={{ marginBottom: 12 }}>
          <Lbl>Username</Lbl>
          <input className="si" value={u} onChange={e => setU(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={{ height: 28 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Lbl>Password</Lbl>
          <input type="password" className="si" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} style={{ height: 28 }} />
        </div>

        {err && <div style={{ color: T.red, fontSize: 11, marginBottom: 12, padding: "6px 10px", background: "#FCE8E8", border: `1px solid ${T.red}`, borderLeft: `3px solid ${T.red}` }}>{err}</div>}

        <div onClick={go} style={{
          background: busy ? T.tealDim : T.teal, color: "#fff",
          padding: "9px 0", fontSize: 12, fontWeight: 700,
          textAlign: "center", cursor: busy ? "wait" : "pointer",
          userSelect: "none", border: `1px solid ${T.tealDim}`,
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>
          {busy ? "Authenticating..." : "Login"}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: T.text3, marginTop: 14 }}>Kemiserve FZE · StimOPTI v5.0</div>
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
    <Topbar title="Dashboard" sub="Matrix Acid Stimulation Projects" actions={<Btn v="a" onClick={() => setShowNew(true)}>New Project</Btn>} />
    <div style={{ padding: 22 }}>
      <G4><Met label="Total Projects" value={projects.length} /><Met label="Simulated" value={projects.filter(p => p.hasRun).length} color={T.green} /><Met label="Draft" value={projects.filter(p => !p.hasRun).length} color={T.gold} /><Met label="Reports" value={0} color={T.text2} /></G4>
      <div style={{ marginTop: 22 }}>
        {projects.length === 0
          ? <Card><div style={{ textAlign: "center", padding: "48px 0", color: T.text1 }}><div style={{ fontSize: 38, marginBottom: 10 }}>⊡</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text0, marginBottom: 6 }}>No projects yet</div><div style={{ fontSize: 12, color: T.text2, marginBottom: 18 }}>Create your first matrix acid stimulation project</div><Btn v="a" onClick={() => setShowNew(true)}>+ Create First Project</Btn></div></Card>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map(p => <div key={p.id} style={{ background: T.bg2, border: `1px solid ${T.border0}`, borderRadius: 0, padding: "10px 14px", borderLeft: `3px solid ${p.hasRun ? T.green : T.gold}`, display: "flex", alignItems: "center", gap: 14, marginBottom: 2 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text0 }}>{p.name}</div>
                  <Bdg color={p.hasRun ? "green" : "gold"} label={p.hasRun ? "Simulated" : "Draft"} />
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.text2, flexWrap: "wrap" }}>
                  <span>Well: {p.well}</span><span>Field: {p.field}</span><span>Inj: {p.injection}</span><span>Units: {p.unit}</span><span>Grid: {p.grid}</span>
                  <span>Created: {p.createdAt}</span>{p.version && <span style={{color:T.teal}}>v{p.version}</span>}
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
      <div style={{ background: T.bg2, border: `1px solid ${T.border1}`, borderTop: `3px solid ${T.teal}`, borderRadius: 0, padding: "24px 28px", width: 500, boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text0, marginBottom: 4 }}>Create New Project</div>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 22 }}>Define project parameters</div>
        <G2 gap={12}><Fld label="Project Name" value={f.name} onChange={v => setF(x => ({ ...x, name: v }))} /><Fld label="Well Name" value={f.well} onChange={v => setF(x => ({ ...x, well: v }))} /><Fld label="Field / Client" value={f.field} onChange={v => setF(x => ({ ...x, field: v }))} /><Fld label="Unit System" type="select" value={f.unit} onChange={v => setF(x => ({ ...x, unit: v }))} options={["Field (Imperial)", "Metric (SI)"]} /><Fld label="Injection Type" type="select" value={f.injection} onChange={v => setF(x => ({ ...x, injection: v }))} options={["Bullhead", "Coil Tubing"]} /><Fld label="Depth Grid" type="select" value={f.grid} onChange={v => setF(x => ({ ...x, grid: v }))} options={["0.5 ft", "1 ft", "2 ft"]} /></G2>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><Btn v="a" onClick={create} sx={{ flex: 1 }}>Create Project</Btn><Btn v="g" onClick={() => setShowNew(false)}>Cancel</Btn></div>
      </div>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HUB — Central input panel matching reference PDF layout
// Each module opens as a modal overlay with Previous / Close / Next buttons
// ═══════════════════════════════════════════════════════════════════════════

// InputModal: wraps a page in a modal dialog with Previous/Close/Next buttons
function InputModal({ title, children, onClose, onPrev, onNext, nextLabel, prevLabel }) {
  return <div style={{
    position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
    zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:20
  }}>
    <div style={{
      background:"#fff", width:"88vw", maxWidth:920, maxHeight:"88vh",
      display:"flex", flexDirection:"column", borderRadius:2,
      boxShadow:"0 8px 40px rgba(0,0,0,0.35)", border:"1px solid #B0BEC8",
    }} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{
        background:T.bg3, borderBottom:`1px solid ${T.border0}`,
        padding:"8px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
      }}>
        <span style={{fontSize:13,fontWeight:700,color:T.text0,textTransform:"uppercase",letterSpacing:"0.3px"}}>{title}</span>
        <div onClick={onClose} style={{cursor:"pointer",color:T.text2,fontSize:18,lineHeight:1,padding:"0 4px",userSelect:"none"}}>x</div>
      </div>
      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>{children}</div>
      {/* Footer: Previous / Close / Next */}
      <div style={{
        padding:"8px 18px", borderTop:`1px solid ${T.border0}`, display:"flex",
        justifyContent:"flex-end", gap:8, background:T.bg3, flexShrink:0,
      }}>
        {onPrev && <div onClick={onPrev} style={{
          padding:"5px 18px", cursor:"pointer", fontSize:12, fontWeight:600,
          background:T.bg2, border:`1px solid ${T.border1}`, color:T.text1,
        }}>{prevLabel||"Previous"}</div>}
        <div onClick={onClose} style={{
          padding:"5px 18px", cursor:"pointer", fontSize:12, fontWeight:600,
          background:T.red, color:"#fff", border:`1px solid ${T.redDim}`,
        }}>Close</div>
        {onNext && <div onClick={onNext} style={{
          padding:"5px 18px", cursor:"pointer", fontSize:12, fontWeight:700,
          background:T.teal, color:"#fff", border:`1px solid ${T.tealDim}`,
        }}>{nextLabel||"Next"}</div>}
      </div>
    </div>
  </div>;
}

// InputHub: the central "INPUT DATA" portal page with tile buttons
function InputHubPage({ setPage }) {
  const REQ = [
    {id:"reservoir",       label:"Reservoir Data"},
    {id:"well",            label:"Well & Completion"},
    {id:"pumping_data",    label:"Pumping Data"},
    {id:"recipe_design",   label:"Recipe Design"},
    {id:"damage_type",     label:"Damage Type"},
    {id:"rock_props",      label:"Rock Properties"},
    {id:"schedule",        label:"Pumping Schedule"},
  ];
  const OPT = [
    {id:"fluids",     label:"Fluids Library"},

    {id:"coreflood",  label:"Core Flood Data"},
    {id:"resv_fluid", label:"Reservoir Fluid Properties"},
  ];

  function Tile({ m, optional }) {
    return <div onClick={()=>setPage(m.id)} style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"11px 16px", minWidth:200, cursor:"pointer",
      border:`1px solid ${optional?T.border1:T.teal}`,
      borderLeft:`3px solid ${optional?T.border1:T.teal}`,
      borderRadius:0, background:"#fff",
      fontSize:12, fontWeight:600, color:T.text0, gap:8,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
    }}
    onMouseEnter={e=>{e.currentTarget.style.background="#EAF5FF";}}
    onMouseLeave={e=>{e.currentTarget.style.background="#fff";}}>
      <span>{m.label}</span>
      {!optional && <span style={{fontSize:10,color:T.red,fontWeight:700}}>*</span>}
      {optional  && <span style={{fontSize:10,color:T.text3,fontStyle:"italic"}}>(Optional)</span>}
    </div>;
  }

  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto"}}>
    <Topbar title="Input Data" sub="Complete all required inputs before running simulation"/>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:900,width:"100%"}}>
        <div style={{textAlign:"center",padding:"14px 0 10px",marginBottom:18,borderBottom:`2px solid ${T.teal}`}}>
          <div style={{fontSize:17,fontWeight:700,color:T.text0,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>INPUT DATA</div>
          <div style={{width:22,height:22,borderRadius:"50%",background:T.teal,margin:"0 auto",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:12,fontWeight:700}}>i</span>
          </div>
        </div>

        <div style={{marginBottom:8,padding:"5px 10px",background:T.bg3,border:`1px solid ${T.border0}`,
          display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontWeight:700,color:T.teal,textTransform:"uppercase",letterSpacing:"1px"}}>Required Inputs</span>
          <span style={{fontSize:10,color:T.text3}}>— Must be completed before running simulation</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))",gap:8,marginBottom:20}}>
          {REQ.map(m=><Tile key={m.id} m={m} optional={false}/>)}
        </div>

        <div style={{marginBottom:8,padding:"5px 10px",background:T.bg3,border:`1px solid ${T.border0}`,
          display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontWeight:700,color:T.text3,textTransform:"uppercase",letterSpacing:"1px"}}>Optional Inputs</span>
          <span style={{fontSize:10,color:T.text3}}>— Pre-filled with engineering defaults</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))",gap:8,marginBottom:14}}>
          {OPT.map(m=><Tile key={m.id} m={m} optional={true}/>)}
        </div>

        <div style={{textAlign:"center",fontSize:11,color:T.text3}}>
          * Required. Optional fields use engineering defaults if not entered.
        </div>
      </div>
    </div>
  </div>;
}


// ─── RESERVOIR DATA ───────────────────────────────────────────────────────────
function ReservoirPage({ project, setPage, rows, setRows }) {
  const [localRows, setLocalRows] = useState(INIT_RESERVOIR.map(r=>({...r})));
  const data   = rows   || localRows;
  const setData= setRows|| setLocalRows;
  const [tab, setTab] = useState("table");
  const [importMsg, setImportMsg] = useState("");
  // Nav sequence
  const SEQ = ["reservoir","well","pumping_data","main_fluid","injection_fluid","damage_type","rock_props","resv_fluid","coreflood","schedule","recipe_design","fluids"];
  const myIdx = 0;

  // Merged table: reservoir + rock props columns as per reference PDF
  const resCols = [
    {key:"top",  label:"From MD (FT)",        w:80},
    {key:"bot",  label:"To MD (FT)",          w:80},
    {key:"tvd",  label:"TVD (FT, Top Depth)", w:100},
    {key:"por",  label:"Poro (%)",            w:60},
    {key:"perm", label:"Perm (mD)",           w:70},
    {key:"pres", label:"Zonal Press (Psi)",   w:90},
    {key:"skin", label:"Damage Skin",         w:70},
    {key:"khkv", label:"KH/KV",              w:60},
    // Merged rock props
    {key:"calcite",  label:"wt% Calcite",   w:70},
    {key:"dolomite", label:"wt% Dolomite",  w:70},
    {key:"shale",    label:"wt% Shale",     w:60},
    {key:"dmgR",     label:"Dmg Radius (ft)",w:75},
  ];

  return <InputModal
    title="Reservoir Data"
    onClose={()=>setPage("inputs")}
    onNext={()=>{
      try {
        // Auto-fill tubLen from last reservoir layer's To-depth
        if (data && data.length > 0 && typeof setWellData === 'function') {
          const bots = data.map(r => +r.bot || 0).filter(v => v > 0);
          if (bots.length > 0) {
            const lastBot = Math.max(...bots);
            setWellData(prev => ({...(prev||{}), tubLen: String(lastBot)}));
          }
        }
      } catch(e) { /* non-critical — don't block navigation */ }
      setPage(SEQ[myIdx+1]);
    }}
    nextLabel="Next"
  >
    <div style={{marginBottom:8,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>

      {/* ── Download CSV template ── */}
      <Btn sz="s" v="g" onClick={()=>{
        const csv=[
          "From MD (FT),To MD (FT),TVD (FT),Poro (%),Perm (mD),Zonal Press (Psi),Damage Skin,KH/KV,wt% Calcite,wt% Dolomite,wt% Shale,Dmg Radius (ft),Lithology",
          "8200,8255,8200,18.5,85,3690,12.4,1,100,0,0,1.0,Carbonate",
          "8255,8315,8255,22.1,142,3715,8.7,1,100,0,0,1.0,Carbonate",
          "8315,8380,8315,19.8,110,3740,10.2,1,80,20,0,1.0,Dolomite",
        ].join("\n");
        const blob=new Blob([csv],{type:"text/csv"});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");a.href=url;
        a.download="ReservoirData_Template.csv";
        document.body.appendChild(a);a.click();
        document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url),2000);
      }}>↓ Template</Btn>

      {/* ── Import CSV / Excel ── */}
      <label style={{display:"inline-flex",alignItems:"center",gap:4,
        padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:700,
        background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}}>
        ↑ Import CSV/Excel
        <input type="file" accept=".csv,.txt,.xlsx,.xls" style={{display:"none"}}
          onChange={e=>{
            const file=e.target.files[0]; if(!file) return;
            e.target.value="";
            const nm=file.name.toLowerCase();

            const COL_MAP={
              "from md":"top","from md (ft)":"top","top":"top","top md":"top","md top":"top","from depth":"top",
              "to md":"bot","to md (ft)":"bot","bot":"bot","bottom md":"bot","md bottom":"bot","to depth":"bot",
              "tvd":"tvd","tvd (ft)":"tvd","true vertical depth":"tvd",
              "poro":"por","poro (%)":"por","porosity":"por","por":"por","porosity (%)":"por","phi":"por",
              "perm":"perm","perm (md)":"perm","permeability":"perm","k (md)":"perm","permeability (md)":"perm","k":"perm",
              "zonal press":"pres","zonal press (psi)":"pres","pressure":"pres","pres":"pres","pressure (psi)":"pres","pi":"pres","reservoir pressure":"pres",
              "damage skin":"skin","skin":"skin","skin factor":"skin","s":"skin",
              "kh/kv":"khkv","kh/kv ratio":"khkv","anisotropy":"khkv","kv/kh":"khkv",
              "wt% calcite":"calcite","calcite":"calcite","calcite (%)":"calcite",
              "wt% dolomite":"dolomite","dolomite":"dolomite","dolomite (%)":"dolomite",
              "wt% shale":"shale","shale":"shale","shale (%)":"shale",
              "dmg radius":"dmgR","dmg radius (ft)":"dmgR","damage radius":"dmgR","dmgr":"dmgR","rs":"dmgR",
              "lithology":"lith","lith":"lith","rock type":"lith","formation":"lith",
            };

            function parseCSV(text){
              const lines=text.trim().split(/\r?\n/);
              if(lines.length<2){setImportMsg("\u26a0 File needs a header row and at least one data row.");return;}
              const hdrs=lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/["']/g,""));
              const keys=hdrs.map(h=>COL_MAP[h]||null);
              if(!keys.includes("top")){setImportMsg("\u26a0 Missing 'From MD' column — download template to see required format.");return;}
              if(!keys.includes("bot")){setImportMsg("\u26a0 Missing 'To MD' column — download template to see required format.");return;}
              const parsed=lines.slice(1).filter(l=>l.trim()).map((line,li)=>{
                const vals=line.split(",").map(v=>v.trim().replace(/^["']|["']$/g,""));
                const row={id:Date.now()+li,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1,lith:"Carbonate"};
                keys.forEach((key,ci)=>{
                  if(key&&vals[ci]!==undefined&&vals[ci]!==""){
                    row[key]=key==="lith"?vals[ci]:(parseFloat(vals[ci])||0);
                  }
                });
                if(!row.tvd&&row.top) row.tvd=row.top;
                return row;
              }).filter(r=>(+r.top)>0&&(+r.bot)>0);
              if(!parsed.length){setImportMsg("\u26a0 No valid rows found — check column names match template.");return;}
              setData(parsed);
              setImportMsg("\u2713 Imported "+parsed.length+" interval"+(parsed.length!==1?"s":"")+" from "+file.name);
              setTimeout(()=>setImportMsg(""),6000);
            }

            if(nm.endsWith(".csv")||nm.endsWith(".txt")){
              const r=new FileReader();r.onload=ev=>parseCSV(ev.target.result);r.readAsText(file);
            } else if(nm.endsWith(".xlsx")||nm.endsWith(".xls")){
              const r=new FileReader();r.onload=ev=>{
                try{
                  if(!window.XLSX){setImportMsg("\u26a0 For Excel: export as .csv from Excel then import that file. Use '\u2193 Template' to see the correct column format.");return;}
                  const wb=window.XLSX.read(ev.target.result,{type:"binary"});
                  parseCSV(window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));
                }catch(err){setImportMsg("\u26a0 Excel parse error: "+err.message+". Try File > Save As > CSV in Excel.");}
              };r.readAsBinaryString(file);
            } else {setImportMsg("\u26a0 Unsupported file type. Use .csv or .xlsx");}
          }}
        />
      </label>

      <Btn sz="s" v="g" onClick={()=>setData(DEFAULTS.reservoir.map(r=>({...r,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1.0})))}>Reset</Btn>
      <Btn sz="s" v="o" onClick={()=>{
        const last=data[data.length-1]||{top:8200,bot:8255,tvd:8200,perm:100,por:15,pres:3690,skin:10,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1};
        setData([...data,{id:Date.now(),top:last.bot,bot:last.bot+55,tvd:last.bot,perm:last.perm,por:last.por,pres:last.pres,skin:last.skin,khkv:1,calcite:100,dolomite:0,shale:0,dmgR:1,lith:"Carbonate"}]);
      }}>+ Add Row</Btn>
      <span style={{fontSize:11,color:T.text2,marginLeft:"auto"}}>{data.length} interval{data.length!==1?"s":""}</span>
    </div>

    {/* Import status message */}
    {importMsg && <div style={{
      padding:"5px 12px",marginBottom:8,fontSize:11,fontWeight:600,
      background:importMsg.startsWith("\u2713")?"#E8F5E9":"#FFF8E1",
      color:importMsg.startsWith("\u2713")?"#2E7D32":"#E65100",
      border:"1px solid "+(importMsg.startsWith("\u2713")?"#A5D6A7":"#FFD54F"),
    }}>{importMsg}</div>}
    {/* Merged table: reservoir + rock props */}
    <div style={{overflowX:"auto",borderRadius:0,border:`1px solid ${T.border0}`}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead>
          <tr style={{background:T.bg3}}>
            {resCols.map(c=><th key={c.key} style={{
              padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.text1,
              borderBottom:`2px solid ${T.border0}`,borderRight:`1px solid ${T.border0}`,
              whiteSpace:"nowrap",fontSize:10,
            }}>{c.label}</th>)}
            <th style={{padding:"6px 8px",fontSize:10,fontWeight:700,color:T.text1,borderBottom:`2px solid ${T.border0}`}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r,i)=><tr key={r.id||i} style={{background:i%2===0?"#fff":"#F4F8FC"}}>
            {resCols.map(c=><td key={c.key} style={{padding:"3px 4px",borderBottom:`1px solid ${T.border0}`,borderRight:`1px solid rgba(0,0,0,0.04)`}}>
              <input className="si" style={{width:c.w||60,fontSize:10,height:22,padding:"2px 4px"}}
                value={r[c.key]??""} onChange={e=>{
                  const v=e.target.value;
                  setData(ds=>ds.map((d,j)=>j===i?{...d,[c.key]:v}:d));
                }}/>
            </td>)}
            <td style={{padding:"3px 6px",borderBottom:`1px solid ${T.border0}`}}>
              <span onClick={()=>setData(ds=>ds.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:T.red,fontSize:12,fontWeight:700}}>x</span>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {/* Stats row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:12}}>
      <Met label="Intervals" value={data.length} />
      <Met label="Avg Porosity" value={(data.reduce((s,r)=>s+(+r.por||0),0)/(data.length||1)).toFixed(1)} unit="%" color={T.teal}/>
      <Met label="Avg Perm" value={(data.reduce((s,r)=>s+(+r.perm||0),0)/(data.length||1)).toFixed(0)} unit="md" color={T.blue}/>
      <Met label="Avg Skin" value={(data.reduce((s,r)=>s+(+r.skin||0),0)/(data.length||1)).toFixed(1)} color={T.red}/>
    </div>
  </InputModal>;
}


// ─── WELL & COMPLETION ────────────────────────────────────────────────────────
function WellPage({ project, setPage, wellData: extWell, setWellData: extSetWell }) {
  const DFL = {
    type:"Producer", profile:"Vertical", wbR:"3", drainR:"1000", inc:"0",
    compType:"Open Hole", tubLen:"10837", tubID:"4",
    perfPenLen:"0.5", perfDia:"0.4", spf:"4", casID_ch:"4", perfStart:"8200", perfEnd:"8540",
    slotType:"Open", slotWidth:"0.03", slotLength:"1", slotPerUnit:"2",
    slotAroundCirc:"4", linerID:"4", turbulenceFactor:"1260", openAreaSingle:"1",
    le_nozzleDia:"0.25", le_spf:"1", le_casID:"4", le_nozzleEntry:"0.6",
    ss_type:"Closed", ss_nozzleDia:"0.25", ss_spf:"1", ss_casID:"4",
    hzLen:"1000", hzH:"500", khkv:"1",
  };
  const [localW, setLocalW] = useState({...DFL});
  const w   = extWell  || localW;
  const setW = extSetWell || setLocalW;
  const [perfRows,setPerfRows] = useState([
    {id:1,top:8200,bot:8255,spf:4,dia:0.35,phase:"60°"},
    {id:2,top:8480,bot:8540,spf:4,dia:0.35,phase:"60°"},
  ]);
  const COMP_DEFAULTS_MAP = {
    "Open Hole":      { tubLen:"10837.0", tubID:"2.55" },
    "Cased Hole":     { tubLen:"10837.0", tubID:"2.55", perfPenLen:"0.5", perfDia:"0.4", spf:"1", casID_ch:"4", perfStart:"", perfEnd:"" },
    "Slotted Liner":  { tubLen:"10837.0", tubID:"2.55", perfPenLen:"0.5", perfDia:"0.4", spf:"1", casID_ch:"4",
                        slotType:"Open", slotWidth:"0.01", linerID:"4", slotLength:"1", slotPerUnit:"2.0",
                        slotAroundCirc:"4", turbulenceFactor:"1260", openAreaSingle:"1" },
    "Limited Entry":  { tubLen:"10837.0", tubID:"2.55", le_perfPenLen:"0.5", le_nozzleDia:"0.4", le_spf:"1",
                        le_nozzleEntry:"0.0", le_casID:"4" },
    "Sliding Sleeve": { tubLen:"10837.0", tubID:"2.55", ss_type:"Closed", ss_perfPenLen:"0.5",
                        ss_nozzleDia:"0.4", ss_spf:"1", ss_casID:"4" },
  };
  // f(): setter that auto-merges COMP_DEFAULTS when compType changes
  const f = k => v => {
    if (k === "compType") {
      const current = extWell || localW;
      const merged = {...current, compType:v, ...(COMP_DEFAULTS_MAP[v]||{})};
      if (extSetWell) extSetWell(merged); else setLocalW(merged);
    } else {
      setW(x => ({...x, [k]:v}));
    }
  };
  const [editing, setEditing] = useState(false);
  const ct = w.compType || "Open Hole";
  // wEff: COMP_DEFAULTS as base so undefined fields always show correct defaults
  const wEff = {...(COMP_DEFAULTS_MAP[ct]||{}), ...w};
  const PROFILES   = ["Vertical","Horizontal","Slanted"];
  const COMP_TYPES = ["Open Hole","Cased Hole","Slotted Liner","Limited Entry","Sliding Sleeve"];
  const isH = w.profile==="Horizontal", isS = w.profile==="Slanted";
  const SEQ_IDX = 1;

  // Left panel: profile summary card  
  function WellSummaryPanel() {
    return <div style={{background:"#EAF5FF",border:"1px solid #B0CCDF",padding:"12px 14px",marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontWeight:700,fontSize:10,color:T.text2,textTransform:"uppercase",borderBottom:`1px solid ${T.border0}`,paddingBottom:5}}>
        <span>{w.profile.toUpperCase()}</span>
          <span style={{color:T.gold,cursor:"pointer"}} onClick={()=>setEditing(e=>!e)}>
            {editing?"Done":"Edit"}
          </span>
      </div>
      {[
        ["WELL TYPE", w.type],
        ["WELLBORE RADIUS (INCH)", w.wbR],
        ["DRAINAGE RADIUS (FT)", w.drainR],
        ["WELL INCLINATION (0-90)", w.inc],
        ...(isH?[["LENGTH OF HORIZONTAL SECTION (FT)",w.hzLen],["HEIGHT OF RESERVOIR (FT)",w.hzH]]:[]),
        ...(isS?[["KH/KV RATIO",w.khkv]]:[]),
      ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11}}>
        <span style={{color:T.text2}}>{k}</span>
        <span style={{fontFamily:T.mono,color:T.text0,fontWeight:600}}>{v}</span>
      </div>)}
    </div>;
  }

  function CompSummaryPanel() {
    const rows = ct==="Open Hole" ? [
      ["COMPLETION TYPE","OPEN HOLE"],
      ["PRODUCTION TUBING LENGTH (FT)",wEff.tubLen],
      ["PRODUCTION TUBING INNER DIAMETER (INCH)",wEff.tubID],
    ] : ct==="Cased Hole" ? [
      ["COMPLETION TYPE","CASED HOLE"],
      ["PRODUCTION TUBING LENGTH (FT)",wEff.tubLen],
      ["PRODUCTION TUBING INNER DIAMETER (INCH)",wEff.tubID],
      ["PERFORATION PENETRATION LENGTH (FT)",wEff.perfPenLen],
      ["PERFORATION DIAMETER (INCH)",wEff.perfDia],
      ["SHOTS PER FOOT (SPF)",wEff.spf],
      ["CASING INNER DIAMETER (INCH)",wEff.casID_ch],
    ] : ct==="Slotted Liner" ? [
      ["COMPLETION TYPE","SLOTTED LINER"],
      ["PRODUCTION TUBING LENGTH (FT)",wEff.tubLen],
      ["PRODUCTION TUBING INNER DIAMETER (INCH)",wEff.tubID],
      ["PERFORATION PENETRATION LENGTH (FT)",wEff.perfPenLen],
      ["PERFORATION DIAMETER (INCH)",wEff.perfDia],
      ["SHOTS PER FOOT (SPF)",wEff.spf],
      ["CASING INNER DIAMETER (INCH)",wEff.casID_ch],
      ["SLOT TYPE",wEff.slotType],["WIDTH OF SINGLE SLOT (INCH)",wEff.slotWidth],
    ] : ct==="Limited Entry" ? [
      ["COMPLETION TYPE","LIMITED ENTRY"],
      ["PRODUCTION TUBING LENGTH (FT)",wEff.tubLen],
      ["PRODUCTION TUBING INNER DIAMETER (INCH)",wEff.tubID],
      ["PERFORATION PENETRATION LENGTH (FT)",wEff.perfPenLen],
      ["NOZZLE DIAMETER (INCH)",wEff.le_nozzleDia],
      ["SHOTS PER FOOT (SPF)",wEff.le_spf],
      ["CASING INNER DIAMETER (INCH)",wEff.le_casID],
    ] : [
      ["COMPLETION TYPE","SLIDING SLEEVE"],
      ["SLIDING SLEEVE TYPE",wEff.ss_type],
      ["PRODUCTION TUBING LENGTH (FT)",wEff.tubLen],
      ["PRODUCTION TUBING INNER DIAMETER (INCH)",wEff.tubID],
    ];
    return <div style={{background:"#EAF5FF",border:"1px solid #B0CCDF",padding:"12px 14px",marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontWeight:700,fontSize:10,color:T.text2,textTransform:"uppercase",borderBottom:`1px solid ${T.border0}`,paddingBottom:5}}>
        <span>{ct.toUpperCase()}</span>
        <span style={{color:T.gold,cursor:"pointer"}} onClick={()=>setEditing(e=>!e)}>
          {editing?"✓ Done":"Edit"}
        </span>
      </div>
      {rows.map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11}}>
        <span style={{color:T.text2,fontSize:10}}>{k}</span>
        <span style={{fontFamily:T.mono,color:T.text0,fontWeight:600,fontSize:11}}>{v}</span>
      </div>)}
    </div>;
  }

  return <InputModal title="Well & Completion Data"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("reservoir")} prevLabel="Previous"
    onNext={()=>setPage("pumping_data")} nextLabel="Next"
  >
    {/* Type + Profile selectors */}
    <div style={{display:"flex",gap:24,marginBottom:14,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:5}}>Select Well Type</div>
        <div style={{display:"flex",gap:6}}>
          {["Producer","Injector"].map(t=><div key={t} onClick={()=>f("type")(t)} style={{
            padding:"5px 18px",cursor:"pointer",fontWeight:700,fontSize:11,borderRadius:3,
            background:w.type===t?T.teal:"#fff",color:w.type===t?"#fff":T.text1,
            border:`1.5px solid ${w.type===t?T.teal:T.border1}`,
          }}>{t}</div>)}
        </div>
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:5}}>Select Well Profile</div>
        <div style={{display:"flex",gap:6}}>
          {PROFILES.map(p=><div key={p} onClick={()=>f("profile")(p)} style={{
            padding:"5px 18px",cursor:"pointer",fontWeight:700,fontSize:11,borderRadius:3,
            background:w.profile===p?T.teal:"#fff",color:w.profile===p?"#fff":T.text1,
            border:`1.5px solid ${w.profile===p?T.teal:T.border1}`,
          }}>{p}</div>)}
        </div>
      </div>
    </div>
    {/* Completion type */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:5}}>Select Completion Type</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {COMP_TYPES.map(c=><div key={c} onClick={()=>f("compType")(c)} style={{
          padding:"5px 14px",cursor:"pointer",fontWeight:700,fontSize:11,borderRadius:3,
          background:ct===c?T.teal:"#fff",color:ct===c?"#fff":T.text1,
          border:`1.5px solid ${ct===c?T.teal:T.border1}`,
        }}>{c}</div>)}
      </div>
    </div>
    {/* Two-column summary (matching reference PDF layout) */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#fff",padding:"6px 10px",background:T.teal,letterSpacing:"0.3px"}}>
          {w.profile.toUpperCase()}
        </div>
        <WellSummaryPanel/>
        {/* Editable fields — shown when editing */}
        {editing && <div style={{marginTop:12,display:"grid",gap:8}}>
          <Fld label="Wellbore Radius (in)" value={w.wbR} onChange={f("wbR")}/>
          <Fld label="Drainage Radius (ft)" value={w.drainR} onChange={f("drainR")}/>
          {(isH||isS) && <Fld label="Well Inclination (0-90)" value={w.inc} onChange={f("inc")}/>}
          {isH && <><Fld label="Length of Horizontal Section (ft)" value={w.hzLen} onChange={f("hzLen")}/><Fld label="Height of Reservoir (ft)" value={w.hzH} onChange={f("hzH")}/></>}
          {isS && <Fld label="Kh/Kv Ratio" value={w.khkv} onChange={f("khkv")}/>}
        </div>}
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#fff",padding:"6px 10px",background:T.teal,letterSpacing:"0.3px"}}>
          {ct.toUpperCase()}
        </div>
        <CompSummaryPanel/>
        {editing && <div style={{marginTop:12,display:"grid",gap:8}}>
          <Fld label="Production Tubing Length (ft)" value={w.tubLen} onChange={f("tubLen")}/>
          <Fld label="Production Tubing Inner Diameter (in)" value={w.tubID} onChange={f("tubID")}/>
          {ct!=="Open Hole" && <><Fld label="Perforation Penetration Length (ft)" value={w.perfPenLen} onChange={f("perfPenLen")}/><Fld label="Perforation Diameter (in)" value={w.perfDia} onChange={f("perfDia")}/><Fld label="Shots Per Foot (SPF)" value={w.spf} onChange={f("spf")}/><Fld label="Casing Inner Diameter (in)" value={w.casID_ch} onChange={f("casID_ch")}/></>}
          {ct==="Slotted Liner" && <><Fld label="Slot Type" type="select" value={w.slotType} onChange={f("slotType")} options={["Open","Keystone","Wire Wrap"]}/><Fld label="Liner Inner Diameter (in)" value={w.linerID} onChange={f("linerID")}/><Fld label="Width of Single Slot (in)" value={w.slotWidth} onChange={f("slotWidth")}/><Fld label="Length of Single Slot (in)" value={w.slotLength} onChange={f("slotLength")}/><Fld label="No. Slots per Unit" value={w.slotPerUnit} onChange={f("slotPerUnit")}/><Fld label="No. Slots Around Circumference" value={w.slotAroundCirc} onChange={f("slotAroundCirc")}/><Fld label="Turbulence Factor" value={w.turbulenceFactor} onChange={f("turbulenceFactor")}/></>}
          {ct==="Limited Entry" && <><Fld label="Nozzle Diameter (in)" value={w.le_nozzleDia} onChange={f("le_nozzleDia")}/><Fld label="SPF" value={w.le_spf} onChange={f("le_spf")}/><Fld label="Casing Inner Diameter (in)" value={w.le_casID} onChange={f("le_casID")}/></>}
          {ct==="Sliding Sleeve" && <><Fld label="Sleeve Type" type="select" value={w.ss_type} onChange={f("ss_type")} options={["Open","Closed"]}/><Fld label="Nozzle Diameter (in)" value={w.ss_nozzleDia} onChange={f("ss_nozzleDia")}/><Fld label="SPF" value={w.ss_spf} onChange={f("ss_spf")}/><Fld label="Casing Inner Diameter (in)" value={w.ss_casID} onChange={f("ss_casID")}/></>}
        </div>}
      </div>
    </div>
  </InputModal>;
}


// ─── PUMPING DATA PAGE ────────────────────────────────────────────────────────
function PumpingDataPage({ project, setPage, pumpData, setPumpData }) {
  const [d, setD] = useState(pumpData || DEFAULTS.pumpingData);
  const f = k => v => { const n={...d,[k]:v}; setD(n); setPumpData&&setPumpData(n); };
  const isCT = d.injectionType === "CT";
  return <InputModal title="Pumping Data"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("well")}
    onNext={()=>setPage("recipe_design")} nextLabel="Next"
  >
    <div style={{background:"#fff",border:`1px solid ${T.border0}`}}>
      <div style={{background:T.bg3,padding:"7px 12px",fontSize:11,fontWeight:700,color:T.text1,textTransform:"uppercase",letterSpacing:"0.3px",textAlign:"center"}}>PUMPING DATA</div>
      <div style={{padding:"16px 20px"}}>
        {/* Injection type display */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
          <span style={{color:T.text2,fontWeight:600}}>INJECTION TYPE</span>
          <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{d.injectionType==="CT"?"CT":"BULLHEAD"}</span>
        </div>
        {!isCT && <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
          <span style={{color:T.text2,fontWeight:600}}>FRICTION GRADIENT (PSI/1000FT)</span>
          <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{d.frictionGrad}</span>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"8px 0",borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
          <div>
            <span style={{color:T.text2,fontWeight:600}}>MAX SURFACE PRESSURE (MSP, PSI)</span>
            <div style={{fontSize:10,color:T.text3}}>Surface pressure limit — simulation will not exceed this</div>
          </div>
          <input className="si" value={d.msp||"2000"} onChange={e=>f("msp")(e.target.value)}
            style={{width:100,textAlign:"right",fontFamily:T.mono,fontWeight:700}}/>
        </div>
        {isCT && [
          ["PIPE ROUGHNESS",d.pipeRoughness],
          ["TOTAL LENGTH OF COILED TUBING (FT)",d.ctLength],
          ["COILED TUBING OUTER DIAMETER (INCH)",d.ctOD],
          ["COILED TUBING INNER DIAMETER (INCH)",d.ctID],
          ["FRICTION GRADIENT (PSI/100FT)",d.ctFricGrad],
        ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
          <span style={{color:T.text2,fontWeight:600}}>{k}</span>
          <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{v}</span>
        </div>)}
        {/* Edit section */}
        <div style={{marginTop:14,display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,display:"grid",gap:8}}>
            <div style={{display:"flex",gap:6}}>
              {["Bullhead","CT"].map(t=><div key={t} onClick={()=>f("injectionType")(t)} style={{
                padding:"5px 18px",cursor:"pointer",fontWeight:700,fontSize:11,borderRadius:3,
                background:d.injectionType===t?T.teal:"#fff",color:d.injectionType===t?"#fff":T.text1,
                border:`1.5px solid ${d.injectionType===t?T.teal:T.border1}`,
              }}>{t==="CT"?"CT":"Bullhead"}</div>)}
            </div>
            {!isCT && <Fld label="Friction Gradient (psi/1000ft)" value={d.frictionGrad} onChange={f("frictionGrad")}/>}
            {isCT && <><Fld label="Pipe Roughness" type="select" value={d.pipeRoughness} onChange={f("pipeRoughness")} options={["Smooth","Drawn Tubing","Commercial Steel"]}/><Fld label="Total CT Length (ft)" value={d.ctLength} onChange={f("ctLength")}/><Fld label="CT OD (in)" value={d.ctOD} onChange={f("ctOD")}/><Fld label="CT ID (in)" value={d.ctID} onChange={f("ctID")}/><Fld label="Friction Gradient (psi/100ft)" value={d.ctFricGrad} onChange={f("ctFricGrad")}/></>}
          </div>
        </div>
        {isCT && <div className="wb" style={{marginTop:10}}>
          <span style={{color:T.gold,fontWeight:700}}>!</span>
          <span style={{fontSize:11,color:T.text1}}>Users can change values of the selected Injection Type (CT/Bullhead).</span>
        </div>}
      </div>
    </div>
  </InputModal>;
}

// ─── MAIN INJECTION FLUID PAGE ─────────────────────────────────────────────
function MainFluidPage({ project, setPage, mainFluid, setMainFluid, sharedFluids }) {
  // Stage fluid selections — 4 stages: Preflush, Main Injection, Diverter, Overflush
  const DFL_SEL = {
    preflush:  "Xylene Preflush",
    mainAcid:  "HCl 15%",
    diverter:  "VES Diverter",
    overflush: "KCl 2% Brine",
  };
  const [sel, setSel] = useState(
    (mainFluid && mainFluid.stageSelections) ? mainFluid.stageSelections : DFL_SEL
  );

  const fluids = sharedFluids || INIT_FLUIDS;
  const byCategory = cat => ["None", ...fluids.filter(f=>f.cat===cat).map(f=>f.name)];
  const allNames   = ["None", ...fluids.map(f=>f.name)];

  function updateSel(k, v) {
    const next = {...sel, [k]:v};
    setSel(next);
    if (setMainFluid) {
      // propagate main acid fluid properties into mainFluid for engine
      const fl = fluids.find(f=>f.name===next.mainAcid);
      setMainFluid({
        stageSelections: next,
        name:            fl?.name           || "HCl 15%",
        hclConc:         fl?.conc           || 15,
        viscosity:       fl?.visc           || 1.2,
        specificGravity: fl?.density        || 1.065,
        diffusionCoeff:  fl ? (fl.rxRate||2.23)*1e-4 : 2.23e-4,
      });
    }
  }

  function FluidDetail({ name }) {
    if (!name || name==="None") return (
      <div style={{fontSize:11,color:T.text3,fontStyle:"italic",padding:"4px 0"}}>
        No fluid selected for this stage
      </div>
    );
    const fl = fluids.find(f=>f.name===name);
    if (!fl) return <div style={{fontSize:11,color:T.text3,padding:"4px 0"}}>{name}</div>;
    return (
      <div style={{background:"#EAF5FF",border:`1px solid ${T.border0}`,
        padding:"8px 12px",marginTop:6}}>
        <div style={{fontWeight:700,fontSize:11,color:T.teal,marginBottom:4,
          borderBottom:`1px solid ${T.border0}`,paddingBottom:3}}>{fl.name}</div>
        {[["Type",fl.type],["Category",fl_ag.cat],["Concentration",(fl.conc||"—")+"%"],
          ["Density",(fl.density||"—")+" g/cm³"],["Viscosity",(fl.visc||"—")+" cP"],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",
            fontSize:11,padding:"2px 0"}}>
            <span style={{color:T.text2}}>{k}</span>
            <span style={{fontFamily:T.mono,color:T.text0,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
    );
  }

  const STAGES = [
    {key:"preflush",  label:"Preflush Fluid",       color:"#1A7A40", opts:byCategory("Preflush")},
    {key:"mainAcid",  label:"Main Injection Fluid",  color:T.teal,    opts:byCategory("Main Acid"), primary:true},
    {key:"diverter",  label:"Diverter Fluid",        color:T.gold,    opts:byCategory("Diverter")},
    {key:"overflush", label:"Overflush Fluid",       color:T.blue,    opts:byCategory("Overflush")},
  ];

  return <InputModal title="Injection Fluid"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("pumping_data")}
    onNext={()=>setPage("damage_type")} nextLabel="Next"
  >
    <div style={{padding:"7px 10px",background:"#EAF5FF",border:`1px solid ${T.border0}`,
      fontSize:11,color:T.text2,marginBottom:12}}>
      Select the fluid for each injection stage. Fluids are sourced from the{" "}
      <b style={{color:T.teal}}>Fluids Library</b>. The Main Injection fluid
      properties drive the skin and PI calculations.
    </div>

    {STAGES.map(({key,label,color,opts,primary})=>(
      <div key={key} style={{border:`1px solid ${T.border0}`,marginBottom:12,background:"#fff"}}>
        <div style={{background:color,padding:"7px 14px",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#fff",textTransform:"uppercase"}}>
            {label}
            {primary && <span style={{fontSize:9,marginLeft:6,opacity:0.8,fontWeight:400}}>
              (drives simulation)
            </span>}
          </span>
          <select className="ss" value={sel[key]} onChange={e=>updateSel(key,e.target.value)}
            style={{fontSize:11,height:24,minWidth:190,
              background:"rgba(255,255,255,0.95)",color:T.text0,
              border:"none",fontWeight:600}}>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{padding:"8px 14px"}}>
          <FluidDetail name={sel[key]}/>
        </div>
      </div>
    ))}
  </InputModal>;
}

// ─── DAMAGE TYPE PAGE ──────────────────────────────────────────────────────
function DamageTypePage({ project, setPage, damageType, setDamageType }) {
  const [d, setD] = useState(damageType || DEFAULTS.damageType);
  const setV = (k,v) => { const n={...d,[k]:v}; setD(n); setDamageType&&setDamageType(n); };
  // Damage selections (checkboxes matching reference PDF)
  const DMG = ["Emulsions/Wettability Change","Asphaltene/Paraffin Deposition","OH/Perforation/GP Damage","Deep Wellbore Damage"];
  const hasDmg = s => (d.selectedTypes||[]).includes(s);
  const toggleDmg = s => { const cur=d.selectedTypes||[]; setV("selectedTypes", hasDmg(s)?cur.filter(x=>x!==s):[...cur,s]); };
  return <InputModal title="Damage Type"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("recipe_design")}
    onNext={()=>setPage("rock_props")} nextLabel="Next"
  >
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {/* Left: damage type selectors */}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:8}}>Select Damage Type</div>
        {DMG.map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,cursor:"pointer",fontSize:11}}>
          <input type="checkbox" checked={hasDmg(t)} onChange={()=>toggleDmg(t)} style={{width:14,height:14}}/>
          <span style={{color:hasDmg(t)?T.teal:T.text0,fontWeight:hasDmg(t)?700:400}}>{t}</span>
        </label>)}
      </div>
      {/* Right: treatment params for checked types */}
      <div>
        {hasDmg("Emulsions/Wettability Change") && <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:6,borderBottom:`1px solid ${T.border0}`,paddingBottom:4}}>Treatment of Emulsions/Wettability Change</div>
          <Fld label="Fluid Selection" type="select" value={d.emulFluid||"3% Isopropyl Alcohol"} onChange={v=>setV("emulFluid",v)} options={["3% Isopropyl Alcohol","Xylene","KCL Brine 1"]}/>
          <div style={{marginTop:6,fontSize:10,color:T.text2}}>3% Isopropyl Alcohol Concentration (%): <b>3</b></div>
          <div style={{fontSize:10,color:T.text2}}>Surface Tension (dynes/cm): <b>52</b></div>
          <div style={{fontSize:10,color:T.text2}}>Viscosity (cP): <b>2.37</b></div>
        </div>}
        {hasDmg("Asphaltene/Paraffin Deposition") && <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:6,borderBottom:`1px solid ${T.border0}`,paddingBottom:4}}>Treatment of Asphaltene/Paraffin Deposition</div>
          <Fld label="Fluid Selection" type="select" value={d.aspFluid||"Xylene"} onChange={v=>setV("aspFluid",v)} options={["Xylene","Toluene","Carbon Disulfide"]}/>
          <div style={{marginTop:6,fontSize:10,color:T.text2}}>Concentration (%): <b>100</b></div>
          <div style={{fontSize:10,color:T.text2}}>Diffusion Co-Efficient (Ft2/Min): <b>6.458e-05</b></div>
          <div style={{fontSize:10,color:T.text2}}>Viscosity (cP): <b>0.69</b></div>
        </div>}
        {/* Formation water incompatibility */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:6}}>Formation Water Incompatibility</div>
          <Fld label="Fluid Selection" type="select" value={d.waterFluid||"KCL Brine 1"} onChange={v=>setV("waterFluid",v)} options={["KCL Brine 1","KCL Brine 4","None"]}/>
        </div>
        {/* Post-flush */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:6}}>Post-Flush Selection</div>
          <Fld label="Fluid Selection" type="select" value={d.postFlushFluid||"KCL Brine 4"} onChange={v=>setV("postFlushFluid",v)} options={["KCL Brine 4","KCL Brine 1","Xylene","None"]}/>
          <div style={{marginTop:6,fontSize:10,color:T.text2}}>KCL Brine 4 Concentration (%): <b>4</b></div>
          <div style={{fontSize:10,color:T.text2}}>Diffusion Co-Efficient (Ft2/Min): <b>4.3e-06</b></div>
          <div style={{fontSize:10,color:T.text2}}>Viscosity (cP): <b>1.0</b></div>
        </div>
      </div>
    </div>
  </InputModal>;
}

// ─── ROCK PROPERTIES PAGE — removed as standalone (merged into Reservoir table) ──
// RockPropsPage now just redirects since data is in reservoir table
function RockPropsPage({ project, setPage, rockProps, setRockProps, resRows }) {
  const [d, setD] = useState(rockProps || DEFAULTS.rockProps);
  const f = k => v => { const n={...d,[k]:v}; setD(n); setRockProps&&setRockProps(n); };

  // Preview: temperature at each reservoir layer depth node
  const surfTemp  = parseFloat(d.surfaceTemp  || 59);
  const geoGrad   = parseFloat(d.geoGradient  || 1.5);  // °F / 100 ft
  const RES       = resRows || [];
  // Compute temp at midpoint of each reservoir layer
  const depthTemps = RES.map(r => {
    const mid = ((+r.top || 0) + (+r.bot || 0)) / 2;
    const T_F = surfTemp + geoGrad * mid / 100;
    return { top: +r.top, bot: +r.bot, mid, T_F: +T_F.toFixed(1) };
  });

  return <InputModal title="Rock Properties"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("damage_type")}
    onNext={()=>setPage("resv_fluid")} nextLabel="Next"
  >
    <div style={{padding:"6px 10px",background:"#EAF5FF",border:`1px solid ${T.border0}`,
      fontSize:11,color:T.text2,marginBottom:12}}>
      Zone-level mineralogy (wt% Calcite, Dolomite, Shale) and Damage Radius are
      entered in the <b style={{color:T.teal}}>Reservoir Data</b> table columns.
      Enter global formation properties below.
    </div>

    {/* ── Global formation properties ── */}
    <div style={{background:"#fff",border:`1px solid ${T.border0}`,marginBottom:14}}>
      <div style={{background:T.bg3,padding:"7px 12px",fontSize:11,fontWeight:700,
        color:T.text1,textTransform:"uppercase",textAlign:"center"}}>Rock Properties</div>
      <div style={{padding:"4px 0"}}>
        {[
          ["FRACTURE GRADIENT (PSI/FT)",          d.fracGrad,     "fracGrad"],
          ["FORMATION TEMPERATURE AT DATUM (°F)",  d.formationTemp,"formationTemp"],
          ["ROCK DENSITY (G/CM3)",                 d.rockDensity,  "rockDensity"],
          ["LEAK-OFF CO-EFFICIENT (FT/MIN^1/2)",   d.leakoffCoeff, "leakoffCoeff"],
        ].map(([label,val,key])=>(
          <div key={key} style={{display:"flex",justifyContent:"space-between",
            alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${T.border0}`}}>
            <span style={{fontSize:12,color:T.text2,fontWeight:600}}>{label}</span>
            <input className="si" value={val||""} onChange={e=>f(key)(e.target.value)}
              style={{width:130,textAlign:"right"}}/>
          </div>
        ))}
      </div>
    </div>

    {/* ── Geothermal gradient inputs ── */}
    <div style={{background:"#fff",border:`1px solid ${T.border0}`,marginBottom:14}}>
      <div style={{background:"#1565C0",padding:"7px 12px",fontSize:11,fontWeight:700,
        color:"#fff",textTransform:"uppercase",textAlign:"center",letterSpacing:"0.5px"}}>
        Geothermal Gradient
        <span style={{fontSize:9,fontWeight:400,marginLeft:8,opacity:0.8}}>
          — drives depth-dependent fluid properties in simulator
        </span>
      </div>
      <div style={{padding:"4px 0"}}>
        {[
          ["SURFACE TEMPERATURE (°F)",         d.surfaceTemp  || "59",  "surfaceTemp",  "Ambient surface temperature"],
          ["GEOTHERMAL GRADIENT (°F / 100 FT)",d.geoGradient  || "1.5", "geoGradient",  "Typical: 1.0–2.5 °F/100ft"],
        ].map(([label,val,key,hint])=>(
          <div key={key} style={{padding:"10px 16px",borderBottom:`1px solid ${T.border0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontSize:12,color:T.text2,fontWeight:600}}>{label}</span>
                <div style={{fontSize:10,color:T.text3,marginTop:2}}>{hint}</div>
              </div>
              <input className="si" value={val} onChange={e=>f(key)(e.target.value)}
                style={{width:130,textAlign:"right"}}/>
            </div>
          </div>
        ))}
        {/* Live preview: T at each depth node */}
        {depthTemps.length > 0 && <>
          <div style={{padding:"6px 16px",background:"#F0F4FF",
            fontSize:10,fontWeight:700,color:"#1565C0",textTransform:"uppercase",
            letterSpacing:"0.5px",borderBottom:`1px solid ${T.border0}`}}>
            Calculated Formation Temperature per Layer
          </div>
          <div style={{display:"grid",
            gridTemplateColumns:"1fr 1fr 1fr 1fr",
            gap:0}}>
            {["Layer","From (ft)","To (ft)","Temp (°F)"].map(h=>(
              <div key={h} style={{padding:"4px 10px",background:T.bg3,
                fontSize:9,fontWeight:700,color:T.text2,
                borderBottom:`1px solid ${T.border0}`,
                borderRight:`1px solid ${T.border0}`}}>{h}</div>
            ))}
            {depthTemps.map((r,i)=>[
              <div key={`l${i}`} style={{padding:"5px 10px",fontSize:11,fontFamily:T.mono,
                borderBottom:`1px solid ${T.border0}`,
                borderRight:`1px solid ${T.border0}`}}>Layer {i+1}</div>,
              <div key={`top${i}`} style={{padding:"5px 10px",fontFamily:T.mono,fontSize:11,
                borderBottom:`1px solid ${T.border0}`,
                borderRight:`1px solid ${T.border0}`}}>{r.top}</div>,
              <div key={`bot${i}`} style={{padding:"5px 10px",fontFamily:T.mono,fontSize:11,
                borderBottom:`1px solid ${T.border0}`,
                borderRight:`1px solid ${T.border0}`}}>{r.bot}</div>,
              <div key={`T${i}`} style={{padding:"5px 10px",fontFamily:T.mono,fontSize:11,
                fontWeight:700,color:"#1565C0",
                borderBottom:`1px solid ${T.border0}`,
                borderRight:`1px solid ${T.border0}`}}>{r.T_F} °F</div>,
            ])}
          </div>
          <div style={{padding:"6px 14px",fontSize:10,color:T.text3,background:"#F7F9FC"}}>
            T(depth) = {surfTemp} + {geoGrad} × depth / 100
            &nbsp;·&nbsp; Used in Arrhenius reaction rate and fluid viscosity calculations at each node
          </div>
        </>}
      </div>
    </div>

    {/* Physics impact note */}
    <div style={{padding:"8px 12px",background:"#FFF8E6",border:`1px solid ${T.gold}`,
      fontSize:11,color:T.text2}}>
      <b style={{color:T.gold}}>Engine impact:</b> The geothermal gradient updates fluid
      properties at each depth node independently:
      <div style={{marginTop:4,display:"flex",gap:16,flexWrap:"wrap"}}>
        <span>• Viscosity: μ(T) = μ₀ × exp(B×(1/T − 1/T_ref))</span>
        <span>• Rxn Rate: k(T) = A₀ × exp(−Ea/RT)  [Arrhenius]</span>
        <span>• Density: ρ(T) ≈ ρ₀ × (1 − α×ΔT)</span>
      </div>
    </div>
  </InputModal>;
}

// ─── DIVERTER FLUID PAGE ───────────────────────────────────────────────────
function DiverterFluidPage({ project, setPage, diverterFluid, setDiverterFluid }) {
  const [d, setD] = useState(diverterFluid || DEFAULTS.diverterFluid);
  const f = k => v => { const n={...d,[k]:v}; setD(n); setDiverterFluid&&setDiverterFluid(n); };
  const TYPES_DIV = ["Viscosified","VES","Foamed","Particulate"];

  // Property rows per diverter type (from reference PDF)
  const PROP_ROWS = {
    Viscosified: [["K (Consistency Index)","k","2.1e-5"],["Viscosity (cP)","visc","1.0"],["N (Flow Behaviour Index)","n","1"],["Fluid Density (kg/m³)","density","1150"]],
    Foamed:      [["Foam Quality (%)","foamQuality","0.8"],["Foamed Viscosity (cP)","visc","1.0"],["Connate Water Saturation (Swi)","connateSat","0.2"],["Gas Saturation (Sgi)","gasSat","0.1"],["Fluid Density (kg/m³)","density","1150"]],
    Particulate: [["Diverter Agent","agent","Benzoic Acid"],["Particulate Viscosity (cP)","visc","1.0"],["Agent Concentration (%)","agentConc","0.2"],["Cake Porosity (%)","cakePor","1"],["Grain Size (micro-m)","grainSize","50.0"],["Fluid Density (kg/m³)","density","1150"]],
    VES:         [["Maximum Viscosity (cP)","maxVisc","300"],["VES Viscosity (cP)","visc","1.0"],["SDVA Concentration (%)","sdvaConc","6.0"],["VES pH","ph","2.0"],["Ca Concentration at Max Viscosity (%)","caConc","20"],["Fluid Density (kg/m³)","density","1150"]],
  };
  const activeType = d.type || "VES";
  const rows = PROP_ROWS[activeType] || [];

  return <InputModal title="Diverter Fluid (Optional)"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("rock_props")}
    onNext={()=>setPage("resv_fluid")} nextLabel="Next"
  >
    {/* Type selector */}
    <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:8}}>
      Select Diverter Type
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {TYPES_DIV.map(t=>(
        <div key={t} onClick={()=>f("type")(t)} style={{
          padding:"5px 18px",cursor:"pointer",fontWeight:700,fontSize:11,
          background:activeType===t?T.teal:"#fff",color:activeType===t?"#fff":T.text1,
          border:`1.5px solid ${activeType===t?T.teal:T.border1}`,
        }}>{t}</div>
      ))}
    </div>

    {/* Properties panel — matches reference PDF */}
    <div style={{background:"#fff",border:`1px solid ${T.border0}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",
        background:T.teal,color:"#fff",fontSize:11,fontWeight:700}}>
        <span style={{fontSize:10}}>&#9658;</span>
        <span>{activeType.toUpperCase()} BASE</span>
      </div>
      <div>
        {rows.map(([label, key, dflt])=>(
          <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 16px",borderBottom:`1px solid ${T.border0}`}}>
            <span style={{fontSize:11,color:T.text2,fontWeight:600,
              textTransform:"uppercase",letterSpacing:"0.2px"}}>{label}</span>
            <input className="si" value={d[key]!=null?d[key]:dflt}
              onChange={e=>f(key)(e.target.value)}
              style={{width:130,textAlign:"right",fontSize:11}}/>
          </div>
        ))}
        <div style={{padding:"10px 16px",display:"flex",gap:8}}>
          <Btn sz="s" v="g" onClick={()=>{
            // Reset to PDF defaults for active type
            const dflMap = Object.fromEntries((PROP_ROWS[activeType]||[]).map(([,k,v])=>[k,v]));
            const n={...d,...dflMap};setD(n);if(setDiverterFluid)setDiverterFluid(n);
          }}>Set to Default</Btn>
        </div>
      </div>
    </div>
  </InputModal>;
}

// ─── RESERVOIR FLUID PROPERTIES PAGE ──────────────────────────────────────
function ResvFluidPage({ project, setPage, resvFluid, setResvFluid }) {
  const [d, setD] = useState(resvFluid || DEFAULTS.resvFluid);
  const f = k => v => { const n={...d,[k]:v}; setD(n); setResvFluid&&setResvFluid(n); };
  const COLS = ["OIL","GAS","WATER"];
  // Full property grid matching reference PDF
  const PROPS = [
    {label:"VISCOSITY (CP)",                   keys:["oilViscosity",    "gasVisc",    "waterVisc"],      dfl:[1.5,0.019,1.0]},
    {label:"DENSITY (KG/M3)",                  keys:["oilDensity",     "gasDensity", "waterDensity"],   dfl:[870,106,1000]},
    {label:"FORMATION VOLUME FACTOR (BBL/STB)", keys:["formationVolFactor","gasFVF",  "waterFVF"],       dfl:[1.2,6.95e-4,1.0]},
    {label:"COMPRESSIBILITY (1/PSI)",           keys:["oilComp",        "gasComp",    "waterComp"],      dfl:[5e-5,500e-6,""]},
    {label:"RELATIVE PERMEABILITY",             keys:["oilRelPerm",     "gasRelPerm", "waterRelPerm"],   dfl:[0.3,0.4,0.3]},
    {label:"GOR, GAS OIL RATIO (SCF/STB)",      keys:["gasOilRatio",    "",""],                          dfl:[100,"",""],gas:true},
    {label:"RESIDUAL OIL SATURATION (Sor)",     keys:["residualOilSat","",""],                           dfl:[0.15,"",""]},
    {label:"WATER SATURATION (Swi)",            keys:["","","waterSat"],                                 dfl:["","",0.42]},
    {label:"COREY EXPONENT FOR WATER/OIL (Nw/No)",keys:["coreyOil","","coreyWater"],                    dfl:[4,"",2.0]},
    {label:"END POINT RELATIVE PERMEABILITY OF WATER/OIL (Krwro/Krocw)",keys:["krwro","","krocw"],      dfl:[0.9,"",0.9]},
    {label:"CONNATE WATER SATURATION (Swc)",    keys:["","","connateSat"],                               dfl:["","",0.15]},
  ];
  return <InputModal title="Reservoir Fluid Properties (Optional)"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("rock_props")}
    onNext={()=>setPage("coreflood")} nextLabel="Next"
  >
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr style={{background:T.bg3}}>
        <th style={{padding:"7px 10px",textAlign:"left",border:`1px solid ${T.border0}`,width:"45%"}}></th>
        {COLS.map(c=><th key={c} style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:T.text0,border:`1px solid ${T.border0}`}}>{c}</th>)}
      </tr></thead>
      <tbody>{PROPS.map((p,i)=>{
        const row_d = d[p.keys[0]] ?? p.dfl[0];
        return <tr key={p.label} style={{background:i%2===0?"#fff":"#F4F8FC"}}>
          <td style={{padding:"6px 10px",border:`1px solid ${T.border0}`,fontSize:11,color:T.text2,fontWeight:600}}>{p.label}</td>
          {p.keys.map((k,ki)=><td key={ki} style={{padding:"4px 6px",border:`1px solid ${T.border0}`,textAlign:"center"}}>
            {k ? <input className="si" style={{width:"100%",textAlign:"right",fontSize:11}}
              value={d[k]??p.dfl[ki]??""} onChange={e=>f(k)(e.target.value)}/> :
              <span style={{color:T.border0,fontSize:10}}>—</span>}
          </td>)}
        </tr>;
      })}</tbody>
    </table>
  </InputModal>;
}

// ─── COREFLOOD DATA PAGE ───────────────────────────────────────────────────
function CorefloodPage({ project, setPage, coreflood, setCoreflood }) {
  const [d, setD] = useState(coreflood || DEFAULTS.coreflood);
  const f = k => v => { const n={...d,[k]:v}; setD(n); setCoreflood&&setCoreflood(n); };
  const avail = d.availability === "AVAILABLE";
  return <InputModal title="Core Flood Data (Optional)"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("resv_fluid")}
    onNext={()=>setPage("schedule")} nextLabel="Next"
  >
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#EAF2FA",border:`1px solid ${T.border0}`,marginBottom:14}}>
      <span style={{fontSize:12,color:T.text2}}>User can select available / Not available based on their availability of core flood data</span>
      <select className="ss" value={d.availability||"NOT AVAILABLE"} onChange={e=>f("availability")(e.target.value)} style={{minWidth:160}}>
        <option>NOT AVAILABLE</option>
        <option>AVAILABLE</option>
      </select>
    </div>
    {avail && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card title="Wormhole Parameters">
        <div style={{display:"grid",gap:8}}>
          <Fld label="Pore Volumes to Breakthrough (PVBT)" value={d.pvbt} onChange={f("pvbt")}/>
          <Fld label="Wormhole Diameter (in)" value={d.wormholeDiam} onChange={f("wormholeDiam")}/>
          <Fld label="Wormhole Tortuosity" value={d.wormholeTortuosity} onChange={f("wormholeTortuosity")}/>
        </div>
      </Card>
      <Card title="Core Sample Properties">
        <div style={{display:"grid",gap:8}}>
          <Fld label="Core Porosity (%)" value={d.corePor} onChange={f("corePor")}/>
          <Fld label="Core Permeability (md)" value={d.corePerm} onChange={f("corePerm")}/>
          <Fld label="Core Length (in)" value={d.coreLength} onChange={f("coreLength")}/>
          <Fld label="Core Flow Rate (ml/min)" value={d.coreFlowRate} onChange={f("coreFlowRate")}/>
        </div>
      </Card>
    </div>}
    {!avail && <div style={{padding:"20px",textAlign:"center",color:T.text2,fontSize:12,background:T.bg3,border:`1px solid ${T.border0}`}}>
      Core flood data not available. Engine will use default theoretical wormhole propagation model (Williams-Hendrickson PVBT).
    </div>}
  </InputModal>;
}


// ─── FLUIDS LIBRARY — Master Database ────────────────────────────────────────
function FluidsPage({ setPage, sharedFluids, setSharedFluids }) {
  const [masterDB,   setMasterDB]   = useState(() => MASTER_FLUIDS_DB.map(f=>({...f})));
  const [userFluids, setUserFluids] = useState([]);
  const allFluids = [...masterDB, ...userFluids];

  // Workflow state: Category → Name → Properties
  const [selCat,  setSelCat]  = useState("");
  const [selName, setSelName] = useState("");
  const [mode,    setMode]    = useState("view");
  const [editBuf, setEditBuf] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");

  const namesInCat = selCat
    ? allFluids.filter(f => f.cat === selCat && f.active !== false).map(f => f.name)
    : [];
  const selectedFluid = selCat && selName
    ? allFluids.find(f => f.cat === selCat && f.name === selName) || null
    : null;

  const CAT_COLORS = {
    "Main Acid Fluids":"#1565C0","Organic Acid Fluids":"#2E7D32","HF Acid Fluids":"#6A1B9A",
    "Retarded Acids":"#00838F","Brines":"#00695C","Diverter Fluids":"#E65100",
    "Solvents":"#795548","Surfactants":"#558B2F","Clay Stabilizers":"#8D6E63",
    "Corrosion Inhibitors":"#546E7A","Chelating Agents":"#F9A825","Iron Control":"#6D4C41",
    "Nitrogen":"#37474F","Gelling Agents":"#880E4F","Specialty Fluids":"#4527A0","Additives":"#455A64",
    "Foam Additives":"#0277BD","Well Control Fluids":"#BF360C","Spacer Fluids":"#1B5E20",
    "Fluid Loss Control":"#4A148C","Flow Assurance Chemicals":"#E65100","Cleanup Chemicals":"#006064",
  };
  const catColor  = cat => CAT_COLORS[cat] || T.teal;
  const catCount  = cat => allFluids.filter(f => f.cat === cat && f.active !== false).length;
  const totalActive = allFluids.filter(f => f.active !== false).length;

  function startEdit() { if (!selectedFluid) return; setEditBuf({...selectedFluid}); setMode("edit"); }
  function startAdd()  {
    const dfl = {};
    (CAT_PROPS[selCat||FLUID_CATEGORIES[0]]||[]).forEach(p=>{ dfl[p.key]=p.dflt; });
    setEditBuf({name:"",cat:selCat||FLUID_CATEGORIES[0],active:true,system:false,...dfl});
    setMode("add");
  }
  function cancelEdit() { setEditBuf(null); setMode("view"); setSaveMsg(""); }

  function saveFluid() {
    if (!editBuf?.name?.trim()) { setSaveMsg("Fluid name is required."); return; }
    setSaveMsg("");
    if (mode==="add") {
      const fl = {...editBuf, id:Date.now()};
      setUserFluids(uf=>[...uf,fl]);
      setSelCat(fl_ag.cat); setSelName(fl.name);
    } else {
      const isSys = masterDB.find(f=>f.id===editBuf.id);
      if (isSys) setMasterDB(db=>db.map(f=>f.id===editBuf.id?editBuf:f));
      else       setUserFluids(uf=>uf.map(f=>f.id===editBuf.id?editBuf:f));
      setSelName(editBuf.name);
    }
    setEditBuf(null); setMode("view"); setSaveMsg("Saved");
    setTimeout(()=>setSaveMsg(""),2000);
    if (setSharedFluids) setSharedFluids(allFluids.filter(f=>f.active!==false).map(masterToEngineFluid));
  }

  function toggleActive() {
    if (!selectedFluid) return;
    const tog = f=>f.id===selectedFluid.id?{...f,active:!f.active}:f;
    if (masterDB.find(f=>f.id===selectedFluid.id)) setMasterDB(db=>db.map(tog));
    else setUserFluids(uf=>uf.map(tog));
    setSelName("");
  }
  function duplicateFluid() {
    if (!selectedFluid) return;
    const dup={...selectedFluid,id:Date.now(),name:selectedFluid.name+" (copy)",system:false};
    setUserFluids(uf=>[...uf,dup]); setSelName(dup.name);
  }
  function deleteFluid() {
    if (!selectedFluid||selectedFluid.system) return;
    setUserFluids(uf=>uf.filter(f=>f.id!==selectedFluid.id)); setSelName("");
  }

  return (
    <InputModal title="Fluids Library"
      onClose={()=>setPage("inputs")}
      onPrev={()=>setPage("rock_props")}
      onNext={()=>setPage("resv_fluid")} nextLabel="Next"
    >
      {/* Two-column layout inside modal */}
      <div style={{display:"flex",gap:0,height:"65vh",minHeight:400,margin:"-16px -20px",overflow:"hidden"}}>

        {/* ── LEFT: Category + Name cascade ─────────────────────────────── */}
        <div style={{width:220,flexShrink:0,borderRight:`1px solid ${T.border0}`,
          display:"flex",flexDirection:"column",background:T.bg3,overflowY:"auto"}}>

          {/* Header */}
          <div style={{padding:"10px 12px 6px",background:T.bg2,
            borderBottom:`1px solid ${T.border0}`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text1}}>
              {totalActive} active fluids · {userFluids.length} custom
            </div>
          </div>

          {/* ① Category */}
          <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${T.border0}`}}>
            <div style={{fontSize:9,fontWeight:800,color:T.text3,textTransform:"uppercase",
              letterSpacing:"1px",marginBottom:5}}>① Category</div>
            <select className="ss" value={selCat}
              onChange={e=>{setSelCat(e.target.value);setSelName("");setMode("view");setEditBuf(null);}}
              style={{width:"100%",fontSize:11,height:28}}>
              <option value="">— Choose category —</option>
              {FLUID_CATEGORIES.map(c=>(
                <option key={c} value={c}>{c} ({catCount(c)})</option>
              ))}
            </select>
            {selCat && <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:7,height:7,borderRadius:"50%",
                background:catColor(selCat),display:"inline-block"}}/>
              <span style={{fontSize:10,color:catColor(selCat),fontWeight:700}}>{selCat}</span>
            </div>}
          </div>

          {/* ② Fluid Name */}
          <div style={{padding:"8px 12px 8px",borderBottom:`1px solid ${T.border0}`}}>
            <div style={{fontSize:9,fontWeight:800,color:T.text3,textTransform:"uppercase",
              letterSpacing:"1px",marginBottom:5}}>② Fluid Name</div>
            <select className="ss" value={selName} disabled={!selCat}
              onChange={e=>{setSelName(e.target.value);setMode("view");setEditBuf(null);}}
              style={{width:"100%",fontSize:11,height:28,opacity:selCat?1:0.5}}>
              <option value="">{selCat?"— Choose fluid —":"Select category first"}</option>
              {namesInCat.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Fluid list */}
          {selCat && <div style={{flex:1,overflowY:"auto"}}>
            {namesInCat.map(n=>(
              <div key={n} onClick={()=>{setSelName(n);setMode("view");setEditBuf(null);}}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"5px 12px",cursor:"pointer",fontSize:11,
                  background:selName===n?catColor(selCat)+"18":"transparent",
                  borderLeft:`2px solid ${selName===n?catColor(selCat):"transparent"}`,
                  color:selName===n?catColor(selCat):T.text1,
                  fontWeight:selName===n?700:400,
                }}>
                <span style={{width:5,height:5,borderRadius:"50%",flexShrink:0,
                  background:selName===n?catColor(selCat):"#C8D8E4"}}/>
                {n}
              </div>
            ))}
            <div style={{padding:"8px 12px",borderTop:`1px solid ${T.border0}`,marginTop:4}}>
              <Btn sz="s" v="g" onClick={startAdd} sx={{width:"100%"}}>+ Add Fluid</Btn>
            </div>
          </div>}
        </div>

        {/* ── RIGHT: Properties panel ────────────────────────────────────── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Empty state */}
          {!selectedFluid && mode!=="add" && <div style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",gap:10,color:T.text3,
          }}>
            <div style={{fontSize:36,opacity:0.15}}>⚗</div>
            <div style={{fontSize:13,fontWeight:600,color:T.text2}}>
              Select a category and fluid
            </div>
            <div style={{fontSize:11,color:T.text3,textAlign:"center",maxWidth:240}}>
              Choose from {totalActive} active fluids across {FLUID_CATEGORIES.length} categories
            </div>
            <Btn v="p" sz="s" onClick={startAdd} sx={{marginTop:8}}>+ Add New Fluid</Btn>
          </div>}

          {/* Properties panel */}
          {(selectedFluid || mode==="add") && <div style={{flex:1,overflow:"auto"}}>

            {/* Colour header bar */}
            <div style={{
              background:mode==="add"?"#37474F":catColor((editBuf||selectedFluid)?.cat||selCat),
              padding:"10px 16px",
              display:"flex",alignItems:"center",justifyContent:"space-between",
            }}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>
                  {mode==="add"?"Add New Fluid":(editBuf||selectedFluid)?.name}
                </div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",marginTop:1}}>
                  {(editBuf||selectedFluid)?.cat||selCat}
                  {" · Stage: "}{CAT_TO_STAGE[(editBuf||selectedFluid)?.cat||selCat]||"Additive"}
                  {selectedFluid?.system?" · System":""}
                </div>
              </div>
              {mode==="view" && selectedFluid && <div style={{display:"flex",gap:4}}>
                {[
                  ["Edit",    startEdit],
                  ["Dup",     duplicateFluid],
                  [selectedFluid.active!==false?"Deact":"Activate", toggleActive],
                  ...(!selectedFluid.system?[["Del",deleteFluid]]:[]),
                ].map(([label,fn])=>(
                  <span key={label} onClick={fn} style={{
                    cursor:"pointer",padding:"3px 9px",fontSize:10,fontWeight:600,
                    background:"rgba(255,255,255,0.18)",color:"#fff",
                    border:"1px solid rgba(255,255,255,0.3)",
                  }}>{label}</span>
                ))}
                {saveMsg && <span style={{fontSize:11,color:"#A8FFD0",fontWeight:700,
                  marginLeft:6,alignSelf:"center"}}>{saveMsg}</span>}
              </div>}
            </div>

            <div style={{padding:"14px 16px"}}>
              {/* Add mode: name + category */}
              {mode==="add" && editBuf && <div style={{
                background:T.bg3,border:`1px solid ${T.border0}`,
                padding:"12px 14px",marginBottom:12,
              }}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.text2,marginBottom:3}}>
                      Fluid Name *
                    </div>
                    <input className="si" value={editBuf.name||""}
                      onChange={e=>setEditBuf(b=>({...b,name:e.target.value}))}
                      placeholder="Enter fluid name"
                      style={{width:"100%",fontSize:11}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.text2,marginBottom:3}}>
                      Category
                    </div>
                    <select className="ss" value={editBuf.cat}
                      onChange={e=>setEditBuf(b=>({...b,cat:e.target.value}))}
                      style={{width:"100%",fontSize:11,height:28}}>
                      {FLUID_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {saveMsg && <div style={{marginTop:8,padding:"4px 8px",
                  background:"#FCE8E8",border:`1px solid ${T.red}`,
                  fontSize:11,color:T.red}}>{saveMsg}</div>}
              </div>}

              {/* Property rows */}
              <div style={{background:"#fff",border:`1px solid ${T.border0}`}}>
                <div style={{background:T.bg3,padding:"5px 12px",
                  fontSize:9,fontWeight:800,color:T.text2,
                  textTransform:"uppercase",letterSpacing:"1px",
                  borderBottom:`1px solid ${T.border0}`,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>
                    {mode==="view"?"Properties":mode==="add"?"New Fluid Properties":"Edit Properties"}
                  </span>
                  {mode==="view" && selectedFluid && <span style={{
                    fontSize:9,padding:"1px 7px",fontWeight:700,
                    background:selectedFluid.active!==false?"#E8F5E9":"#F5F5F5",
                    color:selectedFluid.active!==false?T.green:T.text3,
                    border:`1px solid ${selectedFluid.active!==false?T.green:T.border1}`,
                  }}>
                    {selectedFluid.active!==false?"Active":"Inactive"}
                  </span>}
                </div>
                {(mode==="view"
                  ? (CAT_PROPS[selectedFluid?.cat]||[])
                  : (CAT_PROPS[editBuf?.cat]||[])
                ).map((prop,i)=>{
                  const fl  = mode==="view" ? selectedFluid : editBuf;
                  const val = fl ? (fl[prop.key]!=null ? fl[prop.key] : prop.dflt) : prop.dflt;
                  return <div key={prop.key} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 12px",
                    background:i%2===0?"#fff":"#F7F9FC",
                    borderBottom:`1px solid ${T.border0}`,
                  }}>
                    <span style={{fontSize:11,color:T.text1,fontWeight:500}}>{prop.label}</span>
                    {mode==="view"
                      ? <span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,
                          color:T.text0}}>{val||"—"}</span>
                      : <input className="si" value={val}
                          onChange={e=>setEditBuf(b=>({...b,[prop.key]:e.target.value}))}
                          style={{width:160,textAlign:"right",fontSize:11}}/>
                    }
                  </div>;
                })}
              </div>

              {/* Save/Cancel for edit/add */}
              {mode!=="view" && <div style={{display:"flex",gap:8,marginTop:12}}>
                <Btn v="p" onClick={saveFluid} sx={{minWidth:120}}>
                  {mode==="add"?"Add to Library":"Save Changes"}
                </Btn>
                <Btn v="g" onClick={cancelEdit}>Cancel</Btn>
              </div>}
            </div>
          </div>}
        </div>
      </div>
    </InputModal>
  );
}


const STAGE_COLORS_RD = {
  "Preflush":"#1A7A40","Main Injection":"#0078A8","Overflush":"#1565C0",
  "Postflush":"#6A1B9A","Displacement":"#795548","Diverter":"#E65100",
};
const STAGE_TYPES_RD = ["Preflush","Main Injection","Overflush","Postflush","Displacement","Diverter"];
const UOM_OPTS       = ["gal","bbl","lbs","L","kg"];
// Mixture property blending — used by RecipeDesignPage
function calcMixtureProps(additives, fluidDB) {
  if (!additives || !additives.length) return {density:1.0,visc:1.0,rxCalcite:0,rxDolomite:0,rxShale:0};
  const rows = additives.map(a => {
    // Primary lookup in full fluidDB (merged sharedFluids + MASTER_FLUIDS_DB)
    const fl     = (fluidDB||[]).find(f => f.name === a.name) || {};
    // Always check MASTER_FLUIDS_DB directly for rxCalcite/rxDolomite/rxShale —
    // INIT_FLUIDS entries only have rxRate, not the three mineral-specific rates.
    // This ensures HCl 15%, HCl 28% etc. always show correct reaction rates.
    const master = MASTER_FLUIDS_DB.find(f => f.name === a.name) || {};
    const vol    = parseFloat(a.vol) || parseFloat(a.conc) || 1;
    const rxC = parseFloat(master.rxCalcite  ?? fl.rxCalcite  ?? fl.rxRate ?? 0);
    const rxD = parseFloat(master.rxDolomite ?? fl.rxDolomite ?? 0);
    const rxS = parseFloat(master.rxShale    ?? fl.rxShale    ?? 0);
    return {
      vol,
      density:    parseFloat(master.density || fl.density || 1.0),
      visc:       parseFloat(master.visc    || fl.visc    || 1.0),
      rxCalcite:  rxC,
      rxDolomite: rxD,
      rxShale:    rxS,
      conc:       parseFloat(master.conc    || fl.conc    || 0),
    };
  });
  const totalVol  = rows.reduce((s,r) => s + r.vol, 0) || 1;
  const density   = rows.reduce((s,r) => s + r.density * (r.vol/totalVol), 0);
  const lnVisc    = rows.reduce((s,r) => s + (r.vol/totalVol) * Math.log(Math.max(0.001, r.visc)), 0);
  const visc      = Math.exp(lnVisc);
  const concTot   = rows.reduce((s,r) => s + r.conc * (r.vol/totalVol), 0) || 1;
  // Volume-weighted rxRates (dominant acid contribution by volume fraction)
  // No extra conc weighting — conc is already captured in the rxRate constant per fluid
  const rxCalcite  = rows.reduce((s,r) => s + r.rxCalcite  * (r.vol/totalVol), 0);
  const rxDolomite = rows.reduce((s,r) => s + r.rxDolomite * (r.vol/totalVol), 0);
  const rxShale    = rows.reduce((s,r) => s + r.rxShale    * (r.vol/totalVol), 0);
  // Volume-weighted acid concentration (fraction 0-1, relative to pure acid)
  const concWt = rows.reduce((s,r) => s + (parseFloat(r.conc)||0) * (r.vol/totalVol), 0);
  return {
    density:    +density.toFixed(4),
    visc:       +visc.toFixed(3),
    conc:       +Math.min(1, Math.max(0, (concWt||0)/100)).toFixed(4), // wt fraction (fl.conc is % in DB)
    rxCalcite:  +rxCalcite.toFixed(4),
    rxDolomite: +rxDolomite.toFixed(4),
    rxShale:    +rxShale.toFixed(4),
  };
}

function emptyAdditive(idx) {
  return {id: Date.now() + idx, name:"", code:"", uom:"gal", conc:"", vol:"", weight:""};
}
function RecipeDesignPage({ setPage, sharedRecipes, setSharedRecipes, sharedFluids, isRequired, setSharedSched }) {
  const fluidDB = [
    ...(sharedFluids && sharedFluids.length ? sharedFluids : []),
    ...MASTER_FLUIDS_DB.filter(f=>f.active!==false),
  ].filter((f,i,a)=>a.findIndex(x=>x.name===f.name)===i); // deduplicate by name

  // Seed with three default recipes if library is empty
  function makeDefaultRecipes() {
    return [
      { id:9001, name:"Standard Preflush",  stageType:"Preflush",      totalVol:50,
        numAdditives:1, isDefault:true,
        additives:[
          {id:90011, name:"NH4Cl 4%", code:"NH4CL-4", uom:"bbl", conc:"300", vol:"50"},
        ],
        props:{density:1.016,visc:1.0,rxCalcite:0,rxDolomite:0,rxShale:0} },
      { id:9002, name:"HCl 15% Main Acid",  stageType:"Main Injection",totalVol:150,
        numAdditives:1, isDefault:true,
        additives:[
          {id:90021, name:"HCl 15%",  code:"HCL-15",  uom:"bbl", conc:"600", vol:"150"},
        ],
        props:{density:1.063,visc:1.20,rxCalcite:2.78,rxDolomite:1.39,rxShale:0.30} },
      { id:9003, name:"NH4Cl 4% Overflush", stageType:"Overflush",     totalVol:70,
        numAdditives:1, isDefault:true,
        additives:[
          {id:90031, name:"NH4Cl 4%", code:"NH4CL-4", uom:"bbl", conc:"300", vol:"70"},
        ],
        props:{density:1.016,visc:1.0,rxCalcite:0,rxDolomite:0,rxShale:0} },
    ];
  }
  const DEFAULT_RECIPES = makeDefaultRecipes();
  const [recipes, setRecipes] = useState(() => {
    if (sharedRecipes && sharedRecipes.length) return sharedRecipes;
    return DEFAULT_RECIPES;
  });
  const [filter,    setFilter]    = useState("All");
  const [search,    setSearch]    = useState("");
  const [popup,     setPopup]     = useState(null);   // {recipeId} | null
  const [editRec,   setEditRec]   = useState(null);   // recipe being edited in popup
  const [warn,      setWarn]      = useState("");

  // Keep sharedRecipes in sync
  // Sync on every render so sharedRecipes stays up to date (including defaults)
  React.useEffect(()=>{ if (setSharedRecipes) setSharedRecipes(recipes); }, [recipes]);
  function syncRecipes(rs) {
    setRecipes(rs);
    if (setSharedRecipes) setSharedRecipes(rs);
  }

  // Build empty recipe with stage-appropriate default first fluid
  function newRecipe(stage) {
    const st = stage || "Main Injection";
    const DEFAULT_FIRST = {
      "Preflush":         {name:"NH4Cl 4%",    code:"NH4CL-4",  uom:"bbl", conc:"300",  vol:"50"},
      "Main Injection":   {name:"HCl 15%",     code:"HCL-15",   uom:"bbl", conc:"600",  vol:"150"},
      "Overflush":        {name:"NH4Cl 4%",    code:"NH4CL-4",  uom:"bbl", conc:"300",  vol:"70"},
      "Displacement":     {name:"NH4Cl 4%",    code:"NH4CL-4",  uom:"bbl", conc:"300",  vol:"50"},
      "Diverter":         {name:"VES Diverter",code:"VES-DIV",  uom:"bbl", conc:"100",  vol:"20"},
    };
    const def = DEFAULT_FIRST[st] || {name:"NH4Cl 4%", code:"NH4CL-4", uom:"gal", conc:"1000", vol:"1000"};
    return {
      id:        Date.now(),
      name:      "",
      stageType: st,
      numAdditives: 1,
      additives: [{id: Date.now() + 1, ...def, weight:""}],
      props:     {density:1.0,visc:1.0,rxCalcite:0,rxDolomite:0,rxShale:0},
    };
  }

  function openComposition(rec) {
    // Edit existing recipe
    setEditRec({...rec, additives:[...rec.additives.map(a=>({...a}))]});
    setPopup("edit");   // "edit" = editing existing recipe
  }
  function openAdd() {
    setEditRec(newRecipe());
    setPopup("add");    // "add" = creating new recipe
  }

  function saveRecipe() {
    if (!editRec.name.trim()) { setWarn("Recipe name is required."); return; }
    // Validate no duplicate products
    const names = editRec.additives.map(a=>a.name).filter(Boolean);
    if (new Set(names).size !== names.length) { setWarn("Duplicate products found in composition."); return; }
    // Validate no negatives
    for (const a of editRec.additives) {
      if (parseFloat(a.conc)<0||parseFloat(a.vol)<0) { setWarn("Concentrations and volumes must be non-negative."); return; }
    }
    setWarn("");
    const props = calcMixtureProps(editRec.additives, fluidDB);
    // totalVol: sum of actual additive volumes entered by the user in the recipe.
    // User enters volumes for each fluid component mixed in the recipe.
    // The total recipe volume = Σ(additive.vol) across all additives.
    const sumAdditiveVol = (editRec.additives || []).reduce((s, a) => {
      const v = parseFloat(a.vol) || parseFloat(a.conc) || 0;
      return s + v;
    }, 0);
    // Stage-type defaults as fallback when no additive volumes are set
    const stageVolDefaults = {"Preflush":200,"Main Injection":500,"Overflush":150,
                               "Postflush":100,"Displacement":100,"Diverter":50};
    const totalVol = sumAdditiveVol > 0
      ? sumAdditiveVol                                      // from additive vol inputs
      : (editRec.totalVol || stageVolDefaults[editRec.stageType] || 200);
    const saved = {...editRec, props, totalVol};
    if (popup==="add") {
      setRecipes(rs => {
        const next = [...rs, saved];
        if (setSharedRecipes) setSharedRecipes(next);
        return next;
      });
    } else {
      setRecipes(rs => {
        const next = rs.map(r => r.id===saved.id ? saved : r);
        if (setSharedRecipes) setSharedRecipes(next);
        return next;
      });
    }
    setEditRec(null);
    setPopup(null);
    setWarn("");
  }

  function deleteRecipe(id) {
    // Direct delete without confirm dialog (confirm() blocked in some environments)
    setRecipes(rs => {
      const next = rs.filter(r => r.id !== id);
      if (setSharedRecipes) setSharedRecipes(next);
      return next;
    });
  }
  function duplicateRecipe(rec) {
    const dup = {...rec, id:Date.now()+1, name:rec.name+" (copy)",
      isDefault:false,
      additives:rec.additives.map((a,i)=>({...a,id:Date.now()+i+10}))};
    // Use functional update to always get latest recipes
    setRecipes(rs => {
      const next = [...rs, dup];
      if (setSharedRecipes) setSharedRecipes(next);
      return next;
    });
  }

  function updateAdditiveCount(n) {
    setEditRec(prev => {
      if (!prev) return prev;
      const cur = prev.additives;
      const arr = n > cur.length
        ? [...cur, ...Array.from({length:n-cur.length},(_,i)=>emptyAdditive(cur.length+i))]
        : cur.slice(0,n);
      const props = calcMixtureProps(arr, fluidDB);
      return {...prev, numAdditives:n, additives:arr, props};
    });
  }

  function updateAdditive(idx, key, val) {
    setEditRec(prev => {
      if (!prev) return prev;
      const arr = prev.additives.map((a,i) => i===idx ? {...a,[key]:val} : a);
      const props = calcMixtureProps(arr, fluidDB);
      return {...prev, additives:arr, props};
    });
  }

  // Validate total conc warning
  function totalConcWarning(additives) {
    const total = additives.reduce((s,a)=>s+(parseFloat(a.conc)||0),0);
    if (total > 1200) return `Total concentration (${total.toFixed(0)}) may be unrealistically high.`;
    return "";
  }

  const filtered = recipes.filter(r => {
    const catOk = filter==="All" || r.stageType===filter;
    const srOk  = !search || r.name.toLowerCase().includes(search.toLowerCase());
    return catOk && srOk;
  });

  const col = s => STAGE_COLORS_RD[s] || T.teal;

  // ── Composition Popup ────────────────────────────────────────────────────────
  function CompositionPopup() {
    if (!editRec) return null;
    const concWarn = totalConcWarning(editRec.additives);
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9000,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#fff",width:"min(900px,96vw)",maxHeight:"92vh",
          display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>

          {/* Header */}
          <div style={{background:col(editRec.stageType),padding:"12px 18px",
            display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>
                {popup==="add"?"New Recipe — Composition":"Edit Recipe — Composition"}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.8)",marginTop:2}}>
                {editRec.stageType} Stage · {editRec.numAdditives} additive{editRec.numAdditives!==1?"s":""}
              </div>
            </div>
            <button onClick={()=>{setPopup(null);setEditRec(null);}} style={{
              cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",
              border:"1px solid rgba(255,255,255,0.3)",fontSize:14,fontWeight:700,
              width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",
            }}>✕</button>
          </div>

          <div style={{flex:1,overflow:"auto",padding:18}}>
            {/* Recipe name + stage row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 200px 160px",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4}}>Recipe Name *</div>
                <input className="si" value={editRec.name}
                  onChange={e=>setEditRec({...editRec,name:e.target.value})}
                  placeholder="e.g. HCl 15% + CI + Iron Control"
                  style={{width:"100%",fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4}}>Stage Type</div>
                <select className="ss" value={editRec.stageType}
                  onChange={e=>setEditRec({...editRec,stageType:e.target.value})}
                  style={{width:"100%",fontSize:12,height:30}}>
                  {STAGE_TYPES_RD.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4}}>
                  # Additives (1–10)
                </div>
                <select className="ss" value={editRec.numAdditives}
                  onChange={e=>updateAdditiveCount(+e.target.value)}
                  style={{width:"100%",fontSize:12,height:30}}>
                  {Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
            </div>

            {/* Additive composition table */}
            <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:6}}>
              Composition — Products from Fluid Library
            </div>
            {concWarn && <div style={{padding:"5px 10px",background:"#FFF3E0",border:`1px solid ${T.gold}`,
              fontSize:11,color:T.gold,marginBottom:8}}>⚠ {concWarn}</div>}
            {warn && <div style={{padding:"5px 10px",background:"#FCE8E8",border:`1px solid ${T.red}`,
              fontSize:11,color:T.red,marginBottom:8}}>✕ {warn}</div>}

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:T.bg3}}>
                    {["#","Product Code","Product Name","Conc / 1000 Gal","UOM","Volume / Weight",
                      "Density (g/cm³)","Viscosity (cP)","Rxn Rate (Calc)"].map(h=>(
                      <th key={h} style={{padding:"5px 8px",textAlign:"left",fontWeight:700,
                        color:T.text1,border:`1px solid ${T.border0}`,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editRec.additives.map((a,i)=>{
                    const fl = fluidDB.find(f=>f.name===a.name)||{};
                    return <tr key={a.id||i} style={{background:i%2===0?"#fff":"#F7F9FC"}}>
                      <td style={{padding:"4px 8px",border:`1px solid ${T.border0}`,
                        textAlign:"center",color:T.text3,fontSize:10}}>{i+1}</td>
                      {/* Product Code — auto from fluid ID */}
                      <td style={{padding:"3px 5px",border:`1px solid ${T.border0}`}}>
                        <input className="si" value={a.code||""} placeholder="e.g. HCL-15"
                          onChange={e=>updateAdditive(i,"code",e.target.value)}
                          style={{width:"100%",fontSize:10,height:22}}/>
                      </td>
                      {/* Product Name — searchable dropdown from Fluid Library */}
                      <td style={{padding:"3px 5px",border:`1px solid ${T.border0}`,minWidth:180}}>
                        <select className="ss" value={a.name||""}
                          onChange={e=>updateAdditive(i,"name",e.target.value)}
                          style={{fontSize:10,height:22,width:"100%"}}>
                          <option value="">— Select product —</option>
                          {FLUID_CATEGORIES.map(cat=>{
                            const fls=fluidDB.filter(f=>f.cat===cat);
                            if(!fls.length) return null;
                            return <optgroup key={cat} label={cat}>
                              {fls.map(f=><option key={f.id} value={f.name}>{f.name}</option>)}
                            </optgroup>;
                          })}
                        </select>
                        {!fl.name&&a.name&&<div style={{fontSize:9,color:T.red,marginTop:1}}>
                          Not in Fluid Library
                        </div>}
                      </td>
                      {/* Conc per 1000 Gal */}
                      <td style={{padding:"3px 5px",border:`1px solid ${T.border0}`}}>
                        <input className="si" value={a.conc||""} placeholder="50"
                          onChange={e=>updateAdditive(i,"conc",e.target.value)}
                          style={{width:"80px",fontSize:10,height:22}}/>
                      </td>
                      {/* UOM */}
                      <td style={{padding:"3px 5px",border:`1px solid ${T.border0}`}}>
                        <select className="ss" value={a.uom||"gal"}
                          onChange={e=>updateAdditive(i,"uom",e.target.value)}
                          style={{fontSize:10,height:22,width:"60px"}}>
                          {UOM_OPTS.map(u=><option key={u}>{u}</option>)}
                        </select>
                      </td>
                      {/* Volume / Weight */}
                      <td style={{padding:"3px 5px",border:`1px solid ${T.border0}`}}>
                        <input className="si" value={a.vol||""} placeholder="auto"
                          onChange={e=>updateAdditive(i,"vol",e.target.value)}
                          style={{width:"70px",fontSize:10,height:22}}/>
                      </td>
                      {/* Read-only fluid properties */}
                      <td style={{padding:"4px 8px",border:`1px solid ${T.border0}`,
                        fontFamily:T.mono,fontSize:10,color:T.text2,textAlign:"right"}}>
                        {fl.density||"—"}
                      </td>
                      <td style={{padding:"4px 8px",border:`1px solid ${T.border0}`,
                        fontFamily:T.mono,fontSize:10,color:T.text2,textAlign:"right"}}>
                        {fl.visc||"—"}
                      </td>
                      <td style={{padding:"4px 8px",border:`1px solid ${T.border0}`,
                        fontFamily:T.mono,fontSize:10,color:T.text2,textAlign:"right"}}>
                        {fl.rxCalcite||"—"}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculated mixture properties */}
            <div style={{marginTop:14,padding:"12px 16px",
              background:`${col(editRec.stageType)}10`,
              border:`1px solid ${col(editRec.stageType)}40`}}>
              <div style={{fontSize:11,fontWeight:700,color:col(editRec.stageType),
                marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                Calculated Mixture Properties
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
                {[
                  ["Density","g/cm³",editRec.props?.density],
                  ["Viscosity","cP",editRec.props?.visc],
                  ["Rxn Rate (Calcite)","mol/m²·s",editRec.props?.rxCalcite],
                  ["Rxn Rate (Dolomite)","mol/m²·s",editRec.props?.rxDolomite],
                  ["Rxn Rate (Shale)","mol/m²·s",editRec.props?.rxShale],
                ].map(([label,unit,val])=>(
                  <div key={label} style={{textAlign:"center",
                    background:"rgba(255,255,255,0.7)",padding:"8px 6px"}}>
                    <div style={{fontSize:9,color:T.text3,textTransform:"uppercase",
                      letterSpacing:"0.4px",marginBottom:3}}>{label}</div>
                    <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono,
                      color:col(editRec.stageType)}}>
                      {val!=null?(+val).toFixed(4):"—"}
                    </div>
                    <div style={{fontSize:9,color:T.text3}}>{unit}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{padding:"12px 18px",borderTop:"1px solid #D8E2EC",
            display:"flex",gap:8,background:"#F7FAFC",flexShrink:0,alignItems:"center"}}>
            <button onClick={saveRecipe} style={{
              padding:"8px 24px",background:"#0078A8",color:"#fff",
              border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
            }}>Save Recipe</button>
            <button onClick={()=>{setPopup(null);setEditRec(null);setWarn("");}} style={{
              padding:"8px 18px",background:"transparent",color:"#5A7A94",
              border:"1px solid #C0D4E4",cursor:"pointer",fontSize:12,fontWeight:600,
            }}>Cancel</button>
            {warn && <span style={{fontSize:11,color:"#C0392B",fontWeight:600}}>{warn}</span>}
          </div>
        </div>
      </div>
    );
  }

  // When displayed as a required input page, wrap with modal navigation

  const STAGE_META = {
    "Preflush":      { icon:"▼", desc:"Pre-treatment solvent/spacer", color:"#1A7A40" },
    "Main Injection":{ icon:"★", desc:"Primary acid treatment",        color:"#0078A8" },
    "Overflush":     { icon:"▲", desc:"Post-flush displacement",       color:"#1565C0" },
    "Postflush":     { icon:"◆", desc:"Final cleanup flush",           color:"#6A1B9A" },
    "Displacement":  { icon:"→", desc:"Tubing displacement",           color:"#795548" },
    "Diverter":      { icon:"⊕", desc:"Diversion stage",              color:"#E65100" },
  };

  const content = (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",minHeight:0}}>

    {/* ── Topbar ─────────────────────────────────────────────────────────── */}
    <Topbar title="Recipe Design"
      sub={`${recipes.length} recipes · ${fluidDB.length} products in library`}
      actions={<Btn v="p" sz="s" onClick={openAdd}>+ New Recipe</Btn>}
    />

    {/* ── Stage filter + search ───────────────────────────────────────────── */}
    <div style={{background:T.bg3,borderBottom:`1px solid ${T.border0}`,padding:"6px 12px",
      display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",flexShrink:0}}>
      {["All",...STAGE_TYPES_RD].map(s=>{
        const active = filter===s;
        const c = STAGE_COLORS_RD[s]||T.teal;
        return <div key={s} onClick={()=>setFilter(s)} style={{
          padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:600,
          background:active?c:"#fff",color:active?"#fff":T.text1,
          border:`1px solid ${active?c:T.border1}`,
        }}>{s}</div>;
      })}
      <input className="si" placeholder="Search recipes..." value={search}
        onChange={e=>setSearch(e.target.value)}
        style={{marginLeft:"auto",width:180,fontSize:11}}/>
    </div>

    {/* ── Recipe cards ──────────────────────────────────────────────────── */}
    <div style={{flex:1,overflow:"auto",padding:12}}>
      {filtered.length===0
        ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",height:"60%",gap:10,color:T.text3}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text2}}>No recipes</div>
            <div style={{fontSize:11,textAlign:"center",maxWidth:280,color:T.text3}}>
              Click <b>+ New Recipe</b> to create your first treatment recipe.
              Recipes appear in the Pumping Schedule fluid dropdown, filtered by stage.
            </div>
            <Btn v="p" sz="s" onClick={openAdd} sx={{marginTop:6}}>+ New Recipe</Btn>
          </div>
        : <div style={{display:"grid",gap:10}}>
            {filtered.map(rec=>{
              const c = col(rec.stageType);
              const meta = STAGE_META[rec.stageType]||{};
              const filled = rec.additives.filter(a=>a.name).length;
              return <div key={rec.id} style={{
                background:"#fff",border:"1px solid #D8E2EC",
                borderLeft:`4px solid ${c}`,overflow:"hidden",
              }}>
                {/* Card header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 16px",borderBottom:"1px solid #EDF0F5",background:"#FAFBFC"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:16,opacity:0.7}}>{meta.icon||"⚗"}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1A2A3A"}}>
                        {rec.name||<span style={{color:"#A0B0C0",fontStyle:"italic"}}>Untitled Recipe</span>}
                        {rec.isDefault && <span style={{marginLeft:8,fontSize:9,padding:"1px 6px",
                          background:"#E3F2FD",color:"#1565C0",fontWeight:700,verticalAlign:"middle"}}>
                          DEFAULT
                        </span>}
                      </div>
                      <div style={{fontSize:10,color:"#7A90A4",marginTop:1}}>{meta.desc||rec.stageType}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,padding:"3px 10px",fontWeight:700,
                      background:c+"18",color:c,border:`1px solid ${c}40`}}>
                      {rec.stageType}
                    </span>
                    <span style={{fontSize:10,color:"#8FA8C0"}}>
                      {filled}/{rec.numAdditives} products
                    </span>
                  </div>
                </div>

                {/* Card body: mixture props + actions */}
                <div style={{display:"flex",alignItems:"center",
                  justifyContent:"space-between",padding:"10px 16px",flexWrap:"wrap",gap:8}}>
                  {/* Mixture properties pills */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[
                      {label:"ρ",   val:rec.props?.density,   unit:"g/cm³"},
                      {label:"μ",   val:rec.props?.visc,      unit:"cP"},
                      {label:"Rc",  val:rec.props?.rxCalcite, unit:"mol/m²s"},
                      {label:"Rd",  val:rec.props?.rxDolomite,unit:"mol/m²s"},
                    ].map(({label,val,unit})=>(
                      <div key={label} style={{
                        display:"flex",alignItems:"baseline",gap:3,
                        padding:"3px 8px",background:"#F0F4F8",border:"1px solid #D8E2EC",
                        fontSize:10,
                      }}>
                        <span style={{fontWeight:700,color:c,fontSize:11}}>{label}</span>
                        <span style={{fontFamily:"monospace",color:"#1A3A5A",fontWeight:600}}>
                          {val!=null?(+val).toFixed(val<1?4:2):"—"}
                        </span>
                        <span style={{color:"#9AAABB",fontSize:9}}>{unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{display:"flex",gap:4}}>
                    <Btn sz="s" v="p" onClick={()=>openComposition(rec)}>Edit</Btn>
                    <Btn sz="s" v="g" onClick={()=>duplicateRecipe(rec)}>Dup</Btn>
                    <Btn sz="s" v="r" onClick={()=>deleteRecipe(rec.id)}>Del</Btn>
                  </div>
                </div>

                {/* Additive summary strip */}
                {filled>0 && <div style={{padding:"6px 16px 8px",borderTop:"1px solid #EDF0F5",
                  display:"flex",gap:6,flexWrap:"wrap"}}>
                  {rec.additives.filter(a=>a.name).map((a,i)=>(
                    <span key={i} style={{fontSize:9,padding:"2px 7px",background:"#EDF1F5",
                      color:"#3A5A7A",border:"1px solid #D0DCE8"}}>
                      {a.name} · {a.conc||"?"} {a.uom||"gal"}/Mgal
                    </span>
                  ))}
                </div>}
              </div>;
            })}
          </div>
      }
    </div>

    {/* Composition popup */}
    {popup && editRec && CompositionPopup()}
  </div>
  );  // end content

  // When shown as required input (modal overlay), wrap with InputModal for nav
  if (isRequired) {
    return <InputModal title="Recipe Design"
      onClose={()=>setPage("inputs")}
      onPrev={()=>setPage("pumping_data")}
      onNext={()=>{
        // Sync recipes → schedule: build one row per recipe, ordered by stageType
        if (setSharedSched && recipes && recipes.length) {
          const ORDER = ["Preflush","Main Injection","Diverter","Overflush","Displacement"];
          const sorted = [...recipes].sort((a,b)=>ORDER.indexOf(a.stageType)-ORDER.indexOf(b.stageType));
          const newSched = sorted.map((rec, idx) => ({
            id: idx + 1,
            stage: rec.stageType,
            fluid: rec.name,
            // Convert totalVol from bbl to bbl (schedule stores in bbl; default rate 3 bpm)
            vol:   rec.totalVol > 0 ? +rec.totalVol
                   : rec.additives.reduce((s,a)=>s+(+a.vol||0),0) || 500,
            rate:  3,
            dir:   "Surface",
            injDepth: 0,
            _fromRecipe: true,
          }));
          setSharedSched(newSched);
        }
        setPage("damage_type");
      }} nextLabel="Next"
    >
      <div style={{height:"70vh",overflow:"auto",margin:"-16px -20px"}}>
        {content}
      </div>
    </InputModal>;
  }
  return content;
}

// ─── RECIPE DESIGN CONSTANTS ──────────────────────────────────────────────────

// ─── PUMP SCHEDULE ────────────────────────────────────────────────────────────
// Volume stored in Gallons; engine converts: BBL = Gal/42
// Rate stored in GPM; engine converts: BPM = GPM/42
function SchedulePage({ project, setPage, sharedSched, setSharedSched, resRows, sharedRecipes }) {
  const DEFAULT_ROWS = () => [
    { id:1, stage:"Pre-Flush",      fluid:"Standard Preflush", rate:3, vol:200, dir:"Surface", injDepth:0 },
    { id:2, stage:"Main Injection", fluid:"HCl 15% Main Acid", rate:3, vol:500, dir:"Surface", injDepth:0 },
    { id:3, stage:"Overflush",      fluid:"KCl 2% Overflush",  rate:3, vol:150, dir:"Surface", injDepth:0 },
  ];
  // Initialise schedule rows; vol comes from matching recipe's totalVol if available
  const [localRows, setLocalRows] = useState(() => {
    const base = (sharedSched && sharedSched.length)
      ? sharedSched.map(r => ({...r}))
      : DEFAULT_ROWS();
    // Pull vol from matching recipe (recipe design page is the authoritative source)
    return base.map(row => {
      const rec = (sharedRecipes || []).find(r => r.name === row.fluid);
      if (rec && rec.totalVol && rec.totalVol > 0) return { ...row, vol: rec.totalVol };
      return row;
    });
  });
  const rows    = sharedSched || localRows;
  const setRows = fn => {
    const next = typeof fn==="function" ? fn(rows) : fn;
    setLocalRows(next);
    if (setSharedSched) setSharedSched(next);
  };

  const STAGE_OPTS  = ["Pre-Flush","Main Injection","Diverter","Post-Flush","Overflush"];
  const DIR_OPTS    = ["Surface","RAMP UP","RAMP DOWN"];

  // When a recipe is selected, pull its mixture properties and default volume
  function handleFluidChange(rowIdx, name) {
    const rec = (sharedRecipes||[]).find(rc=>rc.name===name);
    const update = {fluid:name, _isRecipe:!!rec,
      _recipeProps:     rec ? rec.props     : undefined,
      _recipeAdditives: rec ? rec.additives : undefined,  // for rxRate fallback lookup
    };
    if (rec) {
      // Pull volume from recipe if it has a stored totalVol, otherwise use stage default
      const stageVolMap = {"Pre-Flush":200, "Main Injection":500, "Overflush":150,
                           "Diverter":50, "Post-Flush":100, "Postflush":100, "Displacement":100};
      // Pull volume from recipe: totalVol = Σ(additive volumes) from Recipe Design page
      const recipeVol = (rec.totalVol && rec.totalVol > 0)
        ? rec.totalVol
        : (rec.recommendedVol || stageVolMap[rec.stageType] || stageVolMap[rows[rowIdx]?.stage] || 200);
      update.vol = recipeVol;
    }
    setRows(rs=>rs.map((x,j)=>j===rowIdx?{...x,...update}:x));
  }

  const totalVolBBL = rows.reduce((s,r)=>s+(+r.vol||0),0);
  const isCT = (project&&project.injection)==="CT";

  const schedCols = [
    {key:"stage", label:"Stage",            w:120, type:"select", opts:STAGE_OPTS},
    {key:"fluid", label:"Fluid / Recipe",   w:170, type:"fluid"},
    {key:"rate",  label:"Pump Rate (BPM)",  w:90},
    {key:"vol",   label:"Volume (BBL)",     w:90},
    {key:"dir",   label:"Direction",        w:100, type:"select", opts:DIR_OPTS},
    ...(isCT?[{key:"injDepth",label:"Inj. Depth (ft)",w:90}]:[]),
  ];

  function addRow() {
    const last = rows[rows.length-1]||{};
    setRows(rs=>[...rs,{id:Date.now(),stage:"Main Injection",fluid:"HCl 15% Main Acid",
      rate:last.rate||3,vol:last.vol||500,dir:"Surface",injDepth:0}]);
  }

  // Build fluid dropdown options — recipes only (from Recipe Design page)
  function getFluidOpts(stageType) {
    const sk = (stageType||"").toLowerCase();
    const recs = (sharedRecipes||[]).filter(rc=>{
      if (!stageType || stageType==="All") return true;
      const rt = (rc.stageType||"").toLowerCase();
      if (sk.includes("pre") || sk.includes("flush")) return rt.includes("pre") || rt.includes("flush") || rt.includes("displace");
      if (sk.includes("main") || sk.includes("inject")) return rt.includes("main") || rt.includes("inject");
      if (sk.includes("over")) return rt.includes("over");
      if (sk.includes("divert")) return rt.includes("divert");
      if (sk.includes("post")) return rt.includes("post");
      return true;
    });
    return {recs};
  }

  return <InputModal title="Pumping Schedule"
    onClose={()=>setPage("inputs")}
    onPrev={()=>setPage("rock_props")}
    onNext={()=>setPage("sim")} nextLabel="Run Simulation"
  >
    {/* Toolbar */}
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,
      padding:"8px 10px",background:T.bg3,border:`1px solid ${T.border0}`,flexWrap:"wrap"}}>
      {/* CSV template download */}
      <Btn sz="s" v="g" onClick={()=>{
        const csv="Stage,Fluid/Recipe,Rate (BPM),Volume (BBL),Direction\nPre-Flush,Standard Preflush,12,200,Surface\nMain Injection,HCl 15% Main Acid,12,500,Surface\nOverflush,KCl 2% Overflush,12,150,Surface\n";
        const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);
        const a=document.createElement("a");a.href=url;a.download="PumpingSchedule_Template.csv";
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url),2000);
      }}>Download Template</Btn>
      <Btn sz="s" v="g" onClick={()=>setRows(DEFAULT_ROWS())}>Reset</Btn>
      <Btn sz="s" v="o" onClick={addRow}>+ Add Stage</Btn>
      <div style={{marginLeft:"auto",fontFamily:T.mono,fontSize:11,color:T.teal,fontWeight:700}}>
        Total: {totalVolBBL.toFixed(0)} BBL &nbsp;|&nbsp; {rows.length} stage{rows.length!==1?"s":""}
      </div>
    </div>

    {/* Unit note */}
    <div style={{padding:"4px 10px",background:"#EAF5FF",border:`1px solid ${T.border0}`,
      fontSize:10,color:T.text2,marginBottom:0,display:"flex",gap:16,flexWrap:"wrap"}}>
      <span>Rate: <b>BPM</b> (barrels per minute, used directly in calculation)</span>
      <span>Volume: <b>BBL</b> (barrels, used directly in calculation)</span>
    </div>

    {/* Table */}
    <div style={{overflowX:"auto",border:`1px solid ${T.border0}`,marginTop:8}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{background:T.bg3}}>
          <th style={{padding:"5px 7px",textAlign:"center",fontWeight:700,
            color:T.text1,border:`1px solid ${T.border0}`,fontSize:10,width:30}}>#</th>
          {schedCols.map(c=><th key={c.key} style={{padding:"5px 7px",textAlign:"left",
            fontWeight:700,color:T.text1,border:`1px solid ${T.border0}`,
            fontSize:10,whiteSpace:"nowrap"}}>{c.label}</th>)}
          <th style={{padding:"5px 7px",border:`1px solid ${T.border0}`,width:28}}/>
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>{
            const {recs} = getFluidOpts(r.stage);
            return <tr key={r.id||i} style={{background:i%2===0?"#fff":"#F4F8FC"}}>
              <td style={{padding:"4px 6px",border:`1px solid ${T.border0}`,
                textAlign:"center",fontFamily:T.mono,fontSize:10,color:T.text2}}>{i+1}</td>
              {schedCols.map(c=>(
                <td key={c.key} style={{padding:"2px 3px",border:`1px solid ${T.border0}`}}>
                  {c.type==="fluid"
                    ? <select className="ss" value={r.fluid||""} style={{fontSize:10,height:22,width:"100%"}}
                        onChange={e=>handleFluidChange(i,e.target.value)}>
                        <option value="">— Select recipe —</option>
                        {recs.length===0
                          ? <option disabled>No recipes — go to Recipe Design</option>
                          : recs.map(rc=><option key={rc.id} value={rc.name}>{rc.name}</option>)
                        }
                      </select>
                    : c.type==="select"
                      ? <select className="ss" style={{fontSize:10,height:22,width:"100%"}} value={r[c.key]||""}
                          onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,[c.key]:e.target.value}:x))}>
                          {(c.opts||[]).map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input className="si" style={{width:"100%",fontSize:10,height:22,padding:"2px 4px"}}
                          value={r[c.key]??""} placeholder={c.key==="rate"?"BPM":c.key==="vol"?"BBL":""}
                          onChange={e=>setRows(rs=>rs.map((x,j)=>j===i?{...x,[c.key]:e.target.value}:x))}/>
                  }
                </td>
              ))}
              <td style={{padding:"2px 4px",border:`1px solid ${T.border0}`,textAlign:"center"}}>
                <div onClick={()=>setRows(rs=>rs.filter((_,j)=>j!==i))} style={{
                  width:18,height:18,cursor:"pointer",background:"#FCE8E8",
                  border:`1px solid ${T.red}`,color:T.red,fontWeight:700,fontSize:12,
                  display:"flex",alignItems:"center",justifyContent:"center",userSelect:"none",margin:"auto",
                }}>x</div>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </InputModal>;
}


// ─── VALIDATION ENGINE ────────────────────────────────────────────────────────
function validateInputs(resRows, wellData, schedRows) {
  const errs = [];
  function err(field, msg, suggestion, severity) {
    errs.push({ field, msg, severity:severity||"error",
      suggestion: suggestion || "Review value and correct to within the acceptable engineering range." });
  }
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
  if (resRows.length === 0) err("Reservoir Data", `At least one depth interval is required`, "Check acceptable range and correct the value before running simulation.");
  // Well validation
  const wbR = +wellData.wbR, drainR = +wellData.drainR, resTop = +wellData.resTop, fricGrad = +wellData.fricGrad, khkv = +wellData.khkv;
  // wbR is wellbore RADIUS in inches (typical: 3-6 in diameter = 1.5-3 in radius)
  // Valid range: 0.5 to 18 inches (covers 1-in to 36-in boreholes)
  if (isNaN(wbR) || wbR < 0.5 || wbR > 18.0) err("Well: Wellbore Radius",
    `${wbR} in is outside valid range [0.5 – 18 in]`,
    "Wellbore radius is half the borehole diameter. Typical casing OD: 5.5–9.625 in → radius 2.75–4.8 in. Default is 3 in (6-in diameter borehole).");
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
    // Rate in BPM; valid range 0.1–30 BPM
    if (isNaN(rate) || rate <= 0 || rate > 30) err(`Schedule stage ${i+1}: Pump Rate`, `${rate} BPM is outside valid range [0.1 – 30 BPM]`, "Typical matrix acid rate: 0.5–15 BPM. Verify tubing friction and fracture gradient limits.");
    // Volume in BBL; valid range 1–50,000 BBL
    if (isNaN(vol) || vol <= 0 || vol > 50000) err(`Schedule stage ${i+1}: Volume`, `${vol} BBL is outside valid range [1 – 50,000 BBL]`, "Typical matrix job: 50–2,000 BBL per stage.");
    if (!r.fluid) err(`Schedule stage ${i+1}: Fluid`, "Fluid selection is required", "Select a fluid from the Fluids Library. At minimum, Main Injection requires an acid fluid (e.g. HCl 15%).");
    // Depth columns only validated when CT injection provides them
    if (r.fromDepth !== undefined && r.fromDepth !== "") {
      const fd = +r.fromDepth, td = +r.toDepth;
      if (isNaN(fd) || fd < 500 || fd > 30000) errs.push({ field: `Schedule stage ${i+1}: From Depth`, msg: `${fd} ft is outside valid range [500 – 30,000 ft]` });
      if (isNaN(td) || td <= fd) errs.push({ field: `Schedule stage ${i+1}: To Depth`, msg: `To Depth (${td}) must be greater than From Depth (${fd})` });
    }
  });
  if (schedRows.length === 0) err("Pump Schedule", `At least one pumping stage is required`, "Add at least one stage in Pumping Schedule: Preflush + Main Injection + Overflush is the standard sequence.");
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
    <div style={{ padding: "22px 40px", maxWidth: 900, margin: "0 auto" }}>
      <Card title="Pre-Simulation Checklist" sx={{ marginBottom: 14 }}>
        {steps.map((s, i) => <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < steps.length - 1 ? `1px solid ${T.border0}` : "none" }}>
          <div style={{ width: 19, height: 19, borderRadius: "50%", background: stepChecks[i] ? "rgba(45,184,130,0.12)" : "rgba(224,80,80,0.12)", border: `1px solid ${stepChecks[i] ? T.green : T.red}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: stepChecks[i] ? T.green : T.red, fontSize: 9, fontWeight: 700 }}>{stepChecks[i] ? "✓" : "!"}</span></div>
          <span style={{ fontSize: 13, color: T.text1, flex: 1 }}>{s}</span>
          <Bdg color={stepChecks[i] ? "green" : "red"} label={stepChecks[i] ? "Ready" : "Check"} />
        </div>)}
      </Card>

      {/* Validation errors panel */}
      {validated && validErrs.length > 0 && <div style={{
        background:"#FFF8F8", border:`1px solid ${T.red}`, borderLeft:`4px solid ${T.red}`,
        marginBottom:14, maxHeight:380, overflow:"auto",
      }}>
        <div style={{padding:"10px 16px",background:T.red,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>
            [!] Validation Failed — {validErrs.length} issue{validErrs.length>1?"s":""} found
          </span>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.8)",marginLeft:"auto"}}>
            Correct all issues before running simulation
          </span>
        </div>
        {validErrs.map((e,i)=>(
          <div key={i} style={{padding:"10px 16px",borderBottom:`1px solid #FFD0D0`,
            background:i%2===0?"#FFF8F8":"#FFF0F0"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:9,padding:"1px 6px",fontWeight:700,textTransform:"uppercase",
                background:(e.severity||"error")==="error"?T.red:T.gold,color:"#fff",flexShrink:0}}>
                {(e.severity||"error").toUpperCase()}
              </span>
              <span style={{fontSize:12,color:T.red,fontWeight:700}}>{e.field}</span>
            </div>
            <div style={{fontSize:11,color:T.text1,marginBottom:5}}>
              <b>Issue:</b> {e.msg}
            </div>
            {e.suggestion && <div style={{fontSize:11,color:T.text2,
              background:"#EAF5FF",padding:"5px 8px",borderLeft:`2px solid ${T.teal}`}}>
              <b style={{color:T.teal}}>Suggested correction:</b> {e.suggestion}
            </div>}
          </div>
        ))}
        <div style={{padding:"8px 16px",fontSize:10,color:T.text2,background:T.bg3}}>
          Resolve all errors before proceeding with simulation.
        </div>
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
      {/* Fracture gradient warning — only if actual rates exceed safe limit */}
      {schedRows && schedRows.some(r => {
        const bpm = +(r.rate)||0;
        const maxSafeRate = 15; // BPM — above this fracture risk is higher
        return bpm > maxSafeRate;
      }) && <div className="wb" style={{ marginBottom: 14 }}>
        <span style={{ color: T.gold }}>⚠</span>
        <span style={{ fontSize: 12, color: T.text1 }}>
          Pump rate exceeds 15 BPM in one or more stages — fracture gradient margin may be tight. Review pump rate on Schedule page.
        </span>
      </div>}
      <div onClick={handleValidate} style={{ background: T.teal, color: T.bg0, borderRadius: 10, padding: "15px 0", fontSize: 15, fontWeight: 800, textAlign: "center", cursor: "pointer", userSelect: "none", letterSpacing: "0.4px", transition: "filter 0.15s" }}>▶ Validate & Run Simulation</div>
    </div>
  </div>;
}

// ─── SIMULATION PROGRESS (Mod-3: detailed iterative progress bar) ─────────────
function RunPage({ onDone, simParams, schedRows, resRows, runSimulation, simInputRef }) {
  const { useState, useEffect, useRef } = React;
  const [logLines,   setLogLines]   = useState([]);
  const [shownIdx,   setShownIdx]   = useState(0);
  const [pct,        setPct]        = useState(0);
  const [phase,      setPhase]      = useState("Initializing…");
  const [done,       setDone]       = useState(false);
  const [results,    setResults]    = useState(null);
  const [warnings,   setWarnings]   = useState([]);
  const logRef       = useRef(null);
  const cancelledRef  = useRef(false);   // ref so streaming effect reads it synchronously
  const [cancelled, setCancelled] = useState(false);

  // ── Run simulation synchronously on mount, then stream log ────────────────
  useEffect(() => {
    // Small delay so the UI renders first
    const t0 = setTimeout(() => {
      let res = null;
      try {
        const cur = simInputRef.current || {};
        const resRowsNow = (cur.sharedResRows?.length) ? cur.sharedResRows : resRows || [];
        const wellNow    = cur.sharedWell    || {};
        // Patch schedule rows with FRESH _recipeAdditives from current sharedRecipes.
        // This ensures that if the user changed a recipe's acid (e.g. HCl 15%→32%)
        // and saved, the engine sees the updated additive — not the stale cached version.
        const _recipesNow = cur.sharedRecipes || [];
        const _schedRaw   = (cur.sharedSched?.length) ? cur.sharedSched : schedRows || [];
        const schedNow    = _schedRaw.map(row => {
          const _rec = _recipesNow.find(r => r.name === row.fluid);
          return _rec ? { ...row, _recipeAdditives: _rec.additives, _recipeProps: _rec.props } : row;
        });
        const fluidsNow  = (cur.sharedFluids?.length) ? cur.sharedFluids : [];
        const acidNow    = cur.sharedAcid    || [];
        const paramsNow  = cur.simParams     || simParams;
        const rockNow    = cur.rockProps     || {};
        const pumpNow    = cur.pumpingData   || {};
        const wellWithTemp = { ...wellNow,
          T_surface: parseFloat(rockNow?.surfaceTemp || wellNow?.T_surface || 59),
          T_grad:    parseFloat(rockNow?.geoGradient || wellNow?.T_grad    || 1.5),
          msp:       parseFloat(pumpNow?.msp || 2000),
        };
        res = runSimulation(resRowsNow, wellWithTemp, schedNow, fluidsNow, acidNow,
          paramsNow || { numTimesteps:10, numDepthGrids:100 });
      } catch(e) {
        res = { solverLog: ["[ERROR] " + e.message], summary:{}, depthResults:[] };
      }
      setResults(res);
      let rawLog = res?.solverLog || ["[DONE] No log available"];
      setLogLines(rawLog);
      setWarnings(res?.summary?.pressureWarnings || []);
    }, 120);
    return () => clearTimeout(t0);
  }, []);

  // ── Stream log lines one by one ────────────────────────────────────────────
  useEffect(() => {
    if (!logLines.length || done || cancelledRef.current) return;
    if (shownIdx >= logLines.length) {
      setDone(true);
      setPct(100);
      setPhase("Complete");
      return;
    }
    // Vary speed: WALL_TIMEOUT / ERROR lines pause longer; normal lines faster
    const line = logLines[shownIdx] || "";
    const isWarn  = /WARN|CONV|FRAC|ABORT|ERROR|TIMEOUT/i.test(line);
    const isStage = /^Stage\s+\d/i.test(line.trim());
    const delay   = isWarn ? 180 : isStage ? 120 : 18;

    const t = setTimeout(() => {
      setShownIdx(i => i + 1);
      const p = Math.min(99, Math.round((shownIdx + 1) / logLines.length * 100));
      setPct(p);
      // Update phase label from log content
      if (isStage) setPhase(line.trim().slice(0,60));
      else if (/pressure|solver/i.test(line))    setPhase("Solving wellbore pressure…");
      else if (/chemistry|wormhole|skin/i.test(line)) setPhase("Applying acid chemistry…");
      else if (/aggregate|output|DONE/i.test(line))   setPhase("Assembling results…");
      // Auto-scroll log window
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, delay);
    return () => clearTimeout(t);
  }, [shownIdx, logLines, done]);

  // Line classifier → colour
  function lineStyle(line) {
    if (/WALL_TIMEOUT|ABORT/i.test(line))      return { color:"#EF5350", fontWeight:700 };
    if (/CONV_WARN|pressureWarn|\[WARN\]/i.test(line)) return { color:"#FF9800", fontWeight:600 };
    if (/FRAC|fracture/i.test(line))            return { color:"#FF7043", fontWeight:600 };
    if (/ERROR|FALLBACK/i.test(line))           return { color:"#EF5350" };
    if (/PHYSICS|SQI/i.test(line))              return { color:"#CE93D8" };
    if (/DONE|complete|aggregat/i.test(line))   return { color:"#66BB6A", fontWeight:600 };
    if (/^Stage\s+\d/i.test(line.trim()))       return { color:"#29B6F6", fontWeight:600 };
    if (/^\s+Stage\s+\d.*done/i.test(line))     return { color:"#4FC3F7" };
    if (/OUTPUT/i.test(line))                   return { color:"#81C784" };
    return { color: T.text2 };
  }

  const barColor = pct < 30 ? T.teal : pct < 70 ? T.blue : T.green;

  function handleCancel() {
    cancelledRef.current = true;
    setCancelled(true);
    onDone(null);
  }
  const warnCount = warnings.length;
  const hasError  = logLines.slice(0,shownIdx).some(l => /ERROR|ABORT|TIMEOUT/i.test(l));

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:900,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:T.bg2,border:`1px solid ${T.border1}`,borderRadius:8,
        width:"100%",maxWidth:760,maxHeight:"90vh",display:"flex",flexDirection:"column",
        boxShadow:"0 32px 80px rgba(0,0,0,0.8)"}}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border0}`,
          background:T.bg3,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
            background:done?(hasError?"rgba(239,83,80,0.15)":"rgba(30,207,178,0.15)"):"rgba(41,182,246,0.15)",
            border:`2px solid ${done?(hasError?T.red:T.teal):T.blue}`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
          {done ? (hasError?"⚠":"✓") : "⟳"}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:T.text0}}>
            {done ? "Simulation Complete" : "Simulation Running…"}
          </div>
          <div style={{fontSize:11,color:T.text2,marginTop:1,fontFamily:T.mono}}>{phase}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:barColor,fontFamily:T.mono,lineHeight:1}}>{pct}%</div>
            <div style={{fontSize:9,color:T.text3}}>{shownIdx}/{logLines.length} lines</div>
          </div>
          <div onClick={handleCancel} title={done?"Close":"Stop simulation"}
              style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",
                justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:18,fontWeight:700,
                color:done?T.text2:"#EF5350",
                background:done?"rgba(255,255,255,0.06)":"rgba(239,83,80,0.12)",
                border:`1px solid ${done?T.border0:"rgba(239,83,80,0.4)"}`,
                userSelect:"none"}}>
            ✕
          </div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <div style={{height:4,background:T.bg4,flexShrink:0}}>
        <div style={{height:"100%",width:`${pct}%`,
            background:`linear-gradient(90deg,${barColor},${T.teal})`,
            transition:"width 0.12s linear"}}/>
      </div>

      {/* ── Stage counter pills ────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,padding:"8px 16px",flexShrink:0,
          borderBottom:`1px solid ${T.border0}`,flexWrap:"wrap"}}>
        {[
          {label:"Stages",      val:`${(schedRows||[]).length}`,        col:T.gold},
          {label:"Depth Grids", val:`${simParams?.numDepthGrids||100}`, col:T.blue},
          {label:"Timesteps",   val:`${simParams?.numTimesteps||10}`,   col:T.teal},
          {label:"Layers",      val:`${(resRows||[]).length}`,          col:T.green},
          {label:"Log Lines",   val:`${logLines.length}`,               col:T.text2},
          warnCount>0 ? {label:"Warnings", val:`${warnCount}`, col:T.gold} : null,
          hasError    ? {label:"Errors",   val:"!",            col:T.red}  : null,
        ].filter(Boolean).map(({label,val,col},i)=>(
          <div key={i} style={{background:T.bg3,border:`1px solid ${T.border0}`,
              borderRadius:4,padding:"3px 10px",display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:9,color:T.text3,textTransform:"uppercase"}}>{label}</span>
            <span style={{fontSize:12,fontWeight:700,color:col,fontFamily:T.mono}}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── Solver log window ──────────────────────────────────────────── */}
      <div ref={logRef} style={{flex:1,overflowY:"auto",padding:"10px 16px",
          fontFamily:T.mono,fontSize:11,lineHeight:1.7,background:"#0A0F1A",
          minHeight:280}}>
        {logLines.slice(0, shownIdx).map((line, i) => (
          <div key={i} style={{...lineStyle(line), whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
            <span style={{color:"#2A3A4A",marginRight:8,userSelect:"none",fontSize:9}}>
              {String(i+1).padStart(3,"0")}
            </span>
            {line}
          </div>
        ))}
        {!done && <div style={{color:T.teal,animation:"blink 1s step-end infinite"}}>▋</div>}
      </div>

      {/* ── Warning summary strip (appears as warnings are encountered) ── */}
      {warnCount > 0 && done && <div style={{padding:"8px 16px",
          background:"rgba(255,152,0,0.08)",borderTop:`1px solid rgba(255,152,0,0.3)`,
          flexShrink:0,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.gold}}>⚠ {warnCount} convergence warning{warnCount>1?"s":""}</span>
        {warnings.slice(0,3).map((w,wi)=>(
          <span key={wi} style={{fontSize:10,color:T.text2,background:T.bg3,
              border:`1px solid ${T.border0}`,borderRadius:3,padding:"2px 7px"}}>
            Stage {w.stage}: {w.stageName}
          </span>
        ))}
      </div>}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border0}`,
          display:"flex",gap:10,alignItems:"center",background:T.bg3,flexShrink:0}}>
        <div style={{flex:1,fontSize:11,color:T.text3}}>
          {done
            ? `Completed in ${results?.summary?.simTimeSec ?? "—"}s · SQI: ${results?.summary?.sqi ?? "—"}/100 (${results?.summary?.sqiLabel ?? "—"})`
            : <span style={{color:T.text3}}>Running calculation…
                <span style={{color:"#EF5350",marginLeft:10,fontSize:10}}>Press × or Stop to cancel</span>
              </span>}
        </div>
        {!done && <div onClick={handleCancel} style={{
            background:"transparent",border:"1px solid #EF5350",borderRadius:6,
            padding:"7px 18px",cursor:"pointer",fontSize:12,fontWeight:600,
            color:"#EF5350",userSelect:"none",flexShrink:0}}>
          Stop
        </div>}
        {done && <div onClick={()=>onDone(results)} style={{
            background:T.teal,border:`1px solid ${T.teal}`,borderRadius:6,
            padding:"9px 24px",cursor:"pointer",fontSize:13,fontWeight:700,
            color:"#000",userSelect:"none",flexShrink:0}}>
          View Results →
        </div>}
      </div>
    </div>
  </div>;
}

// ─── DEPTH LINE CHART ─────────────────────────────────────────────────────────
// Same depth-axis contract as DepthPlot. Draws connected lines instead of bars.
// Supports two series (primary + secondary) with the same color scheme.
function DepthLine({ data, xKey, secKey, yKey="depth", botKey="bot",
                     W=260, H=170, color=T.teal, secColor=T.green, label="",
                     xMn, xMx, yMn, yMx }) {
  const pad = { t:8, b:20, l:42, r:10 };
  const gW  = W - pad.l - pad.r;
  const gH  = H - pad.t - pad.b;

  if (!data || !data.length) return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <text x={W/2} y={H/2} textAnchor="middle" fontSize={10} fill={T.text3}>No data</text>
    </svg>
  );

  // Depth range (same logic as DepthPlot)
  const depths = data.map(d => +d[yKey]).filter(v => !isNaN(v) && v > 0);
  const bots   = data.map(d => +(d[botKey]||d[yKey]+50)).filter(v => !isNaN(v) && v > 0);
  const minD   = yMn != null ? yMn : Math.min(...depths, ...bots);
  const maxD   = yMx != null ? yMx : Math.max(...depths, ...bots);
  const rangeD = Math.max(1, maxD - minD);

  // X range
  const vals  = data.map(d => +d[xKey]).filter(v => !isNaN(v));
  const sVals = secKey ? data.map(d => +d[secKey]).filter(v => !isNaN(v)) : [];
  const allV  = [...vals, ...sVals];
  const xMin  = xMn !== undefined ? xMn : 0;
  const xMax  = xMx !== undefined ? xMx : Math.max(1, ...allV) * 1.08;
  const rangeX = Math.max(1, xMax - xMin);

  // Pixel helpers  — same py formula as DepthPlot
  const py = d => pad.t + ((d - minD) / rangeD) * gH;
  const px = v => pad.l + ((v - xMin) / rangeX) * gW;

  // Use exact node depth (yKey = "depth" = n.z) NOT midpoint
  // This plots each node's value at its precise measured depth
  const pts1 = data.map(d => ({
    x: px(+d[xKey]  || 0),
    y: py(+d[yKey]  || 0),
    depth: +d[yKey] || 0,
    val:   +d[xKey] || 0,
  })).filter(p => !isNaN(p.x) && !isNaN(p.y));

  const pts2 = secKey ? data.map(d => ({
    x: px(+d[secKey] || 0),
    y: py(+d[yKey]   || 0),
    depth: +d[yKey]  || 0,
    val:   +d[secKey]|| 0,
  })).filter(p => !isNaN(p.x) && !isNaN(p.y)) : [];

  // Step-function polyline: horizontal then vertical, matching well-log style
  function stepPolyline(pts) {
    if (pts.length === 0) return "";
    const out = [`${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
    for (let i=1; i<pts.length; i++) {
      // Horizontal to new x at prev y, then vertical to new y
      out.push(`${pts[i].x.toFixed(1)},${pts[i-1].y.toFixed(1)}`);
      out.push(`${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`);
    }
    return out.join(' ');
  }

  // Y axis ticks — one per node depth (max 10)
  const step = Math.max(1, Math.floor(data.length / 8));
  const yTicks = data.filter((_,i)=> i%step===0 || i===data.length-1).map(d=>+d[yKey]||0);
  // X axis ticks
  const nXTicks = 5;
  const xTicks = Array.from({length:nXTicks}, (_,i) => xMin + i*(xMax-xMin)/(nXTicks-1));

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{display:"block"}}>
      {/* Chart background */}
      <rect x={pad.l} y={pad.t} width={gW} height={gH} fill="#FAFAFA"/>

      {/* Horizontal grid lines at each node depth */}
      {yTicks.map(d => <line key={d} x1={pad.l} y1={py(d)} x2={pad.l+gW} y2={py(d)}
        stroke="#E0E0E0" strokeWidth={0.5}/>)}
      {/* Vertical grid lines */}
      {xTicks.map(v => <line key={v} x1={px(v)} y1={pad.t} x2={px(v)} y2={pad.t+gH}
        stroke="#E0E0E0" strokeWidth={0.4} strokeDasharray="3,2"/>)}

      {/* Axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t+gH} stroke="#616161" strokeWidth={1.2}/>
      <line x1={pad.l} y1={pad.t+gH} x2={pad.l+gW} y2={pad.t+gH} stroke="#616161" strokeWidth={1}/>

      {/* Y axis depth labels */}
      {yTicks.map(d => (
        <text key={d} x={pad.l-3} y={py(d)+3} textAnchor="end"
          fontSize={7} fill="#546E7A" fontFamily="monospace">{Math.round(d)}</text>
      ))}
      {/* X axis value labels */}
      {xTicks.map(v => (
        <text key={v} x={px(v)} y={pad.t+gH+12} textAnchor="middle"
          fontSize={7} fill="#546E7A" fontFamily="monospace">
          {Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(1)}
        </text>
      ))}

      {/* Step-function curves — professional well-log style */}
      {pts1.length > 1 && <polyline points={stepPolyline(pts1)}
        fill="none" stroke={color} strokeWidth={2} strokeLinejoin="miter"/>}
      {pts2.length > 1 && <polyline points={stepPolyline(pts2)}
        fill="none" stroke={secColor} strokeWidth={1.8}
        strokeLinejoin="miter" strokeDasharray="7,4"/>}

      {/* Node markers — filled circle at each depth node */}
      {pts1.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={2.8}
        fill={color} stroke="#fff" strokeWidth={1} opacity={0.9}/>)}
      {pts2.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={2.5}
        fill={secColor} stroke="#fff" strokeWidth={1} opacity={0.85}/>)}

      {/* Value labels — show at each node (skip if too crowded: >15 nodes) */}
      {data.length <= 12 && pts1.map((p,i) => (
        <text key={i} x={p.x + 4} y={p.y - 2} fontSize={6.5}
          fill={color} fontFamily="monospace" opacity={0.9}>
          {p.val.toFixed(p.val < 10 ? 2 : 1)}
        </text>
      ))}
      {data.length <= 12 && pts2.map((p,i) => (
        <text key={i} x={p.x + 4} y={p.y + 8} fontSize={6.5}
          fill={secColor} fontFamily="monospace" opacity={0.9}>
          {p.val.toFixed(p.val < 10 ? 2 : 1)}
        </text>
      ))}

      {/* Axis titles */}
      <text x={pad.l+gW/2} y={H-1} textAnchor="middle"
        fontSize={8.5} fill="#424242" fontFamily="sans-serif" fontWeight="600">{label}</text>
      <text x={7} y={pad.t+gH/2} textAnchor="middle" fontSize={7.5} fill="#546E7A"
        transform={`rotate(-90,7,${pad.t+gH/2})`} fontFamily="sans-serif">MD (ft)</text>
    </svg>
  );
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
  // Depth range: ALWAYS from top of first reservoir layer to bottom of last layer.
  // This is the authoritative range — well schematic and all charts span exactly this.
  const sortedRES = [...RES].filter(r => +r.top > 0).sort((a,b) => +a.top - +b.top);
  const minD = sortedRES.length ? +sortedRES[0].top : 8000;
  const maxD = sortedRES.length ? +sortedRES[sortedRES.length-1].bot : 8600;

  // EXACTLY match DepthPlot's padding: pad = {t:8, b:20}
  // DepthPlot: gH = H - pad.t - pad.b = H - 28
  const DP_PAD_T = 8, DP_PAD_B = 20;   // ← was 18, now matches DepthPlot exactly
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
        {/* Mini well schematic — fixed pixel height = SH to match chart exactly */}
        <div style={{ flexShrink: 0, width: SW + 12, paddingTop: 4 }}>
          <div style={{ fontSize: 9, color: T.text3, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Well</div>
          <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ display: "block", height: SH, minHeight: SH }}>
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
        {/* Main plot — fixed height SH to match schematic exactly */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: SH, overflow: "hidden" }}>
            {typeof plotContent === "function"
              ? plotContent({yMn:minD, yMx:maxD, H:H_dp})
              : plotContent}
          </div>
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
  let firstPt;  // hoisted for JSC TDZ safety
  for (let si=1; si<stageNames.length; si++) {
    firstPt = ptAll.find(p=>p.stage===stageNames[si]);
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
          Import Field Pressure Data
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

// ══════════════════════════════════════════════════════════════════════════════
// STIMP RO-STYLE CHART — industry-standard layout matching well stimulation software
// Layout: [Depth axis] [Well schematic] [Multi-curve depth plot]
// All curves share a single depth axis. Y = depth (increasing downward).
// Curves: Skin Before (red), Skin After (green), Penetration (blue),
//         PI Before (orange dashed), PI After (green dashed), % Placed (brown)
// ══════════════════════════════════════════════════════════════════════════════
function StimProChart({ data, reservoir, simResults }) {
  const DATA = data || [];
  const RES  = reservoir || INIT_RESERVOIR;
  const summary = simResults && simResults.summary;

  // ── Shared geometry ────────────────────────────────────────────────────────
  const H    = 560;                         // total SVG height [px]
  const PAD  = { t: 40, b: 36, l: 0, r: 20 };
  const gH   = H - PAD.t - PAD.b;          // data area height [px]

  // Depth range: top of first reservoir layer → bottom of last layer (user input)
  const sortedRES = [...RES].filter(r => +r.top > 0).sort((a,b) => +a.top - +b.top);
  const minD  = sortedRES.length ? +sortedRES[0].top                             : 8000;
  const maxD  = sortedRES.length ? +sortedRES[sortedRES.length-1].bot            : 8600;
  const rangeD = Math.max(1, maxD - minD);

  // Shared py formula — converts depth to pixel y position
  const py = d => PAD.t + ((+d - minD) / rangeD) * gH;
  // Midpoint of each data interval
  const mid = r => (+r.depth + +(r.bot || +r.depth + 50)) / 2;

  // ── Well schematic dimensions ───────────────────────────────────────────────
  const SW   = 90;   // schematic SVG width
  const cx   = 52, cw = 22, tw = 10;

  // ── Color palette — matches StimPRO conventions ────────────────────────────
  const COLORS = {
    skinB:   "#D32F2F",   // red — pre-stimulation skin
    skinA:   "#388E3C",   // green — post-stimulation skin
    pen:     "#1565C0",   // blue — wormhole penetration
    piB:     "#E65100",   // orange — pre-stimulation PI
    piA:     "#00897B",   // teal — post-stimulation PI
    placed:  "#795548",   // brown — % acid placed
    grid:    "#E0E0E0",
    axis:    "#616161",
    bg:      "#FFFFFF",
    bgChart: "#FAFAFA",
  };

  // ── Lithology fill colors ───────────────────────────────────────────────────
  const litFill = {
    Carbonate:"rgba(30,180,160,0.15)", Dolomite:"rgba(200,130,20,0.15)",
    Shale:"rgba(120,100,200,0.15)",    Sandstone:"rgba(60,140,220,0.15)",
    Limestone:"rgba(30,200,130,0.15)"
  };

  // ── Depth ticks ─────────────────────────────────────────────────────────────
  const N_TICKS = 8;
  const depthTicks = Array.from({length:N_TICKS}, (_,i) =>
    Math.round(minD + i * rangeD / (N_TICKS - 1))
  );

  // ── Chart panel: multi-curve SVG ────────────────────────────────────────────
  // Each panel has its own x-axis. We use 4 normalised x-panels side by side:
  //   Panel 1 (W=160): Skin (0–maxSkin)
  //   Panel 2 (W=140): Penetration (0–maxPen)
  //   Panel 3 (W=120): PI (0–maxPI)
  //   Panel 4 (W=120): % Placed (0–100)
  const DEPTH_AXIS_W = 44;  // left depth label area
  const PANEL_GAP    = 1;

  const panels = [
    { key:"skin",    label:"Skin Factor",          unit:"",           W:160, color:COLORS.skinB,  color2:COLORS.skinA,  keys:["skinB","skinA"],   names:["Skin Before","Skin After"] },
    { key:"pen",     label:"Penetration",          unit:"(in)",       W:140, color:COLORS.pen,    color2:null,          keys:["pen"],             names:["Penetration (in)"] },
    { key:"pi",      label:"Productivity Index",   unit:"(bbl/d/psi)",W:150, color:COLORS.piB,    color2:COLORS.piA,    keys:["pi_b","pi_a"],     names:["PI Before","PI After"] },
    { key:"placed",  label:"% Acid Placed",         unit:"(%)",       W:120, color:COLORS.placed, color2:null,          keys:["pct_placed"],      names:["% Placed"] },
  ];

  // Augment DATA with pct_placed
  // pct_placed_node is pre-computed per node in _aggregate
  const tot = DATA.reduce((s,x) => s+(+x.V_main_acid||0), 0);
  const D   = DATA.map(r => ({...r,
    pct_placed: r.pct_placed_node!=null ? r.pct_placed_node
      : (tot>0 ? +((+r.V_main_acid||0)/tot*100).toFixed(1) : 0)
  }));

  // Compute chart total width
  const CHART_W = DEPTH_AXIS_W + panels.reduce((s,p) => s+p.W+PANEL_GAP, 0);

  // ── Build SVG for the combined multi-panel chart ─────────────────────────────
    const nodeY = r => py(+r.depth);   // exact node depth Y position
  function buildPanelLines(p, pxOff) {
    // x range for this panel
    const allV = p.keys.flatMap(k => D.map(r => +r[k] || 0)).filter(v => isFinite(v));
    const maxV = Math.max(1, ...allV) * 1.08;
    const pxv  = v => pxOff + ((+v) / maxV) * p.W;

    // Step-function polyline: horizontal then vertical per node (well-log style)
    function stepPts(key) {
      const pts = D.map(r => ({x: pxv(+r[key]||0), y: nodeY(r)}));
      if (!pts.length) return "";
      const out = [`${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
      for (let i=1;i<pts.length;i++){
        out.push(`${pts[i].x.toFixed(1)},${pts[i-1].y.toFixed(1)}`);
        out.push(`${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`);
      }
      return out.join(' ');
    }

    const lines = p.keys.map((k, ki) => {
      const col = ki===0 ? p.color : (p.color2 || p.color);
      return (
        <polyline key={k} points={stepPts(k)} fill="none" stroke={col}
          strokeWidth={ki===0?2.2:1.8}
          strokeDasharray={ki===1?"8,4":"none"}
          strokeLinejoin="miter" strokeLinecap="square"/>
      );
    });

    // Node markers — filled circle at exact node depth
    const dots = p.keys.flatMap((k, ki) =>
      D.map((r,i) => {
        const col = ki===0 ? p.color : (p.color2||p.color);
        return <circle key={k+i} cx={pxv(+r[k]||0)} cy={nodeY(r)}
          r={3} fill={col} stroke="#fff" strokeWidth={1.2} opacity={0.9}/>;
      })
    );

    // X-axis ticks at bottom
    const nxt = 4;
    const xtks = Array.from({length:nxt+1}, (_,i) => i*maxV/nxt);
    const xticks = xtks.map(v => (
      <g key={v}>
        <line x1={pxv(v)} y1={PAD.t+gH} x2={pxv(v)} y2={PAD.t+gH+4}
          stroke={COLORS.axis} strokeWidth={0.8}/>
        <line x1={pxv(v)} y1={PAD.t} x2={pxv(v)} y2={PAD.t+gH}
          stroke={COLORS.grid} strokeWidth={0.5} strokeDasharray="3,3"/>
        <text x={pxv(v)} y={PAD.t+gH+13} textAnchor="middle"
          fontSize={7} fill={COLORS.axis} fontFamily="monospace">
          {v >= 1000 ? (v/1000).toFixed(1)+"k" : v >= 10 ? v.toFixed(0) : v.toFixed(1)}
        </text>
      </g>
    ));

    // Panel label at top
    const label = (
      <g>
        <text x={pxOff + p.W/2} y={16} textAnchor="middle"
          fontSize={8.5} fontWeight="700" fill={COLORS.axis} fontFamily="sans-serif">
          {p.label}
        </text>
        <text x={pxOff + p.W/2} y={26} textAnchor="middle"
          fontSize={7} fill="#9E9E9E" fontFamily="sans-serif">{p.unit}</text>
      </g>
    );

    // Panel separator line
    const sep = <line key="sep" x1={pxOff} y1={PAD.t-4} x2={pxOff} y2={PAD.t+gH}
      stroke={COLORS.grid} strokeWidth={1}/>;

    return [sep, ...xticks, label, ...lines, ...dots];
  }

  // Build all panels
  let panelX = DEPTH_AXIS_W;
  const allPanelSVG = panels.map(p => {
    const elems = buildPanelLines(p, panelX);
    let old = panelX;
    panelX += p.W + PANEL_GAP;
    return elems;
  });

  // Legend
  const legendItems = [
    {color:COLORS.skinB, label:"Skin Before", dash:false},
    {color:COLORS.skinA, label:"Skin After",  dash:true},
    {color:COLORS.pen,   label:"Penetration (in)", dash:false},
    {color:COLORS.piB,   label:"PI Before",   dash:false},
    {color:COLORS.piA,   label:"PI After",    dash:true},
    {color:COLORS.placed,label:"% Placed",    dash:false},
  ];

  return <div style={{background:"#F5F7FA",padding:"16px 12px 10px",marginTop:8}}>
    {/* Title bar — StimPRO style */}
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      marginBottom:10, padding:"8px 14px",
      background:"#1A2332", color:"#E8F4FF",
      fontSize:12, fontWeight:700, letterSpacing:"0.5px",
    }}>
      <span>Matrix Acid Stimulation — Depth Profile Results</span>
      <span style={{fontSize:10,color:"#7090B0",fontWeight:400}}>
        {DATA.length} intervals · {summary ? `Avg skin: ${summary.avgSkinB}→${summary.avgSkinA}` : ""}
      </span>
    </div>

    {/* Legend */}
    <div style={{display:"flex",gap:18,marginBottom:10,padding:"5px 8px",
      background:"#fff",border:"1px solid #E0E0E0",flexWrap:"wrap"}}>
      {legendItems.map(({color,label,dash})=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#424242"}}>
          <svg width={24} height={10}>
            <line x1={0} y1={5} x2={24} y2={5} stroke={color} strokeWidth={2}
              strokeDasharray={dash?"6,3":"none"}/>
            <circle cx={12} cy={5} r={2.5} fill="#fff" stroke={color} strokeWidth={1.5}/>
          </svg>
          {label}
        </div>
      ))}
    </div>

    {/* Main chart area: well schematic + multi-panel depth plot */}
    <div style={{display:"flex",gap:0,background:"#fff",border:"1px solid #BDBDBD"}}>

      {/* ── Well Schematic SVG ─── */}
      <div style={{flexShrink:0}}>
        <svg width={SW} height={H} style={{display:"block"}}>
          <rect width={SW} height={H} fill="#F5F5F5"/>
          {/* Depth scale background */}
          <rect x={0} y={0} width={SW} height={H} fill="#ECEFF1"/>

          {/* Formation bands */}
          {RES.map((r,i) => {
            const yt=Math.max(0,py(r.top)), yb=Math.min(H,py(r.bot));
            if(yb<=yt) return null;
            return <rect key={i} x={20} y={yt} width={SW-20} height={yb-yt}
              fill={litFill[r.lith]||"rgba(200,200,200,0.2)"}/>;
          })}

          {/* Horizontal depth grid lines */}
          {depthTicks.map(d=>(
            <line key={d} x1={0} y1={py(d)} x2={SW} y2={py(d)}
              stroke="#B0BEC5" strokeWidth={0.5}/>
          ))}

          {/* Depth axis labels */}
          {depthTicks.map(d=>(
            <text key={d} x={18} y={py(d)+3} textAnchor="end"
              fontSize={7} fill="#546E7A" fontFamily="monospace">{Math.round(d)}</text>
          ))}

          {/* Casing — spans from reservoir top to bottom depth */}
          {(()=>{
            const yt_c = Math.max(PAD.t, py(minD));
            const yb_c = Math.min(PAD.t+gH, py(maxD));
            const ch_c = Math.max(4, yb_c - yt_c);
            return <>
              <rect x={cx-cw/2} y={yt_c} width={cw} height={ch_c}
                fill="none" stroke="#78909C" strokeWidth={2} rx={1}/>
              <rect x={cx-cw/2} y={yt_c} width={cw} height={ch_c}
                fill="rgba(120,144,156,0.05)" rx={1}/>
              {/* Tubing */}
              <rect x={cx-tw/2} y={yt_c} width={tw} height={ch_c*0.55}
                fill="rgba(100,150,200,0.06)" stroke="#90A4AE" strokeWidth={1} rx={1}/>
            </>;
          })()}

          {/* Perforations */}
          {RES.map((r,i)=>{
            const yt=py(r.top), yb=py(r.bot), h=yb-yt;
            if(h<1) return null;
            const n=Math.max(2, Math.round(h/9));
            return <g key={i}>
              {Array.from({length:n},(_,j)=>{
                const yy=yt+j*(h/n)+(h/n)/2;
                return <g key={j}>
                  <line x1={cx-cw/2-8} y1={yy} x2={cx-cw/2} y2={yy}
                    stroke="#F57F17" strokeWidth={1.4} opacity={0.8}/>
                  <line x1={cx+cw/2} y1={yy} x2={cx+cw/2+8} y2={yy}
                    stroke="#F57F17" strokeWidth={1.4} opacity={0.8}/>
                </g>;
              })}
            </g>;
          })}

          {/* Acid placement highlight */}
          {D.filter(d=>d.placed).map((d,i)=>{
            const yr=RES.find(r=>d.depth>=r.top&&d.depth<=r.bot)||RES[0];
            if(!yr) return null;
            const yt=py(yr.top), yb=py(yr.bot);
            return <rect key={i} x={cx-cw/2+1} y={yt} width={cw-2}
              height={Math.max(3,yb-yt-1)}
              fill={COLORS.pen} fillOpacity={0.15+d.conc*0.25} rx={1}/>;
          })}

          {/* Labels */}
          <text x={cx} y={14} textAnchor="middle" fontSize={8} fontWeight="600"
            fill="#37474F" fontFamily="sans-serif">WELL</text>
          <text x={2} y={14} fontSize={7} fill="#78909C" fontFamily="sans-serif">DEPTH</text>
          <text x={2} y={22} fontSize={6} fill="#90A4AE" fontFamily="monospace">(ft MD)</text>
        </svg>
      </div>

      {/* ── Multi-panel depth chart SVG ─── */}
      <div style={{flex:1,overflowX:"auto"}}>
        <svg width={CHART_W} height={H} style={{display:"block",minWidth:500}}>
          <rect width={CHART_W} height={H} fill={COLORS.bgChart}/>

          {/* Horizontal depth grid lines across all panels */}
          {depthTicks.map(d=>(
            <line key={d} x1={DEPTH_AXIS_W} y1={py(d)} x2={CHART_W-PAD.r} y2={py(d)}
              stroke={COLORS.grid} strokeWidth={0.5}/>
          ))}

          {/* Depth axis on left of chart */}
          <line x1={DEPTH_AXIS_W} y1={PAD.t} x2={DEPTH_AXIS_W} y2={PAD.t+gH}
            stroke={COLORS.axis} strokeWidth={1}/>
          {depthTicks.map(d=>(
            <g key={d}>
              <line x1={DEPTH_AXIS_W-4} y1={py(d)} x2={DEPTH_AXIS_W} y2={py(d)}
                stroke={COLORS.axis} strokeWidth={0.8}/>
              <text x={DEPTH_AXIS_W-6} y={py(d)+3} textAnchor="end"
                fontSize={7} fill={COLORS.axis} fontFamily="monospace">{Math.round(d)}</text>
            </g>
          ))}
          <text x={12} y={PAD.t+gH/2} textAnchor="middle" fontSize={8.5}
            fill={COLORS.axis} fontFamily="sans-serif"
            transform={`rotate(-90,12,${PAD.t+gH/2})`}>Measured Depth (ft)</text>

          {/* Bottom axis line */}
          <line x1={DEPTH_AXIS_W} y1={PAD.t+gH} x2={CHART_W-PAD.r} y2={PAD.t+gH}
            stroke={COLORS.axis} strokeWidth={1}/>

          {/* All panel curves */}
          {allPanelSVG}
        </svg>
      </div>
    </div>

    {/* KPI summary bar below chart */}
    {summary && <div style={{
      display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:1,
      background:"#E0E0E0", marginTop:2,
    }}>
      {[
        ["Avg Skin Before", summary.avgSkinB, "#D32F2F"],
        ["Avg Skin After",  summary.avgSkinA, "#388E3C"],
        ["Skin Reduction",  summary.skinReduction+"%", "#0078A8"],
        ["PI Ratio",        summary.piRatio+"×", "#E65100"],
        ["Placement",       summary.placementPct+"%", "#795548"],
      ].map(([lbl,val,col])=>(
        <div key={lbl} style={{background:"#fff",padding:"8px 12px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#757575",textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:3}}>{lbl}</div>
          <div style={{fontSize:16,fontWeight:700,color:col,fontFamily:"monospace"}}>{val}</div>
        </div>
      ))}
    </div>}
  </div>;
}

// ─── RESULTS PAGE (Mods 1,2,4,5,6) ──────────────────────────────────────────
function ResultsPage({ project, simResults, resRows }) {
  const [tab,       setTab]       = useState("overview");
  const [chartType, setChartType] = useState("bar");   // "bar" | "line"
  const [fieldData, setFieldData] = useState(null);   // Mod-2: imported field pressure
  const [showDelta, setShowDelta] = useState(false);  // Mod-2: show ΔP curve

  // Use computed results if available, otherwise fall back to static demo data
  const DATA = simResults ? simResults.depthResults : SIM_RESULTS;
  const ptD_raw = simResults ? simResults.pressureTime : null;
  const summary = simResults ? simResults.summary : null;
  const fracPres = simResults ? simResults.fracPres : 5100;
  const skB = summary && +summary.avgSkinB === +summary.avgSkinB ? (+summary.avgSkinB).toFixed(1) : (SIM_RESULTS.reduce((s, r) => s + r.skinB, 0) / SIM_RESULTS.length).toFixed(1);
  const skA = summary && +summary.avgSkinA === +summary.avgSkinA ? (+summary.avgSkinA).toFixed(1) : (SIM_RESULTS.reduce((s, r) => s + r.skinA, 0) / SIM_RESULTS.length).toFixed(1);
  const piRatioStr = summary ? `${summary.piRatio}x` : "4.0x";
  // totalAcidVol is in Gallons (stored units from schedule)
  // totalAcidVol = main injection acid only (matches Σ V_acid across layers)
  const totalAcidStr = summary ? String(summary.totalAcidVol) : "21000";
  // Also compute total injected (all stages) for display
  const totalInjStr = summary && summary.totalInjVol ? String(summary.totalInjVol)
    : totalAcidStr;

  // Demo fallback pressure time series (preserved from original)
  const n = 70;
  // Deterministic demo fallback using sin-based noise (no Math.random)
  const ptD_fallback = Array.from({ length: n }, (_, i) => ({ x: i, tp: 4800 + 600 * Math.exp(-i / 20) + Math.sin(i * 0.7) * 28, bhp: 4200 + 200 * Math.exp(-i / 25) + Math.sin(i * 0.5) * 14, whp: 2600 + 350 * Math.exp(-i / 18) + Math.sin(i * 0.9) * 12, frac: 5100, stage: "Demo Stage" }));
  const ptD = ptD_raw && ptD_raw.length > 0 ? ptD_raw : ptD_fallback;

  // Reservoir from data for schematic alignment
  // Use the actual user-input reservoir layers (sorted by depth) for all depth axes
  const RES = (() => {
    const rows = (resRows && resRows.length) ? resRows : INIT_RESERVOIR;
    return [...rows]
      .filter(r => +r.top > 0 && +r.bot > 0)
      .sort((a, b) => +a.top - +b.top);
  })();

  return <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    <Topbar title="Simulation Results" sub={`${project?.name} · Depth-referenced analysis complete`} actions={<><Btn sz="s" v="g">⬆ Export PDF</Btn><Btn sz="s" v="g">Export Excel</Btn><Btn sz="s" v="s">✓ Results Ready</Btn></>} />
    <div style={{ flex:1, overflow:"auto", padding:18 }}><div className="anim">
      <G4 gap={10}><Met label="Initial Avg Skin" value={skB} color={T.red} /><Met label="Final Avg Skin" value={skA} color={T.green} /><Met label="PI Improvement" value={piRatioStr} color={T.teal} /><Met label="Main Acid Vol" value={totalAcidStr} unit="Gal" color={T.blue} title="Sum equals Σ V_acid across all layers"/></G4>
      <div style={{ height: 14 }} />
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <Tabs tabs={[
          { id: "stimpro",   label: "Overview" },
          { id: "skin",      label: "Skin" },
          { id: "pen",       label: "Penetration Fronts" },
          { id: "placement", label: "Placement" },
          { id: "pi",        label: "PI" },
          { id: "pressure",  label: "Pressure" },
          { id: "table",     label: "Results Table" },
        ]} active={tab} onSet={setTab} />
      </div>

      {/* ══ StimPRO-STYLE VIEW ══════════════════════════════════════════════ */}
      {tab === "stimpro" && <StimProChart data={DATA} reservoir={RES} simResults={simResults}/>}

      {/* ══ INDIVIDUAL DEPTH CHARTS ══════════════════════════════════════════ */}
      {tab === "skin" && <div style={{marginTop:8}}>
        <AlignedSchematicRow title="Skin Factor — Before & After Stimulation" data={DATA} reservoir={RES} plotH={480}
          plotContent={({yMn,yMx,H})=><>
            <DepthLine data={DATA} xKey="skinB" secKey="skinA" yKey="depth" botKey="bot"
              color="#E53935" secColor="#43A047" label="Skin Factor" H={H||480} W={520} yMn={yMn} yMx={yMx}/>
            <div style={{display:"flex",gap:20,marginTop:6,fontSize:11,paddingLeft:4}}>
              <span style={{color:"#E53935"}}>— Skin Before</span>
              <span style={{color:"#43A047"}}>-- Skin After</span>
            </div>
          </>}/>
      </div>}

      {tab === "pen" && (()=>{
        const penVals = DATA.flatMap(r=>[+r.pen_preflush||0,+r.pen_main_inj||0,+r.pen_overflush||0]).filter(v=>v>0);
        const xMx = penVals.length ? Math.max(...penVals)*1.15 : 30;
        const SERIES = [
          {key:"pen_preflush",  label:"Preflush Front",     color:"#7986CB", desc:"Deepest — pushed outward by all subsequent stages"},
          {key:"pen_main_inj",  label:"Main Injection Front",color:"#26A69A", desc:"Pushed outward by overflush"},
          {key:"pen_overflush", label:"Overflush Front",     color:"#E57373", desc:"Shallowest — nearest wellbore"},
        ];
        const hasData = penVals.length > 0;
        return <div style={{marginTop:8}}>
          {/* Legend + summary stats */}
          <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
            {SERIES.map(s=>{
              const vals = DATA.map(r=>+r[s.key]||0).filter(v=>v>0);
              const avg  = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "—";
              const mx   = vals.length ? Math.max(...vals).toFixed(1) : "—";
              return <div key={s.key} style={{background:T.bg2,border:`1px solid ${T.border0}`,
                borderLeft:`3px solid ${s.color}`,padding:"8px 14px",borderRadius:2,minWidth:170}}>
                <div style={{fontWeight:700,color:s.color,fontSize:11,marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:10,color:T.text2,marginBottom:4}}>{s.desc}</div>
                <div style={{fontSize:10,color:T.text1,fontFamily:T.mono}}>
                  Avg: <b>{avg}</b> in &nbsp;|&nbsp; Max: <b>{mx}</b> in
                </div>
              </div>;
            })}
          </div>
          {!hasData
            ? <div style={{background:T.bg2,border:`1px solid ${T.border0}`,borderRadius:2,
                padding:"60px 0",textAlign:"center",color:T.text3,fontSize:13}}>
                Run simulation to generate penetration data.
              </div>
            : <AlignedSchematicRow
                title="Fluid Penetration by Injection Stage — All Depth Grids"
                data={DATA} reservoir={RES} plotH={520}
                plotContent={({yMn,yMx,H})=><div>
                  {SERIES.map(s=>(
                    <DepthLine key={s.key} data={DATA} xKey={s.key} yKey="depth" botKey="bot"
                      color={s.color} H={H||520} W={540} yMn={yMn} yMx={yMx} xMn={0} xMx={xMx}/>
                  ))}
                  <div style={{display:"flex",gap:18,marginTop:8,fontSize:11,
                    padding:"6px 10px",background:"rgba(0,0,0,0.03)",borderRadius:3,flexWrap:"wrap",
                    alignItems:"center"}}>
                    {SERIES.map(s=>(
                      <span key={s.key}>
                        <span style={{color:s.color,fontWeight:700,marginRight:4}}>━━</span>
                        <span style={{color:T.text1}}>{s.label}</span>
                      </span>
                    ))}
                    <span style={{marginLeft:"auto",fontSize:9,color:T.text3}}>
                      X: Penetration (in from wellbore wall) · Y: Depth (ft MD)
                    </span>
                  </div>
                  {/* Per-layer summary table below chart */}
                  <div style={{marginTop:16,overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                      <thead><tr style={{background:T.bg3}}>
                        {["Depth (ft)","Layer","Pen Preflush (in)","Pen Main Inj (in)","Pen Overflush (in)","Preflush > Main?","Main > Overflush?"]
                          .map((h,i)=><th key={i} style={{padding:"5px 8px",color:T.text2,
                            textAlign:i<2?"left":"right",fontSize:9,fontWeight:700,
                            borderBottom:`2px solid ${T.border0}`,whiteSpace:"nowrap"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>{DATA.map((r,i)=>{
                        const pf=+(r.pen_preflush||0), mn=+(r.pen_main_inj||0), ov=+(r.pen_overflush||0);
                        return <tr key={i} style={{background:i%2===0?"transparent":T.bg3+"30"}}>
                          <td style={{padding:"4px 8px",fontFamily:T.mono,color:T.text1}}>{r.depth}</td>
                          <td style={{padding:"4px 8px",color:T.text2}}>{r.layer!=null?`Layer ${+r.layer+1}`:""}</td>
                          <td style={{padding:"4px 8px",textAlign:"right",fontFamily:T.mono,color:"#7986CB",fontWeight:600}}>{pf>0?pf.toFixed(2):"—"}</td>
                          <td style={{padding:"4px 8px",textAlign:"right",fontFamily:T.mono,color:"#26A69A",fontWeight:600}}>{mn>0?mn.toFixed(2):"—"}</td>
                          <td style={{padding:"4px 8px",textAlign:"right",fontFamily:T.mono,color:"#E57373",fontWeight:600}}>{ov>0?ov.toFixed(2):"—"}</td>
                          <td style={{padding:"4px 8px",textAlign:"center"}}>
                            {pf>0&&mn>0?<Bdg color={pf>=mn?"teal":"red"} label={pf>=mn?"✓":"✗"}/>:"—"}
                          </td>
                          <td style={{padding:"4px 8px",textAlign:"center"}}>
                            {mn>0&&ov>0?<Bdg color={mn>=ov?"teal":"red"} label={mn>=ov?"✓":"✗"}/>:"—"}
                          </td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>
                </div>}/>
          }
        </div>;
      })()}

      {tab === "placement" && <div style={{marginTop:8}}>
        {(()=>{
          const d2=DATA.map(r=>({...r,
            pct_placed: r.pct_placed_node!=null ? r.pct_placed_node
              : (()=>{const tot=DATA.reduce((s,x)=>s+(+x.V_main_acid||0),0);return tot>0?+((+r.V_main_acid||0)/tot*100).toFixed(1):0;})()
          }));
          return <AlignedSchematicRow title="Acid Placement — % Volume per Depth Node" data={d2} reservoir={RES} plotH={480}
            plotContent={({yMn,yMx,H})=><>
              <DepthLine data={d2} xKey="pct_placed" yKey="depth" botKey="bot"
                color="#C87000" label="% Acid Placed" H={H||480} W={520} yMn={yMn} yMx={yMx} xMn={0}/>
            </>}/>;
        })()}
      </div>}

      {tab === "pi" && <div style={{marginTop:8}}>
        <AlignedSchematicRow title="Productivity Index — Before & After Stimulation" data={DATA} reservoir={RES} plotH={480}
          plotContent={({yMn,yMx,H})=><>
            <DepthLine data={DATA} xKey="pi_b" secKey="pi_a" yKey="depth" botKey="bot"
              color="#E53935" secColor="#43A047" label="PI (bbl/d/psi)" H={H||480} W={520} yMn={yMn} yMx={yMx} xMn={0}/>
            <div style={{display:"flex",gap:20,marginTop:6,fontSize:11,paddingLeft:4}}>
              <span style={{color:"#E53935"}}>— PI Before</span>
              <span style={{color:"#43A047"}}>-- PI After</span>
            </div>
          </>}/>
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
          {summary?.anyFracture && <div className="db" style={{ marginTop: 10 }}><span style={{ color: T.red }}>[!]</span><span style={{ fontSize: 11, color: T.text1 }}>Fracture risk detected during simulation. Check stages with BHP near fracture limit.</span></div>}
        </Card>
        {/* Pressure vs depth — preserved from original */}
        <Card title="Pressure vs Depth">
          <AlignedSchematicRow title="" data={DATA} reservoir={RES} plotH={180}
            plotContent={<DepthPlot data={DATA} xKey="pres" yKey="depth" color={T.blue} label="Pressure (psi)" H={180} W={400} />} />
        </Card>
      </div>}

      {/* Placement tab — Acid Placement Map removed per requirement */}
      {tab === "placement" && <Card title="Fluid Distribution by Stage">
        {INIT_SCHEDULE.map((s, i) => { const fc = INIT_FLUIDS.find(f => f.name === s.fluid); return <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: `1px solid ${T.border0}` }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: fc?.color || T.teal, flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: T.text0 }}>{s.name}</div><div style={{ fontSize: 10, color: T.text2 }}>{s.fluid}</div></div><div style={{ fontSize: 12, fontFamily: T.mono, color: T.teal }}>{s.vol} Gal ({(+s.vol/42).toFixed(1)} BBL)</div></div>; })}
      </Card>}

      {/* Results table — From Depth / To Depth columns added */}
      {tab === "table" && <Card title="Depth-Interval Results Summary">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead><tr>{["From (ft)", "To (ft)", "Skin B", "Skin A", "ΔSkin",
              "Pen (in)", "WH R (in)", "Dmg R (ft)", "Bypass %",
              "k Before (md)", "k After (md)", "k Ratio",
              "P_wb (psi)", "P_res (psi)", "Qres (bbl/min)", "V_acid (BBL)", "% Acid",
              "T Layer (°F)", "Density (ppg)", "Visc (cp)", "Rxn Rate (1/s)",
              "PI Before", "PI After", "PI Ratio", "Placed?"].map(h => <th key={h} style={{ padding: "7px 10px", color: T.text2, borderBottom: `1px solid ${T.border0}`, textAlign: "left", fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{DATA.map((r, ri) => {
              const toDepth = DATA[ri + 1] ? DATA[ri + 1].depth : r.depth + 55;
              return <tr key={r.depth} className="hr" style={{ background: "transparent" }}>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, fontSize:11, color:T.teal, fontWeight:600 }}>{r.depth}</td>
                <td style={{ padding:"6px 10px", fontFamily:T.mono, fontSize:11, color:T.teal }}>{toDepth}</td>
                <td style={{ padding:"6px 10px", color:T.red,   fontFamily:T.mono }}>{r.skinB}</td>
                <td style={{ padding:"6px 10px", color:T.green, fontFamily:T.mono }}>{r.skinA}</td>
                <td style={{ padding:"6px 10px", color:T.green, fontFamily:T.mono, fontWeight:700 }}>−{(r.skinB - r.skinA).toFixed(1)}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.gold}}>{typeof r.pen==="number"?r.pen.toFixed(1):"0.0"}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:"#1565C0"}}>
                  {r.wh_radius_in!=null?(+r.wh_radius_in).toFixed(1):r.pen!=null?(+r.pen).toFixed(1):"—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.text2}}>
                  {(+r.dmgR||1.0).toFixed(2)}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.teal}}>
                  {r.vol_coverage!=null?r.vol_coverage.toFixed(1)+"%" : (r.bypass_pct!=null?r.bypass_pct+"%":"—")}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.text1}}>
                  {(+r.k_before||+r.perm||0).toFixed(1)}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.green,fontWeight:700}}>
                  {(+r.k_after||+r.k_eff||+r.perm||0).toFixed(1)}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.teal}}>
                  {(+r.k_after||+r.k_eff||1)/(+r.k_before||+r.perm||1)>1.005?
                    ((+r.k_after||+r.k_eff||1)/(+r.k_before||+r.perm||1)).toFixed(2)+"×":"1.00×"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.teal}}>{r.pres||"—"}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.red}}>{r.pres_res||"—"}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.teal}}>
                  {r.qres!=null?(+r.qres).toFixed(1):"—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.blue}}>
                  {r.V_main_acid!=null?(+r.V_main_acid).toFixed(3):r.V_acid!=null?(+r.V_acid).toFixed(3):"—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono}}>
                  {(()=>{const tot=DATA.reduce((s,x)=>s+(+x.V_main_acid||0),0);const pct=tot>0?(+r.V_main_acid||0)/tot*100:0;return <span style={{color:pct>0?T.teal:T.text3}}>{pct.toFixed(1)}%</span>;})()}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.gold}}>{r.pi_b!=null?(+r.pi_b).toFixed(4):"—"}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.green,fontWeight:700}}>{r.pi_a!=null?(+r.pi_a).toFixed(4):"—"}</td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.teal,fontWeight:700}}>
                  {r.pi_b>0?((+r.pi_a/+r.pi_b).toFixed(2)+"×"):"—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:"#FF7043",fontWeight:600}}>
                  {r.fluid_T_F>0 ? r.fluid_T_F+"°F" : "—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.text1}}>
                  {r.fluid_density_ppg>0 ? (+r.fluid_density_ppg).toFixed(3) : "—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:"#5C6BC0"}}>
                  {r.fluid_visc>0 ? (+r.fluid_visc).toFixed(3) : "—"}
                </td>
                <td style={{padding:"6px 8px",fontFamily:T.mono,color:T.gold}}>
                  {r.fluid_rxRate>0 ? (+r.fluid_rxRate).toExponential(2) : "—"}
                </td>
                <td style={{padding:"6px 8px"}}><Bdg color={r.placed?"teal":"red"} label={r.placed?"✓ Yes":"No"}/></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Card>}
    </div></div>
  </div>;
}

// ─── SENSITIVITY ──────────────────────────────────────────────────────────────
// All curves computed by calling ENG functions directly — same physics as the
// main simulation engine. Pump rate and diverter concentration feed through
// the full penetration → skin → PI chain.
function SensPage({ project, simResults, resRows, wellData, sharedFluids, sharedSched }) {
  const [acid, setAcid]   = useState(15);
  const [vol,  setVol]    = useState(250);
  const [rate, setRate]   = useState(4.0);
  const [dConc,setDConc]  = useState(3.0);
  const [tab,  setTab]    = useState("skin");   // "skin" | "pi" | "placement"
  const [sensTab, setSensTab] = useState("st_conc");  // sub-tab for detail tables

  // ── Reference reservoir interval (average or first) ─────────────────────
  const RES   = (resRows  && resRows.length)  ? resRows  : DEFAULTS.reservoir;
  const WELL  = wellData  || DEFAULTS.well;
  const FLUIDS= (sharedFluids && sharedFluids.length) ? sharedFluids : INIT_FLUIDS;

  // Representative interval: average of all reservoir intervals
  const nR    = RES.length || 1;
  const avgPerm = RES.reduce((s,r)=>s+(+r.perm||1),0)/nR;
  const avgPor  = RES.reduce((s,r)=>s+(+r.por||15),0)/nR;
  const avgSkin = RES.reduce((s,r)=>s+(+r.skin||10),0)/nR;
  const avgH    = RES.reduce((s,r)=>s+Math.max(1,(+r.bot||0)-(+r.top||0)),0)/nR;
  const avgPres = RES.reduce((s,r)=>s+(+r.pres||3700),0)/nR;
  // Representative reservoir row for ENG calls
  const refRow  = { perm:avgPerm, por:avgPor, skin:avgSkin, bot:8255, top:8200,
                    lith:"Carbonate", pres:avgPres, dmgR:12 };

  // Main acid fluid (HCl 15% or first main acid fluid)
  const mainFluid = FLUIDS.find(f=>f.cat==="Main Acid")||FLUIDS[0]||{conc:15,visc:1.2,rxRate:2.8,density:1.065};

  // ── Core physics functions (calls real ENG) ──────────────────────────────
  // Calculate skin after for given acid volume (bbl), concentration (%), rate (bpm)
  function calcSkin(acidConc, acidVol, pumpRate) {
    // Physics-based acid concentration effect on wormhole penetration:
    //   rxRate ∝ conc^0.63 (Fredd & Fogler 1996, HCl-calcite kinetics)
    //   Effective dissolution capacity ∝ conc (more H+ per unit volume)
    //   Wormhole length ∝ (rxRate × effVol)^0.5 / (Da × conc_normalized)
    //   Net: higher conc → faster reaction + more dissolving power → deeper pen → lower skin
    const concBase   = 15.0;
    const rxRateFac  = Math.pow(Math.max(1, acidConc) / concBase, 0.63);  // Fredd-Fogler exponent
    const concFac    = acidConc / concBase;                                // dissolution capacity
    // Rate effect: optimum wormholing at Da ~ 0.3 (pore-scale Damköhler number)
    // Higher rate → shifts wormholing regime, generally more effective up to ~8 bpm
    const rateOpt    = 4.0;  // optimal for typical carbonate matrix
    const rateFactor = 1.0 + 0.35 * Math.log(Math.max(0.25, pumpRate) / rateOpt);  // log-linear
    // Effective volume accounts for rate effect on wormhole efficiency
    const effVol     = acidVol * (1.0 + 0.25 * (rateFactor - 1.0));
    // Combined rxRate: concentration kinetics × rate regime
    const effectiveRxRate = mainFluid.rxRate * rxRateFac * Math.max(0.7, rateFactor);
    const fluid      = Object.assign({}, mainFluid, {
      conc:   acidConc / 100,            // fraction for engine
      rxRate: effectiveRxRate,
      concFactor: concFac,               // dissolution capacity multiplier
    });
    // Pass effVol directly — concentration effect is already in fluid.rxRate and fluid.conc
    const penData    = ENG.acidPenetration(refRow, fluid, effVol, WELL);
    const skinRes    = ENG.computeSkinAfter(refRow, penData);
    return { skin: skinRes.skinAfter, pen: penData.penetration_in, bypass: skinRes.bypassFac };
  }

  // Calculate PI after for given skin after
  function calcPI(skinAfter) {
    return ENG.computePIAfter(refRow, WELL, skinAfter);
  }

  // PI before (baseline, no acid)
  const piBase = calcPI(avgSkin);

  // Diverter effect: placement efficiency controls effective acid volume per layer
  // Higher diverter conc → better placement → more layers receive acid
  // Model: layers_reached = nR * sigmoid(dConc / 2.5)
  // Effective vol per treated layer = totalVol / layers_reached
  function calcDivEffect(dC, acidVol, acidConc, pumpRate) {
    // Physics: diverter blocks high-permeability layers → more fluid to tight layers
    // layersFrac: fraction of layers receiving acid (sigmoidal response to dConc)
    const sigmConc    = 1 / (1 + Math.exp(-(dC - 2.5) * 0.9));   // 0..1
    const layersFrac  = 0.25 + 0.75 * sigmConc;                    // 25%..100% layers treated
    const layersN     = Math.max(1, Math.round(nR * layersFrac));
    // Better placement → more even distribution → each treated layer gets full attention
    const volPerLayer = acidVol / layersN;                         // BBL per treated layer
    // Without diverter: acid concentrates in high-k zones only.
    // Skin reduction: treated layers get full skin reduction; untreated layers keep original skin.
    // Effective skin after = weighted average (treated layers: calcSkin; untreated: avgSkin)
    const resTreated  = calcSkin(acidConc, volPerLayer, pumpRate); // skin per treated layer
    const skinTreated = resTreated.skin;
    const skinUntreated = avgSkin;  // untreated layers keep their damage
    const skinAfterAvg  = (layersFrac * skinTreated) + ((1 - layersFrac) * skinUntreated);
    // Permeability improvement:
    // Treated layers have k enhanced by wormholing; untreated layers unchanged.
    // Avg k_after = layersFrac × k_wormhole + (1-layersFrac) × k_original
    // k_wormhole ≈ k_original × (1 + penetration_in / dmgR_in)² (Hawkins model)
    const dmgR_in   = 12;  // 1 ft damage radius → 12 in
    const pen_in    = resTreated.pen;  // penetration from calcSkin
    const kBoost    = Math.max(1, Math.pow(1 + pen_in / Math.max(1, dmgR_in), 2.5));
    const kEffAvg   = avgPerm * (layersFrac * kBoost + (1 - layersFrac));
    // Override refRow with improved k for PI calculation
    const refRowDiv = { ...refRow, perm: kEffAvg };
    const piAfterDiv = ENG.computePIAfter(refRowDiv, WELL, skinAfterAvg);
    const placementPct = layersFrac * 100;
    // Return penetration of treated layers + distribution metrics
    const penTreated = resTreated.pen;   // penetration per treated layer [in]
    // Effective whole-well average penetration: treated layers get pen, untreated get 0
    const penAvg     = layersFrac * penTreated;
    return { skin: skinAfterAvg, pi: piAfterDiv, placementPct, kEffAvg, kBoost,
             pen: penTreated, penAvg, layersFrac };
  }

  // ── Build curve data using real engine ──────────────────────────────────
  // 1. Acid concentration sweep (vol=vol, rate=rate)
  const concPts = [7.5,10,12,15,17,20,22,24,26,28].map(c => {
    const r = calcSkin(c, vol, rate);
    return { x: c, skin: r.skin, pi: calcPI(r.skin), pen: r.pen };
  });
  // 2. Volume sweep (acid=acid, rate=rate)
  const volPts = [25,50,75,100,150,200,250,300,400,500].map(v => {
    const r = calcSkin(acid, v, rate);
    return { x: v, skin: r.skin, pi: calcPI(r.skin), pen: r.pen };
  });
  // 3. Pump rate sweep (acid=acid, vol=vol) — shows rate effect on skin & PI
  const ratePts = [0.25,0.5,1,1.5,2,3,4,5,6,8,10,12].map(r => {
    const res = calcSkin(acid, vol, r);
    return { x: r, skin: res.skin, pi: calcPI(res.skin), pen: res.pen };
  });
  // 4. Diverter conc sweep (acid=acid, vol=vol, rate=rate)
  const divPts = [0.25,0.5,1,1.5,2,2.5,3,4,5,6,8,10].map(d => {
    const res = calcDivEffect(d, vol, acid, rate);
    return { x: d, skin: res.skin, pi: res.pi, placementPct: res.placementPct,
             pen: res.pen, penAvg: res.penAvg, layersFrac: res.layersFrac };
  });

  // ── Current slider point (red dot) ──────────────────────────────────────
  const curMain    = calcSkin(acid, vol, rate);
  const curPI      = calcPI(curMain.skin);
  const curDiv     = calcDivEffect(dConc, vol, acid, rate);
  // Use diverter-adjusted values for summary metrics:
  // curDiv.skin = avg skin across treated AND untreated layers (weighted by layersFrac)
  // curDiv.pi   = PI computed with weighted avg k and avg skin after diversion
  const predSkin   = curDiv.skin.toFixed(2);
  const predPI     = curDiv.pi.toFixed(3);
  const predPlace  = curDiv.placementPct.toFixed(1);

  // Chart series helper — pull skin or pi from point array
  const sk = pts => pts.map(p => ({ x: p.x, y: p.skin }));
  const pi = pts => pts.map(p => ({ x: p.x, y: p.pi   }));
  const pl = pts => pts.map(p => ({ x: p.x, y: p.placementPct }));

  // ── Compute full detail for each sensitivity point ─────────────────────────
  function enrichPoint(params, type) {
    const {x, skin, pi, pen, penAvg, layersFrac, placementPct} = params;
    // Injectivity index [bbl/d/psi] from Darcy equation with post-treatment skin
    const rw_ft  = Math.max(0.01, (+WELL.wbR||3) / 12);
    const re_ft  = Math.max(10, +WELL.drainR || 2640);
    const lnR    = Math.log(Math.max(1.01, re_ft / rw_ft));
    const h_ft   = Math.max(1, +refRow.bot - +refRow.top);
    const II     = (0.007082 * +refRow.perm * h_ft) /
                   (1.0 * Math.max(0.01, lnR + Math.max(0, skin||0)));
    // WH radius: total radius from wellbore centre = r_wb + pen/12 [ft] → [in]
    const pen_in  = +(pen||0);
    const whR_in  = (rw_ft + pen_in / 12) * 12;  // inches from centre
    // Acid spending: Damköhler-based, depends on placement (layersFrac)
    // More layers treated → lower vol per layer → less spending per layer
    const lf     = layersFrac != null ? layersFrac : (curDiv.layersFrac||1);
    const volPL  = type === "vol"  ? x / Math.max(1, nR * lf)
                 : type === "div"  ? vol / Math.max(1, nR * lf)
                 : vol / nR;
    const Da     = Math.max(0.1, Math.min(2.0, 0.29 * Math.sqrt(Math.max(0.01, volPL) / 25)));
    const acidSpent = +(1 - 1/(1+Da)).toFixed(3);
    const volLayer = +volPL.toFixed(2);
    return {
      paramVal:     x,
      skinAfter:    +(skin||0).toFixed(3),
      piAfter:      +(pi||0).toFixed(4),
      pen:          +pen_in.toFixed(1),
      injectivity:  +II.toFixed(4),
      placementEff: placementPct!=null ? +placementPct.toFixed(1) : +(curDiv.placementPct).toFixed(1),
      whRadius:     +whR_in.toFixed(2),
      acidSpent,
      pressure:     +(+refRow.pres||3700).toFixed(0),
      volPerLayer:  volLayer,
      convResidual: +(Math.abs((skin||0) - avgSkin) / Math.max(0.01, avgSkin) * 100).toFixed(2),
    };
  }

  const concTable = concPts.map((p,i) => enrichPoint({...p, placementPct:curDiv.placementPct}, "conc"));
  const volTable  = volPts.map((p,i)  => enrichPoint({...p, placementPct:curDiv.placementPct}, "vol"));
  const rateTable = ratePts.map((p,i) => enrichPoint({...p, placementPct:curDiv.placementPct}, "rate"));
  const divTable  = divPts.map((p,i)  => enrichPoint({x:p.x, skin:p.skin, pi:p.pi,
                                          pen: p.pen,               // per-diverter-conc penetration
                                          penAvg: p.penAvg,
                                          layersFrac: p.layersFrac,
                                          placementPct:p.placementPct}, "div"));

  // Table headers
  const SENS_COLS = [
    {key:"paramVal",     label:"Parameter"},
    {key:"skinAfter",    label:"Skin After",      color:T.green},
    {key:"piAfter",      label:"PI After",         color:T.teal,   fmt:v=>v.toFixed(4)},
    {key:"pen",          label:"Penetration (in)", color:"#1565C0"},
    {key:"injectivity",  label:"Injectivity",      color:T.blue,   fmt:v=>v.toFixed(4)},
    {key:"placementEff", label:"Placement %",      color:T.gold,   fmt:v=>v+"%"},
    {key:"whRadius",     label:"WH Radius (in)",   color:"#0078A8"},
    {key:"acidSpent",    label:"Acid Spent",        color:T.text2,  fmt:v=>(v*100).toFixed(1)+"%"},
    {key:"pressure",     label:"P_res (psi)",       color:T.red},
    {key:"volPerLayer",  label:"Vol/Layer (bbl)",   color:T.blue},
    {key:"convResidual", label:"Conv. Residual %",  color:T.text3},
  ];

  function SensTable({rows, paramLabel, paramUnit, color}) {
    return <div style={{overflowX:"auto",marginTop:8}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
        <thead><tr style={{background:T.bg3}}>
          {SENS_COLS.map(c=><th key={c.key} style={{
            padding:"5px 8px",textAlign:"left",fontWeight:700,
            color:c.key==="paramVal"?color:c.color||T.text1,
            border:`1px solid ${T.border0}`,whiteSpace:"nowrap",fontSize:9.5,
          }}>{c.key==="paramVal"?`${paramLabel} (${paramUnit})`:c.label}</th>)}
        </tr></thead>
        <tbody>{rows.map((row,i)=><tr key={i} style={{
          background:i%2===0?"#fff":"#F7F9FC",
        }}>
          {SENS_COLS.map(c=>{
            const raw = row[c.key];
            const val = c.fmt ? c.fmt(raw) : typeof raw==="number" ? (+raw).toFixed(typeof raw==="number"&&raw%1===0?0:2) : raw;
            const isParam = c.key==="paramVal";
            const isGood  = c.key==="skinAfter"&&+raw<avgSkin || c.key==="piAfter"&&+raw>0;
            return <td key={c.key} style={{
              padding:"4px 8px",border:`1px solid ${T.border0}`,
              fontFamily:T.mono,fontSize:10,
              color:isParam?(color||T.teal):c.color||T.text1,
              fontWeight:isParam?700:400,
            }}>{val}</td>;
          })}
        </tr>)}
        </tbody>
      </table>
    </div>;
  }

  return <div style={{ flex:1, overflow:"auto" }}>
    <Topbar title="Sensitivity Analysis"
      sub={project ? project.name + " — Pump rate, diverter, concentration & volume effects on skin and PI" : "Sensitivity"}
    />
    <div style={{ padding:14 }}>
      {/* ── Summary metrics row ── */}
      <G4 gap={8} style={{ marginBottom:12 }}>
        <Met label="Predicted Avg Skin After" value={predSkin} color={T.green} />
        <Met label="Predicted PI" value={predPI} unit="bbl/d/psi" color={T.teal} />
        <Met label="Acid Penetration" value={curMain.pen.toFixed(1)} unit="in" color={T.gold} />
        <Met label="Placement Coverage" value={predPlace+"%"} color={T.blue} />
      </G4>

      <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:12 }}>

        {/* ── LEFT: sliders ── */}
        <Card title="Sensitivity Parameters">
          <div style={{ display:"grid", gap:14 }}>
            {[
              [acid, setAcid, 7.5, 28,  0.5, "Acid Concentration (HCl%)", "%",         T.teal],
              [vol,  setVol,  25,  500, 25,  "Total Acid Volume",         "bbl",       T.teal],
              [rate, setRate, 0.25,12,  0.25,"Pump Rate",                 "bpm",       T.blue],
              [dConc,setDConc,0.25,10,  0.25,"Diverter Conc",             "gal/Mgal",  T.gold],
            ].map(([val, setVal, mn, mx, step, lbl, unit, col]) =>
              <div key={lbl}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:T.text1 }}>{lbl}</span>
                  <span style={{ fontSize:12, fontFamily:T.mono, color:col, fontWeight:700 }}>{val} {unit}</span>
                </div>
                <input type="range" min={mn} max={mx} step={step} value={val}
                  onChange={e=>setVal(+e.target.value)} style={{ width:"100%", accentColor:col }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:T.text3 }}>
                  <span>{mn}</span><span>{mx}</span>
                </div>
              </div>
            )}

            {/* Reference interval info */}
            <div style={{ padding:"8px 0", borderTop:`1px solid ${T.border0}`, fontSize:10, color:T.text2 }}>
              <div style={{ fontWeight:700, marginBottom:4, color:T.text1 }}>Reference Interval</div>
              <div style={{ display:"grid", gap:3 }}>
                {[
                  ["Avg Perm", avgPerm.toFixed(0)+" md"],
                  ["Avg Por",  avgPor.toFixed(1)+"%"],
                  ["Avg Skin (initial)", avgSkin.toFixed(1)],
                  ["Avg h",   avgH.toFixed(0)+" ft"],
                  ["PI Before", piBase.toFixed(3)+" bbl/d/psi"],
                  ["Intervals", nR],
                ].map(([k,v]) =>
                  <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span>{k}:</span>
                    <span style={{ fontFamily:T.mono, color:T.text0 }}>{v}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ── RIGHT: charts ── */}
        <div>
          {/* Tab selector */}
          <Tabs tabs={[
            {id:"skin",      label:"Skin Response"},
            {id:"pi",        label:"PI Response"},
            {id:"placement", label:"Placement & Penetration"},
          ]} active={tab} onSet={setTab} />

          {tab === "skin" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Card title="Skin After vs Acid Concentration">
              <TChart H={160} xLbl="Acid Concentration (%)" series={[
                {label:"Skin After", data:sk(concPts), color:T.teal, fill:true},
                {label:"Current",    data:[{x:acid, y:+predSkin}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Skin After vs Total Volume">
              <TChart H={160} xLbl="Acid Volume (bbl)" series={[
                {label:"Skin After", data:sk(volPts), color:T.green, fill:true},
                {label:"Current",    data:[{x:vol, y:+predSkin}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Skin After vs Pump Rate">
              <TChart H={160} xLbl="Pump Rate (bpm)" series={[
                {label:"Skin After", data:sk(ratePts), color:T.blue, fill:true},
                {label:"Current",    data:[{x:rate, y:+predSkin}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Skin After vs Diverter Concentration">
              <TChart H={160} xLbl="Diverter Concentration (gal/Mgal)" series={[
                {label:"Skin After", data:divPts.map(p=>({x:p.x, y:p.skin})), color:T.gold, fill:true},
                {label:"Current",    data:[{x:dConc, y:curDiv.skin}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
          </div>}
          {tab === "skin" && <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4,
              padding:"6px 10px",background:T.bg3,border:`1px solid ${T.border0}`}}>
              Detailed Sensitivity Table — Skin After
            </div>
            <Tabs tabs={[
              {id:"st_conc", label:"vs Concentration"},
              {id:"st_vol",  label:"vs Volume"},
              {id:"st_rate", label:"vs Rate"},
              {id:"st_div",  label:"vs Diverter"},
            ]} active={sensTab} onSet={setSensTab}/>
            {sensTab==="st_conc" && <SensTable rows={concTable} paramLabel="Acid Conc" paramUnit="%" color={T.teal}/>}
            {sensTab==="st_vol"  && <SensTable rows={volTable}  paramLabel="Volume" paramUnit="bbl" color={T.green}/>}
            {sensTab==="st_rate" && <SensTable rows={rateTable} paramLabel="Rate" paramUnit="bpm" color={T.blue}/>}
            {sensTab==="st_div"  && <SensTable rows={divTable}  paramLabel="Div Conc" paramUnit="gal/Mgal" color={T.gold}/>}
          </div>}

          {tab === "pi" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Card title="PI After vs Acid Concentration">
              <TChart H={160} xLbl="Acid Concentration (%)" series={[
                {label:"PI After",  data:pi(concPts), color:T.teal, fill:true},
                {label:"PI Before", data:concPts.map(p=>({x:p.x, y:piBase})), color:T.text3, dash:"3,3"},
                {label:"Current",   data:[{x:acid, y:curPI}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="PI After vs Total Volume">
              <TChart H={160} xLbl="Acid Volume (bbl)" series={[
                {label:"PI After",  data:pi(volPts), color:T.green, fill:true},
                {label:"PI Before", data:volPts.map(p=>({x:p.x, y:piBase})), color:T.text3, dash:"3,3"},
                {label:"Current",   data:[{x:vol, y:curPI}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="PI After vs Pump Rate">
              <TChart H={160} xLbl="Pump Rate (bpm)" series={[
                {label:"PI After",  data:pi(ratePts), color:T.blue, fill:true},
                {label:"PI Before", data:ratePts.map(p=>({x:p.x, y:piBase})), color:T.text3, dash:"3,3"},
                {label:"Current",   data:[{x:rate, y:curPI}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="PI After vs Diverter Concentration">
              <TChart H={160} xLbl="Diverter Concentration (gal/Mgal)" series={[
                {label:"PI After",  data:divPts.map(p=>({x:p.x, y:p.pi})), color:T.gold, fill:true},
                {label:"PI Before", data:divPts.map(p=>({x:p.x, y:piBase})), color:T.text3, dash:"3,3"},
                {label:"Current",   data:[{x:dConc, y:curDiv.pi}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
          </div>}
          {tab === "pi" && <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4,
              padding:"6px 10px",background:T.bg3,border:`1px solid ${T.border0}`}}>
              Detailed Sensitivity Table — PI After
            </div>
            <Tabs tabs={[
              {id:"pt_conc", label:"vs Concentration"},
              {id:"pt_vol",  label:"vs Volume"},
              {id:"pt_rate", label:"vs Rate"},
              {id:"pt_div",  label:"vs Diverter"},
            ]} active={sensTab} onSet={setSensTab}/>
            {sensTab==="pt_conc" && <SensTable rows={concTable} paramLabel="Acid Conc" paramUnit="%" color={T.teal}/>}
            {sensTab==="pt_vol"  && <SensTable rows={volTable}  paramLabel="Volume" paramUnit="bbl" color={T.green}/>}
            {sensTab==="pt_rate" && <SensTable rows={rateTable} paramLabel="Rate" paramUnit="bpm" color={T.blue}/>}
            {sensTab==="pt_div"  && <SensTable rows={divTable}  paramLabel="Div Conc" paramUnit="gal/Mgal" color={T.gold}/>}
          </div>}

          {tab === "placement" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Card title="Placement Coverage vs Diverter Concentration"
              action={<span style={{fontSize:10,color:T.text2}}>% of intervals receiving acid</span>}>
              <TChart H={160} xLbl="Diverter Concentration (gal/Mgal)" series={[
                {label:"Placement %", data:divPts.map(p=>({x:p.x, y:p.placementPct})), color:T.teal, fill:true},
                {label:"Current",     data:[{x:dConc, y:+predPlace}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Acid Penetration vs Pump Rate">
              <TChart H={160} xLbl="Pump Rate (bpm)" series={[
                {label:"Penetration (in)", data:ratePts.map(p=>({x:p.x, y:p.pen})), color:T.blue, fill:true},
                {label:"Current",          data:[{x:rate, y:curMain.pen}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Acid Penetration vs Volume">
              <TChart H={160} xLbl="Acid Volume (bbl)" series={[
                {label:"Penetration (in)", data:volPts.map(p=>({x:p.x, y:p.pen})), color:T.gold, fill:true},
                {label:"Current",          data:[{x:vol, y:curMain.pen}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
            <Card title="Penetration vs Acid Concentration">
              <TChart H={160} xLbl="Acid Concentration (%)" series={[
                {label:"Penetration (in)", data:concPts.map(p=>({x:p.x, y:p.pen})), color:T.violet, fill:true},
                {label:"Current",          data:[{x:acid, y:curMain.pen}], color:T.red, dash:"4,2"},
              ]}/>
            </Card>
          </div>}
          {tab === "placement" && <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text1,marginBottom:4,
              padding:"6px 10px",background:T.bg3,border:`1px solid ${T.border0}`}}>
              Detailed Sensitivity Table — Placement & Penetration
            </div>
            <Tabs tabs={[
              {id:"pp_div",  label:"vs Diverter"},
              {id:"pp_rate", label:"vs Rate"},
              {id:"pp_vol",  label:"vs Volume"},
              {id:"pp_conc", label:"vs Concentration"},
            ]} active={sensTab} onSet={setSensTab}/>
            {sensTab==="pp_div"  && <SensTable rows={divTable}  paramLabel="Div Conc" paramUnit="gal/Mgal" color={T.gold}/>}
            {sensTab==="pp_rate" && <SensTable rows={rateTable} paramLabel="Rate" paramUnit="bpm" color={T.blue}/>}
            {sensTab==="pp_vol"  && <SensTable rows={volTable}  paramLabel="Volume" paramUnit="bbl" color={T.green}/>}
            {sensTab==="pp_conc" && <SensTable rows={concTable} paramLabel="Acid Conc" paramUnit="%" color={T.teal}/>}
          </div>}

          {/* ── Equation summary ── */}
          <div style={{ marginTop:12, padding:"10px 12px", background:T.bg3, border:`1px solid ${T.border0}`, fontSize:10, color:T.text2, lineHeight:1.8 }}>
            <span style={{ fontWeight:700, color:T.text1 }}>Calculation chain: </span>
            Acid volume &amp; rate  &#8594;  Wormhole penetration (Williams-Hendrickson PVBT model)  &#8594;
            Bypass factor (Hawkins)  &#8594;  Skin after  &#8594;  PI (Darcy radial: 0.007082·k·h / (ln(re/rw) + S))
            <span style={{ marginLeft:8, color:T.text3 }}>
              | Diverter: logistic placement efficiency &#8594; vol/layer &#8594; penetration per layer
            </span>
          </div>
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
    var pj   = project || {};
    var sm   = (simResults && simResults.summary) ? simResults.summary : {};
    var DATA = (simResults && simResults.depthResults) ? simResults.depthResults : [];
    var ptD  = (simResults && simResults.pressureTime) ? simResults.pressureTime : [];
    var RES  = resRows   || [];
    var SCH  = schedRows || [];
    var WELL = wellData  || {};
    var FL   = fluidLib  || [];
    var now  = new Date().toLocaleString();

    // ── HTML helpers ──────────────────────────────────────────────────────
    var H = function(tag,cls,inner){ return "<"+tag+(cls?" class='"+cls+"'":"")+">"+inner+"</"+tag+">"; };
    var th = function(cols){ return "<tr>"+cols.map(function(c){return "<th>"+c+"</th>";}).join("")+"</tr>"; };
    var tr2= function(cols,hl){ return "<tr"+(hl?" class='hl'":"")+">"+ cols.map(function(c){return "<td>"+(c!=null&&c!==""?c:"—")+"</td>";}).join("")+"</tr>"; };
    var kv = function(k,v){ return "<tr><td class='kl'>"+k+"</td><td class='kv'>"+v+"</td></tr>"; };
    var met= function(val,lbl,col){ return "<div class='met' style='border-top:3px solid "+(col||"#0078A8")+"'><div class='mv'>"+val+"</div><div class='ml'>"+lbl+"</div></div>"; };

    // ── SVG chart builders (inline, no external libs) ─────────────────────
    // Returns an inline SVG polyline chart string
    function svgLine(series, W, H2, xLabel, yLabel) {
      var pad = {t:28,b:34,l:52,r:16};
      var gW = W-pad.l-pad.r, gH = H2-pad.t-pad.b;
      if (!series || !series.length) return "<svg width='"+W+"' height='"+H2+"'><text x='50%' y='50%' text-anchor='middle' fill='#888' font-size='11'>No data</text></svg>";
      var allX=[],allY=[];
      series.forEach(function(s){ s.data.forEach(function(d){allX.push(d.x);allY.push(d.y);}); });
      var xMn=Math.min.apply(null,allX),xMx=Math.max.apply(null,allX);
      var yMn=Math.min.apply(null,allY),yMx=Math.max.apply(null,allY);
      var xR=Math.max(0.001,xMx-xMn),yR=Math.max(0.001,yMx-yMn);
      var px=function(x){return pad.l+((x-xMn)/xR)*gW;};
      var py=function(y){return pad.t+gH-((y-yMn)/yR)*gH;};
      var nTx=5,nTy=4;
      var svg="<svg xmlns='http://www.w3.org/2000/svg' width='"+W+"' height='"+H2+"' style='background:#f8fafc;border:1px solid #B0BEC8;'>";
      // Grid
      for(var i=0;i<=nTy;i++){var y2=pad.t+(i/nTy)*gH;svg+="<line x1='"+pad.l+"' y1='"+y2+"' x2='"+(pad.l+gW)+"' y2='"+y2+"' stroke='#D0D8E0' stroke-width='0.5'/>";}
      for(var j=0;j<=nTx;j++){var x2=pad.l+(j/nTx)*gW;svg+="<line x1='"+x2+"' y1='"+pad.t+"' x2='"+x2+"' y2='"+(pad.t+gH)+"' stroke='#D0D8E0' stroke-width='0.5'/>";}
      // Y ticks
      for(var i=0;i<=nTy;i++){var yv=yMn+(i/nTy)*yR;var y2=pad.t+gH-(i/nTy)*gH;svg+="<text x='"+(pad.l-4)+"' y='"+(y2+3)+"' text-anchor='end' font-size='8' fill='#607080'>"+yv.toFixed(1)+"</text>";}
      // X ticks
      for(var j=0;j<=nTx;j++){var xv=xMn+(j/nTx)*xR;var x2=pad.l+(j/nTx)*gW;svg+="<text x='"+x2+"' y='"+(pad.t+gH+11)+"' text-anchor='middle' font-size='8' fill='#607080'>"+xv.toFixed(1)+"</text>";}
      // Axis labels
      svg+="<text x='"+(pad.l+gW/2)+"' y='"+(H2-3)+"' text-anchor='middle' font-size='9' fill='#405060'>"+xLabel+"</text>";
      svg+="<text x='10' y='"+(pad.t+gH/2)+"' text-anchor='middle' font-size='9' fill='#405060' transform='rotate(-90,10,"+(pad.t+gH/2)+")'>"+yLabel+"</text>";
      // Border
      svg+="<rect x='"+pad.l+"' y='"+pad.t+"' width='"+gW+"' height='"+gH+"' fill='none' stroke='#94A8B8' stroke-width='0.7'/>";
      // Series
      series.forEach(function(s){
        var pts=s.data.map(function(d){return px(d.x).toFixed(1)+","+py(d.y).toFixed(1);}).join(" ");
        if(s.fill){svg+="<polyline points='"+pts+" "+(pad.l+gW)+","+(pad.t+gH)+" "+pad.l+","+(pad.t+gH)+"' fill='"+s.color+"' fill-opacity='0.12' stroke='none'/>";}
        svg+="<polyline points='"+pts+"' fill='none' stroke='"+s.color+"' stroke-width='"+(s.dash?"1.5":"2")+"'"+(s.dash?" stroke-dasharray='"+s.dash+"'":"")+"'/>";
      });
      // Legend
      var lx=pad.l+4;
      series.forEach(function(s,i){
        svg+="<line x1='"+lx+"' y1='"+(pad.t+8+i*12)+"' x2='"+(lx+14)+"' y2='"+(pad.t+8+i*12)+"' stroke='"+s.color+"' stroke-width='2'/>";
        svg+="<text x='"+(lx+17)+"' y='"+(pad.t+12+i*12)+"' font-size='8' fill='#303840'>"+s.label+"</text>";
      });
      svg+="</svg>";
      return svg;
    }

    // Horizontal bar chart (for depth plots: skin, PI, penetration by layer)
    function svgDepthBars(DATA2, key2, key2b, W2, H2, xLabel) {
      if(!DATA2||!DATA2.length) return "<svg width='"+W2+"' height='"+H2+"'><text x='50%' y='50%' text-anchor='middle' fill='#888' font-size='11'>No data</text></svg>";
      var pad={t:16,b:24,l:58,r:16};
      var gW=W2-pad.l-pad.r,gH=H2-pad.t-pad.b;
      var nL=DATA2.length;
      var barH=Math.max(2,Math.floor((gH/nL)*0.7));
      var allV=[];
      DATA2.forEach(function(r){allV.push(+(r[key2]||0));if(key2b)allV.push(+(r[key2b]||0));});
      var vMx=Math.max(0.001,Math.max.apply(null,allV));
      var px=function(v){return pad.l+(v/vMx)*gW;};
      var svg="<svg xmlns='http://www.w3.org/2000/svg' width='"+W2+"' height='"+H2+"' style='background:#f8fafc;border:1px solid #B0BEC8;'>";
      // Grid lines
      for(var i=0;i<=4;i++){var x2=pad.l+(i/4)*gW;svg+="<line x1='"+x2+"' y1='"+pad.t+"' x2='"+x2+"' y2='"+(pad.t+gH)+"' stroke='#D0D8E0' stroke-width='0.5'/>";}
      // X axis ticks
      for(var i=0;i<=4;i++){var xv=+(vMx*(i/4)).toFixed(1);var x2=pad.l+(i/4)*gW;svg+="<text x='"+x2+"' y='"+(pad.t+gH+11)+"' text-anchor='middle' font-size='8' fill='#607080'>"+xv+"</text>";}
      svg+="<text x='"+(pad.l+gW/2)+"' y='"+(H2-3)+"' text-anchor='middle' font-size='9' fill='#405060'>"+xLabel+"</text>";
      // Bars per layer
      DATA2.forEach(function(r,i){
        var yc=pad.t+(i/nL)*gH+barH*0.1;
        var dep=r.depth||r.top||("L"+(i+1));
        svg+="<text x='"+(pad.l-3)+"' y='"+(yc+barH*0.7)+"' text-anchor='end' font-size='7' fill='#506070'>"+dep+"</text>";
        var w=px(+(r[key2]||0))-pad.l;
        svg+="<rect x='"+pad.l+"' y='"+yc+"' width='"+Math.max(1,w)+"' height='"+barH+"' fill='#1A6BAA' opacity='0.75' rx='1'/>";
        if(key2b){
          var w2=px(+(r[key2b]||0))-pad.l;
          svg+="<rect x='"+pad.l+"' y='"+(yc+barH+1)+"' width='"+Math.max(1,w2)+"' height='"+barH+"' fill='#1A7A40' opacity='0.75' rx='1'/>";
        }
      });
      svg+="</svg>";
      return svg;
    }

    // ── Sensitivity curves (recalculated inline) ──────────────────────────
    var avgPerm2=(RES.length?RES.reduce(function(s,r){return s+(+r.perm||1);},0)/RES.length:85);
    var avgPor2 =(RES.length?RES.reduce(function(s,r){return s+(+r.por||15);},0)/RES.length:18);
    var avgSkin2=(RES.length?RES.reduce(function(s,r){return s+(+r.skin||10);},0)/RES.length:(sm.avgSkinB||12));
    var rw_ft   =(+WELL.wbR||0.365)/12;
    var re_ft   =(+WELL.drainR||2640);
    var lnRe    =Math.max(0.01,Math.log(re_ft/Math.max(0.001,rw_ft)));
    var h_avg   =(RES.length?RES.reduce(function(s,r){return s+Math.max(1,(+r.bot||0)-(+r.top||0));},0)/RES.length:55);
    var coeff   =0.007082*avgPerm2*h_avg;
    var piBase2 =coeff/Math.max(0.01,lnRe+avgSkin2);
    // Rate sweep: skin after = f(rate)
    var rateArr=[0.5,1,1.5,2,2.5,3,3.5,4,5,6,8];
    var rateSkinData=rateArr.map(function(r){
      var rf=Math.max(0.5,Math.min(2.5,r/4));
      var effVol=250*(rf*0.6+0.4);
      var pen=Math.max(0,Math.min(48,1.5*Math.log(1+effVol/30)));
      var dmgR=12;
      var arg=pen/Math.max(1,dmgR);
      var tanh_v=arg/(1+Math.abs(arg));
      var bypass=Math.min(0.97,Math.max(0,tanh_v*0.85));
      var sa=Math.max(0.1,avgSkin2*(1-bypass));
      return {x:r,skin:+sa.toFixed(2),pi:+(coeff/Math.max(0.01,lnRe+sa)).toFixed(3)};
    });
    // Diverter sweep
    var divArr=[0.5,1,1.5,2,2.5,3,3.5,4,5,6,8];
    var nR2=RES.length||1;
    var divSkinData=divArr.map(function(d){
      var sig=1/(1+Math.exp(-(d-2.5)*0.9));
      var layF=0.25+0.75*sig;
      var volPerL=250/Math.max(1,nR2*layF);
      var pen=Math.max(0,Math.min(48,1.5*Math.log(1+volPerL/30)));
      var arg=pen/12;var tanh_v=arg/(1+Math.abs(arg));
      var bypass=Math.min(0.97,Math.max(0,tanh_v*0.85));
      var sa=Math.max(0.1,avgSkin2*(1-bypass)+0.1*(1-bypass));
      var placePct=layF*100;
      return {x:d,skin:+sa.toFixed(2),pi:+(coeff/Math.max(0.01,lnRe+sa)).toFixed(3),pct:+placePct.toFixed(1)};
    });

    // ── Pressure time series (SVG) ──────────────────────────────────────────
    var presSVG="";
    if(ptD&&ptD.length>0){
      presSVG=svgLine([
        {label:"TP (psi)",data:ptD.map(function(p){return{x:p.x,y:p.tp};}),color:"#0078A8",fill:false},
        {label:"BHP (psi)",data:ptD.map(function(p){return{x:p.x,y:p.bhp};}),color:"#1A7A40",fill:false},
        {label:"WHP (psi)",data:ptD.map(function(p){return{x:p.x,y:p.whp};}),color:"#C87000",fill:false},
      ],560,160,"Cumulative Time (min)","Pressure (psi)");
    } else {
      presSVG="<p style='color:#888;font-style:italic'>Run simulation to generate pressure data.</p>";
    }

    // ── CSS ──────────────────────────────────────────────────────────────────
    var CSS2=[
      "*{box-sizing:border-box;margin:0;padding:0}",
      "body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#111;background:#fff;padding:14mm 16mm 14mm 20mm;line-height:1.4}",
      "h1{font-size:17pt;color:#003366;border-bottom:3px solid #0078A8;padding-bottom:8px;margin-bottom:16px;letter-spacing:0.3px}",
      "h2{font-size:12pt;color:#003366;margin:22px 0 8px;padding:5px 10px;background:#EAF2FA;border-left:4px solid #0078A8;font-weight:700}",
      "h3{font-size:10.5pt;color:#1A4E8C;margin:14px 0 5px;font-weight:700;border-bottom:1px solid #D0DCE8;padding-bottom:3px}",
      ".cover{text-align:center;padding:40px 0 30px;border-bottom:2px solid #0078A8;margin-bottom:20px}",
      ".cover .logo-box{display:inline-block;padding:10px 28px;background:#003366;color:#fff;font-size:22pt;font-weight:700;letter-spacing:2px;margin-bottom:12px}",
      ".cover .subtitle{font-size:13pt;color:#0078A8;margin:6px 0}",
      ".cover .meta-line{font-size:10pt;color:#556;margin:3px 0}",
      ".cover .conf{margin-top:14px;font-size:9pt;color:#888;font-style:italic}",
      ".grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}",
      ".met{background:#EAF2FA;border:1px solid #B0CCDF;border-radius:2px;padding:10px 10px 8px;text-align:center}",
      ".mv{font-size:16pt;font-weight:700;color:#003366;font-family:'Courier New',monospace}",
      ".ml{font-size:8pt;color:#557;margin-top:2px;text-transform:uppercase;letter-spacing:0.4px}",
      "table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:9pt}",
      "th{background:#003366;color:#fff;padding:5px 7px;text-align:left;font-weight:600;font-size:8.5pt}",
      "td{padding:4px 7px;border-bottom:1px solid #D8E4EE;vertical-align:top}",
      "tr:nth-child(even) td{background:#F2F7FC}",
      "tr.hl td{background:#FFF8E6;font-weight:600}",
      ".kl{width:38%;color:#506070;font-size:9.5pt}",
      ".kv{font-family:'Courier New',monospace;font-size:9.5pt;color:#111}",
      ".two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px}",
      ".chart-box{background:#F4F8FC;border:1px solid #C0D0DC;padding:8px 8px 4px}",
      ".chart-title{font-size:9pt;font-weight:700;color:#003366;margin-bottom:5px;border-bottom:1px solid #C0D0DC;padding-bottom:3px}",
      ".note-box{background:#FFF8E6;border:1px solid #C87000;border-left:3px solid #C87000;padding:8px 11px;font-size:9pt;margin:10px 0}",
      ".placed-yes{color:#1A7A40;font-weight:700}",
      ".placed-no{color:#B82020}",
      ".footer{margin-top:30px;font-size:8pt;color:#888;border-top:1px solid #C8D4DC;padding-top:7px;display:flex;justify-content:space-between}",
      "@media print{body{padding:8mm}@page{margin:10mm;size:A4} h2{break-before:auto} .no-break{page-break-inside:avoid}}",
    ].join("\n");

    // ── Build sections ────────────────────────────────────────────────────
    var totalVol=SCH.reduce(function(s,x){return s+(+x.vol||0);},0);
    var acidVol =SCH.filter(function(s){return /(Main|Acid|Sandstone)/i.test(s.cat||s.name||"");}).reduce(function(s,x){return s+(+x.vol||0);},0);
    var wdesc=[
      kv("Well Name",   pj.well||(WELL.wellName||"—")),
      kv("Well Type",   WELL.type||"Producer"),
      kv("Profile",     WELL.profile||"Vertical"),
      kv("Field",       pj.field||"—"),
      kv("Company",     "Kemiserve FZE"),
      kv("Wellbore Radius", (+WELL.wbR||0.365)+" in"),
      kv("Drainage Radius", (+WELL.drainR||2640)+" ft"),
      kv("Reservoir Top", (+WELL.resTop||"—")+" ft MD"),
      kv("Tubing Length",  (+WELL.tubLen||"—")+" ft"),
      kv("Tubing ID",      (+WELL.tubID||"—")+" in"),
      kv("Casing ID",      (+WELL.casID||"—")+" in"),
      kv("Completion Type",(WELL.compType||"Cased Hole")),
    ].join("");

    // Fluid library table rows
    var flHTML=FL.map(function(f,i){return tr2([i+1,f.name,f.type,f.cat,
      (f.conc||"—")+"%",(f.density||"—")+" g/cm3",(f.visc||"—")+" cP",f.rxRate||"—"]);}).join("");

    // Depth results table — full
    var tot3=DATA.reduce(function(s,x){return s+(+x.V_main_acid||0);},0);
    var depthFull=DATA.map(function(r,i){
      var pct=tot3>0?((+r.V_main_acid||0)/tot3*100).toFixed(1):"0.0";
      var isPlaced=r.placed;
      return "<tr class='"+(isPlaced?"hl":"")+"'>"+
        ["<td class='"+(isPlaced?"placed-yes":"placed-no")+"'>"+(isPlaced?"Yes":"No")+"</td>",
         "<td>"+r.depth+"</td>","<td>"+(r.bot||"—")+"</td>",
         "<td>"+r.skinB+"</td>","<td>"+r.skinA+"</td>",
         "<td>"+(+r.skinB-+r.skinA).toFixed(1)+"</td>",
         "<td>"+(typeof r.pen==="number"?r.pen.toFixed(1):"0.0")+"</td>",
         "<td>"+(r.pres||"—")+"</td>","<td>"+(r.pres_res||"—")+"</td>",
         "<td>"+(r.qres!=null?(+r.qres).toFixed(4):"—")+"</td>",
         "<td>"+pct+"%</td>",
         "<td>"+(r.pi_b!=null?(+r.pi_b).toFixed(3):"—")+"</td>",
         "<td>"+(r.pi_a!=null?(+r.pi_a).toFixed(3):"—")+"</td>",
         "<td>"+(r.V_main_acid||0).toFixed(1)+"</td>",
         "<td>"+(r.T_main_acid||0).toFixed(1)+"</td>"].join("")+
        "</tr>";
    }).join("");

    // ── Assemble full HTML ───────────────────────────────────────────────
    var body="<!DOCTYPE html><html><head><meta charset='utf-8'/><title>StimOPTI — "+((pj.name)||"Report")+"</title><style>"+CSS2+"</style></head><body>";

    // COVER PAGE
    body+="<div class='cover'>";
    body+="<div class='logo-box'>StimOPTI</div>";
    body+="<div class='subtitle'>Matrix Acid Stimulation Job Report</div>";
    body+="<div class='meta-line'><b>Project:</b> "+(pj.name||"—")+" &nbsp;|&nbsp; <b>Well:</b> "+(pj.well||(WELL.wellName||"—"))+" &nbsp;|&nbsp; <b>Field:</b> "+(pj.field||"—")+"</div>";
    body+="<div class='meta-line'><b>Prepared by:</b> Kemiserve FZE, SPC Freezone, Sharjah, UAE &nbsp;|&nbsp; <b>Date:</b> "+now+"</div>";
    body+="<div class='conf'>CONFIDENTIAL — For authorized personnel only. Not for redistribution.</div>";
    body+="</div>";

    // 1. EXECUTIVE SUMMARY
    body+="<h2>1. Executive Summary</h2>";
    body+="<div class='grid4'>";
    body+=met(sm.avgSkinB||"—","Initial Avg Skin","#B82020");
    body+=met(sm.avgSkinA||"—","Final Avg Skin","#1A7A40");
    body+=met((sm.skinReduction||"—")+"%","Skin Reduction","#0078A8");
    body+=met((sm.piRatio||"—")+"x","PI Improvement","#0078A8");
    body+=met((sm.placementPct||"—")+"%","Acid Placement","#C87000");
    body+=met((sm.totalAcidVol||totalVol||"—")+" bbl","Total Acid Vol","#0078A8");
    body+=met(sm.avgPIB!=null?sm.avgPIB:"—","PI Before (bbl/d/psi)","#B82020");
    body+=met(sm.avgPIA!=null?sm.avgPIA:"—","PI After (bbl/d/psi)","#1A7A40");
    body+="</div>";
    if(!simResults){body+="<div class='note-box'>Note: Simulation has not been run yet. Run the simulation from the platform to populate all result tables and charts.</div>";}

    // 2. WELL & COMPLETION
    body+="<h2>2. Well &amp; Completion Data</h2>";
    body+="<div class='two-col'><div><h3>Well Parameters</h3><table><tbody>"+wdesc+"</tbody></table></div>";
    body+="<div><h3>Simulation Settings</h3><table><tbody>";
    if(simResults&&simResults.simParams){var sp=simResults.simParams;
      body+=kv("Depth Grids",sp.numDepthGrids||100);body+=kv("Timesteps/Stage",sp.numTimesteps||10);}
    else{body+=kv("Depth Grids","20 (default)");body+=kv("Timesteps/Stage","10 (default)");}
    body+=kv("Injection Type","Matrix (below frac pressure)");
    body+=kv("Pressure Model","Sequential mass-balance BHP/WHP");
    body+=kv("Skin Model","Hawkins bypass + wormhole PVBT");
    body+=kv("PI Model","Darcy radial flow");
    body+="</tbody></table></div></div>";

    // 3. RESERVOIR DATA
    body+="<h2>3. Reservoir Interval Data</h2>";
    body+="<table>"+th(["#","Top (ft MD)","Bot (ft MD)","h (ft)","Lithology","Perm (md)","Por (%)","Skin","Pres (psi)","Damage R (in)"])+"<tbody>";
    body+=RES.map(function(r,i){return tr2([i+1,r.top,r.bot,
      Math.max(1,(+r.bot||0)-(+r.top||0)).toFixed(0),
      r.lith||"Carbonate",r.perm,r.por,r.skin,r.pres||"—",r.dmgR||12]);}).join("");
    body+="</tbody></table>";

    // 4. FLUIDS LIBRARY
    body+="<h2>4. Fluids Library — Selected Systems</h2>";
    body+="<table>"+th(["#","Fluid Name","Type","Category","Conc","Density","Viscosity","Rxn Rate"])+"<tbody>"+flHTML+"</tbody></table>";

    // 5. PUMP SCHEDULE
    body+="<h2>5. Pump Schedule</h2>";
    body+="<table>"+th(["#","Stage Name","Fluid","Rate (bpm)","Volume (bbl)","Duration (min)","Top D (ft)","Bot D (ft)","Category"])+"<tbody>";
    body+=SCH.map(function(s,i){var dur=+(+s.vol||0)/Math.max(0.01,+s.rate||1);
      return tr2([i+1,s.name||"—",s.fluid||"—",s.rate||"—",s.vol||"—",dur.toFixed(0),s.topD||"—",s.botD||"—",s.cat||s.type||"—"]);
    }).join("");
    body+="</tbody></table>";
    body+="<table><tbody>"+kv("Total Fluid Volume",totalVol.toFixed(0)+" bbl")+kv("Total Acid Volume",acidVol.toFixed(0)+" bbl")+kv("Number of Stages",SCH.length)+"</tbody></table>";

    // 6. PRESSURE RESULTS
    body+="<h2>6. Pressure vs Time</h2>";
    body+="<div class='chart-box'><div class='chart-title'>Tubing Pressure / BHP / WHP vs Cumulative Injection Time</div>"+presSVG+"</div>";

    // 7. DEPTH RESULTS
    body+="<h2>7. Simulation Results by Depth Interval</h2>";
    body+="<table>"+th(["Placed","Top (ft)","Bot (ft)","Skin B","Skin A","dSkin","Pen (in)","P_wb (psi)","P_res (psi)","Qres (bbl/min)","% Acid","PI Before","PI After","V_acid (bbl)","T_acid (min)"])+"<tbody>"+depthFull+"</tbody></table>";

    // 8. DEPTH CHARTS
    body+="<h2>8. Depth Profile Charts</h2>";
    body+="<div class='two-col'>";
    body+="<div class='chart-box'><div class='chart-title'>Skin Factor Before &amp; After by Depth</div>"+svgDepthBars(DATA,"skinB","skinA",380,200,"Skin Factor")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>Acid Penetration by Depth (in)</div>"+svgDepthBars(DATA,"pen",null,380,200,"Penetration (in)")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>Productivity Index (Before vs After)</div>"+svgDepthBars(DATA,"pi_b","pi_a",380,200,"PI (bbl/d/psi)")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>Wellbore Pressure by Depth</div>"+svgDepthBars(DATA,"pres",null,380,200,"P_wb (psi)")+"</div>";
    body+="</div>";

    // 9. SENSITIVITY
    body+="<h2>9. Sensitivity Analysis</h2>";
    body+="<div class='note-box'>Curves computed via engine model: Acid Volume + Rate &rarr; PVBT Wormhole Penetration &rarr; Hawkins Bypass &rarr; Skin After &rarr; Darcy PI. Diverter model: logistic placement efficiency &rarr; vol/layer &rarr; penetration per layer.</div>";
    body+="<div class='two-col'>";
    body+="<div class='chart-box'><div class='chart-title'>Skin After vs Pump Rate (bpm)</div>"+
      svgLine([{label:"Skin After",data:rateSkinData.map(function(p){return{x:p.x,y:p.skin};}),color:"#0078A8",fill:true}],380,150,"Pump Rate (bpm)","Skin After")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>PI After vs Pump Rate (bpm)</div>"+
      svgLine([{label:"PI After",data:rateSkinData.map(function(p){return{x:p.x,y:p.pi};}),color:"#1A7A40",fill:true},{label:"PI Before",data:rateSkinData.map(function(p){return{x:p.x,y:piBase2};}),color:"#888",dash:"4,2"}],380,150,"Pump Rate (bpm)","PI (bbl/d/psi)")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>Skin After vs Diverter Concentration</div>"+
      svgLine([{label:"Skin After",data:divSkinData.map(function(p){return{x:p.x,y:p.skin};}),color:"#C87000",fill:true}],380,150,"Diverter Conc (gal/Mgal)","Skin After")+"</div>";
    body+="<div class='chart-box'><div class='chart-title'>Placement Coverage vs Diverter Concentration</div>"+
      svgLine([{label:"Coverage %",data:divSkinData.map(function(p){return{x:p.x,y:p.pct};}),color:"#5B3A9A",fill:true}],380,150,"Diverter Conc (gal/Mgal)","% Layers Reached")+"</div>";
    body+="</div>";

    // 10. DISCLAIMER / FOOTER
    body+="<h2>10. Notes &amp; Disclaimers</h2>";
    body+="<p style='font-size:9.5pt;line-height:1.7;color:#444'>This report was generated by StimOPTI v5.0, proprietary acid stimulation design software developed and owned exclusively by Kemiserve FZE, SPC Freezone, Sharjah, UAE. All calculations use industry-standard models including Darcy radial flow, the Hawkins skin bypass model, and the Williams-Hendrickson PVBT wormhole propagation model. Results are for engineering analysis purposes and should be reviewed by a qualified petroleum engineer before execution. Kemiserve FZE accepts no liability for operational decisions made solely on the basis of this report.</p>";

    body+="<div class='footer'><span>StimOPTI v5.0 &mdash; Kemiserve FZE &mdash; Confidential</span><span>Generated: "+now+"</span></div>";
    body+="</body></html>";
    return body;
  }

  // Download report as a self-contained .html file
  function downloadHTML() {
    var html = buildReportHTML();
    try {
      var blob = new Blob([html], { type: "text/html;charset=utf-8" });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement("a");
      var pn   = (project && project.name) ? project.name.replace(/[^a-z0-9]/gi,"_") : "StimOPTI";
      a.href     = url;
      a.download = pn + "_Report_" + new Date().toISOString().slice(0,10) + ".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    } catch(e) {
      alert("Download failed: " + e.message + "\nTry the Preview button instead.");
    }
  }

  function previewReport() {
    var html = buildReportHTML();
    setPreviewHTML(html);
    setShowPreview(true);
  }

  
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const sm = (simResults && simResults.summary) ? simResults.summary : {};

  return <div style={{ flex:1, overflow:"auto" }}>
    <Topbar title="Reports"
      sub={(project&&project.name)||"Project"}
      actions={<>
        <Btn sz="s" v="o" onClick={previewReport}>Preview in App</Btn>
        <Btn sz="s" v="a" onClick={downloadHTML}>Download HTML</Btn>
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
        <div onClick={downloadHTML} style={{ marginTop:18, background:T.gold, color:T.bg0, borderRadius:8, padding:"12px 0", fontSize:13, fontWeight:800, textAlign:"center", cursor:"pointer", userSelect:"none" }}>
          Download HTML Report
        </div>
        <div style={{ marginTop:8, fontSize:10, color:T.text3, textAlign:"center", lineHeight:1.5 }}>
          Downloads a self-contained HTML report file. Open in any browser to view or print as PDF.
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
          <Btn sz="s" v="a" onClick={downloadHTML}>Download HTML</Btn>
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
  const nDG      = Math.min(+sp.numDepthGrids || 100, 100);
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
    let fracRisk = Pwb_i >= fracPres;
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
            {['Node','z (ft)','Pres_res (psi)','ΔPhyd (psi)','ΔPfric_loc (psi)','Pwb (psi)','ΔP_inj (psi)','II (bbl/d/psi)','Qres (bbl/d)','Q_rem (bpm)','Status'].map(h=>
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

function DebutReportPage({ project, simResults, resRows, wellData, schedRows, fluids, recipes, simParams }) {
  const [tab, setTab] = useState("inputs");
  const DATA    = (simResults && simResults.depthResults && simResults.depthResults.length)
                  ? simResults.depthResults : [];
  const summary = simResults ? simResults.summary : null;
  const ptD     = simResults && simResults.pressureTime ? simResults.pressureTime.slice(0,80) : [];
  const res     = resRows  || INIT_RESERVOIR;
  const well    = wellData || DEFAULTS.well;
  const sched   = schedRows || INIT_SCHEDULE;
  const flib    = fluids   || INIT_FLUIDS;
  const sp      = simParams || { numDepthGrids: DEFAULTS.numDepthGrids, numTimesteps: DEFAULTS.numTimesteps };
  const log     = simResults && simResults.solverLog ? simResults.solverLog : [];

  const topD = res.length ? Math.min(...res.map(r=>+r.top)) : 8200;
  const botD = res.length ? Math.max(...res.map(r=>+r.bot)) : 8540;

  const SEC = { fontSize:13,fontWeight:700,color:T.text0,marginBottom:10,marginTop:20,
                paddingBottom:6,borderBottom:`1px solid ${T.border0}` };
  const NOTE= { fontSize:11,color:T.text1,lineHeight:1.7,marginBottom:8 };
  const BOX = { background:T.bg2,border:`1px solid ${T.border0}`,padding:14,marginBottom:12 };

  function TH(txt) {
    return <th style={{background:T.bg3,padding:"5px 8px",textAlign:"left",color:T.text1,
      borderBottom:`2px solid ${T.border0}`,fontSize:10,fontWeight:700,
      textTransform:"uppercase",letterSpacing:"0.4px",whiteSpace:"nowrap"}}>{txt}</th>;
  }
  function TD(txt,col) {
    return <td style={{padding:"4px 8px",borderBottom:`1px solid ${T.border0}`,
      color:col||T.text1,fontFamily:T.mono,fontSize:11}}>{txt!=null&&txt!=""?txt:"—"}</td>;
  }

  return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
    <Topbar title="Debug Report"
      sub={`${project?.name||"Project"} · Full project inputs, outputs and solver diagnostics`}
      actions={<Btn sz="s" v="g" onClick={()=>{
        const lines = [
          "=== DEBUG REPORT: "+(project?.name||"Project")+" ===",
          "Generated: "+new Date().toLocaleString(),
          "StimOPTI v5 — Kemiserve FZE",
          "",
          "── RESERVOIR DATA ("+res.length+" intervals) ──",
          "From MD | To MD | TVD | Por% | Perm(md) | Skin | Pres(psi) | wt%Cal | wt%Dol | wt%Shale | DmgR(ft)",
          ...res.map(r=>`${r.top} | ${r.bot} | ${r.tvd||r.top} | ${r.por} | ${r.perm} | ${r.skin} | ${r.pres||"—"} | ${r.calcite??100} | ${r.dolomite??0} | ${r.shale??0} | ${r.dmgR??1}`),
          "",
          "── WELL & COMPLETION ──",
          `Type: ${well.type}  Profile: ${well.profile}  CompType: ${well.compType||"Open Hole"}`,
          `WbR: ${well.wbR}in  DrainR: ${well.drainR}ft  TubLen: ${well.tubLen}ft  TubID: ${well.tubID}in`,
          "",
          "── PUMP SCHEDULE ("+sched.length+" stages) ──",
          "Stage | Fluid | Rate(GPM) | Volume(Gal)",
          ...sched.map((s,i)=>`${i+1}. ${s.stage||s.name} | ${s.fluid} | ${s.rate}GPM | ${s.vol}Gal`),
          "",
          "── SIMULATION RESULTS ──",
          summary ? [
            "Avg Skin Before: "+summary.avgSkinB,
            "Avg Skin After:  "+summary.avgSkinA,
            "Skin Reduction:  "+summary.skinReduction+"%",
            "PI Before:       "+summary.avgPIB+" bbl/d/psi",
            "PI After:        "+summary.avgPIA+" bbl/d/psi",
            "PI Ratio:        "+summary.piRatio+"x",
            "Placement:       "+summary.placementPct+"%  ("+summary.placedCount+"/"+summary.totalIntervals+" intervals)",
          ].join("\n") : "Not run yet",
          "",
          summary ? "── DEPTH RESULTS ──\nDepth | SkinB | SkinA | Pen(in) | P_wb | P_res | PI_B | PI_A | Placed | V_acid(bbl)\n"+
            DATA.map(r=>`${r.depth} | ${r.skinB} | ${r.skinA} | ${r.pen} | ${r.pres||"—"} | ${r.pres_res||"—"} | ${r.pi_b} | ${r.pi_a} | ${r.placed?"Yes":"No"} | ${r.V_main_acid||0}`)
            .join("\n") : "",
          "",
          "── SOLVER LOG ──",
          ...log,
        ].join("\n");
        const blob = new Blob([lines],{type:"text/plain"});
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href=url; a.download="DebugReport_"+(project?.name||"StimOPTI")+".txt";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url),2000);
      }}>Export Debug Log</Btn>}
    />
    <div style={{flex:1,overflow:"auto",padding:20}}>
      <Tabs tabs={[
        {id:"inputs",  label:"Input Data"},
        {id:"stages",  label:"Stage Results"},
        {id:"outputs", label:"Depth Results"},
        {id:"log",     label:"Solver Log"},
      ]} active={tab} onSet={setTab} />

      {/* ── STAGE RESULTS TAB ─────────────────────────────── */}
      {tab==="stages" && <div className="anim">
        <div style={BOX}>
          <div style={SEC}>Per-Stage Injection Summary</div>
          {(()=>{
            const stages = simResults?.stageResults || [];
            if (!stages.length) return <div style={{color:T.text3,fontSize:12,padding:"10px 0"}}>
              No stage results — run the simulation first.
            </div>;
            return <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>
                  {["#","Stage","Fluid / Recipe","Type","Rate (BPM)","Volume (BBL)",
                    "Duration (min)","Vol Injected (BBL)","Avg Qres (bbl/min)","Conserv Err%"].map(TH)}
                </tr></thead>
                <tbody>{stages.map((s,i)=>(
                  <tr key={i} style={{background:i%2===0?"#fff":"#F4F8FC"}}>
                    {TD(s.stageNum)}
                    {TD(s.stageName, T.teal)}
                    {TD(s.fluidName)}
                    {TD(s.isMainAcid?"Main Acid":"Non-Acid", s.isMainAcid?T.blue:T.text3)}
                    {TD((+s.rate_bpm).toFixed(3), T.gold)}
                    {TD((+s.vol_bbl).toFixed(3), T.blue)}
                    {TD((+s.dur_min).toFixed(3))}
                    {TD((+s.volInjected).toFixed(4), s.isMainAcid?T.teal:T.text2)}
                    {TD((+s.qres_total||0).toFixed(5), T.green)}
                    {TD(s.conservErr!=null?((+s.conservErr).toFixed(2)+"%"):"—",
                        +s.conservErr>5?T.red:+s.conservErr>1?T.gold:T.green)}
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{background:T.bg3,fontWeight:700}}>
                  {TD("TOTAL")}
                  {TD("")}{TD("")}{TD("")}{TD("—")}
                  {TD(stages.reduce((s,r)=>s+(+r.vol_bbl||0),0).toFixed(3)+" BBL",T.blue)}
                  {TD(stages.reduce((s,r)=>s+(+r.dur_min||0),0).toFixed(2)+" min")}
                  {TD(stages.reduce((s,r)=>s+(+r.volInjected||0),0).toFixed(4)+" BBL",T.teal)}
                  {TD("")}{TD("")}
                </tr></tfoot>
              </table>
            </div>;
          })()}
        </div>

        {/* Per-stage per-node Qres and volume breakdown */}
        {simResults?.stageResults?.length > 0 && !(simResults.stageResults[0].nodeData?.length) &&
          <div style={{padding:"8px 12px",background:"#FFF8E1",border:"1px solid #FFD54F",
            fontSize:11,marginBottom:10,color:"#E65100"}}>
            ⚠ Per-layer breakdown requires a fresh simulation. Please re-run the simulation
            to see per-layer Qres, volume, and penetration data in each stage.
          </div>
        }
        {(simResults?.stageResults||[]).map((stg, si) => (
          <div key={si} style={{...BOX,marginBottom:10}}>
            <div style={{...SEC,fontSize:12,marginBottom:8}}>
              Stage {stg.stageNum}: {stg.stageName} &nbsp;—&nbsp; {stg.fluidName}
              <span style={{fontWeight:400,color:T.text2,fontSize:11,marginLeft:10}}>
                Rate: {stg.rate_bpm} BPM &nbsp;|&nbsp;
                Sched Vol: {stg.vol_bbl} BBL &nbsp;|&nbsp;
                Injected: {stg.volInjected} BBL &nbsp;|&nbsp;
                Dur: {stg.dur_min} min &nbsp;|&nbsp;
                Total Qres: {(+stg.qres_total||0).toFixed(5)} bbl/min
              </span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead>
                  <tr>{["Layer (ft)","Perm (mD)",
                    "Qres Last TS (bbl/min)","Stage Dur (min)",
                    "Vol=Qres×Dur (BBL)","Vol Exact (BBL)",
                    "Pen This Stage (in)","Pen Cumul Front (in)","Cumul Vol (BBL)"].map(TH)}
                  </tr>
                </thead>
                <tbody>
                  {(stg.nodeData||[]).map((n,ni)=>(
                    <tr key={ni} style={{background:ni%2===0?"#fff":"#F4F8FC"}}>
                      {TD((+n.top||0).toFixed(0)+' – '+(+n.bot||0).toFixed(0), T.teal)}
                      {TD((+n.perm||0).toFixed(1))}
                      {TD((+n.qres_last||0).toFixed(5), +n.qres_last>0?T.green:T.text3)}
                      {TD((+stg.dur_min||0).toFixed(2))}
                      {TD((+n.vol_stage||0).toFixed(4), +n.vol_stage>0?T.blue:T.text3)}
                      {TD((+n.vol_exact||0).toFixed(4), T.teal)}
                      {TD((+n.pen_stage||0).toFixed(2), +n.pen_stage>0.01?T.gold:T.text3)}
                      {TD((+n.pen_cumul||0).toFixed(2), +n.pen_cumul>0.01?"#7986CB":T.text3)}
                      {TD((+n.V_total||0).toFixed(4), T.teal)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Final layer summary across all stages */}
        <div style={BOX}>
          <div style={SEC}>Final Per-Layer Summary (End of Treatment)</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr>
                {["Depth (ft)","Bot (ft)","V_pre (BBL)","V_main (BBL)","V_over (BBL)",
                  "Pen Preflush (in)","Pen Main (in)","Pen Overflush (in)",
                  "Qres inject (bbl/min)","Skin B","Skin A","Placed?"].map(TH)}
              </tr></thead>
              <tbody>{(()=>{
                const totV = DATA.reduce((s,r)=>s+(+r.V_main_acid||0),0);
                return DATA.map((r,i)=>(
                  <tr key={i} style={{background:r.placed?"#EFF9EF":"#fff"}}>
                    {TD(r.depth)}{TD(r.bot)}
                    {TD((+r.V_pre||0).toFixed(3), T.blue)}
                    {TD((+r.V_main||0).toFixed(3), T.teal)}
                    {TD((+r.V_over||0).toFixed(3), T.blue)}
                    {TD((+r.pen_preflush||0).toFixed(2), "#7986CB")}
                    {TD((+r.pen_main_inj||0).toFixed(2), T.teal)}
                    {TD((+r.pen_overflush||0).toFixed(2), T.blue)}
                    {TD((+r.qres_inject||+r.qres||0).toFixed(5), T.green)}
                    {TD((+r.skinB||0).toFixed(2), T.red)}
                    {TD((+r.skinA||0).toFixed(2), T.green)}
                    {TD(r.placed?"✓ Yes":"No", r.placed?T.green:T.red)}
                  </tr>
                ));
              })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {/* ── INPUTS TAB ─────────────────────────────────────── */}
      {tab==="inputs" && <div className="anim">

        {/* ── 1. Reservoir Data ───────────────────────────────────── */}
        <div style={BOX}>
          <div style={SEC}>1. Reservoir Data — {res.length} Interval{res.length!==1?"s":""}</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr>
                {["#","From MD (ft)","To MD (ft)","h (ft)","Lith","Por (%)","Perm (md)","Skin","Pres (psi)","T Layer (°F)","wt% Calcite","wt% Dolomite","wt% Shale","Dmg R (ft)","KH/KV"].map(TH)}
              </tr></thead>
              <tbody>{res.map((r,i)=>{
                const h_ft = (+r.bot-(+r.top)).toFixed(0);
                const ivMid = ((+r.top||8000)+(+r.bot||+r.top+50))/2;
                const T_lay = ((+well.T_surface||59)+(+well.T_grad||1.5)*ivMid/100).toFixed(1);
                return <tr key={i} style={{background:i%2===0?"transparent":"rgba(0,0,0,0.03)"}}>
                  {TD(i+1)}{TD(r.top)}{TD(r.bot)}{TD(h_ft,T.text2)}
                  {TD(r.lith||"Carbonate")}
                  {TD((+r.por||0).toFixed(1),T.teal)}
                  {TD((+r.perm||0).toFixed(1),T.blue)}
                  {TD((+r.skin||0).toFixed(2),T.red)}
                  {TD(r.pres)}
                  {TD(T_lay+"°F","#FF7043")}
                  {TD(r.calcite??100)}{TD(r.dolomite??0)}{TD(r.shale??0)}
                  {TD(r.dmgR??1.0)}{TD(r.khkv??1)}
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>

        {/* ── 2. Well & Completion ─────────────────────────────────── */}
        <div style={BOX}>
          <div style={SEC}>2. Well & Completion Parameters</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.text2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Wellbore</div>
              {[["Type",well.type],["Profile",well.profile],["Completion Type",well.compType||"Open Hole"],
                ["Wellbore Radius (in)",well.wbR],["Drainage Radius (ft)",well.drainR],
                ["Reservoir Top (ft)",well.resTop],["Inclination (°)",well.inc||0],
              ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border0}`,fontSize:11}}>
                <span style={{color:T.text2}}>{k}</span>
                <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{v||"—"}</span>
              </div>)}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.text2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Tubing & Completion</div>
              {[["Tubing Length (ft)",well.tubLen],["Tubing ID (in)",well.tubID],
                ["Casing ID (in)",well.casID||well.casID_ch||"—"],
                ...(well.compType==="Cased Hole"?[["Perf Pen Length (ft)",well.perfPenLen||"—"],["Perf Dia (in)",well.perfDia||"—"],["SPF",well.spf||"—"]]:[]),
              ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border0}`,fontSize:11}}>
                <span style={{color:T.text2}}>{k}</span>
                <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{v||"—"}</span>
              </div>)}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.text2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Temperature Profile</div>
              {[["Surface Temperature (°F)",+well.T_surface||59],
                ["Geothermal Gradient (°F/100ft)",+well.T_grad||1.5],
                ["T at Reservoir Top (°F)",((+well.T_surface||59)+(+well.T_grad||1.5)*(+well.resTop||topD)/100).toFixed(1)],
                ["T at Reservoir Bot (°F)",((+well.T_surface||59)+(+well.T_grad||1.5)*botD/100).toFixed(1)],
              ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border0}`,fontSize:11}}>
                <span style={{color:T.text2}}>{k}</span>
                <span style={{fontFamily:T.mono,color:"#FF7043",fontWeight:700}}>{v}</span>
              </div>)}
            </div>
          </div>
        </div>

        {/* ── 3. Pump Schedule ─────────────────────────────────────── */}
        <div style={BOX}>
          <div style={SEC}>3. Pump Schedule — {sched.length} Stage{sched.length!==1?"s":""}</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr>{["#","Stage Type","Fluid / Recipe","Rate (BPM)","Volume (BBL)","Duration (min)","Direction"].map(TH)}</tr></thead>
              <tbody>{sched.map((s,i)=>{
                const dur = s.rate > 0 ? (+s.vol / +s.rate).toFixed(1) : "—";
                const isMain = (s.stage||s.name||"").toLowerCase().includes("main");
                return <tr key={i} style={{background:isMain?"rgba(30,207,178,0.06)":i%2===0?"transparent":"rgba(0,0,0,0.03)"}}>
                  {TD(i+1)}
                  {TD(s.stage||s.name||"—")}
                  <td style={{padding:"4px 8px",borderBottom:`1px solid ${T.border0}`,color:T.teal,fontWeight:isMain?700:400,fontSize:11}}>{s.fluid||"—"}</td>
                  {TD((+s.rate||0).toFixed(2),T.blue)}
                  {TD((+s.vol||0).toFixed(1))}
                  {TD(dur,T.text2)}
                  {TD(s.dir||"Constant")}
                </tr>;
              })}</tbody>
            </table>
          </div>
          <div style={{marginTop:8,fontSize:11,color:T.text2,display:"flex",gap:16,flexWrap:"wrap"}}>
            <span>Total: <b style={{fontFamily:T.mono,color:T.teal}}>{sched.reduce((s,r)=>s+(+r.vol||0),0).toFixed(1)} BBL</b></span>
            <span>Main Acid: <b style={{fontFamily:T.mono,color:T.blue}}>{sched.filter(s=>(s.stage||s.name||"").toLowerCase().includes("main")).reduce((s,r)=>s+(+r.vol||0),0).toFixed(1)} BBL</b></span>
            <span>Total Duration: <b style={{fontFamily:T.mono}}>{sched.reduce((s,r)=>s+(+r.rate>0?(+r.vol/+r.rate):0),0).toFixed(1)} min</b></span>
          </div>
        </div>

        {/* ── 4. Recipe Design Used in Calculation ─────────────────── */}
        {(recipes||[]).length > 0 && <div style={BOX}>
          <div style={SEC}>4. Recipe Design Used in Calculation ({(recipes||[]).length} recipe{(recipes||[]).length!==1?"s":""})</div>
          {(recipes||[]).map((rec,ri)=>(
            <div key={ri} style={{marginBottom:16,border:`1px solid ${T.border0}`,borderRadius:4,overflow:"hidden"}}>
              <div style={{background:T.bg3,padding:"7px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border0}`}}>
                <span style={{fontSize:12,fontWeight:700,color:T.text0}}>{rec.name||"Unnamed Recipe"}</span>
                <span style={{fontSize:10,color:T.teal,background:"rgba(30,207,178,0.12)",padding:"2px 8px",borderRadius:10}}>{rec.stageType}</span>
                <span style={{fontSize:10,color:T.text2,marginLeft:"auto"}}>
                  Total Vol: <b style={{fontFamily:T.mono,color:T.text0}}>{rec.totalVol||"—"} BBL</b>
                </span>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>
                  {["#","Additive / Fluid Name","Code","UOM","Volume","Concentration"].map(TH)}
                </tr></thead>
                <tbody>{(rec.additives||[]).map((a,ai)=>(
                  <tr key={ai} style={{background:ai%2===0?"transparent":"rgba(0,0,0,0.03)"}}>
                    {TD(ai+1)}{TD(a.name||"—",T.text0)}{TD(a.code||"—",T.text3)}{TD(a.uom||"gal")}
                    {TD((+a.vol||0)+" "+(a.uom||"gal"),T.blue)}
                    {TD(a.conc?(+a.conc).toFixed(0)+" gal/Mgal":"—",T.teal)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>}

        {/* ── 5. Fluid Mixture Properties Used in Calculation ──────── */}
        <div style={BOX}>
          <div style={SEC}>5. Fluid Mixture Properties Used in Calculation</div>
          <p style={{fontSize:11,color:T.text2,marginBottom:10,lineHeight:1.7}}>
            Properties shown are for the fluid mixture as entered in Recipe Design.
            Reaction rates are at surface conditions (temperature correction applied per depth grid in simulator).
            Concentration scaling: rxRate ∝ conc<sup>0.63</sup> (Fredd-Fogler 1998).
          </p>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr>
                {["Stage #","Stage Type","Recipe / Fluid","Density (ppg)","Viscosity (cp)","Rxn Rate Calcite (mol/m²·s)","Rxn Rate Dolomite (mol/m²·s)","Rxn Rate Shale (mol/m²·s)","Conc (fraction)","Volume (BBL)"].map(TH)}
              </tr></thead>
              <tbody>{sched.map((s,i)=>{
                // Look up recipe props: use _recipeProps if available, else lookup from sharedRecipes
                const rec = (recipes||[]).find(r=>r.name===s.fluid);
                const rp  = s._recipeProps || (rec?rec.props:{});
                // If no props stored, lookup from MASTER_FLUIDS_DB directly
                const mf  = MASTER_FLUIDS_DB.find(f=>f.name===s.fluid)||{};
                const dens  = +(rp.density||mf.density||1.0);
                const visc  = +(rp.visc||mf.visc||1.0);
                const rxC   = +(rp.rxCalcite||mf.rxCalcite||0);
                const rxD   = +(rp.rxDolomite||mf.rxDolomite||0);
                const rxS   = +(rp.rxShale||mf.rxShale||0);
                const conc  = +(rp.conc||(mf.conc?+mf.conc/100:0.15));
                const isMain= (s.stage||s.name||"").toLowerCase().includes("main");
                return <tr key={i} style={{background:isMain?"rgba(30,207,178,0.06)":i%2===0?"transparent":"rgba(0,0,0,0.03)"}}>
                  {TD(i+1)}
                  {TD(s.stage||s.name||"—")}
                  <td style={{padding:"4px 8px",borderBottom:`1px solid ${T.border0}`,color:T.teal,fontWeight:isMain?700:400,fontSize:11}}>{s.fluid||"—"}</td>
                  {TD(dens.toFixed(3),T.text1)}
                  {TD(visc.toFixed(3),"#5C6BC0")}
                  {TD(rxC>0?rxC.toFixed(4):"—",rxC>0?T.gold:T.text3)}
                  {TD(rxD>0?rxD.toFixed(4):"—",rxD>0?T.gold:T.text3)}
                  {TD(rxS>0?rxS.toFixed(4):"—",rxS>0?T.gold:T.text3)}
                  {TD(conc>0?(conc*100).toFixed(1)+"%":"—",T.teal)}
                  {TD((+s.vol||0).toFixed(1),T.blue)}
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>

        {/* ── 6. Simulation Settings ───────────────────────────────── */}
        <div style={BOX}>
          <div style={SEC}>6. Simulation Settings</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              {[["Depth Grids",sp.numDepthGrids||100],
                ["Timesteps per Stage",sp.numTimesteps||10],
                ["Total Simulation Nodes",(sp.numDepthGrids||100)],
                ["Depth Range (ft)",topD+"–"+botD],
                ["Net Reservoir Span (ft)",(botD-topD).toFixed(0)],
              ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border0}`,fontSize:11}}>
                <span style={{color:T.text2}}>{k}</span>
                <span style={{fontFamily:T.mono,color:T.text0,fontWeight:700}}>{v}</span>
              </div>)}
            </div>
            <div>
              {[["Wormhole Efficiency Factor","0.04 (Fredd-Fogler 1998)"],
                ["Conc Scaling Exponent","0.63 (Fredd-Fogler 1996)"],
                ["BHP Formula","P_wh + 0.052×ppg×z − dPfric×(z/L)"],
                ["Penetration Formula","rPen = √(r_wb² + V×E_wh×5.615/(π×h×φ)) − r_wb"],
                ["Pressure Solver","Iterative P_wh convergence (mass balance)"],
              ].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border0}`,fontSize:11,gap:8}}>
                <span style={{color:T.text2,flexShrink:0}}>{k}</span>
                <span style={{fontFamily:T.mono,color:T.text0,fontWeight:600,fontSize:10,textAlign:"right"}}>{v}</span>
              </div>)}
            </div>
          </div>
        </div>
      </div>}

      {/* ── OUTPUTS TAB ─────────────────────────────────────── */}
      {tab==="outputs" && <div className="anim">
        {!summary && <div className="wb"><span style={{color:T.gold,fontWeight:700}}>!</span>
          <span style={{fontSize:12}}>No simulation results yet. Run simulation from the left sidebar.</span>
        </div>}

        {summary && <>
          <div style={BOX}>
            <div style={SEC}>Summary Metrics</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              <Met label="Avg Skin Before" value={summary.avgSkinB} color={T.red}/>
              <Met label="Avg Skin After"  value={summary.avgSkinA} color={T.green}/>
              <Met label="Skin Reduction"  value={summary.skinReduction+"%"} color={T.teal}/>
              <Met label="PI Ratio"        value={summary.piRatio+"x"} color={T.blue}/>
              <Met label="PI Before"       value={summary.avgPIB} unit="bbl/d/psi" color={T.red}/>
              <Met label="PI After"        value={summary.avgPIA} unit="bbl/d/psi" color={T.green}/>
              <Met label="Placement"       value={summary.placementPct+"%"} color={T.gold}/>
              <Met label="Intervals Placed" value={summary.placedCount+"/"+summary.totalIntervals} color={T.teal}/>
            </div>
          </div>

          <div style={BOX}>
            <div style={SEC}>Results by Depth Interval</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>
                  {["Top (ft)","Bot (ft)","Skin Before","Skin After","ΔSkin",
                    "Pen (in)","Dmg R (ft)","Bypass %","k Before (md)","k After (md)","k Ratio",
                    "Qres (bbl/min)","V_acid (BBL)","Acid Spent","Wh R (in)",
                    "P_wb (psi)","P_res (psi)","PI Before","PI After","PI Ratio","Placed?"].map(TH)}
                </tr></thead>
                <tbody>{DATA.map((r,i)=>{
                  // V_acid stored in BBL in simulation → convert to Gallons for display
                  const vAcidBBL = r.V_main_acid!=null ? +r.V_main_acid : (+r.V_acid||0);
                  const vAcidGal = (vAcidBBL * 42).toFixed(0);
                  // qres stored in BPM → convert to GPM for display: GPM = BPM × 42
                  const qresGPM  = r.qres != null ? (+r.qres).toFixed(1) : "—";   // bbl/day
                  const dSkin    = (+r.skinB - +r.skinA).toFixed(2);
                  return <tr key={i} style={{background:r.placed?"#EFF9EF":"#fff"}}>
                    {TD(r.depth)}{TD(r.bot)}
                    {TD((+r.skinB).toFixed(2), T.red)}
                    {TD((+r.skinA).toFixed(2), T.green)}
                    {TD((+dSkin>0?"+":"")+dSkin, +dSkin>0?T.teal:T.text2)}
                    {TD((+r.pen).toFixed(1))}
                    {TD((+r.dmgR||1).toFixed(2))}
                    {TD(r.bypass_pct!=null ? r.bypass_pct+"%" : r.pen>0?(Math.min(100,(+r.pen)/((+r.dmgR||1)*12))*100).toFixed(0)+"%" : "0%")}
                    {TD((+r.k_before||+r.perm||0).toFixed(1))}
                    {TD((+r.k_after||+r.k_eff||+r.perm||0).toFixed(1), T.green)}
                    {TD(((+r.k_after||+r.k_eff||1)/(+r.k_before||+r.perm||1)>1.01)?((+r.k_after||+r.k_eff||1)/(+r.k_before||+r.perm||1)).toFixed(2)+"×":"1.0×", T.teal)}
                    {TD(qresGPM, T.blue)}
                    {TD(vAcidGal, T.teal)}
                    {TD(r.acid_spent!=null?(+r.acid_spent*100).toFixed(1)+"%":"—")}
                    {TD(r.wh_radius_in!=null?(+r.wh_radius_in).toFixed(1):r.pen!=null?r.pen:"—")}
                    {TD(r.pres||"—")}{TD(r.pres_res||"—")}
                    {TD((+r.pi_b).toFixed(4))}{TD((+r.pi_a).toFixed(4), T.green)}
                    {TD(+r.pi_b>0?((+r.pi_a/+r.pi_b).toFixed(2)+"×"):"—", T.teal)}
                    <td style={{padding:"4px 8px",borderBottom:`1px solid ${T.border0}`,
                      color:r.placed?T.green:T.red,fontWeight:700,fontSize:11}}>
                      {r.placed?"Yes":"No"}
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
        </>}
      </div>}

      {/* ── SOLVER LOG TAB ──────────────────────────────────── */}
      {tab==="log" && <div className="anim">
        {log.length === 0 && <div style={{color:T.text2,fontSize:12,fontStyle:"italic"}}>
          No solver log available. Run a simulation first.
        </div>}
        {log.length > 0 && <div style={{
          background:T.bg1,color:"#A8D8A8",fontFamily:T.mono,fontSize:10,
          padding:14,lineHeight:1.7,overflowX:"auto",whiteSpace:"pre-wrap",
          border:`1px solid ${T.border0}`,maxHeight:500,overflow:"auto",
        }}>
          {log.join("\n")}
        </div>}
      </div>}
    </div>
  </div>;
}


// ─── TECHNICAL MANUAL PAGE ───────────────────────────────────────────────────
function TechnicalManualPage() {
  const [sec, setSec] = useState("overview");
  const SECTIONS = [
    {id:"overview",    label:"Overview"},
    {id:"grid",        label:"Grid Generation"},
    {id:"pressure",    label:"Pressure Solver"},
    {id:"chemistry",   label:"Chemistry & Skin"},
    {id:"pi",          label:"PI Calculation"},
    {id:"timestep",    label:"Timestep & Flow"},
    {id:"outputs",     label:"Outputs"},
    {id:"equations",   label:"All Equations"},
  ];
  const H2 = ({children}) => <div style={{fontSize:15,fontWeight:700,color:T.teal,
    margin:"20px 0 8px",paddingBottom:6,borderBottom:`2px solid ${T.teal}`}}>{children}</div>;
  const H3 = ({children}) => <div style={{fontSize:13,fontWeight:700,color:T.text0,
    margin:"14px 0 5px"}}>{children}</div>;
  const P = ({children}) => <div style={{fontSize:12,color:T.text1,lineHeight:1.8,
    marginBottom:8}}>{children}</div>;
  const Eq = ({children,label}) => <div style={{
    background:T.bg3,border:`1px solid ${T.border0}`,
    borderLeft:`3px solid ${T.teal}`,padding:"8px 14px",
    fontFamily:T.mono,fontSize:12,color:T.text0,
    margin:"8px 0",display:"flex",justifyContent:"space-between",alignItems:"center"
  }}>
    <span>{children}</span>
    {label&&<span style={{fontSize:10,color:T.text3,marginLeft:16}}>{label}</span>}
  </div>;
  const Bullet = ({children}) => <div style={{
    fontSize:12,color:T.text1,lineHeight:1.7,
    paddingLeft:16,marginBottom:3,display:"flex",gap:8
  }}><span style={{color:T.teal,flexShrink:0}}>›</span><span>{children}</span></div>;

  const content = {
    overview: <>
      <H2>StimOPTI — Matrix Acid Stimulation Simulator</H2>
      <P>StimOPTI models the injection of acid into a carbonate or sandstone reservoir through a wellbore, computing the distribution of acid among reservoir layers, wormhole penetration, skin reduction, and productivity improvement for each layer independently.</P>
      <H3>Simulation Philosophy</H3>
      <Bullet>Each reservoir interval (layer) is treated as a radial flow unit with its own permeability, porosity, skin, and pressure.</Bullet>
      <Bullet>A 1D radial depth-grid of nodes is generated along the wellbore spanning all perforated intervals.</Bullet>
      <Bullet>For each injection stage, the simulator distributes flow among layers based on injectivity, then advances wormhole penetration, acid concentration, and skin for each node using small timesteps.</Bullet>
      <Bullet>After all stages, aggregated per-layer results (skin before/after, penetration, PI) are assembled and displayed.</Bullet>
      <H3>Calculation Order</H3>
      {[
        "1  Input processing → convertUnits() → normalised SI-compatible parameters",
        "2  Depth grid generation → N evenly-spaced nodes across perforation intervals",
        "3  For each schedule stage → pressure solver → per-layer q[i]",
        "4  For each timestep → chemistry solver → Δr_pen[i], ΔS[i], Δk_eff[i]",
        "5  Aggregation (_aggregate) → skinA, PI_a, pen_in per layer (Darcy-derived)",
        "6  Summary statistics → avg skin, PI ratio, placement %",
      ].map((t,i)=><Bullet key={i}>{t}</Bullet>)}
    </>,

    grid: <>
      <H2>Grid Generation</H2>
      <P>The simulator generates a uniform 1D radial depth grid spanning from the shallowest reservoir top to the deepest reservoir bottom.</P>
      <H3>Depth Nodes</H3>
      <Eq label="Grid spacing">Δz = (z_bot − z_top) / N_grids</Eq>
      <Eq label="Node positions">z[i] = z_top + (i + 0.5) × Δz,   i = 0 … N_grids−1</Eq>
      <Bullet>Default N_grids = 20 (user-adjustable in Run Simulation settings)</Bullet>
      <Bullet>Each node is assigned the reservoir interval (layer) it falls within: perm, por, skin, pressure, mineral composition.</Bullet>
      <Bullet>Nodes outside all perforated intervals are flagged hasReservoir=false and do not contribute to chemistry calculations.</Bullet>
      <H3>Radial Wormhole Grid</H3>
      <P>Each depth node tracks a radial wormhole front r_pen[i] starting at the wellbore radius r_w. Wormholes grow radially outward as acid dissolves rock.</P>
      <Eq label="Initial condition">r_pen[i] = r_w = wbR (inches) / 12   [ft]</Eq>
    </>,

    pressure: <>
      <H2>Pressure Solver</H2>
      <P>For each injection stage, the simulator solves for the wellbore bottomhole pressure (BHP) and the resulting flow rate into each layer using the steady-state Darcy radial inflow equation.</P>
      <H3>Injectivity Index</H3>
      <Eq label="Darcy radial">II[i] = 0.00708 × k[i] × h[i] / (μ × B × (ln(r_e/r_w) + S[i]))</Eq>
      <Bullet>k[i] = effective permeability of layer i [md]</Bullet>
      <Bullet>h[i] = net thickness of layer i [ft]</Bullet>
      <Bullet>S[i] = current skin factor of layer i</Bullet>
      <Bullet>μ = fluid viscosity [cP], B = formation volume factor [RB/STB]</Bullet>
      <H3>BHP Calculation</H3>
      <Eq label="BHP Newton-Raphson">BHP = (Q_total + Σ II[i]×P_res[i]) / Σ II[i]</Eq>
      <P>BHP is iterated until ΣQ[i] = Q_total within 0.1% tolerance (up to 20 iterations).</P>
      <H3>Layer Flow Rate</H3>
      <Eq label="Per-layer flow">q[i] = II[i] × (BHP − P_res[i])   [BPM]</Eq>
      <P>Note: Rate input is in GPM; internally converted: BPM = GPM ÷ 42. Volume in Gallons; converted: BBL = Gal ÷ 42.</P>
    </>,

    chemistry: <>
      <H2>Chemistry, Wormhole & Skin</H2>
      <H3>Wormhole Propagation</H3>
      <P>Acid dissolves rock and propagates wormholes radially from the wellbore. The radial penetration is updated each timestep from a volume balance:</P>
      <Eq label="Radial volume balance">r_new² = r_old² + ΔV_eff × 5.6146 / (π × h × φ)</Eq>
      <Eq label="Effective volume">ΔV_eff = Δq × Δt × η_wh × boost_factor</Eq>
      <Bullet>η_wh = wormhole efficiency (0–1), depends on Damköhler number Da</Bullet>
      <Bullet>boost_factor reflects wormhole focusing (higher for optimal injection rate)</Bullet>
      <H3>Damköhler Number</H3>
      <Eq label="Pore-scale Da">Da = k_rxn × d_pore / (D_eff × u_pore)</Eq>
      <Bullet>Da ≪ 1 → reaction-limited (wormholing regime)</Bullet>
      <Bullet>Da ≫ 1 → transport-limited (face dissolution)</Bullet>
      <Bullet>Optimal wormholing at Da ≈ 0.29 (Fredd-Fogler model)</Bullet>
      <H3>Skin — Hawkins Bypass Model</H3>
      <P>Post-treatment skin is back-calculated from the Darcy equation using the simulated layer flow rate and BHP, ensuring full self-consistency:</P>
      <Eq label="Darcy back-calculation">S_after = (0.00708 × k × h × ΔP) / (q_bpd) − ln(r_e/r_w)</Eq>
      <Eq label="ΔP">ΔP = BHP_post − P_res   [psi]</Eq>
      <Eq label="q_bpd">q_bpd = q_layer [BPM] × 1440</Eq>
      <P>For unplaced intervals (no acid received), skin remains at the input value. The displayed skin is always exactly consistent with the displayed flow rate and pressure — users can independently verify using the Darcy equation.</P>
      <H3>Internal Bypass Model (per timestep)</H3>
      <P>Within the chemistry timestep loop, skin is also tracked using the Hawkins bypass model to drive wormhole growth:</P>
      <Eq label="Bypass factor">bypass = tanh(r_pen_net / r_dmg) × η_wh × dissolveRate</Eq>
      <Eq label="Internal skin">S_step = max(S_mech, S_orig × (1 − bypass))</Eq>
      <Bullet>r_pen_net = r_pen − r_w (net penetration beyond wellbore wall)</Bullet>
      <Bullet>r_dmg = damage radius from reservoir input [ft]</Bullet>
      <Bullet>S_mech = max(0.5, S_orig × 0.05) — residual mechanical completion skin</Bullet>
    </>,

    pi: <>
      <H2>Productivity Index</H2>
      <P>PI is computed from the Darcy radial flow equation using the input skin (pre-treatment) and the Darcy-back-calculated skin (post-treatment). This ensures PI and skin are self-consistent.</P>
      <Eq label="Darcy PI formula">PI = k × h / (141.2 × μ × B × (ln(r_e/r_w) + S))</Eq>
      <Eq label="Pre-stimulation">PI_before = k × h / (141.2 × (lnR + S_before))</Eq>
      <Eq label="Post-stimulation">PI_after  = k × h / (141.2 × (lnR + S_after))</Eq>
      <Eq label="PI ratio">PI_ratio = PI_after / PI_before = (lnR + S_before) / (lnR + S_after)</Eq>
      <H3>Average PI</H3>
      <Eq label="Arithmetic average">PI_avg = (1/N) × Σ PI[i]</Eq>
    </>,

    timestep: <>
      <H2>Timestep & Flow Control</H2>
      <H3>Timestep Size</H3>
      <P>Each injection stage is divided into N_ts uniform timesteps. Default N_ts = 10 per stage.</P>
      <Eq label="Per-timestep volume">ΔV_ts = V_stage / N_ts   [BBL per timestep per stage]</Eq>
      <Eq label="Per-node volume">ΔV_node = ΔV_ts × w[i]   [BBL per node]</Eq>
      <P>where w[i] is the normalised injectivity weight for node i: w[i] = II[i] / Σ II[j]</P>
      <H3>Diverter Effect</H3>
      <P>When a diverter stage is encountered, the injectivity of already-treated zones is reduced by the placement efficiency factor, redirecting subsequent acid to less-treated zones.</P>
      <Eq label="Diverted injectivity">II_div[i] = II[i] × (1 − η_div × placedFraction[i])</Eq>
      <H3>Convergence</H3>
      <Bullet>Pressure solver: Newton-Raphson with max 20 iterations, tolerance 0.1%</Bullet>
      <Bullet>Wormhole radius: updated each timestep, relaxation factor α_pen = 0.40</Bullet>
      <Bullet>Each node advances independently — no coupling between nodes</Bullet>
    </>,

    outputs: <>
      <H2>Outputs</H2>
      <H3>Per-Layer Results</H3>
      {[
        ["Skin Before (skinB)", "Input skin value from Reservoir Data table"],
        ["Skin After (skinA)", "Darcy back-calculated from simulated q and BHP"],
        ["ΔSkin", "skinB − skinA (positive = improvement)"],
        ["Pen (in)", "Wormhole penetration beyond wellbore wall [inches]"],
        ["P_wb (psi)", "Wellbore BHP during main acid injection stage"],
        ["P_res (psi)", "Reservoir layer pressure from input"],
        ["Qres (bbl/min)", "Layer flow rate [GPM] = BPM × 42"],
        ["V_acid (BBL)", "Total main-acid volume entering layer [Gallons] = BBL × 42"],
        ["PI Before / After", "Darcy productivity index [bbl/day/psi]"],
        ["Placed?", "Whether main acid reached this layer"],
      ].map(([k,v],i)=><div key={i} style={{display:"flex",gap:12,padding:"5px 0",
        borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
        <span style={{fontFamily:T.mono,color:T.teal,fontWeight:700,minWidth:160,flexShrink:0}}>{k}</span>
        <span style={{color:T.text1}}>{v}</span>
      </div>)}
      <H3>Summary Metrics</H3>
      {[
        ["Avg Skin Reduction", "Arithmetic average over all placed intervals"],
        ["PI Ratio", "avgPI_after / avgPI_before"],
        ["Placement %", "fraction of intervals receiving main acid"],
        ["Total Acid Volume", "Sum of ALL stage volumes [Gallons]"],
      ].map(([k,v],i)=><div key={i} style={{display:"flex",gap:12,padding:"5px 0",
        borderBottom:`1px solid ${T.border0}`,fontSize:12}}>
        <span style={{fontFamily:T.mono,color:T.teal,fontWeight:700,minWidth:160,flexShrink:0}}>{k}</span>
        <span style={{color:T.text1}}>{v}</span>
      </div>)}
    </>,

    equations: <>
      <H2>Complete Equation Reference</H2>
      {[
        ["Darcy radial inflow",   "q = 0.00708 × k × h × ΔP / (141.2 × μ × B × (lnR + S))"],
        ["BHP (multi-layer)",     "BHP = (Q_tot + Σ II[i]×P[i]) / Σ II[i]"],
        ["Injectivity index",     "II[i] = 0.00708 × k[i] × h[i] / (μ × B × (lnR + S[i]))"],
        ["Wormhole radius",       "r² = r_old² + ΔV_eff × 5.6146 / (π × h × φ)"],
        ["Damköhler number",      "Da = k_rxn × d_pore / (D_eff × u_pore)"],
        ["Wormhole efficiency",   "η_wh = 1/(1 + (Da/Da_opt)^0.5)  (approximate)"],
        ["Hawkins bypass",        "bypass = tanh(r_net/r_dmg) × η_wh × dR"],
        ["Internal skin",         "S_step = max(S_mech, S_orig × (1 - bypass))"],
        ["Darcy skin back-calc",  "S_after = 0.00708×k×h×ΔP / (q×1440) − ln(r_e/r_w)"],
        ["PI (Darcy)",            "PI = k × h / (141.2 × (lnR + S))"],
        ["PI ratio",              "R_PI = (lnR + S_before) / (lnR + S_after)"],
        ["Acid volume (Gal→BBL)", "V_BBL = V_Gal / 42"],
        ["Rate (GPM→BPM)",        "Q_BPM = Q_GPM / 42"],
        ["Analytical penetration","r_pen = sqrt(V_acid × 5.6146 / (π × h × φ)) [ft]"],
        ["Net pay thickness",     "h = z_bot − z_top [ft]"],
        ["ln(re/rw)",             "lnR = ln(r_e / r_w)  [dimensionless]"],
      ].map(([name,eq],i)=><div key={i} style={{marginBottom:6}}>
        <div style={{fontSize:10,color:T.text3,fontWeight:700,textTransform:"uppercase",
          letterSpacing:"0.4px",marginBottom:2}}>{name}</div>
        <Eq>{eq}</Eq>
      </div>)}
    </>,
  };

  return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
    <Topbar title="Technical Manual" sub="StimOPTI v5 — Engineering equations, algorithms and output definitions"/>
    <div style={{flex:1,overflow:"hidden",display:"flex"}}>
      {/* Section selector */}
      <div style={{width:160,flexShrink:0,background:T.bg3,borderRight:`1px solid ${T.border0}`,
        overflowY:"auto",padding:"8px 0"}}>
        {SECTIONS.map(s=>(
          <div key={s.id} onClick={()=>setSec(s.id)} style={{
            padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:sec===s.id?700:400,
            color:sec===s.id?T.teal:T.text1,
            background:sec===s.id?"rgba(0,120,168,0.10)":"transparent",
            borderLeft:`3px solid ${sec===s.id?T.teal:"transparent"}`,
          }}>{s.label}</div>
        ))}
      </div>
      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"20px 28px"}}>
        {content[sec] || <P>Section not found.</P>}
      </div>
    </div>
  </div>;
}


// ─── PLACEHOLDER PAGE ─────────────────────────────────────────────────────────
function PlaceholderPage({ title, desc }) {
  return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
    flexDirection:"column",gap:12,padding:40,color:T.text2}}>
    <div style={{fontSize:16,fontWeight:700,color:T.text1}}>{title}</div>
    {desc && <div style={{fontSize:12,color:T.text2,maxWidth:400,textAlign:"center"}}>{desc}</div>}
  </div>;
}

// ── SimSummaryModal — defined OUTSIDE App to prevent remount on every render ──
function SimSummaryModal({ summary, onClose, onGoResults, onGoReservoir, onGoWell }) {
  const s = summary || {};
  const _skB = parseFloat(s.avgSkinB);
  const _skA = parseFloat(s.avgSkinA);
  const skinImprove = (!isNaN(_skB) && !isNaN(_skA) && _skB !== 0)
    ? (((_skB - _skA) / Math.max(0.01, Math.abs(_skB))) * 100).toFixed(1) + "%"
    : "—";
  const METRICS = [
    { label:"Avg Skin Before",      value: s.avgSkinB,      color: T.red,    unit:"" },
    { label:"Avg Skin After",        value: s.avgSkinA,      color: T.green,  unit:"" },
    { label:"Skin Reduction",        value: skinImprove,     color: T.teal,   unit:"" },
    { label:"PI Before",             value: s.avgPI_B,       color: T.text2,  unit:"bbl/d/psi" },
    { label:"PI After",              value: s.avgPI_A,       color: T.blue,   unit:"bbl/d/psi" },
    { label:"PI Improvement",        value: s.piImprove,     color: T.teal,   unit:"" },
    { label:"Avg Penetration",       value: s.avgPen,        color: "#7986CB",unit:"in" },
    { label:"Layers Placed",         value: s.placed != null ? `${s.placed} / ${s.totalLayers}` : "—", color: T.gold, unit:"" },
    { label:"Total Acid Placed",     value: s.totalAcidBBL,  color: T.teal,   unit:"bbl" },
    { label:"Depth Grids Solved",    value: s.nDepthGrids,   color: T.text2,  unit:"" },
  ];
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.80)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={onClose}>
    <div style={{background:T.bg2,border:`1px solid ${T.teal}`,borderRadius:4,maxWidth:620,
        width:"100%",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",
        boxShadow:"0 24px 60px rgba(0,0,0,0.7)"}} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border0}`,background:T.bg3,
          display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(30,207,178,0.15)",
            border:`2px solid ${T.teal}`,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,flexShrink:0}}>✓</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:T.text0}}>Simulation Complete</div>
          <div style={{fontSize:12,color:T.text2,marginTop:2}}>
            {s.nDepthGrids} depth grids · {s.totalLayers} reservoir layers
            {s.hasWarn ? <span style={{color:T.gold,marginLeft:10}}>⚠ Convergence warnings</span> : <span style={{color:T.green,marginLeft:10}}>✓ Converged</span>}
          </div>
          <div style={{marginTop:4,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:T.text3}}>Solution Quality:</span>
            <span style={{fontSize:12,fontWeight:700,color:
              s.sqi>=90?T.green:s.sqi>=75?T.teal:s.sqi>=50?T.gold:T.red}}>
              {s.sqi ?? 100}/100 — {s.sqiLabel ?? "Excellent"}
            </span>
            {s.permContrast && +s.permContrast > 20 && <span style={{fontSize:10,color:T.gold}}>
              ⚡ k-contrast: {s.permContrast}×
            </span>}
          </div>
        </div>
        <div onClick={onClose} style={{cursor:"pointer",color:T.text2,fontSize:22,padding:"0 6px",userSelect:"none",lineHeight:1}}>×</div>
      </div>
      {/* Metrics grid */}
      <div style={{overflow:"auto",padding:18,flex:1}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {METRICS.map(({label,value,color,unit},i)=>(
            <div key={i} style={{background:T.bg3,border:`1px solid ${T.border0}`,borderRadius:6,
                padding:"12px 14px",borderTop:`2px solid ${color}`}}>
              <div style={{fontSize:9,color:T.text3,textTransform:"uppercase",
                  letterSpacing:"0.7px",marginBottom:4,fontWeight:600}}>{label}</div>
              <div style={{fontSize:17,fontWeight:700,color,fontFamily:T.mono,lineHeight:1}}>
                {value}<span style={{fontSize:10,color:T.text3,fontWeight:400,marginLeft:3}}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
        {s.hasWarn && <div style={{background:"rgba(232,160,32,0.06)",border:`1px solid ${T.gold}`,
            borderRadius:6,padding:"10px 14px",marginBottom:12,fontSize:12,color:T.text1}}>
          <div style={{fontWeight:700,marginBottom:6,color:T.gold}}>
            ⚠ {s.warns.length} Stage{s.warns.length>1?"s":""} with Convergence Issues
          </div>
          {(s.warns||[]).map((w,wi)=>(
            <div key={wi} style={{marginBottom:8,paddingBottom:8,
              borderBottom:wi<s.warns.length-1?`1px solid rgba(232,160,32,0.2)`:"none"}}>
              <div style={{fontWeight:600,fontSize:11}}>
                Stage {w.stage}: {w.stageName} ({w.fluid})
              </div>
              <div style={{color:T.text2,fontSize:10,marginTop:2}}>
                📍 <b>Root Cause:</b> {w.rootCause || "Pressure solver did not converge"}
              </div>
              {w.affectedLayers?.length > 0 && <div style={{color:T.text3,fontSize:10,marginTop:1}}>
                Affected depths: {w.affectedLayers.join(", ")}
              </div>}
              {w.recommendations?.length > 0 && <div style={{color:T.teal,fontSize:10,marginTop:2}}>
                ✅ Recommendations: {w.recommendations.join(" · ")}
              </div>}
              {w.residual && <div style={{color:T.text3,fontSize:9,marginTop:1}}>
                Residual: {w.residual} bpm · Iterations: {w.iters}
                {w.permContrast && +w.permContrast > 1 ? ` · k-contrast: ${w.permContrast}×` : ""}
              </div>}
            </div>
          ))}
        </div>}
        {s.physicsViolations?.length > 0 && <div style={{background:"rgba(239,83,80,0.06)",
            border:`1px solid ${T.red}`,borderRadius:6,padding:"10px 14px",marginBottom:12,
            fontSize:12,color:T.text1}}>
          <div style={{fontWeight:700,marginBottom:4,color:T.red}}>
            🔬 {s.physicsViolations.length} Physics Violation{s.physicsViolations.length>1?"s":""} Corrected
          </div>
          {s.physicsViolations.slice(0,5).map((v,vi)=>(
            <div key={vi} style={{fontSize:10,color:T.text2,marginBottom:2}}>
              [{v.type}] Depth {v.depth}ft: {v.msg}
            </div>
          ))}
          <div style={{fontSize:9,color:T.text3,marginTop:4}}>
            Values were automatically corrected to physical limits. Accuracy may be reduced.
          </div>
        </div>}
        <div style={{background:"rgba(30,207,178,0.06)",border:`1px solid rgba(30,207,178,0.25)`,
            borderRadius:6,padding:"10px 14px",fontSize:12,color:T.text2}}>
          ℹ All depth-grid results are now available on the Results page. Navigate using the tabs to explore Skin, Penetration Fronts, Placement, and PI plots.
        </div>
      </div>
      {/* Footer */}
      <div style={{padding:"12px 18px",borderTop:`1px solid ${T.border0}`,
          display:"flex",gap:10,flexShrink:0,background:T.bg3}}>
        <div onClick={onGoResults} style={{flex:2,background:T.teal,border:`1px solid ${T.teal}`,
            borderRadius:6,padding:"10px 0",textAlign:"center",cursor:"pointer",
            fontSize:13,fontWeight:700,color:"#000",userSelect:"none"}}>
          View Results →
        </div>
        {s.hasWarn && <><div onClick={onGoReservoir} style={{flex:1,background:"transparent",
            border:`1px solid ${T.gold}`,borderRadius:6,padding:"10px 0",textAlign:"center",
            cursor:"pointer",fontSize:12,fontWeight:600,color:T.gold,userSelect:"none"}}>
          Reservoir Data
        </div>
        <div onClick={onGoWell} style={{flex:1,background:"transparent",
            border:`1px solid ${T.blue}`,borderRadius:6,padding:"10px 0",textAlign:"center",
            cursor:"pointer",fontSize:12,fontWeight:600,color:T.blue,userSelect:"none"}}>
          Well Config
        </div></>}
        <div onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border1}`,
            borderRadius:6,padding:"10px 14px",cursor:"pointer",fontSize:12,
            color:T.text2,userSelect:"none"}}>
          Close
        </div>
      </div>
    </div>
  </div>;
}


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
  const [simSummary, setSimSummary] = useState(null); // summary popup after each run

  // ── Shared input state — lifted for validation + calculation ─────────────
  const [sharedResRows, setSharedResRowsRaw] = useState(INIT_RESERVOIR.map(r => ({ ...r })));
  const [sharedWell, setSharedWellRaw] = useState({
    type:"Producer", profile:"Vertical", wbR:"3", drainR:"1000",
    resTop:"8200", fricGrad:"18", khkv:"1", inc:"0",
    compType:"Open Hole", tubLen:"10837.0", tubID:"2.55",
    perfPenLen:"0.5", perfDia:"0.4", spf:"1", casID_ch:"4", perfStart:"", perfEnd:"",
    slotType:"Open", slotWidth:"0.01", linerID:"4", slotLength:"1",
    slotPerUnit:"2.0", slotAroundCirc:"4", turbulenceFactor:"1260", openAreaSingle:"1",
    le_perfPenLen:"0.5", le_nozzleDia:"0.4", le_spf:"1", le_nozzleEntry:"0.0", le_casID:"4",
    ss_type:"Closed", ss_perfPenLen:"0.5", ss_nozzleDia:"0.4", ss_spf:"1", ss_casID:"4",
    hzLen:"1000", hzH:"500",
  });
  const [sharedSched, setSharedSchedRaw] = useState(INIT_SCHEDULE.map(r => ({ ...r })));
  const [sharedRecipes,  setSharedRecipes]  = useState([]);
  const [sharedFluids, setSharedFluidsRaw] = useState(INIT_FLUIDS.map(f => ({ ...f })));
  // ── New input modules (stateful, pass to pages) ──────────────────────────
  const [pumpingData,  setPumpingData]  = useState({...DEFAULTS.pumpingData});
  const [mainFluid,    setMainFluid]    = useState({...DEFAULTS.mainFluid});
  const [damageType,   setDamageType]   = useState({...DEFAULTS.damageType});
  const [rockProps,    setRockProps]    = useState({...DEFAULTS.rockProps});
  const [diverterFluid,setDiverterFluid]= useState({...DEFAULTS.diverterFluid});
  const [coreflood,    setCoreflood]    = useState({...DEFAULTS.coreflood});
  const [resvFluid,    setResvFluid]    = useState({...DEFAULTS.resvFluid});
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

  function runSim() { setConvWarn(null); setSimSummary(null); setSimRunning(true); }

  // Ref captures latest shared state — simDone reads from here to avoid stale closure
  const simInputRef = React.useRef({});
  React.useEffect(() => {
    simInputRef.current = {
      sharedResRows, sharedWell, sharedSched, sharedFluids,
      sharedAcid, simParams, rockProps, pumpingData, sharedRecipes,
    };
  });

  function simDone(results) {
    // null = user cancelled — close window, discard results
    if (results === null) { setSimRunning(false); return; }
    // Fallback: re-run if called without results (shouldn't happen in normal flow)
    if (!results) {
      const cur = simInputRef.current;
      try {
        const wellWithTemp = { ...(cur.sharedWell||{}),
          T_surface: parseFloat((cur.rockProps||{}).surfaceTemp || (cur.sharedWell||{}).T_surface || 59),
          T_grad:    parseFloat((cur.rockProps||{}).geoGradient || (cur.sharedWell||{}).T_grad    || 1.5),
          msp:       parseFloat((cur.pumpingData||{}).msp || 2000),
        };
        results = ENG.runSimulation(cur.sharedResRows||[], wellWithTemp,
          cur.sharedSched||[], cur.sharedFluids||[], cur.sharedAcid||[],
          cur.simParams||{numTimesteps:10,numDepthGrids:100});
      } catch(e) { console.error("[simDone fallback]", e.message); }
    }
    // Persist to DB (non-state, safe to call any time)
    if (activeProject) {
      DB.saveResults(activeProject.id, results);
      DB.saveSection(activeProject.id, "reservoir", sharedResRows);
      DB.saveSection(activeProject.id, "well",      sharedWell);
      DB.saveSection(activeProject.id, "schedule",  sharedSched);
      DB.saveSection(activeProject.id, "fluids",    sharedFluids);
    }
    // ── Compute summary data first (before any state mutations) ────────────
    let summaryPayload = null;
    if (results) {
      const dr = results.depthResults || [];
      const avgSkinB = dr.length ? (dr.reduce((s,r)=>s+(+r.skinB||0),0)/dr.length).toFixed(2) : "—";
      const avgSkinA = dr.length ? (dr.reduce((s,r)=>s+(+r.skinA||0),0)/dr.length).toFixed(2) : "—";
      const avgPI_B  = dr.length ? (dr.reduce((s,r)=>s+(+r.pi_b||0),0)/dr.length).toFixed(3) : "—";
      const avgPI_A  = dr.length ? (dr.reduce((s,r)=>s+(+r.pi_a||0),0)/dr.length).toFixed(3) : "—";
      const placed   = dr.filter(r=>r.placed).length;
      const totalAcidBBL = dr.reduce((s,r)=>s+(+r.V_main_acid||0),0).toFixed(1);
      const avgPenRows = dr.filter(r=>+r.pen>0);
      const avgPen = avgPenRows.length
        ? (avgPenRows.reduce((s,r)=>s+(+r.pen||0),0)/avgPenRows.length).toFixed(1) : "—";
      const piImprove = (avgPI_B !== "—" && +avgPI_B > 0)
        ? ((+avgPI_A / +avgPI_B).toFixed(2) + "×") : "—";
      summaryPayload = {
        avgSkinB:  avgSkinB  ?? "—",
        avgSkinA:  avgSkinA  ?? "—",
        avgPI_B:   avgPI_B   ?? "—",
        avgPI_A:   avgPI_A   ?? "—",
        piImprove: piImprove ?? "—",
        placed, totalLayers: dr.length, totalAcidBBL: totalAcidBBL ?? "0.0",
        avgPen: avgPen ?? "—",
        hasWarn: !!(results?.summary?.pressureWarnings?.length),
        warns: results?.summary?.pressureWarnings || [],
        nDepthGrids: dr.length,
        sqi:    results?.summary?.sqi     ?? 100,
        sqiLabel: results?.summary?.sqiLabel ?? "Excellent",
        physicsViolations: results?.summary?.physicsViolations || [],
        massBalErr:   results?.summary?.convStats?.massBalanceErr ?? "0.00",
        permContrast: results?.summary?.convStats?.permContrast  ?? "—",
      };
    }

    // ── Set ALL state in one synchronous block so React batches into one render ─
    // Order: project update → results → summary → page → running=false
    // setSimRunning(false) LAST so RunPage is unmounted only after everything else is set.
    setProjects(ps => ps.map(p => p.id === activeProject?.id
      ? { ...p, hasRun: true, updatedAt: new Date().toISOString(), version: (p.version||1)+1 }
      : p
    ));
    if (results) setSimResults(results);
    if (summaryPayload) setSimSummary(summaryPayload);
    setPage("results");
    setSimRunning(false);  // unmounts RunPage — MUST be last
  }

  if (!loggedIn) return <><style>{CSS}</style><Login onLogin={() => setLoggedIn(true)} /></>;

  // ── Pressure convergence warning modal ────────────────────────────────────
  function ConvWarnModal({ warns, onClose }) {
    const ADVICE = [
      { icon:"[P]", title:"Check Reservoir Pressure",
        detail:"Ensure every interval in the Reservoir Data table has a valid Reservoir Pressure value (psi). Empty or zero values make the pressure differential ΔP = 0 so no fluid can enter any layer." },
      { icon:"[Q]", title:"Reduce Injection Rate",
        detail:"The required bottomhole pressure to inject at the specified rate may be approaching or exceeding the fracture gradient. Try reducing the pump rate by 10–20% per stage." },
      { icon:"[K]", title:"Review Permeability Values",
        detail:"Very low permeability (< 0.1 md) produces near-zero injectivity II[i]. Check that reservoir permeability values are realistic for the lithology — shale intervals typically should not be targeted." },
      { icon:"[S]", title:"Check Skin Values",
        detail:"Extremely high skin (> 50) can suppress injectivity to near-zero. Verify skin inputs are correct, or consider that the treatment is needed precisely because skin is high." },
      { icon:"⬆️", title:"Increase Drainage Radius or Wellbore Radius",
        detail:"If ln(re/rw) + skin ≤ 0, the Darcy injectivity equation is undefined. Ensure drainage radius (re) >> wellbore radius (rw) and skin is not so negative that ln(re/rw)+S ≤ 0." },
      { icon:"[u]", title:"Check Fluid Viscosity",
        detail:"Verify that the selected fluid has a valid viscosity (> 0 cP). Zero viscosity in the fluid library will make injectivity II[i] = infinity and destabilize the solver." },
      { icon:"[D]", title:"Review Tubing Geometry",
        detail:"Tubing ID and length affect friction pressure. Very long tubing (> 15,000 ft) or very narrow ID (< 2 in) produces high friction that may make surface pressure exceed equipment limits." },
      { icon:"[G]", title:"Verify Fracture Gradient Input",
        detail:"A fracture gradient that is too low (< 0.5 psi/ft) constrains the allowable bottomhole pressure severely. Check fracGrad in the Well Configuration page." },
    ];
    return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.bg2,border:`1px solid ${T.gold}`,borderRadius:0,maxWidth:640,width:"100%",maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}} onClick={e=>e.stopPropagation()}>
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
    dashboard:    <Dashboard projects={projects} setProjects={setProjects} onOpen={openProject} />,
    inputs:       <InputHubPage setPage={setPage} />,
    reservoir:    <ReservoirPage project={proj} setPage={setPage} rows={sharedResRows} setRows={setSharedResRows} />,
    well:         <WellPage project={proj} setPage={setPage} wellData={sharedWell} setWellData={setSharedWell} />,
    pumping_data: <PumpingDataPage   project={proj} setPage={setPage} pumpData={pumpingData}   setPumpData={setPumpingData} />,
    injection_fluid: <MainFluidPage     project={proj} setPage={setPage} mainFluid={mainFluid}     setMainFluid={setMainFluid} sharedFluids={sharedFluids} />,
    recipe_design: <RecipeDesignPage  setPage={setPage} sharedRecipes={sharedRecipes} setSharedRecipes={setSharedRecipes} sharedFluids={sharedFluids} isRequired={true} setSharedSched={setSharedSched}/>,
    main_fluid:   <MainFluidPage     project={proj} setPage={setPage} mainFluid={mainFluid}     setMainFluid={setMainFluid} sharedFluids={sharedFluids} />,
    damage_type:  <DamageTypePage    project={proj} setPage={setPage} damageType={damageType}   setDamageType={setDamageType} />,
    rock_props:   <RockPropsPage     project={proj} setPage={setPage} rockProps={rockProps}     setRockProps={setRockProps} resRows={sharedResRows} />,
    fluids:       <FluidsPage        setPage={setPage} sharedFluids={sharedFluids} setSharedFluids={setSharedFluids} />,
    diverter:     <DiverterFluidPage project={proj} setPage={setPage} diverterFluid={diverterFluid} setDiverterFluid={setDiverterFluid} />,
    coreflood:    <CorefloodPage     project={proj} setPage={setPage} coreflood={coreflood}     setCoreflood={setCoreflood} />,
    resv_fluid:   <ResvFluidPage     project={proj} setPage={setPage} resvFluid={resvFluid}     setResvFluid={setResvFluid} />,
    schedule:     <SchedulePage project={proj} setPage={setPage} sharedSched={sharedSched} setSharedSched={setSharedSched} sharedRecipes={sharedRecipes}/>,
    sim:          <SimSetupPage onRun={runSim} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} simParams={simParams} onSetSimParams={setSimParamsAndSave} />,
    results:      <ResultsPage project={proj} simResults={simResults} resRows={sharedResRows} />,
    sensitivity:  <SensPage project={proj} simResults={simResults} resRows={sharedResRows} wellData={sharedWell} sharedFluids={sharedFluids} sharedSched={sharedSched} />,
    reports:      <ReportsPage project={proj} simResults={simResults} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} />,
    manual:       <TechnicalManualPage />,
    debut_report: <DebutReportPage project={proj} simResults={simResults} resRows={sharedResRows} wellData={sharedWell} schedRows={sharedSched} fluids={sharedFluids} recipes={sharedRecipes} acid={sharedAcid} simParams={simParams} />,
  };

  return <div style={{ display: "flex", height: "100vh", fontFamily: T.sans, background: T.bg0, color: T.text0, overflow: "hidden", fontSize: 12 }}>
    <style>{CSS}</style>
    <Sidebar page={page} setPage={p => { if (p === "create") return; setPage(p); }} onLogout={() => setLoggedIn(false)} proj={proj?.name} />
    <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {simRunning ? <RunPage onDone={simDone} simParams={simParams} schedRows={sharedSched} resRows={sharedResRows} runSimulation={ENG.runSimulation} simInputRef={simInputRef} /> :
        /* Modal input pages render as overlays over the InputHub background */
        (["reservoir","well","pumping_data","recipe_design","damage_type","rock_props","resv_fluid","coreflood","schedule","fluids"].includes(page) ?
          <>{pages.inputs}{pages[page]}</> :
          (pages[page] || pages.dashboard)
        )
      }
    </div>
    {/* SimSummaryModal at root level — outside overflow:hidden container so position:fixed works */}
    {simSummary && <SimSummaryModal summary={simSummary}
      onClose={()=>setSimSummary(null)}
      onGoResults={()=>setSimSummary(null)}
      onGoReservoir={()=>{setSimSummary(null);setPage("reservoir");}}
      onGoWell={()=>{setSimSummary(null);setPage("well");}}
    />}
  </div>;
}// ─── FLUIDS LIBRARY — Master Database ────────────────────────────────────────

