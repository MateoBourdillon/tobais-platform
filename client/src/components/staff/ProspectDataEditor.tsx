import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, ArrowLeft, Sparkles } from "lucide-react";

interface ProspectDataEditorProps {
  brief: any;
  onBack: () => void;
}

export function ProspectDataEditor({ brief, onBack }: ProspectDataEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [prospectData, setProspectData] = useState({
    companyName: brief.companyName || "",
    contactName: brief.contactName || "",
    contactEmail: brief.contactEmail || "",
    website: brief.website || "",
    industry: brief.industry || "",
    businessSize: brief.businessSize || "medium",
    currentChallenges: brief.currentChallenges || "",
    targetAudience: brief.targetAudience || "",
    socialMediaPresence: brief.socialMediaPresence || "",
    businessGoals: brief.businessGoals || "",
  });

  const updateProspectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/staff/briefs/${brief.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Prospect Data Updated",
        description: "Prospect information has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update prospect data",
        variant: "destructive",
      });
    },
  });

  const regenerateBriefMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/staff/generate-ai-brief", {
        companyName: data.companyName,
        website: data.website,
        industry: data.industry,
        challenges: data.currentChallenges,
        audience: data.targetAudience
      });
    },
    onSuccess: async (result: any) => {
      // Update the brief with new AI content using correct property names from the API
      const updatedBrief = await updateProspectMutation.mutateAsync({
        ...prospectData,
        aiAnalysis: result.analysis,
        aiRecommendations: result.recommendations,
        personalizedEmail: result.personalizedEmail,
        leadScore: result.leadScore || 75,
        status: 'regenerated'
      });
      
      toast({
        title: "Brief Regenerated",
        description: "New AI analysis and email have been generated!",
      });
      
      // Navigate back to view the updated brief
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate brief",
        variant: "destructive",
      });
    },
  });

  const handleSaveProspectData = () => {
    if (!prospectData.companyName || !prospectData.contactEmail || !prospectData.website) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in company name, contact email, and website",
        variant: "destructive",
      });
      return;
    }

    updateProspectMutation.mutate({
      ...prospectData,
      status: 'prospect_updated'
    });
  };

  const handleRegenerateWithNewData = () => {
    if (!prospectData.companyName || !prospectData.contactEmail || !prospectData.website) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in company name, contact email, and website",
        variant: "destructive",
      });
      return;
    }

    regenerateBriefMutation.mutate(prospectData);
  };

  const handleInputChange = (field: string, value: string) => {
    setProspectData(prev => ({ ...prev, [field]: value }));
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
            <h2 className="text-2xl font-bold">Edit Prospect Data</h2>
            <p className="text-gray-600">Update prospect information and regenerate AI brief</p>
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

      {/* Prospect Data Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={prospectData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  value={prospectData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={prospectData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessSize">Business Size</Label>
                <Select
                  value={prospectData.businessSize}
                  onValueChange={(value) => handleInputChange("businessSize", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                    <SelectItem value="small">Small (11-50 employees)</SelectItem>
                    <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={prospectData.contactName}
                  onChange={(e) => handleInputChange("contactName", e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={prospectData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Business Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentChallenges">Current Challenges</Label>
                <Textarea
                  id="currentChallenges"
                  value={prospectData.currentChallenges}
                  onChange={(e) => handleInputChange("currentChallenges", e.target.value)}
                  placeholder="What challenges is the company facing?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  value={prospectData.targetAudience}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                  placeholder="Who is their target audience?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMediaPresence">Social Media Presence</Label>
                <Textarea
                  id="socialMediaPresence"
                  value={prospectData.socialMediaPresence}
                  onChange={(e) => handleInputChange("socialMediaPresence", e.target.value)}
                  placeholder="Describe their current social media presence"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessGoals">Business Goals</Label>
                <Textarea
                  id="businessGoals"
                  value={prospectData.businessGoals}
                  onChange={(e) => handleInputChange("businessGoals", e.target.value)}
                  placeholder="What are their business goals?"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleSaveProspectData}
          disabled={updateProspectMutation.isPending}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {updateProspectMutation.isPending ? "Saving..." : "Save Prospect Data"}
        </Button>
        
        <Button
          onClick={handleRegenerateWithNewData}
          disabled={regenerateBriefMutation.isPending || updateProspectMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {regenerateBriefMutation.isPending ? "Regenerating..." : "Save & Regenerate AI Brief"}
        </Button>
      </div>
    </div>
  );
}