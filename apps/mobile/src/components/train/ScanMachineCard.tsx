import React from 'react';
import { View, Text } from 'react-native';
import { Camera } from 'lucide-react-native';
import { ActionButton } from '../ui';
import { TEXT } from '../../theme';

export const ScanMachineCard: React.FC = () => {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-12 h-12 rounded-xl items-center justify-center bg-white/5">
        <Camera size={20} color={TEXT.disabled} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-white/70">Escanear Maquina</Text>
        <Text className="text-xs text-text-muted mt-0.5">Proximamente</Text>
      </View>
      <ActionButton label="Escanear" variant="secondary" onPress={() => {}} disabled compact />
    </View>
  );
};
