import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function WelcomeScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Ionicons name="leaf" size={60} color="#6B8EFE" />
                </View>

                {/* Typography */}
                <Text style={[styles.title, { color: currentTheme.text }]}>MindAura</Text>
                <Text style={[styles.subtitle, { color: currentTheme.subText }]}>
                    Your AI-Powered Mental Wellness Assistant
                </Text>

                {/* Primary Action Button */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('SignUp')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                </TouchableOpacity>

                {/* Secondary Action Button */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8EEFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 30,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 50,
        lineHeight: 24,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#6B8EFE',
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6B8EFE',
    },
    secondaryButtonText: {
        color: '#6B8EFE',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
