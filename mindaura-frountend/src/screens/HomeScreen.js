import React, { useContext, useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Animated,
    Modal,
    Platform,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
    const navigation = useNavigation();
    const { name, profilePic, isDarkMode, currentTheme, updateUserContext } = useContext(UserContext);
    const { signOut, hasNotification, setHasNotification } = useContext(AuthContext);

    const cardPurple = isDarkMode ? 'rgba(107, 142, 254, 0.15)' : '#F5EFFF';
    const cardYellow = isDarkMode ? 'rgba(245, 124, 0, 0.15)' : '#FFF8E1';
    const cardBlue = isDarkMode ? 'rgba(69, 90, 100, 0.15)' : '#EBF5FF';

    const summaryGreen = isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4';
    const summaryBlue = isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
    const summaryPurple = isDarkMode ? 'rgba(168, 85, 247, 0.15)' : '#FAF5FF';

    const [userData, setUserData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [permissionModalVisible, setPermissionModalVisible] = useState(false);
    const [permissionType, setPermissionType] = useState(''); // 'camera' or 'microphone'
    const [weeklyCount, setWeeklyCount] = useState(0);
    const [monthlyCount, setMonthlyCount] = useState(0);

    const handleScanFace = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status === 'granted') {
            navigation.navigate('ScanFaceScreen');
        } else {
            setPermissionType('camera');
            setPermissionModalVisible(true);
        }
    };

    const handleRecordVoice = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status === 'granted') {
            navigation.navigate('RecordVoiceScreen');
        } else {
            setPermissionType('microphone');
            setPermissionModalVisible(true);
        }
    };

    const toggleTask = async (id) => {
        const updatedTasks = tasks.map(t => (t.id || t._id) === id ? { ...t, completed: !t.completed } : t);
        setTasks(updatedTasks);
        await syncTasksToBackend(updatedTasks);
    };

    const deleteTask = async (id) => {
        const updatedTasks = tasks.filter(t => (t.id || t._id) !== id);
        setTasks(updatedTasks);
        await syncTasksToBackend(updatedTasks);
    };

    const addTask = async () => {
        if (newTaskText.trim()) {
            const updatedTasks = [...tasks, { id: Date.now(), title: newTaskText.trim(), completed: false }];
            setTasks(updatedTasks);
            setNewTaskText('');
            setIsAddingTask(false);
            await syncTasksToBackend(updatedTasks);
        }
    };

    // Persist task changes to the live backend
    const syncTasksToBackend = async (updatedTasks) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                await axios.put(
                    'https://mindaura-wfut.onrender.com/api/auth/profile',
                    { dailyTasks: updatedTasks },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (error) {
            console.error('Failed to sync tasks to backend:', error);
        }
    };

    const completedTasksCount = tasks.filter(t => t.completed).length;
    const totalTasksCount = tasks.length;

    // Pulse animation logic for FAB
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    // මෙතන තමයි අපි URL එක හැදුවේ (/api/auth/profile)
                    const response = await axios.get('https://mindaura-wfut.onrender.com/api/auth/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUserData(response.data);

                    // Sync with UserContext so ProfileScreen gets the latest changes immediately
                    updateUserContext({
                        name: response.data.name,
                        email: response.data.email,
                        profilePic: response.data.profilePicture
                    });

                    if (response.data.dailyTasks) {
                        setTasks(response.data.dailyTasks);
                    }

                    // Populate weekly/monthly stats from backend profile
                    if (response.data.weeklyTasksCompleted !== undefined) {
                        setWeeklyCount(response.data.weeklyTasksCompleted);
                    } else if (response.data.dailyTasks) {
                        // Fallback: count completed tasks this week from dailyTasks array
                        const completed = response.data.dailyTasks.filter(t => t.completed).length;
                        setWeeklyCount(completed);
                    }
                    if (response.data.monthlyTasksCompleted !== undefined) {
                        setMonthlyCount(response.data.monthlyTasksCompleted);
                    } else if (response.data.dailyTasks) {
                        const completed = response.data.dailyTasks.filter(t => t.completed).length;
                        setMonthlyCount(completed);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Gracefully handle 401 by redirecting back to Login via AuthContext
                if (error.response && error.response.status === 401) {
                    if (signOut) signOut();
                }
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const listener = Notifications.addNotificationReceivedListener(notification => {
            setHasNotification(true);
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            listener.remove();
        };
    }, [pulseAnim]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* Top Header Bar */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        style={styles.profileImageContainer}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        {userData?.profilePicture || profilePic ? (
                            <Image source={{ uri: userData?.profilePicture || profilePic }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person-circle" size={42} color={currentTheme.subText} style={{ marginLeft: -2, marginTop: -2 }} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.notificationIcon}
                        onPress={() => {
                            setHasNotification(false);
                            navigation.navigate('NotificationsScreen');
                        }}
                    >
                        <Ionicons name="notifications-outline" size={26} color={currentTheme.text} />
                        {hasNotification && (
                            <View style={{
                                position: 'absolute',
                                right: 4,
                                top: 4,
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#EF4444',
                                borderWidth: 2,
                                borderColor: currentTheme.bg
                            }} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Greeting Section */}
                <View style={styles.greetingContainer}>
                    <Text style={[styles.greetingTitle, { color: currentTheme.text }]}>Welcome back, {userData?.name || name} ✨</Text>
                    <Text style={[styles.greetingSubtitle, { color: currentTheme.subText }]}>How are you feeling today?</Text>
                </View>

                {/* Action Cards Grid */}
                <View style={styles.cardsGrid}>
                    <View style={styles.cardsRow}>
                        {/* Card 1: Write a Journal */}
                        <TouchableOpacity
                            style={[styles.cardContainer, { backgroundColor: cardPurple }]}
                            onPress={() => navigation.navigate('JournalScreen')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="pencil" size={24} color="#6B8EFE" />
                            </View>
                            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Write a Journal</Text>
                            <Text style={[styles.cardSubtitle, { color: currentTheme.subText }]}>Empty your mind...</Text>
                        </TouchableOpacity>

                        {/* Card 2: Record Voice */}
                        <TouchableOpacity
                            style={[styles.cardContainer, { backgroundColor: cardYellow }]}
                            onPress={handleRecordVoice}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="mic" size={24} color="#F57C00" />
                            </View>
                            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Record Voice</Text>
                            <Text style={[styles.cardSubtitle, { color: currentTheme.subText }]}>Speak your heart...</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Card 3: Scan Face (Full Width) */}
                    <TouchableOpacity
                        style={[styles.cardFullWidth, { backgroundColor: cardBlue }]}
                        onPress={handleScanFace}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="camera" size={24} color="#455A64" />
                        </View>
                        <View style={styles.cardTextContainerCenter}>
                            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Scan Face</Text>
                            <Text style={[styles.cardSubtitle, { color: currentTheme.subText }]}>Show how you feel...</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Daily Tasks Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Daily Tasks</Text>
                        <Text style={styles.keepGoingText}>✨ Keep going</Text>
                    </View>

                    <View style={styles.dailyTasksContentRow}>
                        <View style={[styles.progressCirclePlaceholder, { borderColor: currentTheme.border }]}>
                            <Text style={[styles.progressNumber, { color: currentTheme.text }]}>{completedTasksCount}</Text>
                            <Text style={[styles.progressOf, { color: currentTheme.subText }]}>of {totalTasksCount}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            {tasks.length === 0 ? (
                                <Text style={{ color: currentTheme.subText, fontStyle: 'italic', marginBottom: 12, fontSize: 15, paddingLeft: 4 }}>
                                    No tasks for today. Add one!
                                </Text>
                            ) : (
                                tasks.map((task, index) => (
                                    <View key={task.id || task._id || index.toString()} style={styles.taskRow}>
                                        <TouchableOpacity style={styles.taskToggle} onPress={() => toggleTask(task.id || task._id)}>
                                            <Ionicons
                                                name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                                                size={22}
                                                color={task.completed ? "#6B8EFE" : currentTheme.subText}
                                            />
                                            <Text style={[
                                                styles.taskText,
                                                { color: task.completed ? currentTheme.subText : currentTheme.text },
                                                task.completed && { textDecorationLine: 'line-through' }
                                            ]}>
                                                {task.title}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteTask(task.id || task._id)} style={{ padding: 4 }}>
                                            <Ionicons name="close" size={18} color={currentTheme.subText} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}

                            {isAddingTask ? (
                                <View style={styles.addTaskInputRow}>
                                    <TextInput
                                        style={[styles.taskInput, { color: currentTheme.text, borderColor: currentTheme.border, backgroundColor: currentTheme.card }]}
                                        placeholder="Enter task..."
                                        placeholderTextColor={currentTheme.subText}
                                        value={newTaskText}
                                        onChangeText={setNewTaskText}
                                        onSubmitEditing={addTask}
                                        autoFocus
                                    />
                                    <TouchableOpacity onPress={addTask} style={styles.addTaskConfirmBtn}>
                                        <Ionicons name="checkmark" size={24} color="#6B8EFE" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addTaskButtonTransparent} onPress={() => setIsAddingTask(true)}>
                                    <Text style={styles.addTaskButtonTextBlue}>+ Add your own task</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Progress Summary Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Your Progress Summary</Text>
                    <View style={styles.progressSummaryRow}>
                        <View style={[styles.summaryBlock, { backgroundColor: summaryGreen }]}>
                            <Text style={[styles.summaryNumber, { color: '#22C55E' }]}>{completedTasksCount}</Text>
                            <Text style={[styles.summaryLabel, { color: isDarkMode ? '#4ADE80' : '#15803D' }]}>Today</Text>
                        </View>
                        <View style={[styles.summaryBlock, { backgroundColor: summaryBlue }]}>
                            <Text style={[styles.summaryNumber, { color: '#3B82F6' }]}>{weeklyCount}</Text>
                            <Text style={[styles.summaryLabel, { color: isDarkMode ? '#60A5FA' : '#1D4ED8' }]}>This Week</Text>
                        </View>
                        <View style={[styles.summaryBlock, { backgroundColor: summaryPurple }]}>
                            <Text style={[styles.summaryNumber, { color: '#A855F7' }]}>{monthlyCount}</Text>
                            <Text style={[styles.summaryLabel, { color: isDarkMode ? '#C084FC' : '#7E22CE' }]}>This Month</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View style={[styles.fabWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('BreathingScreen')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="leaf" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* Permission Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={permissionModalVisible}
                onRequestClose={() => setPermissionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: currentTheme.card || '#FFFFFF' }]}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons
                                name={permissionType === 'camera' ? 'camera' : 'mic'}
                                size={40}
                                color="#6B8EFE"
                            />
                        </View>
                        <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Permission Required</Text>
                        <Text style={[styles.modalBody, { color: currentTheme.subText }]}>
                            {permissionType === 'camera'
                                ? "We need access to your camera to scan your face and analyze your mood."
                                : "We need access to your microphone to record your voice and transcribe your thoughts."}
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setPermissionModalVisible(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Not Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={() => {
                                    setPermissionModalVisible(false);
                                    Linking.openSettings();
                                }}
                            >
                                <Text style={styles.modalButtonConfirmText}>Allow Access</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 80, // Extra padding for FAB
    },

    // Header Styles
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    profileImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    notificationIcon: {
        padding: 4,
    },

    // Greeting Section
    greetingContainer: {
        marginBottom: 32,
        alignItems: 'flex-start',
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    greetingSubtitle: {
        fontSize: 16,
        fontWeight: '400',
    },

    // Cards Grid Styles
    cardsGrid: {
        marginBottom: 32,
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardContainer: {
        flex: 1,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 4,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    cardFullWidth: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 4,
    },
    iconContainer: {
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
    },
    cardTextContainerCenter: {
        marginLeft: 16,
        alignItems: 'flex-start',
    },

    // Daily Tasks Section
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    keepGoingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D97706', // Gold/Yellow
    },
    dailyTasksContentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align to top for multiline lists
    },
    progressCirclePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 4,
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    progressOf: {
        fontSize: 10,
        lineHeight: 12,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingRight: 4,
    },
    taskToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    taskText: {
        fontSize: 15,
        marginLeft: 10,
        fontWeight: '500',
        flexShrink: 1, // Allow text wrapping
    },
    addTaskInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    taskInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
    },
    addTaskConfirmBtn: {
        marginLeft: 12,
        padding: 4,
    },
    addTaskButtonTransparent: {
        paddingVertical: 8,
        marginTop: 4,
    },
    addTaskButtonTextBlue: {
        fontSize: 15,
        color: '#6B8EFE',
        fontWeight: '600',
    },

    // Progress Summary Section
    progressSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    summaryBlock: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 15,
        marginHorizontal: 4,
    },
    summaryNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Floating Action Button
    fabWrapper: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        elevation: 6,
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    fab: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: '#6B8EFE', // Primary Brand Color
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(107, 142, 254, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalBody: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    modalButtonConfirm: {
        backgroundColor: '#6B8EFE',
        marginLeft: 8,
    },
    modalButtonCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    modalButtonConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});