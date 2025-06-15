import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/financial-calculations";
import { FileText, TrendingUp } from "lucide-react";

interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  account: string;
  accountCode: string;
  debitAmount: string;
  creditAmount: string;
  entryDescription: string;
}

interface LedgerTableProps {
  entries: LedgerEntry[];
}

export default function LedgerTable({ entries }: LedgerTableProps) {
  const getAccountBadge = (accountCode: string, accountName: string) => {
    const accountConfig = {
      'CA001': { className: "bg-green-100 text-green-800" },
      'LR001': { className: "bg-blue-100 text-blue-800" },
      'II001': { className: "bg-yellow-100 text-yellow-800" },
      'PI001': { className: "bg-red-100 text-red-800" },
    };

    const config = accountConfig[accountCode as keyof typeof accountConfig] || 
                  { className: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge variant="secondary" className={config.className}>
        {accountName}
      </Badge>
    );
  };

  const getTransactionTypeFromDescription = (description: string) => {
    if (description.toLowerCase().includes('disbursement')) return 'Loan Disbursement';
    if (description.toLowerCase().includes('payment')) return 'EMI Payment';
    if (description.toLowerCase().includes('penalty')) return 'Penalty Collection';
    if (description.toLowerCase().includes('journal')) return 'Journal Entry';
    return 'Transaction';
  };

  const calculateRunningBalance = (entries: LedgerEntry[], currentIndex: number) => {
    let balance = 0;
    for (let i = 0; i <= currentIndex; i++) {
      const entry = entries[i];
      balance += (parseFloat(entry.debitAmount) || 0) - (parseFloat(entry.creditAmount) || 0);
    }
    return balance;
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ledger entries found</h3>
            <p className="text-gray-600">
              No ledger entries match your current filters. Try adjusting your date range or account selection.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Ledger Entries ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, index) => {
                const debitAmount = parseFloat(entry.debitAmount) || 0;
                const creditAmount = parseFloat(entry.creditAmount) || 0;
                const runningBalance = calculateRunningBalance(entries, index);
                
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.reference}</div>
                      <div className="text-sm text-gray-500">
                        {getTransactionTypeFromDescription(entry.entryDescription)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.entryDescription}</div>
                      {entry.description && entry.description !== entry.entryDescription && (
                        <div className="text-sm text-gray-500">{entry.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAccountBadge(entry.accountCode, entry.account)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {debitAmount > 0 ? formatCurrency(debitAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {creditAmount > 0 ? formatCurrency(creditAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={runningBalance >= 0 ? 'text-gray-900' : 'text-red-600'}>
                        {formatCurrency(Math.abs(runningBalance))}
                        {runningBalance < 0 ? ' (CR)' : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Total Debits</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(
                  entries.reduce((sum, entry) => sum + (parseFloat(entry.debitAmount) || 0), 0)
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Total Credits</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(
                  entries.reduce((sum, entry) => sum + (parseFloat(entry.creditAmount) || 0), 0)
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Net Balance</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(
                  entries.reduce((sum, entry) => 
                    sum + (parseFloat(entry.debitAmount) || 0) - (parseFloat(entry.creditAmount) || 0), 0
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
