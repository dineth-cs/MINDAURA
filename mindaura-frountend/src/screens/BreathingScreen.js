import React, { useState, useRef, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function BreathingScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);

    const [isActive, setIsActive] = useState(false);
    const [instruction, setInstruction] = useState("Press Start");

    // Animation Value for scaling the outer circle
    const scale = useRef(new Animated.Value(1)).current;

    // We use a ref to track if the session is active inside the recursive loop
    const isActiveRef = useRef(false);

    useEffect(() => {
        isActiveRef.current = isActive;
        if (isActive) {
            startBreathingCycle();
        } else {
            // Reset state when stopped
            scale.stopAnimation();
            Animated.timing(scale, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
            setInstruction("Press Start");
        }

        return () => {
            isActiveRef.current = false;
        };
    }, [isActive]);

    const startBreathingCycle = () => {
        if (!isActiveRef.current) return;

        // Step 1: Breathe In
        setInstruction("Breathe In...");
        Animated.timing(scale, {
            toValue: 1.5,
            duration: 4000,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished && isActiveRef.current) {
                // Step 2: Breathe Out
                setInstruction("Breathe Out...");
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    // Step 3: Loop recursively
                    if (finished && isActiveRef.current) {
                        startBreathingCycle();
                    }
                });
            }
        });
    };

    const toggleBreathing = () => {
        setIsActive(!isActive);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Mindful Breathing</Text>
                {/* Placeholder for center alignment */}
                <View style={{ width: 28 }} />
            </View>

            {/* Animation Area */}
            <View style={styles.centerArea}>
                <View style={styles.circlesWrapper}>
                    {/* Pulsing Outer Circle */}
                    <Animated.View
                        style={[
                            styles.outerCircle,
                            { transform: [{ scale }] }
                        ]}
                    />

                    {/* Fixed Inner Circle */}
                    <View style={styles.innerCircle}>
                        <Ionicons name="leaf" size={50} color="#FFFFFF" />
                    </View>
                </View>

                {/* Instruction Text */}
                <Text style={[styles.instructionText, { color: currentTheme.text }]}>
                    {instruction}
                </Text>
            </View>

            {/* Bottom Action Button */}
            <View style={styles.bottomArea}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: isActive ? '#FF6B6B' : '#6B8EFE' }
                    ]}
                    onPress={toggleBreathing}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonText}>
                        {isActive ? "Stop" : "Start"}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circlesWrapper: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(107, 142, 254, 0.2)', // Soft brand periwinkle
    },
    innerCircle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#6B8EFE', // Primary brand color
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 28,
        fontWeight: '300',
        marginTop: 60,
    },
    bottomArea: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    actionButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
