'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { Order, OrderState, AuditEntry } from '@/lib/order/types';
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

  return (
    <div className={styles.swarmVisualizer}>
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
