import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Send, Eye, BarChart3, Users, Mail, Globe, Brain, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Types para outreach manager
interface ProspectData {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  industry: string;
  businessSize: 'small' | 'medium' | 'large' | 'enterprise';
  currentChallenges: string;
  targetAudience: string;
  currentWebsite: string;
  socialMediaPresence: string;
  goals: string;
}

interface AIBriefResult {
  websiteAnalysis: {
    score: number;
    issues: string[];
    recommendations: string[];
    competitorComparison: string;
  };
  socialMediaAnalysis: {
    score: number;
    platforms: string[];
    engagement: string;
    recommendations: string[];
  };
  digitalStrategy: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    quickWins: string[];
    longTermGoals: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
  };
  personalizedEmail: string;
  leadScore: number;
}

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  emailsSent: number;
  opensCount: number;
  clicksCount: number;
  repliesCount: number;
  createdAt: string;
}

export default function OutreachManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("research");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState<AIBriefResult | null>(null);

  // AI Brief form state
  const [prospectData, setProspectData] = useState<ProspectData>({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    industry: "",
    businessSize: "medium",
    currentChallenges: "",
    targetAudience: "",
    currentWebsite: "",
    socialMediaPresence: "",
    goals: ""
  });

  // Get campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["/api/outreach/campaigns"],
    retry: false,
  });

  // Get outreach analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/outreach/analytics"],
    retry: false,
  });

  // Generate AI Brief mutation
  const generateBriefMutation = useMutation({
    mutationFn: async (data: ProspectData) => {
      setIsGeneratingBrief(true);
      
      const response = await fetch("/api/ai/generate-prospect-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate AI brief");
      }
      
      return response.json();
    },
    onSuccess: (result: AIBriefResult) => {
      setGeneratedBrief(result);
      setIsGeneratingBrief(false);
      toast({
        title: "AI Brief Generated",
        description: "Prospect analysis complete! Review the insights and send the personalized email.",
      });
    },
    onError: (error: Error) => {
      setIsGeneratingBrief(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send outreach email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ prospectId, briefData }: { prospectId: number; briefData: AIBriefResult }) => {
      const response = await fetch("/api/outreach/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          emailContent: briefData.personalizedEmail,
          subject: `Strategic Digital Growth Analysis for ${prospectData.companyName}`,
          researchData: {
            websiteAnalysis: briefData.websiteAnalysis,
            socialMediaAnalysis: briefData.socialMediaAnalysis,
            digitalStrategy: briefData.digitalStrategy,
            leadScore: briefData.leadScore
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Personalized outreach email has been sent successfully with tracking enabled.",
      });
      // Reset form
      setProspectData({
        companyName: "",
        contactName: "",
        email: "",
        website: "",
        industry: "",
        businessSize: "medium",
        currentChallenges: "",
        targetAudience: "",
        currentWebsite: "",
        socialMediaPresence: "",
        goals: ""
      });
      setGeneratedBrief(null);
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/analytics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateBrief = () => {
    if (!prospectData.companyName || !prospectData.email || !prospectData.website) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least company name, email, and website to generate AI brief.",
        variant: "destructive",
      });
      return;
    }
    
    generateBriefMutation.mutate(prospectData);
  };

  const handleSendEmail = () => {
    if (!generatedBrief) return;
    
    // First create prospect, then send email
    sendEmailMutation.mutate({
      prospectId: 1, // This will be created by the API
      briefData: generatedBrief
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Outreach Manager</h2>
          <p className="text-slate-600 dark:text-slate-300">AI-powered prospect research and outreach campaigns</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="research">AI Research & Brief</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Prospect Research & Brief Generator
              </CardTitle>
              <CardDescription>
                Enter prospect information to generate personalized insights and outreach emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={prospectData.companyName}
                    onChange={(e) => setProspectData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={prospectData.contactName}
                    onChange={(e) => setProspectData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="e.g., John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={prospectData.email}
                    onChange={(e) => setProspectData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website *</Label>
                  <Input
                    id="website"
                    value={prospectData.website}
                    onChange={(e) => setProspectData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={prospectData.industry}
                    onChange={(e) => setProspectData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare, Retail"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessSize">Business Size</Label>
                  <Select 
                    value={prospectData.businessSize} 
                    onValueChange={(value) => setProspectData(prev => ({ ...prev, businessSize: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                      <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentChallenges">Current Business Challenges</Label>
                  <Textarea
                    id="currentChallenges"
                    value={prospectData.currentChallenges}
                    onChange={(e) => setProspectData(prev => ({ ...prev, currentChallenges: e.target.value }))}
                    placeholder="What challenges is this company facing?"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={prospectData.targetAudience}
                    onChange={(e) => setProspectData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="Who are their ideal customers?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="socialMediaPresence">Social Media Presence</Label>
                  <Input
                    id="socialMediaPresence"
                    value={prospectData.socialMediaPresence}
                    onChange={(e) => setProspectData(prev => ({ ...prev, socialMediaPresence: e.target.value }))}
                    placeholder="Instagram, Facebook, LinkedIn, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="goals">Business Goals</Label>
                  <Textarea
                    id="goals"
                    value={prospectData.goals}
                    onChange={(e) => setProspectData(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="What are they trying to achieve?"
                    rows={3}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateBrief}
                disabled={isGeneratingBrief}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {isGeneratingBrief ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Brief & Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedBrief && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  AI Analysis Complete
                </CardTitle>
                <CardDescription>
                  Lead Score: <Badge variant={generatedBrief.leadScore >= 75 ? "destructive" : generatedBrief.leadScore >= 50 ? "default" : "secondary"}>
                    {generatedBrief.leadScore}/100
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website Analysis (Score: {generatedBrief.websiteAnalysis.score}/100)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Issues Found:</strong>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                          {generatedBrief.websiteAnalysis.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Recommendations:</strong>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                          {generatedBrief.websiteAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Social Media Analysis (Score: {generatedBrief.socialMediaAnalysis.score}/100)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Platforms:</strong> {generatedBrief.socialMediaAnalysis.platforms.join(", ")}
                      </div>
                      <div>
                        <strong>Engagement:</strong> {generatedBrief.socialMediaAnalysis.engagement}
                      </div>
                      <div>
                        <strong>Recommendations:</strong>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                          {generatedBrief.socialMediaAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Digital Strategy & Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Priority Level:</strong> 
                      <Badge variant={generatedBrief.digitalStrategy.priority === 'critical' ? 'destructive' : 'default'} className="ml-2">
                        {generatedBrief.digitalStrategy.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <strong>Estimated Timeline:</strong> {generatedBrief.digitalStrategy.estimatedTimeline}
                    </div>
                    <div>
                      <strong>Estimated Budget:</strong> {generatedBrief.digitalStrategy.estimatedBudget}
                    </div>
                  </div>
                  <div className="mt-4">
                    <strong>Quick Wins:</strong>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                      {generatedBrief.digitalStrategy.quickWins.map((win, idx) => (
                        <li key={idx}>{win}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Personalized Outreach Email
                  </h4>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {generatedBrief.personalizedEmail}
                    </pre>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSendEmail}
                    disabled={sendEmailMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Outreach Email
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setGeneratedBrief(null)}
                  >
                    Generate New Brief
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Manage and track your outreach campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No campaigns yet. Create your first outreach email to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign: Campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{campaign.description}</p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{campaign.emailsSent}</div>
                          <div className="text-slate-500">Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{campaign.opensCount}</div>
                          <div className="text-slate-500">Opens</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{campaign.clicksCount}</div>
                          <div className="text-slate-500">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{campaign.repliesCount}</div>
                          <div className="text-slate-500">Replies</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Emails</p>
                    <p className="text-2xl font-bold">{analytics?.totalEmails || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-green-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Open Rate</p>
                    <p className="text-2xl font-bold">{analytics?.openRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click Rate</p>
                    <p className="text-2xl font-bold">{analytics?.clickRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Reply Rate</p>
                    <p className="text-2xl font-bold">{analytics?.replyRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed insights into your outreach effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Detailed analytics will appear here as you send more outreach emails.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}