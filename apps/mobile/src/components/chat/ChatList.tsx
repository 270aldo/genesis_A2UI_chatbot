import React, { useRef, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Message } from '@genesis/shared';
import { COLORS } from '../../theme';
import { MessageBubble } from './MessageBubble';

interface ChatListProps {
  messages: Message[];
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ messages, onAction }) => {
  const listRef = useRef<FlatList<Message>>(null);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} onAction={onAction} />
    ),
    [onAction]
  );

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      ref={listRef}
      data={[...messages].reverse()}
      renderItem={renderItem}
      inverted
      keyExtractor={(_, index) => String(index)}
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
