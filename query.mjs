import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:shashank123@localhost:5432/diganta_mvp"
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, email, role FROM "User"');
  console.log(res.rows);
  await client.end();
}

run();
