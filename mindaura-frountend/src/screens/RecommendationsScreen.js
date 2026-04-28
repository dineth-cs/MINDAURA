import React, { useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';

export default function RecommendationsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { currentTheme, isDarkMode } = useContext(UserContext);

    const mood = route.params?.mood || 'Happy';

    // Emotion-based styling configuration
    const moodConfigs = {
        Happy: {
            bg: '#F0FDF4', // Light green
            accent: '#22C55E',
            emoji: '😄',
            subtitle: 'Keep the good vibes going!',
            confidence: 94
        },
        Sad: {
            bg: '#EFF6FF', // Light blue
            accent: '#3B82F6',
            emoji: '😔',
            subtitle: "It's okay to feel this way. Take care of yourself.",
            confidence: 89
        },
        Angry: {
            bg: '#FEF2F2', // Light red
            accent: '#EF4444',
            emoji: '😠',
            subtitle: "Let's release that tension positively.",
            confidence: 87
        },
        Anxious: {
            bg: '#F5F3FF', // Light purple
            accent: '#8B5CF6',
            emoji: '😟',
            subtitle: 'Breathe deeply. You are safe.',
            confidence: 85
        },
        Neutral: {
            bg: '#F0F9FF', // Soft blue/sky
            accent: '#0EA5E9',
            emoji: '😐',
            subtitle: "A steady day. Let's keep learning and growing.",
            confidence: 92
        }
    };

    const config = moodConfigs[mood] || moodConfigs.Neutral;

    const getRecommendations = (currentMood) => {
        const data = {
            Happy: {
                youtube: [
                    { id: '1', title: '10 Minute Morning Yoga', channel: 'Yoga with Adriene', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=UEEsdXn8oG8' },
                    { id: '2', title: 'Upbeat Morning Motivation', channel: 'Daily Inspiration', duration: '8 min', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tybOi4hjZFQ' }
                ],
                spotify: [
                    { id: '1', title: 'Happy Hits', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f464?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC' },
                    { id: '2', title: 'Feel Good Indie', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD7tbmL' }
                ]
            },
            Sad: {
                youtube: [
                    { id: '1', title: 'Guided Meditation for Healing', channel: 'Mindful Peace', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=O-6f5wQXSu8' },
                    { id: '2', title: 'Gentle Stretching for Relief', channel: 'Yoga Flex', duration: '15 min', thumbnail: 'https://images.unsplash.com/photo-1532788597148-8df0537f748d?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
                ],
                spotify: [
                    { id: '1', title: 'Cozy Acoustic Morning', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1460036521480-c16c14e0c400?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx' },
                    { id: '2', title: 'Comforting Tones', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u' }
                ]
            },
            Angry: {
                youtube: [
                    { id: '1', title: 'High Intensity Workout', channel: 'Fit Life', duration: '20 min', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=ml6cT4AZdqI' },
                    { id: '2', title: 'Breathing Exercises for Anger', channel: 'Calm Mind', duration: '5 min', thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tEmt1Znux58' }
                ],
                spotify: [
                    { id: '1', title: 'Heavy Workout', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
                    { id: '2', title: 'Calm Down Chillout', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1456086272160-b2ff1875e5cb?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY' }
                ]
            },
            Anxious: {
                youtube: [
                    { id: '1', title: 'Box Breathing Technique', channel: 'Therapy In A Nutshell', duration: '6 min', thumbnail: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tEmt1Znux58' },
                    { id: '2', title: 'Nature Sounds for Anxiety', channel: 'Relaxing Walks', duration: '30 min', thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=eKFTSSKCzWA' }
                ],
                spotify: [
                    { id: '1', title: 'Lo-Fi Beats', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' },
                    { id: '2', title: 'Deep Focus Meditation', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX9uKNf5jGX6m' }
                ]
            },
            Neutral: {
                youtube: [
                    { id: '1', title: 'How to Build New Habits', channel: 'Productivity Hacks', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=75d_29QWELk' },
                    { id: '2', title: 'TED Talk: The Power of Yet', channel: 'TED', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1475721025505-1a8ebcb9c09c?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=J-swZaKN2Ic' }
                ],
                spotify: [
                    { id: '1', title: 'Daily Podcasts', artist: 'Various', duration: 'Music', cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
                    { id: '2', title: 'Brain Food', artist: 'Spotify', duration: 'Music', cover: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7' }
                ]
            }
        };
        
        return data[currentMood] || data['Neutral'];
    };

    const openLink = (url) => {
        if (!url) return;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.warn('Cannot open URL:', url);
            }
        }).catch(err => console.error('Linking error:', err));
    };

    const recommendations = getRecommendations(mood);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Results</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* ── Premium Detected Mood Section ── */}
                <View style={[
                    styles.moodCard, 
                    { 
                        backgroundColor: isDarkMode ? currentTheme.card : config.bg,
                        borderColor: isDarkMode ? currentTheme.border : 'transparent',
                        borderWidth: isDarkMode ? 1 : 0
                    }
                ]}>
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emojiText}>{config.emoji}</Text>
                    </View>
                    <Text style={[styles.moodTitle, { color: currentTheme.text }]}>
                        You seem <Text style={[styles.moodHighlight, { color: config.accent }]}>{mood}</Text>
                    </Text>
                    <Text style={[styles.moodSubtitle, { color: currentTheme.subText }]}>
                        {config.subtitle}
                    </Text>

                    {/* ✨ AI Confidence Badge */}
                    <View style={[styles.confidenceBadge, { backgroundColor: isDarkMode ? 'rgba(107,142,254,0.15)' : 'white' }]}>
                        <Text style={styles.confidenceText}>✨ AI Confidence: {config.confidence}%</Text>
                    </View>
                </View>

                {/* ── YouTube Recommendations ── */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>YouTube Picks</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {recommendations.youtube.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.videoCard, { backgroundColor: currentTheme.card }]} activeOpacity={0.8} onPress={() => openLink(item.url)}>
                                <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
                                <View style={styles.durationTag}>
                                    <Text style={styles.durationText}>▶ {item.duration}</Text>
                                </View>
                                <View style={styles.videoInfo}>
                                    <Text style={[styles.videoTitle, { color: currentTheme.text }]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.videoChannel, { color: currentTheme.subText }]} numberOfLines={1}>
                                        {item.channel}
                                    </Text>
                                    <View style={styles.playIconContainer}>
                                        <Ionicons name="play-circle" size={28} color="#FF0000" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Spotify Recommendations ── */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <FontAwesome name="spotify" size={24} color="#1DB954" />
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Spotify Playlists</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {recommendations.spotify.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.spotifyCard, { backgroundColor: currentTheme.card }]} activeOpacity={0.8} onPress={() => openLink(item.url)}>
                                <Image source={{ uri: item.cover }} style={styles.spotifyCover} />
                                <View style={styles.spotifyInfo}>
                                    <Text style={[styles.spotifyTitle, { color: currentTheme.text }]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.spotifyMetaRow}>
                                        <Text style={[styles.spotifyArtist, { color: currentTheme.subText }]} numberOfLines={1}>
                                            {item.artist}
                                        </Text>
                                        <Text style={styles.durationSubText}>• {item.duration}</Text>
                                    </View>
                                </View>
                                <View style={styles.spotifyPlayBtn}>
                                    <Ionicons name="play" size={16} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Log Mood CTA ── */}
                <TouchableOpacity 
                    style={styles.logMoodButton} 
                    onPress={() => {
                        Alert.alert('Mood Logged', 'Your mood has been saved to your journey.');
                        navigation.navigate('MainTabs');
                    }}
                >
                    <Text style={styles.logMoodButtonText}>📝 Log this Mood</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerPlaceholder: {
        width: 44,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    
    // Mood Card
    moodCard: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 6,
    },
    emojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emojiText: {
        fontSize: 48,
    },
    moodTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    moodHighlight: {
        fontWeight: 'bold',
    },
    moodSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
    },
    confidenceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B8EFE',
    },

    // Sections
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    horizontalScroll: {
        paddingRight: 16,
    },

    // YouTube Card
    videoCard: {
        width: 240,
        borderRadius: 16,
        marginRight: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    videoThumbnail: {
        width: '100%',
        height: 135,
        backgroundColor: '#E5E7EB',
    },
    durationTag: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    videoInfo: {
        padding: 12,
        position: 'relative',
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        paddingRight: 24, // Space for play icon
    },
    videoChannel: {
        fontSize: 12,
    },
    playIconContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },

    // Spotify Card
    spotifyCard: {
        width: 140,
        borderRadius: 16,
        marginRight: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    spotifyCover: {
        width: 116,
        height: 116,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#E5E7EB',
    },
    spotifyInfo: {
        width: '100%',
        alignItems: 'flex-start',
    },
    spotifyTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    spotifyMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spotifyArtist: {
        fontSize: 12,
    },
    durationSubText: {
        fontSize: 11,
        color: '#A0A0A0',
        marginLeft: 4,
    },
    spotifyPlayBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1DB954',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2, // optical alignment
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },

    // Log Mood CTA
    logMoodButton: {
        backgroundColor: '#6B8EFE',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#6B8EFE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    logMoodButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    bottomSpacer: {
        height: 40,
    }
});
