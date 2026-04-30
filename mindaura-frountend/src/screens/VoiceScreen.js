import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    DeviceEventEmitter
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

export default function VoiceScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    const { userId } = useContext(AuthContext);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [duration, setDuration] = useState(0);
    const [recordingUri, setRecordingUri] = useState(null);
    const timerRef = useRef(null);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const pulseActiveBg = isDarkMode ? '#D32F2F' : '#FF5252';
    const recordBtnBg = isDarkMode ? '#2C2A1E' : '#FFF9C4';

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

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            console.log('Requesting permissions..');
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                console.warn('Permission to access microphone was denied');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            setDuration(0); // Reset timer
            setRecordingUri(null); // Clear previous recording value

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((prevDuration) => prevDuration + 1);
            }, 1000);

            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        console.log('Stopping recording..');
        setRecording(undefined);
        setIsRecording(false);

        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (recording) {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped and stored at', uri);
            setRecordingUri(uri);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleAnalyzeVoice = async () => {
        if (!recordingUri && !isRecording) {
            Alert.alert("Recording Required", "Please record your voice first so we can analyze it!");
            return;
        }
        if (isRecording) {
            console.log("Analyzing Voice... Please stop recording first.");
            return;
        }
        setIsAnalyzing(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                await axios.post(
                    'https://mindaura-wfut.onrender.com/api/emotion/save',
                    { mood: 'Happy', source: 'voice' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                await updateStreak();
                DeviceEventEmitter.emit('MoodUpdated');
            }
        } catch (err) {
            console.warn('Could not save mood entry (voice):', err.message);
        } finally {
            setIsAnalyzing(false);
            navigation.navigate('RecommendationsScreen', { mood: 'Happy' });
        }
    };

    // Format duration to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>

                {/* Header */}
                <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Record Voice</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* Subtitle / Instructions */}
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                    Speak your mind... Our AI will analyze your vocal tones.
                </Text>

                {/* Center Area: Recording Button & Timer */}
                <View style={styles.centerArea}>

                    {/* Recording Button */}
                    <TouchableOpacity
                        style={[
                            styles.recordButton,
                            { backgroundColor: recordBtnBg },
                            isRecording && [styles.recordButtonActive, { backgroundColor: pulseActiveBg, shadowColor: pulseActiveBg }]
                        ]}
                        onPress={toggleRecording}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isRecording ? "stop" : "mic"}
                            size={60}
                            color={isRecording ? "#FFFFFF" : "#FFA500"}
                        />
                    </TouchableOpacity>

                    {/* Timer */}
                    <Text style={[styles.timerText, { color: textColor }]}>
                        {formatTime(duration)}
                    </Text>

                    {/* Status Text */}
                    <Text style={[styles.statusText, { color: subTextColor }]}>
                        {isRecording ? "Recording..." : "Tap the microphone to start recording"}
                    </Text>

                </View>

                {/* Action Button */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={handleAnalyzeVoice}
                        activeOpacity={0.8}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.analyzeButtonText}>Analyze Voice ✨</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    // Header
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginLeft: -8, // Adjust visual alignment
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerPlaceholder: {
        width: 44,
    },
    // Subtitle
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 40,
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    // Center Area
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFF9C4', // Light Yellow/Orange
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        // Soft Shadow
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    recordButtonActive: {
        backgroundColor: '#FF5252', // Pulsing Red for active recording
        shadowColor: '#FF5252',
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#111827',
        fontVariant: ['tabular-nums'], // keeps numbers monospaced
        marginBottom: 12,
    },
    statusText: {
        fontSize: 16,
        color: '#6B7280',
    },
    // Bottom Action
    bottomActions: {
        paddingBottom: 40, // Padding from bottom safe area
    },
    analyzeButton: {
        backgroundColor: '#6B8EFE', // Brand Purple
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
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
});
