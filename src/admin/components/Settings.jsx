import React, { useState } from 'react';

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const getTabClass = (tabName) => {
    return `flex items-center gap-md p-md rounded-xl font-bold transition-all ${activeTab === tabName
        ? 'bg-primary-container text-on-primary-container'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
      }`;
  };

  return (
    <div className="flex flex-col gap-lg max-w-4xl">
      <div className="mb-md">
        <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface">Settings</h2>
        <p className="text-body-md text-on-surface-variant">Manage your system preferences and account settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-lg">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-xs">
          <button className={getTabClass('profile')} onClick={() => setActiveTab('profile')}>
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="font-label-md">Profile & Account</span>
          </button>
          <button className={getTabClass('notifications')} onClick={() => setActiveTab('notifications')}>
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="font-label-md">Notifications</span>
          </button>
          <button className={getTabClass('security')} onClick={() => setActiveTab('security')}>
            <span className="material-symbols-outlined text-[20px]">security</span>
            <span className="font-label-md">Security</span>
          </button>
          <button className={getTabClass('appearance')} onClick={() => setActiveTab('appearance')}>
            <span className="material-symbols-outlined text-[20px]">palette</span>
            <span className="font-label-md">Appearance</span>
          </button>
          <button className={getTabClass('integrations')} onClick={() => setActiveTab('integrations')}>
            <span className="material-symbols-outlined text-[20px]">api</span>
            <span className="font-label-md">Integrations</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm flex flex-col gap-lg min-h-[400px]">

          {activeTab === 'profile' && (
            <>
              <h3 className="text-headline-md font-headline-md font-bold text-on-surface border-b border-outline-variant pb-sm">Profile Details</h3>
              <div className="flex flex-col gap-md">
                <div className="flex items-center gap-lg">
                  <img alt="Admin Avatar" className="w-20 h-20 rounded-full border-4 border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjCZ-YqtXyQrqQws1STBvuNoDYIZ4aRj4tsrIuJ5N4IXV13Zn932IJ96h7pLbqhf9MeRsaYUi5JPIsFQQoVFzXL4YU_dCUXDlp3oBpK8YeerP9BCx5o92VRJHfpnIISqhpgL3FbzF26NO9FF-4Yj5-vOvF4PvFtXRmlpnUSsn_eNe-X3QiZknTeJgSeZwcDvNk2SzHmoz7vjT7PAdh3Clg7ak9bvidYWYhJHEypNyi6gSw0MfHuF0uym3zaVkb05GH7ajVGxPdvEo7" />
                  <div>
                    <button className="bg-primary text-on-primary px-md py-sm rounded-xl font-bold font-label-md mb-xs hover:brightness-110 transition-colors">Change Avatar</button>
                    <p className="text-body-sm text-on-surface-variant">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">First Name</label>
                    <input type="text" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" defaultValue="TezX" />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Last Name</label>
                    <input type="text" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" defaultValue="Admin" />
                  </div>
                  <div className="flex flex-col gap-xs md:col-span-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Email Address</label>
                    <input type="email" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" defaultValue="admin@tezx.com" />
                  </div>
                  <div className="flex flex-col gap-xs md:col-span-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Role</label>
                    <input type="text" disabled className="bg-surface-variant/30 border border-outline-variant rounded-xl px-md py-sm text-on-surface-variant text-body-md cursor-not-allowed" defaultValue="System Administrator" />
                  </div>
                </div>

                <div className="flex justify-end mt-lg pt-lg border-t border-outline-variant gap-md">
                  <button className="px-lg py-sm rounded-xl font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">Cancel</button>
                  <button className="bg-primary text-on-primary px-lg py-sm rounded-xl font-bold hover:brightness-110 transition-colors">Save Changes</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h3 className="text-headline-md font-headline-md font-bold text-on-surface border-b border-outline-variant pb-sm">Notification Preferences</h3>
              <div className="flex flex-col gap-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-on-surface">Email Notifications</h4>
                    <p className="text-body-sm text-on-surface-variant">Receive daily summaries and critical alerts via email.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-on-surface">New Lead Alerts</h4>
                    <p className="text-body-sm text-on-surface-variant">Get notified instantly when a new lead enters the pipeline.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-on-surface">Weekly Report</h4>
                    <p className="text-body-sm text-on-surface-variant">Receive a detailed performance report every Monday.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary" />
                </div>
                <div className="flex justify-end mt-auto pt-lg border-t border-outline-variant gap-md">
                  <button className="bg-primary text-on-primary px-lg py-sm rounded-xl font-bold hover:brightness-110 transition-colors">Update Preferences</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h3 className="text-headline-md font-headline-md font-bold text-on-surface border-b border-outline-variant pb-sm">Security Settings</h3>
              <div className="flex flex-col gap-lg">
                <div className="flex flex-col gap-md">
                  <h4 className="font-bold text-on-surface">Change Password</h4>
                  <div className="flex flex-col gap-xs">
                    <input type="password" placeholder="Current Password" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <input type="password" placeholder="New Password" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <input type="password" placeholder="Confirm New Password" className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md" />
                  </div>
                  <div>
                    <button className="bg-primary text-on-primary px-lg py-sm rounded-xl font-bold hover:brightness-110 transition-colors">Update Password</button>
                  </div>
                </div>
                <div className="border-t border-outline-variant pt-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-on-surface">Two-Factor Authentication</h4>
                    <p className="text-body-sm text-on-surface-variant">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-md py-sm border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-variant transition-colors">Enable 2FA</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h3 className="text-headline-md font-headline-md font-bold text-on-surface border-b border-outline-variant pb-sm">Appearance</h3>
              <div className="flex flex-col gap-lg">
                <div>
                  <h4 className="font-bold text-on-surface mb-sm">Theme</h4>
                  <div className="flex gap-md">
                    <label className="flex items-center gap-sm cursor-pointer p-md border border-primary bg-primary-container/20 rounded-xl">
                      <input type="radio" name="theme" defaultChecked className="text-primary focus:ring-primary" />
                      <span className="font-bold text-on-surface">System Default</span>
                    </label>
                    <label className="flex items-center gap-sm cursor-pointer p-md border border-outline-variant rounded-xl hover:bg-surface-variant/50 transition-colors">
                      <input type="radio" name="theme" className="text-primary focus:ring-primary" />
                      <span className="font-bold text-on-surface">Light Mode</span>
                    </label>
                    <label className="flex items-center gap-sm cursor-pointer p-md border border-outline-variant rounded-xl hover:bg-surface-variant/50 transition-colors">
                      <input type="radio" name="theme" className="text-primary focus:ring-primary" />
                      <span className="font-bold text-on-surface">Dark Mode</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-sm">Density</h4>
                  <select className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md w-full md:w-64">
                    <option>Standard (Recommended)</option>
                    <option>Compact</option>
                    <option>Comfortable</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'integrations' && (
            <>
              <h3 className="text-headline-md font-headline-md font-bold text-on-surface border-b border-outline-variant pb-sm">Integrations</h3>
              <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between p-md border border-outline-variant rounded-xl">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-[#EA4335] rounded-lg flex items-center justify-center text-white font-bold">G</div>
                    <div>
                      <h4 className="font-bold text-on-surface">Google Workspace</h4>
                      <p className="text-body-sm text-on-surface-variant">Sync calendar and contacts</p>
                    </div>
                  </div>
                  <button className="px-md py-sm border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-variant transition-colors">Connect</button>
                </div>
                <div className="flex items-center justify-between p-md border border-primary bg-primary-container/10 rounded-xl">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <div>
                      <h4 className="font-bold text-on-surface">Slack</h4>
                      <p className="text-body-sm text-on-surface-variant">Receive notifications in channels</p>
                    </div>
                  </div>
                  <button className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl font-bold text-error hover:bg-error-container transition-colors">Disconnect</button>
                </div>
                <div className="flex items-center justify-between p-md border border-outline-variant rounded-xl">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-[#0061FF] rounded-lg flex items-center justify-center text-white font-bold">Z</div>
                    <div>
                      <h4 className="font-bold text-on-surface">Zoom</h4>
                      <p className="text-body-sm text-on-surface-variant">Auto-generate meeting links</p>
                    </div>
                  </div>
                  <button className="px-md py-sm border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-surface-variant transition-colors">Connect</button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Settings;
