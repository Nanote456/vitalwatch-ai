import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Switch, Modal, TextInput, Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const SCREEN_W = Dimensions.get("window").width;

type Vital = {
  label: string; value: number; unit: string;
  min: number; max: number; icon: string; color: string;
  history: number[];
};

type Patient = {
  id: string; name: string; age: number; bed: string;
  diagnosis: string; doctor: string; bloodGroup: string;
  admitted: string; emergency: string; allergies: string;
  medications: string;
};

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const PATIENTS: Patient[] = [
  { id: "DZE-001", name: "Aditya Sharma", age: 45, bed: "12B - ICU", diagnosis: "Post-cardiac surgery", doctor: "Dr. Priya Mehta", bloodGroup: "O+", admitted: "23 May 2026", emergency: "+91 98765 43210", allergies: "Penicillin", medications: "Metoprolol, Warfarin" },
  { id: "DZE-002", name: "Sunita Patel", age: 62, bed: "7A - General", diagnosis: "Type 2 Diabetes", doctor: "Dr. Rahul Verma", bloodGroup: "A+", admitted: "20 May 2026", emergency: "+91 91234 56789", allergies: "Aspirin", medications: "Metformin, Insulin" },
  { id: "DZE-003", name: "Rajan Kumar", age: 38, bed: "3C - HDU", diagnosis: "Pneumonia", doctor: "Dr. Anjali Singh", bloodGroup: "B+", admitted: "22 May 2026", emergency: "+91 94567 89012", allergies: "None", medications: "Amoxicillin, Azithromycin" },
  { id: "DZE-004", name: "Meera Joshi", age: 55, bed: "9D - ICU", diagnosis: "Stroke recovery", doctor: "Dr. Vikram Nair", bloodGroup: "AB-", admitted: "18 May 2026", emergency: "+91 97890 12345", allergies: "Sulfa drugs", medications: "Aspirin, Atorvastatin" },
];

function generateVitals(prev?: Vital[]): Vital[] {
  const templates = [
    { label: "Heart Rate", unit: "bpm", min: 60, max: 100, icon: "❤️", color: "#FF4757", base: 75, range: 20 },
    { label: "SpO₂", unit: "%", min: 95, max: 100, icon: "🫁", color: "#1E90FF", base: 97, range: 4 },
    { label: "Temperature", unit: "°C", min: 36.1, max: 37.5, icon: "🌡️", color: "#FF6B35", base: 36.8, range: 1.5 },
    { label: "Blood Pressure", unit: "mmHg", min: 90, max: 130, icon: "💉", color: "#9B59B6", base: 115, range: 25 },
    { label: "Resp. Rate", unit: "br/min", min: 12, max: 20, icon: "🌬️", color: "#2ECC71", base: 16, range: 6 },
    { label: "Blood Glucose", unit: "mg/dL", min: 70, max: 140, icon: "🩸", color: "#F39C12", base: 100, range: 50 },
  ];
  return templates.map((t, i) => {
    const prevVal = prev?.[i]?.value ?? t.base;
    const delta = (Math.random() - 0.5) * (t.range * 0.3);
    const raw = prevVal + delta;
    const value = parseFloat(Math.max(t.base - t.range, Math.min(t.base + t.range, raw)).toFixed(t.unit === "°C" ? 1 : 0));
    const prevHistory = prev?.[i]?.history ?? Array(10).fill(t.base);
    return { ...t, value, history: [...prevHistory.slice(-9), value] };
  });
}

function calcRisk(vitals: Vital[]): { level: RiskLevel; score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  vitals.forEach((v) => {
    const range = v.max - v.min;
    if (v.value < v.min) { score += ((v.min - v.value) / range) * 40; reasons.push(`Low ${v.label}`); }
    else if (v.value > v.max) { score += ((v.value - v.max) / range) * 40; reasons.push(`High ${v.label}`); }
  });
  score = Math.min(100, score);
  const level: RiskLevel = score >= 70 ? "CRITICAL" : score >= 45 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  return { level, score: Math.round(score), reason: reasons.join(", ") || "All vitals stable" };
}

function getTrend(history: number[]): string {
  if (history.length < 2) return "→";
  const diff = history[history.length - 1] - history[history.length - 2];
  if (Math.abs(diff) < 0.5) return "→";
  return diff > 0 ? "↑" : "↓";
}

function exportCSV(vitals: Vital[], patient: Patient): void {
  const rows = ["Vital,Value,Unit,Status,Trend"];
  vitals.forEach((v) => {
    const status = v.value < v.min || v.value > v.max ? "ABNORMAL" : "NORMAL";
    rows.push(`${v.label},${v.value},${v.unit},${status},${getTrend(v.history)}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${patient.name.replace(" ", "_")}_vitals_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ECGChart({ color }: { color: string }) {
  const [data, setData] = useState<number[]>(Array(20).fill(0));
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t += 0.3;
      setData((prev) => {
        const ecg = Math.abs(t % 6 - 3) < 0.3 ? 80 : Math.abs(t % 6 - 3.3) < 0.15 ? -20 : Math.abs(t % 6 - 3.6) < 0.3 ? 60 : 5 + Math.sin(t * 2) * 3;
        return [...prev.slice(1), ecg];
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);
  return (
    <LineChart
      data={{ labels: [], datasets: [{ data, color: () => color }] }}
      width={SCREEN_W - 48} height={80} withDots={false} withInnerLines={false}
      withOuterLines={false} withVerticalLabels={false} withHorizontalLabels={false}
      chartConfig={{ backgroundColor: "transparent", backgroundGradientFrom: "#111827", backgroundGradientTo: "#111827", color: () => color, strokeWidth: 2 }}
      bezier style={{ borderRadius: 8, marginVertical: 4 }}
    />
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const safeData = data.length >= 2 ? data : [...data, ...Array(2).fill(data[0] ?? 0)];
  return (
    <LineChart
      data={{ labels: [], datasets: [{ data: safeData }] }}
      width={100} height={36} withDots={false} withInnerLines={false}
      withOuterLines={false} withVerticalLabels={false} withHorizontalLabels={false}
      chartConfig={{ backgroundColor: "transparent", backgroundGradientFrom: "transparent", backgroundGradientTo: "transparent", color: () => color, strokeWidth: 1.5 }}
      bezier style={{ paddingRight: 0 }}
    />
  );
}

export default function App() {
  const [vitals, setVitals] = useState<Vital[]>(generateVitals());
  const [history, setHistory] = useState<{ time: string; vitals: Vital[]; risk: ReturnType<typeof calcRisk> }[]>([]);
  const [activeTab, setActiveTab] = useState<"monitor" | "ecg" | "history" | "patients" | "settings">("monitor");
  const [activePatient, setActivePatient] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showThresholds, setShowThresholds] = useState(false);
  const [thresholds, setThresholds] = useState(vitals.map((v) => ({ min: v.min, max: v.max })));
  const pulse = useRef(new Animated.Value(1)).current;
  const theme = isDark ? darkTheme : lightTheme;
  const risk = calcRisk(vitals);

  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.5, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    if (isLive) anim.start(); else anim.stop();
    return () => anim.stop();
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setVitals((prev) => {
        const next = generateVitals(prev).map((v, i) => ({ ...v, min: thresholds[i].min, max: thresholds[i].max }));
        const r = calcRisk(next);
        setHistory((h) => [{ time: new Date().toLocaleTimeString(), vitals: next, risk: r }, ...h].slice(0, 30));
        setLastUpdated(new Date());
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, thresholds]);

  const alertCount = vitals.filter((v) => v.value < v.min || v.value > v.max).length;
  const riskColors: Record<RiskLevel, string> = { LOW: "#2ECC71", MEDIUM: "#F39C12", HIGH: "#FF6B35", CRITICAL: "#FF4757" };
  const riskBg: Record<RiskLevel, string> = { LOW: "#0A2A0A", MEDIUM: "#2A1A00", HIGH: "#2A1000", CRITICAL: "#2A0000" };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>🏥 VitalWatch AI</Text>
          <Text style={[styles.headerSub, { color: theme.sub }]}>Remote Patient Monitoring</Text>
        </View>
        <View style={styles.headerRight}>
          {alertCount > 0 && <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>⚠️ {alertCount}</Text></View>}
          <TouchableOpacity style={[styles.liveBtn, { borderColor: isLive ? "#2ECC71" : "#555" }]} onPress={() => setIsLive((v) => !v)}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }], backgroundColor: isLive ? "#2ECC71" : "#555" }]} />
            <Text style={[styles.liveBtnText, { color: isLive ? "#2ECC71" : "#555" }]}>{isLive ? "LIVE" : "PAUSED"}</Text>
          </TouchableOpacity>
          <Switch value={isDark} onValueChange={setIsDark} thumbColor={isDark ? "#1E90FF" : "#FFF"} trackColor={{ true: "#1E3A5F", false: "#CCC" }} />
        </View>
      </View>

      <View style={[styles.patientBar, { backgroundColor: theme.card2 }]}>
        <Text style={[styles.patientText, { color: theme.sub }]}>👤 {PATIENTS[activePatient].name} · Age {PATIENTS[activePatient].age} · {PATIENTS[activePatient].bed}</Text>
        <Text style={[styles.patientTime, { color: theme.muted }]}>{lastUpdated.toLocaleTimeString()}</Text>
      </View>

      <View style={[styles.riskBanner, { backgroundColor: riskBg[risk.level] }]}>
        <View style={[styles.riskBadge, { backgroundColor: riskColors[risk.level] }]}><Text style={styles.riskBadgeText}>{risk.level}</Text></View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.riskScore, { color: riskColors[risk.level] }]}>AI Risk Score: {risk.score}/100</Text>
          <Text style={[styles.riskReason, { color: theme.sub }]}>{risk.reason}</Text>
        </View>
        <View style={[styles.riskBar, { backgroundColor: theme.card }]}>
          <View style={[styles.riskBarFill, { width: `${risk.score}%`, backgroundColor: riskColors[risk.level] }]} />
        </View>
      </View>

      {alertCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>🚨 {alertCount} vital{alertCount > 1 ? "s" : ""} out of range! Immediate attention required.</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsScroll, { backgroundColor: theme.card }]}>
        {(["monitor", "ecg", "history", "patients", "settings"] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: "#1E90FF", borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? "#1E90FF" : theme.sub }]}>
              {tab === "monitor" ? "📊 Monitor" : tab === "ecg" ? "📈 ECG" : tab === "history" ? "📋 History" : tab === "patients" ? "👥 Patients" : "⚙️ Settings"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "monitor" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {vitals.map((vital, i) => {
              const abnormal = vital.value < vital.min || vital.value > vital.max;
              const trend = getTrend(vital.history);
              return (
                <View key={i} style={[styles.card, { backgroundColor: theme.card, borderLeftColor: vital.color }, abnormal && styles.cardAlert]}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardIcon}>{vital.icon}</Text>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: abnormal ? "#FF4757" : "#2ECC71" }}>{trend}</Text>
                    {abnormal && <View style={styles.abnormalDot} />}
                  </View>
                  <Text style={[styles.cardLabel, { color: theme.sub }]}>{vital.label}</Text>
                  <Text style={[styles.cardValue, { color: abnormal ? "#FF4757" : vital.color }]}>{vital.value}</Text>
                  <Text style={[styles.cardUnit, { color: theme.muted }]}>{vital.unit}</Text>
                  <Sparkline data={vital.history} color={abnormal ? "#FF4757" : vital.color} />
                  <View style={styles.cardRangeRow}>
                    <Text style={[styles.cardRange, { color: theme.muted }]}>{vital.min}–{vital.max}</Text>
                    {abnormal && <Text style={styles.cardAlertText}>⚠️ ABNORMAL</Text>}
                  </View>
                  <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: `${Math.min(Math.max(((vital.value - vital.min) / (vital.max - vital.min)) * 100, 0), 100)}%`, backgroundColor: abnormal ? "#FF4757" : vital.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={() => exportCSV(vitals, PATIENTS[activePatient])}>
            <Text style={styles.exportBtnText}>📤 Export Vitals Report (CSV)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === "ecg" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📈 Live ECG Waveform</Text>
          {[
            { title: "❤️ Cardiac Monitor", sub: "Lead II — Continuous monitoring", color: "#2ECC71", val: `${vitals[0]?.value ?? 72} bpm` },
            { title: "🫁 SpO₂ Plethysmograph", sub: "Photoplethysmography (PPG)", color: "#1E90FF", val: `${vitals[1]?.value ?? 97}%` },
            { title: "🌬️ Respiration", sub: "Thoracic impedance", color: "#F39C12", val: `${vitals[4]?.value ?? 16} br/min` },
          ].map((item, i) => (
            <View key={i} style={[styles.ecgCard, { backgroundColor: theme.card }]}>
              <View style={styles.ecgHeader}>
                <Text style={[styles.ecgTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={[styles.ecgHR, { color: item.color }]}>{item.val}</Text>
              </View>
              <ECGChart color={item.color} />
              <Text style={[styles.ecgSub, { color: theme.muted }]}>{item.sub}</Text>
            </View>
          ))}
          <View style={[styles.vitalSummary, { backgroundColor: theme.card }]}>
            {vitals.map((v, i) => (
              <View key={i} style={styles.vitalSummaryItem}>
                <Text style={styles.vitalSummaryIcon}>{v.icon}</Text>
                <Text style={[styles.vitalSummaryVal, { color: v.value < v.min || v.value > v.max ? "#FF4757" : v.color }]}>{v.value}</Text>
                <Text style={[styles.vitalSummaryUnit, { color: theme.muted }]}>{v.unit}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === "history" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📋 Vitals History</Text>
          {history.length === 0 && <Text style={[styles.emptyText, { color: theme.muted }]}>No history yet. Updates every 3 seconds.</Text>}
          {history.map((entry, i) => (
            <View key={i} style={[styles.historyCard, { backgroundColor: theme.card }, entry.risk.level !== "LOW" && styles.historyCardAlert]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyTime, { color: theme.sub }]}>🕐 {entry.time}</Text>
                <View style={[styles.riskBadgeSmall, { backgroundColor: riskColors[entry.risk.level] }]}>
                  <Text style={styles.riskBadgeSmallText}>{entry.risk.level} · {entry.risk.score}</Text>
                </View>
              </View>
              <View style={styles.historyGrid}>
                {entry.vitals.map((v, j) => (
                  <Text key={j} style={[styles.historyItem, { backgroundColor: theme.card2, color: theme.sub }, (v.value < v.min || v.value > v.max) && styles.historyItemAlert]}>
                    {v.icon} {v.value} {v.unit}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === "patients" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>👥 All Patients</Text>
          {PATIENTS.map((p, i) => (
            <TouchableOpacity key={i} style={[styles.patientCard, { backgroundColor: theme.card }, activePatient === i && { borderColor: "#1E90FF", borderWidth: 2 }]} onPress={() => setActivePatient(i)}>
              <View style={styles.patientCardTop}>
                <Text style={styles.patientAvatar}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patientName, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.patientBed, { color: theme.sub }]}>{p.bed}</Text>
                  <Text style={[styles.patientDiag, { color: theme.muted }]}>{p.diagnosis}</Text>
                </View>
                {activePatient === i && <Text style={styles.activeTag}>● ACTIVE</Text>}
              </View>
              {[["Doctor", p.doctor], ["Blood Group", p.bloodGroup], ["Admitted", p.admitted], ["Allergies", p.allergies], ["Medications", p.medications]].map(([label, value], j) => (
                <View key={j} style={[styles.infoRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {activeTab === "settings" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⚙️ Settings</Text>
          {[
            { label: "🌙 Dark Mode", el: <Switch value={isDark} onValueChange={setIsDark} thumbColor={isDark ? "#1E90FF" : "#FFF"} trackColor={{ true: "#1E3A5F", false: "#CCC" }} /> },
            { label: "📡 Live Monitoring", el: <Switch value={isLive} onValueChange={setIsLive} thumbColor={isLive ? "#2ECC71" : "#FFF"} trackColor={{ true: "#1A3A1A", false: "#CCC" }} /> },
            { label: "⏱️ Update Interval", el: <Text style={{ color: theme.sub }}>Every 3 seconds</Text> },
          ].map((s, i) => (
            <View key={i} style={[styles.settingRow, { backgroundColor: theme.card }]}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{s.label}</Text>
              {s.el}
            </View>
          ))}
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.card }]} onPress={() => setShowThresholds(true)}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>⚡ Custom Alert Thresholds</Text>
            <Text style={{ color: "#1E90FF" }}>Edit →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { marginTop: 8 }]} onPress={() => exportCSV(vitals, PATIENTS[activePatient])}>
            <Text style={styles.exportBtnText}>📤 Export Current Report (CSV)</Text>
          </TouchableOpacity>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>ℹ️ About VitalWatch AI</Text>
            <Text style={[styles.infoCardText, { color: theme.sub }]}>{"VitalWatch AI is a Remote Patient Monitoring solution inspired by Dozee Health AI.\n\nMonitors 6 vitals in real-time, calculates AI risk scores, and alerts for abnormal readings.\n\nBuilt with React Native + Expo · Version 2.0.0"}</Text>
          </View>
        </ScrollView>
      )}

      <Modal visible={showThresholds} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>⚡ Custom Alert Thresholds</Text>
            <ScrollView>
              {vitals.map((v, i) => (
                <View key={i} style={styles.thresholdRow}>
                  <Text style={[styles.thresholdLabel, { color: theme.text }]}>{v.icon} {v.label}</Text>
                  <View style={styles.thresholdInputs}>
                    <TextInput style={[styles.thresholdInput, { color: theme.text, borderColor: theme.border }]} value={String(thresholds[i].min)} keyboardType="numeric" onChangeText={(t) => setThresholds((prev) => prev.map((p, j) => j === i ? { ...p, min: parseFloat(t) || p.min } : p))} placeholder="Min" placeholderTextColor={theme.muted} />
                    <Text style={{ color: theme.muted, marginHorizontal: 4 }}>–</Text>
                    <TextInput style={[styles.thresholdInput, { color: theme.text, borderColor: theme.border }]} value={String(thresholds[i].max)} keyboardType="numeric" onChangeText={(t) => setThresholds((prev) => prev.map((p, j) => j === i ? { ...p, max: parseFloat(t) || p.max } : p))} placeholder="Max" placeholderTextColor={theme.muted} />
                    <Text style={[styles.thresholdUnit, { color: theme.muted }]}>{v.unit}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowThresholds(false)}>
              <Text style={styles.modalCloseText}>✅ Save & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const darkTheme = { bg: "#0A0E1A", card: "#111827", card2: "#0D1220", text: "#FFFFFF", sub: "#8899AA", muted: "#445566", border: "#1E2840" };
const lightTheme = { bg: "#F0F4F8", card: "#FFFFFF", card2: "#E8EEF4", text: "#1A2530", sub: "#445566", muted: "#889AAA", border: "#D0DCE8" };

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 48 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerSub: { fontSize: 11 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertBadge: { backgroundColor: "#FF4757", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  alertBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  liveBtn: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderWidth: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveBtnText: { fontSize: 11, fontWeight: "bold" },
  patientBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  patientText: { fontSize: 12 },
  patientTime: { fontSize: 11 },
  riskBanner: { flexDirection: "row", alignItems: "center", padding: 10, gap: 4 },
  riskBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  riskBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  riskScore: { fontSize: 13, fontWeight: "bold" },
  riskReason: { fontSize: 11 },
  riskBar: { width: 60, height: 6, borderRadius: 3, overflow: "hidden", marginLeft: 8 },
  riskBarFill: { height: 6, borderRadius: 3 },
  alertBanner: { backgroundColor: "#3D0000", padding: 10, borderLeftWidth: 4, borderLeftColor: "#FF4757" },
  alertBannerText: { color: "#FF4757", fontSize: 13, fontWeight: "bold" },
  tabsScroll: { maxHeight: 44 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  content: { flex: 1, padding: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  card: { borderRadius: 12, padding: 12, width: "48%", borderLeftWidth: 4, marginBottom: 4 },
  cardAlert: { borderColor: "#FF4757" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  cardIcon: { fontSize: 22 },
  abnormalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF4757" },
  cardLabel: { fontSize: 11, marginBottom: 2 },
  cardValue: { fontSize: 28, fontWeight: "bold" },
  cardUnit: { fontSize: 11, marginBottom: 4 },
  cardRangeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardRange: { fontSize: 10 },
  cardAlertText: { color: "#FF4757", fontSize: 10, fontWeight: "bold" },
  progressBg: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  exportBtn: { backgroundColor: "#1E3A5F", borderRadius: 10, padding: 14, alignItems: "center", marginVertical: 12 },
  exportBtnText: { color: "#1E90FF", fontSize: 14, fontWeight: "bold" },
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  emptyText: { textAlign: "center", marginTop: 40 },
  ecgCard: { borderRadius: 12, padding: 14, marginBottom: 12 },
  ecgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ecgTitle: { fontSize: 14, fontWeight: "bold" },
  ecgHR: { fontSize: 20, fontWeight: "bold" },
  ecgSub: { fontSize: 11, marginTop: 4 },
  vitalSummary: { flexDirection: "row", flexWrap: "wrap", borderRadius: 12, padding: 12, gap: 8, marginBottom: 20 },
  vitalSummaryItem: { alignItems: "center", width: "30%" },
  vitalSummaryIcon: { fontSize: 20 },
  vitalSummaryVal: { fontSize: 16, fontWeight: "bold" },
  vitalSummaryUnit: { fontSize: 10 },
  historyCard: { borderRadius: 10, padding: 12, marginBottom: 8 },
  historyCardAlert: { borderLeftWidth: 3, borderLeftColor: "#FF4757" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  historyTime: { fontSize: 12 },
  riskBadgeSmall: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  riskBadgeSmallText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  historyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  historyItem: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  historyItemAlert: { color: "#FF4757", backgroundColor: "#2A1010" },
  patientCard: { borderRadius: 12, padding: 14, marginBottom: 12 },
  patientCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  patientAvatar: { fontSize: 40, marginRight: 12 },
  patientName: { fontSize: 16, fontWeight: "bold" },
  patientBed: { fontSize: 12 },
  patientDiag: { fontSize: 11 },
  activeTag: { color: "#2ECC71", fontSize: 11, fontWeight: "bold" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 12, fontWeight: "600", maxWidth: "55%", textAlign: "right" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, padding: 14, marginBottom: 8 },
  settingLabel: { fontSize: 14 },
  infoCard: { borderRadius: 12, padding: 16, marginTop: 8 },
  infoCardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 8 },
  infoCardText: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "#00000099", justifyContent: "center", padding: 20 },
  modalCard: { borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 16 },
  thresholdRow: { marginBottom: 14 },
  thresholdLabel: { fontSize: 13, marginBottom: 6 },
  thresholdInputs: { flexDirection: "row", alignItems: "center" },
  thresholdInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, width: 70, fontSize: 14 },
  thresholdUnit: { marginLeft: 6, fontSize: 12 },
  modalClose: { backgroundColor: "#1E3A5F", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 12 },
  modalCloseText: { color: "#1E90FF", fontSize: 14, fontWeight: "bold" },
});
