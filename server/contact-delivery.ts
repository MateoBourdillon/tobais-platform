// Contact mail uses HTTPS so it also works on hosts without outbound SMTP.
export async function deliverContactEmail(
  mail: { to: string; subject: string; html: string },
  fetcher: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!env.SENDGRID_API_KEY) {
    console.error('Contact email: SENDGRID_API_KEY is not configured');
    return false;
  }
  try {
    const response = await fetcher('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: mail.to }] }],
        from: { email: env.MAIL_FROM || 'no-reply@tobais.com', name: 'TOBAIS' },
        subject: mail.subject,
        content: [{ type: 'text/html', value: mail.html }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status !== 202) {
      console.error(`Contact email: provider rejected request (${response.status})`);
      return false;
    }
    return true;
  } catch {
    console.error('Contact email: provider unavailable or request timed out');
    return false;
  }
}
