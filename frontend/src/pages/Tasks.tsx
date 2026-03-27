import { useState, useMemo } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useGetTasks, useUpdateTask } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { TaskCreateModal } from "@/components/TaskCreateModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { Plus, Search, Calendar, User as UserIcon, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Tasks() {
  const { isManager, user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetTasks({
    limit: 50,
  });

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        // Use websocket invalidation instead
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update task");
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
    }
  });

  const rawTasks = data?.tasks || [];
  
  // Local state for optimistic drag-and-drop updates
  const [optimisticTasks, setOptimisticTasks] = useState<any[] | null>(null);

  const displayTasks = optimisticTasks ?? rawTasks;

  useMemo(() => {
    // Sync when data updates from network if we are not currently holding dragged state
    setOptimisticTasks(rawTasks);
  }, [rawTasks]);

  const tasks = displayTasks.filter(t => 
    search ? t.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const columns = {
    pending: { title: "Pending", items: tasks.filter((t) => t.status === "pending") },
    in_progress: { title: "In Progress", items: tasks.filter((t) => t.status === "in_progress") },
    completed: { title: "Completed", items: tasks.filter((t) => t.status === "completed") },
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as "pending" | "in_progress" | "completed";
    const taskId = Number(draggableId);
    
    const task = displayTasks.find(t => t.id === taskId);
    if (!task) return;

    if (!isManager && task.assignedTo?.id !== user?.id) {
       toast.error("You can only update tasks assigned to you.");
       return;
    }

    setOptimisticTasks(displayTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    updateTask.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold">Tasks Board</h2>
          <p className="text-muted-foreground mt-1">Manage tasks dynamically via Drag-and-Drop.</p>
        </div>
        {isManager && (
          <Button onClick={() => setIsCreateOpen(true)} className="sm:w-auto w-full">
            <Plus className="w-5 h-5 mr-2" /> New Task
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-xl border border-border shadow-sm shrink-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-background border border-border rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {isLoading && !optimisticTasks ? (
        <div className="flex justify-center py-20 shrink-0">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : displayTasks.length === 0 && !search ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shrink-0">
          <h3 className="text-xl font-bold font-display mt-6">No tasks yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 overflow-x-auto pb-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full min-w-max items-start">
              {Object.entries(columns).map(([colId, col]) => (
                <div key={colId} className="w-[350px] flex flex-col bg-muted/40 rounded-xl border border-border shrink-0 h-full max-h-full">
                  <div className="flex justify-between items-center mb-1 shrink-0 p-4 pb-2 border-b border-border/50 bg-muted/20">
                    <h3 className="font-bold font-display text-foreground">{col.title}</h3>
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 bg-background shadow-sm">
                      {col.items.length}
                    </Badge>
                  </div>
                  
                  <Droppable droppableId={colId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 flex flex-col gap-3 p-3 overflow-y-auto w-full transition-colors ${
                          snapshot.isDraggingOver ? "bg-accent/50" : ""
                        }`}
                      >
                        {col.items.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                              >
                                <Link href={`/tasks/${task.id}`}>
                                  {/* Using a div acting as a clickable element since wouter intercepts anchor clicks globally or via href */}
                                  <div className="block cursor-pointer">
                                    <TaskCard task={task} isDragging={snapshot.isDragging} />
                                  </div>
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      <TaskCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

function TaskCard({ task, isDragging }: { task: any, isDragging: boolean }) {
  return (
    <div 
      className={`w-full group flex flex-col bg-card rounded-xl p-4 border shadow-sm transition-all duration-200 cursor-grab ${
        isDragging ? "shadow-xl border-primary/50 rotate-1 scale-[1.02] z-50 ring-2 ring-primary/20" : "border-border hover:shadow-md hover:border-primary/40"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <PriorityBadge priority={task.priority} />
      </div>
      
      <h3 className="text-[15px] font-bold font-display text-foreground leading-snug group-hover:text-primary transition-colors break-words">
        {task.title}
      </h3>
      
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          {task.assignedTo ? (
            <>
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                {getInitials(task.assignedTo.name)}
              </div>
              <span className="truncate max-w-[100px]">{task.assignedTo.name}</span>
            </>
          ) : (
            <>
              <UserIcon size={12} className="shrink-0" /> Unassigned
            </>
          )}
        </div>
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded-sm">
            <Calendar size={12} />
            {format(new Date(task.dueDate), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "high": return <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md"><AlertCircle size={10}/> High</span>;
    case "medium": return <span className="text-[10px] uppercase tracking-wider font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md">Medium</span>;
    default: return <span className="text-[10px] uppercase tracking-wider font-bold text-success bg-success/10 px-2 py-0.5 rounded-md">Low</span>;
  }
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed": return <Badge variant="success">Completed</Badge>;
    case "in_progress": return <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary">In Progress</Badge>;
    default: return <Badge variant="secondary">Pending</Badge>;
  }
}
