"use client";

import { useEffect, useRef, useState } from "react";

type View = "reference" | "specification" | "processing" | "results" | "export";
type WaveformKind = "clean" | "motion" | "contact";
type EventKey = "vt" | "af" | "heart-block" | "svt";
type ArtifactKey = "clean" | "motion" | "contact" | "loss";

const eventOptions: Array<{
  key: EventKey;
  label: string;
  short: string;
  defaultMin: number;
  defaultMax: number;
}> = [
  { key: "vt", label: "Ventricular tachycardia", short: "VT", defaultMin: 130, defaultMax: 220 },
  { key: "af", label: "Atrial fibrillation", short: "AF", defaultMin: 90, defaultMax: 180 },
  { key: "heart-block", label: "Third-degree heart block", short: "AVB", defaultMin: 30, defaultMax: 60 },
  { key: "svt", label: "Supraventricular tachycardia", short: "SVT", defaultMin: 150, defaultMax: 240 },
];

const deviceOptions = [
  { value: "Ventura cardiac patch", calibration: "CAL-042", samplingRate: 250 },
  { value: "Three-lead Holter monitor", calibration: "CAL-018", samplingRate: 500 },
  { value: "Dry-electrode wearable", calibration: "CAL-057", samplingRate: 256 },
];

const artifactDefinitions: Array<{ key: ArtifactKey; label: string }> = [
  { key: "clean", label: "Clean signal" },
  { key: "motion", label: "Moderate motion" },
  { key: "contact", label: "Electrode degradation" },
  { key: "loss", label: "Packet loss" },
];

const pipelineSteps = [
  "Calibrating to device",
  "Generating physiological events",
  "Applying artifact conditions",
  "Running clinical validation",
  "Testing privacy & memorization",
  "Benchmarking model utility",
];

function Waveform({
  kind,
  animated = false,
  event = "vt",
  heartRate = 180,
}: {
  kind: WaveformKind;
  animated?: boolean;
  event?: EventKey;
  heartRate?: number;
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

      ctx.strokeStyle = "rgba(196, 178, 225, 0.10)";
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

      ctx.strokeStyle = "#a875ff";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(168, 117, 255, 0.36)";
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let x = 0; x <= width; x += 2) {
        const shiftedX = x + phase;
        const cycleWidth = Math.max(42, Math.min(112, 14000 / heartRate));
        const irregularity = event === "af" ? Math.sin(shiftedX * 0.035) * 11 : 0;
        const cycle = (((shiftedX + irregularity) % cycleWidth) + cycleWidth) % cycleWidth / cycleWidth;
        let signal = Math.sin(shiftedX * (event === "af" ? 0.31 : 0.085)) * (event === "af" ? 2 : 2.5);

        if (event === "vt") {
          if (cycle > 0.08 && cycle < 0.18) signal -= 7 * Math.sin(((cycle - 0.08) / 0.1) * Math.PI);
          if (cycle > 0.2 && cycle < 0.31) signal += 27 * Math.sin(((cycle - 0.2) / 0.11) * Math.PI);
          if (cycle > 0.31 && cycle < 0.39) signal -= 14 * Math.sin(((cycle - 0.31) / 0.08) * Math.PI);
          if (cycle > 0.48 && cycle < 0.72) signal += 6 * Math.sin(((cycle - 0.48) / 0.24) * Math.PI);
        } else {
          if (event !== "af" && cycle > 0.08 && cycle < 0.16) {
            signal += 5 * Math.sin(((cycle - 0.08) / 0.08) * Math.PI);
          }
          const droppedBeat = event === "heart-block" && Math.floor((shiftedX + irregularity) / cycleWidth) % 3 === 1;
          if (!droppedBeat && cycle > 0.23 && cycle < 0.28) {
            signal -= 11 * Math.sin(((cycle - 0.23) / 0.05) * Math.PI);
          }
          if (!droppedBeat && cycle > 0.28 && cycle < 0.34) {
            signal += (event === "svt" ? 23 : 29) * Math.sin(((cycle - 0.28) / 0.06) * Math.PI);
          }
          if (!droppedBeat && cycle > 0.34 && cycle < 0.4) {
            signal -= 10 * Math.sin(((cycle - 0.34) / 0.06) * Math.PI);
          }
          if (!droppedBeat && cycle > 0.55 && cycle < 0.74) {
            signal += 5 * Math.sin(((cycle - 0.55) / 0.19) * Math.PI);
          }
        }

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
  }, [kind, animated, event, heartRate]);

  return <canvas ref={canvasRef} className="waveform" aria-label={`${kind} ${event} waveform at ${heartRate} beats per minute`} />;
}

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true"><i /></span>
      <span>Rare</span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("specification");
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [exported, setExported] = useState(false);
  const [modality, setModality] = useState("Single-lead ECG");
  const [eventKey, setEventKey] = useState<EventKey>("vt");
  const [device, setDevice] = useState(deviceOptions[0].value);
  const [recordings, setRecordings] = useState(20000);
  const [duration, setDuration] = useState(30);
  const [heartRateMin, setHeartRateMin] = useState(130);
  const [heartRateMax, setHeartRateMax] = useState(220);
  const [artifacts, setArtifacts] = useState<Record<ArtifactKey, number>>({
    clean: 40,
    motion: 30,
    contact: 20,
    loss: 10,
  });

  const selectedEvent = eventOptions.find((option) => option.key === eventKey) ?? eventOptions[0];
  const selectedDevice = deviceOptions.find((option) => option.value === device) ?? deviceOptions[0];
  const averageHeartRate = Math.round((heartRateMin + heartRateMax) / 2);
  const patientHours = (recordings * duration) / 3600;
  const datasetCode = `RS-${selectedEvent.short}-2026-0727`;
  const packageSize = Math.max(0.2, 3.1 * (recordings * duration) / (20000 * 30));
  const exportPackageItems = [
    ["Synthetic waveforms", `${recordings.toLocaleString()} WFDB + CSV files`, `${Math.max(0.1, packageSize * 0.9).toFixed(1)} GB`],
    ["Clinical annotations", "Beat-level labels + event windows", `${Math.max(9, Math.round(packageSize * 59))} MB`],
    ["Dataset manifest", "Cohort, device, and split metadata", "1.2 MB"],
    ["Generation lineage", "Model version, parameters, seeds", "8.4 MB"],
    ["Privacy report", "Nearest-neighbor + memorization tests", "PDF"],
    ["Validation report", "Clinical, statistical, and coverage evidence", "PDF"],
    ["Model benchmark", "Held-out real-patient evaluation", "PDF"],
  ];

  const updateArtifact = (key: ArtifactKey, rawValue: number) => {
    const value = Math.max(0, Math.min(100, Math.round(rawValue)));
    const otherKeys = artifactDefinitions.map((item) => item.key).filter((item) => item !== key);
    const remaining = 100 - value;
    const otherTotal = otherKeys.reduce((sum, item) => sum + artifacts[item], 0);
    const next = { ...artifacts, [key]: value };

    if (otherTotal === 0) {
      const even = Math.floor(remaining / otherKeys.length);
      otherKeys.forEach((item, index) => {
        next[item] = index === otherKeys.length - 1 ? remaining - even * (otherKeys.length - 1) : even;
      });
    } else {
      let allocated = 0;
      otherKeys.forEach((item, index) => {
        const adjusted = index === otherKeys.length - 1
          ? remaining - allocated
          : Math.floor((artifacts[item] / otherTotal) * remaining);
        next[item] = Math.max(0, adjusted);
        allocated += next[item];
      });
    }
    setArtifacts(next);
  };

  const selectEvent = (nextKey: EventKey) => {
    const nextEvent = eventOptions.find((option) => option.key === nextKey) ?? eventOptions[0];
    setEventKey(nextKey);
    setHeartRateMin(nextEvent.defaultMin);
    setHeartRateMax(nextEvent.defaultMax);
  };

  const resetConfiguration = () => {
    setModality("Single-lead ECG");
    setEventKey("vt");
    setDevice(deviceOptions[0].value);
    setRecordings(20000);
    setDuration(30);
    setHeartRateMin(130);
    setHeartRateMax(220);
    setArtifacts({ clean: 40, motion: 30, contact: 20, loss: 10 });
  };

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
      dataset: datasetCode,
      modality,
      event: selectedEvent.label,
      recordings,
      duration_seconds: duration,
      sampling_rate_hz: selectedDevice.samplingRate,
      heart_rate_bpm: { minimum: heartRateMin, maximum: heartRateMax },
      device_calibration: `${device} / ${selectedDevice.calibration}`,
      artifact_mix_percent: artifacts,
      note: "Illustrative Rare demo package",
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rare-demo-manifest.json";
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
          <span className="workspace-name">Ventura Cardiac Â· R&amp;D</span>
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
            <span className="step-number">{index < stepIndex ? "âœ“" : step[0]}</span>
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
                <p>Rare uses a small representative cohort to learn device response, filtering, morphology, and artifact behavior.</p>
              </div>
              <span className="status-pill"><i /> Calibration ready</span>
            </div>

            <div className="reference-grid">
              <article className="reference-wave panel">
                <div className="panel-kicker"><span>LIVE SIGNAL PREVIEW</span><span>10 mm/mV Â· 25 mm/s</span></div>
                <Waveform kind="clean" animated />
                <div className="signal-footer"><span>Lead I</span><span>250 Hz</span><span>Bandpass 0.5â€“40 Hz</span></div>
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
                <div className="device-row"><span className="device-icon">âŒ</span><span><small>DEVICE PROFILE</small><strong>Ventura adhesive cardiac patch</strong></span></div>
              </article>
            </div>

            <div className="actions">
              <button className="secondary-button" onClick={() => setView("specification")}>Continue to dataset request <span>â†’</span></button>
            </div>
          </div>
        )}

        {view === "specification" && (
          <div className="spec-view enter">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">NEW DATASET Â· {datasetCode}</p>
                <h1>Generate the edge cases your model is missing.</h1>
                <p>Define a clinically constrained dataset matched to your device.</p>
              </div>
              <button className="reference-summary" onClick={() => setView("reference")}>
                <span className="mini-wave">âŒâŒâŒ</span>
                <span><small>CALIBRATED TO</small><strong>{device}</strong></span>
                <span className="ready-dot" />
              </button>
            </div>

            <div className="form-layout">
              <article className="panel request-panel">
                <div className="panel-title">
                  <div><span className="title-icon">01</span><span><strong>Physiological event</strong><small>Clinical generation constraints</small></span></div>
                  <button className="reset-config" onClick={resetConfiguration}>RESET DEFAULTS</button>
                </div>
                <div className="field-grid">
                  <label>
                    <span>Modality</span>
                    <select className="select-value" value={modality} onChange={(event) => setModality(event.target.value)}>
                      <option>Single-lead ECG</option>
                      <option>Three-lead ECG</option>
                    </select>
                  </label>
                  <label>
                    <span>Event</span>
                    <select className="select-value accent-value" value={eventKey} onChange={(event) => selectEvent(event.target.value as EventKey)}>
                      {eventOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Recordings</span>
                    <div className="number-value">
                      <input aria-label="Number of recordings" type="number" min="1000" max="100000" step="1000" value={recordings} onChange={(event) => setRecordings(Math.max(1000, Math.min(100000, Number(event.target.value))))} />
                    </div>
                  </label>
                  <label>
                    <span>Duration</span>
                    <div className="number-value">
                      <input aria-label="Recording duration in seconds" type="number" min="10" max="120" step="10" value={duration} onChange={(event) => setDuration(Math.max(10, Math.min(120, Number(event.target.value))))} />
                      <em>sec</em>
                    </div>
                  </label>
                  <label className="device-field">
                    <span>Device profile</span>
                    <select className="select-value" value={device} onChange={(event) => setDevice(event.target.value)}>
                      {deviceOptions.map((option) => <option key={option.value}>{option.value}</option>)}
                    </select>
                  </label>
                  <div className="heart-rate-field">
                    <span>Heart-rate range</span>
                    <div className="range-value">
                      <input aria-label="Minimum heart rate" type="number" min="25" max={heartRateMax - 5} value={heartRateMin} onChange={(event) => setHeartRateMin(Math.max(25, Math.min(heartRateMax - 5, Number(event.target.value))))} />
                      <div className="range-track"><i style={{ left: `${Math.max(0, (heartRateMin - 25) / 2.25)}%`, right: `${Math.max(0, 100 - (heartRateMax - 25) / 2.25)}%` }} /></div>
                      <input aria-label="Maximum heart rate" type="number" min={heartRateMin + 5} max="250" value={heartRateMax} onChange={(event) => setHeartRateMax(Math.min(250, Math.max(heartRateMin + 5, Number(event.target.value))))} />
                      <em>bpm</em>
                    </div>
                  </div>
                </div>
              </article>

              <article className="panel artifact-panel">
                <div className="panel-title">
                  <div><span className="title-icon">02</span><span><strong>Device &amp; artifact mix</strong><small>Real-world operating conditions</small></span></div>
                  <span className="total-badge">100% TOTAL</span>
                </div>
                <div className="mix-presets" aria-label="Artifact mix presets">
                  <button onClick={() => setArtifacts({ clean: 40, motion: 30, contact: 20, loss: 10 })}>Balanced</button>
                  <button onClick={() => setArtifacts({ clean: 20, motion: 35, contact: 30, loss: 15 })}>Field stress</button>
                  <button onClick={() => setArtifacts({ clean: 70, motion: 15, contact: 10, loss: 5 })}>Clean majority</button>
                </div>
                <div className="mix-bar" aria-label={`${artifacts.clean}% clean, ${artifacts.motion}% motion, ${artifacts.contact}% electrode degradation, ${artifacts.loss}% packet loss`}>
                  <i className="mix-clean" style={{ width: `${artifacts.clean}%` }} />
                  <i className="mix-motion" style={{ width: `${artifacts.motion}%` }} />
                  <i className="mix-contact" style={{ width: `${artifacts.contact}%` }} />
                  <i className="mix-loss" style={{ width: `${artifacts.loss}%` }} />
                </div>
                <div className="mix-list">
                  {artifactDefinitions.map((item) => (
                    <label className="mix-row" key={item.key}>
                      <span><i className={`dot ${item.key}`} />{item.label}</span>
                      <input aria-label={`${item.label} percentage`} type="range" min="0" max="100" value={artifacts[item.key]} onChange={(event) => updateArtifact(item.key, Number(event.target.value))} />
                      <strong>{artifacts[item.key]}%</strong>
                      <em>{Math.round(recordings * artifacts[item.key] / 100).toLocaleString()}</em>
                    </label>
                  ))}
                </div>
              </article>
            </div>

            <div className="generation-bar">
              <div className="generation-note"><span className="shield">âœ“</span><span><strong>Validation suite included</strong><small>Clinical Â· Statistical Â· Privacy Â· Downstream utility</small></span></div>
              <div className="generation-summary"><span><small>OUTPUT</small><strong>{patientHours.toFixed(1)} patient-hours</strong></span><button onClick={() => setView("processing")}>Generate {recordings.toLocaleString()} recordings <b>â†’</b></button></div>
            </div>
          </div>
        )}

        {view === "processing" && (
          <div className="processing-view enter">
            <div className="processing-visual">
              <div className="processing-ring"><span>{Math.round(((pipelineIndex + 1) / pipelineSteps.length) * 100)}%</span></div>
              <p className="eyebrow">SYNTHESIS PIPELINE</p>
              <h1>{pipelineSteps[pipelineIndex]}</h1>
              <p>Building {recordings.toLocaleString()} device-matched {selectedEvent.short} recordings</p>
            </div>
            <div className="pipeline-list">
              {pipelineSteps.map((step, index) => (
                <div key={step} className={`pipeline-step ${index < pipelineIndex ? "done" : ""} ${index === pipelineIndex ? "running" : ""}`}>
                  <span>{index < pipelineIndex ? "âœ“" : String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                  <em>{index < pipelineIndex ? "Complete" : index === pipelineIndex ? "Running" : "Queued"}</em>
                </div>
              ))}
            </div>
            <div className="processing-wave"><Waveform kind="motion" event={eventKey} heartRate={averageHeartRate} animated /></div>
            <small className="demo-note">Simulated processing for product demonstration</small>
          </div>
        )}

        {view === "results" && (
          <div className="results-view enter">
            <div className="results-header">
              <div>
                <p className="eyebrow">VALIDATION COMPLETE Â· {datasetCode}</p>
                <h1>{recordings.toLocaleString()} recordings. Ready to use.</h1>
                <p>Synthetic {selectedEvent.short} data matched to the {device} and validated against untouched real recordings.</p>
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
                <div className="panel-kicker"><span>STRATIFIED WAVEFORM PREVIEW</span><span>3 OF {recordings.toLocaleString()}</span></div>
                {[
                  [`${selectedEvent.short} Â· clean`, `HR ${averageHeartRate} bpm`, "SQI 0.98", "clean" as WaveformKind],
                  [`${selectedEvent.short} Â· moderate motion`, `HR ${Math.max(25, averageHeartRate - 8)} bpm`, "SQI 0.82", "motion" as WaveformKind],
                  [`${selectedEvent.short} Â· electrode degradation`, `HR ${Math.min(250, averageHeartRate + 7)} bpm`, "SQI 0.74", "contact" as WaveformKind],
                ].map((wave) => (
                  <div className="preview-row" key={wave[0]}>
                    <div><strong>{wave[0]}</strong><span>{wave[1]} Â· {wave[2]}</span></div>
                    <Waveform kind={wave[3]} event={eventKey} heartRate={averageHeartRate} />
                    <span className="calibrated-tag">DEVICE MATCHED</span>
                  </div>
                ))}
              </article>

              <article className="panel benchmark-panel">
                <div className="panel-kicker"><span>HELD-OUT MODEL BENCHMARK</span><span className="illustrative">ILLUSTRATIVE</span></div>
                <p>Rare-event sensitivity on untouched real-patient data</p>
                <div className="benchmark-value"><span>72.4%</span><b>â†’</b><strong>86.6%</strong></div>
                <div className="benchmark-bars">
                  <div><span>Real data only</span><i><b style={{ width: "72.4%" }} /></i></div>
                  <div className="synthetic"><span>Real + Rare</span><i><b style={{ width: "86.6%" }} /></i></div>
                </div>
                <div className="benchmark-footer"><span>+14.2 percentage points</span><small>False-positive rate held constant</small></div>
              </article>
            </div>

            <div className="result-actions">
              <span>Illustrative demo values Â· Not clinical claims</span>
              <button onClick={() => setView("export")}>Review export package <b>â†’</b></button>
            </div>
          </div>
        )}

        {view === "export" && (
          <div className="export-view enter">
            <div className="export-heading">
              <div className="package-icon">RS</div>
              <div>
                <p className="eyebrow">DATASET PACKAGE Â· {datasetCode}</p>
                <h1>Evidence included.</h1>
                <p>Usable waveforms, precise labels, complete lineage, and validationâ€”not just generated signal images.</p>
              </div>
              <div className="package-size"><small>PACKAGE SIZE</small><strong>{packageSize.toFixed(1)} GB</strong><span>{recordings.toLocaleString()} recordings</span></div>
            </div>

            <div className="export-layout">
              <article className="panel package-list">
                <div className="panel-kicker"><span>PACKAGE CONTENTS</span><span>7 ITEMS</span></div>
                {exportPackageItems.map((item) => (
                  <div className="package-row" key={item[0]}>
                    <span className="file-check">âœ“</span>
                    <span><strong>{item[0]}</strong><small>{item[1]}</small></span>
                    <em>{item[2]}</em>
                  </div>
                ))}
              </article>

              <aside className="export-side">
                <article className="panel lineage-card">
                  <div className="panel-kicker"><span>TRACEABILITY</span><span className="verified">COMPLETE</span></div>
                  <dl>
                    <div><dt>Dataset version</dt><dd>{datasetCode}</dd></div>
                    <div><dt>Model version</dt><dd>physio-diffusion-v0.8</dd></div>
                    <div><dt>Device calibration</dt><dd>{selectedDevice.calibration}</dd></div>
                    <div><dt>Validation cohort</dt><dd>HELDOUT-VENTURA-03</dd></div>
                  </dl>
                </article>
                <button className="download-button" onClick={exportManifest}><span>Export validated dataset</span><b>â†“</b></button>
                <small className="export-disclaimer">Demo downloads a representative manifest. Production exports include the full encrypted dataset package.</small>
              </aside>
            </div>

            <button className="restart-link" onClick={() => setView("specification")}>â†» Run demo again</button>
          </div>
        )}
      </section>

      <footer>
        <span>Rare Â· Synthetic physiological data infrastructure</span>
        <span>For training, robustness testing, and preclinical validation</span>
      </footer>

      {exported && <div className="toast"><span>âœ“</span> Demo manifest exported</div>}
    </main>
  );
}
