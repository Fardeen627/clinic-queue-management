import { Router, Request, Response } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettings } from '@shared';

const router = Router();

router.get('/:clinicId', async (req: Request, res: Response) => {
  try {
    const settings = await SettingsService.findByClinicId(String(req.params.clinicId));
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:clinicId', async (req: Request, res: Response) => {
  try {
    const data = UpdateSettings.parse(req.body);
    const settings = await SettingsService.update(String(req.params.clinicId), data);

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
