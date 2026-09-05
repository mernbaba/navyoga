import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Bell, Plus, Search, Send, Eye, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { listNotifications, createNotification, updateNotification, deleteNotification } from "../../api/notifications";
import type { Notification, NotificationAudience } from "../../api/types";

const AUDIENCES: { value: NotificationAudience; label: string }[] = [
  { value: "ALL_USERS", label: "All Users" },
  { value: "ACTIVE_STUDENTS", label: "Active Sādhakas" },
  { value: "PREMIUM_MEMBERS", label: "Premium Members" },
];

const audienceLabel = (value: string | undefined | null): string =>
  AUDIENCES.find((a) => a.value === value)?.label ?? "All users";

type FormState = {
  title: string;
  message: string;
  targetAudience: NotificationAudience;
  scheduledDate: string;
};

const emptyForm: FormState = {
  title: "",
  message: "",
  targetAudience: "ALL_USERS",
  scheduledDate: "",
};

export function OperationsNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editing, setEditing] = useState<Notification | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isUpdating, setIsUpdating] = useState(false);

  const [viewing, setViewing] = useState<Notification | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listNotifications("OPERATIONS", { q: debouncedTerm || undefined, page, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load notifications.");
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, page, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const buildBody = (form: FormState) => ({
    title: form.title,
    message: form.message,
    targetAudience: form.targetAudience,
    scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : undefined,
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      await createNotification("OPERATIONS", buildBody(createForm));
      toast.success("Notification created");
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create notification.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (notification: Notification) => {
    setEditing(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      targetAudience: notification.targetAudience,
      scheduledDate: notification.scheduledDate ? notification.scheduledDate.slice(0, 16) : "",
    });
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateNotification("OPERATIONS", editing.id, {
        ...buildBody(editForm),
        scheduledDate: editForm.scheduledDate
          ? new Date(editForm.scheduledDate).toISOString()
          : null,
      });
      toast.success("Notification updated");
      setEditing(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update notification.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!confirm(`Delete "${notification.title}"?`)) return;
    try {
      await deleteNotification("OPERATIONS", notification.id);
      toast.success("Notification deleted");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete notification.");
    }
  };

  const metrics = [
    { title: "Total", value: String(total), icon: Bell, color: "#ff691d" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>App Notifications</h1>
          <p className="text-muted-foreground mt-1">Send messages to sādhakas and staff</p>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: metric.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent><div className="text-2xl font-semibold">{metric.value}</div></CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle style={{ color: "#ff691d" }}>All Notifications</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-4 h-4 pointer-events-none z-10" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2" style={{ backgroundColor: "#610981" }}>
                  <Plus className="w-4 h-4" />Create Notification
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Title</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Audience</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Recipients</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Scheduled</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "#ffac96" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && notifications.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : notifications.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No notifications found.</td></tr>
                  ) : (
                    notifications.map((notification) => (
                      <tr key={notification.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{notification.message}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">{audienceLabel(notification.targetAudience)}</td>
                        <td className="py-3 px-4 text-sm">{notification.recipientCount}</td>
                        <td className="py-3 px-4 text-sm">
                          {notification.scheduledDate ? new Date(notification.scheduledDate).toLocaleString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setViewing(notification)} className="hover:bg-purple-50">
                              <Eye className="w-4 h-4 text-purple-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(notification)} className="hover:bg-blue-50">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(notification)} className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)} • {total} total</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Create Notification</DialogTitle>
            <DialogDescription>Compose a new notification for sādhakas or staff</DialogDescription>
          </DialogHeader>
          <NotificationForm
            form={createForm}
            setForm={setCreateForm}
            isSubmitting={isCreating}
            submitLabel="Create"
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>Edit Notification</DialogTitle>
            <DialogDescription>Update notification details</DialogDescription>
          </DialogHeader>
          <NotificationForm
            form={editForm}
            setForm={setEditForm}
            isSubmitting={isUpdating}
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "#ff691d" }}>{viewing?.title}</DialogTitle>
            <DialogDescription>
              {viewing?.scheduledDate ? `Scheduled: ${new Date(viewing.scheduledDate).toLocaleString()}` : "No schedule"}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Audience</p>
                <p>{audienceLabel(viewing.targetAudience)} ({viewing.recipientCount} recipients)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
                <p className="whitespace-pre-wrap">{viewing.message}</p>
              </div>
              {viewing.sentAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Sent</p>
                  <p>{new Date(viewing.sentAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationForm({
  form,
  setForm,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (form: FormState) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" style={{ color: "#ffac96" }}>Title</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1"
          required
          maxLength={200}
        />
      </div>
      <div>
        <Label htmlFor="message" style={{ color: "#ffac96" }}>Message</Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1"
          rows={4}
          required
        />
      </div>
      <div>
        <Label htmlFor="targetAudience" style={{ color: "#ffac96" }}>Audience</Label>
        <Select
          value={form.targetAudience}
          onValueChange={(v) => setForm({ ...form, targetAudience: v as NotificationAudience })}
        >
          <SelectTrigger id="targetAudience" className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {AUDIENCES.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="scheduledDate" style={{ color: "#ffac96" }}>Scheduled Date</Label>
        <Input
          id="scheduledDate"
          type="datetime-local"
          value={form.scheduledDate}
          onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" style={{ backgroundColor: "#610981" }} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
