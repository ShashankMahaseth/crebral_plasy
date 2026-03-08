import { SpeechRepository } from '../repositories/SpeechRepository';

export class SpeakTextUseCase {
    constructor(private speechRepository: SpeechRepository) { }

    async execute(text: string, language: string = 'en-US'): Promise<void> {
        await this.speechRepository.speak(text, language);
    }
}
