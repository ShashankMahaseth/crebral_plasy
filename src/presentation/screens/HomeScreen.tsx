import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';
import { CardItem } from '../../domain/entities/CardItem';
import { SpeechRepositoryImpl } from '../../data/repositories/SpeechRepositoryImpl';
import { SpeakTextUseCase } from '../../domain/usecases/SpeakTextUseCase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing } from '../theme/Colors';

type CustomVoiceItem = {
    id: string;
    label: string;
    speechText: string;
};

type CustomVoiceFormErrors = {
    label?: string;
    speechText?: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const speechRepository = new SpeechRepositoryImpl();
const speakTextUseCase = new SpeakTextUseCase(speechRepository);

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.m) / 2;
const CUSTOM_VOICE_STORAGE_KEY = '@talk4cp/custom-voices';
const MAX_LABEL_LENGTH = 28;
const MAX_SPEECH_LENGTH = 140;

export const HomeScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [customVoices, setCustomVoices] = useState<CustomVoiceItem[]>([]);
    const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
    const [customVoiceLabel, setCustomVoiceLabel] = useState('');
    const [customVoiceSpeech, setCustomVoiceSpeech] = useState('');
    const [formErrors, setFormErrors] = useState<CustomVoiceFormErrors>({});
    const [isSavingVoice, setIsSavingVoice] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const loadCustomVoices = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(CUSTOM_VOICE_STORAGE_KEY);
                if (!storedValue) {
                    return;
                }

                const parsedValue: unknown = JSON.parse(storedValue);
                if (!Array.isArray(parsedValue)) {
                    return;
                }

                const sanitizedValues = parsedValue
                    .filter((item): item is CustomVoiceItem => {
                        return (
                            item &&
                            typeof item === 'object' &&
                            typeof item.id === 'string' &&
                            typeof item.label === 'string' &&
                            typeof item.speechText === 'string'
                        );
                    })
                    .map((item) => ({
                        id: item.id,
                        label: item.label.trim(),
                        speechText: item.speechText.trim(),
                    }))
                    .filter((item) => item.label.length > 0 && item.speechText.length > 0);

                setCustomVoices(sanitizedValues);
            } catch (error) {
                console.warn('Failed to load custom voices:', error);
            }
        };

        loadCustomVoices();
    }, []);

    const assistanceCards: CardItem[] = useMemo(
        () => [
            {
                id: '1',
                label: t('water'),
                icon: '\u{1F4A7}',
                backgroundColor: Colors.water,
                speechText: t('water_speech'),
            },
            {
                id: '2',
                label: t('food'),
                icon: '\u{1F371}',
                backgroundColor: Colors.food,
                speechText: t('food_speech'),
            },
            {
                id: '3',
                label: t('toilet'),
                icon: '\u{1F6BD}',
                backgroundColor: Colors.toilet,
                speechText: t('toilet_speech'),
            },
            {
                id: '4',
                label: t('air'),
                icon: '\u{1F333}',
                backgroundColor: Colors.air,
                speechText: t('air_speech'),
            },
            {
                id: '5',
                label: t('tired'),
                icon: '\u{1F634}',
                backgroundColor: Colors.clothing,
                speechText: t('tired_speech'),
            },
            {
                id: '6',
                label: t('help'),
                icon: '\u{1F6A8}',
                backgroundColor: Colors.help,
                speechText: t('help_speech'),
            },
        ],
        [t],
    );

    const customVoiceCards: CardItem[] = useMemo(
        () =>
            customVoices.map((voice) => ({
                id: voice.id,
                label: voice.label,
                icon: '\u{1F399}\uFE0F',
                backgroundColor: '#E6F3FF',
                speechText: voice.speechText,
            })),
        [customVoices],
    );

    const allCards = useMemo(() => [...assistanceCards, ...customVoiceCards], [assistanceCards, customVoiceCards]);

    const persistCustomVoices = async (nextItems: CustomVoiceItem[]) => {
        await AsyncStorage.setItem(CUSTOM_VOICE_STORAGE_KEY, JSON.stringify(nextItems));
    };

    const toggleLanguage = () => {
        const nextLang = currentLanguage === 'en' ? 'hi' : 'en';
        i18n.changeLanguage(nextLang);
        setCurrentLanguage(nextLang);
    };

    const resetCustomVoiceForm = () => {
        setCustomVoiceLabel('');
        setCustomVoiceSpeech('');
        setFormErrors({});
    };

    const openVoiceModal = () => {
        resetCustomVoiceForm();
        setIsVoiceModalVisible(true);
    };

    const closeVoiceModal = () => {
        setIsVoiceModalVisible(false);
        setIsSavingVoice(false);
    };

    const validateCustomVoiceForm = (): { label: string; speechText: string } | null => {
        const trimmedLabel = customVoiceLabel.trim();
        const trimmedSpeech = customVoiceSpeech.trim();
        const nextErrors: CustomVoiceFormErrors = {};

        if (trimmedLabel.length < 2) {
            nextErrors.label = t('custom_voice_title_error');
        }

        if (trimmedSpeech.length < 3) {
            nextErrors.speechText = t('custom_voice_message_error');
        }

        setFormErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return null;
        }

        return { label: trimmedLabel, speechText: trimmedSpeech };
    };

    const handleAddCustomVoice = async () => {
        if (isSavingVoice) {
            return;
        }

        const validatedForm = validateCustomVoiceForm();
        if (!validatedForm) {
            return;
        }

        setIsSavingVoice(true);

        try {
            const newVoice: CustomVoiceItem = {
                id: `custom-${Date.now()}`,
                label: validatedForm.label,
                speechText: validatedForm.speechText,
            };

            const nextVoices = [newVoice, ...customVoices];
            setCustomVoices(nextVoices);
            await persistCustomVoices(nextVoices);
            closeVoiceModal();
        } catch {
            setIsSavingVoice(false);
            Alert.alert(t('error_title'), t('custom_voice_save_error'));
        }
    };

    const deleteCustomVoice = async (voiceId: string) => {
        const nextVoices = customVoices.filter((voice) => voice.id !== voiceId);
        setCustomVoices(nextVoices);

        try {
            await persistCustomVoices(nextVoices);
        } catch {
            setCustomVoices(customVoices);
            Alert.alert(t('error_title'), t('custom_voice_delete_error'));
        }
    };

    const handleDeleteCustomVoice = (voiceId: string) => {
        Alert.alert(t('delete_custom_voice_title'), t('delete_custom_voice_message'), [
            {
                text: t('cancel'),
                style: 'cancel',
            },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: () => {
                    deleteCustomVoice(voiceId);
                },
            },
        ]);
    };

    const performLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);
        try {
            await auth().signOut();
            navigation.replace('Auth');
        } catch {
            Alert.alert(t('error_title'), t('logout_error'));
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(t('logout_confirm_title'), t('logout_confirm_message'), [
            {
                text: t('cancel'),
                style: 'cancel',
            },
            {
                text: t('logout'),
                style: 'destructive',
                onPress: performLogout,
            },
        ]);
    };

    const handlePress = async (item: CardItem) => {
        const speechLang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
        const speechContent = item.speechText;

        if (item.id === '6') {
            try {
                await Tts.getInitStatus();
                Tts.stop();
                try {
                    await Tts.setDefaultLanguage(speechLang);
                } catch {
                    await Tts.setDefaultLanguage('en-US');
                }

                Tts.setDefaultRate(0.8);
                Tts.speak(speechContent, {
                    iosVoiceId: '',
                    rate: 0.8,
                    androidParams: {
                        KEY_PARAM_STREAM: 'STREAM_MUSIC',
                        KEY_PARAM_VOLUME: 1.0,
                        KEY_PARAM_PAN: 0,
                    },
                });
                setTimeout(() => Tts.setDefaultRate(0.5), 2000);
            } catch {
                await speakTextUseCase.execute(speechContent, 'en-US');
            }

            return;
        }

        try {
            await speakTextUseCase.execute(speechContent, speechLang);
        } catch {
            await speakTextUseCase.execute(speechContent, 'en-US');
        }
    };


    const renderCard = ({ item }: { item: CardItem }) => {
        const isCustomVoiceCard = item.id.startsWith('custom-');

        return (
            <View style={styles.cardWrapper}>
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: item.backgroundColor }]}
                    onPress={() => handlePress(item)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cardEmoji}>{item.icon}</Text>
                    <Text style={styles.cardLabel}>{item.label}</Text>
                </TouchableOpacity>
                {isCustomVoiceCard && (
                    <TouchableOpacity
                        style={styles.deleteBadge}
                        onPress={() => handleDeleteCustomVoice(item.id)}
                        activeOpacity={0.85}
                        accessibilityLabel={t('delete_custom_voice_title')}
                    >
                        <Text style={styles.deleteBadgeText}>{'\u2715'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('tap_to_speak')}</Text>
                        <Text style={styles.subtitle}>{t('select_need')}</Text>
                    </View>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={handleLogout}
                            activeOpacity={0.8}
                            accessibilityLabel={t('logout')}
                            disabled={isLoggingOut}
                        >
                            <Text style={styles.logoutIconGlyph}>{isLoggingOut ? '...' : '\u{1F6AA}'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={() => navigation.navigate('Caution')}
                            activeOpacity={0.8}
                            accessibilityLabel={t('caution_screen_title')}
                        >
                            <Text style={styles.actionIconGlyph}>{'\u26A0\uFE0F'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionIconButton}
                            onPress={openVoiceModal}
                            activeOpacity={0.8}
                            accessibilityLabel={t('add_custom_voice')}
                        >
                            <Text style={styles.actionIconGlyph}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.helperRow}>
                    <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.8}>
                        <Text style={styles.langToggleIcon}>{'\u{1F310}'}</Text>
                        <Text style={styles.langToggleText}>
                            {currentLanguage === 'en' ? t('hindi') : t('english')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>


            <FlatList
                data={allCards}
                renderItem={renderCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
            />

            <Modal
                visible={isVoiceModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeVoiceModal}
                statusBarTranslucent
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('add_custom_voice')}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={closeVoiceModal} activeOpacity={0.8}>
                                <Text style={styles.closeButtonText}>{'\u2715'}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{t('add_custom_voice_description')}</Text>

                        <View style={styles.inputBlock}>
                            <Text style={styles.inputLabel}>{t('custom_voice_title_label')}</Text>
                            <TextInput
                                value={customVoiceLabel}
                                onChangeText={(value) => {
                                    setCustomVoiceLabel(value);
                                    if (formErrors.label) {
                                        setFormErrors((prev) => ({ ...prev, label: undefined }));
                                    }
                                }}
                                placeholder={t('custom_voice_title_placeholder')}
                                maxLength={MAX_LABEL_LENGTH}
                                style={[styles.input, formErrors.label && styles.inputError]}
                            />
                            <Text style={styles.counterText}>
                                {customVoiceLabel.length}/{MAX_LABEL_LENGTH}
                            </Text>
                            {formErrors.label && <Text style={styles.errorText}>{formErrors.label}</Text>}
                        </View>

                        <View style={styles.inputBlock}>
                            <Text style={styles.inputLabel}>{t('custom_voice_message_label')}</Text>
                            <TextInput
                                value={customVoiceSpeech}
                                onChangeText={(value) => {
                                    setCustomVoiceSpeech(value);
                                    if (formErrors.speechText) {
                                        setFormErrors((prev) => ({ ...prev, speechText: undefined }));
                                    }
                                }}
                                placeholder={t('custom_voice_message_placeholder')}
                                maxLength={MAX_SPEECH_LENGTH}
                                multiline
                                style={[styles.input, styles.multiLineInput, formErrors.speechText && styles.inputError]}
                            />
                            <Text style={styles.counterText}>
                                {customVoiceSpeech.length}/{MAX_SPEECH_LENGTH}
                            </Text>
                            {formErrors.speechText && <Text style={styles.errorText}>{formErrors.speechText}</Text>}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={closeVoiceModal} activeOpacity={0.8}>
                                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, isSavingVoice && styles.saveButtonDisabled]}
                                onPress={handleAddCustomVoice}
                                activeOpacity={0.85}
                                disabled={isSavingVoice}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isSavingVoice ? t('saving') : t('save_voice')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.xl,
        paddingBottom: Spacing.m,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        paddingRight: Spacing.s,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.secondary,
        marginTop: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.s,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 3,
    },
    actionIconGlyph: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    logoutIconGlyph: {
        fontSize: 19,
        fontWeight: '700',
        color: '#B23A48',
    },
    helperRow: {
        marginTop: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
    },
    langToggle: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    langToggleText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 6,
    },
    langToggleIcon: {
        color: Colors.white,
        fontSize: 14,
    },
    listContainer: {
        padding: Spacing.xl,
        paddingTop: Spacing.s,
        paddingBottom: Spacing.l,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: Spacing.m,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        padding: Spacing.m,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.1,
        position: 'relative',
    },
    cardEmoji: {
        fontSize: 48,
        marginBottom: Spacing.s,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        textAlign: 'center',
    },
    deleteBadge: {
        position: 'absolute',
        top: Spacing.s,
        right: Spacing.s,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D63031',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBadgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.l,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F6FA',
    },
    closeButtonText: {
        color: Colors.secondary,
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 18,
    },
    modalSubtitle: {
        marginTop: Spacing.xs,
        marginBottom: Spacing.m,
        fontSize: 13,
        color: Colors.secondary,
        lineHeight: 19,
    },
    inputBlock: {
        marginBottom: Spacing.m,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: Spacing.s,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D8DEE9',
        borderRadius: 12,
        paddingHorizontal: Spacing.m,
        paddingVertical: 11,
        fontSize: 15,
        color: Colors.text,
    },
    multiLineInput: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#D63031',
    },
    counterText: {
        marginTop: 4,
        color: Colors.secondary,
        fontSize: 11,
        textAlign: 'right',
    },
    errorText: {
        marginTop: 4,
        color: '#D63031',
        fontSize: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.s,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8DEE9',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        marginRight: Spacing.s,
    },
    cancelButtonText: {
        color: Colors.secondary,
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        marginLeft: Spacing.s,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});


export default HomeScreen;
