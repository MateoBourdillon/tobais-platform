import { useState } from "react";
import { useStaffAuth } from "@/hooks/use-staff-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart3, Mail, Eye, Target, LogOut, Plus, Send, Users, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AIBriefForm } from "@/components/staff/AIBriefForm";
import { BriefsList } from "@/components/staff/BriefsList";
import { StaffAnalytics } from "@/components/staff/StaffAnalytics";
import { BriefContentEditor } from "@/components/staff/BriefContentEditor";
import { ProspectDataEditor } from "@/components/staff/ProspectDataEditor";
import { apiRequest } from "@/lib/queryClient";

export function StaffDashboardPage() {
  const { user, logout } = useStaffAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingBrief, setEditingBrief] = useState<any>(null);
  const [editMode, setEditMode] = useState<"content" | "prospect" | null>(null);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/staff/dashboard"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <p className="text-lg">Please log in to access your dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-indigo-900/10">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  TOBAIS Staff Portal
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Marketing Outreach</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600 capitalize">{user.role}</p>
            </div>
            <a 
              href="/"
              className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-7a1 1 0 011-1h2a1 1 0 011 1v7a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </a>
            <Button
              variant="outline"
              onClick={() => logout()}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="create-brief" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Brief</span>
            </TabsTrigger>
            <TabsTrigger value="my-briefs" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>My Briefs</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back, {user.firstName}!</CardTitle>
                  <CardDescription className="text-purple-100">
                    Ready to create powerful AI-generated marketing briefs and outreach campaigns?
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Stats Overview */}
              {dashboardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Briefs</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {dashboardData?.totalBriefs || 0}
                          </p>
                        </div>
                        <Brain className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {dashboardData?.emailsSent || 0}
                          </p>
                        </div>
                        <Send className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Page Visits</p>
                          <p className="text-3xl font-bold text-green-600">
                            {dashboardData?.contactPageVisits || 0}
                          </p>
                        </div>
                        <Eye className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {dashboardData?.conversionRate || 0}%
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent AI Briefs</CardTitle>
                  <CardDescription>Your latest marketing brief submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.recentSubmissions?.length ? (
                    <div className="space-y-4">
                      {dashboardData.recentSubmissions.slice(0, 5).map((submission: any) => (
                        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{submission.companyName}</p>
                            <p className="text-sm text-gray-600">{submission.industry || 'No industry specified'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              submission.status === 'sent' ? 'default' :
                              submission.status === 'generated' ? 'secondary' :
                              'outline'
                            }>
                              {submission.status}
                            </Badge>
                            {submission.emailSent && (
                              <Badge variant="outline" className="text-green-600">
                                <Mail className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No AI briefs created yet</p>
                      <p className="text-sm mt-2">Start by creating your first marketing brief!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Create Brief Tab */}
          <TabsContent value="create-brief">
            <AIBriefForm />
          </TabsContent>

          {/* My Briefs Tab */}
          <TabsContent value="my-briefs">
            {editingBrief && editMode === "content" ? (
              <BriefContentEditor 
                brief={editingBrief} 
                onBack={() => {
                  setEditingBrief(null);
                  setEditMode(null);
                }}
              />
            ) : editingBrief && editMode === "prospect" ? (
              <ProspectDataEditor 
                brief={editingBrief} 
                onBack={() => {
                  setEditingBrief(null);
                  setEditMode(null);
                }}
              />
            ) : (
              <BriefsList 
                onEditContent={(brief) => {
                  setEditingBrief(brief);
                  setEditMode("content");
                }}
                onEditProspect={(brief) => {
                  setEditingBrief(brief);
                  setEditMode("prospect");
                }}
              />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <StaffAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}