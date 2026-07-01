const API_URL = "http://127.0.0.1:8000";

export async function loginUser(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return await response.json();
}