import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { UserContext } from '../context/UserContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const { isDarkMode, currentTheme } = useContext(UserContext);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Aura Chat') {
                        iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    } else if (route.name === 'Calendar') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return iconName ? <Ionicons name={iconName} size={size} color={color} /> : null;
                },
                tabBarActiveTintColor: isDarkMode ? '#92A8EA' : '#7C98E2',
                tabBarInactiveTintColor: currentTheme.subText,
                tabBarStyle: {
                    backgroundColor: currentTheme.tabBg,
                    borderTopWidth: 1,
                    borderTopColor: currentTheme.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Aura Chat" component={ChatScreen} />
            <Tab.Screen name="Calendar" component={CalendarScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}