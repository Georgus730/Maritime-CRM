import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, locale = 'ru-RU') {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date, locale = 'ru-RU') {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString(locale);
}

export function daysUntil(date) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = d - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status) {
  const colors = {
    available: 'status-available',
    on_voyage: 'status-on-voyage',
    not_available: 'status-not-available',
    open: 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50',
    in_progress: 'bg-amber-950/30 text-amber-400 border border-amber-900/50',
    closed: 'bg-slate-800/50 text-slate-400 border border-slate-700',
    at_sea: 'bg-sky-950/30 text-sky-400 border border-sky-900/50',
    preparation: 'bg-amber-950/30 text-amber-400 border border-amber-900/50',
    flight: 'bg-sky-950/30 text-sky-400 border border-sky-900/50',
    on_board: 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50',
    completed: 'bg-slate-800/50 text-slate-400 border border-slate-700',
  };
  return colors[status] || 'bg-slate-800/50 text-slate-400 border border-slate-700';
}

export function getVesselTypeLabel(type, language = 'ru') {
  const labels = {
    ru: {
      tanker: 'Танкер',
      bulk_carrier: 'Балкер',
      container: 'Контейнеровоз',
      passenger: 'Пассажирское',
      general_cargo: 'Сухогруз',
    },
    en: {
      tanker: 'Tanker',
      bulk_carrier: 'Bulk Carrier',
      container: 'Container',
      passenger: 'Passenger',
      general_cargo: 'General Cargo',
    }
  };
  return labels[language]?.[type] || type;
}

export function getRatingStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

