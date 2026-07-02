'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Order } from '@/lib/order/types';
import styles from './SwarmVisualizer.module.css';

interface SwarmVisualizerProps {
  orderId: string;
  initialOrder: Order;
}

interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  label: string;
  isActive: (order: Order) => boolean;
  isDone: (order: Order) => boolean;
}

interface DnsCheckStatus {
  checking: boolean;
  lastCheckedAt: Date | null;
  reason: string | null;
}

/**
 * Existing-domain orders hold in 'domain_purchasing' until the customer's
 * A record points at our VPS. Nothing used to call /api/domains/verify, so
 * these orders looked stuck forever. This panel shows the DNS instructions
 * and polls verify with backoff (30s → 60s → 120s) until DNS propagates,
 * at which point the order advances to 'building' on its own.
 */
function DnsWaitPanel({ orderId, domain }: { orderId: string; domain: string }) {
  const [instructions, setInstructions] = useState<string[] | null>(null);
  const [aRecord, setARecord] = useState<string | null>(null);
  const [status, setStatus] = useState<DnsCheckStatus>({
    checking: false,
    lastCheckedAt: null,
    reason: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/domains/connect?domain=${encodeURIComponent(domain)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) {
          setInstructions(Array.isArray(d.steps) ? d.steps : null);
          setARecord(typeof d.aRecord === 'string' ? d.aRecord : null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [domain]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;

    const check = async () => {
      if (cancelled) return;
      setStatus((s) => ({ ...s, checking: true }));
      try {
        const res = await fetch('/api/domains/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setStatus({
          checking: false,
          lastCheckedAt: new Date(),
          reason: data.verified ? null : (data.reason ?? data.error ?? null),
        });
        if (data.verified) return; // order advanced — the order poller picks it up
      } catch {
        if (cancelled) return;
        setStatus((s) => ({ ...s, checking: false, lastCheckedAt: new Date() }));
      }
      attempt += 1;
      // Backoff: 30s for the first 4 checks, then 60s, then settle at 120s.
      const delay = attempt < 4 ? 30_000 : attempt < 8 ? 60_000 : 120_000;
      timer = setTimeout(check, delay);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  return (
    <div className={styles.dnsWaitPanel}>
      <div className={styles.dnsWaitTitle}>Action needed: point {domain} at your new site</div>
      <p className={styles.dnsWaitBody}>
        You chose to use a domain you already own, so the last step is yours: update its DNS A
        record{aRecord ? ` to ${aRecord}` : ''} at your registrar. The build continues
        automatically the moment we see the change.
      </p>
      {instructions && (
        <ol className={styles.dnsSteps}>
          {instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      <div className={styles.dnsCheckStatus}>
        {status.checking
          ? 'Checking DNS now…'
          : status.lastCheckedAt
            ? `Waiting on DNS propagation — last checked ${status.lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Rechecking automatically.`
            : 'Starting DNS checks…'}
        {!status.checking && status.reason ? ` (${status.reason})` : ''}
      </div>
    </div>
  );
}

export default function SwarmVisualizer({ orderId, initialOrder }: SwarmVisualizerProps) {
  const [order, setOrder] = useState<Order>(initialOrder);

  // Poll for updates every 3 seconds while order is in-flight
  useEffect(() => {
    const isTerminal = order.state === 'live' || order.state === 'cancelled';
    if (isTerminal) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const updatedOrder = await res.json();
          setOrder(updatedOrder);
          if (updatedOrder.state === 'live' || updatedOrder.state === 'cancelled') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to poll order status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, order.state]);

  const agents: AgentConfig[] = useMemo(() => [
    {
      id: 'domain',
      name: 'Domain Agent',
      icon: '🌐',
      label: 'Securing Domain',
      isActive: (o) => o.state === 'domain_purchasing',
      isDone: (o) => !['new', 'qualifying', 'payment_pending', 'paid', 'domain_purchasing'].includes(o.state) || o.state === 'live'
    },
    {
      id: 'content',
      name: 'Content Agent',
      icon: '✍️',
      label: 'Generating Copy',
      isActive: (o) => o.state === 'building' && !o.auditTrail.some(e => e.note?.toLowerCase().includes('design')),
      isDone: (o) => o.auditTrail.some(e => e.note?.toLowerCase().includes('design')) || ['deploying', 'live'].includes(o.state)
    },
    {
      id: 'design',
      name: 'Design Agent',
      icon: '🎨',
      label: 'Refining Visuals',
      isActive: (o) => o.state === 'building' && o.auditTrail.some(e => e.note?.toLowerCase().includes('design')) && !o.auditTrail.some(e => e.note?.toLowerCase().includes('deploy')),
      isDone: (o) => o.auditTrail.some(e => e.note?.toLowerCase().includes('deploy')) || ['deploying', 'live'].includes(o.state)
    },
    {
      id: 'deploy',
      name: 'Deploy Agent',
      icon: '🚀',
      label: 'Pushing to VPS',
      isActive: (o) => o.state === 'building' && o.auditTrail.some(e => e.note?.toLowerCase().includes('deploy')),
      isDone: (o) => o.state === 'deploying' || o.state === 'live'
    },
    {
      id: 'qa',
      name: 'QA Agent',
      icon: '✅',
      label: 'Final Verification',
      isActive: (o) => o.state === 'deploying',
      isDone: (o) => o.state === 'live'
    }
  ], []);

  const latestAudit = useMemo(() => {
    if (!order.auditTrail || order.auditTrail.length === 0) return null;
    return [...order.auditTrail].reverse().find(e => e.note);
  }, [order.auditTrail]);

  const recentActivity = useMemo(() => {
    if (!order.auditTrail) return [];
    return [...order.auditTrail].reverse().filter(e => e.note).slice(0, 3);
  }, [order.auditTrail]);

  const awaitingCustomerDns =
    order.state === 'domain_purchasing' &&
    order.requirements?.domainPath === 'existing' &&
    !!order.requirements?.desiredDomain;

  return (
    <div className={styles.swarmVisualizer}>
      {awaitingCustomerDns && (
        <DnsWaitPanel orderId={orderId} domain={order.requirements!.desiredDomain} />
      )}
      {order.state === 'domain_failed' && (
        <div className={styles.dnsWaitPanel}>
          <div className={styles.dnsWaitTitle}>Domain step hit a problem</div>
          <p className={styles.dnsWaitBody}>
            Your payment is safe and your order is not lost — registering the domain failed and
            Eve&apos;s team has been notified. We&apos;ll retry or reach out at your order email
            shortly.
          </p>
        </div>
      )}
      <div className={styles.orchestratorNode}>
        <div className={styles.nodeIcon}>🤖</div>
        <div className={styles.nodeLabel}>Eve (Orchestrator)</div>
      </div>

      <div className={styles.agentSwarm}>
        {agents.map((agent) => {
          const isActive = agent.isActive(order);
          const isDone = agent.isDone(order) && !isActive;
          const isPending = !isActive && !isDone;

          return (
            <div 
              key={agent.id} 
              className={`${styles.agentNode} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''} ${isPending ? styles.pending : ''}`}
            >
              <div className={styles.agentIcon}>{agent.icon}</div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{agent.name}</div>
                <div className={styles.agentStatus}>
                  {isDone ? 'Complete' : isActive ? 'Processing...' : 'Awaiting Task'}
                </div>
              </div>
              {isActive && <div className={styles.pulseRing} />}
            </div>
          );
        })}
      </div>

      <div className={styles.statusFeed}>
        <div className={styles.feedTitle}>Swarm Intelligence Feed</div>
        <div className={styles.feedContent}>
          {latestAudit ? (
            <div className={styles.latestNote}>
              {latestAudit.note}
            </div>
          ) : (
            <div className={styles.latestNote}>Waiting for swarm activity...</div>
          )}
          
          <div className={styles.activityLog}>
            {recentActivity.map((entry, i) => (
              <div key={i} className={styles.logEntry}>
                <span>{entry.event.replace(/_/g, ' ')}</span>
                <span>{new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
