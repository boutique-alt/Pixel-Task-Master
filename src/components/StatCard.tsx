import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  trend?: string;
  isPositive?: boolean;
  theme?: "blue" | "green" | "orange" | "purple";
  progress?: number;
  compact?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  isPositive = true,
  theme = "blue",
  progress = 75,
  compact = false
}: StatCardProps) {
  
  const themeStyles = {
    blue: { bg: "bg-[#1677FF]/10", text: "text-[#1677FF]", bar: "bg-[#1677FF]", sparkline: "#1677FF" },
    green: { bg: "bg-[#10B981]/10", text: "text-[#10B981]", bar: "bg-[#10B981]", sparkline: "#10B981" },
    orange: { bg: "bg-[#FF6B00]/10", text: "text-[#FF6B00]", bar: "bg-[#FF6B00]", sparkline: "#FF6B00" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", bar: "bg-purple-600", sparkline: "#9333ea" }
  };

  const activeTheme = themeStyles[theme];

  return (
    <div className={`bg-white rounded-[16px] sm:rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#E3EAF5] flex flex-col h-full relative transition-all min-w-0 ${compact ? 'p-3 sm:p-4' : 'p-3 sm:p-4.5 lg:p-6'}`}>
      <div className={`flex justify-between items-start ${compact ? 'mb-2 sm:mb-4' : 'mb-2 sm:mb-3 lg:mb-5'}`}>
        <div className={`w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] rounded-[8px] sm:rounded-[10px] ${activeTheme.bg} flex items-center justify-center ${activeTheme.text} [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 shrink-0`}>
          {icon}
        </div>
        <button className="text-[#64748B] hover:text-[#10254F] transition-colors p-1 -mr-1 hidden sm:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </button>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-[#10254F] truncate">{title}</p>
        <h3 className="text-[18px] xs:text-[20px] sm:text-[26px] lg:text-[34px] font-extrabold text-[#10254F] mt-0.5 sm:mt-1 leading-tight tracking-tight truncate">{value}</h3>
        
        <div className="flex justify-between items-center mt-1 sm:mt-2.5">
          <p className="text-[9px] sm:text-[11px] text-[#64748B] font-medium truncate pr-1 max-w-[100%]">{subtitle}</p>
        </div>
      </div>

      <div className={`pt-1 w-full border-t border-[#E3EAF5]/50 ${compact ? 'mt-2 sm:mt-4' : 'mt-2 sm:mt-3 lg:mt-5'}`}>
        <div className="flex justify-between items-center w-full mb-1 mt-1 sm:mt-1.5">
          <span className="text-[8px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Progress</span>
          <span className="text-[9px] sm:text-[11px] font-extrabold text-[#10254F]">{progress}%</span>
        </div>
        <div className="w-full bg-[#F3F6FB] h-[4px] sm:h-[5px] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${activeTheme.bar}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
