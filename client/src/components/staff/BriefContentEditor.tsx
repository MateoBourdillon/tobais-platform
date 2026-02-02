import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Mail, Copy, ArrowLeft } from "lucide-react";

interface BriefContentEditorProps {
  brief: any;
  onBack: () => void;
}

export function BriefContentEditor({ brief, onBack }: BriefContentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editedContent, setEditedContent] = useState({
    personalizedEmail: brief.personalizedEmail || "",
    aiAnalysis: JSON.stringify(brief.aiAnalysis || {}, null, 2),
    aiRecommendations: JSON.stringify(brief.aiRecommendations || {}, null, 2),
    leadScore: brief.leadScore || 0,
  });

  const updateBriefMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/staff/briefs/${brief.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Brief Updated",
        description: "Your brief content has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update brief",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/staff/send-brief-email", {
        submissionId: brief.submissionId,
        emailContent: editedContent.personalizedEmail,
        recipientEmail: brief.contactEmail,
        recipientName: brief.contactName, 
        companyName: brief.companyName
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Updated email has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Email Send Failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    let parsedAnalysis, parsedRecommendations;
    
    try {
      parsedAnalysis = JSON.parse(editedContent.aiAnalysis);
      parsedRecommendations = JSON.parse(editedContent.aiRecommendations);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your AI Analysis or Recommendations JSON format",
        variant: "destructive",
      });
      return;
    }

    updateBriefMutation.mutate({
      personalizedEmail: editedContent.personalizedEmail,
      aiAnalysis: parsedAnalysis,
      aiRecommendations: parsedRecommendations,
      leadScore: editedContent.leadScore,
      status: 'edited'
    });
  };

  const handleSendUpdatedEmail = () => {
    if (!editedContent.personalizedEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please add email content before sending",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      submissionId: brief.submissionId,
      emailContent: editedContent.personalizedEmail,
      recipientEmail: brief.contactEmail,
      recipientName: brief.contactName,
      companyName: brief.companyName
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Briefs
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Edit Brief Content</h2>
            <p className="text-gray-600">{brief.companyName} - {brief.contactName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={brief.status === 'sent' ? 'default' : 'secondary'}>
            {brief.status}
          </Badge>
          <Badge variant="outline">
            Score: {brief.leadScore}%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Email Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personalized Email
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(editedContent.personalizedEmail)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedContent.personalizedEmail}
                onChange={(e) => setEditedContent(prev => ({ ...prev, personalizedEmail: e.target.value }))}
                placeholder="Edit the personalized email content..."
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editedContent.leadScore}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, leadScore: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Analysis & Recommendations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Analysis
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(editedContent.aiAnalysis)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedContent.aiAnalysis}
                onChange={(e) => setEditedContent(prev => ({ ...prev, aiAnalysis: e.target.value }))}
                placeholder="Edit AI analysis (JSON format)..."
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                AI Recommendations
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(editedContent.aiRecommendations)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedContent.aiRecommendations}
                onChange={(e) => setEditedContent(prev => ({ ...prev, aiRecommendations: e.target.value }))}
                placeholder="Edit AI recommendations (JSON format)..."
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={updateBriefMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateBriefMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        
        <Button
          onClick={handleSendUpdatedEmail}
          disabled={sendEmailMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          <Mail className="w-4 h-4 mr-2" />
          {sendEmailMutation.isPending ? "Sending..." : "Send Updated Email"}
        </Button>
      </div>
    </div>
  );
}