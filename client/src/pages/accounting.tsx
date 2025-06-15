import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Building2, TrendingUp, DollarSign, Gavel, Plus, Download, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LedgerTable from "@/components/tables/ledger-table";
import { formatCurrency } from "@/lib/financial-calculations";
import { canManageAccounting } from "@/lib/auth";

interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: string;
}

interface AccountBalance {
  cashBank: number;
  loanReceivables: number;
  interestIncome: number;
  penaltyIncome: number;
}

export default function Accounting() {
  const [accountFilter, setAccountFilter] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isJournalEntryOpen, setIsJournalEntryOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery({
    queryKey: ["/api/ledger", accountFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (accountFilter) params.append('accountId', accountFilter);
      if (dateFrom) params.append('fromDate', dateFrom);
      if (dateTo) params.append('toDate', dateTo);
      
      const response = await fetch(`/api/ledger?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch ledger entries");
      return response.json();
    },
  });

  // Calculate account balances
  const calculateBalances = (): AccountBalance => {
    if (!accounts) {
      return { cashBank: 0, loanReceivables: 0, interestIncome: 0, penaltyIncome: 0 };
    }

    const balances = {
      cashBank: 0,
      loanReceivables: 0,
      interestIncome: 0,
      penaltyIncome: 0,
    };

    accounts.forEach(account => {
      const balance = parseFloat(account.balance);
      switch (account.accountCode) {
        case 'CA001':
          balances.cashBank = balance;
          break;
        case 'LR001':
          balances.loanReceivables = balance;
          break;
        case 'II001':
          balances.interestIncome = balance;
          break;
        case 'PI001':
          balances.penaltyIncome = balance;
          break;
      }
    });

    return balances;
  };

  const accountBalances = calculateBalances();

  const addJournalEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const response = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entryData),
      });
      if (!response.ok) throw new Error("Failed to create journal entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsJournalEntryOpen(false);
      toast({
        title: "Journal Entry Created",
        description: "Journal entry has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Entry",
        description: error instanceof Error ? error.message : "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });

  const resetFilters = () => {
    setAccountFilter("all");
    setTransactionTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const exportLedger = () => {
    toast({
      title: "Export Started",
      description: "Ledger data export is being prepared...",
    });
  };

  const isAdmin = user?.role === 'admin';
  const canManage = canManageAccounting(user?.role || 'staff');

  if (accountsLoading || ledgerLoading) {
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
          <h2 className="text-2xl font-semibold text-gray-900">Accounting & Ledger</h2>
          <p className="text-sm text-gray-600 mt-1">Double-entry bookkeeping and financial records</p>
        </div>
        {isAdmin && (
          <div className="flex space-x-3">
            <Button variant="outline" onClick={exportLedger}>
              <Download className="mr-2" size={16} />
              Export
            </Button>
            <Dialog open={isJournalEntryOpen} onOpenChange={setIsJournalEntryOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-blue-700">
                  <Plus className="mr-2" size={16} />
                  Journal Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Journal Entry</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Manual journal entry functionality would be implemented here.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cash & Bank</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(accountBalances.cashBank)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total liquid assets</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Building2 className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Receivables</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(accountBalances.loanReceivables)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Outstanding principal</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interest Income</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {formatCurrency(accountBalances.interestIncome)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total earned interest</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <DollarSign className="text-yellow-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Penalty Income</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(accountBalances.penaltyIncome)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Late payment fees</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Gavel className="text-red-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts?.map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="disbursement">Loan Disbursement</SelectItem>
                  <SelectItem value="payment">EMI Payment</SelectItem>
                  <SelectItem value="penalty">Penalty Collection</SelectItem>
                  <SelectItem value="journal">Journal Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="Date From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Date To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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

      {/* Ledger Table */}
      <LedgerTable entries={ledgerEntries || []} />
    </div>
  );
}
