import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/Colors';

const ONBOARDING_SEEN_KEY = '@talk4cp/onboarding-seen';

const getCurrentUser = () =>
    new Promise<ReturnType<typeof auth>['currentUser']>((resolve) => {
        const unsubscribe = auth().onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });

const SplashScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let isMounted = true;

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(async () => {
            if (!isMounted) {
                return;
            }

            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    navigation.replace('MainScreen');
                    return;
                }

                const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
                navigation.replace(hasSeenOnboarding === 'true' ? 'Auth' : 'Onboarding');
            } catch {
                navigation.replace('Onboarding');
            }
        }, 2000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [fadeAnim, navigation]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Talk4CP</Text>
                    <View style={styles.underline} />
                </View>
                <Text style={styles.tagline}>Empowering Every Voice</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoText: {
        fontSize: 38,
        fontWeight: 'bold',
        color: Colors.primary,
        letterSpacing: 2,
    },
    underline: {
        width: 60,
        height: 4,
        backgroundColor: Colors.accent,
        borderRadius: 2,
        marginTop: -5,
    },
    tagline: {
        fontSize: 16,
        color: Colors.secondary,
        letterSpacing: 1,
        fontWeight: '500',
    },
});

export default SplashScreen;
