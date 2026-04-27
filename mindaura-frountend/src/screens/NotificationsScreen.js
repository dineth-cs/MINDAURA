import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const cardColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const iconContainerBg = isDarkMode ? '#2C223A' : '#FAF5FF';
    const borderColor = isDarkMode ? '#333333' : '#F3F4F6';

    // Notification states — default values until AsyncStorage loads
    const [dailyMood, setDailyMood] = useState(true);
    const [journalReminder, setJournalReminder] = useState(true);
    const [voiceAnalysis, setVoiceAnalysis] = useState(false);
    const [appUpdates, setAppUpdates] = useState(true);

    // Storage keys
    const KEYS = {
        dailyMood: '@notif_dailyMood',
        journalReminder: '@notif_journalReminder',
        voiceAnalysis: '@notif_voiceAnalysis',
        appUpdates: '@notif_appUpdates',
    };

    // Load persisted values on mount
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const values = await AsyncStorage.multiGet(Object.values(KEYS));
                const prefs = Object.fromEntries(values.map(([k, v]) => [k, v]));

                if (prefs[KEYS.dailyMood] !== null) setDailyMood(prefs[KEYS.dailyMood] === 'true');
                if (prefs[KEYS.journalReminder] !== null) setJournalReminder(prefs[KEYS.journalReminder] === 'true');
                if (prefs[KEYS.voiceAnalysis] !== null) setVoiceAnalysis(prefs[KEYS.voiceAnalysis] === 'true');
                if (prefs[KEYS.appUpdates] !== null) setAppUpdates(prefs[KEYS.appUpdates] === 'true');
            } catch (e) {
                console.error('Failed to load notification preferences:', e);
            }
        };
        loadPrefs();
    }, []);

    // Generic toggle handler — updates state and immediately persists
    const handleToggle = async (key, storageKey, currentValue, setter) => {
        const newValue = !currentValue;
        setter(newValue);
        try {
            await AsyncStorage.setItem(storageKey, String(newValue));
        } catch (e) {
            console.error(`Failed to save ${key} preference:`, e);
        }
    };

    const renderNotificationRow = (iconName, title, subtitle, value, onValueChange, isLast = false) => (
        <View style={[styles.notificationRow, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconContainerBg }]}>
                <Ionicons name={iconName} size={24} color="#6B8EFE" />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: textColor }]}>{title}</Text>
                <Text style={[styles.rowSubtitle, { color: subTextColor }]}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: isDarkMode ? '#444' : '#E5E7EB', true: '#6B8EFE' }}
                thumbColor={value ? '#FFFFFF' : isDarkMode ? '#999' : '#F9FAFB'}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                <Text style={[styles.sectionDescription, { color: subTextColor }]}>
                    Manage what alerts you receive to help keep your mental wellbeing on track.
                </Text>

                <View style={[styles.card, { backgroundColor: cardColor, borderColor: borderColor }]}>
                    {renderNotificationRow(
                        'happy-outline',
                        'Daily Mood Check-in',
                        'Remind me to log how I feel',
                        dailyMood,
                        (v) => handleToggle('dailyMood', KEYS.dailyMood, dailyMood, setDailyMood)
                    )}
                    {renderNotificationRow(
                        'book-outline',
                        'Journaling Reminder',
                        'Evening reminder to empty my mind',
                        journalReminder,
                        (v) => handleToggle('journalReminder', KEYS.journalReminder, journalReminder, setJournalReminder)
                    )}
                    {renderNotificationRow(
                        'mic-outline',
                        'Voice Analysis Prompt',
                        'Weekly vocal tone check-in',
                        voiceAnalysis,
                        (v) => handleToggle('voiceAnalysis', KEYS.voiceAnalysis, voiceAnalysis, setVoiceAnalysis)
                    )}
                    {renderNotificationRow(
                        'megaphone-outline',
                        'App Updates & Tips',
                        'Stay in the loop with MindAura',
                        appUpdates,
                        (v) => handleToggle('appUpdates', KEYS.appUpdates, appUpdates, setAppUpdates),
                        true
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerPlaceholder: {
        width: 44,
    },
    // Main Container
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    sectionDescription: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 24,
    },
    // Card & Rows
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Very light gray border
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FAF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        paddingRight: 16,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    rowSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
});
