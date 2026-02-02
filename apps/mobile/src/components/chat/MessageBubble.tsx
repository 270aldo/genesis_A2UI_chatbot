import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Message } from '@genesis/shared';
import { COLORS } from '../../theme';
import { WidgetMessage } from './WidgetMessage';

interface MessageBubbleProps {
  message: Message;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAction }) => {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* Text bubble */}
      {message.text ? (
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-genesis/20 rounded-br-sm'
              : 'bg-white/5 rounded-bl-sm'
          }`}
          style={isUser ? { backgroundColor: `${COLORS.genesis}33` } : undefined}
        >
          <MessageText text={message.text} isUser={isUser} />
          <Text className="text-white/20 text-[10px] mt-1 self-end">
            {formatTime(message.timestamp)}
          </Text>
        </View>
      ) : null}

      {/* Widget payload */}
      {message.payload && (
        <View className="w-full mt-2">
          <WidgetMessage payload={message.payload} onAction={onAction} />
        </View>
      )}
    </Animated.View>
  );
};

const MessageText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  // Simple markdown: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return (
    <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-white/90'}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} className="font-bold">
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text key={i} className="italic">
              {part.slice(1, -1)}
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Text key={i} className="font-mono bg-white/10 text-genesis">
              {' '}{part.slice(1, -1)}{' '}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};

const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};
