import React, { useState, useContext, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { UserContext } from '../context/UserContext';

// Initialize Socket.io connection pointing to the backend
const socket = io('https://mindaura-wfut.onrender.com', { autoConnect: false });

export default function HelpSupportScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(UserContext);
    
    // Ensure messages is solidly initialized as an empty array
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [currentTicketId, setCurrentTicketId] = useState(null);
    const flatListRef = useRef(null);

    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subTextColor = isDarkMode ? '#AAAAAA' : '#6B7280';
    const inputBgColor = isDarkMode ? '#2A2A2A' : '#F3F4F6';
    const userBubbleColor = '#7C3AED';
    const adminBubbleColor = isDarkMode ? '#333333' : '#E5E7EB';
    const adminTextColor = isDarkMode ? '#FFFFFF' : '#111827';

    // 1. Fetch chat history and Join Socket Room
    const fetchMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get('https://mindaura-wfut.onrender.com/api/support/my-messages', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            
            const data = response.data;
            
            // 🔥 Safety Check: Ensure the data is always an array before setting state!
            let chatHistory = [];
            let incomingTicketId = null;

            if (data && data.history && Array.isArray(data.history)) {
                // Handling the updated backend response object format: { history: [], ticketId: "" }
                chatHistory = data.history;
                incomingTicketId = data.ticketId;
            } else if (Array.isArray(data)) {
                // Fallback catch just in case it returns raw arrays
                chatHistory = data;
            }

            setMessages(chatHistory);
            
            // Connect to Socket.io and emit join_ticket explicitly for this exact thread
            if (incomingTicketId) {
                setCurrentTicketId(incomingTicketId);
                if (!socket.connected) {
                    socket.connect();
                }
                socket.emit('join_ticket', incomingTicketId);
            }

            if (!initialFetchDone) setInitialFetchDone(true);
        } catch (error) {
            console.error("Fetch Messages Error:", error.response ? error.response.data : error.message);
            // Default to empty array safely on crash
            setMessages([]);
        }
    };

    // 2. Real-time Socket.io Listener Setup
    useEffect(() => {
        fetchMessages();

        // 🎧 Listen for live WebSocket broadcasts from Admin responses!
        socket.on('receive_message', (newMessage) => {
            // Safely append to the existing array state
            setMessages((prevMessages) => {
                const isArray = Array.isArray(prevMessages) ? prevMessages : [];
                // Basic deduplication check just in case the optimistic UI already added it
                const alreadyExists = isArray.some(msg => msg.text === newMessage.text && msg.sender === newMessage.sender);
                
                if (!alreadyExists) {
                    // Trigger native Push Notification if admin replied!
                    if (newMessage.sender === 'admin') {
                        Notifications.scheduleNotificationAsync({
                            content: {
                                title: '⚡ MindAura Support',
                                body: newMessage.text,
                                data: { screen: 'HelpSupportScreen' },
                            },
                            trigger: null,
                        });
                    }
                    return [...isArray, newMessage];
                }
                return isArray;
            });
        });

        // Cleanup hook when user leaves screen
        return () => {
            socket.off('receive_message');
            socket.disconnect();
        };
    }, []);

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        // Keep optimistic UI for pure speed on the frontend
        const optimisticMessage = {
            _id: Math.random().toString(),
            sender: 'user',
            text: messageText,
            time: new Date().toISOString()
        };
        
        setMessages((prev) => Array.isArray(prev) ? [...prev, optimisticMessage] : [optimisticMessage]);
        
        const textToSend = messageText;
        setMessageText('');
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post('https://mindaura-wfut.onrender.com/api/support', 
                { message: textToSend },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 
                }
            );
            // Backend will auto-broadcast our socket message, but we deduplicate it via text matcher above.
            // Still re-fetch seamlessly to guarantee IDs track cleanly
            fetchMessages(); 
        } catch (error) {
            console.error("Support Error:", error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    };

    // Render individual chat bubble
    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageWrapper, 
                isUser ? styles.messageWrapperUser : styles.messageWrapperAdmin
            ]}>
                {!isUser && (
                    <View style={styles.adminAvatar}>
                        <Ionicons name="headset" size={16} color="#FFFFFF" />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? { backgroundColor: userBubbleColor, borderBottomRightRadius: 4 } 
                           : { backgroundColor: adminBubbleColor, borderBottomLeftRadius: 4 }
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? { color: '#FFFFFF' } : { color: adminTextColor }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timeText,
                        isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: subTextColor }
                    ]}>
                        {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header Profile Section */}
                <View style={[styles.headerContainer, { backgroundColor: bgColor, borderBottomColor: isDarkMode ? '#333' : '#EEEEEE' }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={textColor} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: textColor }]}>MindAura Support</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 }} />
                            <Text style={[styles.headerSubtitle, { color: '#10B981' }]}>Online (Socket.io)</Text>
                        </View>
                    </View>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* Real-time Chat Area */}
                {!initialFetchDone ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={userBubbleColor} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.chatListContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={56} color={isDarkMode ? '#333' : '#E5E7EB'} />
                                <Text style={[styles.emptyText, { color: subTextColor }]}>
                                    Send us a message! We typically reply within a few minutes.
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* Bottom Input Field */}
                <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderTopColor: isDarkMode ? '#333' : '#E5E7EB' }]}>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: inputBgColor, color: textColor }]}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder="Type a message..."
                        placeholderTextColor={subTextColor}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: messageText.trim() ? userBubbleColor : subTextColor }]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        zIndex: 10,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
    },
    backButton: {
        padding: 4,
    },
    headerPlaceholder: {
        width: 32,
    },
    chatListContent: {
        padding: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
        fontFamily: 'Inter-Medium',
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
        alignItems: 'flex-end',
    },
    messageWrapperUser: {
        alignSelf: 'flex-end',
    },
    messageWrapperAdmin: {
        alignSelf: 'flex-start',
    },
    adminAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 15,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    timeText: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
        fontFamily: 'Inter-Medium',
    },
    inputWrapper: {
        flexDirection: 'row',
        padding: 12,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
        alignItems: 'flex-end',
    },
    textInput: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 14 : 12,
        paddingBottom: Platform.OS === 'ios' ? 14 : 12,
        minHeight: 48,
        maxHeight: 120,
        fontSize: 15,
        fontFamily: 'Inter-Regular',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        marginBottom: 0,
    },
    sendIcon: {
        marginLeft: 4, 
    }
});
