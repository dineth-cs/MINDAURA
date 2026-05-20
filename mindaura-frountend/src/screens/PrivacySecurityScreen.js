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
    ActivityIndicator,
    Modal,
    DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function PrivacySecurityScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    const { signOut } = useContext(AuthContext);
    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);

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
            'Are you sure you want to delete all your mood history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: async () => {
                        setIsClearing(true);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.put(`${API_URL}/api/v1/auth/clear-data`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            
                            DeviceEventEmitter.emit('MoodUpdated');
                            
                            Alert.alert(
                                'Success',
                                'All your mood history has been successfully deleted.',
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

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Danger Zone: This action is irreversible. Delete account?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            
                            // 1. Delete from Backend
                            await axios.delete(`${API_URL}/api/v1/auth/delete-account`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            
                            // 2. Clear Local Storage
                            await AsyncStorage.removeItem('userToken');
                            
                            // 3. Show Success & Force Navigate to Start
                            Alert.alert(
                                'Success',
                                'Your account has been permanently deleted.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            if (typeof signOut === 'function') {
                                                signOut(); // If AuthContext handles logout
                                            } else {
                                                navigation.reset({
                                                    index: 0,
                                                    routes: [{ name: 'Login' }] // Change 'Login' to your actual start screen name if different
                                                });
                                            }
                                        }
                                    }
                                ],
                                { cancelable: false }
                            );

                        } catch (error) {
                            console.error('Failed to delete account:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Something went wrong while deleting your account.');
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        setPrivacyModalVisible(true);
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
                        disabled={isClearing || isDeleting}
                    >
                        {isClearing ? (
                            <ActivityIndicator color="#FF3B30" />
                        ) : (
                            <Text style={styles.clearDataButtonText}>Clear All My Data</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.warningText}>
                        This will permanently delete all your mood history.
                    </Text>

                    <TouchableOpacity
                        style={[styles.clearDataButton, { marginTop: 16 }]}
                        onPress={handleDeleteAccount}
                        activeOpacity={0.8}
                        disabled={isClearing || isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator color="#FF3B30" />
                        ) : (
                            <Text style={styles.clearDataButtonText}>Delete Account</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.warningText}>
                        Danger Zone: This action is irreversible.
                    </Text>
                </View>

            </ScrollView>

            {/* Privacy Policy Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPrivacyModalVisible}
                onRequestClose={() => setPrivacyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: bgColor, borderColor: borderColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Privacy Policy</Text>
                            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                                <Ionicons name="close" size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            <Text style={[styles.modalText, { color: textColor }]}>
                                Welcome to MindAura's Privacy Policy. Your trust is our top priority, and we are committed to protecting your personal and mental health data.
                            </Text>
                            
                            <Text style={[styles.modalSubtitle, { color: textColor }]}>1. Process-and-Discard Architecture</Text>
                            <Text style={[styles.modalText, { color: subTextColor }]}>
                                We utilize a strict "process-and-discard" architecture for Face and Voice data analysis. Your raw biometric data (images and audio) is never saved on our servers. Once processed to generate an emotion label, the raw files are immediately deleted permanently.
                            </Text>

                            <Text style={[styles.modalSubtitle, { color: textColor }]}>2. AES-256 Encryption for Journals</Text>
                            <Text style={[styles.modalText, { color: subTextColor }]}>
                                All your journal text entries are encrypted using industry-standard AES-256 encryption. This ensures your private thoughts are strictly confidential and unreadable by any unauthorized parties.
                            </Text>

                            <Text style={[styles.modalSubtitle, { color: textColor }]}>3. Zero Data Selling Policy</Text>
                            <Text style={[styles.modalText, { color: subTextColor }]}>
                                MindAura explicitly ensures that your data is never sold to third parties under any circumstances. We do not monetize your personal information or mental health history.
                            </Text>
                            
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setPrivacyModalVisible(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    modalScroll: {
        paddingBottom: 24,
    },
    modalSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 22,
    },
    modalCloseButton: {
        backgroundColor: '#6B8EFE',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});