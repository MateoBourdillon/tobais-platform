import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Brain, Mail, Eye, Calendar, Search, Filter, Trash2, Edit, Send, Copy, ExternalLink, RefreshCw, Download, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AIBriefSubmission {
  id: number;
  submissionId: string;
  companyName: string;
  contactName?: string;
  contactEmail: string;
  website: string;
  industry?: string;
  businessSize: string;
  personalizedEmail?: string;
  leadScore: number;
  status: string;
  emailSent: boolean;
  sentAt?: string;
  emailOpened?: boolean;
  openedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BriefsListProps {
  onEditContent?: (brief: AIBriefSubmission) => void;
  onEditProspect?: (brief: AIBriefSubmission) => void;
}

export function BriefsList({ onEditContent, onEditProspect }: BriefsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrief, setSelectedBrief] = useState<AIBriefSubmission | null>(null);

  // Fetch briefs data
  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ["/api/staff/briefs", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/staff/briefs?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch briefs");
      }
      
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  const deleteBriefMutation = useMutation({
    mutationFn: async (briefId: number) => {
      return apiRequest("DELETE", `/api/staff/briefs/${briefId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/dashboard"] });
      toast({
        title: "Brief Deleted",
        description: "The AI brief has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete brief",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (brief: AIBriefSubmission) => {
      return apiRequest("POST", "/api/staff/send-brief-email", {
        submissionId: brief.submissionId,
        emailContent: brief.personalizedEmail,
        recipientEmail: brief.contactEmail,
        recipientName: brief.contactName,
        companyName: brief.companyName
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/dashboard"] });
      toast({
        title: "Email Sent",
        description: "The marketing email has been sent successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Send Failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  // Filter briefs based on search term
  const filteredBriefs = briefs.filter((brief: AIBriefSubmission) =>
    brief.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brief.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brief.industry && brief.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'generated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} copied to clipboard`,
    });
  };

  const handleExportCSV = () => {
    const link = document.createElement('a');
    link.href = '/api/staff/briefs/export';
    link.download = `tobais_briefs_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Started",
      description: "Your CSV report is being downloaded",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2">Loading your briefs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>My AI Marketing Briefs</span>
              </CardTitle>
              <CardDescription>Manage and track your AI-generated marketing briefs</CardDescription>
            </div>
            
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Briefs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by company, email, or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Briefs</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Briefs List */}
      {filteredBriefs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Briefs Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" 
                ? "No briefs match your current filters." 
                : "You haven't created any AI briefs yet. Create your first one to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredBriefs.map((brief: AIBriefSubmission) => (
            <Card key={brief.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{brief.companyName}</h3>
                      <Badge variant="secondary" className="text-xs font-mono bg-gray-100 text-gray-700">
                        ID: {brief.submissionId}
                      </Badge>
                      <Badge className={getStatusColor(brief.status)}>
                        {brief.status}
                      </Badge>
                      {brief.emailSent && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Mail className="w-3 h-3 mr-1" />
                          Email Sent
                        </Badge>
                      )}
                      {brief.emailOpened && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Email Opened ✅
                        </Badge>
                      )}
                      {brief.emailEffective === 1 && (
                        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Client Clicked Consultation! 🎯
                        </Badge>
                      )}
                      {brief.emailSent && !brief.emailOpened && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Not Opened Yet
                        </Badge>
                      )}
                      <Badge variant="outline" className={getLeadScoreColor(brief.leadScore)}>
                        Score: {brief.leadScore}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Contact:</span> {brief.contactEmail}
                      </div>
                      <div>
                        <span className="font-medium">Industry:</span> {brief.industry || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {brief.businessSize}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Created: {format(new Date(brief.createdAt), 'MMM d, yyyy h:mm a')}
                      {brief.sentAt && (
                        <span className="ml-4">
                          Sent: {format(new Date(brief.sentAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                      {brief.openedAt && (
                        <span className="ml-4 text-blue-600">
                          Opened: {format(new Date(brief.openedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* View Details */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedBrief(brief)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <span>{brief.companyName} - AI Brief</span>
                            <Badge className={getStatusColor(brief.status)}>
                              {brief.status}
                            </Badge>
                          </DialogTitle>
                          <DialogDescription>
                            AI-generated marketing brief and personalized email content
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Company Details */}
                          <div>
                            <h4 className="font-semibold mb-3">Company Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><span className="font-medium">Website:</span> 
                                <a href={brief.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                  {brief.website}
                                  <ExternalLink className="w-3 h-3 inline ml-1" />
                                </a>
                              </div>
                              <div><span className="font-medium">Contact:</span> {brief.contactName || 'Not provided'}</div>
                              <div><span className="font-medium">Email:</span> 
                                <button 
                                  onClick={() => copyToClipboard(brief.contactEmail, "Email")}
                                  className="text-blue-600 hover:underline ml-1"
                                >
                                  {brief.contactEmail} <Copy className="w-3 h-3 inline" />
                                </button>
                              </div>
                              <div><span className="font-medium">Industry:</span> {brief.industry || 'Not specified'}</div>
                            </div>
                          </div>

                          {/* Personalized Email */}
                          {brief.personalizedEmail && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold">Generated Email Content</h4>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(brief.personalizedEmail!, "Email content")}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap text-sm font-mono">
                                {brief.personalizedEmail}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Brief Content */}
                    {onEditContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditContent(brief)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        title="Edit AI-generated content"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Edit Prospect Data & Regenerate */}
                    {onEditProspect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditProspect(brief)}
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                        title="Edit prospect data & regenerate AI brief"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Send Email (if not sent) */}
                    {brief.personalizedEmail && !brief.emailSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendEmailMutation.mutate(brief)}
                        disabled={sendEmailMutation.isPending}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete Brief */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete AI Brief</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the brief for {brief.companyName}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBriefMutation.mutate(brief.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}