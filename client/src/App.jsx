import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Weekly from './pages/Weekly.jsx';
import Standings from './pages/Standings.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import CupPlay from './pages/CupPlay.jsx';
import Discipline from './pages/Discipline.jsx';
import Fields from './pages/Fields.jsx';
import Referees from './pages/Referees.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Portal from './pages/Portal.jsx';
import Registration from './pages/Registration.jsx';
import News from './pages/News.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weekly" element={<Weekly />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/standings/:slug" element={<Standings />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:slug" element={<TeamDetail />} />
        <Route path="/cups" element={<CupPlay />} />
        <Route path="/cups/:slug" element={<CupPlay />} />
        <Route path="/discipline" element={<Discipline />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/referees" element={<Referees />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/referee" element={<Navigate to="/portal" replace />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
