import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import Portfolio from './pages/Portfolio';
import MacroPage from './pages/MacroPage';
import StudyPage from './pages/StudyPage';
import DailyStudy from './pages/DailyStudy';
import WeeklyAnalysis from './pages/WeeklyAnalysis';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/macro" element={<MacroPage />} />
          <Route path="/learning" element={<StudyPage />} />
          <Route path="/daily-study" element={<DailyStudy />} />
          <Route path="/weekly" element={<WeeklyAnalysis />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
