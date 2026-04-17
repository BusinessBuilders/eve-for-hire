'use client';

import React, { useEffect, useState } from 'react';
import type { Order, OrderState } from '@/lib/order/types';
import styles from './SwarmVisualizer.module.css';

interface SwarmVisualizerProps {
  orderId: string;
  initialOrder: Order;
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

  const agents: { state: OrderState; agent: string; icon: string; label: string }[] = [
    { state: 'paid', agent: 'Orchestrator', icon: '🤖', label: 'Payment Confirmed' },
    { state: 'domain_purchasing', agent: 'Domain Agent', icon: '🌐', label: 'Securing Domain' },
    { state: 'building', agent: 'Content Agent', icon: '✍️', label: 'Generating Assets' },
    { state: 'deploying', agent: 'Deploy Agent', icon: '🚀', label: 'Pushing to Production' },
    { state: 'live', agent: 'QA Agent', icon: '✅', label: 'Final Verification' },
  ];

  const getAgentStatus = (agentState: OrderState) => {
    const orderStateIndex = agents.findIndex(a => a.state === order.state);
    const agentStateIndex = agents.findIndex(a => a.state === agentState);

    if (orderStateIndex > agentStateIndex || order.state === 'live') return 'done';
    if (orderStateIndex === agentStateIndex) return 'active';
    return 'pending';
  };

  return (
    <div className={styles.swarmVisualizer}>
      <div className={styles.orchestratorNode}>
        <div className={styles.nodeIcon}>🤖</div>
        <div className={styles.nodeLabel}>Eve (Orchestrator)</div>
      </div>

      <div className={styles.agentSwarm}>
        {agents.slice(1).map((agent) => {
          const status = getAgentStatus(agent.state);
          const isActive = status === 'active';
          const isDone = status === 'done';
          const isPending = status === 'pending';

          return (
            <div 
              key={agent.state} 
              className={`${styles.agentNode} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''} ${isPending ? styles.pending : ''}`}
            >
              <div className={styles.agentIcon}>{agent.icon}</div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{agent.agent}</div>
                <div className={styles.agentStatus}>
                  {isDone ? 'Complete' : isActive ? 'Processing...' : 'Awaiting Task'}
                </div>
              </div>
              {isActive && <div className={styles.pulseRing} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
