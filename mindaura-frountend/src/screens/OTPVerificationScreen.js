import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export default function OTPVerificationScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const email = route.params?.email;

    // 1. Setup the state for 6 inputs
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);

    // Maintain references to each input for auto-focusing
    const inputRefs = useRef([]);

    const handleOtpChange = (value, index) => {
        // Allow only numeric values
        const numericValue = value.replace(/[^0-9]/g, '');

        const newOtp = [...otp];
        newOtp[index] = numericValue;
        setOtp(newOtp);

        // Auto focus to next input
        if (numericValue && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        // Auto focus to previous input on backspace if current is empty
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('https://mindaura-wfut.onrender.com/api/auth/verify-otp', {
                email: email,
                otp: otpString,
            });

            if (response.status === 200) {
                // Navigate to ResetPasswordScreen and pass parameters
                navigation.navigate('ResetPasswordScreen', { email: email, otp: otpString });
            }
        } catch (error) {
            Alert.alert('Error', 'Invalid or expired OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.innerContainer}>

                        {/* Header with Back Button */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={28} color="#333333" />
                            </TouchableOpacity>
                        </View>

                        {/* Title and Subtitle */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>Enter Verification Code</Text>
                            <Text style={styles.subtitle}>
                                We've sent a 6-digit code to your email.
                            </Text>
                        </View>

                        {/* Custom OTP Input visually appearing as 6 boxes */}
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    style={[
                                        styles.otpInput,
                                        digit ? styles.otpInputFilled : null
                                    ]}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify Code</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive the code? </Text>
                            <TouchableOpacity onPress={() => Alert.alert('Sent!', 'A new code has been sent.')}>
                                <Text style={styles.resendLink}>Resend</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        marginTop: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    textContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: 48,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    otpInputFilled: {
        borderColor: '#6B8EFE',
        backgroundColor: '#F0F4FF',
    },
    verifyButton: {
        backgroundColor: '#6B8EFE',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 24,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#666666',
    },
    resendLink: {
        fontSize: 14,
        color: '#6B8EFE',
        fontWeight: '600',
    },
});
