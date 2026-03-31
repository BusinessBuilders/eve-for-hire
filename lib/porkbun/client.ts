/**
 * Porkbun API v3 client
 *
 * All Porkbun v3 endpoints are POST requests. Auth credentials are injected
 * into every request body — there are no Bearer tokens or query-string keys.
 *
 * Required env vars:
 *   PORKBUN_API_KEY    — starts with "pk1_"
 *   PORKBUN_SECRET_KEY — starts with "sk1_"
 *
 * Docs: https://porkbun.com/api/json/v3/documentation
 */

const BASE_URL = 'https://api.porkbun.com/api/json/v3';

// ─── Response shapes ────────────────────────────────────────────────────────

export interface PorkbunDomainAvailability {
  domain: string;
  available: boolean;
  /** Price per year in USD (string, e.g. "10.44") — present when available */
  price?: string;
}

export interface PorkbunDnsRecord {
  id: string;
  /** "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" */
  type: string;
  /** Subdomain — empty string means root (@) */
  host: string;
  /** Record content: IP for A, hostname for CNAME, etc. */
  content: string;
  ttl: string;
  prio?: string;
}

export interface CreateDnsRecordInput {
  type: string;
  host: string;
  content: string;
  ttl?: string;
  prio?: string;
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class PorkbunApiError extends Error {
  constructor(
    message: string,
    public readonly status: string,
  ) {
    super(message);
    this.name = 'PorkbunApiError';
  }
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class PorkbunClient {
  constructor(
    private readonly apiKey: string,
    private readonly secretApiKey: string,
  ) {}

  private auth() {
    return { apikey: this.apiKey, secretapikey: this.secretApiKey };
  }

  private async post<T extends Record<string, unknown>>(
    path: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.auth(), ...body }),
    });

    if (!res.ok) {
      throw new PorkbunApiError(
        `HTTP ${res.status} from Porkbun at ${path}`,
        `HTTP_${res.status}`,
      );
    }

    const data = (await res.json()) as { status: string; message?: string } & Record<string, unknown>;

    if (data.status !== 'SUCCESS') {
      throw new PorkbunApiError(
        data.message ?? `Porkbun API error at ${path}`,
        data.status,
      );
    }

    return data as T;
  }

  /** Verify credentials. Returns your server's IP address on success. */
  async ping(): Promise<{ yourIp: string }> {
    const data = await this.post<{ yourIp: string }>('/ping');
    return { yourIp: data.yourIp };
  }

  /**
   * Check availability of one or more domains.
   * Returns availability + price for each requested domain.
   *
   * Endpoint: POST /domain/check
   * Body: { domains: string[] }
   */
  async checkDomains(domains: string[]): Promise<PorkbunDomainAvailability[]> {
    const data = await this.post<{
      domains: Array<{ domain: string; avail: string; price?: string }>;
    }>('/domain/check', { domains });

    return (data.domains ?? []).map((d) => ({
      domain: d.domain,
      available: d.avail === 'yes',
      price: d.price,
    }));
  }

  /**
   * Register a domain. Returns the Porkbun transaction/domain id.
   *
   * Endpoint: POST /domain/create
   * Note: Will throw PorkbunApiError if domain is unavailable or already registered.
   */
  async registerDomain(domain: string, years = 1): Promise<{ id: string }> {
    const data = await this.post<{ id: string }>('/domain/create', { domain, years });
    return { id: String(data.id) };
  }

  /** List DNS records for a domain. */
  async listDnsRecords(domain: string): Promise<PorkbunDnsRecord[]> {
    const data = await this.post<{ records: PorkbunDnsRecord[] }>(
      `/dns/retrieve/${domain}`,
    );
    return data.records ?? [];
  }

  /** Create a DNS record. Returns the new record's id. */
  async createDnsRecord(domain: string, record: CreateDnsRecordInput): Promise<{ id: string }> {
    const data = await this.post<{ id: string }>(`/dns/create/${domain}`, {
      type: record.type,
      host: record.host,
      content: record.content,
      ttl: record.ttl ?? '600',
      ...(record.prio !== undefined ? { prio: record.prio } : {}),
    });
    return { id: String(data.id) };
  }

  /** Delete a DNS record by id. */
  async deleteDnsRecord(domain: string, recordId: string): Promise<void> {
    await this.post(`/dns/delete/${domain}/${recordId}`);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create a PorkbunClient from env vars. Throws if credentials are missing. */
export function createPorkbunClient(): PorkbunClient {
  const apiKey = process.env.PORKBUN_API_KEY;
  const secretKey = process.env.PORKBUN_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      'Porkbun credentials not configured. Set PORKBUN_API_KEY and PORKBUN_SECRET_KEY.',
    );
  }

  return new PorkbunClient(apiKey, secretKey);
}
