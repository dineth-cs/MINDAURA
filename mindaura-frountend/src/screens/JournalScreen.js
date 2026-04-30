import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    ActivityIndicator,
    Alert,
    DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

export default function JournalScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    const { userId } = useContext(AuthContext);
    const [journalText, setJournalText] = useState('');
    const [detectedMood, setDetectedMood] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const inputBgColor = isDarkMode ? '#1E1E1E' : '#FAF5FF';
    const resultCardBg = isDarkMode ? '#2A2A2A' : '#F3F4F6';
    const borderColor = isDarkMode ? '#333333' : '#E9D5FF';

    const updateStreak = async () => {
        try {
            const todayStr = new Date().toDateString();
            const lastLogDate = await AsyncStorage.getItem(`lastMoodLogDate_${userId}`);
            const storedStreak = await AsyncStorage.getItem(`streakCount_${userId}`);
            let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 0;

            if (lastLogDate === todayStr) {
                console.log('Streak: Already logged today. Streak stays at', currentStreak);
                return;
            }

            if (lastLogDate) {
                const lastDate = new Date(lastLogDate);
                const today = new Date(todayStr);
                const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentStreak += 1;
                    console.log('Streak: Consecutive day! New streak =', currentStreak);
                } else {
                    currentStreak = 1;
                    console.log('Streak: Missed a day. Reset to 1.');
                }
            } else {
                currentStreak = 1;
                console.log('Streak: First mood log! Streak starts at 1.');
            }

            await AsyncStorage.setItem(`lastMoodLogDate_${userId}`, todayStr);
            await AsyncStorage.setItem(`streakCount_${userId}`, String(currentStreak));
        } catch (e) {
            console.warn('Could not update streak:', e);
        }
    };

    const handleAnalyzeMood = async () => {
        if (journalText.trim() === '') {
            Alert.alert("Input Required", "Please pour your thoughts into the journal before analyzing!");
            return;
        }
        Keyboard.dismiss();
        setIsAnalyzing(true);
        setDetectedMood('Analyzing...');
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                await axios.post(
                    'https://mindaura-wfut.onrender.com/api/emotion/save',
                    { mood: 'Happy', source: 'journal' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                await updateStreak();
                DeviceEventEmitter.emit('MoodUpdated');
            }
        } catch (err) {
            console.warn('Could not save mood entry (journal):', err.message);
        } finally {
            setIsAnalyzing(false);
            setDetectedMood('Happy');
            navigation.navigate('RecommendationsScreen', { mood: 'Happy' });
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                style={styles.keyBoardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={[styles.container, { backgroundColor: bgColor }]}>

                        {/* Header */}
                        <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={28} color={textColor} />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { color: textColor }]}>Write a Journal</Text>
                            <View style={styles.headerPlaceholder} />
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Subtitle / Instructions */}
                            <Text style={[styles.subtitle, { color: subTextColor }]}>
                                Pour your thoughts out... Our AI will gently analyze how you are feeling.
                            </Text>

                            {/* Text Input Area */}
                            <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
                                <TextInput
                                    style={[styles.textInput, { color: textColor }]}
                                    placeholder="Start typing here... e.g., Today I felt overwhelmed because..."
                                    placeholderTextColor={subTextColor}
                                    multiline
                                    textAlignVertical="top"
                                    value={journalText}
                                    onChangeText={setJournalText}
                                />
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={styles.analyzeButton}
                                onPress={handleAnalyzeMood}
                                activeOpacity={0.8}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.analyzeButtonText}>Analyze My Mood ✨</Text>
                                )}
                            </TouchableOpacity>

                            {/* Placeholder Result Card */}
                            <View style={[styles.resultCard, { backgroundColor: resultCardBg, borderColor: borderColor }]}>
                                <Ionicons name="pulse" size={24} color="#6B8EFE" style={[styles.resultIcon, { backgroundColor: isDarkMode ? 'rgba(107, 142, 254, 0.2)' : '#E0C8FF' }]} />
                                <View>
                                    <Text style={[styles.resultTitle, { color: textColor }]}>Detected Mood:</Text>
                                    <Text style={[styles.resultText, { color: subTextColor }]}>
                                        {detectedMood ? detectedMood : 'Waiting for input...'}
                                    </Text>
                                </View>
                            </View>

                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyBoardContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerPlaceholder: {
        width: 44,
    },
    // Main Content
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    // Input Area
    inputContainer: {
        height: '40%', // Takes up about 40% of the screen height
        minHeight: 250,
        backgroundColor: '#FAF5FF', // Very light purple
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9D5FF', // Subtle purple border
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    // Analyze Button
    analyzeButton: {
        backgroundColor: '#6B8EFE', // Brand Purple
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    analyzeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Result Card
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray placeholder background
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    resultIcon: {
        marginRight: 16,
        backgroundColor: '#E0C8FF', // Soft purple background for icon
        padding: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    resultText: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});
