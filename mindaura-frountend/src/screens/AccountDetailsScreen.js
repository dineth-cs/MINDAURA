import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const AccountDetailsScreen = ({ navigation }) => {
    const { email, updateUserContext, isDarkMode } = useContext(UserContext); 
    const { signOut } = useContext(AuthContext);

    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#666666';
    const inputBgColor = isDarkMode ? '#1E1E1E' : '#F8F9FA';
    const readOnlyInputBg = isDarkMode ? '#2A2A2A' : '#F0F0F0';
    const borderColor = isDarkMode ? '#333333' : '#EEEEEE';
    const eyeIconColor = isDarkMode ? '#BBBBBB' : '#999999';

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail.includes('@')) {
            Alert.alert("Error", "Please enter a valid email address.");
            return;
        }
        setIsUpdatingEmail(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.put(`${API_URL}/api/auth/update-email`, 
                { newEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                Alert.alert("Success", "Email updated successfully! Please log in again.", [
                    { text: "OK", onPress: () => handleLogout() }
                ]);
            }
        } catch (error) {
            console.error("Email update error:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to update email.");
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert("Error", "Please fill in all password fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match!");
            return;
        }
        setIsUpdatingPassword(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.put(`${API_URL}/api/auth/update-password`, 
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                Alert.alert("Success", "Password updated successfully!");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error("Password update error:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to update password.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.delete(`${API_URL}/api/auth/delete-account`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert("Deleted", "Your account has been permanently removed.");
                            await handleLogout();
                        } catch (error) {
                            console.error("Delete account error:", error);
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete account.");
                            setIsDeleting(false);
                        }
                    } 
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { backgroundColor: bgColor }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Account Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Change Email Section */}
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Change Email</Text>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Current Email</Text>
                        <TextInput
                            style={[styles.input, styles.readOnlyInput, { backgroundColor: readOnlyInputBg, color: subTextColor }]}
                            value={email}
                            editable={false}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>New Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBgColor, color: textColor }]}
                            placeholder="Enter new email"
                            placeholderTextColor={subTextColor}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handleUpdateEmail}
                        disabled={isUpdatingEmail}
                    >
                        {isUpdatingEmail ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Update Email</Text>
                        )}
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    {/* Change Password Section */}
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Change Password</Text>
                    
                    <View style={[styles.passwordContainer, { backgroundColor: inputBgColor }]}>
                        <TextInput
                            style={[styles.passwordInput, { color: textColor }]}
                            placeholder="Current Password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry={!showCurrentPassword}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={24} color={eyeIconColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.passwordContainer, { backgroundColor: inputBgColor }]}>
                        <TextInput
                            style={[styles.passwordInput, { color: textColor }]}
                            placeholder="New Password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={24} color={eyeIconColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.passwordContainer, { backgroundColor: inputBgColor }]}>
                        <TextInput
                            style={[styles.passwordInput, { color: textColor }]}
                            placeholder="Confirm New Password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={eyeIconColor} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handleUpdatePassword}
                        disabled={isUpdatingPassword}
                    >
                        {isUpdatingPassword ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Update Password</Text>
                        )}
                    </TouchableOpacity>

                    {/* Danger Zone */}
                    <View style={styles.dangerZone}>
                        <Text style={styles.dangerTitle}>Danger Zone</Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteAccount}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#FF3B30" />
                            ) : (
                                <Text style={styles.deleteText}>Delete Account</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={[styles.warningText, { color: subTextColor }]}>
                            Once you delete your account, there is no going back. Please be certain.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    inputGroup: { marginBottom: 15 },
    input: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    readOnlyInput: { color: '#999', backgroundColor: '#F0F0F0' },
    primaryButton: {
        backgroundColor: '#6B8EFE',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 25 },
    dangerZone: { marginTop: 20 },
    dangerTitle: { color: '#FF3B30', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    deleteButton: {
        backgroundColor: '#FFEBEB',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
    warningText: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 10 },
});

export default AccountDetailsScreen;
