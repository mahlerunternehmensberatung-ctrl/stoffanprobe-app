import { useState, useRef, useCallback, useEffect } from 'react';

// TypeScript types for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

export const useLiveTranscription = ({ onTranscript, onError }: { onTranscript: (text: string) => void, onError: (err: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recognition", e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    if (isListening) return;
    
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Spracheingabe in diesem Browser nicht verfügbar. Bitte verwenden Sie Chrome, Edge oder Safari.");
      onError("Spracherkennung wird von Ihrem Browser nicht unterstützt.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Process only final results to avoid duplicate text
        // Interim results are handled by the browser's native UI
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const alternative = result[0];
            finalTranscript += alternative.transcript;
          }
        }
        
        // Only append final results with a space prefix
        if (finalTranscript.trim()) {
          onTranscript(' ' + finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors as they're common
          return;
        }
        onError(`Spracherkennungsfehler: ${event.error}`);
        stop();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Microphone/Setup Error:", error);
      onError("Zugriff auf Mikrofon fehlgeschlagen.");
      stop();
    }
  }, [isListening, onTranscript, onError, stop]);

  useEffect(() => {
    return () => {
      if (isListening) stop();
    };
  }, [isListening, stop]);

  return { isListening, start, stop };
};
