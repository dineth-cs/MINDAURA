import React, { createContext, useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AppState } from 'react-native';
import io from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [isSuspended, setIsSuspended] = useState(false);
    const [hasNotification, setHasNotification] = useState(false);
    const [userId, setUserId] = useState(null);
    const appState = useRef(AppState.currentState);
    const socket = useRef(null);

    // Check for stored token on first load
    useEffect(() => {
        const checkLoginState = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                setUserToken(token);
                if (token) {
                    const profile = await checkUserStatus(token);
                    if (profile && profile._id) {
                        setUserId(profile._id);
                    }
                }
            } catch (e) {
                console.error('Failed to load token from storage', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginState();
    }, []);

    // Socket.io initialization
    useEffect(() => {
        if (userToken && userId) {
            socket.current = io('https://mindaura-wfut.onrender.com', {
                transports: ['websocket'],
                autoConnect: true
            });

            socket.current.on('connect', () => {
                console.log('⚡ Socket connected for user:', userId);
                socket.current.emit('join_user', userId);
            });

            socket.current.on('account_status_changed', (data) => {
                console.log('🚨 Account status changed via socket:', data);
                if (data.status === 'SUSPENDED') {
                    setIsSuspended(true);
                } else if (data.status === 'ACTIVE') {
                    setIsSuspended(false);
                }
            });

            socket.current.on('new_notification', (data) => {
                console.log('🔔 New real-time notification:', data);
                setHasNotification(true);
            });

            return () => {
                if (socket.current) {
                    socket.current.disconnect();
                }
            };
        }
    }, [userToken, userId]);

    // Silent ping to verify user status
    const checkUserStatus = async (token) => {
        try {
            const response = await axios.get('https://mindaura-wfut.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.user;
        } catch (err) {
            console.log('Proactive status check failed:', err.response?.status);
            return null;
        }
    };

    // AppState listener
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                AsyncStorage.getItem('userToken').then(token => {
                    if (token) checkUserStatus(token);
                });
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, []);

    // Axios interceptor
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response) {
                    if (error.response.status === 401) {
                        try {
                            await AsyncStorage.removeItem('userToken');
                            setUserToken(null);
                            setUserId(null);
                            setIsSuspended(false);
                        } catch (e) {
                            console.error('Logout error on 401:', e);
                        }
                    } else if (error.response.status === 403 && error.response.data.message === 'Account suspended') {
                        setIsSuspended(true);
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    const authContext = useMemo(
        () => ({
            signIn: async (token, userData) => {
                setIsLoading(true);
                try {
                    await AsyncStorage.setItem('userToken', token);
                    setUserToken(token);
                    if (userData && (userData._id || userData.id)) {
                        setUserId(userData._id || userData.id);
                    }
                    setIsSuspended(false);
                } catch (e) { console.error(e); }
                setIsLoading(false);
            },
            signOut: async () => {
                console.log("AuthContext: Starting signOut process...");
                try {
                    await AsyncStorage.removeItem('userToken');
                    console.log("AuthContext: userToken removed from storage.");
                } catch (e) { 
                    console.error('AuthContext: Error removing token during logout:', e); 
                } finally {
                    console.log("AuthContext: Updating state (userToken: null)...");
                    setUserToken(null);
                    setUserId(null);
                    setIsSuspended(false);
                }
            },
            userToken,
            userId,
            isSuspended,
            setIsSuspended,
            hasNotification,
            setHasNotification,
            isLoading
        }),
        [userToken, userId, isSuspended, hasNotification, isLoading]
    );

    return (
        <AuthContext.Provider value={authContext}>
            {children}
        </AuthContext.Provider>
    );
};
