import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export interface RecordOnboardingParams {
  deviceId: string;
  vibeId: string;
  vibeTitle: string;
  username?: string;
}

/**
 * Records or updates the user's anonymous vibe response in Supabase.
 */
export async function recordOnboardingVibe({
  deviceId,
  vibeId,
  vibeTitle,
  username,
}: RecordOnboardingParams): Promise<void> {
  if (!deviceId) return;

  try {
    const payload: any = {
      device_id: deviceId,
      vibe_id: vibeId,
      vibe_title: vibeTitle,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    };

    if (username) {
      payload.username = username;
    }

    await supabase
      .from('onboarding_responses')
      .upsert(payload, { onConflict: 'device_id' });
  } catch (err) {
    console.warn('Failed to record onboarding vibe response:', err);
  }
}
