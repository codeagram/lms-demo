import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertCircle, FileText, Users, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/financial-calculations";

interface LoanWithWorkflow {
  id: number;
  loanId: string;
  customerId: number;
  principalAmount: string;
  status: string;
  currentStep: string;
  agreementSigned: boolean;
  customer: {
    id: number;
    fullName: string;
    phone: string;
    kycStatus: string;
    employmentStatus: string;
  };
  creator: {
    fullName: string;
  };
}

interface WorkflowStep {
  id: number;
  loanId: number;
  step: string;
  status: string;
  assignedUserId?: number;
  completedBy?: number;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

interface WorkflowAlerts {
  pendingApprovals: number;
  stuckInVerification: number;
  details: {
    pendingApprovals: any[];
    stuckInVerification: any[];
  };
}

const stepLabels = {
  basic_details: "Basic Details",
  verification: "Verification",
  approval: "Approval",
  disbursement: "Disbursement",
  completed: "Completed"
};

const stepIcons = {
  basic_details: FileText,
  verification: Users,
  approval: CheckCircle,
  disbursement: CheckCircle,
  completed: CheckCircle
};

export default function Workflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLoan, setSelectedLoan] = useState<LoanWithWorkflow | null>(null);
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
  });

  const { data: workflowAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/dashboard/workflow-alerts"],
  });

  const { data: workflowSteps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["/api/loans", selectedLoan?.id, "workflow"],
    enabled: !!selectedLoan,
  });

  const advanceWorkflowMutation = useMutation({
    mutationFn: async ({ loanId, notes }: { loanId: number; notes: string }) => {
      return apiRequest(`/api/loans/${loanId}/advance-workflow`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/workflow-alerts"] });
      if (selectedLoan) {
        queryClient.invalidateQueries({ queryKey: ["/api/loans", selectedLoan.id, "workflow"] });
      }
      toast({
        title: "Success",
        description: "Workflow advanced successfully",
      });
      setWorkflowNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance workflow",
        variant: "destructive",
      });
    },
  });

  const filteredLoans = loans.filter((loan: LoanWithWorkflow) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending_approval") return loan.status === "pending" && loan.currentStep === "approval";
    if (filterStatus === "in_verification") return loan.status === "pending" && loan.currentStep === "verification";
    if (filterStatus === "basic_details") return loan.status === "draft" && loan.currentStep === "basic_details";
    return loan.status === filterStatus;
  });

  const getStepBadgeVariant = (step: string, currentStep: string) => {
    const steps = ["basic_details", "verification", "approval", "disbursement", "completed"];
    const stepIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(currentStep);
    
    if (stepIndex < currentIndex) return "default"; // Completed
    if (stepIndex === currentIndex) return "secondary"; // Current
    return "outline"; // Pending
  };

  const getStepStatus = (step: string, currentStep: string) => {
    const steps = ["basic_details", "verification", "approval", "disbursement", "completed"];
    const stepIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(currentStep);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const handleAdvanceWorkflow = () => {
    if (!selectedLoan) return;
    advanceWorkflowMutation.mutate({
      loanId: selectedLoan.id,
      notes: workflowNotes,
    });
  };

  if (loansLoading || alertsLoading) {
    return <div className="flex items-center justify-center h-64">Loading workflow data...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Loan Workflow Management</h1>
          <p className="text-muted-foreground">Manage loan applications through approval workflow</p>
        </div>
      </div>

      {/* Workflow Alerts */}
      {workflowAlerts && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowAlerts.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Loans waiting for approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stuck in Verification</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowAlerts.stuckInVerification}</div>
              <p className="text-xs text-muted-foreground">Over 7 days in verification</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="loans" className="w-full">
        <TabsList>
          <TabsTrigger value="loans">All Loans</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Label htmlFor="status-filter">Filter by Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                <SelectItem value="basic_details">Basic Details</SelectItem>
                <SelectItem value="in_verification">In Verification</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loans Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLoans.map((loan: LoanWithWorkflow) => (
              <Card key={loan.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{loan.loanId}</CardTitle>
                      <CardDescription>{loan.customer.fullName}</CardDescription>
                    </div>
                    <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                      {loan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Amount: <span className="font-semibold">{formatCurrency(loan.principalAmount)}</span>
                    </p>
                    <p className="text-sm">
                      Current Step: <Badge variant="outline">{stepLabels[loan.currentStep as keyof typeof stepLabels]}</Badge>
                    </p>
                    
                    {/* Workflow Progress */}
                    <div className="flex items-center space-x-2 mt-3">
                      {Object.keys(stepLabels).map((step, index) => {
                        const Icon = stepIcons[step as keyof typeof stepIcons];
                        const status = getStepStatus(step, loan.currentStep);
                        return (
                          <div key={step} className="flex items-center">
                            <div className={`p-1 rounded-full ${
                              status === "completed" ? "bg-green-100 text-green-600" :
                              status === "current" ? "bg-blue-100 text-blue-600" :
                              "bg-gray-100 text-gray-400"
                            }`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            {index < Object.keys(stepLabels).length - 1 && (
                              <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedLoan(loan)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Loan Workflow - {loan.loanId}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Customer</Label>
                                <p className="font-semibold">{loan.customer.fullName}</p>
                              </div>
                              <div>
                                <Label>Amount</Label>
                                <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                              </div>
                              <div>
                                <Label>Current Step</Label>
                                <Badge>{stepLabels[loan.currentStep as keyof typeof stepLabels]}</Badge>
                              </div>
                              <div>
                                <Label>Agreement Signed</Label>
                                <Badge variant={loan.agreementSigned ? "default" : "outline"}>
                                  {loan.agreementSigned ? "Yes" : "No"}
                                </Badge>
                              </div>
                            </div>

                            {/* KYC Status */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>KYC Status</Label>
                                <Badge variant={loan.customer.kycStatus === "verified" ? "default" : "outline"}>
                                  {loan.customer.kycStatus}
                                </Badge>
                              </div>
                              <div>
                                <Label>Employment Status</Label>
                                <Badge variant={loan.customer.employmentStatus === "verified" ? "default" : "outline"}>
                                  {loan.customer.employmentStatus}
                                </Badge>
                              </div>
                            </div>

                            {/* Advance Workflow */}
                            {loan.status === "pending" && (
                              <div className="space-y-3">
                                <Label htmlFor="workflow-notes">Notes for Next Step</Label>
                                <Textarea
                                  id="workflow-notes"
                                  value={workflowNotes}
                                  onChange={(e) => setWorkflowNotes(e.target.value)}
                                  placeholder="Add notes for the next step..."
                                />
                                <Button 
                                  onClick={handleAdvanceWorkflow}
                                  disabled={advanceWorkflowMutation.isPending}
                                >
                                  {advanceWorkflowMutation.isPending ? "Processing..." : "Advance to Next Step"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          {selectedLoan ? (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Steps for {selectedLoan.loanId}</CardTitle>
                <CardDescription>Track the progress of this loan through the approval process</CardDescription>
              </CardHeader>
              <CardContent>
                {stepsLoading ? (
                  <div>Loading workflow steps...</div>
                ) : (
                  <div className="space-y-4">
                    {workflowSteps.map((step: WorkflowStep) => (
                      <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className={`p-2 rounded-full ${
                          step.status === "completed" ? "bg-green-100 text-green-600" :
                          step.status === "pending" ? "bg-yellow-100 text-yellow-600" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                          {step.status === "completed" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{stepLabels[step.step as keyof typeof stepLabels]}</h4>
                            <Badge variant={step.status === "completed" ? "default" : "outline"}>
                              {step.status}
                            </Badge>
                          </div>
                          {step.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>
                          )}
                          {step.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed on {new Date(step.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Select a loan to view its workflow steps</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}