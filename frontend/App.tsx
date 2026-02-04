import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { HomeScreen, TrainScreen, FuelScreen, MindScreen, TrackScreen } from './screens';

import { useTelemetry } from './src/services/events';

const App: React.FC = () => {
  // Initialize telemetry service at app root
  useTelemetry({ debug: import.meta.env.DEV });

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="train" element={<TrainScreen />} />
          <Route path="fuel" element={<FuelScreen />} />
          <Route path="mind" element={<MindScreen />} />
          <Route path="track" element={<TrackScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
