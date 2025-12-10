
import { supabase } from '@/app/integrations/supabase/client';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  type: 'maintenance' | 'appointment' | 'payment' | 'general';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface RemindersResponse {
  success: boolean;
  reminders: Reminder[];
  count: number;
}

export class RemindersService {
  async fetchReminders(): Promise<RemindersResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('reminders_dispatcher', {
        body: {},
      });

      if (error) {
        console.error('Error fetching reminders:', error);
        throw error;
      }

      return data as RemindersResponse;
    } catch (error) {
      console.error('Exception fetching reminders:', error);
      // Return empty reminders on error
      return {
        success: false,
        reminders: [],
        count: 0,
      };
    }
  }

  async markReminderComplete(reminderId: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log('Marking reminder complete:', reminderId);
      return true;
    } catch (error) {
      console.error('Error marking reminder complete:', error);
      return false;
    }
  }
}

export const remindersService = new RemindersService();
