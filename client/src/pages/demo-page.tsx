import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const demoFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  industry: z.string().optional(),
  goal: z.string().min(1, "Goal is required"),
  style: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  hasWebsite: z.string().optional(),
  websiteQuality: z.string().optional(),
  hasSocialMedia: z.string().optional(),
  socialMediaQuality: z.string().optional(),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

interface AIBriefResponse {
  title?: string;
  summary?: string;
  bullets?: string[];
  [key: string]: any;
}

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      industry: "",
      goal: "",
      style: "",
      budget: "",
      notes: "",
      hasWebsite: "",
      websiteQuality: "",
      hasSocialMedia: "",
      socialMediaQuality: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiRequest("POST", "/api/ai-brief", data);
      const responseData = await result.json();
      
      if (result.ok) {
        setResponse(responseData);
      } else {
        setError(responseData.error || "An error occurred");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 relative">
      {/* Navigation Button - Back to Home */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => window.location.href = '/'}
        className="fixed top-6 left-6 z-50 group flex items-center space-x-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/30 dark:border-slate-700/30 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 shadow-lg"
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors" />
        <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 font-medium">Menú Principal</span>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-slate-200/20 dark:bg-slate-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </motion.button>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            AI Brief Demo
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Submit your project requirements and get AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Project Brief
              </CardTitle>
              <CardDescription>
                Tell us about your project and we'll provide AI-generated recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Goal *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you want to achieve with this project..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Style</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Modern, Traditional, Minimalist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $5,000 - $10,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quick Assessment Questions */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Quick Assessment (helps us provide better recommendations)
                    </h4>
                    
                    <FormField
                      control={form.control}
                      name="hasWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you currently have a website?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no">No, we don't have one</SelectItem>
                              <SelectItem value="basic">Yes, but it's very basic</SelectItem>
                              <SelectItem value="yes">Yes, we have a good website</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("hasWebsite") === "no" && (
                      <FormField
                        control={form.control}
                        name="websiteQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What type of website would you love to have?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose your vision" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic_contact">Basic Contact Site - Simple way for customers to reach me</SelectItem>
                                <SelectItem value="modern_minimal">Modern & Minimalist - Clean, professional, impressive</SelectItem>
                                <SelectItem value="ai_powered">AI-Powered Website - Smart features that wow visitors</SelectItem>
                                <SelectItem value="full_platform">Complete Business Platform - E-commerce, booking, everything automated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("hasWebsite") && form.watch("hasWebsite") !== "no" && (
                      <FormField
                        control={form.control}
                        name="websiteQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How would you rate your current website?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="poor">Needs major improvements</SelectItem>
                                <SelectItem value="outdated">Outdated, needs refresh</SelectItem>
                                <SelectItem value="good">It's decent but could be better</SelectItem>
                                <SelectItem value="want_better">Good, but want something amazing</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="hasSocialMedia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How active is your company on social media?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no">Not active at all</SelectItem>
                              <SelectItem value="limited">Very limited presence</SelectItem>
                              <SelectItem value="basic">Basic presence, inconsistent posting</SelectItem>
                              <SelectItem value="active">Active but could be more strategic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("hasSocialMedia") === "no" && (
                      <FormField
                        control={form.control}
                        name="socialMediaQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What kind of social media presence would drive your business?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose your impact level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic_presence">Basic Presence - Just be visible and professional</SelectItem>
                                <SelectItem value="engagement_focused">Engagement-Focused - Build community and followers</SelectItem>
                                <SelectItem value="ai_automated">AI-Automated Strategy - Smart content that converts</SelectItem>
                                <SelectItem value="viral_growth">Viral Growth Machine - Content that spreads like wildfire</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("hasSocialMedia") && form.watch("hasSocialMedia") !== "no" && (
                      <FormField
                        control={form.control}
                        name="socialMediaQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How would you describe your social media strategy?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="poor">Random posts, no real strategy</SelectItem>
                                <SelectItem value="basic">Some planning but inconsistent</SelectItem>
                                <SelectItem value="good">Good content but want better results</SelectItem>
                                <SelectItem value="want_better">Solid strategy but want to scale up</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional details or requirements..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Brief
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {response ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                AI Response
              </CardTitle>
              <CardDescription>
                AI-generated insights and recommendations for your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Analyzing your brief with AI...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                </div>
              )}

              {response && (
                <div className="space-y-4">
                  {response.title && (
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {response.title}
                      </h2>
                    </div>
                  )}

                  {response.summary && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Summary
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {response.summary}
                      </p>
                    </div>
                  )}

                  {response.bullets && Array.isArray(response.bullets) && response.bullets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {response.bullets.map((bullet, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-400">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show any additional fields from the response */}
                  {Object.entries(response).map(([key, value]) => {
                    if (key === 'title' || key === 'summary' || key === 'bullets') return null;
                    if (typeof value === 'string' && value.trim()) {
                      return (
                        <div key={key}>
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400">{value}</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {!isLoading && !error && !response && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Submit your brief to see AI-generated insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}