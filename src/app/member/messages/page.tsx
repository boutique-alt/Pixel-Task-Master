import { Search, Send, MoreVertical, Phone, Video } from "lucide-react";

export default function MemberMessagesPage() {
  const contacts = [
    { name: "Admin User", role: "Manager", lastMsg: "Hi Rahim, did you follow up...", time: "10:30 AM", unread: 1 },
    { name: "Ahmed Sharif", role: "Client", lastMsg: "Can we schedule a call?", time: "Yesterday", unread: 0 },
    { name: "Hamid Electronics", role: "Client", lastMsg: "We decided to go with brand X.", time: "Monday", unread: 0 },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <p className="text-sm text-gray-500">Communicate with your manager and clients</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden">
        {/* Sidebar Contacts */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="pl-9 pr-4 py-2 w-full bg-gray-100 border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact, i) => (
              <div key={i} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-3 ${i === 0 ? 'bg-blue-50/50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{contact.name}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate">{contact.lastMsg}</p>
                    {contact.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold ml-2">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-2 flex flex-col bg-white w-2/3">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">A</div>
              <div>
                <h3 className="font-bold text-gray-800">Admin User</h3>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Phone size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Video size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical size={18} /></button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/30 flex flex-col gap-4">
            <div className="flex flex-col items-center my-4">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Today</span>
            </div>
            
            <div className="self-start max-w-[70%] bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm">
              <p className="text-sm">Hi Rahim, did you follow up with Fatima Traders?</p>
              <span className="text-[10px] text-gray-400 mt-1 block">10:30 AM</span>
            </div>
            
            <div className="self-end max-w-[70%] bg-[#1B64B1] text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm">Yes, I just finished the call.</p>
              <span className="text-[10px] text-blue-200 mt-1 block text-right">10:41 AM</span>
            </div>
            
            <div className="self-end max-w-[70%] bg-[#1B64B1] text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm">I've updated the Fatima Traders deal. They agreed to the ₹120k target and transferred the payment.</p>
              <span className="text-[10px] text-blue-200 mt-1 block text-right">10:42 AM</span>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1 pl-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-transparent text-sm focus:outline-none py-2"
              />
              <button className="w-10 h-10 rounded-full bg-[#1B64B1] hover:bg-[#15549A] text-white flex items-center justify-center transition-colors shadow-sm shrink-0">
                <Send size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
