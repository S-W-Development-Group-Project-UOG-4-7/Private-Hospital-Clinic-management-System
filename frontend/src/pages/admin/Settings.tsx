import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';

interface SettingsPayload {
  appointment: {
    slot_length_minutes: number;
    cancellation_window_hours: number;
  };
  fees: {
    consultation: number;
    lab_markup_percent: number;
    pharmacy_markup_percent: number;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<SettingsPayload>('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to load settings', err);
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put<SettingsPayload>('/admin/settings', settings);
      setSettings(response.data);
      setSuccess('Settings updated successfully.');
    } catch (err) {
      console.error('Failed to update settings', err);
      setError('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Configure appointment rules and fees.</p>
      </div>

      <form onSubmit={updateSettings} className="bg-white p-6 rounded shadow border border-gray-100 space-y-6">
        {settings ? (
          <>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Slot Length (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={settings.appointment.slot_length_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appointment: {
                          ...settings.appointment,
                          slot_length_minutes: Number(e.target.value),
                        },
                      })
                    }
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cancellation Window (hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={settings.appointment.cancellation_window_hours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appointment: {
                          ...settings.appointment,
                          cancellation_window_hours: Number(e.target.value),
                        },
                      })
                    }
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Fee Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Consultation Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.fees.consultation}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fees: {
                          ...settings.fees,
                          consultation: Number(e.target.value),
                        },
                      })
                    }
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Lab Markup (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.fees.lab_markup_percent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fees: {
                          ...settings.fees,
                          lab_markup_percent: Number(e.target.value),
                        },
                      })
                    }
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pharmacy Markup (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.fees.pharmacy_markup_percent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        fees: {
                          ...settings.fees,
                          pharmacy_markup_percent: Number(e.target.value),
                        },
                      })
                    }
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 text-white px-5 py-2 rounded hover:bg-teal-700 transition disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">{loading ? 'Loading settings...' : 'No settings available.'}</p>
        )}
      </form>
    </div>
  );
};

export default Settings;
