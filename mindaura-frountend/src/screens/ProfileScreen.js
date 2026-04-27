import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'https://mindaura-wfut.onrender.com';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { name, email, profilePic, isDarkMode, setIsDarkMode, currentTheme, updateUserContext } = useContext(UserContext);
    const { signOut } = useContext(AuthContext);

    const [isUploading, setIsUploading] = useState(false);

    // Dynamic Colors based on Dark Mode state
    const bgColor = currentTheme.bg;
    const textColor = currentTheme.text;
    const cardBgColor = currentTheme.card;
    const subTextColor = currentTheme.subText;
    const iconContainerBg = isDarkMode ? '#2C223A' : '#FAF5FF'; // Darker purple tint for icon bg in dark mode
    const borderColor = currentTheme.border;

    const handleImagePick = async () => {
        console.log("1. Image picker launched");
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Permission to access camera roll is required!");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
                base64: true,
            });

            if (pickerResult.canceled) {
                console.log("1.5. Image selection canceled by user");
                return;
            }

            const result = pickerResult;
            const base64Image = pickerResult.assets[0].base64 || '';

            console.log("1. Image Selected:", result.assets[0].uri);
            console.log("2. Base64 length:", base64Image.length);

            setIsUploading(true);
            const base64Img = `data:image/jpeg;base64,${base64Image}`;
            const payload = { profilePicture: base64Img };

            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const url = `${API_URL}/api/auth/update-profile-picture`;
                console.log("3. Sending to:", url);
                console.log("4. Payload check:", JSON.stringify(payload).substring(0, 100));
                try {
                    const response = await axios.put(url, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log("6. Response received, status:", response.status);

                    if (response.status === 200) {
                        updateUserContext({ profilePic: base64Img });
                        Alert.alert('Success', 'Profile picture updated successfully');
                        console.log("7. UI UserContext updated successfully");
                    }
                } catch (uploadError) {
                    console.error('8. Upload Error details:', uploadError.response?.data || uploadError.message);
                    Alert.alert('Upload Error', uploadError?.response?.data?.message || uploadError.message || 'Failed to update profile picture');
                }
            } else {
                console.log("X. No token found in AsyncStorage");
                Alert.alert("Error", "Authentication token not found.");
            }
        } catch (error) {
            console.error('Error in handleImagePick setup:', error);
            Alert.alert('Error', 'An unexpected error occurred before upload');
        } finally {
            setIsUploading(false);
            console.log("9. Upload process finished (finally block)");
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSettingPress = (title) => {
        if (title === 'Dark Mode') return;

        switch (title) {
            case 'Account Details':
                navigation.navigate('AccountDetailsScreen');
                break;
            case 'Notifications':
                navigation.navigate('NotificationsScreen');
                break;
            case 'Privacy & Security':
                navigation.navigate('PrivacySecurityScreen');
                break;
            case 'Help & Support':
                navigation.navigate('HelpSupportScreen');
                break;
            default:
                break;
        }
    };

    const renderSettingRow = (iconName, title, isSwitch = false) => (
        <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: isDarkMode ? 1 : 0 }]}
            activeOpacity={0.7}
            onPress={() => handleSettingPress(title)}
            disabled={isSwitch} // Disable touchable if it's the switch row to let switch handle toggle properly
        >
            <View style={[styles.settingIconContainer, { backgroundColor: iconContainerBg }]}>
                <Ionicons name={iconName} size={24} color="#6B8EFE" />
            </View>
            <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
            {isSwitch ? (
                <Switch
                    value={isDarkMode}
                    onValueChange={setIsDarkMode}
                    trackColor={{ false: '#767577', true: '#6B8EFE' }}
                    thumbColor={isDarkMode ? '#FFFFFF' : '#f4f3f4'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={subTextColor} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
                </View>

                {/* User Info Section */}
                <View style={styles.userInfoContainer}>
                    <TouchableOpacity onPress={handleImagePick} disabled={isUploading}>
                        {isUploading ? (
                            <View style={[styles.profileAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e1e1' }]}>
                                <ActivityIndicator size="large" color="#6B8EFE" />
                            </View>
                        ) : profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.profileAvatar} />
                        ) : (
                            <Ionicons name="person-circle" size={100} color="#7C98E2" />
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.userName, { color: textColor }]}>{name}</Text>
                    <Text style={[styles.userEmail, { color: subTextColor }]}>{email}</Text>

                    <TouchableOpacity
                        style={styles.editProfileBadge}
                        onPress={() => navigation.navigate('EditProfileScreen')}
                    >
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings List */}
                <View style={styles.settingsSection}>
                    {renderSettingRow('person-outline', 'Account Details')}
                    {renderSettingRow('notifications-outline', 'Notifications')}
                    {renderSettingRow('shield-checkmark-outline', 'Privacy & Security')}
                    {renderSettingRow('moon-outline', 'Dark Mode', true)}
                    {renderSettingRow('help-circle-outline', 'Help & Support')}
                </View>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    // Header
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    // User Info
    userInfoContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 32,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 4, // Matches Ionicons implied margin roughly
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 12,
    },
    userEmail: {
        fontSize: 16,
        marginTop: 4,
    },
    editProfileBadge: {
        marginTop: 16,
        backgroundColor: '#F3E5F5',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    editProfileText: {
        color: '#6B8EFE',
        fontWeight: '600',
        fontSize: 14,
    },
    // Settings Section
    settingsSection: {
        marginBottom: 40,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2, // for Android shadow
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    // Logout
    logoutContainer: {
        marginTop: 'auto',
    },
    logoutButton: {
        backgroundColor: '#FFEBEB',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
