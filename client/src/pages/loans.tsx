import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Search, RefreshCw, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoanForm from "@/components/forms/loan-form";
import LoansTable from "@/components/tables/loans-table";
import { apiRequest } from "@/lib/queryClient";
import { canApproveLoans } from "@/lib/auth";
import { formatCurrency } from "@/lib/financial-calculations";

interface LoanWithDetails {
  id: number;
  loanId: string;
  customerId: number;
  principalAmount: string;
  interestRate: string;
  interestType: string;
  tenure: number;
  repaymentFrequency: string;
  gracePeriod: number;
  startDate: string;
  status: string;
  notes?: string;
  emiAmount?: string;
  totalInterest?: string;
  totalAmount?: string;
  outstandingAmount?: string;
  customer: {
    id: number;
    fullName: string;
    phone: string;
    email?: string;
  };
  asset?: {
    id: number;
    type: string;
    make?: string;
    model?: string;
  };
  creator: {
    id: number;
    fullName: string;
  };
  emiSchedule: any[];
  payments: any[];
}

export default function Loans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("");
  const [interestTypeFilter, setInterestTypeFilter] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: loans, isLoading } = useQuery<LoanWithDetails[]>({
    queryKey: ["/api/loans"],
  });

  const approveLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/loans/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Loan Approved",
        description: "Loan has been successfully approved and EMI schedule generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve loan",
        variant: "destructive",
      });
    },
  });

  const filteredLoans = loans?.filter(loan => {
    const matchesSearch = 
      loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || loan.status === statusFilter;

    const matchesAmount = !amountFilter || (() => {
      const amount = parseFloat(loan.principalAmount);
      switch (amountFilter) {
        case "0-100000": return amount <= 100000;
        case "100000-500000": return amount > 100000 && amount <= 500000;
        case "500000+": return amount > 500000;
        default: return true;
      }
    })();

    const matchesInterestType = !interestTypeFilter || loan.interestType === interestTypeFilter;

    return matchesSearch && matchesStatus && matchesAmount && matchesInterestType;
  }) || [];

  const loanCounts = {
    all: loans?.length || 0,
    pending: loans?.filter(l => l.status === 'pending').length || 0,
    approved: loans?.filter(l => l.status === 'approved').length || 0,
    active: loans?.filter(l => l.status === 'active').length || 0,
    overdue: loans?.filter(l => l.status === 'overdue').length || 0,
    closed: loans?.filter(l => l.status === 'closed').length || 0,
  };

  const handleEditLoan = (loan: LoanWithDetails) => {
    setSelectedLoan(loan);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddLoan = () => {
    setSelectedLoan(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedLoan(null);
    setIsEditing(false);
  };

  const handleApproveLoan = async (loan: LoanWithDetails) => {
    if (window.confirm(`Are you sure you want to approve loan ${loan.loanId}?`)) {
      approveLoanMutation.mutate(loan.id);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setAmountFilter("");
    setInterestTypeFilter("");
  };

  const exportLoans = () => {
    // Implementation for exporting loans
    toast({
      title: "Export Started",
      description: "Loan data export is being prepared...",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Loan Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage loan applications and approvals</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportLoans}>
            <Download className="mr-2" size={16} />
            Export
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddLoan} className="bg-primary hover:bg-blue-700">
                <Plus className="mr-2" size={16} />
                New Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Loan" : "Create New Loan"}
                </DialogTitle>
              </DialogHeader>
              <LoanForm
                loan={selectedLoan}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Tabs and Filters */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-6 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  All Loans ({loanCounts.all})
                </TabsTrigger>
                <TabsTrigger 
                  value="pending"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  Pending ({loanCounts.pending})
                </TabsTrigger>
                <TabsTrigger 
                  value="approved"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  Approved ({loanCounts.approved})
                </TabsTrigger>
                <TabsTrigger 
                  value="active"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  Active ({loanCounts.active})
                </TabsTrigger>
                <TabsTrigger 
                  value="overdue"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  Overdue ({loanCounts.overdue})
                </TabsTrigger>
                <TabsTrigger 
                  value="closed"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-4"
                >
                  Closed ({loanCounts.closed})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by loan ID or customer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Select value={amountFilter} onValueChange={setAmountFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Amount Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Amounts</SelectItem>
                      <SelectItem value="0-100000">₹0 - ₹1L</SelectItem>
                      <SelectItem value="100000-500000">₹1L - ₹5L</SelectItem>
                      <SelectItem value="500000+">₹5L+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Interest Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="reducing">Reducing Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    <RefreshCw className="mr-2" size={16} />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <LoansTable
        loans={filteredLoans}
        onEdit={handleEditLoan}
        onApprove={handleApproveLoan}
        canApprove={canApproveLoans(user?.role || 'staff')}
        isApproving={approveLoanMutation.isPending}
      />
    </div>
  );
}
