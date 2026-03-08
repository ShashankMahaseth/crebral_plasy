import Tts from 'react-native-tts';
import { SpeechRepository } from '../../domain/repositories/SpeechRepository';

export class SpeechRepositoryImpl implements SpeechRepository {
    private readonly initPromise: Promise<void>;

    constructor() {
        this.initPromise = Tts.getInitStatus()
            .then(async () => {
                await Tts.setDefaultLanguage('en-US');
                Tts.setDefaultRate(0.5);
            })
            .catch(() => {
                // Keep app functional even when TTS engine is delayed/unavailable initially.
            });
    }

    private async ensureTtsReady() {
        await this.initPromise;
    }

    private async setLanguageWithFallback(language: string) {
        try {
            await Tts.setDefaultLanguage(language);
        } catch {
            await Tts.setDefaultLanguage('en-US');
        }
    }

    async speak(text: string, language: string = 'en-US'): Promise<void> {
        await this.ensureTtsReady();
        Tts.stop();
        await this.setLanguageWithFallback(language);
        Tts.speak(text, {
            iosVoiceId: '',
            rate: 0.5,
            androidParams: {
                KEY_PARAM_STREAM: 'STREAM_MUSIC',
                KEY_PARAM_VOLUME: 1.0,
                KEY_PARAM_PAN: 0,
            },
        });
    }

    async stop(): Promise<void> {
        await this.ensureTtsReady();
        Tts.stop();
    }
}
