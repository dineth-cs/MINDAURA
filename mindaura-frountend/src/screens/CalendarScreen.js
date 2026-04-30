import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-chart-kit';
import { UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

const MOOD_COLORS = {
    Happy: '#FFD700',
    Energy: '#6B8EFE',
    Stress: '#FF6B6B',
    Sad: '#4DABF7',
    Bored: '#CED4DA'
};

// Reverse-map: mood score value → brand color
// Used by getDotColor so each dot on the chart matches its mood's color
const SCORE_COLOR = {
    9: '#FFD700',   // Happy
    8: '#6B8EFE',   // Energy
    6: '#ADB5BD',   // Neutral
    5: '#CED4DA',   // Bored
    3: '#4DABF7',   // Sad
    2: '#FF6B6B',   // Stress / Anxious
    0: 'transparent', // empty slot
};

// Finds the closest color for averaged/rounded scores
function scoreToColor(score) {
    if (score === 0) return 'transparent';
    const keys = Object.keys(SCORE_COLOR).map(Number).sort((a, b) => a - b);
    let closest = keys[0];
    for (const k of keys) {
        if (Math.abs(k - score) < Math.abs(closest - score)) closest = k;
    }
    return SCORE_COLOR[closest];
}

export default function CalendarScreen() {
    const navigation = useNavigation();
    const { isDarkMode, currentTheme } = useContext(UserContext);
    const [selectedTab, setSelectedTab] = useState('Weekly');
    const [moodHistory, setMoodHistory] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);

    // Default to today's date
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // --- Fetch real mood history from backend ---
    useFocusEffect(
        useCallback(() => {
            const fetchMoodHistory = async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    if (!token) return;

                    const response = await axios.get(
                        'https://mindaura-wfut.onrender.com/api/emotion/history',
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    const history = response.data || [];
                    setMoodHistory(history);

                    // Build markedDates: one colored dot per date, keyed to the dominant mood of that day
                    const built = {};
                    history.forEach(entry => {
                        const dateKey = entry.date ? entry.date.split('T')[0] : null;
                        const mood = entry.mood || 'Neutral';
                        if (dateKey && MOOD_COLORS[mood]) {
                            // Last write wins – most recent entry's mood colour shows on that day
                            built[dateKey] = {
                                marked: true,
                                dotColor: MOOD_COLORS[mood],
                            };
                        }
                    });

                    // Merge selection state for today without overwriting the dot
                    const todayMark = built[today] || {};
                    built[today] = { ...todayMark, selected: true, selectedColor: '#6B8EFE', selectedTextColor: '#FFFFFF' };
                    setMarkedDates(built);

                } catch (error) {
                    console.warn('Mood history not available yet:', error.message);
                    // Graceful fallback: show only today highlighted, no fake data
                    setMarkedDates({
                        [today]: { selected: true, selectedColor: '#6B8EFE', selectedTextColor: '#FFFFFF' }
                    });
                } finally {
                    setLoading(false);
                }
            };

            fetchMoodHistory();
        }, [today])
    );

    // --- Build real chart data from moodHistory, fallback to zeros ---
    const buildChartData = (period) => {
        const moodScore = (mood) => ({ Happy: 9, Energy: 8, Neutral: 6, Bored: 5, Sad: 3, Stress: 2, Anxious: 2 }[mood] || 5);

        if (moodHistory.length === 0) {
            // Honest empty fallback: all zeros, no fake data
            if (period === 'Daily') return { labels: ['8AM','12PM','4PM','8PM'], datasets: [{ data: [0,0,0,0], color: (o=1) => `rgba(107,142,254,${o})`, strokeWidth: 2 }], legend: [] };
            if (period === 'Weekly') return { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [0,0,0,0,0,0,0], color: (o=1) => `rgba(107,142,254,${o})`, strokeWidth: 2 }], legend: [] };
            return { labels: ['Week 1','Week 2','Week 3','Week 4'], datasets: [{ data: [0,0,0,0], color: (o=1) => `rgba(107,142,254,${o})`, strokeWidth: 2 }], legend: [] };
        }

        if (period === 'Daily') {
            const todayEntries = moodHistory.filter(e => e.date && e.date.startsWith(today));
            const slots = ['8AM', '12PM', '4PM', '8PM'];

            // Map each slot to an hour-of-day range:
            //   8AM  → hours  0 – 10   (midnight to late morning)
            //  12PM  → hours 11 – 14   (11AM to 2PM)
            //   4PM  → hours 15 – 18   (3PM to 6PM)
            //   8PM  → hours 19 – 23   (7PM onwards)
            const slotRanges = [
                { min: 0,  max: 10 },   // 8AM slot
                { min: 11, max: 14 },   // 12PM slot
                { min: 15, max: 18 },   // 4PM slot
                { min: 19, max: 23 },   // 8PM slot
            ];

            const data = slotRanges.map(({ min, max }) => {
                const slotEntries = todayEntries.filter(e => {
                    const h = new Date(e.date).getHours();
                    return h >= min && h <= max;
                });
                if (!slotEntries.length) return 0;
                // Average score if multiple scans happened in the same slot
                const avg = slotEntries.reduce((s, e) => s + moodScore(e.mood), 0) / slotEntries.length;
                return Math.round(avg);
            });

            // Line color is neutral grey — colored dots will pop against it
            return { labels: slots, datasets: [{ data, color: (o=1) => `rgba(160,160,180,${o * 0.6})`, strokeWidth: 2 }], legend: [] };
        }

        if (period === 'Weekly') {
            const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            const data = days.map((_, i) => {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dateStr = day.toISOString().split('T')[0];
                const dayEntries = moodHistory.filter(e => e.date && e.date.startsWith(dateStr));
                if (!dayEntries.length) return 0;
                return Math.round(dayEntries.reduce((s, e) => s + moodScore(e.mood), 0) / dayEntries.length);
            });
            return { labels: days, datasets: [{ data, color: (o=1) => `rgba(160,160,180,${o * 0.6})`, strokeWidth: 2 }], legend: [] };
        }

        // Monthly: average per week
        const labels = ['Week 1','Week 2','Week 3','Week 4'];
        const now = new Date();
        const data = labels.map((_, i) => {
            const weekStart = new Date(now.getFullYear(), now.getMonth(), 1 + i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const entries = moodHistory.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return d >= weekStart && d <= weekEnd;
            });
            if (!entries.length) return 0;
            return parseFloat((entries.reduce((s, e) => s + moodScore(e.mood), 0) / entries.length).toFixed(1));
        });
        return { labels, datasets: [{ data, color: (o=1) => `rgba(160,160,180,${o * 0.6})`, strokeWidth: 2 }], legend: [] };
    };

    const getOverallMoodText = () => {
        if (!moodHistory.length) return 'No mood data recorded yet.';
        const latest = moodHistory[moodHistory.length - 1];
        const emoji = { Happy: '😄', Energy: '⚡', Sad: '😔', Stress: '😤', Anxious: '😟', Bored: '😐', Neutral: '😐' };
        return `Latest Mood: ${latest.mood} ${emoji[latest.mood] || ''}`;
    };

    const chartConfig = {
        backgroundGradientFrom: currentTheme.card,
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: currentTheme.card,
        backgroundGradientToOpacity: 0,
        // Line and axis label color — neutral so colored dots pop
        color: (opacity = 1) => `rgba(160,160,180,${opacity * 0.6})`,
        labelColor: (opacity = 1) => currentTheme.subText,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        // getDotColor: called per-dot with (dataPoint value, index)
        // Returns the brand color that matches the mood score at that point
        getDotColor: (dataPoint) => scoreToColor(dataPoint),
        propsForDots: {
            r: '6',           // Bigger radius so colored dots are clearly visible
            strokeWidth: '2',
            stroke: currentTheme.card, // White/card-colored border so dots lift off the line
        },
    };

    const renderLegendItem = (color, label) => (
        <View style={styles.legendItem} key={label}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: currentTheme.text }]}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Mood Analytics</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Calendar Card */}
                <View style={[styles.cardContainer, { backgroundColor: currentTheme.card }]}>
                    {loading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#6B8EFE" />
                            <Text style={{ color: currentTheme.subText, marginTop: 12, fontSize: 13 }}>Loading mood history...</Text>
                        </View>
                    ) : (
                        <>
                            <Calendar
                                key={isDarkMode ? 'dark' : 'light'}
                                markingType={'dot'}
                                current={today}
                                onDayPress={(day) => setSelectedDate(day.dateString)}
                                markedDates={{
                                    ...markedDates,
                                    // Spread any existing dot for the selected date, then apply selection highlight
                                    [selectedDate]: {
                                        ...(markedDates[selectedDate] || {}),
                                        selected: true,
                                        selectedColor: '#6B8EFE',
                                        selectedTextColor: '#FFFFFF',
                                    },
                                }}
                                theme={{
                                    // Background
                                    backgroundColor: isDarkMode ? '#252536' : '#F8F9FA',
                                    calendarBackground: isDarkMode ? '#252536' : '#F8F9FA',
                                    // Month title (e.g. "April 2026")
                                    monthTextColor: isDarkMode ? '#FFFFFF' : '#1A1A2E',
                                    // Day number text
                                    dayTextColor: isDarkMode ? '#E2E8F0' : '#1A1A2E',
                                    // Day header row (S M T W T F S)
                                    textSectionTitleColor: isDarkMode ? '#A0A0B0' : '#888888',
                                    // Greyed-out days from prev/next month
                                    textDisabledColor: isDarkMode ? '#4A4A6A' : '#C0C0C0',
                                    // Arrows
                                    arrowColor: isDarkMode ? '#6B8EFE' : '#6B8EFE',
                                    // Dots
                                    dotColor: '#6B8EFE',
                                    selectedDotColor: '#FFFFFF',
                                    // Typography weights
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '600',
                                }}
                            />

                            {/* Unified Legend */}
                            <View style={styles.unifiedLegendContainer}>
                                {renderLegendItem(MOOD_COLORS.Happy, 'Happy')}
                                {renderLegendItem(MOOD_COLORS.Energy, 'Energy')}
                                {renderLegendItem(MOOD_COLORS.Stress, 'Stress')}
                                {renderLegendItem(MOOD_COLORS.Sad, 'Sad')}
                                {renderLegendItem(MOOD_COLORS.Bored, 'Bored')}
                            </View>

                            {/* No history hint */}
                            {moodHistory.length === 0 && (
                                <View style={{ alignItems: 'center', paddingBottom: 12 }}>
                                    <Text style={{ color: currentTheme.subText, fontSize: 12, textAlign: 'center', paddingHorizontal: 16 }}>
                                        📊 Complete a Face Scan, Voice Recording, or Journal entry to start tracking your mood history.
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    {['Daily', 'Weekly', 'Monthly'].map((tab) => {
                        const isActive = selectedTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabButton,
                                    isActive && styles.activeTabButton,
                                    isActive && { backgroundColor: isDarkMode ? 'rgba(107, 142, 254, 0.3)' : '#F3E5F5' }
                                ]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: isActive ? '#6B8EFE' : currentTheme.subText },
                                    isActive && styles.activeTabText
                                ]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Chart Card */}
                <View style={[styles.cardContainer, styles.chartCard, { backgroundColor: currentTheme.card }]}>
                    <Text style={[styles.overallMoodTitle, { color: currentTheme.text }]}>
                        {getOverallMoodText()}
                    </Text>
                    <LineChart
                        data={(() => {
                            const data = buildChartData(selectedTab);
                            return {
                                ...data,
                                datasets: [
                                    ...data.datasets,
                                    { data: [10], withDots: false, color: () => 'rgba(0,0,0,0)' }
                                ]
                            };
                        })()}
                        width={screenWidth - 60}
                        height={220}
                        fromZero={true}
                        segments={5}
                        formatYLabel={(value) => parseInt(value).toString()}
                        chartConfig={chartConfig}
                        getDotColor={(dataPoint) => scoreToColor(dataPoint)}
                        bezier
                        style={styles.chartStyle}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                    />
                    {moodHistory.length === 0 && (
                        <Text style={{ color: currentTheme.subText, fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 }}>
                            Chart will populate once mood entries are recorded.
                        </Text>
                    )}
                </View>


                {/* Generate Monthly PDF Report Button */}
                <TouchableOpacity
                    id="generate-pdf-report-button"
                    style={styles.reportButton}
                    onPress={() => navigation.navigate('ProgressReportScreen')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.reportButtonIcon}>📄</Text>
                    <View style={styles.reportButtonTextWrap}>
                        <Text style={styles.reportButtonTitle}>Generate Monthly PDF Report</Text>
                        <Text style={styles.reportButtonSub}>Export your mood history as a PDF</Text>
                    </View>
                    <Text style={styles.reportButtonChevron}>›</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 8,
    },
    cardContainer: {
        borderRadius: 20,
        padding: 10,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    unifiedLegendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        marginBottom: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    activeTabButton: {
        backgroundColor: '#F3E5F5',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
    },
    activeTabText: {
        fontWeight: 'bold',
    },
    chartCard: {
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 0,
        alignItems: 'center',
    },
    overallMoodTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        alignSelf: 'flex-start',
        marginLeft: 20,
    },
    chartStyle: {
        borderRadius: 16,
    },

    // PDF Report Button
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6B8EFE',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    reportButtonIcon: {
        fontSize: 26,
        marginRight: 14,
    },
    reportButtonTextWrap: {
        flex: 1,
    },
    reportButtonTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    reportButtonSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
    reportButtonChevron: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '300',
        marginLeft: 8,
    },
});
