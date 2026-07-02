/**
 * PlacementPilot AI — Main Application with React Router.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ResumeAnalysis from './pages/ResumeAnalysis';
import ATSOptimization from './pages/ATSOptimization';
import SkillGap from './pages/SkillGap';
import CareerRoadmap from './pages/CareerRoadmap';
import Resources from './pages/Resources';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resume" element={<ResumeAnalysis />} />
          <Route path="/ats" element={<ATSOptimization />} />
          <Route path="/skills" element={<SkillGap />} />
          <Route path="/roadmap" element={<CareerRoadmap />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
