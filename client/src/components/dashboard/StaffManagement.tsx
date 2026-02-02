import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Plus, User, Shield, Mail, Phone, Calendar, Trash2, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types para staff management
interface StaffMember {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  adminLevel: number;
  isActive: boolean;
  createdAt: string;
  emailVerified: boolean;
}

interface CreateStaffData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  adminLevel: number;
  temporaryPassword: string;
}

export default function StaffManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form state for creating/editing staff
  const [formData, setFormData] = useState<CreateStaffData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "staff",
    adminLevel: 1,
    temporaryPassword: ""
  });

  // Query to get all staff members
  const { data: staffMembers = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/staff"],
    retry: false,
  });

  // Mutation to create new staff member
  const createStaffMutation = useMutation({
    mutationFn: async (data: CreateStaffData) => {
      const response = await apiRequest("POST", "/api/admin/staff", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff member created",
        description: "The new staff member has been successfully created and will receive login instructions via email.",
      });
      setIsCreatingStaff(false);
      setFormData({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "staff",
        adminLevel: 1,
        temporaryPassword: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update staff member
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StaffMember> }) => {
      const response = await apiRequest("PATCH", `/api/admin/staff/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff updated",
        description: "Staff member information has been updated successfully.",
      });
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete staff member
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/staff/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff member removed",
        description: "The staff member has been successfully removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateStaffMutation.mutate({ 
        id: editingStaff.id, 
        data: {
          ...formData,
          isActive: editingStaff.isActive
        }
      });
    } else {
      createStaffMutation.mutate(formData);
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setFormData({
      username: staff.username,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      phone: staff.phone || "",
      role: staff.role,
      adminLevel: staff.adminLevel,
      temporaryPassword: ""
    });
    setEditingStaff(staff);
    setIsCreatingStaff(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this staff member? This action cannot be undone.")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const toggleStaffStatus = (staff: StaffMember) => {
    updateStaffMutation.mutate({
      id: staff.id,
      data: { isActive: !staff.isActive }
    });
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, temporaryPassword: password }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load staff members. Please check your permissions and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Management</h2>
          <p className="text-slate-600 dark:text-slate-300">Manage your team members and their permissions</p>
        </div>
        <Button 
          onClick={() => setIsCreatingStaff(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {isCreatingStaff && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              {editingStaff ? "Edit Staff Member" : "Create New Staff Member"}
            </CardTitle>
            <CardDescription>
              {editingStaff ? "Update staff member information and permissions" : "Add a new team member with appropriate access levels"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff - Outreach & Research</SelectItem>
                      <SelectItem value="admin">Admin - Full Access</SelectItem>
                      <SelectItem value="manager">Manager - Team Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminLevel">Access Level</Label>
                  <Select 
                    value={formData.adminLevel.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, adminLevel: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Basic Outreach</SelectItem>
                      <SelectItem value="2">Level 2 - Advanced Research</SelectItem>
                      <SelectItem value="3">Level 3 - Campaign Management</SelectItem>
                      <SelectItem value="4">Level 4 - Analytics & Reports</SelectItem>
                      <SelectItem value="5">Level 5 - Full Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temporaryPassword">Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="temporaryPassword"
                      type="text"
                      value={formData.temporaryPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                      required={!editingStaff}
                      placeholder={editingStaff ? "Leave empty to keep current password" : ""}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generatePassword}
                      className="shrink-0"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingStaff ? "Update Staff Member" : "Create Staff Member"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingStaff(false);
                    setEditingStaff(null);
                    setFormData({
                      username: "",
                      email: "",
                      firstName: "",
                      lastName: "",
                      phone: "",
                      role: "staff",
                      adminLevel: 1,
                      temporaryPassword: ""
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {staffMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-slate-500 dark:text-slate-400">
                No staff members found. Create your first team member to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          staffMembers.map((staff: StaffMember) => (
            <Card key={staff.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">@{staff.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{staff.email}</span>
                        {staff.phone && (
                          <>
                            <Phone className="h-3 w-3 text-slate-400 ml-2" />
                            <span className="text-xs text-slate-500">{staff.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={staff.role === 'admin' ? 'destructive' : staff.role === 'manager' ? 'default' : 'secondary'}>
                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">Level {staff.adminLevel}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${staff.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-slate-500">
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(staff)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStaffStatus(staff)}
                        className="h-8 w-8 p-0"
                      >
                        <Switch checked={staff.isActive} className="pointer-events-none" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(staff.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}