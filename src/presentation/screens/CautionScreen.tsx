import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing } from '../theme/Colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CautionItem = {
    id: string;
    icon: string;
    title: string;
    description: string;
};

const CautionScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t, i18n } = useTranslation();
    const isHindi = i18n.language.startsWith('hi');

    const cautionItems: CautionItem[] = [
        {
            id: '1',
            icon: '\u26A0\uFE0F',
            title: t('caution_item_posture_title'),
            description: t('caution_item_posture_desc'),
        },
        {
            id: '2',
            icon: '\u{1F483}',
            title: t('caution_item_fall_title'),
            description: t('caution_item_fall_desc'),
        },
        {
            id: '3',
            icon: '\u{1F4A7}',
            title: t('caution_item_swallow_title'),
            description: t('caution_item_swallow_desc'),
        },
        {
            id: '4',
            icon: '\u{1F48A}',
            title: t('caution_item_medicine_title'),
            description: t('caution_item_medicine_desc'),
        },
        {
            id: '5',
            icon: '\u{1F4DE}',
            title: t('caution_item_emergency_title'),
            description: t('caution_item_emergency_desc'),
        },
        {
            id: '6',
            icon: '\u{1F9D1}\u200D\u2695\uFE0F',
            title: t('caution_item_checkup_title'),
            description: t('caution_item_checkup_desc'),
        },
        {
            id: '7',
            icon: '\u{1F9E0}',
            title: t('caution_item_mental_title'),
            description: t('caution_item_mental_desc'),
        },
        {
            id: '8',
            icon: '\u{1F6A8}',
            title: t('caution_item_help_title'),
            description: t('caution_item_help_desc'),
        },
    ];

    const setEnglish = () => {
        i18n.changeLanguage('en');
    };

    const setHindi = () => {
        i18n.changeLanguage('hi');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.backButtonText}>{'\u2190'}</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.title}>{t('caution_screen_title')}</Text>
                        <Text style={styles.subtitle}>{t('caution_screen_subtitle')}</Text>
                    </View>
                </View>

                <View style={styles.languageSwitcher}>
                    <TouchableOpacity
                        style={[styles.languageOption, !isHindi && styles.languageOptionActive]}
                        onPress={setEnglish}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.languageOptionText, !isHindi && styles.languageOptionTextActive]}>
                            {t('english')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.languageOption, isHindi && styles.languageOptionActive]}
                        onPress={setHindi}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.languageOptionText, isHindi && styles.languageOptionTextActive]}>
                            {t('hindi')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {cautionItems.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>{item.icon}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDescription}>{item.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.l,
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.m,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.s,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 24,
    },
    headerTextBlock: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.primary,
    },
    subtitle: {
        marginTop: Spacing.xs,
        color: Colors.secondary,
        fontSize: 14,
        lineHeight: 20,
    },
    languageSwitcher: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        backgroundColor: '#EAF2FF',
        borderRadius: 22,
        padding: 4,
        marginBottom: Spacing.m,
    },
    languageOption: {
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderRadius: 18,
    },
    languageOptionActive: {
        backgroundColor: Colors.accent,
    },
    languageOptionText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    languageOptionTextActive: {
        color: Colors.white,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: Spacing.m,
        marginBottom: Spacing.s,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF5E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.s,
    },
    iconText: {
        fontSize: 18,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    cardDescription: {
        marginTop: 4,
        fontSize: 13,
        color: Colors.secondary,
        lineHeight: 19,
    },
});

export default CautionScreen;
