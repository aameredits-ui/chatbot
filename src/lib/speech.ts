type SpeechRecognitionType = any;

export class SpeechRecognitionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private _isListening = false;

  isSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  start(onResult: (text: string) => void, onEnd: () => void, lang = 'tr-TR'): void {
    if (!this.isSupported() || this._isListening) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecClass = ((window as any).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: SpeechRecognitionType }).webkitSpeechRecognition);
    this.recognition = new SpeechRecClass();
    this.recognition.lang = lang;
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript ?? '';
      if (text) onResult(text);
    };
    this.recognition.onend = () => { this._isListening = false; onEnd(); };
    this.recognition.onerror = () => { this._isListening = false; onEnd(); };
    this.recognition.start();
    this._isListening = true;
  }

  stop(): void {
    this.recognition?.stop();
    this._isListening = false;
  }

  get isListening(): boolean { return this._isListening; }
}

export const speechService = new SpeechRecognitionService();
