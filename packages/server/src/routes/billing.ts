import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import {
  createCheckoutUrl,
  createCustomerPortalUrl,
  getAvailableCreditsBalance,
  getCustomerDebugInfo,
  addCreditsManual,
} from "../lib/polar";

const app = new Hono<AuthenticatedEnv>()
  .get("/credits", async (c) => {
    try {
      const userId = c.get("userId");
      console.log(`[/billing/credits] Fetching balance for user: ${userId}`);
      const balance = await getAvailableCreditsBalance(userId);
      console.log(`[/billing/credits] User ${userId} has ${balance} credits`);

      return c.json({
        credits: balance,
        customerId: userId,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to fetch credits balance";
      console.error(`[/billing/credits] Error: ${message}`, error);
      return c.json({ error: message }, 503);
    }
  })
  .get("/debug", async (c) => {
    try {
      const userId = c.get("userId");
      console.log(`[/billing/debug] Fetching debug info for user: ${userId}`);
      const debugInfo = await getCustomerDebugInfo(userId);
      console.log(`[/billing/debug] Debug info:`, debugInfo);

      return c.json(debugInfo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch debug info";
      console.error(`[/billing/debug] Error: ${message}`, error);
      return c.json({ error: message }, 503);
    }
  })
  .post("/checkout", async (c) => {
    const userId = c.get("userId");

    return c.json({
      url: await createCheckoutUrl({
        customerExternalId: userId,
        requestUrl: c.req.url,
      }),
    });
  })
  .post("/portal", async (c) => {
    const userId = c.get("userId");

    return c.json({
      url: await createCustomerPortalUrl({
        customerExternalId: userId,
        requestUrl: c.req.url,
      }),
    });
  })
  .get("/success", (c) =>
    c.text("Done. You can close this tab and return to Nyxcode."),
  )
  .post("/add-credits", async (c) => {
    try {
      const userId = c.get("userId");
      const body = (await c.req.json()) as { credits?: number };
      const credits = body.credits || 1000;

      if (credits <= 0) {
        return c.json({ error: "Credits must be positive" }, 400);
      }

      console.log(
        `[/billing/add-credits] Adding ${credits} credits for user: ${userId}`,
      );
      const result = await addCreditsManual({
        externalCustomerId: userId,
        credits,
      });
      console.log(`[/billing/add-credits] Success:`, result);

      return c.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add credits";
      console.error(`[/billing/add-credits] Error: ${message}`, error);
      return c.json({ error: message }, 503);
    }
  });

export default app;
