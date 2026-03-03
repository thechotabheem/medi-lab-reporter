import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, UserPlus, KeyRound, Trash2, Users, Eye, EyeOff, Pencil, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useActivityLogs } from '@/hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';
import { formatDateTime } from '@/lib/date-formats';

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  username: string | null;
  created_at: string;
  last_sign_in: string | null;
}

export default function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');

  // Reset password dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Activity logs
  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(100);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const callManageStaff = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('manage-staff', {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const fetchUsers = async () => {
    try {
      const data = await callManageStaff({ action: 'list' });
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error('Failed to load accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUsername || !newEmail || !newPassword || !newName) {
      toast.error('All fields are required');
      return;
    }
    setActionLoading(true);
    try {
      await callManageStaff({ action: 'create', email: newEmail, password: newPassword, full_name: newName, username: newUsername.trim().toLowerCase() });
      toast.success('Staff account created!');
      setCreateOpen(false);
      setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewName('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editName || !editEmail) {
      toast.error('Name and email are required');
      return;
    }
    setActionLoading(true);
    try {
      await callManageStaff({
        action: 'update',
        user_id: editUserId,
        full_name: editName,
        username: editUsername.trim().toLowerCase(),
        email: editEmail,
      });
      toast.success('Account updated!');
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setActionLoading(true);
    try {
      await callManageStaff({ action: 'reset-password', user_id: resetUserId, password: resetPassword });
      toast.success('Password reset successfully!');
      setResetOpen(false);
      setResetPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (targetId: string) => {
    setActionLoading(true);
    try {
      await callManageStaff({ action: 'delete', user_id: targetId });
      toast.success('Account deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (u: StaffUser) => {
    setEditUserId(u.id);
    setEditName(u.full_name);
    setEditUsername(u.username || '');
    setEditEmail(u.email);
    setEditOpen(true);
  };

  const staffCount = users.filter((u) => u.role !== 'admin').length;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '🆕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      default: return '📋';
    }
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Account Management"
        subtitle="Manage the 5 allowed accounts"
        icon={<ShieldCheck className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="accounts" className="gap-2">
                <Users className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4 sm:space-y-6">
              <FadeIn>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {users.length} / 5 accounts used ({staffCount} staff)
                    </span>
                  </div>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={users.length >= 5}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Staff Account</DialogTitle>
                        <DialogDescription>
                          Create a new staff account. They will be able to manage patients and reports.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input placeholder="Dr. John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input placeholder="e.g. staff.3" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="staff@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <div className="relative">
                            <Input type={showNewPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" minLength={6} />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={actionLoading}>
                          {actionLoading ? 'Creating...' : 'Create Account'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </FadeIn>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
              ) : (
                users.map((u, i) => (
                  <FadeIn key={u.id} delay={100 + i * 50}>
                    <Card className="group transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <IconWrapper variant={u.role === 'admin' ? 'default' : 'secondary'} size="default">
                              {u.role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                            </IconWrapper>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm sm:text-base truncate">{u.full_name}</span>
                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]">
                                  {u.role === 'admin' ? 'Admin' : 'Staff'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.username ? `@${u.username}` : u.email}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  {u.last_sign_in
                                    ? `Last login ${formatDistanceToNow(new Date(u.last_sign_in), { addSuffix: true })}`
                                    : 'Never logged in'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(u)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setResetUserId(u.id); setResetUserName(u.full_name); setResetPassword(''); setResetOpen(true);
                            }}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            {u.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {u.full_name}'s account? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(u.id)} disabled={actionLoading}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                ))
              )}
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="space-y-4">
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
              ) : !activityLogs?.length ? (
                <div className="text-center py-8 text-muted-foreground">No activity recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log: any) => (
                    <FadeIn key={log.id}>
                      <Card className="transition-all duration-200 hover:border-primary/20">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{getActionIcon(log.action)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{log.user_name}</span>
                                {' '}<span className="text-muted-foreground">{log.action}</span>{' '}
                                <span className="font-medium">{log.entity_type}</span>
                                {log.entity_name && (
                                  <span className="text-muted-foreground"> — {log.entity_name}</span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDateTime(log.created_at)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </FadeIn>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {resetUserName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showResetPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="pr-10" minLength={6} />
                <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={actionLoading}>
              {actionLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update staff account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EnhancedPageLayout>
  );
}
