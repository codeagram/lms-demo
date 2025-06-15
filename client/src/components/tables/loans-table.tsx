import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, CheckCircle, XCircle, CreditCard, MoreVertical, User } from "lucide-react";
import { formatCurrency } from "@/lib/financial-calculations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface LoansTableProps {
  loans: LoanWithDetails[];
  onEdit: (loan: LoanWithDetails) => void;
  onApprove: (loan: LoanWithDetails) => void;
  canApprove: boolean;
  isApproving: boolean;
}

export default function LoansTable({ 
  loans, 
  onEdit, 
  onApprove, 
  canApprove, 
  isApproving 
}: LoansTableProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" },
      pending: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      approved: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      active: { variant: "default" as const, className: "bg-blue-100 text-blue-800" },
      closed: { variant: "secondary" as const, className: "bg-gray-100 text-gray-800" },
      overdue: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAssetDisplay = (asset?: LoanWithDetails['asset']) => {
    if (!asset) return "No Asset";
    return `${asset.make || ''} ${asset.model || ''}`.trim() || asset.type;
  };

  const handleViewLoan = (loan: LoanWithDetails) => {
    // Would implement loan details modal/view
    console.log("View loan:", loan);
  };

  const handleAddPayment = (loan: LoanWithDetails) => {
    // Would implement payment form
    console.log("Add payment for loan:", loan);
  };

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CreditCard className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600">
              No loans match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loans ({loans.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{loan.loanId}</div>
                      <div className="text-sm text-gray-500">
                        Start: {new Date(loan.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Asset: {getAssetDisplay(loan.asset)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="text-gray-600 text-xs" size={14} />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {loan.customer.fullName}
                        </div>
                        <div className="text-sm text-gray-500">{loan.customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(loan.principalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Outstanding: {formatCurrency(loan.outstandingAmount || loan.principalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {loan.interestRate}% - {loan.interestType === 'flat' ? 'Flat' : 'Reducing'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {loan.tenure} months - {loan.repaymentFrequency === 'monthly' ? 'Monthly' : 'Weekly'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(loan.status)}
                    {loan.emiAmount && (
                      <div className="text-xs text-gray-500 mt-1">
                        EMI: {formatCurrency(loan.emiAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLoan(loan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>
                      
                      {loan.status === 'draft' || loan.status === 'pending' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(loan)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Loan"
                        >
                          <Edit size={16} />
                        </Button>
                      ) : null}

                      {loan.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddPayment(loan)}
                          className="text-green-600 hover:text-green-700"
                          title="Add Payment"
                        >
                          <CreditCard size={16} />
                        </Button>
                      )}

                      {loan.status === 'pending' && canApprove && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApprove(loan)}
                            disabled={isApproving}
                            className="text-green-600 hover:text-green-700"
                            title="Approve Loan"
                          >
                            <CheckCircle size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Reject Loan"
                          >
                            <XCircle size={16} />
                          </Button>
                        </>
                      )}

                      {canApprove && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-gray-600"
                              title="More Actions"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewLoan(loan)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(loan)}>
                              Edit Loan
                            </DropdownMenuItem>
                            {loan.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAddPayment(loan)}>
                                Record Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
