import { APIRequestContext, expect } from "@playwright/test";

export const FRONT = process.env.FRONT_URL ?? "http://localhost:3000";
export const KONG = process.env.KONG_URL ?? "http://localhost:8000";

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Token de usuário comum para as chamadas de API/BFF. */
export async function getToken(
  request: APIRequestContext,
  username = "teste",
  password = "teste123",
): Promise<string> {
  const response = await request.post(`${KONG}/realms/raiji/protocol/openid-connect/token`, {
    form: {
      grant_type: "password",
      client_id: "raiji-api",
      username,
      password,
    },
  });

  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).access_token as string;
}
