import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  IndianRupee, 
  HandCoins, 
  AlertTriangle,
  Calendar,
  User,
  TrendingUp,
  ArrowUp,
  GitBranch,
  CheckCircle,
  Clock,
  Shield,
  TrendingDown
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-calculations";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface DashboardMetrics {
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  overdueLoans: number;
}

interface RecentLoan {
  id: number;
  loanId: string;
  customer: { fullName: string };
  principalAmount: string;
  status: string;
}

interface UpcomingEMI {
  id: number;
  installmentNumber: number;
  emiAmount: string;
  dueDate: string;
  loan: {
    customer: { fullName: string };
  };
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: workflowAlerts } = useQuery<any>({
    queryKey: ["/api/dashboard/workflow-alerts"],
  });

  const { data: kycPending } = useQuery<any[]>({
    queryKey: ["/api/dashboard/kyc-pending"],
  });

  const { data: upcomingEMIData } = useQuery<any[]>({
    queryKey: ["/api/dashboard/upcoming-emis"],
  });

  const { data: overdueEMIs } = useQuery<any[]>({
    queryKey: ["/api/dashboard/overdue-emis"],
  });

  const { data: loans } = useQuery<RecentLoan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const recentLoans = loans?.slice(0, 3) || [];
  const upcomingEMIs = upcomingEMIData?.slice(0, 3) || [];

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Active Loans",
      value: metrics?.activeLoans || 0,
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Disbursed",
      value: formatCurrency(metrics?.totalDisbursed || 0),
      change: "+8%",
      changeType: "positive" as const,
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Total Collected",
      value: formatCurrency(metrics?.totalCollected || 0),
      change: "+15%",
      changeType: "positive" as const,
      icon: HandCoins,
      color: "#A855F7",
      bgColor: "bg-purple-100",
    },
    {
      title: "Overdue Loans",
      value: metrics?.overdueLoans || 0,
      change: "Requires attention",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="metric-card group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon 
                    className={`h-6 w-6 ${typeof metric.color === 'string' && !metric.color.startsWith('#') ? metric.color : ''}`}
                    style={{ color: typeof metric.color === 'string' && metric.color.startsWith('#') ? metric.color : undefined }}
                    size={24} 
                  />
                </div>
                <span className="text-sm font-medium text-slate-600">{metric.title}</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2">{metric.value}</div>
              <div className="flex items-center space-x-2 text-sm">
                {metric.changeType === "positive" ? (
                  <span className="text-emerald-600 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    {metric.change}
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {metric.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Monthly Disbursement Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600">
                <TrendingUp className="mx-auto mb-2" size={48} />
                <p>Chart: Monthly disbursement trends</p>
                <p className="text-sm mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Loan Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600">
                <TrendingUp className="mx-auto mb-2" size={48} />
                <p>Chart: Loan status distribution</p>
                <p className="text-sm mt-1">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recent Loan Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentLoans.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent loan applications</p>
              ) : (
                recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="text-gray-600" size={16} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{loan.customer.fullName}</p>
                        <p className="text-xs text-gray-600">Loan ID: {loan.loanId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(loan.principalAmount)}
                      </p>
                      <Badge 
                        variant={loan.status === 'approved' ? 'default' : 
                                loan.status === 'pending' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {loan.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Upcoming EMI Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {upcomingEMIs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming EMI payments</p>
              ) : (
                upcomingEMIs.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                        <Calendar className="text-yellow-600" size={16} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Customer Payment</p>
                        <p className="text-xs text-gray-600">Due: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount || 25000)}
                      </p>
                      <p className="text-xs text-gray-600">EMI #{index + 1}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
