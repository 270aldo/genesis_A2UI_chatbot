import { KeyboardAvoidingView, Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@genesis/shared';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChat } from '../src/hooks/useChat';
import { ChatList, ChatInput } from '../src/components/chat';

export default function ChatModal() {
  const { messages, isLoading, sendMessage, handleAction } = useChat();
  const router = useRouter();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-5 py-3 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center gap-2">
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.genesis }}
          />
          <Text className="text-sm font-black tracking-widest text-white/90">
            GENESIS
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {isLoading && (
            <ActivityIndicator size="small" color={COLORS.genesis} />
          )}
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ChatList messages={messages} onAction={handleAction} />
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
