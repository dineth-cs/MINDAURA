import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import MainTabs from './MainTabs';
import JournalScreen from '../screens/JournalScreen';
import VoiceScreen from '../screens/VoiceScreen';
import FaceScreen from '../screens/FaceScreen';
import BreathingScreen from '../screens/BreathingScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

// Import Explore screens
import MeditationScreen from '../screens/MeditationScreen';
import SleepSoundsScreen from '../screens/SleepSoundsScreen';
import ArticleScreen from '../screens/ArticleScreen';
import StretchScreen from '../screens/StretchScreen';

// Import new sub-screens
import EditProfileScreen from '../screens/EditProfileScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import ProgressReportScreen from '../screens/ProgressReportScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
            <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="JournalScreen" component={JournalScreen} />
            <Stack.Screen name="RecordVoiceScreen" component={VoiceScreen} />
            <Stack.Screen name="ScanFaceScreen" component={FaceScreen} />
            <Stack.Screen name="BreathingScreen" component={BreathingScreen} />
            <Stack.Screen name="RecommendationsScreen" component={RecommendationsScreen} />
            <Stack.Screen name="ProgressReportScreen" component={ProgressReportScreen} />

            {/* Explore Flow */}
            <Stack.Screen name="MeditationScreen" component={MeditationScreen} />
            <Stack.Screen name="SleepSoundsScreen" component={SleepSoundsScreen} />
            <Stack.Screen name="ArticleScreen" component={ArticleScreen} />
            <Stack.Screen name="StretchScreen" component={StretchScreen} />

            {/* Profile Sub-screens */}
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            <Stack.Screen name="AccountDetailsScreen" component={AccountDetailsScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} />
            <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
        </Stack.Navigator>
    );
}
