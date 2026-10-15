import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and system configurations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Profile Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" defaultValue="admin@company.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" defaultValue="+1 (555) 000-0000" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input type="text" defaultValue="Administrator" disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 mt-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700">Email alerts for new deals won</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700">Daily performance summary</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
