import { orderStore } from '../order/store';

/**
 * Triggers a Paperclip swarm build by creating a [BUILD] issue.
 * 
 * Required env vars:
 * - PAPERCLIP_API_URL: Public URL of the Paperclip API (e.g. via Tailscale Funnel)
 * - PAPERCLIP_AGENT_TOKEN: Auth token for the triggering agent
 * - PAPERCLIP_COMPANY_ID: The company ID where the issue should be created
 */
export async function triggerPaperclipBuild(orderId: string): Promise<{ ok: boolean; issueId?: string; error?: string }> {
  const order = await orderStore.findById(orderId);
  if (!order) return { ok: false, error: 'Order not found' };

  const apiUrl = process.env.PAPERCLIP_API_URL;
  const agentToken = process.env.PAPERCLIP_AGENT_TOKEN;
  const companyId = process.env.PAPERCLIP_COMPANY_ID;

  if (!apiUrl || !agentToken || !companyId) {
    console.warn('[paperclip-trigger] Missing required env vars for Paperclip integration');
    return { ok: false, error: 'Paperclip integration not configured' };
  }

  const domain = order.domain?.domain || order.requirements?.desiredDomain || 'unknown-domain';
  
  const payload = {
    title: `[BUILD] ${domain} — ${order.identifier}`,
    description: `## Website Build Request\n\n**Order ID:** \`${order.id}\`\n**Identifier:** \`${order.identifier}\`\n**Domain:** \`${domain}\`\n\n### Requirements\n\`\`\`json\n${JSON.stringify(order.requirements, null, 2)}\n\`\`\`\n\n### Instructions\n1. Use the \`website-build-swarm\` skill to coordinate the build.\n2. Once the site is live and QA passed, call \`POST /api/orders/${order.id}/build-result\` with the site URL.`,
    priority: 'high',
    projectId: process.env.PAPERCLIP_PROJECT_ID || undefined,
  };

  try {
    const res = await fetch(`${apiUrl}/api/companies/${companyId}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[paperclip-trigger] Failed to create Paperclip issue: ${res.status} ${errorText}`);
      return { ok: false, error: `Paperclip API error: ${res.status}` };
    }

    const data = await res.json() as any;
    console.log(`[paperclip-trigger] Created Paperclip build issue: ${data.identifier}`);
    return { ok: true, issueId: data.id };
  } catch (err: any) {
    console.error('[paperclip-trigger] Error calling Paperclip API:', err.message);
    return { ok: false, error: err.message };
  }
}
