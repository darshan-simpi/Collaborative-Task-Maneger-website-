import { useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useGetTask, useUpdateTask, useDeleteTask, useGetActivityLogs, useGetUsers, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, PriorityBadge } from "./Tasks";
import { ArrowLeft, Clock, Trash2, Edit3, Loader2, Calendar, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

const editSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedToId: z.coerce.number().nullable().optional(),
  dueDate: z.string().optional().nullable(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function TaskDetails({ id }: { id: number }) {
  const [, setLocation] = useLocation();
  const { user, isManager } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: task, isLoading, isError } = useGetTask(id);
  const { data: logsData } = useGetActivityLogs({ taskId: id, limit: 20 });
  const { data: users } = useGetUsers({ query: { queryKey: getGetUsersQueryKey(), enabled: !!isManager } });
  
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (isError || !task) return <div className="p-10 text-center text-destructive">Task not found or access denied.</div>;

  const canEditAll = isManager;
  const canEditStatus = canEditAll || task.assignedTo?.id === user?.id;

  const handleEditOpen = () => {
    reset({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignedToId: task.assignedTo?.id || null,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
    });
    setIsEditOpen(true);
  };

  const onSubmitUpdate = (data: EditFormValues) => {
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    updateMutation.mutate(
      { id, data: payload as any },
      {
        onSuccess: () => {
          toast.success("Task updated");
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
          setIsEditOpen(false);
        },
        onError: (err: any) => toast.error(err?.message || "Update failed"),
      }
    );
  };

  const onStatusChange = (status: "pending" | "in_progress" | "completed") => {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Status changed to ${status}`);
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
        },
      }
    );
  };

  const onDelete = () => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Task deleted");
          setLocation("/tasks");
        },
        onError: (err: any) => toast.error(err?.message || "Delete failed"),
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Link href="/tasks" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to tasks
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl p-6 sm:p-10 border border-border shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary/50"></div>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4 leading-tight">{task.title}</h1>
            
            <div className="prose dark:prose-invert max-w-none text-muted-foreground mb-10">
              {task.description ? (
                <p className="whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="italic opacity-50">No description provided.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Assigned To</p>
                {task.assignedTo ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                      {getInitials(task.assignedTo.name)}
                    </div>
                    <span className="font-semibold">{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon size={16} /> Unassigned
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Due Date</p>
                <div className="flex items-center gap-2 font-semibold">
                  <Calendar size={16} className="text-primary" />
                  {task.dueDate ? format(new Date(task.dueDate), "MMMM d, yyyy") : "No due date"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 pt-6 border-t border-border/50 flex flex-wrap gap-4">
              {canEditStatus && (
                <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
                  <button 
                    onClick={() => onStatusChange("pending")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${task.status === "pending" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => onStatusChange("in_progress")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${task.status === "in_progress" ? "bg-primary shadow text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => onStatusChange("completed")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${task.status === "completed" ? "bg-success shadow text-success-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Complete
                  </button>
                </div>
              )}
              
              <div className="flex-1 flex justify-end gap-3">
                {canEditAll && (
                  <>
                    <Button variant="outline" onClick={handleEditOpen}>
                      <Edit3 className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Activity */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-3xl p-6 border border-border shadow-sm sticky top-28">
            <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Task History
            </h3>
            
            <div className="space-y-6">
              {logsData?.logs && logsData.logs.length > 0 ? (
                logsData.logs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute left-[9px] top-2 bottom-[-24px] w-[2px] bg-border last:hidden" />
                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-card bg-primary z-10" />
                    <p className="text-sm">
                      <span className="font-semibold">{log.user.name}</span>{" "}
                      <span className="text-muted-foreground">{log.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Task">
        <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Task Title</label>
            <Input {...register("title")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              {...register("description")}
              className="flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 resize-y"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Priority</label>
              <select {...register("priority")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Due Date</label>
              <Input {...register("dueDate")} type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Assign To</label>
            <select {...register("assignedToId")} className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
              <option value="">Unassigned</option>
              {users?.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Task" className="max-w-md">
        <div className="py-4">
          <p className="text-foreground text-lg mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
