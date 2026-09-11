/**
 * Status Badge Component
 */

import { STATUS_LABELS } from '../../config/ui.config.js';
import { escapeHtml } from '../utils/dom.js';

export function renderStatusBadge(status) {
  const conf = STATUS_LABELS[status] || { label: status, color: 'blue' };
  
  const colorClassMap = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    sky: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  const dotColorMap = {
    blue: 'bg-sky-500',
    sky: 'bg-cyan-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    green: 'bg-green-500',
    rose: 'bg-rose-500',
    red: 'bg-red-500'
  };

  const badgeClass = colorClassMap[conf.color] || colorClassMap.blue;
  const dotClass = dotColorMap[conf.color] || dotColorMap.blue;

  return `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClass}">
      <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
      ${escapeHtml(conf.label)}
    </span>
  `;
}
