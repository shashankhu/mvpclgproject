import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Test Page</h1>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p>No todos found. Make sure you have a 'todos' table with a 'name' column in your new Supabase project.</p>
      )}
    </div>
  );
}
