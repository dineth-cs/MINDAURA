import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
            <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
        </Stack.Navigator>
    );
}
