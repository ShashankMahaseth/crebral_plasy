import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing } from '../theme/Colors';

const ONBOARDING_SEEN_KEY = '@talk4cp/onboarding-seen';

const OnboardingScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { t } = useTranslation();

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
        } catch {
            // Continue even if persistence fails.
        }

        navigation.replace('Auth');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{t('welcome')}</Text>
                <Text style={styles.description}>{t('onboarding_desc')}</Text>

                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureEmoji}>{'\u{1F5E3}\uFE0F'}</Text>
                        <Text style={styles.featureText}>{t('feature_announce')}</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureEmoji}>{'\u{1F6A8}'}</Text>
                        <Text style={styles.featureText}>{t('feature_alert')}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>{t('get_started')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: Spacing.xl,
        justifyContent: 'space-between',
    },
    content: {
        marginTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: Spacing.m,
    },
    description: {
        fontSize: 18,
        color: Colors.secondary,
        lineHeight: 26,
        marginBottom: 40,
    },
    features: {
        gap: Spacing.l,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.m,
        borderRadius: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    featureEmoji: {
        fontSize: 24,
        marginRight: Spacing.m,
    },
    featureText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    button: {
        backgroundColor: Colors.accent,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.l,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;