/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdaptiveAssistantOverlay } from './components/AdaptiveAssistantOverlay';
import { CameraSensingModal } from './components/CameraSensingModal';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ContactPage } from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { ResearchPage } from './pages/ResearchPage';
import { OfflineIndicator } from './components/OfflineIndicator';

import {
  getLocalProfile,
  getLocalPreferences,
  saveLocalPreferences,
  saveLocalProfile,
  supabase,
  isSupabaseConfigured
} from './lib/supabaseClient';
import { learningEngine } from './lib/learningEngine';
import { UserProfile, UserPreferences, AdaptiveSuggestion } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gsense_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [profile, setProfile] = useState<UserProfile>(() => getLocalProfile());
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getLocalPreferences(profile.id)
  );

  const [activeSuggestion, setActiveSuggestion] = useState<AdaptiveSuggestion | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraSensingEnabled, setCameraSensingEnabled] = useState<boolean>(
    preferences.cameraSensingEnabled || false
  );

  // Initialize theme class on document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gsense_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gsense_theme', 'light');
    }
  }, [isDark]);

  // Synchronize Supabase Auth if configured
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            learningStatus: 'active',
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          setProfile(userProfile);
          saveLocalProfile(userProfile);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            learningStatus: 'active',
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          setProfile(userProfile);
          saveLocalProfile(userProfile);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Synchronize initial learning pause state with stored profile preference
  useEffect(() => {
    learningEngine.setPaused(profile.learningStatus === 'paused');
    learningEngine.configureThresholds(
      preferences.hesitationThresholdMs,
      preferences.repeatAttemptsTrigger,
      preferences.assistanceLevel,
      undefined,
      undefined,
      preferences.autoSuggestionsEnabled !== false
    );

    const unsubscribe = learningEngine.subscribe(() => {
      const isEnginePaused = learningEngine.getIsPaused();
      const currentProfileStatus = isEnginePaused ? 'paused' : 'active';
      setProfile((prev) => {
        if (prev.learningStatus !== currentProfileStatus) {
          const updated = { ...prev, learningStatus: currentProfileStatus as 'active' | 'paused' };
          saveLocalProfile(updated);
          return updated;
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Record permitted navigation event in learning engine
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Inform engine of navigation change
    const result = learningEngine.recordEvent({
      sessionId: 'web_session_' + profile.id,
      screenId: page,
      componentType: 'nav_link',
      eventType: 'navigation',
      userId: profile.id,
    });

    if (result.suggestion) {
      setActiveSuggestion(result.suggestion);
    }
  };

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleSignOut = () => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut();
    }
    const freshProfile = getLocalProfile();
    setProfile(freshProfile);
    setCurrentPage('home');
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setCameraSensingEnabled(newPrefs.cameraSensingEnabled);
    learningEngine.configureThresholds(
      newPrefs.hesitationThresholdMs,
      newPrefs.repeatAttemptsTrigger,
      newPrefs.assistanceLevel,
      undefined,
      undefined,
      newPrefs.autoSuggestionsEnabled !== false
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Strict 3-Zone Top Bar Contract */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        userEmail={profile.email}
        onSignOut={handleSignOut}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onTriggerSuggestion={(sug) => setActiveSuggestion(sug)}
          />
        )}
        {currentPage === 'features' && <FeaturesPage onNavigate={handleNavigate} />}
        {currentPage === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {currentPage === 'downloads' && <DownloadsPage onNavigate={handleNavigate} />}
        {currentPage === 'docs' && <DocumentationPage />}
        {currentPage === 'privacy' && (
          <PrivacyPage onNavigate={handleNavigate} onSignOut={handleSignOut} />
        )}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'auth' && (
          <AuthPage
            onAuthSuccess={(p) => {
              setProfile(p);
              setCurrentPage('profile');
            }}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'profile' && (
          <ProfilePage
            profile={profile}
            preferences={preferences}
            onUpdateProfile={setProfile}
            onUpdatePreferences={handleUpdatePreferences}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
            onOpenCameraModal={() => setIsCameraModalOpen(true)}
          />
        )}
        {currentPage === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} userId={profile.id} />
        )}
        {currentPage === 'research' && (
          <ResearchPage onNavigate={handleNavigate} userId={profile.id} />
        )}
      </main>

      {/* Non-intrusive Offline Connectivity Notification */}
      <OfflineIndicator />

      {/* Non-intrusive Adaptive Assistant Guidance Overlay */}
      <AdaptiveAssistantOverlay
        suggestion={activeSuggestion}
        onDismiss={() => setActiveSuggestion(null)}
        userId={profile.id}
      />

      {/* Privacy-First Optional Camera Presence Modal */}
      <CameraSensingModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        isEnabled={cameraSensingEnabled}
        onToggleEnabled={(enabled) => {
          setCameraSensingEnabled(enabled);
          const updated = { ...preferences, cameraSensingEnabled: enabled };
          setPreferences(updated);
          saveLocalPreferences(updated);
        }}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
