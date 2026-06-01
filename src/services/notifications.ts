import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Goal, Reminder } from '@/domain/types';

const isWeb = Platform.OS === 'web';
const CHANNEL_ID = 'reminders';

// expo weekday: 1 = Sunday … 7 = Saturday. JS getDay(): 0 = Sunday … 6 = Saturday.
function expoWeekday(d: Date): number {
  return d.getDay() + 1;
}

function baseDate(goal: Goal): Date {
  return goal.date ? new Date(goal.date + 'T00:00:00') : new Date();
}

// Call once at app startup so foreground notifications surface.
export function configureNotifications() {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestPermission(): Promise<boolean> {
  if (isWeb) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

function triggerFor(goal: Goal, reminder: Reminder): Notifications.NotificationTriggerInput {
  const { hour, minute } = reminder;
  const rec = goal.recurrence ?? 'none';
  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

  if (rec === 'daily' || (rec === 'none' && goal.timeframe === 'daily')) {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId };
  }
  if (rec === 'weekly' || (rec === 'none' && goal.timeframe === 'weekly')) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: expoWeekday(baseDate(goal)),
      hour,
      minute,
      channelId,
    };
  }
  if (rec === 'monthly' || (rec === 'none' && goal.timeframe === 'monthly')) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: baseDate(goal).getDate(),
      hour,
      minute,
      channelId,
    };
  }
  // One-off: next time this hour:minute occurs (today if still ahead, else tomorrow).
  const when = new Date();
  when.setHours(hour, minute, 0, 0);
  if (when.getTime() <= Date.now()) when.setDate(when.getDate() + 1);
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId };
}

async function scheduleOne(goal: Goal, reminder: Reminder): Promise<string | null> {
  if (isWeb) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: goal.title,
        body: goal.notes?.trim() || 'Time to make progress on this goal.',
        data: { goalId: goal.id },
      },
      trigger: triggerFor(goal, reminder),
    });
  } catch {
    return null;
  }
}

async function cancelOne(notificationId?: string) {
  if (isWeb || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    /* already gone */
  }
}

// Cancel every scheduled reminder for a goal, then (re)schedule the enabled ones.
// Returns the reminders array with refreshed notificationIds to persist.
export async function syncReminders(goal: Goal): Promise<Reminder[]> {
  const reminders = goal.reminders ?? [];
  if (isWeb) return reminders.map((r) => ({ ...r, notificationId: undefined }));

  const granted = reminders.some((r) => r.enabled) ? await requestPermission() : true;

  const out: Reminder[] = [];
  for (const r of reminders) {
    await cancelOne(r.notificationId);
    if (r.enabled && granted) {
      const id = await scheduleOne(goal, r);
      out.push({ ...r, notificationId: id ?? undefined });
    } else {
      out.push({ ...r, notificationId: undefined });
    }
  }
  return out;
}

export async function cancelGoalReminders(goal: Goal) {
  for (const r of goal.reminders ?? []) await cancelOne(r.notificationId);
}
