const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5129";

export interface LoginResponseData {
  token: string;
  fullName?: string;
}

export async function login(email: string, password: string): Promise<LoginResponseData> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json?.message ?? `Login failed with status ${res.status}`;
    throw new Error(message);
  }

  if (!json.success) {
    throw new Error(json.message || "Login failed");
  }

  const token = json.data?.token;
  if (!token) {
    throw new Error("No token returned from server");
  }

  // Store token in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }

  return { token, fullName: json.data?.fullName };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}
