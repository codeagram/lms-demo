import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, User, Eye } from "lucide-react";

interface Customer {
  id: number;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber: string;
  isActive: boolean;
  createdAt: string;
}

interface CustomerWithLoans extends Customer {
  loans?: any[];
  activeLoansCount?: number;
}

interface CustomersTableProps {
  customers: CustomerWithLoans[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
  isDeleting?: boolean;
}

export default function CustomersTable({ 
  customers, 
  onEdit, 
  onDelete, 
  onView,
  isDeleting = false
}: CustomersTableProps) {
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.fullName}?`)) {
      setDeletingCustomerId(customer.id);
      try {
        await onDelete(customer);
      } finally {
        setDeletingCustomerId(null);
      }
    }
  };

  const handleView = (customer: Customer) => {
    if (onView) {
      onView(customer);
    } else {
      // Default view behavior - could open a modal or navigate to detail page
      console.log("View customer:", customer);
    }
  };

  const getActiveLoansCount = (customer: CustomerWithLoans) => {
    if (customer.activeLoansCount !== undefined) {
      return customer.activeLoansCount;
    }
    if (customer.loans) {
      return customer.loans.filter(loan => 
        ['active', 'approved', 'pending'].includes(loan.status)
      ).length;
    }
    return 0;
  };

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <User className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600">
              No customers match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers ({customers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Loans
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
              {customers.map((customer) => {
                const activeLoans = getActiveLoansCount(customer);
                const isCurrentlyDeleting = deletingCustomerId === customer.id;
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="text-gray-600" size={16} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Customer ID: {customer.customerId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.idNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeLoans > 0 ? (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {activeLoans} Loan{activeLoans !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          No Active Loans
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(customer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Customer"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(customer)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Customer"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        disabled={isCurrentlyDeleting || isDeleting}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Customer"
                      >
                        {isCurrentlyDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
