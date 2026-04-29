import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function ChatScreen() {
    const { currentTheme, isDarkMode, name } = useContext(UserContext);
    const { userToken } = useContext(AuthContext);
    const [messages, setMessages] = useState([
        {
            _id: 1,
            text: `Hello ${name || 'there'}! ✨ I'm Aura, your wellness assistant. How are you feeling today?`,
            createdAt: new Date(),
            user: { _id: 2, name: 'Aura' },
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef();

    const sendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage = {
            _id: Math.random().toString(),
            text: inputText,
            createdAt: new Date(),
            user: { _id: 1 },
        };

        setMessages(previousMessages => [userMessage, ...previousMessages]);
        setInputText('');
        setIsLoading(true);
        Keyboard.dismiss();

        try {
            // Forced explicit URL and simplified payload to resolve 404
            const response = await axios.post(
                'https://mindaura-wfut.onrender.com/api/chat',
                {
                    message: inputText,
                    history: []
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    }
                }
            );

            const auraResponse = {
                _id: Math.random().toString(),
                text: response.data.response || response.data.reply || "I'm here to listen.",
                createdAt: new Date(),
                user: { _id: 2, name: 'Aura' },
            };

            setMessages(previousMessages => [auraResponse, ...previousMessages]);
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage = {
                _id: Math.random().toString(),
                text: "⚠️ Sorry, I'm having trouble connecting right now.",
                createdAt: new Date(),
                user: { _id: 2, name: 'Aura' },
            };
            setMessages(previousMessages => [errorMessage, ...previousMessages]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isUser = item.user._id === 1;
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.auraMessageContainer
            ]}>
                {!isUser && (
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>A</Text>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? 
                        { backgroundColor: '#6B8EFE', borderBottomRightRadius: 4 } : 
                        { backgroundColor: isDarkMode ? '#2D2D2D' : '#F0F0F0', borderBottomLeftRadius: 4 }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#FFFFFF' : currentTheme.text }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : currentTheme.subText }
                    ]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <View style={styles.auraStatusCircle} />
                    <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Aura Chat</Text>
                </View>
                <TouchableOpacity onPress={() => setMessages([messages[messages.length - 1]])}>
                    <Ionicons name="refresh-outline" size={20} color={currentTheme.subText} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item._id.toString()}
                inverted
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#6B8EFE" />
                    <Text style={[styles.loadingText, { color: currentTheme.subText }]}>Aura is thinking...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputWrapper, { backgroundColor: currentTheme.card, borderTopColor: currentTheme.border }]}>
                    <TextInput
                        style={[styles.input, { color: currentTheme.text }]}
                        placeholder="Type your message..."
                        placeholderTextColor={currentTheme.subText}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]} 
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    auraStatusCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ADE80',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chatContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
        paddingTop: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        maxWidth: '85%',
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    auraMessageContainer: {
        alignSelf: 'flex-start',
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6B8EFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageBubble: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 18,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    loadingText: {
        fontSize: 12,
        marginLeft: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6B8EFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});
