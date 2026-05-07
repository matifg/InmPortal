import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://wekvnrjqngbdelejudyx.supabase.co', // 👈 TU URL (sin /rest/v1)
  'sb_publishable_BE3JMXJqay7QM7GYp-s9Rw_kV0sj7r8' // 👈 TU KEY (de API Keys)
);