import React, { useState, useContext, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Linking,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

export default function PrivacySecurityScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    const { signOut } = useContext(AuthContext);
    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const cardColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const infoCardColor = isDarkMode ? '#2A2A2A' : '#F9FAFB';
    const borderColor = isDarkMode ? '#333333' : '#F3F4F6';

    useEffect(() => {
        loadLockStatus();
    }, []);

    const loadLockStatus = async () => {
        try {
            const status = await AsyncStorage.getItem('isAppLockEnabled');
            setIsAppLockEnabled(status === 'true');
        } catch (error) {
            console.error('Failed to load lock status:', error);
        }
    };

    const toggleAppLock = async (value) => {
        try {
            if (value) {
                // If turning ON, verify first
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (!hasHardware || !isEnrolled) {
                    Alert.alert(
                        'Not Available',
                        'Your device does not support biometrics or no biometrics are enrolled.'
                    );
                    return;
                }

                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirm to enable App Lock',
                    fallbackLabel: 'Use Passcode',
                });

                if (result.success) {
                    await AsyncStorage.setItem('isAppLockEnabled', 'true');
                    setIsAppLockEnabled(true);
                    Alert.alert('Success', 'App Lock enabled successfully.');
                }
            } else {
                // If turning OFF, verify first
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirm to disable App Lock',
                });

                if (result.success) {
                    await AsyncStorage.setItem('isAppLockEnabled', 'false');
                    setIsAppLockEnabled(false);
                    Alert.alert('Success', 'App Lock disabled.');
                }
            }
        } catch (error) {
            console.error('Biometric toggle error:', error);
            Alert.alert('Error', 'An error occurred while configuring biometrics.');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All My Data',
            'This will permanently delete all your mood history, journal entries, and support tickets from our servers. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: async () => {
                        setIsClearing(true);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.delete('https://mindaura-wfut.onrender.com/api/users/clear-data', {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            
                            Alert.alert(
                                'Data Cleared',
                                'All your personal data has been permanently removed from our servers.',
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            console.error('Failed to clear data:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Something went wrong while clearing your data.');
                        } finally {
                            setIsClearing(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        const url = 'https://mindaura-wfut.onrender.com/privacy';
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL('https://www.privacypolicygenerator.info/');
            }
        }).catch(err => console.error('Failed to open privacy policy:', err));
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Privacy & Security</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                <Text style={[styles.sectionDescription, { color: subTextColor }]}>
                    Your trust is our top priority. We use industry-standard security to protect your mental health data.
                </Text>

                {/* App Lock Section */}
                <View style={[styles.appLockCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
                    <View style={styles.textContainer}>
                        <Text style={[styles.rowTitle, { color: textColor }]}>App Lock (Biometrics)</Text>
                        <Text style={[styles.rowSubtitle, { color: subTextColor }]}>Require Face ID / Fingerprint to open MindAura</Text>
                    </View>
                    <Switch
                        value={isAppLockEnabled}
                        onValueChange={toggleAppLock}
                        trackColor={{ false: isDarkMode ? '#444' : '#E5E7EB', true: '#6B8EFE' }}
                        thumbColor={isAppLockEnabled ? '#FFFFFF' : isDarkMode ? '#999' : '#F9FAFB'}
                    />
                </View>

                {/* Data Usage & AI Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>How We Use Your Data</Text>

                    {/* Card 1 */}
                    <View style={[styles.infoCard, { backgroundColor: infoCardColor, borderColor: borderColor }]}>
                        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }]}>
                            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={[styles.infoTitle, { color: textColor }]}>Face & Voice Analysis</Text>
                            <Text style={[styles.infoSubtitle, { color: subTextColor }]}>
                                Your facial and vocal data are only processed locally or securely on our AI servers for mood detection and are never shared or sold.
                            </Text>
                        </View>
                    </View>

                    {/* Card 2 */}
                    <View style={[styles.infoCard, { backgroundColor: infoCardColor, borderColor: borderColor }]}>
                        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(107, 142, 254, 0.2)' : '#F3E5F5' }]}>
                            <Ionicons name="lock-closed" size={24} color="#6B8EFE" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={[styles.infoTitle, { color: textColor }]}>Journal Encryption</Text>
                            <Text style={[styles.infoSubtitle, { color: subTextColor }]}>
                                All your private journal entries are encrypted end-to-end and securely stored. Only you can read them.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={styles.privacyPolicyButton}
                        onPress={handlePrivacyPolicy}
                    >
                        <Text style={styles.privacyPolicyText}>Read Full Privacy Policy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.clearDataButton}
                        onPress={handleClearData}
                        activeOpacity={0.8}
                        disabled={isClearing}
                    >
                        {isClearing ? (
                            <ActivityIndicator color="#FF3B30" />
                        ) : (
                            <Text style={styles.clearDataButtonText}>Clear All My Data</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.warningText}>
                        This will permanently delete all your mood history and journal entries.
                    </Text>
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
    appLockCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 32,
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
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    infoSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    bottomActions: {
        marginTop: 'auto',
        alignItems: 'center',
    },
    privacyPolicyButton: {
        paddingVertical: 12,
        marginBottom: 24,
    },
    privacyPolicyText: {
        color: '#6B8EFE',
        fontSize: 16,
        fontWeight: '600',
    },
    clearDataButton: {
        backgroundColor: '#FFEBEB',
        borderRadius: 16,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearDataButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
    },
    warningText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
});
