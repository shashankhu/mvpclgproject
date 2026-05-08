import jwt from 'jsonwebtoken';

async function test() {
  try {
    const token = jwt.sign(
      { userId: "1", role: "super_admin" },
      process.env.JWT_SECRET || "diganta_super_secret_jwt_key_2026_do_not_share",
      { expiresIn: "1h" }
    );

    console.log("Fetching /api/vendors...");
    const res = await fetch("http://localhost:3000/api/vendors", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const text = await res.text();
    console.log("Status:", res.status);
    try {
      console.log(JSON.parse(text));
    } catch {
      console.log(text);
    }
  } catch (err) {
    console.error(err);
  }
}

test();
