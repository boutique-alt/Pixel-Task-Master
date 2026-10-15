"use client";

import { Search, Filter } from "lucide-react";
import ClientTable from "@/components/ClientTable";
import { useCRM } from "@/context/CRMContext";

export default function MemberUsersPage() {
  const { clients, updateStatus, updateComment } = useCRM();

  // For demo, we simulate being logged in as "Rahim"
  const CURRENT_MEMBER = "Rahim";
  
  // Filter only clients assigned to this member
  const tasks = clients.filter(c => c.member === CURRENT_MEMBER);

  const handleStatusChange = (id: string, newStatus: "Pending" | "In Progress" | "Can't Do" | "Done") => {
    updateStatus(id, newStatus, CURRENT_MEMBER);
  };

  const handleCommentChange = (id: string, newComment: string) => {
    updateComment(id, newComment, CURRENT_MEMBER);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Clients</h1>
          <p className="text-sm text-gray-500">Manage and update your assigned leads</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search my clients..."
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium transition-colors">
            <Filter size={16} /> Filter Status
          </button>
        </div>
        
        <ClientTable 
          clients={tasks} 
          isAdmin={false} 
          onStatusChange={handleStatusChange}
          onCommentChange={handleCommentChange}
        />
      </div>
    </div>
  );
}
