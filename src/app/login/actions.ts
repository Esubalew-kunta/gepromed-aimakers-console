"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticate,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const from = String(formData.get("from") || "/dashboard");

  const user = authenticate(email, password);
  if (!user) {
    return { error: "Invalid email or password. Try the demo credentials shown below." };
  }

  const token = createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const dest = from.startsWith("/") && !from.startsWith("/login") ? from : "/dashboard";
  redirect(dest);
}
