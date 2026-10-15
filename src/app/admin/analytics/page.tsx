import { BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueData = [45, 52, 38, 65, 48, 75, 82, 60, 95, 88, 0, 0]; // Percentages for the bar chart

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-sm text-gray-500">Comprehensive revenue and performance metrics</p>
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button className="px-4 py-1.5 bg-[#1B64B1] text-white text-sm font-medium rounded-md shadow-sm">This Year</button>
          <button className="px-4 py-1.5 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-md">Last Year</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart (Mocked with CSS) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Monthly collection statistics</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">₹1.8M</h2>
          </div>
          
          <div className="h-64 flex items-end gap-2 sm:gap-4">
            {revenueData.map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex items-end justify-center h-full bg-gray-50 rounded-t-md overflow-hidden">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-500 ${height > 0 ? 'bg-[#1B64B1] group-hover:bg-[#15549A]' : 'bg-transparent'}`}
                    style={{ height: `${height}%` }}
                  ></div>
                  {height > 0 && (
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-gray-700">
                      {height}k
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-400">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Key Metrics</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <TrendingUp size={16} className="text-blue-600 sm:w-[18px] sm:h-[18px]" />
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate">Conversion Rate</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-700">68.5%</p>
              <p className="text-[10px] sm:text-xs text-blue-500 mt-0.5 sm:mt-1">+2.4% from last month</p>
            </div>
            
            <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <PieChart size={16} className="text-emerald-600 sm:w-[18px] sm:h-[18px]" />
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate">Deals Won</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700">842</p>
              <p className="text-[10px] sm:text-xs text-emerald-500 mt-0.5 sm:mt-1">Out of 1,245 total</p>
            </div>
            
            <div className="col-span-2 lg:col-span-1 p-3 sm:p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <Calendar size={16} className="text-orange-600 sm:w-[18px] sm:h-[18px]" />
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate">Avg. Cycle Time</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-700">14 Days</p>
              <p className="text-[10px] sm:text-xs text-orange-500 mt-0.5 sm:mt-1">From pending to won</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
