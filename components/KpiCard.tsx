'use client';

import type { KpiCardProps } from '@/types';

export default function KpiCard({ title, value, range, sparkline }: KpiCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold">{value}</p>
        {range && <span className="text-xs text-gray-500">{range}</span>}
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 h-12 flex items-end gap-1">
          {sparkline.map((value, index) => {
            const max = Math.max(...sparkline);
            const height = max > 0 ? (value / max) * 100 : 0;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t"
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

