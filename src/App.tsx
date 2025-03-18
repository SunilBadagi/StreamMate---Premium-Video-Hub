import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/useThemeStore';
import PrivateChat from './components/PrivateChat';
import VideoDownload from './components/VideoDownload';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import Downloads from './components/Downloads'; // ✅ Import Downloads Page
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  useEffect(() => {
    setTheme();
    // Update theme every minute
    const interval = setInterval(setTheme, 60000);
    return () => clearInterval(interval);
  }, [setTheme]);

  return (
  <Router>
    <div className={`min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white`}>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/chat" element={user ? <PrivateChat /> : <Auth />} />
          <Route path="/videos" element={user ? <VideoDownload /> : <Auth />} />
          <Route path="/downloads" element={user ? <Downloads /> : <Auth />} />
          <Route path="/" element={user ? <PrivateChat /> : <Auth />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </div>
  </Router>
);

}

export default App;
