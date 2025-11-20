import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'transactions', label: 'Transações', icon: 'fa-list-ul' },
    { id: 'cards', label: 'Cartões', icon: 'fa-credit-card' },
    { id: 'goals', label: 'Metas', icon: 'fa-bullseye' },
    { id: 'reports', label: 'Relatórios', icon: 'fa-chart-line' },
    { id: 'ai', label: 'Assistente AI', icon: 'fa-robot' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <img src="/goat-icon.png" alt="Goat" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Goat Finance
            </h1>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center mr-3 ${activeTab === item.id ? 'text-primary' : 'text-slate-400'}`}></i>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  US
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-800">Usuário</p>
                  <p className="text-xs text-slate-500">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;