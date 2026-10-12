'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_VOICE_SECONDS } from '@/utils/attachments';

export interface VoiceRecording {
  file: File;
  durationSeconds: number;
}

type RecorderState = 'idle' | 'recording';

/** Formatos em ordem de preferência: Chrome/Firefox gravam webm/ogg; Safari grava mp4 */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];

const pickMimeType = () =>
  typeof MediaRecorder !== 'undefined' ? MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) : undefined;

const extensionFor = (mimeType: string) => (mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm');

/**
 * Grava mensagens de voz com o microfone (MediaRecorder).
 * Toque para gravar e toque para enviar — sem precisar segurar o botão, o que é mais acessível.
 */
export function useVoiceRecorder(options?: { onLimitReached?: (recording: VoiceRecording) => void }) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  /** Quem chamou stop() recebe a gravação; cancel() descarta */
  const resolveRef = useRef<((recording: VoiceRecording | null) => void) | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const cleanup = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop()); // apaga o indicador de microfone do sistema
    streamRef.current = null;
    recorderRef.current = null;
    setState('idle');
    setElapsed(0);
  };

  // Solta o microfone se a tela for fechada durante a gravação
  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const finish = (keep: boolean): Promise<VoiceRecording | null> =>
    new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') return resolve(null);
      resolveRef.current = keep ? resolve : () => resolve(null);
      recorder.stop();
    });

  const start = async () => {
    setError(null);
    const mimeType = pickMimeType();
    if (!navigator.mediaDevices?.getUserMedia || mimeType === undefined) {
      setError('Seu navegador não permite gravar áudio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => event.data.size > 0 && chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
        const type = recorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type });
        const name = `mensagem-de-voz-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extensionFor(type)}`;
        cleanup();
        const recording = blob.size > 0 ? { file: new File([blob], name, { type }), durationSeconds } : null;
        if (resolveRef.current) resolveRef.current(recording);
        // Parou sozinho ao atingir o limite: entrega a gravação para não perdê-la
        else if (recording) optionsRef.current?.onLimitReached?.(recording);
        resolveRef.current = null;
      };

      recorder.start();
      startedAtRef.current = Date.now();
      setState('recording');
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= MAX_VOICE_SECONDS && recorder.state === 'recording') recorder.stop(); // limite atingido
      }, 250);
    } catch (err) {
      cleanup();
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permita o uso do microfone nas configurações do navegador para gravar.'
          : 'Não foi possível acessar o microfone.',
      );
    }
  };

  return {
    state,
    elapsed,
    error,
    clearError: () => setError(null),
    start,
    /** Para a gravação e devolve o arquivo (ou null se nada foi gravado) */
    stop: () => finish(true),
    /** Para e descarta a gravação */
    cancel: () => finish(false),
  };
}
