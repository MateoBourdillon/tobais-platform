import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, AlertCircle, CheckCircle, Sparkles, Mail, Copy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIBriefResult {
  analysis: any;
  recommendations: any;
  personalizedEmail: string;
  leadScore: number;
}

export function AIBriefForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    website: "",
    industry: "",
    businessSize: "medium",
    currentChallenges: "",
    targetAudience: "",
    socialMediaPresence: "",
    businessGoals: ""
  });

  const [aiResult, setAiResult] = useState<AIBriefResult | null>(null);
  const [step, setStep] = useState<'input' | 'generated' | 'sent'>('input');

  const generateBriefMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/staff/generate-ai-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to generate AI brief");
      }
      
      return { aiResult: result, formData: data };
    },
    onSuccess: async ({ aiResult, formData }) => {
      setAiResult(aiResult);
      setStep('generated');
      
      // Automatically save the brief to database
      const briefData = {
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        website: formData.website,
        industry: formData.industry,
        businessSize: formData.businessSize,
        currentChallenges: formData.currentChallenges,
        targetAudience: formData.targetAudience,
        socialMediaPresence: formData.socialMediaPresence,
        businessGoals: formData.businessGoals,
        aiAnalysis: aiResult.analysis,
        aiRecommendations: aiResult.recommendations,
        personalizedEmail: aiResult.personalizedEmail,
        leadScore: aiResult.leadScore,
        status: 'generated',
        emailSent: false
      };
      
      try {
        await saveBriefMutation.mutateAsync(briefData);
        toast({
          title: "AI Brief Generated & Saved",
          description: "Your marketing brief has been created and saved successfully!",
        });
      } catch (error) {
        console.error('Error saving brief:', error);
        toast({
          title: "AI Brief Generated",
          description: "Brief was generated but failed to save. Please try saving manually.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI brief",
        variant: "destructive",
      });
    },
  });

  const saveBriefMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/staff/briefs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/dashboard"] });
    },
    onError: (error: any) => {
      console.error("Error saving brief:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save brief to database",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return await apiRequest("POST", "/api/staff/send-brief-email", emailData);
    },
    onSuccess: () => {
      setStep('sent');
      queryClient.invalidateQueries({ queryKey: ["/api/staff/briefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/dashboard"] });
      
      toast({
        title: "Email Sent",
        description: "Your personalized marketing email has been sent successfully!",
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

  const handleGenerate = () => {
    if (!formData.companyName || !formData.website || !formData.contactEmail) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in company name, website, and contact email.",
        variant: "destructive",
      });
      return;
    }

    generateBriefMutation.mutate(formData);
  };

  const handleSaveAndSend = async () => {
    if (!aiResult) return;

    try {
      // Since the brief is already saved automatically, we just need to send the email
      const uniqueSubmissionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await sendEmailMutation.mutateAsync({
        submissionId: uniqueSubmissionId,
        emailContent: aiResult.personalizedEmail,
        recipientEmail: formData.contactEmail,
        recipientName: formData.contactName,
        companyName: formData.companyName
      });
    } catch (error) {
      console.error('Error in save and send:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Email content copied to clipboard",
    });
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      contactName: "",
      contactEmail: "",
      website: "",
      industry: "",
      businessSize: "medium",
      currentChallenges: "",
      targetAudience: "",
      socialMediaPresence: "",
      businessGoals: ""
    });
    setAiResult(null);
    setStep('input');
  };

  if (step === 'sent') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">Email Sent Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your personalized marketing email has been sent to {formData.contactEmail} 
            and the brief has been saved to your submissions.
          </p>
          <Button onClick={resetForm} className="bg-gradient-to-r from-purple-600 to-blue-600">
            Create Another Brief
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'generated' && aiResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>AI-Generated Marketing Brief</span>
              <Badge variant="outline" className="ml-auto">
                Lead Score: {aiResult.leadScore}%
              </Badge>
            </CardTitle>
            <CardDescription>
              AI analysis and personalized email for {formData.companyName}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📧 Personalized Email</CardTitle>
            <CardDescription>Ready-to-send marketing email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                {aiResult.personalizedEmail}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(aiResult.personalizedEmail)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setStep('input')}
          >
            Back to Edit
          </Button>
          
          <Button
            onClick={handleSaveAndSend}
            disabled={saveBriefMutation.isPending || sendEmailMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {saveBriefMutation.isPending || sendEmailMutation.isPending ? (
              "Saving & Sending..."
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Save & Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>Create AI Marketing Brief</span>
        </CardTitle>
        <CardDescription>
          Enter prospect information to generate personalized marketing analysis and email content
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-600">Company Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="e.g., TechCorp Solutions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
                type="url"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="e.g., Software, Healthcare, Finance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessSize">Business Size</Label>
              <Select value={formData.businessSize} onValueChange={(value) => setFormData(prev => ({ ...prev, businessSize: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                  <SelectItem value="small">Small (11-50 employees)</SelectItem>
                  <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                  <SelectItem value="large">Large (200+ employees)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="e.g., John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="john@example.com"
                type="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialMediaPresence">Social Media Presence</Label>
              <Input
                id="socialMediaPresence"
                value={formData.socialMediaPresence}
                onChange={(e) => setFormData(prev => ({ ...prev, socialMediaPresence: e.target.value }))}
                placeholder="e.g., Strong LinkedIn, Active Instagram"
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-600">Business Context</h3>
          
          <div className="space-y-2">
            <Label htmlFor="currentChallenges">Current Marketing Challenges</Label>
            <Textarea
              id="currentChallenges"
              value={formData.currentChallenges}
              onChange={(e) => setFormData(prev => ({ ...prev, currentChallenges: e.target.value }))}
              placeholder="Describe their current marketing challenges or pain points..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Describe their target audience and customer base..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessGoals">Business Goals</Label>
            <Textarea
              id="businessGoals"
              value={formData.businessGoals}
              onChange={(e) => setFormData(prev => ({ ...prev, businessGoals: e.target.value }))}
              placeholder="What are their main business objectives and growth goals?"
              rows={3}
            />
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button
            onClick={handleGenerate}
            disabled={generateBriefMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            {generateBriefMutation.isPending ? (
              "Generating AI Brief..."
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Generate AI Marketing Brief
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}