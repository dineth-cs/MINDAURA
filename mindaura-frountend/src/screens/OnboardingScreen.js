import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
    {
        key: '1',
        title: 'Welcome to MindAura',
        text: 'Your personal AI companion for mental wellness. Track your daily mood and lifestyle effortlessly.',
        icon: 'leaf',
        color: '#6B8EFE',
    },
    {
        key: '2',
        title: 'AI Emotion Detection',
        text: 'We analyze your facial expressions, vocal tones, and text to understand exactly how you feel.',
        icon: 'scan-outline',
        color: '#6B8EFE',
    },
    {
        key: '3',
        title: 'Track Your Journey',
        text: 'View beautiful analytics and daily insights to improve your mental wellbeing over time.',
        icon: 'bar-chart-outline',
        color: '#6B8EFE',
    }
];

export default function OnboardingScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);

    const renderItem = ({ item }) => {
        return (
            <SafeAreaView style={[styles.slide, { backgroundColor: currentTheme.bg }]}>
                <Ionicons name={item.icon} size={100} color={item.color} style={styles.icon} />
                <Text style={[styles.title, { color: currentTheme.text }]}>{item.title}</Text>
                <Text style={[styles.text, { color: currentTheme.subText }]}>{item.text}</Text>
            </SafeAreaView>
        );
    };

    const renderNextButton = () => {
        return (
            <View style={styles.buttonCircle}>
                <Ionicons name="arrow-forward-outline" color="rgba(255, 255, 255, .9)" size={24} />
            </View>
        );
    };

    const renderDoneButton = () => {
        return (
            <View style={styles.buttonCircle}>
                <Ionicons name="checkmark" color="rgba(255, 255, 255, .9)" size={24} />
            </View>
        );
    };

    const renderSkipButton = () => {
        return (
            <View style={styles.skipButton}>
                <Text style={[styles.skipText, { color: currentTheme.subText }]}>Skip</Text>
            </View>
        );
    };

    const onDone = () => {
        navigation.replace('Welcome');
    };

    return (
        <AppIntroSlider
            renderItem={renderItem}
            data={slides}
            onDone={onDone}
            onSkip={onDone}
            showSkipButton={true}
            renderNextButton={renderNextButton}
            renderDoneButton={renderDoneButton}
            renderSkipButton={renderSkipButton}
            activeDotStyle={{ backgroundColor: '#6B8EFE' }}
            dotStyle={{ backgroundColor: 'rgba(107, 142, 254, 0.3)' }}
        />
    );
}

const styles = StyleSheet.create({
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    icon: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonCircle: {
        width: 40,
        height: 40,
        backgroundColor: '#6B8EFE',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
