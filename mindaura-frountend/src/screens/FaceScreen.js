import React, { useState, useRef, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

export default function FaceScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    const [permission, requestPermission] = useCameraPermissions();
    const [photo, setPhoto] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const cameraRef = useRef(null);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const cameraPlaceholderBg = isDarkMode ? '#1A2128' : '#EBF5FF';

    const handleCaptureAnalyze = async () => {
        if (photo) {
            // Retake photo logic
            setPhoto(null);
            console.log("Retaking photo...");
        } else {
            // Take picture logic
            if (cameraRef.current) {
                console.log("Taking picture...");
                const picture = await cameraRef.current.takePictureAsync({
                    quality: 1,      // highest quality
                    base64: true,
                });
                setPhoto(picture.uri);
                console.log("Photo captured and stored at:", picture.uri);
            }
        }
    };

    const handleAnalyzeReady = async () => {
        setIsAnalyzing(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                await axios.post(
                    'https://mindaura-wfut.onrender.com/api/emotion/save',
                    { mood: 'Happy', source: 'face' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (err) {
            console.warn('Could not save mood entry (face):', err.message);
        } finally {
            setIsAnalyzing(false);
            navigation.navigate('RecommendationsScreen', { mood: 'Happy' });
        }
    };

    const renderCameraArea = () => {
        if (!permission) {
            // Camera permissions are still loading
            return (
                <View style={[styles.cameraBox, { backgroundColor: cameraPlaceholderBg, borderColor: isDarkMode ? '#224466' : '#90CAF9' }]}>
                    <ActivityIndicator size="large" color="#64B5F6" />
                </View>
            );
        }

        if (!permission.granted) {
            // Camera permissions are not granted yet
            return (
                <View style={[styles.cameraBox, { backgroundColor: cameraPlaceholderBg, borderColor: isDarkMode ? '#224466' : '#90CAF9' }]}>
                    <Ionicons name="camera-outline" size={60} color="#64B5F6" />
                    <Text style={[styles.cameraBoxText, { color: isDarkMode ? '#bbdefb' : '#1E88E5' }]}>
                        We need your permission to show the camera
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // We have permission. Show either the live feed or the captured photo
        return (
            <View style={[styles.cameraFrame, { backgroundColor: cameraPlaceholderBg }]}>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.cameraView} />
                ) : (
                    <CameraView
                        style={styles.cameraView}
                        facing="front"
                        ref={cameraRef}
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.container, { backgroundColor: bgColor }]}>

                {/* Header */}
                <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Scan Face</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* Subtitle / Instructions */}
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                    Show how you feel... Our AI will analyze your facial micro-expressions.
                </Text>

                {/* Center Area: Camera Display area */}
                <View style={styles.cameraPlaceholderArea}>
                    {renderCameraArea()}
                </View>

                {/* Action Button */}
                <View style={styles.bottomActions}>
                    {photo ? (
                        <>
                            <TouchableOpacity
                                style={styles.analyzeButton}
                                onPress={handleAnalyzeReady}
                                activeOpacity={0.8}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.analyzeButtonText}>Analyze My Face ✨</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.retakeButton}
                                onPress={handleCaptureAnalyze}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.retakeButtonText}>Retake Photo</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.analyzeButton}
                            onPress={handleCaptureAnalyze}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.analyzeButtonText}>Capture & Analyze ✨</Text>
                        </TouchableOpacity>
                    )}
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
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    // Camera Area
    cameraPlaceholderArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 24, // spacing above the bottom button
    },
    cameraFrame: {
        width: '100%',
        height: '70%',
        maxHeight: 400,
        backgroundColor: '#EBF5FF',
        borderRadius: 20,
        overflow: 'hidden', // Crops the CameraView to the rounded corners
        // Optional subtle shadow
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cameraView: {
        flex: 1,
    },
    // Permission State UI inside the box
    cameraBox: {
        width: '100%',
        height: '70%',
        maxHeight: 400,
        backgroundColor: '#EBF5FF', // Very Light Blue
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#90CAF9', // Dashed/solid border color
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    cameraBoxText: {
        marginTop: 16,
        fontSize: 16,
        color: '#1E88E5',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    permissionButton: {
        backgroundColor: '#1E88E5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
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
    retakeButton: {
        marginTop: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    retakeButtonText: {
        color: '#6B7280', // Soft gray
        fontSize: 16,
        fontWeight: '600',
    },
});
