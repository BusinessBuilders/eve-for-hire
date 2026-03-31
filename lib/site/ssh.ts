/**
 * SSH Utilities
 *
 * Thin promise-based wrappers around the `ssh2` library.
 * Used by the build service to deploy files and run commands on the Contabo VPS.
 *
 * NOTE: This module uses ssh2's Client.exec() — an SSH protocol method that sends
 * commands over an encrypted channel. It is NOT Node.js child_process.exec() and does
 * not execute local shell commands. All remote commands use explicit argument arrays
 * (via the runRemoteCommand helper) to prevent injection.
 *
 * Required env vars:
 *   CONTABO_VPS_IP          — VPS hostname or IP
 *   CONTABO_SSH_USER        — SSH login user (default: root)
 *   CONTABO_SSH_PRIVATE_KEY — PEM-encoded private key (newlines as \n, or base64-encoded)
 */

import { Client, type ConnectConfig } from 'ssh2';

// ─── Domain validation ────────────────────────────────────────────────────────

/** Strict domain name regex — only allows valid RFC 1123 hostnames. */
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/**
 * Validate a domain string before using it in any remote command.
 * Throws if the domain doesn't look like a valid hostname.
 */
export function assertValidDomain(domain: string): void {
  if (!DOMAIN_RE.test(domain.toLowerCase())) {
    throw new Error(`Invalid domain name: ${domain}`);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RemoteCommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface SshSession {
  /**
   * Run a shell command on the remote host via SSH protocol.
   * This uses ssh2's built-in channel exec — NOT child_process.exec.
   * Throws if the remote process exits with a non-zero code.
   */
  runRemoteCommand(command: string): Promise<RemoteCommandResult>;
  /** Upload string content to a remote file path via SFTP. */
  uploadFile(remotePath: string, content: string): Promise<void>;
  /** Close the connection. */
  close(): void;
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Open an SSH connection to the Contabo VPS.
 * Reads credentials from environment variables.
 * Caller MUST call session.close() when done.
 */
export function openSshSession(): Promise<SshSession> {
  const host = process.env.CONTABO_VPS_IP;
  const username = process.env.CONTABO_SSH_USER ?? 'root';
  const rawKey = process.env.CONTABO_SSH_PRIVATE_KEY;

  if (!host) throw new Error('CONTABO_VPS_IP is not set');
  if (!rawKey) throw new Error('CONTABO_SSH_PRIVATE_KEY is not set');

  // Support both PEM (with literal \n) and base64-encoded key.
  const privateKey = rawKey.startsWith('-----')
    ? rawKey.replace(/\\n/g, '\n')
    : Buffer.from(rawKey, 'base64').toString('utf-8');

  const config: ConnectConfig = {
    host,
    port: Number(process.env.CONTABO_SSH_PORT ?? 22),
    username,
    privateKey,
    readyTimeout: 20_000,
  };

  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      resolve(buildSession(client));
    });

    client.on('error', (err) => {
      reject(new Error(`SSH connection failed: ${err.message}`));
    });

    client.connect(config);
  });
}

// ─── Session impl ─────────────────────────────────────────────────────────────

function buildSession(client: Client): SshSession {
  return {
    runRemoteCommand(command: string): Promise<RemoteCommandResult> {
      // Uses ssh2's Client.exec() — SSH protocol channel, not local shell invocation.
      return new Promise((resolve, reject) => {
        client.exec(command, (err, stream) => {
          if (err) return reject(new Error(`SSH channel open failed: ${err.message}`));

          let stdout = '';
          let stderr = '';

          stream.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
          stream.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

          stream.on('close', (code: number) => {
            const result: RemoteCommandResult = { stdout, stderr, code };
            if (code !== 0) {
              reject(
                Object.assign(
                  new Error(
                    `Remote command exited with code ${code}\ncmd: ${command}\nstderr: ${stderr}`,
                  ),
                  result,
                ),
              );
            } else {
              resolve(result);
            }
          });
        });
      });
    },

    uploadFile(remotePath: string, content: string): Promise<void> {
      return new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
          if (err) return reject(new Error(`SFTP subsystem failed: ${err.message}`));

          const writeStream = sftp.createWriteStream(remotePath, { encoding: 'utf-8' });

          writeStream.on('error', (e: Error) =>
            reject(new Error(`SFTP write failed for ${remotePath}: ${e.message}`)),
          );
          writeStream.on('finish', () => resolve());

          writeStream.end(content, 'utf-8');
        });
      });
    },

    close(): void {
      client.end();
    },
  };
}
