import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Calendar, AlertTriangle, CheckCircle, Search, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaymentForm from "@/components/forms/payment-form";
import PaymentsTable from "@/components/tables/payments-table";
import { formatCurrency } from "@/lib/financial-calculations";

interface PaymentMetrics {
  dueToday: number;
  dueTodayCount: number;
  overdue: number;
  overdueCount: number;
  collectedToday: number;
  collectedTodayCount: number;
  penaltyCollected: number;
}

interface EMIWithLoan {
  id: number;
  installmentNumber: number;
  dueDate: string;
  emiAmount: string;
  principalAmount: string;
  interestAmount: string;
  penaltyAmount: string;
  totalAmount: string;
  status: string;
  paidAmount: string;
  paidDate?: string;
  outstandingBalance: string;
  loan: {
    id: number;
    loanId: string;
    customer: {
      id: number;
      fullName: string;
      phone: string;
    };
  };
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState<EMIWithLoan | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: emiSchedules, isLoading: emiLoading } = useQuery<EMIWithLoan[]>({
    queryKey: ["/api/emi-schedules"],
    queryFn: async () => {
      // This would need to be implemented in the backend
      const response = await fetch("/api/emi-schedules", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch EMI schedules");
      return response.json();
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Calculate metrics from EMI schedules
  const calculateMetrics = (): PaymentMetrics => {
    if (!emiSchedules) {
      return {
        dueToday: 0,
        dueTodayCount: 0,
        overdue: 0,
        overdueCount: 0,
        collectedToday: 0,
        collectedTodayCount: 0,
        penaltyCollected: 0,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const dueToday = emiSchedules.filter(emi => emi.dueDate === today && emi.status === 'unpaid');
    const overdue = emiSchedules.filter(emi => emi.dueDate < today && emi.status !== 'paid');
    const paidToday = emiSchedules.filter(emi => emi.paidDate?.split('T')[0] === today);
    
    return {
      dueToday: dueToday.reduce((sum, emi) => sum + parseFloat(emi.totalAmount), 0),
      dueTodayCount: dueToday.length,
      overdue: overdue.reduce((sum, emi) => sum + parseFloat(emi.totalAmount), 0),
      overdueCount: overdue.length,
      collectedToday: paidToday.reduce((sum, emi) => sum + parseFloat(emi.paidAmount), 0),
      collectedTodayCount: paidToday.length,
      penaltyCollected: emiSchedules.reduce((sum, emi) => sum + parseFloat(emi.penaltyAmount || '0'), 0),
    };
  };

  const metrics = calculateMetrics();

  const filteredEMIs = emiSchedules?.filter(emi => {
    const matchesSearch = 
      emi.loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emi.loan.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || statusFilter === "all" || emi.status === statusFilter;

    const matchesDateFrom = !dueDateFrom || emi.dueDate >= dueDateFrom;
    const matchesDateTo = !dueDateTo || emi.dueDate <= dueDateTo;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  }) || [];

  const handleRecordPayment = (emi: EMIWithLoan) => {
    setSelectedEMI(emi);
    setIsPaymentFormOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentFormOpen(false);
    setSelectedEMI(null);
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emi-schedules"] });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDueDateFrom("");
    setDueDateTo("");
  };

  if (emiLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payment Management</h2>
          <p className="text-sm text-gray-600 mt-1">Track EMI schedules and payment history</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <Wallet className="mr-2" size={16} />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm
                selectedEMI={selectedEMI}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setIsPaymentFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {formatCurrency(metrics.dueToday)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {metrics.dueTodayCount} payments
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Calendar className="text-yellow-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(metrics.overdue)}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {metrics.overdueCount} payments
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collected Today</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(metrics.collectedToday)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {metrics.collectedTodayCount} payments
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Penalty Collected</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(metrics.penaltyCollected)}
                </p>
                <p className="text-sm text-gray-600 mt-1">This month</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Wallet className="text-gray-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by loan ID or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="Due Date From"
                value={dueDateFrom}
                onChange={(e) => setDueDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Due Date To"
                value={dueDateTo}
                onChange={(e) => setDueDateTo(e.target.value)}
              />
            </div>
            <div>
              <Button variant="outline" onClick={resetFilters} className="w-full">
                <RefreshCw className="mr-2" size={16} />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <PaymentsTable
        emis={filteredEMIs}
        onRecordPayment={handleRecordPayment}
      />
    </div>
  );
}
