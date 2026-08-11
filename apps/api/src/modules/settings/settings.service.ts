import { getDB } from '../db';
import { Settings, UpdateSettings } from '@shared';

export class SettingsService {
  static async findByClinicId(clinicId: string): Promise<Settings | null> {
    const db = getDB();

    const settings = db
      .prepare('SELECT * FROM settings WHERE clinic_id = ?')
      .get(clinicId) as Settings | undefined;

    db.close();

    return settings || null;
  }

  static async update(clinicId: string, data: UpdateSettings): Promise<Settings | null> {
    const db = getDB();

    const updates: string[] = [];
    const params: any[] = [];

    if (data.ttsEnabled !== undefined) {
      updates.push('tts_enabled = ?');
      params.push(data.ttsEnabled ? 1 : 0);
    }

    if (data.ttsTemplate !== undefined) {
      updates.push('tts_template = ?');
      params.push(data.ttsTemplate);
    }

    if (data.displayTheme !== undefined) {
      updates.push('display_theme = ?');
      params.push(JSON.stringify(data.displayTheme));
    }

    if (updates.length === 0) {
      db.close();
      return null;
    }

    params.push(clinicId);

    const updateSettings = db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE clinic_id = ?`);
    updateSettings.run(...params);

    const settings = db
      .prepare('SELECT * FROM settings WHERE clinic_id = ?')
      .get(clinicId) as Settings | undefined;

    db.close();

    return settings || null;
  }
}
