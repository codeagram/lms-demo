import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  address: z.string().optional(),
  idNumber: z.string().min(5, "ID number is required"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

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

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!customer;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: customer?.fullName || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      idNumber: customer?.idNumber || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const url = isEditing ? `/api/customers/${customer.id}` : "/api/customers";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: isEditing ? "Customer Updated" : "Customer Created",
        description: `Customer has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: `${isEditing ? "Update" : "Create"} Failed`,
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} customer`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...form.register("fullName")}
            placeholder="Enter full name"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="+91 9876543210"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="customer@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number *</Label>
          <Input
            id="idNumber"
            {...form.register("idNumber")}
            placeholder="PAN/Aadhaar/Passport"
          />
          {form.formState.errors.idNumber && (
            <p className="text-sm text-red-600">{form.formState.errors.idNumber.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...form.register("address")}
          placeholder="Enter full address"
          rows={3}
        />
      </div>

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
            isEditing ? "Update Customer" : "Create Customer"
          )}
        </Button>
      </div>
    </form>
  );
}
