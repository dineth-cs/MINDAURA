import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      // Safely fetch push token without crashing on projectId issues
      const expoConfig = Constants?.expoConfig || Constants?.manifest;
      const projectId = expoConfig?.extra?.eas?.projectId || expoConfig?.projectId;
      
      if (projectId) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('My Push Token:', token);
      } else {
        console.warn("No projectId found for Push Notifications");
      }
    } catch (e) {
      console.warn("Silent failure during Expo push token retrieval:", e.message);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
export const UserContext = createContext();

const theme = {
    light: { bg: '#FFFFFF', card: '#F8F9FA', text: '#000000', subText: '#666666', border: '#EEEEEE', tabBg: '#FFFFFF' },
    dark: { bg: '#181824', card: '#252536', text: '#FFFFFF', subText: '#A0A0B0', border: '#333344', tabBg: '#12121A' }
};

export const UserProvider = ({ children }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [dob, setDob] = useState(null);
    const [age, setAge] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // 1. Instantly load cached profile pic for snappy UI
                const cachedPic = await AsyncStorage.getItem('profilePic');
                if (cachedPic) {
                    setProfilePic(cachedPic);
                }

                // 2. Fetch fresh data from backend if token exists (silent update)
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const response = await axios.get('https://mindaura-wfut.onrender.com/api/auth/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (response.data) {
                        if (response.data.name) setName(response.data.name);
                        if (response.data.email) setEmail(response.data.email);
                        if (response.data.profilePicture) {
                            setProfilePic(response.data.profilePicture);
                            // Keep cache updated
                            await AsyncStorage.setItem('profilePic', response.data.profilePicture);
                        }
                        if (response.data.dateOfBirth) setDob(response.data.dateOfBirth);
                        if (response.data.age) setAge(response.data.age);
                    }

                    // Request Push Token and update backend
                    try {
                        const pushToken = await registerForPushNotificationsAsync();
                        if (pushToken) {
                            await axios.put('https://mindaura-wfut.onrender.com/api/auth/update-push-token', 
                                { expoPushToken: pushToken },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                        }
                    } catch (pushErr) {
                        console.log("Push token update error:", pushErr);
                    }
                }
            } catch (error) {
                console.error("Failed to load user data on startup:", error);
            }
        };

        loadUserData();
    }, []);

    const currentTheme = isDarkMode ? theme.dark : theme.light;

    const updateUserContext = (updates) => {
        if (updates.name !== undefined) setName(updates.name);
        if (updates.email !== undefined) setEmail(updates.email);
        if (updates.profilePic !== undefined) setProfilePic(updates.profilePic);
        if (updates.dob !== undefined) setDob(updates.dob);
        if (updates.age !== undefined) setAge(updates.age);
    };

    const clearUserContext = async () => {
        setName('');
        setEmail('');
        setProfilePic(null);
        setDob(null);
        setAge('');
        try {
            await AsyncStorage.removeItem('profilePic');
        } catch (e) {
            console.error("Failed to clear profilePic from storage", e);
        }
    };

    return (
        <UserContext.Provider value={{
            name, email, profilePic, dob, age, updateUserContext, clearUserContext,
            isDarkMode, setIsDarkMode, currentTheme
        }}>
            {children}
        </UserContext.Provider>
    );
};
