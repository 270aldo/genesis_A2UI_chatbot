import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { COLORS } from '../../theme';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../lib/a2ui/types';

interface ChatListProps {
  messages: ChatMessage[];
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ messages, onAction }) => {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble message={item} onAction={onAction} />
    ),
    [onAction]
  );

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      ref={listRef}
      data={reversedMessages}
      renderItem={renderItem}
      inverted
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

const EmptyState: React.FC = () => (
  <View className="flex-1 items-center justify-center px-8">
    <Text className="text-3xl font-black mb-2" style={{ color: COLORS.genesis }}>
      GENESIS
    </Text>
    <Text className="text-white/30 text-sm text-center leading-5">
      Tu coach de fitness con IA.{'\n'}Pregunta lo que sea.
    </Text>
  </View>
);
