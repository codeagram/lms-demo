import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Wallet, 
  Calculator, 
  FileText, 
  Settings,
  Building2,
  LogOut,
  User,
  GitBranch,
  Shield,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'staff'] },
  { name: 'Loans', href: '/loans', icon: CreditCard, roles: ['admin', 'staff'] },
  { name: 'Workflow', href: '/workflow', icon: GitBranch, roles: ['admin', 'staff'] },
  { name: 'KYC Verification', href: '/kyc-verification', icon: CheckCircle, roles: ['admin', 'staff'] },
  { name: 'Payments', href: '/payments', icon: Wallet, roles: ['admin', 'staff'] },
  { name: 'Accounting', href: '/accounting', icon: Calculator, roles: ['admin', 'staff'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'staff'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'staff')
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Building2 className="text-white text-sm" size={16} />
        </div>
        <h1 className="ml-3 text-lg font-semibold text-gray-900">LMS Pro</h1>
      </div>
      
      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2 flex-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}>
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* User section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 text-sm" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
