async function test() {
  try {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@college.edu", password: "password123" })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;

    const vendorId = "cmopvdspp0005ikw0sm83py9u";

    const patchRes = await fetch(`http://localhost:3000/api/vendors/${vendorId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "verify" })
    });

    const patchData = await patchRes.text();
    console.log("Verify Status:", patchRes.status);
    console.log("Verify Response:", patchData);

  } catch (e) {
    console.error(e);
  }
}

test();
