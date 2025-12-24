import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg text-white`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/80 text-sm mb-1">{title}</p>
        <p className="text-4xl font-bold mb-2">{value}</p>
        {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
      </div>
      <Icon className="text-5xl text-white/30" />
    </div>
  </div>
);
