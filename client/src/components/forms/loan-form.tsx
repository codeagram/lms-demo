import { useState } from "react";
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

const loanSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  principalAmount: z.string().min(1, "Principal amount is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  interestType: z.enum(["flat", "reducing"], { required_error: "Interest type is required" }),
  tenure: z.number().min(1, "Tenure is required"),
  repaymentFrequency: z.enum(["monthly", "weekly"], { required_error: "Repayment frequency is required" }),
  gracePeriod: z.number().min(0),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
  // Asset fields
  assetType: z.string().optional(),
  assetMake: z.string().optional(),
  assetModel: z.string().optional(),
  assetRegistrationNumber: z.string().optional(),
  assetEstimatedValue: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface Customer {
  id: number;
  fullName: string;
  customerId: string;
}

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
  customer: Customer;
  asset?: {
    type: string;
    make?: string;
    model?: string;
    registrationNumber?: string;
    estimatedValue?: string;
  };
}

interface LoanFormProps {
  loan?: LoanWithDetails | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LoanForm({ loan, onSuccess, onCancel }: LoanFormProps) {
  const [includeAsset, setIncludeAsset] = useState(!!loan?.asset);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!loan;

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      customerId: loan?.customerId || 0,
      principalAmount: loan?.principalAmount || "",
      interestRate: loan?.interestRate || "",
      interestType: (loan?.interestType as "flat" | "reducing") || "reducing",
      tenure: loan?.tenure || 12,
      repaymentFrequency: (loan?.repaymentFrequency as "monthly" | "weekly") || "monthly",
      gracePeriod: loan?.gracePeriod || 0,
      startDate: loan?.startDate || "",
      notes: loan?.notes || "",
      assetType: loan?.asset?.type || "",
      assetMake: loan?.asset?.make || "",
      assetModel: loan?.asset?.model || "",
      assetRegistrationNumber: loan?.asset?.registrationNumber || "",
      assetEstimatedValue: loan?.asset?.estimatedValue || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const loanData = {
        customerId: data.customerId,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        tenure: data.tenure,
        repaymentFrequency: data.repaymentFrequency,
        gracePeriod: data.gracePeriod,
        startDate: data.startDate,
        notes: data.notes,
        ...(includeAsset && {
          asset: {
            type: data.assetType,
            make: data.assetMake,
            model: data.assetModel,
            registrationNumber: data.assetRegistrationNumber,
            estimatedValue: data.assetEstimatedValue,
          },
        }),
      };

      const url = isEditing ? `/api/loans/${loan.id}` : "/api/loans";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, loanData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: isEditing ? "Loan Updated" : "Loan Created",
        description: `Loan has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: `${isEditing ? "Update" : "Create"} Failed`,
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} loan`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    mutation.mutate(data);
  };

  const calculateEMI = () => {
    const principal = parseFloat(form.getValues("principalAmount"));
    const rate = parseFloat(form.getValues("interestRate"));
    const tenure = form.getValues("tenure");
    const interestType = form.getValues("interestType");

    if (principal && rate && tenure) {
      let emi = 0;
      const monthlyRate = rate / (12 * 100);

      if (interestType === "flat") {
        const totalInterest = (principal * rate * tenure) / (12 * 100);
        emi = (principal + totalInterest) / tenure;
      } else {
        // Reducing balance
        if (monthlyRate > 0) {
          emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
        } else {
          emi = principal / tenure;
        }
      }

      toast({
        title: "EMI Calculated",
        description: `Estimated EMI: ₹${Math.round(emi).toLocaleString()}`,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Loan Information */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                value={form.watch("customerId")?.toString()}
                onValueChange={(value) => form.setValue("customerId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.fullName} ({customer.customerId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-sm text-red-600">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal Amount (₹) *</Label>
              <Input
                id="principalAmount"
                type="number"
                {...form.register("principalAmount")}
                placeholder="250000"
              />
              {form.formState.errors.principalAmount && (
                <p className="text-sm text-red-600">{form.formState.errors.principalAmount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%) *</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                {...form.register("interestRate")}
                placeholder="12.00"
              />
              {form.formState.errors.interestRate && (
                <p className="text-sm text-red-600">{form.formState.errors.interestRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestType">Interest Type *</Label>
              <Select
                value={form.watch("interestType")}
                onValueChange={(value) => form.setValue("interestType", value as "flat" | "reducing")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="reducing">Reducing Balance</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.interestType && (
                <p className="text-sm text-red-600">{form.formState.errors.interestType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenure">Tenure (Months) *</Label>
              <Input
                id="tenure"
                type="number"
                {...form.register("tenure", { valueAsNumber: true })}
                placeholder="24"
              />
              {form.formState.errors.tenure && (
                <p className="text-sm text-red-600">{form.formState.errors.tenure.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repaymentFrequency">Repayment Frequency *</Label>
              <Select
                value={form.watch("repaymentFrequency")}
                onValueChange={(value) => form.setValue("repaymentFrequency", value as "monthly" | "weekly")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.repaymentFrequency && (
                <p className="text-sm text-red-600">{form.formState.errors.repaymentFrequency.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
              <Input
                id="gracePeriod"
                type="number"
                {...form.register("gracePeriod", { valueAsNumber: true })}
                placeholder="0"
              />
              {form.formState.errors.gracePeriod && (
                <p className="text-sm text-red-600">{form.formState.errors.gracePeriod.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes about the loan..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeAsset"
                checked={includeAsset}
                onChange={(e) => setIncludeAsset(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="includeAsset">Include Asset/Collateral</Label>
            </div>
            <Button type="button" variant="outline" onClick={calculateEMI}>
              Calculate EMI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asset Information */}
      {includeAsset && (
        <Card>
          <CardHeader>
            <CardTitle>Asset/Collateral Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select
                  value={form.watch("assetType")}
                  onValueChange={(value) => form.setValue("assetType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Property">Property</SelectItem>
                    <SelectItem value="Machinery">Machinery</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetEstimatedValue">Estimated Value (₹)</Label>
                <Input
                  id="assetEstimatedValue"
                  type="number"
                  {...form.register("assetEstimatedValue")}
                  placeholder="80000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetMake">Make/Brand</Label>
                <Input
                  id="assetMake"
                  {...form.register("assetMake")}
                  placeholder="Honda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetModel">Model</Label>
                <Input
                  id="assetModel"
                  {...form.register("assetModel")}
                  placeholder="Activa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetRegistrationNumber">Registration Number</Label>
                <Input
                  id="assetRegistrationNumber"
                  {...form.register("assetRegistrationNumber")}
                  placeholder="DL01AB1234"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          className="bg-primary hover:bg-blue-700"
        >
          {mutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEditing ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            isEditing ? "Update Loan" : "Create Loan"
          )}
        </Button>
      </div>
    </form>
  );
}
