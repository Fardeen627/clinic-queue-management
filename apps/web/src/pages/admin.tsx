import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRequireRole } from '@/lib/auth';

export default function AdminPage() {
  const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || '00000000-0000-4000-8000-000000000001';
  useRequireRole(['admin']);

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsTemplate, setTtsTemplate] = useState('Ticket {name}, please proceed to {room}.');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [newMedia, setNewMedia] = useState({
    kind: 'IMAGE',
    title: '',
    src: '',
    durationS: 10,
  });

  useEffect(() => {
    fetchSettings();
    fetchMedia();
    fetchPlaylist();
  }, []);

  const fetchSettings = async () => {
    try {
      const settings = await api.settings.get(CLINIC_ID);
      setTtsEnabled(settings.ttsEnabled);
      setTtsTemplate(settings.ttsTemplate);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const items = await api.media.list(CLINIC_ID);
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const fetchPlaylist = async () => {
    try {
      const items = await api.media.playlist(CLINIC_ID);
      setPlaylist(items);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.settings.update(CLINIC_ID, {
        ttsEnabled,
        ttsTemplate,
      });
      setMessage('Settings saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Could not save settings.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleTestTTS = () => {
    const utterance = new SpeechSynthesisUtterance(
      ttsTemplate.replace('{name}', 'Alex Smith').replace('{room}', 'Room 1')
    );
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleCreateMedia = async () => {
    if (!newMedia.src.trim()) {
      setMessage('Please enter a source URL.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    try {
      await api.media.create({
        clinicId: CLINIC_ID,
        kind: newMedia.kind,
        title: newMedia.title || undefined,
        src: newMedia.src,
        durationS: newMedia.durationS || undefined,
      });
      setNewMedia({ kind: 'IMAGE', title: '', src: '', durationS: 10 });
      fetchMedia();
    } catch (error) {
      console.error('Failed to create media:', error);
      setMessage('Could not add media.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleAddToPlaylist = async (mediaId: string) => {
    try {
      await api.media.playlistAdd({ clinicId: CLINIC_ID, mediaId });
      fetchPlaylist();
    } catch (error) {
      console.error('Failed to add playlist:', error);
      setMessage('Could not add this item to the playlist.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleRemoveFromPlaylist = async (mediaId: string) => {
    try {
      await api.media.playlistRemove(CLINIC_ID, mediaId);
      fetchPlaylist();
    } catch (error) {
      console.error('Failed to remove playlist:', error);
      setMessage('Could not remove this item from the playlist.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media item?')) return;
    try {
      await api.media.remove(mediaId);
      fetchMedia();
      fetchPlaylist();
    } catch (error) {
      console.error('Failed to delete media:', error);
      setMessage('Could not delete media.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading administration…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 rounded-2xl bg-slate-900 px-6 py-5 text-white"><p className="text-sm text-teal-300">Clinic Queue / Settings</p><h1 className="text-3xl font-bold">Administration</h1></header>

        {message && (
          <div
            className={`mb-4 p-4 rounded ${
              message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Announcement settings</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={(e) => setTtsEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Enable voice announcements</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Announcement template</label>
                <input
                  type="text"
                  value={ttsTemplate}
                  onChange={(e) => setTtsTemplate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ticket {name}, please proceed to {room}."
                />
                <div className="mt-2 text-sm text-gray-500">
                  Available variables: {'{name}'} (patient name), {'{room}'} (room name)
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save settings
                </button>
                <button
                  onClick={handleTestTTS}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Test announcement
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Media library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newMedia.kind}
                  onChange={(e) => setNewMedia({ ...newMedia, kind: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="IMAGE">Image</option><option value="VIDEO">Video</option><option value="YOUTUBE">YouTube</option><option value="URL">Web page URL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newMedia.title}
                  onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Clinic information video"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                <input
                  type="text"
                  value={newMedia.src}
                  onChange={(e) => setNewMedia({ ...newMedia, src: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display time (seconds)</label>
                <input
                  type="number"
                  value={newMedia.durationS}
                  onChange={(e) => setNewMedia({ ...newMedia, durationS: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min={5}
                />
              </div>
            </div>
            <button
              onClick={handleCreateMedia}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add media
            </button>

            <div className="mt-6 space-y-2">
              {mediaItems.length === 0 ? (
                <div className="text-sm text-gray-500">No media has been added yet.</div>
              ) : (
                mediaItems.map((item) => (
                  <div key={item.id} className="border rounded px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.title || item.src}</div>
                      <div className="text-xs text-gray-500">{item.kind} · {item.durationS || 0}s</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAddToPlaylist(item.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Add to playlist
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Waiting-room playlist</h2>
            <div className="space-y-2">
              {playlist.length === 0 ? (
                <div className="text-sm text-gray-500">The playlist is empty.</div>
              ) : (
                playlist.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="border rounded px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.title || item.src}</div>
                      <div className="text-xs text-gray-500">{item.kind}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromPlaylist(item.id)}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">System information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Clinic ID</span>
                <span className="font-mono text-sm">{CLINIC_ID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API URL</span>
                <span className="font-mono text-sm">{process.env.NEXT_PUBLIC_API_URL}</span>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200">
            <h2 className="text-xl font-semibold text-teal-900 mb-4">Quick setup guide</h2>
            <div className="text-teal-800 space-y-2">
              <p>1. Reception: open the reception page in a web browser.</p><p>2. Doctor: open the doctor page in a web browser.</p><p>3. Waiting room: show the display page full screen on the TV or monitor.</p><p>4. Keep all devices on the same Wi-Fi network.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
