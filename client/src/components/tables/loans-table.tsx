import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, CheckCircle, XCircle, CreditCard, MoreVertical, User, Calendar, DollarSign, Percent, Clock, FileText } from "lucide-react";
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
    setSelectedLoan(loan);
  };

  const handleAddPayment = (loan: LoanWithDetails) => {
    // Would implement payment form
    console.log("Add payment for loan:", loan);
  };

  return (
    <>
      <Card className="shadow-sm border-0 bg-white/70 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <span>Loans Portfolio</span>
            <Badge variant="secondary" className="ml-auto bg-blue-50 text-blue-700">
              {loans.length} loans
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50 first:rounded-l-lg">
                    Loan Details
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                    Customer
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                    Financial
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                    Terms
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                    Collateral
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 bg-gray-50 last:rounded-r-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="group hover:bg-blue-50/50 transition-colors">
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-600 text-lg">
                          {loan.loanId}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(loan.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {loan.customer.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {formatCurrency(loan.principalAmount)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {loan.interestRate}% {loan.interestType}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {loan.tenure} months
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {loan.repaymentFrequency}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {getAssetDisplay(loan.asset)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.asset?.type || 'No Asset'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLoan(loan)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {(loan.status === 'draft' || loan.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(loan)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            title="Edit Loan"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {loan.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddPayment(loan)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Add Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}

                        {loan.status === 'pending' && canApprove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApprove(loan)}
                            disabled={isApproving}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Approve Loan"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewLoan(loan)} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(loan)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Edit Loan
                            </DropdownMenuItem>
                            {loan.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAddPayment(loan)} className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modern Loan Details Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              Loan Details - {selectedLoan?.loanId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-8">
              {/* Customer Information Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedLoan.customer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedLoan.customer.phone}</p>
                  </div>
                  {selectedLoan.customer.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Email Address</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedLoan.customer.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Financial Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Principal Amount</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(selectedLoan.principalAmount)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Interest Rate</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedLoan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Interest Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{selectedLoan.interestType}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Loan Terms
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Tenure</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedLoan.tenure} months</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Frequency</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{selectedLoan.repaymentFrequency}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Start Date</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(selectedLoan.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Grace Period</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedLoan.gracePeriod} days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Asset Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    Status & Management
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
                      {getStatusBadge(selectedLoan.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Created By</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedLoan.creator.fullName}</p>
                    </div>
                  </div>
                </div>

                {selectedLoan.asset && (
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
                      Asset/Collateral
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Asset Type</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedLoan.asset.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Make & Model</p>
                        <p className="text-lg font-semibold text-gray-900">{getAssetDisplay(selectedLoan.asset)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {selectedLoan.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="font-semibold mb-3 text-gray-800">Additional Notes</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLoan.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    if (selectedLoan) {
                      setSelectedLoan(null);
                      onEdit(selectedLoan);
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Edit className="w-4 h-4" />
                  Edit Loan
                </Button>
                {selectedLoan.status === 'pending' && canApprove && (
                  <Button
                    onClick={() => {
                      if (selectedLoan) {
                        setSelectedLoan(null);
                        onApprove(selectedLoan);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Loan
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedLoan(null)}
                  variant="ghost"
                  className="ml-auto px-6 py-3"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}