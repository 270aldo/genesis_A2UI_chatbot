import React from 'react';
import { View, Text } from 'react-native';
import { ScanLine } from 'lucide-react-native';
import { ActionButton } from '../ui';

export const ScanFoodCard: React.FC = () => {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-12 h-12 rounded-xl items-center justify-center bg-white/5">
        <ScanLine size={20} color="rgba(255,255,255,0.25)" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-white/50">Escanear Comida</Text>
        <Text className="text-[10px] text-white/25 mt-0.5">Proximamente</Text>
      </View>
      <ActionButton label="Escanear" variant="secondary" onPress={() => {}} disabled compact />
    </View>
  );
};
