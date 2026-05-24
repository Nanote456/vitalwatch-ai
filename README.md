# 🏥 VitalWatch AI — Remote Patient Monitoring

A real-time Remote Patient Monitoring (RPM) app inspired by 
Dozee Health AI, built with React Native and Expo.

---

## 🎯 Features
- 📊 Real-time monitoring of 6 vital signs
- 🤖 AI Risk Score (LOW/MEDIUM/HIGH/CRITICAL)
- 📈 Live ECG & SpO₂ waveforms
- 👥 Multi-patient dashboard (4 patients)
- 📋 Vitals history with risk tracking
- ⚡ Custom alert thresholds per vital
- 📤 Export vitals report as CSV
- 🌙 Dark/Light mode toggle
- ↑↓ Trend indicators on each vital

---

## 🛠️ Tech Stack
| Tool | Purpose |
|---|---|
| React Native | Mobile UI framework |
| Expo | Development platform |
| TypeScript | Type-safe JavaScript |
| react-native-chart-kit | ECG & sparkline charts |
| react-native-svg | Chart rendering |

---

## 📈 Vitals Monitored
- ❤️ Heart Rate (bpm)
- 🫁 SpO₂ (%)
- 🌡️ Temperature (°C)
- 💉 Blood Pressure (mmHg)
- 🌬️ Respiratory Rate (br/min)
- 🩸 Blood Glucose (mg/dL)

---

## 🤖 AI Risk Algorithm
Calculates real-time patient risk score (0–100) based on 
deviation of all 6 vitals from normal ranges simultaneously.

| Score | Risk Level |
|---|---|
| 0–19 | 🟢 LOW |
| 20–44 | 🟡 MEDIUM |
| 45–69 | 🟠 HIGH |
| 70–100 | 🔴 CRITICAL |

---

## 🚀 How to Run
git clone https://github.com/Nanote456/vitalwatch-ai.git
cd vitalwatch-ai
npm install
npx expo start --web

---

## 📁 Project Structure
vitalwatch-ai/
├── src/app/index.tsx    # Main app — all screens & logic
├── package.json         # Dependencies
└── README.md

---

## 👨‍💻 Author
**Nanote456**
GitHub: https://github.com/Nanote456
