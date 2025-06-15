import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, FileText, Upload, Phone, Mail, MapPin, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber: string;
  referralCode?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  kycStatus: string;
  kycVerifiedBy?: number;
  kycVerifiedAt?: string;
  employmentStatus: string;
  employmentVerifiedBy?: number;
  employmentVerifiedAt?: string;
  documents?: any;
  lastRejectedAt?: string;
  isActive: boolean;
  createdAt: string;
}

const statusColors = {
  pending: "text-yellow-600 bg-yellow-100",
  verified: "text-green-600 bg-green-100",
  rejected: "text-red-600 bg-red-100"
};

const statusIcons = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle
};

export default function KYCVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: kycPending = [] } = useQuery({
    queryKey: ["/api/dashboard/kyc-pending"],
  });

  const updateKYCMutation = useMutation({
    mutationFn: async ({ customerId, status }: { customerId: number; status: string }) => {
      return apiRequest(`/api/customers/${customerId}/kyc`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kyc-pending"] });
      toast({
        title: "Success",
        description: "KYC status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update KYC status",
        variant: "destructive",
      });
    },
  });

  const updateEmploymentMutation = useMutation({
    mutationFn: async ({ customerId, status }: { customerId: number; status: string }) => {
      return apiRequest(`/api/customers/${customerId}/employment`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kyc-pending"] });
      toast({
        title: "Success",
        description: "Employment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employment status",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter((customer: Customer) => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === "all" || 
                         customer.kycStatus === filterStatus || 
                         customer.employmentStatus === filterStatus ||
                         (filterStatus === "pending_verification" && 
                          (customer.kycStatus === "pending" || customer.employmentStatus === "pending"));
    
    return matchesSearch && matchesFilter;
  });

  const handleKYCUpdate = (customerId: number, status: string) => {
    updateKYCMutation.mutate({ customerId, status });
  };

  const handleEmploymentUpdate = (customerId: number, status: string) => {
    updateEmploymentMutation.mutate({ customerId, status });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading verification data...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">KYC & Employment Verification</h1>
          <p className="text-muted-foreground">Verify customer documents and employment status</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: Customer) => c.kycStatus === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: Customer) => c.kycStatus === "verified").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Employment</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: Customer) => c.employmentStatus === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employment Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: Customer) => c.employmentStatus === "verified").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name, customer ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="pending_verification">Pending Verification</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer: Customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{customer.fullName}</CardTitle>
                  <CardDescription>{customer.customerId}</CardDescription>
                </div>
                {(customer.kycStatus === "pending" || customer.employmentStatus === "pending") && (
                  <Badge variant="outline" className="text-yellow-600">
                    Needs Review
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Contact Info */}
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Phone className="h-3 w-3 mr-2" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-2" />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-2" />
                      {customer.address.substring(0, 50)}...
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KYC Status:</span>
                    <Badge variant={customer.kycStatus === "verified" ? "default" : "outline"}>
                      {customer.kycStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Employment:</span>
                    <Badge variant={customer.employmentStatus === "verified" ? "default" : "outline"}>
                      {customer.employmentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Document Info */}
                {(customer.panNumber || customer.aadhaarNumber) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {customer.panNumber && <div>PAN: {customer.panNumber}</div>}
                    {customer.aadhaarNumber && <div>Aadhaar: {customer.aadhaarNumber}</div>}
                  </div>
                )}

                {/* Action Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full" onClick={() => setSelectedCustomer(customer)}>
                      <FileText className="h-3 w-3 mr-2" />
                      Review Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Customer Verification - {customer.fullName}</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="kyc" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
                        <TabsTrigger value="employment">Employment Verification</TabsTrigger>
                      </TabsList>

                      <TabsContent value="kyc" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Customer ID</Label>
                            <p className="font-semibold">{customer.customerId}</p>
                          </div>
                          <div>
                            <Label>Current Status</Label>
                            <Badge variant={customer.kycStatus === "verified" ? "default" : "outline"}>
                              {customer.kycStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Document Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>PAN Number</Label>
                            <Input 
                              value={customer.panNumber || ""} 
                              placeholder="Enter PAN number"
                              readOnly
                            />
                          </div>
                          <div>
                            <Label>Aadhaar Number</Label>
                            <Input 
                              value={customer.aadhaarNumber || ""} 
                              placeholder="Enter Aadhaar number"
                              readOnly
                            />
                          </div>
                        </div>

                        <div>
                          <Label>ID Number</Label>
                          <Input value={customer.idNumber} readOnly />
                        </div>

                        {/* Document Upload Simulation */}
                        <div className="space-y-2">
                          <Label>Document Uploads</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              Documents would be uploaded here (PAN, Aadhaar, Photos)
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Simulated upload area - no actual file handling
                            </p>
                          </div>
                        </div>

                        {/* KYC Action Buttons */}
                        {customer.kycStatus === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleKYCUpdate(customer.id, "verified")}
                              disabled={updateKYCMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify KYC
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleKYCUpdate(customer.id, "rejected")}
                              disabled={updateKYCMutation.isPending}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject KYC
                            </Button>
                          </div>
                        )}

                        {customer.kycVerifiedAt && (
                          <div className="text-sm text-muted-foreground">
                            Verified on {new Date(customer.kycVerifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="employment" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Employment Status</Label>
                            <Badge variant={customer.employmentStatus === "verified" ? "default" : "outline"}>
                              {customer.employmentStatus}
                            </Badge>
                          </div>
                          <div>
                            <Label>Contact</Label>
                            <p className="font-semibold">{customer.phone}</p>
                          </div>
                        </div>

                        {/* Employment Document Upload Simulation */}
                        <div className="space-y-2">
                          <Label>Employment Documents</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              Upload salary slips, employment letter, bank statements
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Simulated upload area - no actual file handling
                            </p>
                          </div>
                        </div>

                        {/* Employment Verification Notes */}
                        <div>
                          <Label>Verification Notes</Label>
                          <Textarea 
                            placeholder="Add notes about employment verification..."
                            className="min-h-[100px]"
                          />
                        </div>

                        {/* Employment Action Buttons */}
                        {customer.employmentStatus === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleEmploymentUpdate(customer.id, "verified")}
                              disabled={updateEmploymentMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify Employment
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleEmploymentUpdate(customer.id, "rejected")}
                              disabled={updateEmploymentMutation.isPending}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject Employment
                            </Button>
                          </div>
                        )}

                        {customer.employmentVerifiedAt && (
                          <div className="text-sm text-muted-foreground">
                            Verified on {new Date(customer.employmentVerifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">No customers found matching your criteria</p>
        </div>
      )}
    </div>
  );
}