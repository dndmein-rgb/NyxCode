import { hc } from "hono/client";
import type { AppType } from "@nyxcode/server";

const baseUrl = process.env.API_URL ?? "http://localhost:3000";

export const apiClient = hc<AppType>(baseUrl);
