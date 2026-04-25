interface DelegateChatIntentInput {
  sessionId?: string;
  userMessage?: string;
  summary?: string;
  title?: string;
  description?: string;
  assigneeAgentId?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

interface DelegateChatIntentResult {
  ok: boolean;
  issueId?: string;
  identifier?: string;
  error?: string;
}

function sanitizeTitle(raw: string): string {
  const normalized = raw.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 100) return normalized;
  return `${normalized.slice(0, 97).trimEnd()}...`;
}

function buildTitle(input: DelegateChatIntentInput): string {
  if (input.title?.trim()) return sanitizeTitle(input.title);
  if (input.summary?.trim()) return sanitizeTitle(`[CHAT TASK] ${input.summary}`);
  if (input.userMessage?.trim()) return sanitizeTitle(`[CHAT TASK] ${input.userMessage}`);
  return '[CHAT TASK] Follow-up requested by customer';
}

function buildDescription(input: DelegateChatIntentInput): string {
  if (input.description?.trim()) return input.description.trim();

  const lines = [
    '## Chat Delegation Request',
    '',
    input.summary ? `**Summary:** ${input.summary}` : null,
    input.sessionId ? `**Session:** \`${input.sessionId}\`` : null,
    input.userMessage ? `**Customer message:** ${input.userMessage}` : null,
    '',
    '### Context',
    'Created automatically from Eve chat actionable intent routing.',
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Create a Paperclip issue from a chat actionable intent payload.
 */
export async function delegateChatIntent(
  input: DelegateChatIntentInput,
): Promise<DelegateChatIntentResult> {
  const apiUrl = process.env.PAPERCLIP_API_URL;
  const agentToken = process.env.PAPERCLIP_AGENT_TOKEN || process.env.PAPERCLIP_API_KEY;
  const companyId = process.env.PAPERCLIP_COMPANY_ID;

  if (!apiUrl || !agentToken || !companyId) {
    return { ok: false, error: 'Paperclip integration not configured' };
  }

  const payload = {
    title: buildTitle(input),
    description: buildDescription(input),
    priority: input.priority ?? 'medium',
    assigneeAgentId: input.assigneeAgentId,
    projectId: process.env.PAPERCLIP_PROJECT_ID || undefined,
    metadata: input.metadata,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${agentToken}`,
    };
    if (process.env.PAPERCLIP_RUN_ID) {
      headers['X-Paperclip-Run-Id'] = process.env.PAPERCLIP_RUN_ID;
    }

    const res = await fetch(`${apiUrl}/api/companies/${companyId}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Paperclip API error ${res.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { id?: string; identifier?: string };
    return {
      ok: true,
      issueId: data.id,
      identifier: data.identifier,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
