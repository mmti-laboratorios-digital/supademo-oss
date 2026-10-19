import { Resend } from "resend";
import { env } from "./env";

let cached: Resend | null = null;

function getClient(): Resend {
  if (cached) return cached;
  const apiKey = env().RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  cached = new Resend(apiKey);
  return cached;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ id: string }> {
  const client = getClient();
  const e = env();
  const { data, error } = await client.emails.send({
    from: e.EMAIL_FROM,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });
  if (error || !data) {
    throw new Error(`Resend send failed: ${error?.message ?? "unknown"}`);
  }
  return { id: data.id };
}
