/**
 * Transactional mail from the OperStack mailbox over Google Workspace SMTP.
 * Env: SMTP_USER (info@oper-stack.com), SMTP_PASS (an app password), LICENCE_FROM (display name and
 * address), LICENCE_NOTIFY_EMAIL (copy of every licence email, accounts@ by default).
 */
import nodemailer from 'nodemailer';

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

export async function sendTransactionalMail(msg: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!user || !pass) throw new Error('SMTP_USER or SMTP_PASS is not set');
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  const cc = env('LICENCE_NOTIFY_EMAIL', 'accounts@oper-stack.com');
  await transport.sendMail({
    from: env('LICENCE_FROM', `OperStack <${user}>`),
    to: msg.to,
    cc: cc && cc !== msg.to ? cc : undefined,
    replyTo: 'support@oper-stack.com',
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
}
