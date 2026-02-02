import { KeyboardAvoidingView, Platform, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@genesis/shared';
import { useChat } from '../src/hooks/useChat';
import { ChatList, ChatInput } from '../src/components/chat';

// Import widgets to trigger registration
import '../src/components/widgets';

export default function ChatScreen() {
  const { messages, isLoading, sendMessage, handleAction } = useChat();

  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
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
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.genesis} />
        )}
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
