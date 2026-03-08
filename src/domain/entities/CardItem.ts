export interface CardItem {
  id: string;
  label: string;
  subLabel?: string;
  icon: string;
  backgroundColor: string;
  soundPath?: string; // For custom sounds if needed, otherwise uses TTS
  speechText: string;
}
