import nodemailer from 'nodemailer';
import { dbService } from './db.ts';
import { SUPPORT_EMAIL, PRODUCER_CREDIT } from '../src/lib/licenseConstants.ts';

export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'wspcelly@gmail.com';

export interface EmailDispatchResult {
  success: boolean;
  emailId: string;
  messageId?: string;
  error?: string;
  deliveryMode?: string;
  provider?: string;
}

export interface EmailConfigStatus {
  mode: 'resend_api' | 'sendgrid_api' | 'gmail_smtp' | 'custom_smtp' | 'simulation';
  providerName: string;
  isLive: boolean;
  fromAddress: string;
  adminRecipient: string;
  details: string;
}

export function getEmailConfigStatus(): EmailConfigStatus {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();

  if (resendApiKey) {
    return {
      mode: 'resend_api',
      providerName: 'Resend Transactional API (HTTPS port 443)',
      isLive: true,
      fromAddress: process.env.EMAIL_FROM || 'CELLY <onboarding@resend.dev>',
      adminRecipient: ADMIN_EMAIL,
      details: 'Active via HTTPS REST API. Outbound port restrictions bypassed.',
    };
  }

  if (sendgridApiKey) {
    return {
      mode: 'sendgrid_api',
      providerName: 'SendGrid v3 Mail API (HTTPS port 443)',
      isLive: true,
      fromAddress: process.env.EMAIL_FROM || `CELLY <${SUPPORT_EMAIL}>`,
      adminRecipient: ADMIN_EMAIL,
      details: 'Active via HTTPS REST API.',
    };
  }

  if (smtpUser && smtpPass && (smtpUser.includes('@gmail.com') || process.env.GMAIL_USER)) {
    return {
      mode: 'gmail_smtp',
      providerName: 'Google / Gmail SMTP (smtp.gmail.com:465)',
      isLive: true,
      fromAddress: process.env.EMAIL_FROM || `CELLY <${smtpUser}>`,
      adminRecipient: ADMIN_EMAIL,
      details: `Authenticating with Gmail account: ${smtpUser}`,
    };
  }

  if (smtpHost && smtpUser && smtpPass) {
    return {
      mode: 'custom_smtp',
      providerName: `Custom SMTP (${smtpHost})`,
      isLive: true,
      fromAddress: process.env.EMAIL_FROM || `CELLY <${SUPPORT_EMAIL}>`,
      adminRecipient: ADMIN_EMAIL,
      details: `Host: ${smtpHost}:${process.env.SMTP_PORT || '587'} (User: ${smtpUser})`,
    };
  }

  return {
    mode: 'simulation',
    providerName: 'In-App Sandbox Simulation',
    isLive: false,
    fromAddress: process.env.EMAIL_FROM || `CELLY Productions <${SUPPORT_EMAIL}>`,
    adminRecipient: ADMIN_EMAIL,
    details: 'No live email credentials configured. All order confirmations, mastering alerts, and download notifications are generated, rendered, and recorded in SQLite for review in Admin Studio.',
  };
}

/**
 * Base email dispatcher:
 * - Records email in SQLite `emails` table
 * - Dispatches through Resend (HTTPS 443), SendGrid (HTTPS 443), Gmail SMTP, or Custom SMTP
 * - If no provider configured, gracefully records in simulated mode with full preview
 * - Updates status to 'sent', 'simulated', or 'failed'
 * - Never crashes the backend server
 */
export async function sendEmail({
  to,
  recipientName,
  subject,
  html,
  text,
  orderId,
  customerId,
  emailType,
  attachments,
}: {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text: string;
  orderId?: string;
  customerId?: string;
  emailType: string;
  attachments?: any[];
}): Promise<EmailDispatchResult> {
  const cleanTo = to.trim();
  const cleanName = recipientName || cleanTo.split('@')[0];
  const refOrderId = orderId || 'GENERAL';
  const config = getEmailConfigStatus();

  // 1. Pre-record email in database
  const emailId = dbService.logEmail(
    refOrderId,
    cleanTo,
    cleanName,
    subject,
    html,
    text,
    customerId,
    attachments
  );

  const now = new Date().toISOString();

  // 2. DISPATCH THROUGH ACTIVE PROVIDER
  try {
    // -----------------------------------------------------------------------
    // A) RESEND REST API (HTTPS port 443 - most reliable in cloud containers)
    // -----------------------------------------------------------------------
    if (config.mode === 'resend_api') {
      const resendApiKey = process.env.RESEND_API_KEY!.trim();
      // If custom EMAIL_FROM isn't set, resend requires onboarding@resend.dev unless domain verified
      const resendFrom = process.env.EMAIL_FROM || 'CELLY <onboarding@resend.dev>';

      const payload: any = {
        from: resendFrom,
        to: [cleanTo],
        subject,
        html,
        text,
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content ? att.content.toString('base64') : undefined,
          path: att.path,
        }));
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        const errorMsg = resData.message || resData.name || `Resend HTTP error ${res.status}`;
        throw new Error(errorMsg);
      }

      const messageId = resData.id || `resend_${Date.now()}`;

      dbService.run(
        `UPDATE emails SET status = 'sent', sent_at = ?, delivery_mode = 'resend_api' WHERE id = ?`,
        [now, emailId]
      );

      console.log(`[EMAIL DISPATCHED via Resend API] To: ${cleanTo} | Subject: "${subject}" | MsgId: ${messageId}`);
      return {
        success: true,
        emailId,
        messageId,
        deliveryMode: 'resend_api',
        provider: 'Resend',
      };
    }

    // -----------------------------------------------------------------------
    // B) SENDGRID v3 REST API (HTTPS port 443)
    // -----------------------------------------------------------------------
    if (config.mode === 'sendgrid_api') {
      const sendgridApiKey = process.env.SENDGRID_API_KEY!.trim();
      const fromParts = (process.env.EMAIL_FROM || `CELLY <${SUPPORT_EMAIL}>`).match(/^(?:(.*?)<)?([^>]+)>?$/);
      const fromEmail = fromParts?.[2]?.trim() || SUPPORT_EMAIL;
      const fromName = fromParts?.[1]?.trim() || 'CELLY Productions';

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanTo, name: cleanName }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`SendGrid API error (${res.status}): ${errText}`);
      }

      const messageId = `sg_${Date.now()}`;
      dbService.run(
        `UPDATE emails SET status = 'sent', sent_at = ?, delivery_mode = 'sendgrid_api' WHERE id = ?`,
        [now, emailId]
      );

      console.log(`[EMAIL DISPATCHED via SendGrid] To: ${cleanTo} | Subject: "${subject}"`);
      return {
        success: true,
        emailId,
        messageId,
        deliveryMode: 'sendgrid_api',
        provider: 'SendGrid',
      };
    }

    // -----------------------------------------------------------------------
    // C) GMAIL / GOOGLE WORKSPACE SMTP or CUSTOM SMTP
    // -----------------------------------------------------------------------
    if (config.mode === 'gmail_smtp' || config.mode === 'custom_smtp') {
      const smtpHost = process.env.SMTP_HOST?.trim();
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim()!;
      const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim()!;

      const transportConfig: any =
        config.mode === 'gmail_smtp'
          ? {
              service: 'gmail',
              auth: { user: smtpUser, pass: smtpPass },
              connectionTimeout: 10000,
              greetingTimeout: 10000,
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass },
              connectionTimeout: 10000,
              greetingTimeout: 10000,
            };

      const mailer = nodemailer.createTransport(transportConfig);
      const info = await mailer.sendMail({
        from: config.fromAddress,
        to: cleanTo,
        subject,
        text,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          path: att.path,
          content: att.content,
        })),
      });

      const messageId = info.messageId || `smtp_${Date.now()}`;
      dbService.run(
        `UPDATE emails SET status = 'sent', sent_at = ?, delivery_mode = ? WHERE id = ?`,
        [now, config.mode, emailId]
      );

      console.log(`[EMAIL DISPATCHED via ${config.providerName}] To: ${cleanTo} | Subject: "${subject}"`);
      return {
        success: true,
        emailId,
        messageId,
        deliveryMode: config.mode,
        provider: config.providerName,
      };
    }

    // -----------------------------------------------------------------------
    // D) IN-APP SIMULATION MODE (Graceful fallback when no SMTP keys are set)
    // -----------------------------------------------------------------------
    const messageId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    dbService.run(
      `UPDATE emails SET status = 'simulated', sent_at = ?, delivery_mode = 'simulation', error_message = ? WHERE id = ?`,
      [
        now,
        'Simulation mode: No live email API key (RESEND_API_KEY) or SMTP credentials configured in environment.',
        emailId,
      ]
    );

    console.log(`[EMAIL SIMULATED (No Live SMTP)] Type: ${emailType} -> To: ${cleanTo} | Subject: "${subject}"`);
    return {
      success: true,
      emailId,
      messageId,
      deliveryMode: 'simulation',
      provider: 'In-App Sandbox Simulation',
    };
  } catch (err: any) {
    const errorMsg = err.message || 'Unknown email delivery failure';
    console.error(`[EMAIL FAILED] Provider: ${config.providerName} -> To: ${cleanTo} | Error: ${errorMsg}`);

    dbService.run(
      `UPDATE emails SET status = 'failed', error_message = ?, delivery_mode = ? WHERE id = ?`,
      [errorMsg, config.mode, emailId]
    );

    return {
      success: false,
      emailId,
      error: errorMsg,
      deliveryMode: config.mode,
      provider: config.providerName,
    };
  }
}

/**
 * Test dispatcher function to verify live inbox delivery
 */
export async function testEmailDispatch(targetRecipient?: string): Promise<{
  success: boolean;
  config: EmailConfigStatus;
  result: EmailDispatchResult;
}> {
  const recipient = targetRecipient?.trim() || ADMIN_EMAIL;
  const config = getEmailConfigStatus();

  const testSubject = `[TEST DISPATCH] CELLY Studio Email Pipeline Test - ${new Date().toLocaleTimeString()}`;
  const testHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #f59e0b; margin-top: 0;">CELLY Email Dispatch Test</h2>
      <p style="font-size: 14px; color: #e4e4e7;">This is an automated test confirming that your outbound email pipeline is functioning properly.</p>
      <div style="background: #18181b; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 16px 0; color: #a1a1aa;">
        <p style="margin: 3px 0;"><strong style="color: #fff;">Delivery Provider:</strong> ${config.providerName}</p>
        <p style="margin: 3px 0;"><strong style="color: #fff;">Live Delivery Active:</strong> ${config.isLive ? 'YES' : 'NO (Sandbox Simulation)'}</p>
        <p style="margin: 3px 0;"><strong style="color: #fff;">Sender Address:</strong> ${config.fromAddress}</p>
        <p style="margin: 3px 0;"><strong style="color: #fff;">Recipient Address:</strong> ${recipient}</p>
        <p style="margin: 3px 0;"><strong style="color: #fff;">Timestamp:</strong> ${new Date().toISOString()}</p>
      </div>
      <p style="font-size: 12px; color: #71717a;">CELLY Productions • wspcelly@gmail.com</p>
    </div>
  `;
  const testText = `CELLY Email Dispatch Test\nProvider: ${config.providerName}\nLive: ${config.isLive ? 'YES' : 'NO'}\nTimestamp: ${new Date().toISOString()}`;

  const result = await sendEmail({
    to: recipient,
    recipientName: 'CELLY Admin Test',
    subject: testSubject,
    html: testHtml,
    text: testText,
    orderId: 'TEST-PIPELINE',
    emailType: 'test_dispatch',
  });

  return {
    success: result.success,
    config,
    result,
  };
}

// -------------------------------------------------------------------------
// 1. ADMIN NOTIFICATION: MASTERING ORDER
// Immediately notified to wspcelly@gmail.com when a master is ordered/sent
// -------------------------------------------------------------------------
export async function sendAdminMasteringOrderNotification(data: {
  orderId: string;
  masteringId: string;
  customerName: string;
  customerEmail: string;
  songTitle: string;
  serviceTier?: string;
  notes?: string;
  instructions?: string;
  mixFileName?: string;
  mixFileType?: string;
  mixFileSize?: number;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  adminOrderUrl?: string;
  adminFileDownloadUrl?: string;
}): Promise<EmailDispatchResult> {
  const subject = `[NEW MASTERING ORDER] #${data.masteringId} - "${data.songTitle}" by ${data.customerName}`;
  const fileSizeFormatted = data.mixFileSize
    ? `${(data.mixFileSize / (1024 * 1024)).toFixed(1)} MB`
    : 'Pending upload';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; max-width: 650px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CELLY ADMIN STUDIO</h1>
        <p style="color: #f59e0b; font-size: 13px; margin: 4px 0 0 0; font-weight: 700;">NEW MASTERING PROJECT RECEIVED</p>
      </div>

      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">"${data.songTitle}"</h2>
        <p style="color: #fde68a; font-size: 13px; margin: 0;">Ordered by <strong>${data.customerName}</strong> (<a href="mailto:${data.customerEmail}" style="color: #ffffff;">${data.customerEmail}</a>)</p>
      </div>

      <div style="background: #18181b; padding: 18px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
        <h3 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order &amp; File Details</h3>
        <table style="width: 100%; border-collapse: collapse; color: #d4d4d8;">
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa; width: 140px;"><strong>Mastering ID:</strong></td>
            <td style="padding: 6px 0; font-family: monospace; color: #fbbf24; font-weight: bold;">${data.masteringId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>Main Order ID:</strong></td>
            <td style="padding: 6px 0; font-family: monospace;">${data.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>Service Tier:</strong></td>
            <td style="padding: 6px 0;">${data.serviceTier || 'Stereo Audio Mastering'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>Price / Paid:</strong></td>
            <td style="padding: 6px 0; color: #34d399; font-weight: bold;">$${data.amount.toFixed(2)} USD (${data.paymentStatus.toUpperCase()})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>Date &amp; Time:</strong></td>
            <td style="padding: 6px 0;">${new Date(data.createdAt).toLocaleString('en-US', { timeZoneName: 'short' })}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>Mix File Name:</strong></td>
            <td style="padding: 6px 0; font-family: monospace; color: #ffffff;">${data.mixFileName || 'Pending / Uploaded'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;"><strong>File Size:</strong></td>
            <td style="padding: 6px 0;">${fileSizeFormatted}</td>
          </tr>
        </table>
      </div>

      <div style="background: #18181b; padding: 18px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
        <h3 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Client Song Notes &amp; Instructions</h3>
        <div style="background: #09090b; padding: 14px; border-radius: 6px; border-left: 3px solid #f59e0b; color: #f4f4f5; font-size: 13px; white-space: pre-wrap;">${data.notes || data.instructions || 'No special notes provided. Standard analog EQ, stereo width & streaming loudness polish requested.'}</div>
      </div>

      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${data.adminOrderUrl || '/admin'}" style="display: inline-block; background: #f59e0b; color: #000000; font-weight: 800; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
          Open Admin Mastering Queue
        </a>
      </div>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #71717a; text-align: center;">
        CELLY Automated Notification System • Delivered directly to ${ADMIN_EMAIL}
      </div>
    </div>
  `;

  const text = `
CELLY ADMIN STUDIO - NEW MASTERING ORDER
--------------------------------------------------
Song Title: ${data.songTitle}
Mastering ID: ${data.masteringId}
Order ID: ${data.orderId}
Customer: ${data.customerName} (${data.customerEmail})
Amount: $${data.amount.toFixed(2)} USD [${data.paymentStatus}]
Date: ${data.createdAt}

Mix File: ${data.mixFileName || 'stereo_mix.wav'} (${fileSizeFormatted})

SONG NOTES & INSTRUCTIONS:
${data.notes || data.instructions || 'None provided'}

Open Admin Studio to access customer files and begin mastering:
${data.adminOrderUrl || '/admin'}
  `.trim();

  return sendEmail({
    to: ADMIN_EMAIL,
    recipientName: 'CELLY Producer',
    subject,
    html,
    text,
    orderId: data.orderId,
    emailType: 'admin_mastering_order',
  });
}

// -------------------------------------------------------------------------
// 2. ADMIN NOTIFICATION: CONTACT FORM
// Immediately notified to wspcelly@gmail.com when contact form is submitted
// -------------------------------------------------------------------------
export async function sendAdminContactNotification(data: {
  submissionId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}): Promise<EmailDispatchResult> {
  const emailSubject = `[CELLY CONTACT INQUIRY] "${data.subject}" from ${data.name}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">CELLY CONTACT INQUIRY</h1>
        <p style="color: #f59e0b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Immediate Website Submission Notification</p>
      </div>

      <div style="background: #18181b; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
        <p style="margin: 4px 0; color: #d4d4d8;"><strong>Sender:</strong> <span style="color: #ffffff; font-weight: bold;">${data.name}</span></p>
        <p style="margin: 4px 0; color: #d4d4d8;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #f59e0b;">${data.email}</a></p>
        <p style="margin: 4px 0; color: #d4d4d8;"><strong>Subject:</strong> ${data.subject}</p>
        <p style="margin: 4px 0; color: #d4d4d8;"><strong>Date:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
        <p style="margin: 4px 0; color: #71717a; font-size: 11px;"><strong>Submission ID:</strong> ${data.submissionId}</p>
      </div>

      <div style="background: #18181b; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase;">Message Content</h3>
        <div style="color: #f4f4f5; font-size: 14px; line-height: 1.6; white-space: pre-wrap; background: #09090b; padding: 14px; border-radius: 6px;">${data.message}</div>
      </div>

      <div style="text-align: center; margin: 20px 0 10px 0;">
        <a href="mailto:${data.email}?subject=Re:%20${encodeURIComponent(data.subject)}" style="display: inline-block; background: #f59e0b; color: #000; font-weight: bold; font-size: 13px; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
          Reply to ${data.name}
        </a>
      </div>

      <div style="border-top: 1px solid #27272a; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #71717a; text-align: center;">
        CELLY Productions • Sent to ${ADMIN_EMAIL}
      </div>
    </div>
  `;

  const text = `
CELLY CONTACT INQUIRY
--------------------------------------------------
Sender: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Date: ${data.createdAt}
ID: ${data.submissionId}

MESSAGE:
${data.message}

Reply directly to: ${data.email}
  `.trim();

  return sendEmail({
    to: ADMIN_EMAIL,
    recipientName: 'CELLY Producer',
    subject: emailSubject,
    html,
    text,
    orderId: data.submissionId,
    emailType: 'admin_contact',
  });
}

// -------------------------------------------------------------------------
// 3. ADMIN NOTIFICATION: BEAT ORDER / PAYMENT ALERT
// -------------------------------------------------------------------------
export async function sendAdminOrderAlert(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  items: Array<{ title: string; tier: string; price: number }>;
  createdAt: string;
}): Promise<EmailDispatchResult> {
  const subject = `[NEW BEAT SALE] Order #${data.orderId} - $${data.totalAmount.toFixed(2)} from ${data.customerName}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <h2 style="color: #34d399; margin: 0 0 4px 0;">New Beat Sale Completed!</h2>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px 0;">Order #${data.orderId} • $${data.totalAmount.toFixed(2)} USD</p>
      
      <div style="background: #18181b; padding: 14px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
        <p style="margin: 3px 0;"><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p style="margin: 3px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
      </div>

      <div style="background: #18181b; padding: 14px; border-radius: 8px; font-size: 13px;">
        <h4 style="color: #f59e0b; margin: 0 0 8px 0;">Items Purchased:</h4>
        ${data.items.map(i => `<p style="margin: 4px 0; color: #d4d4d8;">• <strong>${i.title}</strong> (${i.tier.toUpperCase()}) — $${i.price.toFixed(2)}</p>`).join('')}
      </div>
    </div>
  `;

  const text = `NEW BEAT SALE: #${data.orderId} - $${data.totalAmount.toFixed(2)} from ${data.customerName} (${data.customerEmail})\nItems:\n${data.items.map(i => `- ${i.title} (${i.tier}): $${i.price}`).join('\n')}`;

  return sendEmail({
    to: ADMIN_EMAIL,
    recipientName: 'CELLY Producer',
    subject,
    html,
    text,
    orderId: data.orderId,
    emailType: 'admin_order_alert',
  });
}

// -------------------------------------------------------------------------
// 4. CUSTOMER NOTIFICATION: BEAT PURCHASE & LICENSES
// -------------------------------------------------------------------------
export async function sendCustomerBeatConfirmation(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerId?: string;
  totalAmount: number;
  licenses: Array<{
    beatTitle: string;
    licenseTier: string;
    licenseId: string;
    pdfFilename?: string;
  }>;
}): Promise<EmailDispatchResult> {
  const subject = `Your Beat Files & Official License Agreement - CELLY [#${data.orderId}]`;

  const beatItemsHtml = data.licenses
    .map(
      (lic) => `
      <div style="border: 1px solid #27272a; background: #09090b; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <h3 style="color: #f59e0b; margin: 0 0 6px 0; font-size: 16px;">${lic.beatTitle}</h3>
        <p style="color: #d4d4d8; font-size: 13px; margin: 4px 0;"><strong>License Tier:</strong> ${lic.licenseTier.toUpperCase()} License</p>
        <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0;"><strong>License Certificate:</strong> ${lic.licenseId}</p>
        <div style="margin-top: 12px;">
          <a href="/api/customer/licenses/${lic.licenseId}/pdf" style="display: inline-block; background: #f59e0b; color: #000; font-weight: bold; font-size: 12px; padding: 8px 14px; text-decoration: none; border-radius: 4px; margin-right: 8px;">
            Download Signed Agreement (PDF)
          </a>
          <a href="/api/downloads/file/${lic.licenseId}/mp3" style="display: inline-block; background: #27272a; color: #fff; font-size: 12px; padding: 8px 14px; text-decoration: none; border-radius: 4px;">
            Download Untagged Audio
          </a>
        </div>
      </div>
    `
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">CELLY PRODUCTIONS</h1>
        <p style="color: #f59e0b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Official Beat License &amp; Audio Deliverables</p>
      </div>

      <p style="font-size: 15px; color: #e4e4e7;">Hello <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">Thank you for your business! Your order has been processed and your legally valid PDF license contract has been executed.</p>

      <div style="background: #18181b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #f59e0b;">${data.orderId}</span></p>
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Total Paid:</strong> $${data.totalAmount.toFixed(2)} USD</p>
      </div>

      <h2 style="color: #fff; font-size: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px; margin-top: 24px;">Your Beats &amp; Downloads</h2>
      ${beatItemsHtml}

      <div style="margin-top: 20px; padding: 14px; border: 1px solid #27272a; background: #09090b; border-radius: 8px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
        <strong style="color: #ffffff;">Mandatory Producer Credit:</strong> You must credit <em>"${PRODUCER_CREDIT}"</em> in all release titles, metadata, YouTube descriptions, and streaming credits.
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; font-size: 12px; color: #71717a;">
        Questions? Contact us anytime at <a href="mailto:${SUPPORT_EMAIL}" style="color: #f59e0b;">${SUPPORT_EMAIL}</a>
      </div>
    </div>
  `;

  const text = `
CELLY PRODUCTIONS - BEAT PURCHASE CONFIRMATION
Order ID: ${data.orderId}
Customer: ${data.customerName}
Total: $${data.totalAmount.toFixed(2)} USD

YOUR DOWNLOADS:
${data.licenses.map(l => `- ${l.beatTitle} (${l.licenseTier.toUpperCase()})\n  License ID: ${l.licenseId}`).join('\n')}

Credit Requirement: "${PRODUCER_CREDIT}"
Support: ${SUPPORT_EMAIL}
  `.trim();

  return sendEmail({
    to: data.customerEmail,
    recipientName: data.customerName,
    subject,
    html,
    text,
    orderId: data.orderId,
    customerId: data.customerId,
    emailType: 'customer_beat_confirmation',
  });
}

// -------------------------------------------------------------------------
// 5. CUSTOMER NOTIFICATION: MASTERING ORDER CONFIRMATION
// -------------------------------------------------------------------------
export async function sendCustomerMasteringConfirmation(data: {
  orderId: string;
  masteringId: string;
  customerName: string;
  customerEmail: string;
  songTitle: string;
  amount: number;
  expectedTurnaround?: string;
}): Promise<EmailDispatchResult> {
  const subject = `Mastering Order Received: "${data.songTitle}" [#${data.masteringId}] - CELLY`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">CELLY MASTERING</h1>
        <p style="color: #f59e0b; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Project Confirmation &amp; Next Steps</p>
      </div>

      <p style="font-size: 15px; color: #e4e4e7;">Hello <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">We have successfully received your mastering order for <strong>"${data.songTitle}"</strong>. CELLY has been directly alerted with your song notes and audio file details.</p>

      <div style="background: #18181b; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 13px; line-height: 1.6;">
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Mastering ID:</strong> <span style="font-family: monospace; color: #f59e0b;">${data.masteringId}</span></p>
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Song / Project:</strong> ${data.songTitle}</p>
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Turnaround Time:</strong> ${data.expectedTurnaround || '24 to 48 hours'}</p>
        <p style="margin: 3px 0; color: #d4d4d8;"><strong>Total Paid:</strong> $${data.amount.toFixed(2)} USD</p>
      </div>

      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid #f59e0b; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
        <strong>Important Service Note:</strong> Mixing is strictly not offered. CELLY specializes exclusively in stereo mastering — applying analog coloration, EQ clarity, stereo imaging, and commercial loudness optimization to your completed stereo bounce.
      </div>

      <p style="font-size: 13px; color: #d4d4d8; line-height: 1.5;">You will receive an automatic email notification the moment your finalized master (24-bit WAV &amp; 320kbps MP3) is delivered.</p>

      <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; font-size: 12px; color: #71717a;">
        CELLY Mastering • Contact: <a href="mailto:${SUPPORT_EMAIL}" style="color: #f59e0b;">${SUPPORT_EMAIL}</a>
      </div>
    </div>
  `;

  const text = `
CELLY MASTERING ORDER CONFIRMATION
Mastering ID: ${data.masteringId}
Song Title: ${data.songTitle}
Customer: ${data.customerName}
Turnaround: ${data.expectedTurnaround || '24 to 48 hours'}
Support: ${SUPPORT_EMAIL}
  `.trim();

  return sendEmail({
    to: data.customerEmail,
    recipientName: data.customerName,
    subject,
    html,
    text,
    orderId: data.orderId,
    emailType: 'customer_mastering_confirmation',
  });
}

// -------------------------------------------------------------------------
// 6. CUSTOMER NOTIFICATION: MASTER COMPLETED & DELIVERED
// -------------------------------------------------------------------------
export async function sendCustomerMasterCompleted(data: {
  orderId: string;
  masteringId: string;
  customerName: string;
  customerEmail: string;
  songTitle: string;
  deliveryNotes?: string;
  downloadUrl?: string;
  downloadWavUrl?: string;
  downloadMp3Url?: string;
}): Promise<EmailDispatchResult> {
  const subject = `Your Master Is Ready! "${data.songTitle}" [#${data.masteringId}] - CELLY`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #f4f4f5; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #34d399; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">CELLY MASTERING</h1>
        <p style="color: #34d399; font-size: 13px; margin: 4px 0 0 0; font-weight: 600;">Your Final Master Has Been Delivered</p>
      </div>

      <p style="font-size: 15px; color: #e4e4e7;">Hello <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">Great news! Audio mastering processing for <strong>"${data.songTitle}"</strong> is complete. Your master has been optimized for commercial streaming platforms (Spotify, Apple Music, YouTube) and is ready for download.</p>

      ${
        data.deliveryNotes
          ? `
        <div style="background: #18181b; padding: 14px; border-radius: 8px; margin: 18px 0; font-size: 13px;">
          <h4 style="color: #f59e0b; margin: 0 0 6px 0;">Engineer Delivery Notes:</h4>
          <p style="color: #d4d4d8; margin: 0; white-space: pre-wrap;">${data.deliveryNotes}</p>
        </div>
      `
          : ''
      }

      <div style="text-align: center; margin: 26px 0; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        ${
          data.downloadWavUrl
            ? `<a href="${data.downloadWavUrl}" style="display: inline-block; background: #34d399; color: #000; font-weight: bold; font-size: 14px; padding: 12px 20px; text-decoration: none; border-radius: 6px; margin: 6px;">
                Download Master (24-bit WAV)
              </a>`
            : ''
        }
        ${
          data.downloadMp3Url
            ? `<a href="${data.downloadMp3Url}" style="display: inline-block; background: #27272a; color: #fff; font-weight: bold; font-size: 14px; padding: 12px 20px; text-decoration: none; border-radius: 6px; margin: 6px; border: 1px solid #3f3f46;">
                Download Master (320kbps MP3)
              </a>`
            : ''
        }
        ${
          !data.downloadWavUrl && !data.downloadMp3Url
            ? `<a href="${data.downloadUrl || `/customer-dashboard`}" style="display: inline-block; background: #34d399; color: #000; font-weight: bold; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Download Mastered Audio Files
              </a>`
            : ''
        }
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 16px; text-align: center; font-size: 12px; color: #71717a;">
        CELLY Mastering • Contact: <a href="mailto:${SUPPORT_EMAIL}" style="color: #f59e0b;">${SUPPORT_EMAIL}</a>
      </div>
    </div>
  `;

  const text = `
CELLY MASTERING COMPLETED
Song Title: ${data.songTitle}
Mastering ID: ${data.masteringId}
Customer: ${data.customerName}

Engineer Notes: ${data.deliveryNotes || 'Completed'}
Download in your customer dashboard.
Support: ${SUPPORT_EMAIL}
  `.trim();

  return sendEmail({
    to: data.customerEmail,
    recipientName: data.customerName,
    subject,
    html,
    text,
    orderId: data.orderId,
    emailType: 'customer_master_completed',
  });
}
