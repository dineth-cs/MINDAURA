import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function ArticleScreen({ route, navigation }) {
    const { currentTheme } = useContext(UserContext);
    const { title, subtitle, content } = route.params || {};

    // Helper to render content with paragraphs if newline characters exist
    const renderContent = () => {
        if (!content) return null;
        const paragraphs = content.split('\n');
        return paragraphs.map((para, index) => {
            if (para.trim() === '') {
                // Return an empty view for spacing if there's an empty line
                return <View key={index} style={{ height: 10 }} />;
            }
            return (
                <Text key={index} style={[styles.paragraph, { color: currentTheme.text }]}>
                    {para}
                </Text>
            );
        });
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {title ? (
                    <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
                ) : null}

                {subtitle ? (
                    <Text style={[styles.subtitle, { color: currentTheme.subText }]}>{subtitle}</Text>
                ) : null}

                <View style={styles.contentContainer}>
                    {renderContent()}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        padding: 8,
        alignSelf: 'flex-start',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 30,
    },
    contentContainer: {
        marginTop: 10,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 10,
    }
});
