import { Role } from '@prisma/client';
import type { OrderStatus } from '../modules/order/order.schema.js';

type TransitionRule = {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: Role[];
  requiresNote?: boolean;
};

// Define all allowed status transitions with role-based guards
export const ORDER_TRANSITIONS: TransitionRule[] = [
  // Draft can go to pending or be cancelled
  { from: 'draft', to: 'pending', allowedRoles: ['ADMIN', 'COMPANY_MANAGER'] },
  { from: 'draft', to: 'cancelled', allowedRoles: ['ADMIN', 'COMPANY_MANAGER'] },

  // Pending can be approved, rejected (back to draft), or cancelled
  { from: 'pending', to: 'approved', allowedRoles: ['ADMIN'] },
  { from: 'pending', to: 'draft', allowedRoles: ['ADMIN'], requiresNote: true },
  { from: 'pending', to: 'cancelled', allowedRoles: ['ADMIN'] },

  // Approved can go to production or be cancelled
  { from: 'approved', to: 'in_production', allowedRoles: ['ADMIN'] },
  { from: 'approved', to: 'cancelled', allowedRoles: ['ADMIN'], requiresNote: true },

  // In production can be shipped or cancelled (with note)
  { from: 'in_production', to: 'shipped', allowedRoles: ['ADMIN'] },
  { from: 'in_production', to: 'cancelled', allowedRoles: ['ADMIN'], requiresNote: true },

  // Shipped can be delivered or returned to in_production (with note)
  { from: 'shipped', to: 'delivered', allowedRoles: ['ADMIN', 'COMPANY_MANAGER'] },
  { from: 'shipped', to: 'in_production', allowedRoles: ['ADMIN'], requiresNote: true },

  // Delivered is terminal, but can be reopened by admin with note
  { from: 'delivered', to: 'in_production', allowedRoles: ['ADMIN'], requiresNote: true },

  // Cancelled is terminal, but can be reopened by admin with note
  { from: 'cancelled', to: 'draft', allowedRoles: ['ADMIN'], requiresNote: true },
];

export type TransitionValidation = {
  allowed: boolean;
  requiresNote: boolean;
  message?: string;
};

export function validateStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  userRole: Role
): TransitionValidation {
  if (fromStatus === toStatus) {
    return { allowed: true, requiresNote: false };
  }

  const transition = ORDER_TRANSITIONS.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return {
      allowed: false,
      requiresNote: false,
      message: `Transition from '${fromStatus}' to '${toStatus}' is not allowed`,
    };
  }

  if (!transition.allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      requiresNote: false,
      message: `Role '${userRole}' is not authorized for this transition`,
    };
  }

  return {
    allowed: true,
    requiresNote: transition.requiresNote || false,
  };
}

export function getAvailableTransitions(
  currentStatus: OrderStatus,
  userRole: Role
): { status: OrderStatus; requiresNote: boolean }[] {
  return ORDER_TRANSITIONS
    .filter((t) => t.from === currentStatus && t.allowedRoles.includes(userRole))
    .map((t) => ({ status: t.to, requiresNote: t.requiresNote || false }));
}

// Human-readable status labels
export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  approved: 'Approved',
  in_production: 'In Production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
