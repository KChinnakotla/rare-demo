"use client";

import { useEffect, useRef, useState } from "react";

type View = "reference" | "specification" | "processing" | "results" | "export";
type WaveformKind = "clean" | "motion" | "contact";

const pipelineSteps = [
  "Calibrating to device",
  "Generating physiological events",
  "Applying artifact conditions",
  "Running clinical validation",
  "Testing privacy & memorization",
  "Benchmarking model utility",
];

const packageItems = [
  ["Synthetic waveforms", "20,000 WFDB + CSV files", "2.8 GB"],
  ["Clinical annotations", "Beat-level labels + event windows", "184 MB"],
  ["Dataset manifest", "Cohort, device, and split metadata", "1.2 MB"],
  ["Generation lineage", "Model version, parameters, seeds", "8.4 MB"],
  ["Privacy report", "Nearest-neighbor + memorization tests", "PDF"],
  ["Validation report", "Clinical, statistical, and coverage evidence", "PDF"],
  ["Model benchmark", "Held-out real-patient evaluation", "PDF"],
];

function Waveform({
  kind,
  animated = false,
}: {
  kind: WaveformKind;
  animated?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (phase = 0) => {
      const scale = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(181, 210, 202, 0.10)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "#65dfbd";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(101, 223, 189, 0.32)";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let x = 0; x <= width; x += 2) {
        const shiftedX = x + phase;
        const cycle = (shiftedX % 76) / 76;
        let signal = Math.sin(shiftedX * 0.085) * 2.5;

        if (cycle > 0.08 && cycle < 0.18) signal -= 7 * Math.sin(((cycle - 0.08) / 0.1) * Math.PI);
        if (cycle > 0.2 && cycle < 0.31) signal += 27 * Math.sin(((cycle - 0.2) / 0.11) * Math.PI);
        if (cycle > 0.31 && cycle < 0.39) signal -= 14 * Math.sin(((cycle - 0.31) / 0.08) * Math.PI);
        if (cycle > 0.48 && cycle < 0.72) signal += 6 * Math.sin(((cycle - 0.48) / 0.24) * Math.PI);

        if (kind === "motion") {
          signal += Math.sin(shiftedX * 0.028) * 9 + Math.sin(shiftedX * 0.71) * 2.3;
        }

        if (kind === "contact" && cycle > 0.54 && cycle < 0.82) {
          signal = Math.sin(shiftedX * 1.3) * 1.1;
        }

        const y = height / 2 - signal;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    let frame = 0;
    let raf = 0;
    const render = () => {
      draw(frame);
      frame = (frame + 0.7) % 76;
      raf = requestAnimationFrame(render);
    };

    if (animated) render();
    else draw();

    const onResize = () => draw(frame);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [kind, animated]);

  return <canvas ref={canvasRef} className="waveform" aria-label={`${kind} ventricular tachycardia waveform`} />;
}

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true"><i /></span>
      <span>RareSignal</span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("specification");
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (view !== "processing") return;
    setPipelineIndex(0);
    const interval = window.setInterval(() => {
      setPipelineIndex((current) => {
        if (current >= pipelineSteps.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => setView("results"), 650);
          return current;
        }
        return current + 1;
      });
    }, 620);
    return () => window.clearInterval(interval);
  }, [view]);

  const stepIndex =
    view === "reference" ? 0 :
    view === "specification" || view === "processing" ? 1 :
    view === "results" ? 2 : 3;

  const exportManifest = () => {
    const manifest = {
      dataset: "RS-VT-2026-0727",
      modality: "single-lead ECG",
      event: "ventricular tachycardia",
      recordings: 20000,
      duration_seconds: 30,
      sampling_rate_hz: 250,
      device_calibration: "Adhesive patch / CAL-042",
      note: "Illustrative RareSignal demo package",
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "raresignal-demo-manifest.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2600);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <Logo />
        <div className="topbar-right">
          <span className="demo-chip">ILLUSTRATIVE DEMO</span>
          <span className="workspace-name">Ventura Cardiac · R&amp;D</span>
          <span className="avatar">VC</span>
        </div>
      </header>

      <nav className="stepper" aria-label="Dataset generation workflow">
        {[
          ["01", "Reference data", "Device calibrated"],
          ["02", "Dataset request", "Define edge cases"],
          ["03", "Validation", "Review evidence"],
          ["04", "Export", "Download package"],
        ].map((step, index) => (
          <button
            key={step[1]}
            className={`step ${index === stepIndex ? "active" : ""} ${index < stepIndex ? "complete" : ""}`}
            onClick={() => {
              if (index === 0) setView("reference");
              if (index === 1) setView("specification");
              if (index === 2 && stepIndex >= 2) setView("results");
              if (index === 3 && stepIndex >= 3) setView("export");
            }}
          >
            <span className="step-number">{index < stepIndex ? "✓" : step[0]}</span>
            <span><strong>{step[1]}</strong><small>{step[2]}</small></span>
          </button>
        ))}
      </nav>

      <section className="workspace">
        {view === "reference" && (
          <div className="single-view enter">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DEVICE REFERENCE COHORT</p>
                <h1>Your signal. Your hardware. Calibrated.</h1>
                <p>RareSignal uses a small representative cohort to learn device response, filtering, morphology, and artifact behavior.</p>
              </div>
              <span className="status-pill"><i /> Calibration ready</span>
            </div>

            <div className="reference-grid">
              <article className="reference-wave panel">
                <div className="panel-kicker"><span>LIVE SIGNAL PREVIEW</span><span>10 mm/mV · 25 mm/s</span></div>
                <Waveform kind="clean" animated />
                <div className="signal-footer"><span>Lead I</span><span>250 Hz</span><span>Bandpass 0.5–40 Hz</span></div>
              </article>
              <article className="panel cohort-panel">
                <div className="panel-kicker"><span>COHORT RS-CAL-042</span><span className="verified">VERIFIED</span></div>
                <div className="big-stat"><strong>542</strong><span>recordings uploaded</span></div>
                <div className="stat-pairs">
                  <div><strong>163</strong><span>Patient-hours</span></div>
                  <div><strong>42</strong><span>Real VT events</span></div>
                  <div><strong>1</strong><span>ECG lead</span></div>
                  <div><strong>250</strong><span>Sampling rate, Hz</span></div>
                </div>
                <div className="device-row"><span className="device-icon">⌁</span><span><small>DEVICE PROFILE</small><strong>Ventura adhesive cardiac patch</strong></span></div>
              </article>
            </div>

            <div className="actions">
              <button className="secondary-button" onClick={() => setView("specification")}>Continue to dataset request <span>→</span></button>
            </div>
          </div>
        )}

        {view === "specification" && (
          <div className="spec-view enter">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">NEW DATASET · RS-VT-2026-0727</p>
                <h1>Generate the edge cases your model is missing.</h1>
                <p>Define a clinically constrained dataset matched to your device.</p>
              </div>
              <button className="reference-summary" onClick={() => setView("reference")}>
                <span className="mini-wave">⌁⌁⌁</span>
                <span><small>CALIBRATED TO</small><strong>Ventura cardiac patch</strong></span>
                <span className="ready-dot" />
              </button>
            </div>

            <div className="form-layout">
              <article className="panel request-panel">
                <div className="panel-title">
                  <div><span className="title-icon">01</span><span><strong>Physiological event</strong><small>Clinical generation constraints</small></span></div>
                  <span className="locked">CONSTRAINED</span>
                </div>
                <div className="field-grid">
                  <label><span>Modality</span><div className="select-value">Single-lead ECG <b>⌄</b></div></label>
                  <label><span>Event</span><div className="select-value accent-value">Ventricular tachycardia <b>⌄</b></div></label>
                  <label><span>Recordings</span><div className="number-value">20,000</div></label>
                  <label><span>Duration</span><div className="number-value">30 <em>seconds</em></div></label>
                  <label className="wide"><span>Heart-rate range</span><div className="range-value"><strong>130</strong><div className="range-track"><i /></div><strong>220</strong><em>bpm</em></div></label>
                </div>
              </article>

              <article className="panel artifact-panel">
                <div className="panel-title">
                  <div><span className="title-icon">02</span><span><strong>Device &amp; artifact mix</strong><small>Real-world operating conditions</small></span></div>
                  <span className="total-badge">100% TOTAL</span>
                </div>
                <div className="mix-bar" aria-label="40% clean, 30% motion, 20% electrode degradation, 10% packet loss">
                  <i className="mix-clean" /><i className="mix-motion" /><i className="mix-contact" /><i className="mix-loss" />
                </div>
                <div className="mix-list">
                  <div><span><i className="dot clean" />Clean signal</span><strong>40%</strong><em>8,000</em></div>
                  <div><span><i className="dot motion" />Moderate motion</span><strong>30%</strong><em>6,000</em></div>
                  <div><span><i className="dot contact" />Electrode degradation</span><strong>20%</strong><em>4,000</em></div>
                  <div><span><i className="dot loss" />Packet loss</span><strong>10%</strong><em>2,000</em></div>
                </div>
              </article>
            </div>

            <div className="generation-bar">
              <div className="generation-note"><span className="shield">✓</span><span><strong>Validation suite included</strong><small>Clinical · Statistical · Privacy · Downstream utility</small></span></div>
              <div className="generation-summary"><span><small>OUTPUT</small><strong>166.7 patient-hours</strong></span><button onClick={() => setView("processing")}>Generate validated dataset <b>→</b></button></div>
            </div>
          </div>
        )}

        {view === "processing" && (
          <div className="processing-view enter">
            <div className="processing-visual">
              <div className="processing-ring"><span>{Math.round(((pipelineIndex + 1) / pipelineSteps.length) * 100)}%</span></div>
              <p className="eyebrow">SYNTHESIS PIPELINE</p>
              <h1>{pipelineSteps[pipelineIndex]}</h1>
              <p>Building 20,000 device-matched VT recordings</p>
            </div>
            <div className="pipeline-list">
              {pipelineSteps.map((step, index) => (
                <div key={step} className={`pipeline-step ${index < pipelineIndex ? "done" : ""} ${index === pipelineIndex ? "running" : ""}`}>
                  <span>{index < pipelineIndex ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                  <em>{index < pipelineIndex ? "Complete" : index === pipelineIndex ? "Running" : "Queued"}</em>
                </div>
              ))}
            </div>
            <div className="processing-wave"><Waveform kind="motion" animated /></div>
            <small className="demo-note">Simulated processing for product demonstration</small>
          </div>
        )}

        {view === "results" && (
          <div className="results-view enter">
            <div className="results-header">
              <div>
                <p className="eyebrow">VALIDATION COMPLETE · RS-VT-2026-0727</p>
                <h1>20,000 recordings. Ready to use.</h1>
                <p>Synthetic VT data matched to the Ventura patch and validated against untouched real recordings.</p>
              </div>
              <span className="status-pill"><i /> All checks passed</span>
            </div>

            <div className="metrics-row">
              <div><span>CLINICAL AGREEMENT</span><strong>96.8%</strong><small>Board-certified review model</small></div>
              <div><span>DISTRIBUTION COVERAGE</span><strong>98.1%</strong><small>Held-out real cohort</small></div>
              <div><span>MEMORIZED RECORDINGS</span><strong>0</strong><small>Nearest-neighbor audit</small></div>
              <div className="metric-accent"><span>SENSITIVITY LIFT</span><strong>+14.2<sup>pp</sup></strong><small>At fixed false-positive rate</small></div>
            </div>

            <div className="results-grid">
              <article className="panel previews-panel">
                <div className="panel-kicker"><span>STRATIFIED WAVEFORM PREVIEW</span><span>3 OF 20,000</span></div>
                {[
                  ["VT · clean", "HR 184 bpm", "SQI 0.98", "clean" as WaveformKind],
                  ["VT · moderate motion", "HR 172 bpm", "SQI 0.82", "motion" as WaveformKind],
                  ["VT · electrode degradation", "HR 191 bpm", "SQI 0.74", "contact" as WaveformKind],
                ].map((wave) => (
                  <div className="preview-row" key={wave[0]}>
                    <div><strong>{wave[0]}</strong><span>{wave[1]} · {wave[2]}</span></div>
                    <Waveform kind={wave[3]} />
                    <span className="calibrated-tag">DEVICE MATCHED</span>
                  </div>
                ))}
              </article>

              <article className="panel benchmark-panel">
                <div className="panel-kicker"><span>HELD-OUT MODEL BENCHMARK</span><span className="illustrative">ILLUSTRATIVE</span></div>
                <p>Rare-event sensitivity on untouched real-patient data</p>
                <div className="benchmark-value"><span>72.4%</span><b>→</b><strong>86.6%</strong></div>
                <div className="benchmark-bars">
                  <div><span>Real data only</span><i><b style={{ width: "72.4%" }} /></i></div>
                  <div className="synthetic"><span>Real + RareSignal</span><i><b style={{ width: "86.6%" }} /></i></div>
                </div>
                <div className="benchmark-footer"><span>+14.2 percentage points</span><small>False-positive rate held constant</small></div>
              </article>
            </div>

            <div className="result-actions">
              <span>Illustrative demo values · Not clinical claims</span>
              <button onClick={() => setView("export")}>Review export package <b>→</b></button>
            </div>
          </div>
        )}

        {view === "export" && (
          <div className="export-view enter">
            <div className="export-heading">
              <div className="package-icon">RS</div>
              <div>
                <p className="eyebrow">DATASET PACKAGE · RS-VT-2026-0727</p>
                <h1>Evidence included.</h1>
                <p>Usable waveforms, precise labels, complete lineage, and validation—not just generated signal images.</p>
              </div>
              <div className="package-size"><small>PACKAGE SIZE</small><strong>3.1 GB</strong><span>20,000 recordings</span></div>
            </div>

            <div className="export-layout">
              <article className="panel package-list">
                <div className="panel-kicker"><span>PACKAGE CONTENTS</span><span>7 ITEMS</span></div>
                {packageItems.map((item) => (
                  <div className="package-row" key={item[0]}>
                    <span className="file-check">✓</span>
                    <span><strong>{item[0]}</strong><small>{item[1]}</small></span>
                    <em>{item[2]}</em>
                  </div>
                ))}
              </article>

              <aside className="export-side">
                <article className="panel lineage-card">
                  <div className="panel-kicker"><span>TRACEABILITY</span><span className="verified">COMPLETE</span></div>
                  <dl>
                    <div><dt>Dataset version</dt><dd>RS-VT-2026-0727</dd></div>
                    <div><dt>Model version</dt><dd>physio-diffusion-v0.8</dd></div>
                    <div><dt>Device calibration</dt><dd>CAL-042</dd></div>
                    <div><dt>Validation cohort</dt><dd>HELDOUT-VENTURA-03</dd></div>
                  </dl>
                </article>
                <button className="download-button" onClick={exportManifest}><span>Export validated dataset</span><b>↓</b></button>
                <small className="export-disclaimer">Demo downloads a representative manifest. Production exports include the full encrypted dataset package.</small>
              </aside>
            </div>

            <button className="restart-link" onClick={() => setView("specification")}>↻ Run demo again</button>
          </div>
        )}
      </section>

      <footer>
        <span>RareSignal · Synthetic physiological data infrastructure</span>
        <span>For training, robustness testing, and preclinical validation</span>
      </footer>

      {exported && <div className="toast"><span>✓</span> Demo manifest exported</div>}
    </main>
  );
}
