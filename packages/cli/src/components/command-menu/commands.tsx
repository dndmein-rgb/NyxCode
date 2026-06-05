import { SUPPORTED_CHAT_MODELS } from "@nyxcode/shared";
import {
  AgentsDialogContent,
  ModelsDialogContent,
  SessionsDialogContent,
  ThemeDialogContent,
} from "../dialogs";
import type { Command } from "./types";

import { performLogin } from "../../lib/oauth";
import { clearAuth } from "../../lib/auth";

import { openBillingPortal, openUpgradeCheckout } from "../../lib/upgrade";
import { apiClient } from "../../lib/api-client";

export const COMMANDS: Command[] = [
  {
    name: "new",
    description: "Start a new conversation",
    value: "/new",
    action: (ctx) => {
      ctx.navigate("/");
    },
  },
  {
    name: "agents",
    description: "Switch agents",
    value: "/agents",
    action: (ctx) => {
      ctx.dialog.open({
        title: "Select Agent",
        children: (
          <AgentsDialogContent
            currentMode={ctx.mode}
            onSelectMode={ctx.setMode}
          />
        ),
      });
    },
  },
  {
    name: "models",
    description: "Select AI model for generation",
    value: "/models",
    action: (ctx) => {
      ctx.dialog.open({
        title: "Select Model",
        children: (
          <ModelsDialogContent
            models={SUPPORTED_CHAT_MODELS.map((model) => model.id)}
            onSelectModel={ctx.setModel}
          />
        ),
      });
    },
  },
  {
    name: "sessions",
    description: "Browse past sessions",
    value: "/sessions",
    action: (ctx) => {
      ctx.dialog.open({
        title: "Sessions",
        children: <SessionsDialogContent />,
      });
    },
  },
  {
    name: "theme",
    description: "Change color theme",
    value: "/theme",
    action: (ctx) => {
      ctx.dialog.open({
        title: "Select Theme",
        children: <ThemeDialogContent />,
      });
    },
  },
  {
    name: "login",
    description: "Sign in with your browser",
    value: "/login",
    action: async (ctx) => {
      ctx.toast.show({ message: "Opening browser to sign in..." });

      try {
        await performLogin();
        ctx.toast.show({ variant: "success", message: "Signed in" });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Sign in failed or timed out";

        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "logout",
    description: "Sign out of your account",
    value: "/logout",
    action: (ctx) => {
      clearAuth();
      ctx.toast.show({ variant: "success", message: "Signed out" });
    },
  },
  {
    name: "credits",
    description: "Check your credit balance",
    value: "/credits",
    action: async (ctx) => {
      try {
        const res = await apiClient.billing.credits.$get();

        if (!res.ok) {
          try {
            const errorData = (await res.json()) as { error?: string };
            ctx.toast.show({
              variant: "error",
              message:
                errorData.error || `Failed to fetch credits (${res.status})`,
            });
          } catch {
            ctx.toast.show({
              variant: "error",
              message: `Failed to fetch credits (${res.status})`,
            });
          }
          return;
        }

        const data = (await res.json()) as { credits: number };
        ctx.toast.show({
          variant: "success",
          message: `Available credits: ${data.credits}`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to check credits";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "upgrade",
    description: "Buy more credits",
    value: "/upgrade",
    action: async (ctx) => {
      ctx.toast.show({ message: "Opening credits checkout..." });

      try {
        await openUpgradeCheckout();
        ctx.toast.show({
          variant: "success",
          message: "Checkout opened in browser",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to open checkout";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "usage",
    description: "Open billing portal in your browser",
    value: "/usage",
    action: async (ctx) => {
      ctx.toast.show({ message: "Opening billing portal..." });

      try {
        await openBillingPortal();
        ctx.toast.show({
          variant: "success",
          message: "Billing portal opened in browser",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to open billing portal";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "billing-debug",
    description: "Debug billing info from Polar",
    value: "/billing-debug",
    action: async (ctx) => {
      try {
        const res = await apiClient.billing.debug.$get();

        if (!res.ok) {
          try {
            const errorData = (await res.json()) as { error?: string };
            ctx.toast.show({
              variant: "error",
              message:
                errorData.error || `Failed to fetch debug info (${res.status})`,
            });
          } catch {
            ctx.toast.show({
              variant: "error",
              message: `Failed to fetch debug info (${res.status})`,
            });
          }
          return;
        }

        const data = (await res.json()) as {
          customerId: string;
          activeMeters: Array<{
            meterId: string;
            balance: number;
            type: string;
          }>;
          orders: Array<{
            id: string;
            status: string;
            createdAt: string;
          }>;
        };

        const metersInfo = data.activeMeters
          .map(
            (m) =>
              `  Meter: ${m.meterId}\n    Balance: ${m.balance}\n    Type: ${m.type}`,
          )
          .join("\n");

        const ordersInfo =
          data.orders.length > 0
            ? data.orders
                .map(
                  (o) =>
                    `  Order: ${o.id}\n    Status: ${o.status}\n    Date: ${o.createdAt}`,
                )
                .join("\n")
            : "  No orders found";

        const message = `Customer ID: ${data.customerId}\n\nMeters:\n${metersInfo}\n\nOrders:\n${ordersInfo}`;
        ctx.toast.show({
          variant: "success",
          message,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to fetch debug info";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "add-credits-test",
    description: "Add test credits (development only)",
    value: "/add-credits-test",
    action: async (ctx) => {
      try {
        const res = await apiClient.billing["add-credits"].$post({
          json: { credits: 1000 },
        });

        if (!res.ok) {
          try {
            const errorData = (await res.json()) as { error?: string };
            ctx.toast.show({
              variant: "error",
              message:
                errorData.error || `Failed to add credits (${res.status})`,
            });
          } catch {
            ctx.toast.show({
              variant: "error",
              message: `Failed to add credits (${res.status})`,
            });
          }
          return;
        }

        const data = (await res.json()) as {
          success: boolean;
          credits: number;
        };
        ctx.toast.show({
          variant: "success",
          message: `Added ${data.credits} test credits! Check with /credits`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to add test credits";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "exit",
    description: "Quit the application",
    value: "/exit",
    action: (ctx) => {
      ctx.exit();
    },
  },
];
