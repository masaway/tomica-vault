import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  error: string | null;
  volume: number;
  isEnabled: boolean;
}

export interface UseAudioResult {
  audioState: AudioState;
  playSuccessSound: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  cleanup: () => Promise<void>;
  waitForReady: () => Promise<boolean>;
}

export const useAudio = (): UseAudioResult => {
  const [audioState, setAudioState] = useState<AudioState>({
    isLoaded: false,
    isPlaying: false,
    error: null,
    volume: 1.0,
    isEnabled: true,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        
        // プラットフォーム別の設定
        const audioMode = {
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          ...(Platform.OS === 'ios' && {
            interruptionModeIOS: 1, // DoNotMix
            playsInSilentModeIOS: true,
          }),
          ...(Platform.OS === 'android' && {
            interruptionModeAndroid: 1, // DoNotMix
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          }),
        };

        await Audio.setAudioModeAsync(audioMode);
        
        const { sound, status } = await Audio.Sound.createAsync(
          require('../assets/audio/scan_001.mp3'),
          {
            shouldPlay: false,
            isLooping: false,
            volume: audioState.volume,
          }
        );

        soundRef.current = sound;

        // 音声ファイルの詳細情報を取得
        const detailStatus = await sound.getStatusAsync();

        // 音声ファイルが存在し、読み込まれている場合
        if (detailStatus.isLoaded && detailStatus.durationMillis && detailStatus.durationMillis > 0) {
          setAudioState(prev => ({
            ...prev,
            isLoaded: true,
            error: null,
          }));
        } else {
          // 少し待ってから再確認
          setTimeout(async () => {
            try {
              const retryStatus = await sound.getStatusAsync();
              if (retryStatus.isLoaded) {
                setAudioState(prev => ({
                  ...prev,
                  isLoaded: true,
                  error: null,
                }));
              }
            } catch (retryError) {
              // エラーは無視
            }
          }, 500);
        }
      } catch (error: any) {
        setAudioState(prev => ({
          ...prev,
          isLoaded: false,
          error: `音声システムの初期化に失敗しました: ${error.message}`,
        }));
      }
    };

    setupAudio();

    return () => {
      cleanup();
    };
  }, []);

  const playSuccessSound = async (): Promise<void> => {
    if (!audioState.isEnabled || !soundRef.current || audioState.isPlaying) {
      return;
    }

    // リアルタイムで音声ファイルの状態を確認
    try {
      const currentStatus = await soundRef.current.getStatusAsync();
      if (!currentStatus.isLoaded) {
        return;
      }
    } catch (statusError) {
      return;
    }

    try {
      setAudioState(prev => ({ ...prev, isPlaying: true, error: null }));

      // 現在の再生状態を確認
      const currentStatus = await soundRef.current.getStatusAsync();

      // 必要に応じて位置をリセット
      if (currentStatus.isLoaded && currentStatus.positionMillis && currentStatus.positionMillis > 0) {
        await soundRef.current.setPositionAsync(0);
      }

      await soundRef.current.playAsync();

      // 簡単な再生完了監視（一定時間後に状態をリセット）
      setTimeout(() => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
        if (soundRef.current) {
          soundRef.current.setOnPlaybackStatusUpdate(null);
        }
      }, 2000); // 2秒後に再生完了とみなす

    } catch (error: any) {
      setAudioState(prev => ({
        ...prev,
        isPlaying: false,
        error: `音声再生に失敗しました: ${error.message}`,
      }));
    }
  };

  const setVolume = async (volume: number): Promise<void> => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    try {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(clampedVolume);
      }
      
      setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    } catch (error: any) {
      setAudioState(prev => ({
        ...prev,
        error: `音量設定に失敗しました: ${error.message}`,
      }));
    }
  };

  const setEnabled = (enabled: boolean): void => {
    setAudioState(prev => ({ ...prev, isEnabled: enabled }));
  };

  const cleanup = async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      // エラーは無視
    }
  };

  const waitForReady = async (): Promise<boolean> => {
    const maxAttempts = 30; // 最大3秒待機（100ms × 30回）
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const currentAudioState = audioState;
      const hasSoundRef = !!soundRef.current;
      
      if (currentAudioState.isLoaded && currentAudioState.isEnabled && hasSoundRef) {
        return true;
      }
      
      if (currentAudioState.error) {
        return false;
      }
      
      // 音声ファイルの状態も確認
      if (hasSoundRef) {
        try {
          const soundStatus = await soundRef.current.getStatusAsync();
          if (soundStatus.isLoaded && currentAudioState.isEnabled) {
            return true;
          }
        } catch (e) {
          // エラーは無視
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    return false;
  };

  return {
    audioState,
    playSuccessSound,
    setVolume,
    setEnabled,
    cleanup,
    waitForReady,
  };
};