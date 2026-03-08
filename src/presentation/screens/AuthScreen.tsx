import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Colors, Spacing } from '../theme/Colors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type AuthMode = 'login' | 'signup';

type FormErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const getFirebaseFieldErrors = (code?: string): FormErrors => {
    switch (code) {
        case 'auth/email-already-in-use':
            return { email: 'This Gmail address is already registered.' };
        case 'auth/invalid-email':
            return { email: 'Invalid email format.' };
        case 'auth/user-not-found':
            return { email: 'No account found with this Gmail address.' };
        case 'auth/operation-not-allowed':
            return { email: 'Enable Email/Password sign-in in Firebase Console.' };
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return { password: 'Incorrect email or password.' };
        case 'auth/network-request-failed':
            return { password: 'Network error. Check internet and try again.' };
        case 'auth/too-many-requests':
            return { password: 'Too many attempts. Please try again later.' };
        case 'auth/weak-password':
            return { password: 'Password is too weak.' };
        default:
            return { password: 'Authentication failed. Please try again.' };
    }
};

const AuthScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const resetFormState = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
    };

    const switchMode = (nextMode: AuthMode) => {
        if (mode === nextMode) {
            return;
        }
        setMode(nextMode);
        resetFormState();
    };

    const updateError = (field: keyof FormErrors) => {
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = () => {
        const nextErrors: FormErrors = {};
        const trimmedEmail = email.trim().toLowerCase();

        if (mode === 'signup' && name.trim().length < 2) {
            nextErrors.name = 'Name must be at least 2 characters.';
        }

        if (trimmedEmail.length < 6) {
            nextErrors.email = 'Email must be at least 6 characters.';
        } else if (!GMAIL_REGEX.test(trimmedEmail)) {
            nextErrors.email = 'Email must end with @gmail.com.';
        }

        if (password.length < 6) {
            nextErrors.password = 'Password must be at least 6 characters.';
        } else if (!SPECIAL_CHAR_REGEX.test(password)) {
            nextErrors.password = 'Password must include a special character like @.';
        }

        if (mode === 'signup') {
            if (confirmPassword.length < 6) {
                nextErrors.confirmPassword = 'Confirm password must be at least 6 characters.';
            } else if (confirmPassword !== password) {
                nextErrors.confirmPassword = 'Passwords do not match.';
            }
        }

        return nextErrors;
    };

    const handleSubmit = async () => {
        const nextErrors = validate();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const trimmedEmail = email.trim().toLowerCase();
        setIsSubmitting(true);

        try {
            if (mode === 'signup') {
                await auth().createUserWithEmailAndPassword(trimmedEmail, password);
            } else {
                await auth().signInWithEmailAndPassword(trimmedEmail, password);
            }

            resetFormState();
            navigation.replace('MainScreen');
        } catch (error: any) {
            setErrors(getFirebaseFieldErrors(error?.code));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
                        <Text style={styles.subtitle}>
                            {mode === 'login'
                                ? 'Login to continue using Talk4CP.'
                                : 'Sign up to get started with secure access.'}
                        </Text>
                    </View>

                    <View style={styles.modeSwitch}>
                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                            onPress={() => switchMode('login')}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>
                                Login
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}
                            onPress={() => switchMode('signup')}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.modeButtonText, mode === 'signup' && styles.modeButtonTextActive]}>
                                Signup
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        {mode === 'signup' && (
                            <View style={styles.inputBlock}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        updateError('name');
                                    }}
                                    placeholder="Enter full name"
                                    style={[styles.input, errors.name && styles.inputError]}
                                    autoCapitalize="words"
                                />
                                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            </View>
                        )}

                        <View style={styles.inputBlock}>
                            <Text style={styles.label}>Gmail Address</Text>
                            <TextInput
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    updateError('email');
                                }}
                                placeholder="example@gmail.com"
                                style={[styles.input, errors.email && styles.inputError]}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputBlock}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.passwordFieldContainer, errors.password && styles.inputError]}>
                                <TextInput
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        updateError('password');
                                    }}
                                    placeholder="Enter password"
                                    style={styles.passwordInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsPasswordVisible((prev) => !prev)}
                                    style={styles.eyeButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.eyeIcon}>{isPasswordVisible ? '\u{1F648}' : '\u{1F441}\uFE0F'}</Text>
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {mode === 'signup' && (
                            <View style={styles.inputBlock}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={[styles.passwordFieldContainer, errors.confirmPassword && styles.inputError]}>
                                    <TextInput
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            updateError('confirmPassword');
                                        }}
                                        placeholder="Confirm password"
                                        style={styles.passwordInput}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry={!isConfirmPasswordVisible}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
                                        style={styles.eyeButton}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.eyeIcon}>
                                            {isConfirmPasswordVisible ? '\u{1F648}' : '\u{1F441}\uFE0F'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && (
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.requirementsBox}>
                            <Text style={styles.requirementText}>Email must end with @gmail.com</Text>
                            <Text style={styles.requirementText}>
                                Password must be 6+ characters with a special character (e.g. @)
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            activeOpacity={0.85}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting
                                    ? mode === 'login'
                                        ? 'Logging in...'
                                        : 'Creating account...'
                                    : mode === 'login'
                                      ? 'Login'
                                      : 'Create Account'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            style={styles.footerAction}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.footerActionText}>
                                {mode === 'login'
                                    ? "Don't have an account? Signup"
                                    : 'Already have an account? Login'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
    },
    header: {
        marginTop: Spacing.l,
        marginBottom: Spacing.l,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: Colors.primary,
    },
    subtitle: {
        marginTop: Spacing.s,
        color: Colors.secondary,
        fontSize: 15,
        lineHeight: 22,
    },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 4,
        marginBottom: Spacing.l,
    },
    modeButton: {
        flex: 1,
        paddingVertical: Spacing.s + 2,
        alignItems: 'center',
        borderRadius: 10,
    },
    modeButtonActive: {
        backgroundColor: Colors.accent,
    },
    modeButtonText: {
        color: Colors.secondary,
        fontSize: 15,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: Colors.white,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: Spacing.m,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputBlock: {
        marginBottom: Spacing.m,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.s,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#D8DEE9',
        borderRadius: 12,
        paddingHorizontal: Spacing.m,
        fontSize: 15,
        color: Colors.text,
    },
    passwordFieldContainer: {
        height: 50,
        borderWidth: 1,
        borderColor: '#D8DEE9',
        borderRadius: 12,
        paddingHorizontal: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        paddingVertical: 0,
    },
    eyeButton: {
        width: 28,
        alignItems: 'flex-end',
    },
    eyeIcon: {
        fontSize: 18,
    },
    inputError: {
        borderColor: '#D63031',
    },
    errorText: {
        marginTop: Spacing.xs,
        color: '#D63031',
        fontSize: 12,
    },
    requirementsBox: {
        backgroundColor: '#EEF6FF',
        borderRadius: 12,
        padding: Spacing.m,
        marginBottom: Spacing.l,
    },
    requirementText: {
        color: '#1C5D99',
        fontSize: 12,
        lineHeight: 18,
    },
    submitButton: {
        backgroundColor: Colors.accent,
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    footerAction: {
        alignItems: 'center',
        marginTop: Spacing.m,
        marginBottom: Spacing.s,
    },
    footerActionText: {
        color: Colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default AuthScreen;
