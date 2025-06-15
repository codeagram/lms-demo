import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/financial-calculations";

const paymentSchema = z.object({
  loanId: z.number().min(1, "Loan is required"),
  emiId: z.number().optional(),
  amount: z.string().min(1, "Payment amount is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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
  loan: {
    id: number;
    loanId: string;
    customer: {
      fullName: string;
      phone: string;
    };
  };
}

interface LoanWithDetails {
  id: number;
  loanId: string;
  customer: {
    fullName: string;
  };
  principalAmount: string;
  outstandingAmount: string;
}

interface PaymentFormProps {
  selectedEMI?: EMIWithLoan | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ selectedEMI, onSuccess, onCancel }: PaymentFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: loans } = useQuery<LoanWithDetails[]>({
    queryKey: ["/api/loans"],
    enabled: !selectedEMI,
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      loanId: selectedEMI?.loan.id || 0,
      emiId: selectedEMI?.id,
      amount: selectedEMI?.totalAmount || "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      reference: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emi-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    mutation.mutate(data);
  };

  const selectedLoanId = form.watch("loanId");
  const selectedLoan = loans?.find(loan => loan.id === selectedLoanId);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedEMI ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">EMI Payment</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Loan ID:</span>
                  <span className="ml-2 font-medium">{selectedEMI.loan.loanId}</span>
                </div>
                <div>
                  <span className="text-blue-700">Customer:</span>
                  <span className="ml-2 font-medium">{selectedEMI.loan.customer.fullName}</span>
                </div>
                <div>
                  <span className="text-blue-700">EMI #:</span>
                  <span className="ml-2 font-medium">{selectedEMI.installmentNumber}</span>
                </div>
                <div>
                  <span className="text-blue-700">Due Date:</span>
                  <span className="ml-2 font-medium">{new Date(selectedEMI.dueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">EMI Amount:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedEMI.emiAmount)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Due:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(selectedEMI.totalAmount)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="loanId">Select Loan *</Label>
              <Select
                value={form.watch("loanId")?.toString()}
                onValueChange={(value) => form.setValue("loanId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan for payment" />
                </SelectTrigger>
                <SelectContent>
                  {loans?.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id.toString()}>
                      {loan.loanId} - {loan.customer.fullName} 
                      (Outstanding: {formatCurrency(loan.outstandingAmount || loan.principalAmount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.loanId && (
                <p className="text-sm text-red-600">{form.formState.errors.loanId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...form.register("amount")}
                placeholder="Enter payment amount"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
              )}
              {selectedEMI && (
                <div className="text-xs text-gray-600">
                  <p>Principal: {formatCurrency(selectedEMI.principalAmount)}</p>
                  <p>Interest: {formatCurrency(selectedEMI.interestAmount)}</p>
                  {parseFloat(selectedEMI.penaltyAmount) > 0 && (
                    <p>Penalty: {formatCurrency(selectedEMI.penaltyAmount)}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                {...form.register("paymentDate")}
              />
              {form.formState.errors.paymentDate && (
                <p className="text-sm text-red-600">{form.formState.errors.paymentDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="net_banking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-red-600">{form.formState.errors.paymentMethod.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                {...form.register("reference")}
                placeholder="Transaction ID, Cheque number, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes about the payment..."
              rows={3}
            />
          </div>

          {selectedLoan && !selectedEMI && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Loan Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700">Customer:</span>
                  <span className="ml-2 font-medium">{selectedLoan.customer.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-700">Outstanding:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {formatCurrency(selectedLoan.outstandingAmount || selectedLoan.principalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {mutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Recording Payment...</span>
            </div>
          ) : (
            "Record Payment"
          )}
        </Button>
      </div>
    </form>
  );
}
