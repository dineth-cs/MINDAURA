import React, { useContext, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';

export const navigationRef = createNavigationContainerRef();
import { AuthContext } from '../context/AuthContext'; 

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SuspendedScreen from '../screens/SuspendedScreen';

// Import sub-screens
import EditProfileScreen from '../screens/EditProfileScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import BreathingScreen from '../screens/BreathingScreen';
import VoiceScreen from '../screens/VoiceScreen';
import FaceScreen from '../screens/FaceScreen';
import JournalScreen from '../screens/JournalScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import ProgressReportScreen from '../screens/ProgressReportScreen';

// Explore screens
import MeditationScreen from '../screens/MeditationScreen';
import SleepSoundsScreen from '../screens/SleepSoundsScreen';
import ArticleScreen from '../screens/ArticleScreen';
import StretchScreen from '../screens/StretchScreen';

const Stack = createStackNavigator();

function AuthenticatedApp() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RecordVoiceScreen" component={VoiceScreen} />
            <Stack.Screen name="ScanFaceScreen" component={FaceScreen} />
            <Stack.Screen name="JournalScreen" component={JournalScreen} />
            <Stack.Screen name="RecommendationsScreen" component={RecommendationsScreen} />
            <Stack.Screen name="BreathingScreen" component={BreathingScreen} />
            <Stack.Screen name="ProgressReportScreen" component={ProgressReportScreen} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            <Stack.Screen name="AccountDetailsScreen" component={AccountDetailsScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} />
            <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
            <Stack.Screen name="MeditationScreen" component={MeditationScreen} />
            <Stack.Screen name="SleepSoundsScreen" component={SleepSoundsScreen} />
            <Stack.Screen name="ArticleScreen" component={ArticleScreen} />
            <Stack.Screen name="StretchScreen" component={StretchScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { userToken, isSuspended } = useContext(AuthContext);

    console.log("AppNavigator: Rendering. userToken:", userToken ? "EXISTS" : "NULL", "isSuspended:", isSuspended);

    useEffect(() => {
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const screen = response.notification.request.content.data?.screen || 'HelpSupportScreen';
            if (navigationRef.isReady()) {
                navigationRef.navigate(screen);
            }
        });
        return () => responseListener.remove();
    }, []);

    return (
        <NavigationContainer 
            ref={navigationRef}
            key={userToken ? 'authenticated' : 'unauthenticated'}
        >
            {/* 1. If suspended, completely block app access and show SuspendedScreen */}
            {isSuspended ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Suspended" component={SuspendedScreen} />
                </Stack.Navigator>
            ) : (
                /* 2. Main Auth Flow: userToken == null ? AuthStack : AppStack */
                userToken ? <AuthenticatedApp /> : <AuthStack />
            )}
        </NavigationContainer>
    );
}