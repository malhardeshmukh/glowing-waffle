import { useState, useEffect, useRef } from "react";

// ─── Color Palette ───────────────────────────────────────
const C = {
  vhigh: "#00f5d4", high: "#3a86ff", medium: "#ffb703", low: "#ff6b6b",
  bg: "#070d1a", card: "#0e1829", card2: "#0b1523", border: "#1a2d4a",
  text: "#e0eaff", muted: "#5a7a9a", accent: "#c77dff", accent2: "#f72585",
  green: "#06d6a0", orange: "#fb8500", pink: "#ff99c8",
};

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "accuracy",      label: "Accuracy" },
  { id: "coverage",      label: "Coverage" },
  { id: "disorder",      label: "Disorder" },
  { id: "method",        label: "Method" },
  { id: "seqlen",        label: "Seq Length" },
  { id: "limitations",   label: "Limitations" },
  { id: "proteins",      label: "Case Studies" },
];

// ─── Data ────────────────────────────────────────────────
const bandData = [
  { label: "pLDDT 90–100", short: "Very High", pct: 35.7, color: C.vhigh,
    desc: "χ1 rotamers ~80% correct. Suitable for molecular replacement, drug pocket detection, and crystallographic phasing.",
    use: "Drug discovery, structural biology" },
  { label: "pLDDT 70–90", short: "High", pct: 22.3, color: C.high,
    desc: "Generally correct backbone. Good for homology-based function annotation, binding site mapping.",
    use: "Function annotation, homology" },
  { label: "pLDDT 50–70", short: "Low", pct: 18.2, color: C.medium,
    desc: "Use with caution. May indicate flexible loops, linkers, or marginally structured regions.",
    use: "Treat as approximate only" },
  { label: "pLDDT 0–50", short: "Very Low", pct: 23.8, color: C.low,
    desc: "Ribbon-like appearance in PyMOL. Not a structure prediction — encodes predicted disorder, not 3D coordinates.",
    use: "Interpret as disorder signal" },
];

const tmScoreData = [
  { bin: "0.1–0.2", pct: 2 }, { bin: "0.2–0.3", pct: 3 }, { bin: "0.3–0.4", pct: 5 },
  { bin: "0.4–0.5", pct: 8 }, { bin: "0.5–0.6", pct: 12 }, { bin: "0.6–0.7", pct: 10 },
  { bin: "0.7–0.8", pct: 20 }, { bin: "0.8–0.9", pct: 28 }, { bin: "0.9+", pct: 12 },
];

const cameoBins = [
  { range: "30–40%", af: 91, best: 80 }, { range: "40–50%", af: 93, best: 83 },
  { range: "50–60%", af: 91, best: 85 }, { range: "60–70%", af: 94, best: 88 },
  { range: "70–80%", af: 95, best: 90 }, { range: "80–90%", af: 96, best: 93 },
];

const goTerms = [
  { term: "Catalytic activity",   confident: 0.64, templated: 0.38 },
  { term: "Protein binding",      confident: 0.60, templated: 0.35 },
  { term: "Metal ion binding",    confident: 0.57, templated: 0.33 },
  { term: "Nucleic acid binding", confident: 0.48, templated: 0.28 },
  { term: "Vesicle",              confident: 0.54, templated: 0.30 },
  { term: "Organelle membrane",   confident: 0.55, templated: 0.22 },
  { term: "Integral membrane",    confident: 0.50, templated: 0.18 },
  { term: "Plasma membrane",      confident: 0.52, templated: 0.20 },
  { term: "Protein complex",      confident: 0.58, templated: 0.29 },
  { term: "Cytosol",              confident: 0.63, templated: 0.36 },
  { term: "Nucleoplasm",          confident: 0.58, templated: 0.30 },
  { term: "Nucleus",              confident: 0.60, templated: 0.31 },
];

const disorderData = [
  { predictor: "AlphaFold — Exp. Resolved Head", auc: 0.921, color: C.vhigh, note: "Explicitly trained to predict crystallographic resolution" },
  { predictor: "AlphaFold — pLDDT (off-label)",  auc: 0.897, color: C.high, note: "Designed as confidence metric, not disorder predictor" },
  { predictor: "SPOT-Disorder2 (SOTA 2021)",      auc: 0.880, color: C.medium, note: "Best dedicated disorder predictor at time of publication" },
  { predictor: "MobiDB-lite",                     auc: 0.840, color: C.muted, note: "Consensus-based lightweight predictor" },
];

const pLDDTvsLDDT = [
  { plddt: 20, mean: 22, q1: 14, q3: 32 }, { plddt: 30, mean: 30, q1: 18, q3: 43 },
  { plddt: 40, mean: 40, q1: 26, q3: 55 }, { plddt: 50, mean: 50, q1: 36, q3: 65 },
  { plddt: 60, mean: 60, q1: 46, q3: 74 }, { plddt: 70, mean: 70, q1: 57, q3: 82 },
  { plddt: 80, mean: 80, q1: 71, q3: 88 }, { plddt: 90, mean: 90, q1: 84, q3: 95 },
  { plddt: 95, mean: 95, q1: 91, q3: 98 },
];

const rotamerData = [
  { plddt: 20, pct: 55 }, { plddt: 30, pct: 57 }, { plddt: 40, pct: 59 },
  { plddt: 50, pct: 62 }, { plddt: 60, pct: 65 }, { plddt: 70, pct: 70 },
  { plddt: 75, pct: 74 }, { plddt: 80, pct: 77 }, { plddt: 85, pct: 80 },
  { plddt: 90, pct: 84 }, { plddt: 95, pct: 90 }, { plddt: 100, pct: 97 },
];

// Sequence length bins — confidence vs length
const seqLenBins = [
  { len: "1–100",     vhigh: 42, high: 26, med: 14, low: 18, n: 1820 },
  { len: "100–200",   vhigh: 39, high: 24, med: 17, low: 20, n: 3940 },
  { len: "200–400",   vhigh: 37, high: 22, med: 18, low: 23, n: 5210 },
  { len: "400–700",   vhigh: 35, high: 21, med: 19, low: 25, n: 4780 },
  { len: "700–1000",  vhigh: 33, high: 20, med: 20, low: 27, n: 2240 },
  { len: "1000–1500", vhigh: 30, high: 19, med: 21, low: 30, n: 1400 },
  { len: "1500–2700", vhigh: 27, high: 18, med: 21, low: 34, n: 906 },
];

// Heterotypic contacts vs accuracy
const heterotypicData = [
  { bin: "0–10%",  lddt: 88 }, { bin: "10–20%", lddt: 80 },
  { bin: "20–30%", lddt: 68 }, { bin: "30–40%", lddt: 55 },
  { bin: "40–50%", lddt: 44 }, { bin: "50–60%", lddt: 37 },
  { bin: "60–70%", lddt: 32 }, { bin: ">70%",   lddt: 28 },
];

// Method overview steps
const methodSteps = [
  {
    phase: "Input", icon: "①", color: C.accent,
    title: "Multiple Sequence Alignment (MSA)",
    detail: "Queries 3 databases in parallel: UniRef90 (jackhmmer), BFD-reduced (jackhmmer), MGnify (jackhmmer). Captures evolutionary covariation — residue pairs that co-evolve to stay in contact.",
    insight: "MSA depth is the single strongest predictor of AlphaFold accuracy. Orphan proteins with no homologues produce unreliable predictions.",
  },
  {
    phase: "Input", icon: "②", color: C.accent,
    title: "Template Search",
    detail: "Searches PDB70 via hmmsearch + HHSearch. Templates provide structural priors; up to 4 templates used with attention-based weighting. Templates not required — AlphaFold can predict without them.",
    insight: "Templates help most at low MSA depth. With deep MSA, they contribute marginally. AlphaFold can beat best template even with a template available.",
  },
  {
    phase: "Core", icon: "③", color: C.vhigh,
    title: "Evoformer (48 blocks)",
    detail: "The heart of AlphaFold2. Jointly reasons over the MSA (N_seq × N_res) and pair representation (N_res × N_res) with axial attention. Pair features encode inter-residue distance/orientation beliefs.",
    insight: "Row attention over MSA = each sequence position attends to all others in that row. Column attention = each position in alignment column attends to others. This lets the model distinguish covariation from phylogenetic background.",
  },
  {
    phase: "Core", icon: "④", color: C.vhigh,
    title: "Structure Module (8 blocks)",
    detail: "Operates on single-residue frames (SE(3) equivariant). Each residue is a rigid body; the module predicts rotations and translations relative to each frame via Invariant Point Attention (IPA).",
    insight: "All torsion angles (backbone φ, ψ, ω; side-chain χ₁–χ₄) predicted simultaneously. Avoids sequential errors that plague fragment-assembly methods. Final structure is differentiable end-to-end.",
  },
  {
    phase: "Output", icon: "⑤", color: C.high,
    title: "5 Models × Constrained Relaxation",
    detail: "5 model checkpoints run per protein. Each relaxed with OpenMM/Amber99sb-ILDN force field to remove clashes. Best model selected by mean pLDDT over all residues.",
    insight: "Relaxation does not significantly change global accuracy (lDDT unchanged) but removes stereochemical violations that would cause downstream software issues.",
  },
  {
    phase: "Output", icon: "⑥", color: C.high,
    title: "Confidence Outputs",
    detail: "pLDDT: per-residue confidence (0–100). pTM: whole-chain global fold confidence (weighted by expected resolution). Experimentally Resolved Head: per-residue probability of appearing in crystal structure.",
    insight: "Three complementary views: local accuracy (pLDDT), global packing (pTM), biological interpretability (resolved head). Use all three before drawing conclusions.",
  },
];

// Limitations / failure modes
const limitationData = [
  {
    title: "Complexes / Interfaces",
    severity: "high", color: C.low,
    desc: "AlphaFold predicts single chains in isolation. Chains with >25% heterotypic contacts (cross-chain interactions) show median lDDT ~52 vs ~85 for globular chains.",
    workaround: "AlphaFold-Multimer (2021) addresses this; for monomers, flag high-heterotypic predictions manually.",
    example: "PDB 7KPX chain C: globular domain correct, extended interface loop completely wrong.",
  },
  {
    title: "Very Long Chains (>2,700 aa)",
    severity: "high", color: C.low,
    desc: "Excluded from this proteome run. Not a fundamental method limit — GPU memory and runtime at proteome scale made this impractical.",
    workaround: "Cropping into domains with uncertainty-guided splitting; or run later with more memory.",
    example: "318 human proteins excluded: titin (34,350 aa), connectin, mucins.",
  },
  {
    title: "Orphan / Dark Proteins",
    severity: "high", color: C.low,
    desc: "Proteins with few homologues produce shallow MSAs. Evoformer gets little covariation signal — accuracy degrades sharply.",
    workaround: "Use metagenomic databases (MGnify) for more signal. Consider experimental validation.",
    example: "Human ORFan genes — ~20% of human proteome has no detectable homolog in at least one database.",
  },
  {
    title: "Conformational Flexibility",
    severity: "medium", color: C.medium,
    desc: "One structure predicted, one conformation output. Proteins with large-scale domain motions (e.g. kinase DFG-in/out) give only one state.",
    workaround: "Generate ensemble predictions by masking MSA columns. AlphaFold3 partially addresses with diffusion sampling.",
    example: "Adenylate kinase 'open' vs 'closed' — a single deterministic output misses the functional cycle.",
  },
  {
    title: "Post-Translational Modifications",
    severity: "medium", color: C.medium,
    desc: "Phosphorylation, glycosylation, ubiquitylation, etc. are ignored. Modifications can induce large structural changes.",
    workaround: "Currently no clean solution. Homologous modified structures in PDB can be used as references.",
    example: "Intrinsically disordered activation loops fold upon phosphorylation — AF gives only unphosphorylated form.",
  },
  {
    title: "Membrane Protein Lipid Context",
    severity: "medium", color: C.medium,
    desc: "Predicted in aqueous context. Lipid bilayer may constrain or stabilize different conformations. Transmembrane helix tilt angles may be off.",
    workaround: "Use CHARMM-GUI or CG-MD simulations to place predictions in realistic membrane environments.",
    example: "GPCRs: intracellular loops known to adopt different conformations depending on lipid composition.",
  },
  {
    title: "Homo- and Heteromultimers",
    severity: "low", color: C.medium,
    desc: "Homomeric interfaces can sometimes be inferred from single-chain predictions (symmetric assemblies), but not always.",
    workaround: "AlphaFold-Multimer, symmetry-aware docking, or experimental cryo-EM density fitting.",
    example: "Designed homomers (symmetric): usually fine. Asymmetric homomers: may get conformation that only exists in complex.",
  },
  {
    title: "Template Contamination Risk",
    severity: "low", color: C.green,
    desc: "If training data includes structures similar to test proteins, accuracy may be inflated on benchmarks. AlphaFold uses cut-off dates but this remains a theoretical concern.",
    workaround: "CAMEO benchmark uses proteins deposited after training cutoff — mitigates this concern.",
    example: "Paper uses Feb 2021 PDB cutoff; CAMEO test set is continuously updated post-training.",
  },
];

// Novel proteins stats
const noveltyBins = [
  { label: ">50% seq ID (safe template zone)", coverage: 72, color: C.vhigh },
  { label: "30–50% seq ID (twilight zone)", coverage: 60, color: C.high },
  { label: "10–30% seq ID (dark zone)", coverage: 45, color: C.medium },
  { label: "<10% seq ID (no template)", coverage: 30, color: C.low },
];

const caseStudies = [
  {
    id: "g6pase", name: "G6Pase-α", full: "Glucose-6-Phosphatase α", uniprot: "P35575",
    pLDDT: 95.5, activePLDDT: 96.6, type: "Membrane Enzyme", color: C.vhigh, icon: "⬡",
    function: "Catalyses the final step in gluconeogenesis and glycogenolysis — dephosphorylation of glucose-6-phosphate to glucose. Critical for blood sugar homeostasis.",
    topology: "9-helix transmembrane topology (ER membrane)",
    novelty: "No prior experimental structure. Most similar PDB entry has <25% identity.",
    insights: [
      "Active site tunnel opens to ER lumen surface — substrate must enter from lumenal side",
      "Active site aligns with chloroperoxidase (PDB 1IDQ) at 0.56 Å r.m.s.d. across 49/51 atoms",
      "Conserved histidine–aspartate catalytic dyad confirmed by structural alignment",
      "Novel residue Glu110: conserved in G6Pase-β but absent in chloroperoxidase",
      "Glu110 is most solvent-exposed residue near active site — proposed gating function",
      "Salt bridges with positively charged residues could stabilize closed gating conformation",
    ],
    drug: "Glycogen storage disease type Ia (von Gierke disease) — loss-of-function mutations cause severe hypoglycaemia",
  },
  {
    id: "dgat2", name: "DGAT2", full: "Diacylglycerol O-Acyltransferase 2", uniprot: "Q96PD7",
    pLDDT: 95.9, activePLDDT: 93.7, type: "Acyltransferase", color: C.vhigh, icon: "◈",
    function: "Catalyses the final step in triacylglycerol synthesis (fat storage). Key enzyme for neutral lipid metabolism in liver, adipose tissue, and intestine.",
    topology: "Membrane-anchored (ER membrane via N-terminal hairpin)",
    novelty: "No experimental structure at time of prediction. Distantly related to DGAT1 (different fold family).",
    insights: [
      "P2Rank identified binding pocket for DGAT2-specific inhibitor PF-06424439",
      "AutoDock Vina docking: DGAT2-specific inhibitor fits pocket — DGAT1 inhibitor does not (selectivity confirmed)",
      "His163 & Glu243 analogous to catalytic His415/Glu416 in DGAT1 — conserved geometry despite different fold",
      "Ser244 adjacent to Glu243 — may form acyl-enzyme intermediate via serine mechanism",
      "Mutagenesis: mutating His163 has stronger deleterious effect than adjacent His (model-predicted, experiment confirmed)",
      "His163 and Glu243 conserved across metazoa — strong evolutionary constraint on catalytic geometry",
    ],
    drug: "NASH (nonalcoholic steatohepatitis) — DGAT2 inhibitors in Phase 2 clinical trials for fatty liver disease",
  },
  {
    id: "wolframin", name: "Wolframin", full: "Wolframin (WFS1)", uniprot: "O76024",
    pLDDT: 81.7, activePLDDT: 86.0, type: "ER Membrane Protein", color: C.high, icon: "◇",
    function: "ER-localised transmembrane protein; mutations cause Wolfram syndrome 1 (progressive neurodegeneration, diabetes mellitus, optic atrophy, deafness).",
    topology: "ER transmembrane (9 predicted TM helices) with large lumenal C-terminal domain",
    novelty: "Most similar PDB chain (3F1Z) has TM-score only 0.472 — genuinely novel fold with no structural precedent",
    insights: [
      "OB-fold domain identified in C-terminal region — consistent with evolutionary analysis but previously undetected",
      "Unique cysteine-rich insertion incorporated as characteristic β1 strand of OB-fold",
      "Extended L12 loop with 2 predicted disulfide bridges — confirmed fold novelty in ER oxidizing environment",
      "Third predicted disulfide bridge in cysteine-rich region — all three would stabilize structure in ER lumen",
      "Cysteine-rich region hypothesized to recruit partner proteins or act as redox sensor",
      "Structural model enables targeted mutagenesis for Wolfram syndrome therapeutic development",
    ],
    drug: "Wolfram syndrome 1 — rare neurodegenerative disease with no approved therapy; model enables targeted drug design",
  },
];

// ─── Reusable Components ──────────────────────────────────
function Stat({ val, label, color = C.vhigh, suffix = "" }) {
  const [v, setV] = useState(0);
  const r = useRef(null);
  useEffect(() => {
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 1100, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(val > 1000 ? Math.floor(val * e) : +(val * e).toFixed(1));
      if (p < 1) r.current = requestAnimationFrame(step);
    };
    r.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r.current);
  }, [val]);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color, fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 900, fontFamily: "monospace" }}>{v.toLocaleString()}{suffix}</div>
      <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.12em", marginTop: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Card({ children, title, style = {} }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, ...style }}>
      {title && <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.18em", marginBottom: 14, textTransform: "uppercase" }}>{title}</div>}
      {children}
    </div>
  );
}

function Tag({ text, color }) {
  return <span style={{ background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: 9, padding: "2px 7px", borderRadius: 99, fontFamily: "monospace" }}>{text}</span>;
}

function Callout({ children, color = C.vhigh }) {
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", background: `${color}10`, border: `1px solid ${color}35`, borderRadius: 7 }}>
      <div style={{ color: C.text, fontSize: 11, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

function HBar({ label, val, max = 100, color = C.vhigh, note, secondVal, secondColor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: C.text, fontSize: 11 }}>{label}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {secondVal !== undefined && <span style={{ color: secondColor, fontSize: 11 }}>{secondVal}%</span>}
          <span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{typeof val === "number" ? `${val}%` : val}</span>
        </div>
      </div>
      <div style={{ background: C.border, borderRadius: 3, height: 8, position: "relative", overflow: "hidden" }}>
        {secondVal !== undefined && <div style={{ position: "absolute", background: secondColor, width: `${(secondVal / max) * 100}%`, height: "100%", opacity: 0.5 }} />}
        <div style={{ background: color, width: `${(val / max) * 100}%`, height: "100%", opacity: 0.85 }} />
      </div>
      {note && <div style={{ color: C.muted, fontSize: 9, marginTop: 2, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

// ─── SVG Charts ───────────────────────────────────────────
function TMDistChart() {
  const w = 340, h = 130, pad = { l: 30, r: 12, t: 14, b: 30 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(...tmScoreData.map(d => d.pct));
  const bw = iw / tmScoreData.length - 4;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0, 0.5, 1].map(f => <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + ih * (1 - f)} y2={pad.t + ih * (1 - f)} stroke={C.border} strokeWidth={0.5} strokeDasharray="3,3" />)}
      <line x1={pad.l + iw * 0.67} x2={pad.l + iw * 0.67} y1={pad.t} y2={pad.t + ih} stroke={C.vhigh} strokeWidth={1} strokeDasharray="4,3" opacity={0.55} />
      <text x={pad.l + iw * 0.67 + 3} y={pad.t + 10} fill={C.vhigh} fontSize={7.5}>TM≥0.7 threshold</text>
      {tmScoreData.map((d, i) => {
        const x = pad.l + i * (iw / tmScoreData.length) + 2;
        const bh = (d.pct / max) * ih;
        return (
          <g key={i}>
            <rect x={x} y={pad.t + ih - bh} width={bw} height={bh} fill={i >= 6 ? C.vhigh : C.high} opacity={i >= 6 ? 0.85 : 0.35} rx={2} />
            <text x={x + bw / 2} y={h - 4} textAnchor="middle" fill={C.muted} fontSize={7}>{d.bin}</text>
            <text x={x + bw / 2} y={pad.t + ih - bh - 3} textAnchor="middle" fill={i >= 6 ? C.vhigh : C.muted} fontSize={7}>{d.pct}%</text>
          </g>
        );
      })}
      <text x={w / 2} y={h} textAnchor="middle" fill={C.muted} fontSize={8}>TM-Score bin</text>
    </svg>
  );
}

function CAMEOChart() {
  const w = 340, h = 140, pad = { l: 36, r: 12, t: 16, b: 34 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const yMin = 75, yMax = 100;
  const sy = (v) => pad.t + ih * (1 - (v - yMin) / (yMax - yMin));
  const sx = (i) => pad.l + (i / (cameoBins.length - 1)) * iw;
  const afPts = cameoBins.map((d, i) => `${sx(i)},${sy(d.af)}`).join(" ");
  const bstPts = cameoBins.map((d, i) => `${sx(i)},${sy(d.best)}`).join(" ");
  const afArea = `${sx(0)},${pad.t + ih} ` + afPts + ` ${sx(cameoBins.length - 1)},${pad.t + ih}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[75, 80, 85, 90, 95, 100].map(v => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth={0.5} />
          <text x={pad.l - 4} y={sy(v) + 3} textAnchor="end" fill={C.muted} fontSize={7}>{v}</text>
        </g>
      ))}
      {cameoBins.map((d, i) => <text key={i} x={sx(i)} y={h - 4} textAnchor="middle" fill={C.muted} fontSize={7.5}>{d.range}</text>)}
      <polygon points={afArea} fill={`${C.vhigh}12`} />
      <polyline points={bstPts} fill="none" stroke={C.medium} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.75} />
      <polyline points={afPts} fill="none" stroke={C.vhigh} strokeWidth={2.2} />
      {cameoBins.map((d, i) => (
        <g key={i}>
          <circle cx={sx(i)} cy={sy(d.af)} r={3} fill={C.vhigh} />
          <circle cx={sx(i)} cy={sy(d.best)} r={2.5} fill={C.medium} opacity={0.85} />
        </g>
      ))}
      <text x={w - pad.r - 2} y={sy(cameoBins.at(-1).af) - 5} fill={C.vhigh} fontSize={8} textAnchor="end">AlphaFold2</text>
      <text x={w - pad.r - 2} y={sy(cameoBins.at(-1).best) + 12} fill={C.medium} fontSize={8} textAnchor="end">Best template</text>
      <text x={w / 2} y={h} textAnchor="middle" fill={C.muted} fontSize={8}>Template sequence identity</text>
      <text transform={`rotate(-90 10 ${h / 2})`} x={0} y={h / 2 + 4} fill={C.muted} fontSize={8} textAnchor="middle">lDDT-Cα (median)</text>
    </svg>
  );
}

function RotamerSVG() {
  const w = 300, h = 110, pad = { l: 28, r: 12, t: 12, b: 28 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const sx = (v) => pad.l + ((v - 20) / 80) * iw;
  const sy = (v) => pad.t + ih * (1 - (v - 50) / 50);
  const pts = rotamerData.map(d => `${sx(d.plddt)},${sy(d.pct)}`).join(" ");
  const area = `${sx(20)},${pad.t + ih} ` + pts + ` ${sx(100)},${pad.t + ih}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[60, 70, 80, 90, 100].map(v => (
        <g key={v}><line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth={0.5} />
          <text x={pad.l - 3} y={sy(v) + 3} textAnchor="end" fill={C.muted} fontSize={7}>{v}%</text></g>
      ))}
      <line x1={sx(90)} x2={sx(90)} y1={pad.t} y2={pad.t + ih} stroke={C.vhigh} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
      <text x={sx(91)} y={pad.t + 9} fill={C.vhigh} fontSize={7}>90 → ~80% χ₁</text>
      <polygon points={area} fill={`${C.high}20`} />
      <polyline points={pts} fill="none" stroke={C.high} strokeWidth={2} />
      {[20, 40, 60, 70, 80, 90, 100].map(v => <text key={v} x={sx(v)} y={h - 4} textAnchor="middle" fill={C.muted} fontSize={7}>{v}</text>)}
      <text x={w / 2} y={h} textAnchor="middle" fill={C.muted} fontSize={8}>pLDDT</text>
    </svg>
  );
}

function HeterotypicChart() {
  const w = 320, h = 120, pad = { l: 30, r: 12, t: 14, b: 30 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const bw = iw / heterotypicData.length - 4;
  const sy = (v) => pad.t + ih * (1 - (v - 20) / 80);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[30, 50, 70, 90].map(v => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth={0.5} strokeDasharray="3,3" />
          <text x={pad.l - 3} y={sy(v) + 3} textAnchor="end" fill={C.muted} fontSize={7}>{v}</text>
        </g>
      ))}
      <line x1={pad.l} x2={w - pad.r} y1={sy(70)} y2={sy(70)} stroke={C.vhigh} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      {heterotypicData.map((d, i) => {
        const x = pad.l + i * (iw / heterotypicData.length) + 2;
        const frac = i / (heterotypicData.length - 1);
        const col = frac < 0.3 ? C.vhigh : frac < 0.6 ? C.medium : C.low;
        const bh = (d.lddt - 20) / 80 * ih;
        return (
          <g key={i}>
            <rect x={x} y={sy(d.lddt)} width={bw} height={bh} fill={col} opacity={0.75} rx={2} />
            <text x={x + bw / 2} y={h - 4} textAnchor="middle" fill={C.muted} fontSize={6.5}>{d.bin}</text>
            <text x={x + bw / 2} y={sy(d.lddt) - 3} textAnchor="middle" fill={col} fontSize={7}>{d.lddt}</text>
          </g>
        );
      })}
      <text x={w / 2} y={h} textAnchor="middle" fill={C.muted} fontSize={8}>% heterotypic contacts</text>
      <text transform={`rotate(-90 10 ${h / 2})`} x={0} y={h / 2 + 4} fill={C.muted} fontSize={8} textAnchor="middle">lDDT-Cα</text>
    </svg>
  );
}

function SeqLenStackedBar() {
  const total = 100;
  return (
    <div>
      {seqLenBins.map((b) => (
        <div key={b.len} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: C.text, fontSize: 11 }}>{b.len} aa</span>
            <span style={{ color: C.muted, fontSize: 10 }}>n≈{b.n.toLocaleString()} proteins</span>
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 3, overflow: "hidden", gap: 1 }}>
            <div title={`Very High: ${b.vhigh}%`} style={{ flex: b.vhigh, background: C.vhigh, opacity: 0.85 }} />
            <div title={`High: ${b.high}%`} style={{ flex: b.high, background: C.high, opacity: 0.85 }} />
            <div title={`Med: ${b.med}%`} style={{ flex: b.med, background: C.medium, opacity: 0.85 }} />
            <div title={`Low: ${b.low}%`} style={{ flex: b.low, background: C.low, opacity: 0.65 }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            <span style={{ color: C.vhigh, fontSize: 9 }}>VH {b.vhigh}%</span>
            <span style={{ color: C.high, fontSize: 9 }}>H {b.high}%</span>
            <span style={{ color: C.medium, fontSize: 9 }}>M {b.med}%</span>
            <span style={{ color: C.low, fontSize: 9 }}>L {b.low}%</span>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
        {[[C.vhigh, "pLDDT >90"], [C.high, "70–90"], [C.medium, "50–70"], [C.low, "<50"]].map(([col, lab]) => (
          <div key={lab} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: col, borderRadius: 2 }} />
            <span style={{ color: C.muted, fontSize: 9 }}>{lab}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MolBG() {
  const nodes = Array.from({ length: 32 }, (_, i) => ({
    x: 4 + (i % 8) * 13 + (Math.floor(i / 8) % 2) * 6.5,
    y: 6 + Math.floor(i / 8) * 24,
  }));
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.03, pointerEvents: "none", zIndex: 0 }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => {
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        return d < 15 ? <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.vhigh} strokeWidth="0.25" /> : null;
      }))}
      {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="1" fill={C.vhigh} />)}
    </svg>
  );
}

function CaseCard({ p, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: active ? `${p.color}0d` : C.card, border: `1px solid ${active ? p.color : C.border}`,
      borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.2s", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 26, color: p.color, lineHeight: 1.1 }}>{p.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 14, fontFamily: "monospace" }}>{p.name}</div>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{p.full}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: p.color, fontWeight: 900, fontSize: 22, fontFamily: "monospace" }}>{p.pLDDT}</div>
              <div style={{ color: C.muted, fontSize: 9 }}>median pLDDT</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Tag text={p.type} color={p.color} />
            <Tag text={p.uniprot} color={p.color} />
            <Tag text={`Active site: ${p.activePLDDT}`} color={p.color} />
          </div>
        </div>
      </div>
      {active && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.14em", marginBottom: 6 }}>FUNCTION</div>
          <div style={{ color: C.text, fontSize: 12, lineHeight: 1.7, fontFamily: "Georgia, serif", marginBottom: 14 }}>{p.function}</div>
          <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.14em", marginBottom: 8 }}>STRUCTURAL INSIGHTS</div>
          {p.insights.map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <span style={{ color: p.color, flexShrink: 0 }}>›</span>
              <span style={{ color: C.text, fontSize: 11, lineHeight: 1.55 }}>{ins}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: "9px 12px", background: `${C.accent2}10`, border: `1px solid ${C.accent2}35`, borderRadius: 6 }}>
            <span style={{ color: C.accent2, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700 }}>DRUG / DISEASE RELEVANCE — </span>
            <span style={{ color: C.text, fontSize: 11 }}>{p.drug}</span>
          </div>
          <div style={{ marginTop: 8, color: C.muted, fontSize: 10 }}>Novelty: <span style={{ color: C.text }}>{p.novelty}</span></div>
          <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>Topology: <span style={{ color: C.text }}>{p.topology}</span></div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [activeCase, setActiveCase] = useState(null);
  const [expandedLimit, setExpandedLimit] = useState(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Courier New', monospace", position: "relative" }}>
      <MolBG />
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: "24px 24px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.2em", marginBottom: 6 }}>ALPHAFOLD · NATURE 596 · TUNYASUVUNAKOOL ET AL. 2021</div>
              <h1 style={{ margin: 0, fontSize: "clamp(16px, 3.5vw, 28px)", fontWeight: 900, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
                Human Proteome <span style={{ color: C.vhigh }}>Structure Atlas</span>
              </h1>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>20,296 proteins · 10.5M residues · 930 GPU-days</div>
            </div>
            <div style={{ display: "flex", gap: 24, marginLeft: "auto", flexWrap: "wrap" }}>
              <Stat val={98.5} suffix="%" label="Proteins Covered" />
              <Stat val={58} suffix="%" label="Confident Residues" color={C.high} />
              <Stat val={35.7} suffix="%" label="Very High Conf." color={C.vhigh} />
              <Stat val={20296} suffix="" label="Proteins Predicted" color={C.accent} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.vhigh : "transparent",
                color: tab === t.id ? C.bg : C.muted,
                border: `1px solid ${tab === t.id ? C.vhigh : C.border}`,
                borderBottom: "none", borderRadius: "5px 5px 0 0",
                padding: "7px 14px", fontSize: 9, cursor: "pointer",
                fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase",
                transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: tab === t.id ? 700 : 400,
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: 1140 }}>

          {/* ════════════════ OVERVIEW ════════════════ */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
              <Card title="pLDDT Confidence Bands — 10.5M Residues">
                {bandData.map((b) => (
                  <div key={b.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.text, fontSize: 12 }}>{b.label}</span>
                      <span style={{ color: b.color, fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{b.pct}%</span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 3, height: 9 }}>
                      <div style={{ background: b.color, width: `${b.pct}%`, height: "100%", borderRadius: 3, opacity: 0.85 }} />
                    </div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{b.desc}</div>
                    <div style={{ marginTop: 3 }}><Tag text={`Use for: ${b.use}`} color={b.color} /></div>
                  </div>
                ))}
              </Card>

              <Card title="Coverage Milestones">
                <HBar label="Proteins with any prediction" val={98.5} color={C.vhigh} />
                <HBar label="Confident residues (pLDDT >70)" val={58.0} color={C.high} />
                <HBar label="Very high confidence (pLDDT >90)" val={35.7} color={C.vhigh} />
                <HBar label="PDB experimental coverage pre-AlphaFold" val={17.0} color={C.low} note="Only 35% of human proteins had any PDB entry at all" />
                <HBar label="Proteins ≥75% confident sequence" val={43.8} color={C.accent} />
                <Callout color={C.vhigh}>AlphaFold doubled the structural coverage of the human proteome versus all experimental PDB entries combined.</Callout>
              </Card>

              <Card title="Key Numbers at a Glance">
                {[
                  { label: "Total proteins predicted", val: "20,296", color: C.vhigh },
                  { label: "Total residues predicted", val: "10,537,122", color: C.vhigh },
                  { label: "Proteins with >75% confident seq.", val: "43.8%", color: C.high },
                  { label: "Proteins with novel fold (no 30% id template)", val: "1,290", color: C.accent, note: ">200 residues, pLDDT ≥70" },
                  { label: "Novel multi-domain chains (pTM >0.8)", val: "187", color: C.accent2 },
                  { label: "Novel multi-domain chains (pTM >0.7)", val: "343", color: C.accent2 },
                  { label: "pTM vs TM-score Pearson r", val: "0.84", color: C.green },
                  { label: "pLDDT vs lDDT-Cα Pearson r", val: "0.73", color: C.green, note: "Across 2.76M matched residues" },
                  { label: "Chains excluded (>2,700 aa)", val: "~318", color: C.muted, note: "GPU memory constraint, not method limit" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div><div style={{ color: C.text, fontSize: 11 }}>{s.label}</div>{s.note && <div style={{ color: C.muted, fontSize: 9, marginTop: 1 }}>{s.note}</div>}</div>
                    <span style={{ color: s.color, fontWeight: 700, fontFamily: "monospace", flexShrink: 0, marginLeft: 10 }}>{s.val}</span>
                  </div>
                ))}
              </Card>

              <Card title="What the Confidence Bands Mean in Practice">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.75 }}>
                  <p style={{ margin: "0 0 10px" }}><span style={{ color: C.vhigh }}>pLDDT ≥90 →</span> Side-chain accuracy is high enough for molecular replacement in crystallographic phasing. These residues are suitable for drug pocket detection, virtual screening, and fragment docking.</p>
                  <p style={{ margin: "0 0 10px" }}><span style={{ color: C.high }}>pLDDT 70–90 →</span> Backbone reliable, side chains more variable. Good for structural bioinformatics, evolutionary analysis, and building homology models of related proteins.</p>
                  <p style={{ margin: "0 0 10px" }}><span style={{ color: C.medium }}>pLDDT 50–70 →</span> Interpret with caution. Could be flexible linkers, partially folded regions, or regions that fold only upon binding a partner.</p>
                  <p style={{ margin: 0 }}><span style={{ color: C.low }}>pLDDT &lt;50 →</span> Treat as a <em>disorder signal</em>, not a 3D coordinate. The ribbon-like helical appearance in PyMOL is an artefact of how AlphaFold encodes uncertainty in backbone angles, not a prediction of helix content.</p>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════ ACCURACY ════════════════ */}
          {tab === "accuracy" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 18 }}>
              <Card title="TM-Score Distribution — Long Multi-Domain Chains">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 12 }}>
                  Evaluated on 151 held-out PDB chains with &gt;800 resolved residues and best template &lt;30% identity. TM-score measures global accuracy, not just per-domain.
                </div>
                <TMDistChart />
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  {[{ v: "70%", l: "chains with TM >0.7", c: C.vhigh }, { v: "151", l: "held-out evaluation chains", c: C.high }, { v: "<30%", l: "max template identity", c: C.muted }].map(s => (
                    <div key={s.l} style={{ flex: 1, background: `${s.c}12`, border: `1px solid ${s.c}35`, borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ color: s.c, fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>{s.v}</div>
                      <div style={{ color: C.muted, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="CAMEO Benchmark: AlphaFold vs Best Single Template">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 12 }}>
                  428 targets from 1 year of CAMEO challenges. AlphaFold consistently outperforms the best available structural template across all sequence identity bins — including near-identical (&gt;80%) templates.
                </div>
                <CAMEOChart />
                <Callout color={C.vhigh}>Gap is largest at low identity (30–40%) where templates are most unreliable — exactly where structural biology has historically struggled.</Callout>
              </Card>

              <Card title="pLDDT ↔ lDDT-Cα Calibration">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>
                  Pearson r = 0.73 across 2.76M matched residues (PDB structures at &lt;3.5 Å resolution). Linear fit: <span style={{ color: C.vhigh, fontFamily: "monospace" }}>lDDT = 0.967 × pLDDT + 1.9</span>
                </div>
                {pLDDTvsLDDT.map((d) => (
                  <div key={d.plddt} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ color: C.muted, fontSize: 10, width: 26, flexShrink: 0 }}>{d.plddt}</span>
                    <div style={{ flex: 1, background: C.border, borderRadius: 2, height: 7, position: "relative" }}>
                      <div style={{ position: "absolute", left: `${d.q1}%`, right: `${100 - d.q3}%`, background: C.high, height: "100%", opacity: 0.35 }} />
                      <div style={{ position: "absolute", left: `${d.mean - 2}%`, width: 4, background: C.vhigh, height: "100%", borderRadius: 99 }} />
                    </div>
                    <span style={{ color: C.vhigh, fontSize: 10, width: 22, fontFamily: "monospace" }}>{d.mean}</span>
                  </div>
                ))}
                <div style={{ color: C.muted, fontSize: 9, marginTop: 6 }}>Bar = IQR (25–75th pct) · Dot = mean actual lDDT-Cα</div>
                <Callout color={C.high}>The calibration is near-perfect for high pLDDT (90–100), slight underestimation at mid-range. This means you can trust high-confidence predictions quantitatively.</Callout>
              </Card>

              <Card title="Side-Chain Accuracy: χ₁ Rotamer Correctness">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>
                  χ₁ correct within 40° of PDB value. Evaluated on 5,983 chains at &lt;2.5 Å resolution with B-factor &lt;30 Å² (well-resolved residues only).
                </div>
                <RotamerSVG />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  {[
                    { l: "χ₁ correct at pLDDT >90", v: "~80%", c: C.vhigh },
                    { l: "χ₁ correct at pLDDT 70–90", v: "~70%", c: C.high },
                    { l: "χ₁ correct at pLDDT 50–70", v: "~63%", c: C.medium },
                    { l: "χ₁ correct at pLDDT <50", v: "~57%", c: C.low },
                  ].map(s => (
                    <div key={s.l} style={{ padding: "7px 10px", background: `${s.c}10`, border: `1px solid ${s.c}30`, borderRadius: 5 }}>
                      <div style={{ color: s.c, fontWeight: 700, fontFamily: "monospace" }}>{s.v}</div>
                      <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Heterotypic Contacts → Accuracy Collapse" style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.65, marginBottom: 12 }}>
                      Evaluated on 3,007 chains with &lt;40% template identity. <em style={{ color: C.text }}>Heterotypic contact</em> = a cross-chain (non-homomeric) contact. When a domain only folds in complex, AlphaFold's single-chain prediction gets that region systematically wrong.
                    </div>
                    <HeterotypicChart />
                  </div>
                  <div>
                    {[
                      { label: "Low heterotypic (<25%)", lddt: "~85 lDDT", color: C.vhigh, note: "Globular single-chain domains — AlphaFold excels" },
                      { label: "High heterotypic (>50%)", lddt: "~35 lDDT", color: C.low, note: "Regions structured only in complex — systematically wrong" },
                      { label: "Example: PDB 7KPX chain C", lddt: "Mixed", color: C.medium, note: "Globular domain: correct. Extended interface loop: completely mispredicted" },
                    ].map(s => (
                      <div key={s.label} style={{ marginBottom: 12, padding: "12px 14px", background: `${s.color}0a`, border: `1px solid ${s.color}30`, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                          <span style={{ color: s.color, fontFamily: "monospace", fontSize: 12 }}>{s.lddt}</span>
                        </div>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{s.note}</div>
                      </div>
                    ))}
                    <Callout color={C.medium}>Low pLDDT at an interface region does NOT always mean disorder — it may mean "structured only when bound." Interpreting these regions requires biological context.</Callout>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════ COVERAGE ════════════════ */}
          {tab === "coverage" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
              <Card title="GO-Term Coverage: Novel vs Templated" style={{ gridColumn: "1 / -1" }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 14, lineHeight: 1.55 }}>
                  Each bar shows residues with high-confidence prediction (pLDDT &gt;70). The templated fraction (pale) existed before AlphaFold; the extension (bright) is newly added structural information.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                  {goTerms.map(item => {
                    const added = +(item.confident - item.templated).toFixed(2);
                    return (
                      <div key={item.term} style={{ background: C.card2, borderRadius: 7, padding: "11px 13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ color: C.text, fontSize: 11 }}>{item.term}</span>
                          <span style={{ color: C.high, fontSize: 10, fontFamily: "monospace" }}>+{Math.round(added * 100)}%</span>
                        </div>
                        <div style={{ background: C.border, borderRadius: 2, height: 7, position: "relative" }}>
                          <div style={{ position: "absolute", background: C.muted, width: `${item.templated * 100}%`, height: "100%", borderRadius: 2, opacity: 0.65 }} />
                          <div style={{ position: "absolute", left: `${item.templated * 100}%`, width: `${added * 100}%`, height: "100%", background: C.vhigh, borderRadius: 2, opacity: 0.85 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                          <span style={{ color: C.muted, fontSize: 9 }}>templated: {Math.round(item.templated * 100)}%</span>
                          <span style={{ color: C.vhigh, fontSize: 9 }}>total: {Math.round(item.confident * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Callout color={C.vhigh}>Biggest gains in membrane-related categories (organelle membrane: +33%, plasma membrane: +32%) — exactly where experimental structures are hardest to obtain.</Callout>
              </Card>

              <Card title="Confidence by Template Identity">
                {noveltyBins.map((b) => (
                  <div key={b.label} style={{ marginBottom: 14 }}>
                    <HBar label={b.label} val={b.coverage} color={b.color} />
                  </div>
                ))}
                <Callout color={C.medium}>AlphaFold still achieves ~30% confident coverage for proteins with no detectable template — the "dark proteome." These are entirely new structural hypotheses.</Callout>
              </Card>

              <Card title="Membrane Protein Coverage">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.65, marginBottom: 14 }}>
                  Membrane proteins are severely underrepresented in the PDB — difficult to purify and crystallize. AlphaFold achieves substantial coverage despite sparse training examples.
                </div>
                {[
                  { label: "Plasma membrane proteins covered", val: "52%", color: C.high },
                  { label: "Integral membrane components covered", val: "50%", color: C.high },
                  { label: "Organelle membrane covered", val: "55%", color: C.high },
                  { label: "Templated baseline (plasma membrane)", val: "~20%", color: C.muted },
                  { label: "Net novel membrane coverage added", val: "~30–32%", color: C.vhigh },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.text, fontSize: 11 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700, fontFamily: "monospace" }}>{s.val}</span>
                  </div>
                ))}
              </Card>

              <Card title="Historical Context: PDB vs AlphaFold">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.75 }}>
                  <p style={{ margin: "0 0 10px" }}>The Protein Data Bank (PDB) was founded in 1971. After 50 years of global experimental effort, it contained ~180,000 entries but with enormous redundancy — only ~17% of human proteome residues were covered.</p>
                  <p style={{ margin: "0 0 10px" }}>A single AlphaFold run — 930 GPU-days, roughly equivalent to 1 powerful server running for 2.5 years — produced confident predictions for 58% of human residues and doubled the experimental baseline.</p>
                  <p style={{ margin: 0 }}>The AlphaFold Database (alphafold.ebi.ac.uk) has since expanded to cover &gt;200M proteins across all kingdoms of life.</p>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════ DISORDER ════════════════ */}
          {tab === "disorder" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
              <Card title="Disorder Prediction: CAID Benchmark">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 14 }}>
                  CAID DisProt-PDB dataset (178,124 residues). AUC of ROC for binary disorder/order classification.
                </div>
                {disorderData.map((d) => (
                  <div key={d.predictor} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.text, fontSize: 11 }}>{d.predictor}</span>
                      <span style={{ color: d.color, fontWeight: 700, fontFamily: "monospace" }}>AUC {d.auc}</span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 3, height: 9 }}>
                      <div style={{ background: d.color, width: `${d.auc * 100}%`, height: "100%", borderRadius: 3, opacity: 0.85 }} />
                    </div>
                    <div style={{ color: C.muted, fontSize: 9, marginTop: 3 }}>{d.note}</div>
                  </div>
                ))}
                <Callout color={C.vhigh}>pLDDT was never designed as a disorder predictor but surpasses all dedicated tools. The Experimentally Resolved Head (explicitly trained for this purpose) achieves state-of-the-art AUC 0.921.</Callout>
              </Card>

              <Card title="pLDDT in Resolved vs Unresolved PDB Residues">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 14 }}>
                  The large shift in pLDDT distribution between PDB-resolved and PDB-unresolved residues validates pLDDT as a structural order proxy — even though it wasn't trained for this.
                </div>
                {[
                  { label: "PDB resolved residues (n=3.44M)", vhigh: 78, med: 14, low: 8, color: C.vhigh, note: "78% above pLDDT 70 — confirms prediction accuracy" },
                  { label: "PDB unresolved residues (n=589K)", vhigh: 28, med: 32, low: 40, color: C.low, note: "Only 28% above pLDDT 70 — correctly flagged as uncertain" },
                  { label: "Full human proteome (n=10.5M)", vhigh: 36, med: 22, low: 42, color: C.high, note: "Estimated disorder fraction consistent with literature (37–50%)" },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 16 }}>
                    <div style={{ color: C.text, fontSize: 11, marginBottom: 5 }}>{s.label}</div>
                    <div style={{ display: "flex", height: 14, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ flex: s.vhigh, background: C.vhigh, opacity: 0.85 }} />
                      <div style={{ flex: s.med, background: C.medium, opacity: 0.85 }} />
                      <div style={{ flex: s.low, background: C.low, opacity: 0.65 }} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                      <span style={{ color: C.vhigh, fontSize: 9 }}>Conf. {s.vhigh}%</span>
                      <span style={{ color: C.medium, fontSize: 9 }}>Med. {s.med}%</span>
                      <span style={{ color: C.low, fontSize: 9 }}>Low {s.low}%</span>
                    </div>
                    <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>{s.note}</div>
                  </div>
                ))}
              </Card>

              <Card title="Why Does pLDDT Detect Disorder?">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.75 }}>
                  <p style={{ margin: "0 0 10px" }}>Disordered regions have shallow evolutionary conservation — many sequence positions tolerate substitutions without functional cost. This produces <em style={{ color: C.text }}>shallow, diverse MSAs</em> with weak covariation signal.</p>
                  <p style={{ margin: "0 0 10px" }}>When the Evoformer receives a shallow MSA, it produces low-confidence pair representations. The pLDDT head, trained to predict accuracy, correctly outputs low confidence for these regions.</p>
                  <p style={{ margin: 0 }}>The Experimentally Resolved Head adds an explicit signal: it's trained on which residues appear in crystal structures vs which are missing (typically disordered loops). Its AUC 0.921 reflects this targeted training.</p>
                </div>
              </Card>

              <Card title="Interpreting Disordered Regions">
                {[
                  { icon: "⚠", title: "Do NOT model as structure", desc: "Ribbon-like helical appearance in PyMOL for pLDDT <50 regions is an artefact — backbone angles encode uncertainty, not helix prediction. Do not perform structure-based analysis on these coordinates.", color: C.low },
                  { icon: "✓", title: "USE as disorder signal", desc: "pLDDT <50 is a strong signal of genuine intrinsic disorder. Use it to annotate IDRs, predict linker regions, and flag regions for NMR vs crystallography.", color: C.green },
                  { icon: "◈", title: "Binding-induced folding", desc: "Low-confidence regions may fold upon binding a partner, ligand, or nucleic acid. These are interesting biologically — regulated disorder is often functionally important.", color: C.medium },
                  { icon: "◇", title: "Post-translational control", desc: "Many IDRs are sites of phosphorylation, ubiquitylation, and other modifications that control folding. AlphaFold's prediction is of the unmodified, unbound state.", color: C.accent },
                ].map(s => (
                  <div key={s.title} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <span style={{ color: s.color, fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{s.icon}</span>
                    <div>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{s.title}</div>
                      <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ════════════════ METHOD ════════════════ */}
          {tab === "method" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
              <Card title="AlphaFold2 Pipeline: 6 Key Stages" style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {methodSteps.map((s) => (
                    <div key={s.title} style={{ padding: "14px 16px", background: C.card2, borderRadius: 8, borderLeft: `3px solid ${s.color}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ color: s.color, fontSize: 22, fontFamily: "monospace", lineHeight: 1 }}>{s.icon}</span>
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{s.title}</div>
                          <div style={{ display: "flex", gap: 5, marginTop: 2 }}><Tag text={s.phase} color={s.color} /></div>
                        </div>
                      </div>
                      <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.6, marginBottom: 8 }}>{s.detail}</div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, color: C.text, fontSize: 10, lineHeight: 1.5 }}>
                        <span style={{ color: s.color }}>KEY INSIGHT: </span>{s.insight}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Proteome-Scale Optimisations">
                {[
                  { change: "Reduced BFD search", reason: "Takes first non-consensus sequence per a3m alignment cluster — captures diversity without full database traversal. Significant speed improvement over standard jackhmmer BFD search.", tag: "MSA Speed" },
                  { change: "Ensembling × 8 reduction", reason: "Standard AF2 runs inference 8× per model with MSA subsampling for ensemble averaging. Proteome run reduces this by 8× to prioritise throughput. Mild accuracy cost, large speedup.", tag: "Throughput" },
                  { change: "5 models per protein", reason: "5 AlphaFold2 model checkpoints (different weights) run per protein. Best selected by mean pLDDT. More models → better coverage of conformational space.", tag: "Quality" },
                  { change: "Multi-GPU scaling", reason: "Proteins 1,401–2,000 aa use 2 GPUs; 2,001–2,700 aa use 4 GPUs. Handles memory requirements for longer sequences.", tag: "Scaling" },
                  { change: "2,700 aa hard cutoff", reason: "Not a fundamental method limit. Chosen for practical runtime and GPU memory constraints at proteome scale. Excludes ~318 human proteins (e.g. titin, mucins).", tag: "Scope" },
                  { change: "Constrained relaxation (Amber99sb)", reason: "OpenMM force field applied post-prediction to remove clashes and fix stereochemistry. Does not significantly change lDDT but produces valid PDB files for downstream analysis.", tag: "Post-proc" },
                ].map((s, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: "11px 13px", background: C.card2, borderRadius: 7, borderLeft: `3px solid ${C.vhigh}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.vhigh, fontWeight: 700, fontSize: 11, fontFamily: "monospace" }}>{s.change}</span>
                      <Tag text={s.tag} color={C.vhigh} />
                    </div>
                    <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.5 }}>{s.reason}</div>
                  </div>
                ))}
              </Card>

              <Card title="Databases Used for MSA + Templates">
                {[
                  { db: "UniRef90", rel: "2020_03", tool: "jackhmmer", size: "~150M sequences", role: "Primary MSA — best characterised proteins" },
                  { db: "MGnify clusters", rel: "2018_12", tool: "jackhmmer", size: "Billions (clustered)", role: "Metagenomic MSA — adds environmental sequences for rare proteins" },
                  { db: "Reduced BFD", rel: "derived", tool: "jackhmmer", size: "~65M clusters", role: "Accelerated BFD search — first sequence per cluster" },
                  { db: "PDB SEQRES", rel: "Feb 2021", tool: "hmmsearch", size: "~550K chains", role: "Template sequence search" },
                  { db: "PDB70", rel: "Feb 2021", tool: "HHSearch", size: "70% clustered", role: "Template structure retrieval" },
                ].map(s => (
                  <div key={s.db} style={{ marginBottom: 10, padding: "9px 11px", background: C.card2, borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.vhigh, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{s.db}</span>
                      <div style={{ display: "flex", gap: 5 }}><Tag text={s.tool} color={C.accent} /><Tag text={`v${s.rel}`} color={C.muted} /></div>
                    </div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{s.size} — {s.role}</div>
                  </div>
                ))}
              </Card>

              <Card title="Compute Budget Breakdown">
                {[
                  { label: "Total GPU-days (inference, 5 models)", val: "930 GPU-days", color: C.vhigh },
                  { label: "Total CPU core-days (MSA + relax)", val: "~510 CPU-days", color: C.high },
                  { label: "GPU hardware", val: "NVIDIA V100", color: C.muted },
                  { label: "Average per protein (inference)", val: "~190 V100-seconds", color: C.medium },
                  { label: "Equivalent wall time (single V100)", val: "~2.5 years", color: C.accent2 },
                  { label: "Models per protein", val: "5 (ranked by pLDDT)", color: C.muted },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.text, fontSize: 11 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700, fontFamily: "monospace", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{s.val}</span>
                  </div>
                ))}
                <Callout color={C.accent}>930 GPU-days compressed 50 years of structural biology into a single compute campaign. Each prediction costs ~$0.05–0.20 at cloud rates — cheaper than a single PCR reaction.</Callout>
              </Card>
            </div>
          )}

          {/* ════════════════ SEQ LENGTH ════════════════ */}
          {tab === "seqlen" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
              <Card title="Confidence Distribution by Sequence Length" style={{ gridColumn: "1 / -1" }}>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55, marginBottom: 16 }}>
                  Shorter proteins tend to have higher pLDDT — they often have compact, well-defined structures and deeper MSAs. Long proteins have more disordered linkers, multi-domain flexibility, and shallower per-region MSA depth.
                </div>
                <SeqLenStackedBar />
              </Card>

              <Card title="Why Longer Proteins Score Lower">
                {[
                  { title: "More disordered linkers", desc: "Long proteins have more flexible inter-domain linkers, unstructured tails, and regulatory loops — all of which lower the average pLDDT.", icon: "⬡" },
                  { title: "Multi-domain flexibility", desc: "Domain-domain orientations are often variable in solution. AlphaFold predicts one conformation; pTM (not pLDDT) is the better metric for multi-domain accuracy.", icon: "◈" },
                  { title: "MSA coverage dilution", desc: "Per-residue MSA depth effectively decreases as sequences get longer — distant homologues may not cover all domains equally, leading to patchy confidence.", icon: "◇" },
                  { title: "Reduced ensembling", desc: "Proteome run uses 8× less ensembling than standard AF2. Longer proteins may benefit more from full ensembling to average over structural uncertainty.", icon: "△" },
                ].map(s => (
                  <div key={s.title} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <span style={{ color: C.vhigh, fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{s.icon}</span>
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{s.title}</div>
                      <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </Card>

              <Card title="The 2,700 aa Length Cap">
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>
                  Approximately 318 human proteins were excluded from the proteome release due to exceeding 2,700 amino acids. This is a practical, not a methodological, limitation.
                </div>
                {[
                  { protein: "Titin (TTN)", len: "34,350 aa", note: "Largest known human protein — elastic filament in sarcomeres" },
                  { protein: "Mucin-4 (MUC4)", len: "~7,500 aa", note: "Heavily O-glycosylated; variable repeat count between individuals" },
                  { protein: "Mucin-16 (CA-125)", len: "~14,500 aa", note: "Key cancer biomarker; extended mucin domain" },
                  { protein: "AHNAK nucleoprotein", len: "~5,900 aa", note: "Giant scaffold protein; repeat-containing" },
                  { protein: "Obscurin (OBSCN)", len: "~7,968 aa", note: "Sarcomeric scaffold; multiple Ig/Fn domains" },
                ].map(s => (
                  <div key={s.protein} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.text, fontSize: 11, fontFamily: "monospace" }}>{s.protein}</span>
                      <span style={{ color: C.low, fontFamily: "monospace", fontSize: 11 }}>{s.len}</span>
                    </div>
                    <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>{s.note}</div>
                  </div>
                ))}
                <Callout color={C.medium}>AlphaFold3 and domain-splitting approaches can now handle these — titin was predicted in segments in subsequent community efforts.</Callout>
              </Card>

              <Card title="pTM vs pLDDT: Which to Use?">
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { metric: "pLDDT", best: "Short proteins, single-domain proteins, residue-level analysis", avoid: "Comparing across proteins of very different lengths; multi-domain packing", color: C.vhigh },
                    { metric: "pTM", best: "Multi-domain proteins, assessing whether domain arrangement is correct, chain-level filtering", avoid: "Residue-level decisions; proteins with long disordered tails (pTM discounts these)", color: C.high },
                    { metric: "Resolved Head", best: "Disorder prediction, filtering for crystallography, identifying likely unresolved regions", avoid: "Measuring structural accuracy (different from both pLDDT and pTM)", color: C.accent },
                  ].map(s => (
                    <div key={s.metric} style={{ padding: "12px 14px", background: `${s.color}0a`, border: `1px solid ${s.color}30`, borderRadius: 7 }}>
                      <div style={{ color: s.color, fontWeight: 900, fontSize: 16, fontFamily: "monospace", marginBottom: 6 }}>{s.metric}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div><div style={{ color: C.green, fontSize: 9, letterSpacing: "0.1em", marginBottom: 3 }}>USE FOR</div><div style={{ color: C.text, fontSize: 10, lineHeight: 1.4 }}>{s.best}</div></div>
                        <div><div style={{ color: C.low, fontSize: 9, letterSpacing: "0.1em", marginBottom: 3 }}>AVOID FOR</div><div style={{ color: C.muted, fontSize: 10, lineHeight: 1.4 }}>{s.avoid}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════ LIMITATIONS ════════════════ */}
          {tab === "limitations" && (
            <div>
              <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, marginBottom: 20, maxWidth: 700 }}>
                AlphaFold2 is transformative but not omniscient. Understanding its failure modes is essential for correct scientific interpretation. Click any card to expand details.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {limitationData.map((lim) => {
                  const isOpen = expandedLimit === lim.title;
                  return (
                    <div key={lim.title} onClick={() => setExpandedLimit(isOpen ? null : lim.title)}
                      style={{ background: isOpen ? `${lim.color}0d` : C.card, border: `1px solid ${isOpen ? lim.color : C.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{lim.title}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Tag text={lim.severity === "high" ? "High Impact" : lim.severity === "medium" ? "Medium" : "Low"} color={lim.color} />
                          <span style={{ color: C.muted, fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 8, lineHeight: 1.55 }}>{lim.desc}</div>
                      {isOpen && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ color: C.green, fontSize: 9, letterSpacing: "0.12em", marginBottom: 4 }}>WORKAROUND</div>
                            <div style={{ color: C.text, fontSize: 11, lineHeight: 1.55 }}>{lim.workaround}</div>
                          </div>
                          <div style={{ padding: "9px 12px", background: `${C.medium}0f`, border: `1px solid ${C.medium}30`, borderRadius: 6 }}>
                            <div style={{ color: C.medium, fontSize: 9, letterSpacing: "0.12em", marginBottom: 3 }}>EXAMPLE</div>
                            <div style={{ color: C.text, fontSize: 11 }}>{lim.example}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Card title="Broader Interpretive Cautions" style={{ marginTop: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {[
                    { icon: "⚠", title: "One structure ≠ all biology", body: "A protein's function often depends on conformational changes, partner-induced folding, and context-dependent states. AlphaFold gives one static snapshot, not the full energy landscape.", color: C.medium },
                    { icon: "⚠", title: "pLDDT ≠ B-factor", body: "B-factors in crystal structures encode experimental thermal motion. pLDDT encodes predicted model accuracy. They correlate empirically but measure different things.", color: C.medium },
                    { icon: "✓", title: "Hypotheses, not ground truth", body: "AlphaFold predictions are strong structural hypotheses that should drive experimental design, not replace experimental validation for high-stakes applications.", color: C.green },
                    { icon: "✓", title: "Complement, don't replace cryo-EM/X-ray", body: "AlphaFold is most powerful when combined with low-resolution experimental data (cryo-EM maps, SAXS profiles, crosslinking mass spec) to guide and validate.", color: C.green },
                  ].map(s => (
                    <div key={s.title} style={{ padding: "12px 14px", background: `${s.color}0a`, border: `1px solid ${s.color}30`, borderRadius: 7 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: s.color, fontSize: 18, lineHeight: 1 }}>{s.icon}</span>
                        <span style={{ color: s.color, fontWeight: 700, fontSize: 12 }}>{s.title}</span>
                      </div>
                      <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.55 }}>{s.body}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════ CASE STUDIES ════════════════ */}
          {tab === "proteins" && (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>
              <div>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
                  Three de novo case studies from the paper — no template with &gt;25% identity over &gt;20% of sequence. Each showcases a different aspect of AlphaFold's structural insight. Click to expand.
                </div>
                {caseStudies.map(p => (
                  <CaseCard key={p.id} p={p} active={activeCase === p.id} onClick={() => setActiveCase(activeCase === p.id ? null : p.id)} />
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Card title="Confidence Colour Scale (PDB/ChimeraX convention)">
                  <div style={{ height: 22, borderRadius: 4, background: `linear-gradient(to right, ${C.low}, ${C.medium}, ${C.high}, ${C.vhigh})`, marginBottom: 6 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 9 }}>
                    <span>0</span><span>50</span><span>70</span><span>90</span><span>100</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 9, marginTop: 2 }}>
                    <span style={{ color: C.low }}>Disorder</span><span style={{ color: C.medium }}>Caution</span><span style={{ color: C.high }}>Reliable</span><span style={{ color: C.vhigh }}>Accurate</span>
                  </div>
                </Card>

                <Card title="Structural Analysis Tools Used">
                  {[
                    { tool: "P2Rank v2.1", use: "Ligand pocket detection on AlphaFold structures", result: "Identified DGAT2 inhibitor binding site" },
                    { tool: "AutoDock Vina v1.1.2", use: "Molecular docking (exhaust.=32, 25³ Å³ box)", result: "Validated DGAT2 pocket specificity vs DGAT1" },
                    { tool: "PyMOL align", use: "r.m.s.d. with outlier rejection (5 cycles)", result: "G6Pase active site: 0.56 Å vs 1IDQ (49/51 atoms)" },
                    { tool: "TM-align", use: "Global structure comparison", result: "Wolframin OB-fold: TM-score 0.472 vs best PDB hit" },
                    { tool: "HHSearch / HH-suite v3", use: "Template detection (PDB70)", result: "All three cases: found only distant or no templates" },
                    { tool: "Kalign", use: "Realign PDB70 hit to mmCIF full sequence", result: "Required when deposited & SEQRES sequences diverge" },
                  ].map(s => (
                    <div key={s.tool} style={{ marginBottom: 10, padding: "9px 11px", background: C.card2, borderRadius: 6 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "center" }}>
                        <span style={{ color: C.accent, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>{s.tool}</span>
                      </div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{s.use}</div>
                      <div style={{ color: C.text, fontSize: 10, marginTop: 2 }}>→ {s.result}</div>
                    </div>
                  ))}
                </Card>

                <Card title="Drug Discovery Workflow">
                  <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.65, marginBottom: 10 }}>
                    The DGAT2 case demonstrates a complete computational drug discovery pipeline on an AlphaFold model:
                  </div>
                  {["Pocket prediction (P2Rank)", "Inhibitor preparation (MGLTools)", "Docking & pose scoring (Vina)", "Selectivity test vs related enzyme", "Mutagenesis predictions (His163 > adjacent His)", "Experimental validation of predictions"].map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.vhigh}20`, border: `1px solid ${C.vhigh}60`, display: "flex", alignItems: "center", justifyContent: "center", color: C.vhigh, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ color: C.text, fontSize: 11 }}>{step}</span>
                    </div>
                  ))}
                  <Callout color={C.accent2}>This pipeline, enabled entirely by AlphaFold, identified actionable drug targets for NASH — a disease affecting 25% of adults globally with no approved therapy at the time.</Callout>
                </Card>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 9, letterSpacing: "0.1em", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
          <span>TUNYASUVUNAKOOL ET AL. · NATURE 596, 590–596 (2021) · DOI:10.1038/s41586-021-03828-1</span>
          <span>CC-BY-4.0 · ALPHAFOLD.EBI.AC.UK · DATABASE: 200M+ PROTEINS</span>
        </div>
      </div>
    </div>
  );
}
