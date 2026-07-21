import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, Globe, Mail } from 'lucide-react';
import { getGlobalSettings, updateGlobalSettings } from '../../services/db';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // General Settings
  const [siteName, setSiteName] = useState('StudyNotes');
  const [supportEmail, setSupportEmail] = useState('support@studynotes.com');
  const [siteDescription, setSiteDescription] = useState('The best platform for college notes and PYQs.');
  const [premiumOnlyMode, setPremiumOnlyMode] = useState(true);
  
  // Notification Settings
  const [notifyRegistrations, setNotifyRegistrations] = useState(true);
  const [notifySubscriptions, setNotifySubscriptions] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await getGlobalSettings();
      if (settings) {
        if (settings.site_name) setSiteName(settings.site_name);
        if (settings.support_email) setSupportEmail(settings.support_email);
        if (settings.site_description) setSiteDescription(settings.site_description);
        if (settings.premium_only_mode !== undefined) setPremiumOnlyMode(settings.premium_only_mode);
        
        if (settings.notify_registrations !== undefined) setNotifyRegistrations(settings.notify_registrations);
        if (settings.notify_subscriptions !== undefined) setNotifySubscriptions(settings.notify_subscriptions);
        if (settings.notify_reports !== undefined) setNotifyReports(settings.notify_reports);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      await updateGlobalSettings({
        site_name: siteName,
        support_email: supportEmail,
        site_description: siteDescription,
        premium_only_mode: premiumOnlyMode
      });
      alert('General settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await updateGlobalSettings({
        notify_registrations: notifyRegistrations,
        notify_subscriptions: notifySubscriptions,
        notify_reports: notifyReports
      });
      alert('Notification preferences saved successfully!');
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      alert('Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white">Admin Settings</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'general'
                  ? 'bg-slate-100 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-white'
              }`}
            >
              <Globe className={`w-4 h-4 ${activeTab === 'general' ? 'text-emerald-500' : 'text-slate-400'}`} />
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-slate-100 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-white'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'security' ? 'text-emerald-500' : 'text-slate-400'}`} />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-slate-100 text-white dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-white'
              }`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-emerald-500' : 'text-slate-400'}`} />
              Notifications
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
            
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">General Settings</h3>
                  <p className="text-sm text-slate-400">Manage your website's basic information.</p>
                </div>
                
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Site Name</label>
                    <input 
                      type="text" 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Support Email</label>
                    <input 
                      type="email" 
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Site Description</label>
                    <textarea 
                      rows={4}
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-700 rounded-xl mt-6">
                    <div>
                      <p className="font-medium text-white">Premium Only Mode</p>
                      <p className="text-sm text-slate-400">When enabled, only premium users can access PYQs, Syllabus, and Chat.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={premiumOnlyMode}
                        onChange={(e) => setPremiumOnlyMode(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                  <button 
                    onClick={handleSaveGeneral}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Security Settings</h3>
                  <p className="text-sm text-slate-400">Update your password and secure your account.</p>
                </div>
                
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                  <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Notification Preferences</h3>
                  <p className="text-sm text-slate-400">Choose what you want to be notified about.</p>
                </div>
                
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between p-4 border border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-white">New User Registrations</p>
                      <p className="text-sm text-slate-400">Get notified when a new user signs up.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifyRegistrations}
                        onChange={(e) => setNotifyRegistrations(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-white">New Subscriptions</p>
                      <p className="text-sm text-slate-400">Get notified when a user subscribes to a premium plan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifySubscriptions}
                        onChange={(e) => setNotifySubscriptions(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-white">Reported Content</p>
                      <p className="text-sm text-slate-400">Get notified when content is reported by users.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifyReports}
                        onChange={(e) => setNotifyReports(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                  <button 
                    onClick={handleSaveNotifications}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
