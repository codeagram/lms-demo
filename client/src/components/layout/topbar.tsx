import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pageConfig = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your loan portfolio' },
  '/customers': { title: 'Customer Management', subtitle: 'Manage your customer database' },
  '/loans': { title: 'Loan Management', subtitle: 'Manage loan applications and approvals' },
  '/payments': { title: 'Payment Management', subtitle: 'Track EMI schedules and payment history' },
  '/accounting': { title: 'Accounting & Ledger', subtitle: 'Double-entry bookkeeping and financial records' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Comprehensive business reports and insights' },
  '/settings': { title: 'Settings', subtitle: 'System configuration and preferences' },
};

export default function Topbar() {
  const [location] = useLocation();
  const config = pageConfig[location as keyof typeof pageConfig] || 
    { title: 'Loan Management System', subtitle: 'Professional Finance Platform' };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{config.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{config.subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell size={20} />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
          
          {/* Date */}
          <div className="flex items-center space-x-2 text-right">
            <Calendar className="text-gray-400" size={16} />
            <div>
              <p className="text-sm font-medium text-gray-900">Today</p>
              <p className="text-xs text-gray-600">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
