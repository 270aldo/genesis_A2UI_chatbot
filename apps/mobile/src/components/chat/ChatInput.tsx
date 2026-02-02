import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SendHorizontal } from 'lucide-react-native';
import { COLORS } from '../../theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(trimmed);
    setText('');
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <View className="px-4 pb-2 pt-2 border-t border-white/5">
      <View className="flex-row items-end bg-white/5 rounded-2xl border border-white/10 px-4 py-1">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mensaje a GENESIS..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
          maxLength={2000}
          className="flex-1 text-white text-sm py-3 max-h-24"
          style={{ lineHeight: 20 }}
          editable={!isLoading}
          onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className="ml-2 mb-2 p-2 rounded-full"
          style={{
            backgroundColor: canSend ? COLORS.genesis : 'rgba(255,255,255,0.05)',
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size={18} />
          ) : (
            <SendHorizontal
              size={18}
              color={canSend ? 'white' : 'rgba(255,255,255,0.2)'}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};
