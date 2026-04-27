import React, { useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';

export default function RecommendationsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { currentTheme } = useContext(UserContext);
    
    // Default to 'Happy' if no mood is passed
    const mood = route.params?.mood || 'Happy';

    // Mock Data Generator Based on Mood
    const getRecommendations = (currentMood) => {
        const data = {
            Happy: {
                emoji: '😄',
                subtitle: 'Keep the good vibes going!',
                youtube: [
                    { id: '1', title: '10 Minute Morning Yoga', channel: 'Yoga with Adriene', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=UEEsdXn8oG8' },
                    { id: '2', title: 'Upbeat Morning Motivation', channel: 'Daily Inspiration', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tybOi4hjZFQ' }
                ],
                spotify: [
                    { id: '1', title: 'Happy Hits', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f464?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC' },
                    { id: '2', title: 'Feel Good Indie', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX2sUQwD7tbmL' }
                ]
            },
            Sad: {
                emoji: '😔',
                subtitle: 'It\'s okay to feel this way. Take care of yourself.',
                youtube: [
                    { id: '1', title: 'Guided Meditation for Healing', channel: 'Mindful Peace', thumbnail: 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=O-6f5wQXSu8' },
                    { id: '2', title: 'Gentle Stretching for Relief', channel: 'Yoga Flex', thumbnail: 'https://images.unsplash.com/photo-1532788597148-8df0537f748d?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' }
                ],
                spotify: [
                    { id: '1', title: 'Cozy Acoustic Morning', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1460036521480-c16c14e0c400?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4E3UdUs7fUx' },
                    { id: '2', title: 'Comforting Tones', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u' }
                ]
            },
            Angry: {
                emoji: '😠',
                subtitle: 'Let\'s release that tension positively.',
                youtube: [
                    { id: '1', title: 'High Intensity Workout', channel: 'Fit Life', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=ml6cT4AZdqI' },
                    { id: '2', title: 'Breathing Exercises for Anger', channel: 'Calm Mind', thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tEmt1Znux58' }
                ],
                spotify: [
                    { id: '1', title: 'Heavy Workout', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
                    { id: '2', title: 'Calm Down Chillout', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1456086272160-b2ff1875e5cb?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY' }
                ]
            },
            Anxious: {
                emoji: '😟',
                subtitle: 'Breathe deeply. You are safe.',
                youtube: [
                    { id: '1', title: 'Box Breathing Technique', channel: 'Therapy In A Nutshell', thumbnail: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=tEmt1Znux58' },
                    { id: '2', title: 'Nature Sounds for Anxiety', channel: 'Relaxing Walks', thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=eKFTSSKCzWA' }
                ],
                spotify: [
                    { id: '1', title: 'Lo-Fi Beats', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' },
                    { id: '2', title: 'Deep Focus Meditation', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX9uKNf5jGX6m' }
                ]
            },
            Neutral: {
                emoji: '😐',
                subtitle: 'A steady day. Let\'s keep learning and growing.',
                youtube: [
                    { id: '1', title: 'How to Build New Habits', channel: 'Productivity Hacks', thumbnail: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=75d_29QWELk' },
                    { id: '2', title: 'TED Talk: The Power of Yet', channel: 'TED', thumbnail: 'https://images.unsplash.com/photo-1475721025505-1a8ebcb9c09c?w=400&h=250&fit=crop', url: 'https://www.youtube.com/watch?v=J-swZaKN2Ic' }
                ],
                spotify: [
                    { id: '1', title: 'Daily Podcasts', artist: 'Various', cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
                    { id: '2', title: 'Brain Food', artist: 'Spotify', cover: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?w=400&h=400&fit=crop', url: 'https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7' }
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
                
                {/* Detected Mood Section */}
                <View style={[styles.moodCard, { backgroundColor: currentTheme.card }]}>
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emojiText}>{recommendations.emoji}</Text>
                    </View>
                    <Text style={[styles.moodTitle, { color: currentTheme.text }]}>
                        You seem <Text style={styles.moodHighlight}>{mood}</Text>
                    </Text>
                    <Text style={[styles.moodSubtitle, { color: currentTheme.subText }]}>
                        {recommendations.subtitle}
                    </Text>
                </View>

                {/* YouTube Recommendations */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>YouTube Picks</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {recommendations.youtube.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.videoCard, { backgroundColor: currentTheme.card }]} activeOpacity={0.8} onPress={() => openLink(item.url)}>
                                <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
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

                {/* Spotify Recommendations */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="logo-spotify" size={24} color="#1DB954" />
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
                                    <Text style={[styles.spotifyArtist, { color: currentTheme.subText }]} numberOfLines={1}>
                                        {item.artist}
                                    </Text>
                                </View>
                                <View style={styles.spotifyPlayBtn}>
                                    <Ionicons name="play" size={16} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

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
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    emojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
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
        color: '#6B8EFE',
    },
    moodSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
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
        marginBottom: 4,
    },
    spotifyArtist: {
        fontSize: 12,
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

    bottomSpacer: {
        height: 40,
    }
});
