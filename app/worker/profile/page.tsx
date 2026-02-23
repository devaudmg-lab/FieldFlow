import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkerProfileUI from '@/components/worker/WorkerProfileUI';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <WorkerProfileUI profile={profile} email={user.email} />;
}