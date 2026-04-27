import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function MeditationScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]);
            setIsActive(false);
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const toggleTimer = () => {
        if (timeLeft === 0) {
            setTimeLeft(300);
            setIsActive(true);
        } else {
            setIsActive(!isActive);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Meditation</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.centerContent}>
                <Text style={[styles.mainTitle, { color: currentTheme.text }]}>
                    5-Minute Meditation
                </Text>

                <Ionicons name="leaf-outline" size={80} color="#6B8EFE" style={styles.icon} />
                <Text style={[styles.timerText, { color: currentTheme.text }]}>
                    {formatTime(timeLeft)}
                </Text>

                <Text style={[styles.instructions, { color: currentTheme.subText }]}>
                    {!isActive
                        ? "Find a quiet, comfortable space, relax your body, and press play to begin."
                        : "Close your eyes, breathe naturally, and focus on the present moment..."}
                </Text>

                <TouchableOpacity
                    style={styles.playPauseBtn}
                    onPress={toggleTimer}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isActive ? "pause" : "play"}
                        size={40}
                        color="#ffffff"
                        style={{ marginLeft: isActive ? 0 : 6 }}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    icon: {
        marginBottom: 30,
    },
    timerText: {
        fontSize: 72,
        fontWeight: '300',
        marginBottom: 30,
    },
    instructions: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
        marginBottom: 40,
    },
    playPauseBtn: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#6B8EFE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    }
});
