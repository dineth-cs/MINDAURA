import React, { useContext, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, AppState, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider, UserContext } from './src/context/UserContext';
import { AuthProvider, AuthContext } from './src/context/AuthContext';

const AppContent = () => {
  const { currentTheme, isDarkMode } = useContext(UserContext);
  const { isLoading, userToken } = useContext(AuthContext);
  
  console.log("AppContent: userToken:", userToken ? "EXISTS" : "NULL", "isLoading:", isLoading);

  const appState = useRef(AppState.currentState);
  const isAuthenticated = useRef(false);

  const handleBiometricAuth = async () => {
    // If already authenticated in this "session" (since last background), skip
    if (isAuthenticated.current) return;

    const isLockEnabled = await AsyncStorage.getItem('isAppLockEnabled');
    if (isLockEnabled === 'true' && userToken) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock MindAura',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
          });

          if (result.success) {
            isAuthenticated.current = true;
          } else {
            Alert.alert('Locked', 'Authentication required to access MindAura.');
            handleBiometricAuth(); // Retry
          }
        } catch (error) {
          console.error("Biometric auth error:", error);
        }
      }
    } else {
      // If lock is not enabled or user not logged in, consider them "authenticated"
      isAuthenticated.current = true;
    }
  };

  useEffect(() => {
    // Initial check on mount
    handleBiometricAuth();

    const subscription = AppState.addEventListener('change', nextAppState => {
      // Reset authentication status ONLY when the app is sent to the background/minimized
      // This ignores the 'inactive' state triggered by the biometric modal itself on iOS
      if (nextAppState === 'background') {
        isAuthenticated.current = false;
      }

      // Trigger authentication when returning to active state IF not already authenticated
      if (nextAppState === 'active') {
        handleBiometricAuth();
      }
      
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [userToken]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#181824' : '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <AppNavigator />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
