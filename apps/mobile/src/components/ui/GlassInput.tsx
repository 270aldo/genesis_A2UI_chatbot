import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { TEXT } from '../../theme';

interface GlassInputProps extends TextInputProps {
  className?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <View className={`bg-black/20 border border-white/10 rounded-xl ${className}`}>
      <TextInput
        placeholderTextColor={TEXT.disabled}
        className="px-4 py-3 text-sm text-white"
        {...props}
      />
    </View>
  );
};
