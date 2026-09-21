import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { HomePage } from './HomePage';
import type { NavItemId, UserProfile } from '../types';

export const AppShell: React.FC = () => {
  const [activeNavId, setActiveNavId] = useState<NavItemId>('home');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const currentUser: UserProfile = {
    name: 'Alex',
    email: 'alex@orbit.internal',
    initials: 'AL',
    role: 'Personal Assistant Workspace',
  };

  const sectionTitles: Record<NavItemId, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: 'Overview' },
    tasks: { title: 'Tasks', subtitle: 'Task management module (Upcoming in Step 2)' },
    automations: { title: 'Automations', subtitle: 'Automations engine (Upcoming in Step 2)' },
    assistant: { title: 'Assistant', subtitle: 'Full assistant view (Upcoming in Step 2)' },
    activity: { title: 'Activity', subtitle: 'Recent system activity (Upcoming in Step 2)' },
    integrations: { title: 'Integrations', subtitle: 'Connected services (Upcoming in Step 2)' },
    settings: { title: 'Settings', subtitle: 'Workspace preferences (Upcoming in Step 2)' },
  };

  return (
    <div id="orbit-app-shell" className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row text-zinc-900 font-sans antialiased">
      {/* Responsive Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onToggle={() => setIsMobileNavOpen((prev) => !prev)}
        onClose={() => setIsMobileNavOpen(false)}
        activeId={activeNavId}
        onSelect={setActiveNavId}
        user={currentUser}
      />

      {/* Desktop Left Sidebar */}
      <Sidebar
        activeId={activeNavId}
        onSelect={setActiveNavId}
        user={currentUser}
      />

      {/* Main Content Area */}
      <main
        id="main-content-area"
        className="flex-1 flex flex-col min-h-screen overflow-y-auto"
      >
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          {activeNavId === 'home' ? (
            <HomePage />
          ) : (
            <div
              id={`section-${activeNavId}`}
              className="w-full max-w-lg mx-auto text-center p-8 bg-white border border-zinc-200/80 rounded-2xl shadow-xs"
            >
              <h2 className="text-xl font-semibold text-zinc-900">
                {sectionTitles[activeNavId].title}
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                {sectionTitles[activeNavId].subtitle}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  id="return-home-btn"
                  onClick={() => setActiveNavId('home')}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
