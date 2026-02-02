import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContactSubmission, Testimonial, Invoice, Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, FileText, ReceiptText, RotateCw, FolderArchive, PenLine, CreditCard } from "lucide-react";
import ServiceStatusPanel from "@/components/admin/ServiceStatusPanel";
import { GmailTester } from "@/components/admin/GmailTester";
import StaffManagement from "@/components/dashboard/StaffManagement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatClientName } from "./FormatClientName";

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contacts");
  const [isCreatingInvoices, setIsCreatingInvoices] = useState(false);
  
  // Fetch invoices and clients
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });
  
  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });
  
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });
  
  // Fetch contact submissions
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/admin/contacts"],
  });
  
  // Fetch testimonials
  const { data: testimonials, isLoading: isLoadingTestimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });
  
  // Mutation to update contact submission
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, resolved }: { id: number, resolved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/contacts/${id}`, { resolved });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      toast({
        title: "Success",
        description: "Contact submission updated",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contact",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update testimonial
  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number, approved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/testimonials/${id}`, { approved });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({
        title: "Success",
        description: "Testimonial updated",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update testimonial",
        variant: "destructive",
      });
    },
  });
  
  // Handle marking contact as resolved/unresolved
  const handleContactUpdate = (id: number, resolved: boolean) => {
    updateContactMutation.mutate({ id, resolved });
  };
  
  // Handle approving/disapproving testimonial
  const handleTestimonialUpdate = (id: number, approved: boolean) => {
    updateTestimonialMutation.mutate({ id, approved });
  };
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return await res.json();
    },
    onSuccess: () => {
      setIsCreatingInvoices(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    },
  });
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  // Project mutations
  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectData.id}`, projectData);
      return await res.json();
    },
    onSuccess: () => {
      setEditingProject(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    },
  });
  
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const res = await apiRequest("POST", "/api/projects", projectData);
      return await res.json();
    },
    onSuccess: () => {
      setShowProjectForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.adminPanel")}</CardTitle>
        <CardDescription>Manage contacts, testimonials, and more</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="contacts">Contact Submissions</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="gmail">Gmail Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contacts">
            {isLoadingContacts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className={`border rounded-md p-4 ${contact.resolved ? 'opacity-70' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{contact.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contact.resolved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {contact.resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <a href={`mailto:${contact.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 border-t pt-2 whitespace-pre-line">
                      {contact.message}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(contact.createdAt).toLocaleString()}
                      </div>
                      <div>
                        {contact.resolved ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleContactUpdate(contact.id, false)}
                          >
                            Mark as Pending
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleContactUpdate(contact.id, true)}
                          >
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No contact submissions
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="testimonials">
            {isLoadingTestimonials ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : testimonials && testimonials.length > 0 ? (
              <div className="space-y-4">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className={`border rounded-md p-4 ${testimonial.approved ? '' : 'border-dashed'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{testimonial.name}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.position && testimonial.company 
                            ? `${testimonial.position}, ${testimonial.company}`
                            : testimonial.position || testimonial.company}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        testimonial.approved 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {testimonial.approved ? 'Approved' : 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 border-t pt-2 whitespace-pre-line">
                      {language === 'es' && testimonial.contentEs ? testimonial.contentEs : testimonial.content}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex">
                        {testimonial.rating && Array.from({ length: Math.floor(testimonial.rating) }).map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <div>
                        {testimonial.approved ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTestimonialUpdate(testimonial.id, false)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Unapprove
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleTestimonialUpdate(testimonial.id, true)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No testimonials
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setShowProjectForm(!showProjectForm)}>
                {showProjectForm ? 'Cancel' : 'New Project'}
              </Button>
            </div>
            
            {showProjectForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Project Title *
                      </label>
                      <Input 
                        id="title"
                        placeholder="Project Title"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <Textarea 
                        id="description"
                        placeholder="Project Description"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="client" className="block text-sm font-medium mb-1">
                        Client *
                      </label>
                      <select 
                        id="client"
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Seleccionar cliente</option>
                        {clients && clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {formatClientName(client)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          const titleEl = document.getElementById('title') as HTMLInputElement;
                          const descriptionEl = document.getElementById('description') as HTMLTextAreaElement;
                          const clientEl = document.getElementById('client') as HTMLSelectElement;
                          
                          if (!titleEl.value) {
                            toast({
                              title: "Error",
                              description: "Project title is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          if (!clientEl.value) {
                            toast({
                              title: "Error",
                              description: "Client is required",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          createProjectMutation.mutate({
                            title: titleEl.value,
                            description: descriptionEl.value,
                            clientId: parseInt(clientEl.value)
                          });
                        }}
                      >
                        {createProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Create Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {editingProject && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Edit Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
                        Project Title
                      </label>
                      <Input 
                        id="edit-title"
                        defaultValue={editingProject.title}
                        placeholder="Project Title"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <Textarea 
                        id="edit-description"
                        defaultValue={editingProject.description || ''}
                        placeholder="Project Description"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select 
                        id="edit-status"
                        defaultValue={editingProject.status || 'pending'}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingProject(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const titleEl = document.getElementById('edit-title') as HTMLInputElement;
                          const descriptionEl = document.getElementById('edit-description') as HTMLTextAreaElement;
                          const statusEl = document.getElementById('edit-status') as HTMLSelectElement;
                          
                          updateProjectMutation.mutate({
                            id: editingProject.id,
                            title: titleEl.value,
                            description: descriptionEl.value,
                            status: statusEl.value
                          });
                        }}
                      >
                        {updateProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Update Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className={`overflow-hidden ${
                      project.status === 'archived' ? 'opacity-60' : ''
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            {project.client && (
                              <CardDescription>
                                Cliente: {project.client.firstName} {project.client.lastName}
                              </CardDescription>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            project.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : project.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : project.status === 'archived'
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {project.status === 'in_progress' ? 'En Progreso' : 
                             project.status === 'completed' ? 'Completado' :
                             project.status === 'archived' ? 'Archivado' : 'Pendiente'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-gray-500">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            {project.status !== 'archived' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProject(project)}
                              >
                                <PenLine className="h-4 w-4" />
                              </Button>
                            )}
                            {project.status === 'archived' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProjectMutation.mutate({
                                  id: project.id,
                                  status: 'pending'
                                })}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProjectMutation.mutate({
                                  id: project.id,
                                  status: 'archived'
                                })}
                              >
                                <FolderArchive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No projects found
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="billing">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoices</h3>
                <Button onClick={() => setIsCreatingInvoices(!isCreatingInvoices)}>
                  {isCreatingInvoices ? 'Cancel' : 'Create Invoice'}
                </Button>
              </div>
              
              {isCreatingInvoices && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Create New Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="client" className="block text-sm font-medium mb-1">
                          Client *
                        </label>
                        <select 
                          id="client"
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Seleccionar cliente</option>
                          {clients && clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {formatClientName(client)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="project" className="block text-sm font-medium mb-1">
                          Project (Optional)
                        </label>
                        <select 
                          id="project"
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Project</option>
                          {projects && projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium mb-1">
                          Amount (USD) *
                        </label>
                        <Input 
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">
                          Description
                        </label>
                        <Textarea 
                          id="description"
                          placeholder="Invoice description"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                          Due Date *
                        </label>
                        <Input 
                          id="dueDate"
                          type="date"
                          className="w-full"
                          defaultValue={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => {
                            const clientEl = document.getElementById('client') as HTMLSelectElement;
                            const projectEl = document.getElementById('project') as HTMLSelectElement;
                            const amountEl = document.getElementById('amount') as HTMLInputElement;
                            const descriptionEl = document.getElementById('description') as HTMLTextAreaElement;
                            const dueDateEl = document.getElementById('dueDate') as HTMLInputElement;
                            
                            if (!clientEl.value) {
                              toast({
                                title: "Error",
                                description: "Client is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!amountEl.value || parseFloat(amountEl.value) <= 0) {
                              toast({
                                title: "Error",
                                description: "Amount must be greater than 0",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!dueDateEl.value) {
                              toast({
                                title: "Error",
                                description: "Due date is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            createInvoiceMutation.mutate({
                              userId: parseInt(clientEl.value),
                              projectId: projectEl.value ? parseInt(projectEl.value) : undefined,
                              amount: parseFloat(amountEl.value),
                              description: descriptionEl.value,
                              dueDate: dueDateEl.value,
                              // Campos adicionales necesarios para el esquema
                              total: parseFloat(amountEl.value),
                              issueDate: new Date().toISOString().split('T')[0]
                            });
                          }}
                        >
                          {createInvoiceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : null}
                          Create Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isLoadingInvoices ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : invoices && invoices.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary/10 text-left text-xs font-medium">
                        <th className="px-4 py-2">Invoice #</th>
                        <th className="px-4 py-2">Client</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Due Date</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                          <td className="px-4 py-3 text-xs font-medium">
                            {invoice.number || `INV-${invoice.id.toString().padStart(4, '0')}`}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {(invoice as any).clientName || 
                             (invoice.userId === 14 && invoice.number === '0001-MB' ? 'Maryuri Alba' : 
                             ((invoice as any).user ? `${(invoice as any).user.firstName || ''} ${(invoice as any).user.lastName || ''}` : '-'))}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">
                            ${invoice.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : invoice.status === 'partial'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {invoice.status === 'paid' ? 'Paid' : 
                              invoice.status === 'partial' ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              {/* Botón para ver la factura */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                                title="Ver y descargar factura en PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              
                              {/* Botón para pagar con Stripe si tiene enlace de pago */}
                              {invoice.status === 'pending' && invoice.paymentLink && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(invoice.paymentLink || '', '_blank')}
                                  title="Pagar con Stripe"
                                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No invoices found
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>
          
          <TabsContent value="services">
            <ServiceStatusPanel />
          </TabsContent>
          
          <TabsContent value="gmail">
            <Alert className="mb-4">
              <AlertTitle>Gmail API Debug Panel</AlertTitle>
              <AlertDescription>
                Test and debug Gmail API functionality.
              </AlertDescription>
            </Alert>
            <GmailTester />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
