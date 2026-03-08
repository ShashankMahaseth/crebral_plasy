export interface SpeechRepository {
    speak(text: string, language?: string): Promise<void>;
    stop(): Promise<void>;
}
