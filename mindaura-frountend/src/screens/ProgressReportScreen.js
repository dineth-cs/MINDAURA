import React, { useContext, useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { UserContext } from '../context/UserContext';

const API_BASE = 'https://mindaura-wfut.onrender.com';

const MOOD_EMOJIS = {
    Happy: '😄', Energy: '⚡', Sad: '😔',
    Stress: '😤', Anxious: '😟', Bored: '😐', Neutral: '😐',
};

const MOOD_COLORS_HEX = {
    Happy: '#FFD700', Energy: '#6B8EFE', Sad: '#4DABF7',
    Stress: '#FF6B6B', Anxious: '#FF9F43', Bored: '#CED4DA', Neutral: '#ADB5BD',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function getMonthEntries(history) {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth();
    return history.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === yr && d.getMonth() === mo;
    });
}

function buildSummary(entries) {
    if (!entries.length) return [];
    const counts = {};
    entries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    const total = entries.length;
    return Object.entries(counts)
        .map(([mood, count]) => ({ mood, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count);
}

function fmt(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function monthLabel() {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── PDF HTML builder ────────────────────────────────────────────────────────

function buildHtmlReport(userName, summary, entries) {
    const tableRows = entries.map((e, i) => `
        <tr style="background:${i % 2 === 0 ? '#F8F9FE' : '#FFFFFF'}">
            <td style="padding:10px 14px;">${fmt(e.date)}</td>
            <td style="padding:10px 14px;">${fmtTime(e.date)}</td>
            <td style="padding:10px 14px;">
                <span style="
                    display:inline-block;
                    padding:3px 12px;
                    border-radius:20px;
                    font-weight:600;
                    font-size:12px;
                    background:${MOOD_COLORS_HEX[e.mood] || '#E9ECEF'}22;
                    color:${MOOD_COLORS_HEX[e.mood] || '#495057'};
                    border:1px solid ${MOOD_COLORS_HEX[e.mood] || '#CED4DA'}88;
                ">${MOOD_EMOJIS[e.mood] || ''} ${e.mood || 'Unknown'}</span>
            </td>
            <td style="padding:10px 14px;color:#6B7280;font-size:12px;">${e.source || 'App'}</td>
        </tr>`).join('');

    const summaryCards = summary.map(s => `
        <div style="
            display:inline-block;
            min-width:120px;
            background:${MOOD_COLORS_HEX[s.mood] || '#E9ECEF'}22;
            border:1px solid ${MOOD_COLORS_HEX[s.mood] || '#CED4DA'}66;
            border-radius:12px;
            padding:14px 18px;
            margin:6px;
            text-align:center;
        ">
            <div style="font-size:28px;">${MOOD_EMOJIS[s.mood] || '😐'}</div>
            <div style="font-size:16px;font-weight:700;color:#1F2937;margin:4px 0;">${s.pct}%</div>
            <div style="font-size:12px;color:#6B7280;font-weight:600;">${s.mood}</div>
            <div style="font-size:11px;color:#9CA3AF;">${s.count} session${s.count !== 1 ? 's' : ''}</div>
        </div>`).join('');

    const topMood = summary[0];
    const heroText = topMood
        ? `You were <strong style="color:#6B8EFE;">${topMood.mood}</strong> ${topMood.pct}% of the time this month.`
        : 'No mood data was recorded this month.';

    const generatedOn = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>MindAura Monthly Mood Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#F0F4FF; color:#1F2937; }
  .page { max-width:720px; margin:0 auto; background:#FFFFFF; }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #6B8EFE 0%, #A78BFA 100%);
    padding: 36px 40px 28px;
    color: white;
  }
  .brand-row { display:flex; align-items:center; margin-bottom:20px; }
  .brand-icon {
    width:44px; height:44px; background:rgba(255,255,255,0.25);
    border-radius:12px; display:flex; align-items:center; justify-content:center;
    font-size:22px; margin-right:12px;
  }
  .brand-name { font-size:22px; font-weight:800; letter-spacing:-0.5px; }
  .brand-tagline { font-size:11px; opacity:0.8; font-weight:500; margin-top:1px; }
  .report-title { font-size:28px; font-weight:700; margin-bottom:4px; }
  .report-meta { font-size:13px; opacity:0.85; }

  /* ── User card ── */
  .user-card {
    background:#F8F9FE; border-left:4px solid #6B8EFE;
    margin:28px 40px 0; padding:16px 20px; border-radius:0 12px 12px 0;
  }
  .user-label { font-size:11px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .user-name { font-size:20px; font-weight:700; color:#1F2937; margin-top:2px; }

  /* ── Sections ── */
  .section { padding:28px 40px; }
  .section-title {
    font-size:13px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.8px; color:#6B8EFE; margin-bottom:16px;
  }

  /* ── Hero insight ── */
  .insight-box {
    background:linear-gradient(135deg,#F0F4FF,#FAF5FF);
    border:1px solid #E5E7EB; border-radius:16px;
    padding:20px 24px; font-size:16px; line-height:1.6; color:#374151;
  }

  /* ── Summary cards ── */
  .summary-grid { display:flex; flex-wrap:wrap; margin:-6px; }

  /* ── Table ── */
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead tr { background:#6B8EFE; color:white; }
  thead th { padding:11px 14px; text-align:left; font-weight:600; font-size:12px; letter-spacing:0.3px; }
  tbody tr:last-child td { border-bottom:none; }
  td { border-bottom:1px solid #F3F4F6; }

  /* ── Empty state ── */
  .empty { text-align:center; padding:40px; color:#9CA3AF; font-size:14px; }

  /* ── Footer ── */
  .footer {
    background:#F8F9FE; border-top:1px solid #E5E7EB;
    padding:20px 40px; display:flex; justify-content:space-between; align-items:center;
  }
  .footer-brand { font-size:13px; font-weight:700; color:#6B8EFE; }
  .footer-note { font-size:11px; color:#9CA3AF; }
  .divider { height:1px; background:#F3F4F6; margin:0 40px; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand-row">
      <div class="brand-icon">🧠</div>
      <div>
        <div class="brand-name">MindAura</div>
        <div class="brand-tagline">Your Mental Wellness Companion</div>
      </div>
    </div>
    <div class="report-title">Monthly Mood Report</div>
    <div class="report-meta">${monthLabel()} &nbsp;·&nbsp; Generated on ${generatedOn}</div>
  </div>

  <!-- User Card -->
  <div class="user-card">
    <div class="user-label">Prepared for</div>
    <div class="user-name">${userName || 'MindAura User'}</div>
  </div>

  <!-- Insight -->
  <div class="section">
    <div class="section-title">💡 Monthly Insight</div>
    <div class="insight-box">${heroText}</div>
  </div>

  <div class="divider"></div>

  <!-- Mood Breakdown -->
  <div class="section">
    <div class="section-title">📊 Mood Breakdown</div>
    ${summary.length
        ? `<div class="summary-grid">${summaryCards}</div>`
        : '<p class="empty">No mood entries recorded this month.</p>'}
  </div>

  <div class="divider"></div>

  <!-- Mood Log Table -->
  <div class="section">
    <div class="section-title">📋 Detailed Mood Log (${entries.length} entries)</div>
    ${entries.length ? `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Mood</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>` : '<p class="empty">No mood entries recorded this month.</p>'}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">🧠 MindAura</div>
    <div class="footer-note">This report is private and confidential. For personal use only.</div>
  </div>

</div>
</body>
</html>`;
}

// ─── Screen component ────────────────────────────────────────────────────────

export default function ProgressReportScreen() {
    const navigation = useNavigation();
    const { name, isDarkMode, currentTheme } = useContext(UserContext);

    const [moodHistory, setMoodHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const monthEntries = getMonthEntries(moodHistory);
    const summary = buildSummary(monthEntries);
    const topMood = summary[0];

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) return;
                const res = await axios.get(`${API_BASE}/api/emotion/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMoodHistory(res.data || []);
            } catch (err) {
                console.warn('Could not fetch mood history:', err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleGeneratePDF = async () => {
        if (!monthEntries.length) {
            Alert.alert(
                'No Data',
                `No mood entries found for ${monthLabel()}. Complete a Face Scan, Voice Recording, or Journal to start tracking.`,
            );
            return;
        }

        setGenerating(true);
        try {
            const html = buildHtmlReport(name, summary, monthEntries);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `MindAura Report – ${monthLabel()}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('PDF Saved', `Your report has been saved to:\n${uri}`);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            Alert.alert('Error', 'Could not generate the PDF. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Styles driven by theme ──
    const cardBg = currentTheme.card;
    const textColor = currentTheme.text;
    const subText = currentTheme.subText;
    const borderColor = currentTheme.border;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.bg }]}>
            {/* Header */}
            <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Monthly Mood Report</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Brand Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroInner}>
                        <Text style={styles.heroIcon}>🧠</Text>
                        <Text style={styles.heroAppName}>MindAura</Text>
                        <Text style={styles.heroMonth}>{monthLabel()}</Text>
                        <Text style={styles.heroSub}>Your personal wellness report</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#6B8EFE" />
                        <Text style={[styles.loadingText, { color: subText }]}>Fetching your mood history…</Text>
                    </View>
                ) : (
                    <>
                        {/* User Info Card */}
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <View style={styles.cardRow}>
                                <View style={styles.iconBubble}>
                                    <Ionicons name="person" size={18} color="#6B8EFE" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardLabel, { color: subText }]}>Report Prepared For</Text>
                                    <Text style={[styles.cardValue, { color: textColor }]}>{name || 'You'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Insight Card */}
                        {topMood && (
                            <View style={[styles.insightCard, { backgroundColor: isDarkMode ? 'rgba(107,142,254,0.15)' : '#F0F4FF' }]}>
                                <Text style={styles.insightEmoji}>{MOOD_EMOJIS[topMood.mood] || '😊'}</Text>
                                <Text style={[styles.insightText, { color: textColor }]}>
                                    You were{' '}
                                    <Text style={{ color: '#6B8EFE', fontWeight: '700' }}>{topMood.mood}</Text>
                                    {' '}{topMood.pct}% of the time this month
                                </Text>
                                <Text style={[styles.insightSub, { color: subText }]}>
                                    Based on {monthEntries.length} mood session{monthEntries.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        )}

                        {/* Mood Breakdown */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Mood Breakdown</Text>
                        {summary.length === 0 ? (
                            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                                <Text style={{ fontSize: 32 }}>📊</Text>
                                <Text style={[styles.emptyText, { color: subText }]}>
                                    No mood entries for {monthLabel()}.{'\n'}Complete a scan or journal to get started.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.summaryGrid}>
                                {summary.map(item => (
                                    <View
                                        key={item.mood}
                                        style={[styles.summaryChip, {
                                            backgroundColor: cardBg,
                                            borderColor: MOOD_COLORS_HEX[item.mood] + '88' || borderColor,
                                        }]}
                                    >
                                        <Text style={styles.chipEmoji}>{MOOD_EMOJIS[item.mood] || '😐'}</Text>
                                        <Text style={[styles.chipPct, { color: MOOD_COLORS_HEX[item.mood] || '#6B8EFE' }]}>
                                            {item.pct}%
                                        </Text>
                                        <Text style={[styles.chipMood, { color: textColor }]}>{item.mood}</Text>
                                        <Text style={[styles.chipCount, { color: subText }]}>
                                            {item.count} session{item.count !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Mood Log */}
                        {monthEntries.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>
                                    Mood Log  <Text style={{ color: subText, fontSize: 13 }}>({monthEntries.length} entries)</Text>
                                </Text>
                                <View style={[styles.card, { backgroundColor: cardBg, borderColor, padding: 0, overflow: 'hidden' }]}>
                                    {/* Table Header */}
                                    <View style={[styles.tableHeader, { backgroundColor: '#6B8EFE' }]}>
                                        <Text style={[styles.colHead, { flex: 2 }]}>Date</Text>
                                        <Text style={[styles.colHead, { flex: 1.3 }]}>Time</Text>
                                        <Text style={[styles.colHead, { flex: 1.5 }]}>Mood</Text>
                                    </View>
                                    {monthEntries.map((e, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.tableRow,
                                                { borderBottomColor: borderColor },
                                                i % 2 === 0 && { backgroundColor: isDarkMode ? 'rgba(107,142,254,0.05)' : '#F8F9FE' },
                                            ]}
                                        >
                                            <Text style={[styles.colCell, { flex: 2, color: textColor }]}>{fmt(e.date)}</Text>
                                            <Text style={[styles.colCell, { flex: 1.3, color: subText }]}>{fmtTime(e.date)}</Text>
                                            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 14, marginRight: 4 }}>{MOOD_EMOJIS[e.mood] || ''}</Text>
                                                <Text style={[styles.colCell, {
                                                    color: MOOD_COLORS_HEX[e.mood] || textColor,
                                                    fontWeight: '600',
                                                }]}>{e.mood}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Spacer for button */}
                        <View style={{ height: 100 }} />
                    </>
                )}
            </ScrollView>

            {/* Fixed Generate Button */}
            {!loading && (
                <View style={[styles.btnWrapper, {
                    backgroundColor: currentTheme.bg,
                    borderTopColor: borderColor,
                }]}>
                    <TouchableOpacity
                        id="generate-pdf-button"
                        style={[styles.generateBtn, generating && { opacity: 0.7 }]}
                        onPress={handleGeneratePDF}
                        disabled={generating}
                        activeOpacity={0.85}
                    >
                        {generating ? (
                            <>
                                <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 10 }} />
                                <Text style={styles.generateBtnText}>Generating PDF…</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="document-text-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.generateBtnText}>Generate PDF Report</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1 },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4, width: 36 },
    headerTitle: { fontSize: 17, fontWeight: '700' },

    scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

    // Hero
    heroCard: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        backgroundColor: '#6B8EFE',
        // gradient simulated with a tint
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    heroInner: {
        padding: 28,
        alignItems: 'center',
        backgroundColor: 'rgba(100,60,200,0.35)',
    },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroAppName: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
    heroMonth: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 4 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    // Loading
    loadingBox: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, fontSize: 14 },

    // Cards
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    iconBubble: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(107,142,254,0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    cardLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    cardValue: { fontSize: 17, fontWeight: '700' },

    // Insight
    insightCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    insightEmoji: { fontSize: 44, marginBottom: 10 },
    insightText: { fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
    insightSub: { fontSize: 13, marginTop: 6 },

    // Section title
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

    // Empty
    emptyCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: { marginTop: 12, textAlign: 'center', lineHeight: 22, fontSize: 14 },

    // Summary Grid
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },
    summaryChip: {
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 14,
        margin: 6,
        alignItems: 'center',
        minWidth: '42%',
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    chipEmoji: { fontSize: 28, marginBottom: 6 },
    chipPct: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
    chipMood: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    chipCount: { fontSize: 11 },

    // Table
    tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14 },
    colHead: { fontSize: 11, fontWeight: '700', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
    },
    colCell: { fontSize: 13, fontWeight: '500' },

    // Generate Button
    btnWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        borderTopWidth: 1,
    },
    generateBtn: {
        backgroundColor: '#6B8EFE',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
