import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const normalized = (status || '').toUpperCase();

  const configs = {
    VERIFIED: {
      label: 'Verified',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    ACTIVE: {
      label: 'Active',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: CheckCircle2,
    },
    PENDING: {
      label: 'Pending Review',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    REJECTED: {
      label: 'Action Required',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
    SUSPENDED: {
      label: 'Suspended',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: AlertCircle,
    },
    REVOKED: {
      label: 'Revoked',
      bg: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle,
    },
  };

  const config = configs[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 space-x-1.5',
    md: 'text-sm px-3 py-1.5 space-x-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
