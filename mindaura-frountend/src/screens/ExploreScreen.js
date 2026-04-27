import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function ExploreScreen({ navigation }) {
    const { isDarkMode, currentTheme } = useContext(UserContext);
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic colors for horizontal cards
    const cardPurple = isDarkMode ? 'rgba(107, 142, 254, 0.2)' : '#F3E5F5';
    const cardBlue = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#E3F2FD';
    const cardTeal = isDarkMode ? 'rgba(20, 184, 166, 0.2)' : '#E0F2F1';
    const cardOrange = isDarkMode ? 'rgba(245, 124, 0, 0.2)' : '#FFF3E0';

    // --- Data Sources ---
    const exercises = [
        { id: '1', title: '5-Min Meditation', subtitle: 'Quick reset', icon: 'leaf-outline', color: '#6B8EFE', bg: cardPurple, screen: 'MeditationScreen', tags: 'meditation calm mind relax' },
        { id: '2', title: 'Deep Breathing', subtitle: 'Relax your mind', icon: 'water-outline', color: '#3B82F6', bg: cardBlue, screen: 'BreathingScreen', tags: 'breathing breathe relax anxiety' },
        { id: '3', title: 'Sleep Sounds', subtitle: 'Better rest', icon: 'moon-outline', color: '#14B8A6', bg: cardTeal, screen: 'SleepSoundsScreen', tags: 'sleep sounds rest night' },
        { id: '4', title: 'Morning Stretch', subtitle: 'Start fresh', icon: 'sunny-outline', color: '#F57C00', bg: cardOrange, screen: 'StretchScreen', tags: 'stretch morning body exercise' },
    ];

    const articles = [
        {
            id: '1', title: 'How to manage daily stress', subtitle: 'Learn techniques to stay calm',
            icon: 'bulb-outline', iconColor: '#6B8EFE', bg: cardPurple,
            tags: 'stress calm anxiety manage technique',
            content: 'Stress is a natural physical and mental reaction to life experiences...\n\n1. Practice Deep Breathing...\n2. Stay Active...\n3. Connect with Others...'
        },
        {
            id: '2', title: 'The science of sleep', subtitle: 'Why 8 hours makes a difference',
            icon: 'bed-outline', iconColor: '#3B82F6', bg: cardBlue,
            tags: 'sleep rest hours science health',
            content: 'Sleep is essential for a person\'s health and wellbeing...\n\nDuring sleep, your body is working to support healthy brain function and maintain your physical health...'
        },
        {
            id: '3', title: 'Mindful eating habits', subtitle: 'Nourish your body and soul',
            icon: 'nutrition-outline', iconColor: '#14B8A6', bg: cardTeal,
            tags: 'eating food mindful nutrition body health',
            content: 'Mindful eating is about developing an awareness of your experiences, physical cues, and feelings about food.\n\nInstead of rushing through meals while distracted by screens, try to fully engage your senses.'
        },
    ];

    // --- Filtering Logic ---
    const query = searchQuery.toLowerCase().trim();
    const filteredExercises = query
        ? exercises.filter(e => e.title.toLowerCase().includes(query) || e.tags.includes(query))
        : exercises;
    const filteredArticles = query
        ? articles.filter(a => a.title.toLowerCase().includes(query) || a.subtitle.toLowerCase().includes(query) || a.tags.includes(query))
        : articles;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Explore</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: currentTheme.card }]}>
                    <Ionicons name="search" size={20} color={currentTheme.subText} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: currentTheme.text }]}
                        placeholder="Search for wellness content..."
                        placeholderTextColor={currentTheme.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color={currentTheme.subText} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recommended for You */}
                {filteredExercises.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Recommended for You</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                            {filteredExercises.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.horizontalCard, { backgroundColor: item.bg }]}
                                    onPress={() => navigation.navigate(item.screen)}
                                >
                                    <Ionicons name={item.icon} size={28} color={item.color} style={styles.cardIcon} />
                                    <View>
                                        <Text style={[styles.cardTitle, { color: currentTheme.text }]}>{item.title}</Text>
                                        <Text style={[styles.cardSubtitle, { color: currentTheme.subText }]}>{item.subtitle}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Daily Insights & Tips */}
                {filteredArticles.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Daily Insights & Tips</Text>
                        {filteredArticles.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.verticalCard, { backgroundColor: currentTheme.card }]}
                                onPress={() => navigation.navigate('ArticleScreen', {
                                    title: item.title,
                                    subtitle: item.subtitle,
                                    content: item.content
                                })}
                            >
                                <View style={[styles.verticalCardIcon, { backgroundColor: item.bg }]}>
                                    <Ionicons name={item.icon} size={24} color={item.iconColor} />
                                </View>
                                <View style={styles.verticalCardContent}>
                                    <Text style={[styles.verticalCardTitle, { color: currentTheme.text }]}>{item.title}</Text>
                                    <Text style={[styles.verticalCardSubtitle, { color: currentTheme.subText }]}>{item.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={currentTheme.subText} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {filteredExercises.length === 0 && filteredArticles.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={currentTheme.subText} />
                        <Text style={[styles.emptyStateTitle, { color: currentTheme.text }]}>No results found</Text>
                        <Text style={[styles.emptyStateSubtitle, { color: currentTheme.subText }]}>
                            Try searching for "sleep", "stress", "breathing", or "meditation"
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    container: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 54,
        borderRadius: 15,
        marginBottom: 32,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    horizontalScroll: {
        paddingRight: 24,
    },
    horizontalCard: {
        width: 140,
        height: 160,
        borderRadius: 20,
        padding: 16,
        marginRight: 16,
        justifyContent: 'space-between',
    },
    cardIcon: {
        alignSelf: 'flex-start',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
    },
    verticalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    verticalCardIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    verticalCardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    verticalCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    verticalCardSubtitle: {
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});
