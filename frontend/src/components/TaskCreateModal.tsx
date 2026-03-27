import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateTask, useGetUsers, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedToId: z.coerce.number().nullable().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export function TaskCreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { isManager } = useAuth();
  const mutation = useCreateTask();
  const { data: users } = useGetUsers({ query: { queryKey: getGetUsersQueryKey(), enabled: !!isManager } });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: "medium" },
  });

  const onSubmit = (data: TaskFormValues) => {
    // Clean up empty strings to null for backend
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      assignedToId: data.assignedToId || null,
    };

    mutation.mutate(
      { data: payload as any },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          reset();
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to create task");
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" description="Assign a new task to your team.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Task Title *</label>
          <Input {...register("title")} placeholder="E.g. Update landing page copy" error={!!errors.title} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Description</label>
          <textarea
            {...register("description")}
            className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 resize-y"
            placeholder="Add some details..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Priority</label>
            <select
              {...register("priority")}
              className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
            >
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
          <select
            {...register("assignedToId")}
            className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
          >
            <option value="">Unassigned</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
