import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { UserContext } from '../context/UserContext';

export default function SuspendedScreen() {
    const { signOut } = useContext(AuthContext);
    const { currentTheme } = useContext(UserContext);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <ShieldAlert size={80} color="#F43F5E" />
                </View>
                
                <Text style={[styles.title, { color: currentTheme.text }]}>Account Suspended</Text>
                
                <Text style={[styles.description, { color: currentTheme.subText }]}>
                    Your account has been suspended by the MindAura administrator due to a violation of our terms or a security concern.
                </Text>

                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        If you believe this is a mistake, please contact our support team.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.supportButton}
                        onPress={() => {/* Contact Support Logic */}}
                    >
                        <MessageSquare size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Contact Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.logoutButton}
                        onPress={signOut}
                    >
                        <LogOut size={20} color="#666666" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    infoCard: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 40 },
    infoText: { color: '#666666', fontSize: 14, textAlign: 'center', fontWeight: '500' },
    buttonContainer: { width: '100%', gap: 15 },
    supportButton: { backgroundColor: '#6366f1', height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    logoutButton: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#EEEEEE' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    logoutText: { color: '#666666', fontSize: 16, fontWeight: '600' },
});
