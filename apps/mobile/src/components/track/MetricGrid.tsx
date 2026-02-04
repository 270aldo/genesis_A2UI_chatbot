import React from 'react';
import { View } from 'react-native';
import { Dumbbell, Scale, CalendarCheck, Moon } from 'lucide-react-native';
import { MetricCard } from '../shared';

export const MetricGrid: React.FC = () => {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <MetricCard
          label="Fuerza"
          value="80kg"
          delta="+5kg"
          deltaDirection="up"
          icon={Dumbbell}
          color="#EF4444"
        />
        <MetricCard
          label="Composicion"
          value="16.5%"
          delta="-0.3%"
          deltaDirection="down"
          icon={Scale}
          color="#22C55E"
        />
      </View>
      <View className="flex-row gap-3">
        <MetricCard
          label="Adherencia"
          value="87%"
          delta="+2%"
          deltaDirection="up"
          icon={CalendarCheck}
          color="#A855F7"
        />
        <MetricCard
          label="Sueno"
          value="7.2h"
          delta="+0.1h"
          deltaDirection="up"
          icon={Moon}
          color="#6366F1"
        />
      </View>
    </View>
  );
};
