import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  const { data: todos, error } = await supabase.from('todos').select();

  if (error) {
    return <div style={{ padding: '2rem' }}>Error loading todos: {error.message}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Test Page</h1>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p>No todos found. Make sure you have a 'todos' table in your Supabase project.</p>
      )}
    </div>
  );
}
