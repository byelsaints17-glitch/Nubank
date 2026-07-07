import React from 'react';

interface PhoneShellProps {
  children: React.ReactNode;
}

export default function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="w-full bg-neutral-100 rounded-3xl border border-neutral-200/80 shadow-lg flex flex-col overflow-hidden select-none min-h-[720px] transition-all duration-300">
      {/* Beautiful Web Application Header */}
      <div className="bg-[#830AD1] px-6 py-3.5 flex items-center justify-between text-white text-xs font-semibold select-none shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="tracking-wide uppercase font-bold text-[10px] text-purple-100">Aplicativo Oficial NuConta</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] opacity-80">
          <span>SESSÃO PROTEGIDA</span>
          <span className="px-1.5 py-0.5 bg-white/10 rounded">SSL 256-BIT</span>
        </div>
      </div>

      {/* Dynamic App Content */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative no-scrollbar bg-neutral-50">
        {children}
      </div>
    </div>
  );
}
