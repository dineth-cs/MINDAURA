import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const stretches = [
    { id: 1, title: 'Neck Rolls', duration: 30, emoji: '🔄' },
    { id: 2, title: 'Shoulder Shrugs', duration: 30, emoji: '🤷‍♂️' },
    { id: 3, title: 'Torso Twists', duration: 30, emoji: '🧘‍♂️' },
    { id: 4, title: 'Forward Fold', duration: 30, emoji: '🙇‍♂️' }
];

export default function StretchScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);

    // State Management
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [timeLeft, setTimeLeft] = useState(stretches[0].duration);
    const [isFinished, setIsFinished] = useState(false);

    // Timer Logic
    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Move to next stretch or finish
            if (currentStep < stretches.length - 1) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                setTimeLeft(stretches[nextStep].duration);
            } else {
                setIsFinished(true);
                setIsActive(false);
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, currentStep]);

    const handleToggle = () => {
        if (isFinished) {
            // Reset routine
            setCurrentStep(0);
            setTimeLeft(stretches[0].duration);
            setIsFinished(false);
            setIsActive(true);
        } else {
            // Play/Pause
            setIsActive(!isActive);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={currentTheme.text} />
                </TouchableOpacity>
                <View style={{ width: 28 }} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {isFinished ? (
                    // Finished State
                    <>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle-outline" size={120} color="#4CAF50" />
                        </View>
                        <Text style={[styles.title, { color: currentTheme.text }]}>Routine Complete!</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.subText }]}>Great job starting your day right.</Text>
                    </>
                ) : (
                    // Active guided stretch state
                    <>
                        <View style={styles.iconContainer}>
                            <Text style={{ fontSize: 90 }}>{stretches[currentStep].emoji}</Text>
                        </View>

                        <Text style={[styles.title, { color: currentTheme.text }]}>{stretches[currentStep].title}</Text>
                        <Text style={[styles.timerText, { color: currentTheme.text }]}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.subText, marginTop: 8 }]}>
                            {currentStep + 1} of {stretches.length}
                        </Text>
                    </>
                )}

                <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleToggle}>
                    <Text style={styles.buttonText}>
                        {isFinished ? "Restart Routine" : (isActive ? "Pause" : "Start")}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
    },
    iconContainer: {
        marginBottom: 40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(107, 142, 254, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#6B8EFE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        width: '100%',
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
