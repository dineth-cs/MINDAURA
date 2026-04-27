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
  const appState = useRef(AppState.currentState);
  const isAuthenticating = useRef(false);

  useEffect(() => {
    const handleBiometricAuth = async () => {
      // Prevent multiple prompts if one is already active
      if (isAuthenticating.current) return;

      const isLockEnabled = await AsyncStorage.getItem('isAppLockEnabled');
      if (isLockEnabled === 'true' && userToken) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          isAuthenticating.current = true;
          try {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Unlock MindAura',
              fallbackLabel: 'Use Passcode',
              disableDeviceFallback: false,
            });

            if (!result.success) {
              Alert.alert('Locked', 'Authentication required to access MindAura.');
              // Reset flag so they can retry
              isAuthenticating.current = false;
              handleBiometricAuth(); 
            }
          } catch (error) {
            console.error("Biometric auth error:", error);
          } finally {
            isAuthenticating.current = false;
          }
        }
      }
    };

    // Run on initial load
    handleBiometricAuth();

    // Run on app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
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
