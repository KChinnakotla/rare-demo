# RareSignal YC Demo

An interactive product demo for RareSignal, a platform that generates validated,
device-matched synthetic physiological-signal datasets for medical-device teams.

The demo follows one focused ECG workflow:

1. Review a preloaded cardiac-patch reference cohort.
2. Define a 20,000-recording ventricular-tachycardia dataset.
3. Run a simulated generation and validation pipeline.
4. Review waveform previews, validation evidence, and an illustrative benchmark.
5. Export the validated dataset package.

All displayed validation and performance metrics are clearly labeled as
illustrative demo values.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (normally
`http://localhost:3000`).

## Verify the production build

```bash
npm run build
npm test
```
