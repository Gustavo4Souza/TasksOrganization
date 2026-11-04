export interface MobileSession {
  token: string;
  user: { id: string; name: string; email: string };
}

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}

export const mobileApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001").replace(/\/$/, "");

export async function authenticate(mode: "login" | "register", input: AuthInput, fetcher: typeof fetch = fetch): Promise<MobileSession> {
  const response = await fetcher(`${mobileApiUrl}/auth/${mode}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json() as Partial<MobileSession> & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Não foi possível autenticar (${response.status}).`);
  if (!payload.token || !payload.user?.id) throw new Error("A API retornou uma sessão inválida.");
  return payload as MobileSession;
}

export async function revokeSession(token: string, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher(`${mobileApiUrl}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
  if (!response.ok && response.status !== 401) throw new Error("Não foi possível encerrar a sessão na API.");
}
