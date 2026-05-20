import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, DeviceEventEmitter, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';
import { UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const screenWidth = Dimensions.get('window').width;

const MOOD_COLORS = {
    Happy: '#FFD700',
    Surprise: '#A855F7',
    Neutral: '#CED4DA',
    Angry: '#FF6B6B',
    Sad: '#4DABF7'
};

// Reverse-map: mood score value → brand color
// Used by getDotColor so each dot on the chart matches its mood's color
const SCORE_COLOR = {
    10: '#FFD700',  // Happy
    8: '#A855F7',   // Surprise
    6: '#CED4DA',   // Neutral
    4: '#FF6B6B',   // Angry
    2: '#4DABF7',   // Sad
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
    const [timeframe, setTimeframe] = useState('Weekly');
    const [moodHistory, setMoodHistory] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);

    // Default to today's date
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [isModalVisible, setModalVisible] = useState(false);

    const getEntriesForDate = (dateString) => {
        return moodHistory.filter(e => e.date && e.date.startsWith(dateString));
    };

    const fetchMoodHistory = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await axios.get(
                API_ENDPOINTS.EMOTION.HISTORY,
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
    }, [today]);

    // --- Fetch real mood history from backend ---
    useFocusEffect(
        useCallback(() => {
            fetchMoodHistory();
        }, [fetchMoodHistory])
    );

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('MoodUpdated', () => {
            fetchMoodHistory();
        });
        return () => subscription.remove();
    }, [fetchMoodHistory]);

    // --- Build Mood Distribution Data ---
    const getDistributionData = (period) => {
        if (!moodHistory || moodHistory.length === 0) return [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let filteredLogs = [];

        if (period === 'Daily') {
            filteredLogs = moodHistory.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return d >= startOfToday;
            });
        } else if (period === 'Weekly') {
            const sevenDaysAgo = new Date(startOfToday);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            filteredLogs = moodHistory.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return d >= sevenDaysAgo;
            });
        } else if (period === 'Monthly') {
            const thirtyDaysAgo = new Date(startOfToday);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filteredLogs = moodHistory.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date);
                return d >= thirtyDaysAgo;
            });
        }

        if (filteredLogs.length === 0) return [];

        // Count occurrences
        const counts = {};
        filteredLogs.forEach(log => {
            const m = log.mood;
            counts[m] = (counts[m] || 0) + 1;
        });

        // Convert to PieChart format
        return Object.keys(counts).map(mood => ({
            name: mood,
            population: counts[mood],
            color: MOOD_COLORS[mood] || '#999999',
            legendFontColor: isDarkMode ? '#FFFFFF' : '#333333',
            legendFontSize: 13
        }));
    };

    const getOverallMoodText = () => {
        if (!moodHistory.length) return 'No mood data recorded yet.';
        const latest = moodHistory[moodHistory.length - 1];
        const emoji = { Happy: '😄', Surprise: '😲', Neutral: '😐', Angry: '😡', Sad: '😢' };
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
                                onDayPress={(day) => {
                                    setSelectedDate(day.dateString);
                                    setModalVisible(true);
                                }}
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
                                {renderLegendItem(MOOD_COLORS.Surprise, 'Surprise')}
                                {renderLegendItem(MOOD_COLORS.Neutral, 'Neutral')}
                                {renderLegendItem(MOOD_COLORS.Angry, 'Angry')}
                                {renderLegendItem(MOOD_COLORS.Sad, 'Sad')}
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
                        const isActive = timeframe === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabButton,
                                    isActive && styles.activeTabButton,
                                    isActive && { backgroundColor: isDarkMode ? 'rgba(107, 142, 254, 0.3)' : '#F3E5F5' }
                                ]}
                                onPress={() => setTimeframe(tab)}
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
                    {(() => {
                        const pieData = getDistributionData(timeframe);
                        if (pieData.length === 0) {
                            return (
                                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: currentTheme.subText, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 }}>
                                        No mood entries recorded for this {timeframe.toLowerCase()} period.
                                    </Text>
                                </View>
                            );
                        }
                        return (
                            <PieChart
                                data={pieData}
                                width={screenWidth - 60}
                                height={220}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        );
                    })()}
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

            {/* Daily Mood Details Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={{ color: currentTheme.subText, fontSize: 20 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {getEntriesForDate(selectedDate).length === 0 ? (
                                <Text style={{ color: currentTheme.subText, textAlign: 'center', marginTop: 20 }}>
                                    No moods recorded on this date.
                                </Text>
                            ) : (
                                getEntriesForDate(selectedDate).map((entry, index) => (
                                    <View key={index} style={[styles.entryItem, { borderBottomColor: isDarkMode ? '#3A3A4A' : '#E2E8F0' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.entryColorDot, { backgroundColor: MOOD_COLORS[entry.mood] || '#CED4DA' }]} />
                                            <Text style={{ color: currentTheme.text, fontWeight: 'bold', fontSize: 16 }}>
                                                {entry.mood}
                                            </Text>
                                        </View>
                                        <Text style={{ color: currentTheme.subText, fontSize: 12 }}>
                                            {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        marginBottom: 20,
    },
    entryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    entryColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    closeButton: {
        backgroundColor: '#6B8EFE',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
