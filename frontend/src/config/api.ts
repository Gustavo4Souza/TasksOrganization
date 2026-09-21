const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "A variável NEXT_API_URL não está configurada."
  );
}

export const BACKEND_API = API_URL.replace(/\/+$/, "");