import React from 'react';
import { View, Text } from 'react-native';
import { GlassCard } from '../ui';
import { getColorForWidget } from '../../utils/getCategoryColor';
import { WidgetType } from '@genesis/shared';
import { FONTS } from '../../theme/fonts';

interface FallbackWidgetProps {
  type: string;
}

export const FallbackWidget: React.FC<FallbackWidgetProps> = ({ type }) => {
  const color = getColorForWidget(type as WidgetType);

  return (
    <GlassCard accentColor={color}>
      <View className="items-center py-4">
        <View
          className="px-3 py-1 rounded-full mb-2"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text className="text-xs font-bold" style={{ color, fontFamily: FONTS.monoBold }}>
            {type}
          </Text>
        </View>
        <Text className="text-white/40 text-xs">
          Widget no disponible aún en móvil
        </Text>
      </View>
    </GlassCard>
  );
};
