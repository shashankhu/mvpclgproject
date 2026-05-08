import { createClient } from '@/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: notes, error } = await supabase.from("notes").select();

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Error loading notes</h1>
        <p>{error.message}</p>
        <p>Make sure you have created the <code>notes</code> table in your Supabase SQL Editor as shown in the Quickstart guide.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Notes</h1>
      <pre>{JSON.stringify(notes, null, 2)}</pre>
    </div>
  );
}
