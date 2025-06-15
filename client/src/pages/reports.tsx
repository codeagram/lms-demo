import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Calculator, 
  History, 
  Settings,
  Download,
  Eye,
  Calendar
} from "lucide-react";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface RecentReport {
  id: string;
  name: string;
  generatedDate: string;
  generatedBy: string;
  size: string;
  type: 'pdf' | 'excel' | 'csv';
}

const reportTypes: ReportType[] = [
  {
    id: 'loan-portfolio',
    name: 'Loan Portfolio Report',
    description: 'Comprehensive overview of all active loans, disbursements, and collections',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'customer-ledger',
    name: 'Customer Ledger',
    description: 'Detailed customer-wise transaction history and outstanding balances',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'collection-report',
    name: 'Collection Report',
    description: 'EMI collection efficiency, overdue analysis, and recovery metrics',
    icon: TrendingUp,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Profit & loss, interest income, penalty collections, and expense tracking',
    icon: Calculator,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'audit-trail',
    name: 'Audit Trail',
    description: 'Complete audit log of all system activities and user actions',
    icon: History,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  {
    id: 'custom-report',
    name: 'Custom Report Builder',
    description: 'Create custom reports with specific filters and data points',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

const mockRecentReports: RecentReport[] = [
  {
    id: '1',
    name: 'Monthly Portfolio Report - November 2024',
    generatedDate: 'Dec 10, 2024',
    generatedBy: 'Admin User',
    size: '2.3 MB',
    type: 'pdf',
  },
  {
    id: '2',
    name: 'Customer Ledger Export - All Customers',
    generatedDate: 'Dec 08, 2024',
    generatedBy: 'Staff User',
    size: '1.8 MB',
    type: 'excel',
  },
  {
    id: '3',
    name: 'Overdue Loans Report - December 2024',
    generatedDate: 'Dec 05, 2024',
    generatedBy: 'Admin User',
    size: '950 KB',
    type: 'csv',
  },
];

export default function Reports() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async (reportType: ReportType) => {
    setGeneratingReport(reportType.id);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Report Generated",
      description: `${reportType.name} has been generated successfully.`,
    });
    
    setGeneratingReport(null);
  };

  const handleDownloadReport = (report: RecentReport) => {
    toast({
      title: "Download Started",
      description: `Downloading ${report.name}...`,
    });
  };

  const handleViewReport = (report: RecentReport) => {
    toast({
      title: "Opening Report",
      description: `Opening ${report.name} in viewer...`,
    });
  };

  const getFileIcon = (type: string) => {
    const iconClass = "w-10 h-10 rounded-lg flex items-center justify-center";
    switch (type) {
      case 'pdf':
        return <div className={`${iconClass} bg-red-100`}><FileText className="text-red-600" /></div>;
      case 'excel':
        return <div className={`${iconClass} bg-green-100`}><FileText className="text-green-600" /></div>;
      case 'csv':
        return <div className={`${iconClass} bg-yellow-100`}><FileText className="text-yellow-600" /></div>;
      default:
        return <div className={`${iconClass} bg-gray-100`}><FileText className="text-gray-600" /></div>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Comprehensive business reports and insights</p>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((reportType) => {
          const Icon = reportType.icon;
          const isGenerating = generatingReport === reportType.id;
          
          return (
            <Card 
              key={reportType.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => !isGenerating && handleGenerateReport(reportType)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${reportType.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`${reportType.color} text-xl`} size={24} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport(reportType);
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Download size={16} />
                    )}
                  </Button>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {reportType.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {reportType.description}
                </p>
                
                <div className={`flex items-center text-sm font-medium ${reportType.color}`}>
                  <span>{isGenerating ? "Generating..." : "Generate Report"}</span>
                  {!isGenerating && <span className="ml-2">→</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {mockRecentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">No reports generated yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Generate your first report using the options above
                </p>
              </div>
            ) : (
              mockRecentReports.map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    {getFileIcon(report.type)}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {report.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Generated on {report.generatedDate} by {report.generatedBy}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{report.size}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadReport(report)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Download size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
