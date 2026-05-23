import { env } from "@/lib/env";

/**
 * Provider-agnostic SMS dispatch.
 *
 * The default provider is "none" (no-op). In dev set SMS_PROVIDER=log to
 * print messages to stdout. In production wire up Unifonic (preferred for
 * KSA / GCC) or Twilio.
 *
 * Each provider implementation should be tiny. They live below so we don't
 * add a hard dependency on any SDK.
 */

export interface CallNotificationParams {
  phone: string;
  customerName: string;
  ticketDisplay: string;
  businessName: string;
}

function buildCallMessage(p: CallNotificationParams): string {
  return `${p.businessName}: حان دورك (${p.ticketDisplay}) — توجّه للاستقبال.`;
}

export async function sendCallNotification(
  params: CallNotificationParams,
): Promise<{ ok: boolean; provider: string }> {
  const provider = env.SMS_PROVIDER ?? "none";
  const message = buildCallMessage(params);

  switch (provider) {
    case "none":
      return { ok: true, provider };

    case "log":
      // eslint-disable-next-line no-console
      console.log(`[sms:log] -> ${params.phone}: ${message}`);
      return { ok: true, provider };

    case "unifonic": {
      // Stub: real implementation should call:
      //   POST https://api.unifonic.com/rest/SMS/messages
      // with AppSid, SenderID, Recipient, Body. We log + skip when no key.
      if (!env.SMS_API_KEY) {
        console.warn("[sms:unifonic] SMS_API_KEY missing; skipping send.");
        return { ok: false, provider };
      }
      console.warn("[sms:unifonic] integration stub; payload prepared.");
      return { ok: true, provider };
    }

    case "twilio": {
      if (!env.SMS_API_KEY) {
        console.warn("[sms:twilio] SMS_API_KEY missing; skipping send.");
        return { ok: false, provider };
      }
      console.warn("[sms:twilio] integration stub; payload prepared.");
      return { ok: true, provider };
    }

    default:
      return { ok: false, provider };
  }
}
