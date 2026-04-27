import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Image,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { name, email, profilePic, dob, age, updateUserContext, isDarkMode } = useContext(UserContext);

    // Form state
    const [localName, setLocalName] = useState(name);
    const [localPic, setLocalPic] = useState(profilePic);
    const [localDob, setLocalDob] = useState(dob ? new Date(dob) : null);
    const [localAge, setLocalAge] = useState(age);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const inputBgColor = isDarkMode ? '#1E1E1E' : '#FAF5FF';
    const disabledInputBg = isDarkMode ? '#2A2A2A' : '#F3F4F6';
    const borderColor = isDarkMode ? '#333333' : '#F3E8FF';
    const labelColor = isDarkMode ? '#CCCCCC' : '#4B5563';

    const calculateAge = (birthDate) => {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        return calculatedAge.toString();
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setLocalDob(selectedDate);
            setLocalAge(calculateAge(selectedDate));
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setLocalPic(base64Img);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalPic = localPic;
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
                setIsSaving(false);
                return;
            }

            // 1. Update Profile Picture separately if it changed
            if (localPic !== profilePic && localPic?.startsWith('data:image')) {
                const response = await axios.put('https://mindaura-wfut.onrender.com/api/auth/update-profile-picture', 
                    { profilePicture: localPic }, 
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                if (response.status === 200) {
                    finalPic = response.data.profilePicture || localPic;
                }
            }

            // 2. Update Textual Profile Details (Name, DOB, Age)
            const profileResponse = await axios.put('https://mindaura-wfut.onrender.com/api/auth/update-profile', 
                {
                    name: localName,
                    dateOfBirth: localDob ? localDob.toISOString() : null,
                    age: localAge
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            if (profileResponse.status === 200) {
                Alert.alert("Success", "Profile updated successfully!");
                
                updateUserContext({
                    name: profileResponse.data.name || localName,
                    profilePic: finalPic,
                    dob: profileResponse.data.dateOfBirth,
                    age: profileResponse.data.age || localAge
                });
                navigation.goBack();
            }

        } catch (error) {
            console.error('Save Error:', error);
            Alert.alert("Error", error.response?.data?.message || "Failed to upload profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : null}
            >
                {/* Header */}
                <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                    {/* Profile Picture Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {localPic ? (
                                <Image source={{ uri: localPic }} style={styles.profileAvatar} />
                            ) : (
                                <Ionicons name="person-circle" size={100} color={isDarkMode ? '#556688' : '#7C98E2'} />
                            )}
                            {/* Small Camera Button */}
                            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8} onPress={pickImage}>
                                <Ionicons name="camera" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.changePicButton} onPress={pickImage}>
                            <Text style={styles.changePicText}>Change Picture</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Input Fields Section */}
                    <View style={styles.formSection}>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: labelColor }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBgColor, color: textColor, borderColor: borderColor }]}
                                value={localName}
                                onChangeText={setLocalName}
                                placeholder="E.g., Dineth"
                                placeholderTextColor={subTextColor}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: labelColor }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled, { backgroundColor: disabledInputBg, color: subTextColor, borderColor: borderColor }]}
                                value={email}
                                placeholder="E.g., dineth@example.com"
                                placeholderTextColor={subTextColor}
                                editable={false} // Disabled field
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: labelColor }]}>Date of Birth</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: inputBgColor, borderColor: borderColor }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: localDob ? textColor : subTextColor, fontSize: 16 }}>
                                    {localDob ? localDob.toLocaleDateString() : 'Select your Date of Birth'}
                                </Text>
                            </TouchableOpacity>

                            {/* iOS Modal Picker */}
                            {Platform.OS === 'ios' && (
                                <Modal
                                    transparent={true}
                                    animationType="slide"
                                    visible={showDatePicker}
                                    onRequestClose={() => setShowDatePicker(false)}
                                >
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                    <Text style={styles.doneButtonText}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <DateTimePicker
                                                value={localDob || new Date()}
                                                mode="date"
                                                display="spinner"
                                                onChange={handleDateChange}
                                                maximumDate={new Date()}
                                                textColor={isDarkMode ? "#FFFFFF" : "#000000"}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            )}

                            {/* Android Picker */}
                            {Platform.OS === 'android' && showDatePicker && (
                                <DateTimePicker
                                    value={localDob || new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: labelColor }]}>Age</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled, { backgroundColor: disabledInputBg, color: subTextColor, borderColor: borderColor }]}
                                value={localAge}
                                placeholder="Age will be calculated automatically"
                                placeholderTextColor={subTextColor}
                                editable={false}
                            />
                        </View>

                    </View>

                    <View style={styles.bottomActions}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            activeOpacity={0.8}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    // Header
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
    // Main Container
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    // Avatar Section
    avatarSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#6B8EFE',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePicButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    changePicText: {
        color: '#6B8EFE',
        fontWeight: '600',
        fontSize: 16,
    },
    // Form Section
    formSection: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FAF5FF', // Very light purple
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#F3E8FF',
    },
    inputDisabled: {
        backgroundColor: '#F3F4F6', // Light gray to indicate disabled state
        color: '#6B7280',
        borderColor: '#E5E7EB',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 16,
    },
    // Save Button
    bottomActions: {
        marginTop: 40,
        paddingBottom: 20,
    },
    saveButton: {
        backgroundColor: '#6B8EFE', // Brand Purple
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal Styles for iOS Picker
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    modalHeader: {
        width: '100%',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    doneButtonText: {
        color: '#6B8EFE',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
