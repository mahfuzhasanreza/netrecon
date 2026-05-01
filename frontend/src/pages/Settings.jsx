import React, { useState } from 'react';
import axios from '../api/axiosConfig.jsx';
import '../styles/Settings.css';

function Settings({ user }) {
  const [profile, setProfile] = useState(user?.profile || {});
  const [preferences, setPreferences] = useState(user?.preferences || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(
        `/api/users/profile/${user?._id}`,
        { profile, preferences }
      );
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <div className="settings-container">
        {/* Profile Settings */}
        <div className="settings-section">
          <h3>👤 Profile Settings</h3>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={profile.firstName || ''}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={profile.lastName || ''}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-group">
            <label>Organization</label>
            <input
              type="text"
              name="organization"
              value={profile.organization || ''}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone || ''}
              onChange={handleProfileChange}
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-section">
          <h3>⚙️ Preferences</h3>

          <div className="form-group">
            <label>Theme</label>
            <select
              name="theme"
              value={preferences.theme || 'dark'}
              onChange={handlePreferenceChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={preferences.emailNotifications || false}
                onChange={handlePreferenceChange}
              />
              Email Notifications
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="scanNotifications"
                checked={preferences.scanNotifications || false}
                onChange={handlePreferenceChange}
              />
              Scan Notifications
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="save-btn"
        >
          {saving ? '💾 Saving...' : '💾 Save Changes'}
        </button>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

export default Settings;
