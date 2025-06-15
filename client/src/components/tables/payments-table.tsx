import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, User, Calendar, Receipt, Bell, TriangleAlert, Eye, PrinterCheck } from "lucide-react";
import { formatCurrency } from "@/lib/financial-calculations";

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

interface PaymentsTableProps {
  emis: EMIWithLoan[];
  onRecordPayment: (emi: EMIWithLoan) => void;
}

export default function PaymentsTable({ emis, onRecordPayment }: PaymentsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      unpaid: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      overdue: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      partial: { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRowClassName = (emi: EMIWithLoan) => {
    if (emi.status === 'paid') return "hover:bg-gray-50 bg-green-50";
    if (emi.status === 'overdue') return "hover:bg-gray-50 bg-red-50";
    return "hover:bg-gray-50";
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getTimeTodue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} days left`;
    }
  };

  const handleViewEMIDetails = (emi: EMIWithLoan) => {
    // Would implement EMI details modal
    console.log("View EMI details:", emi);
  };

  const handleSendReminder = (emi: EMIWithLoan) => {
    // Would implement reminder functionality
    console.log("Send reminder for EMI:", emi);
  };

  const handleViewReceipt = (emi: EMIWithLoan) => {
    // Would implement receipt view
    console.log("View receipt for EMI:", emi);
  };

  const handlePrintReceipt = (emi: EMIWithLoan) => {
    // Would implement print functionality
    console.log("PrinterCheck receipt for EMI:", emi);
  };

  if (emis.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No EMI schedules found</h3>
            <p className="text-gray-600">
              No EMI schedules match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EMI Schedule & Payments ({emis.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMI Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
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
              {emis.map((emi) => (
                <tr key={emi.id} className={getRowClassName(emi)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Loan: {emi.loan.loanId}
                      </div>
                      <div className="text-sm text-gray-500">
                        EMI #{emi.installmentNumber}
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
                          {emi.loan.customer.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {emi.loan.customer.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Total: {formatCurrency(emi.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Principal: {formatCurrency(emi.principalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Interest: {formatCurrency(emi.interestAmount)}
                    </div>
                    {parseFloat(emi.penaltyAmount) > 0 && (
                      <div className="text-sm text-red-600">
                        Penalty: {formatCurrency(emi.penaltyAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${emi.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(emi.dueDate).toLocaleDateString()}
                    </div>
                    <div className={`text-sm ${
                      emi.status === 'overdue' ? 'text-red-600' : 
                      emi.status === 'paid' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {emi.status === 'paid' ? 'Paid on time' : getTimeTodue(emi.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(emi.status)}
                    {emi.status === 'paid' && emi.paidDate && (
                      <div className="text-xs text-green-600 mt-1">
                        Paid: {new Date(emi.paidDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {emi.status === 'unpaid' || emi.status === 'overdue' || emi.status === 'partial' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRecordPayment(emi)}
                          className="text-green-600 hover:text-green-700"
                          title="Record Payment"
                        >
                          <CreditCard size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReceipt(emi)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Receipt"
                        >
                          <Receipt size={16} />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEMIDetails(emi)}
                        className="text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>

                      {emi.status === 'unpaid' || emi.status === 'partial' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendReminder(emi)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Send Reminder"
                        >
                          <Bell size={16} />
                        </Button>
                      ) : emi.status === 'overdue' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendReminder(emi)}
                          className="text-red-600 hover:text-red-700"
                          title="Send Notice"
                        >
                          <TriangleAlert size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReceipt(emi)}
                          className="text-gray-600 hover:text-gray-900"
                          title="PrinterCheck Receipt"
                        >
                          <PrinterCheck size={16} />
                        </Button>
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
