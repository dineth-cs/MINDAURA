import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { UserContext } from '../context/UserContext';

const SOUNDS = [
    { id: '1', title: 'Rain on Tent', duration: '2 Hrs', icon: 'rainy-outline', soundFile: require('../../assets/sounds/rain.mp3') },
    { id: '2', title: 'Ocean Waves', duration: 'Auto', icon: 'water-outline', soundFile: require('../../assets/sounds/ocean.mp3') },
    { id: '3', title: 'Forest Birds', duration: '45 Min', icon: 'leaf-outline', soundFile: require('../../assets/sounds/birds.mp3') },
    { id: '4', title: 'White Noise', duration: 'Continuous', icon: 'radio-outline', soundFile: require('../../assets/sounds/noise.mp3') },
    { id: '5', title: 'Distant Thunder', duration: '1 Hr', icon: 'thunderstorm-outline', soundFile: require('../../assets/sounds/thunder.mp3') },
];

export default function SleepSoundsScreen({ navigation }) {
    const { currentTheme } = useContext(UserContext);
    const [playingId, setPlayingId] = useState(null);
    const [sound, setSound] = useState(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const togglePlay = async (item) => {
        try {
            // If there's an active sound playing, stop and unload it
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            // If the user tapped the currently playing track, just stop it
            if (playingId === item.id) {
                setPlayingId(null);
                return;
            }

            // Otherwise, start playing the new track
            setPlayingId(item.id);
            const { sound: newSound } = await Audio.Sound.createAsync(
                item.soundFile,
                { shouldPlay: true, isLooping: true }
            );
            setSound(newSound);
        } catch (error) {
            console.error("Audio playback error:", error);
            setPlayingId(null); // Reset UI if playback fails
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.soundCard, { backgroundColor: currentTheme.card }]}
            activeOpacity={0.8}
            onPress={() => togglePlay(item)}
        >
            <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={28} color="#6B8EFE" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.soundTitle, { color: currentTheme.text }]}>{item.title}</Text>
                    <Text style={[styles.soundDuration, { color: currentTheme.subText }]}>{item.duration}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.playButton}
                onPress={() => togglePlay(item)}
            >
                <Ionicons
                    name={playingId === item.id ? "pause" : "play"}
                    size={24}
                    color="#FFFFFF"
                    style={playingId === item.id ? {} : { marginLeft: 3 }}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Sleep Sounds</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* List Content */}
            <FlatList
                data={SOUNDS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
        paddingBottom: 24,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    soundCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E8EEFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    soundTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    soundDuration: {
        fontSize: 13,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6B8EFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
});
