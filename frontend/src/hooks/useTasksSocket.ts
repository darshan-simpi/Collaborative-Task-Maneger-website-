import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../providers/SocketProvider";

export function useTasksSocket() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleTaskChange = () => {
      // Invalidate the tasks and activity logs queries so React Query refetches them
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    };

    socket.on("task_created", handleTaskChange);
    socket.on("task_updated", handleTaskChange);
    socket.on("task_deleted", handleTaskChange);

    return () => {
      socket.off("task_created", handleTaskChange);
      socket.off("task_updated", handleTaskChange);
      socket.off("task_deleted", handleTaskChange);
    };
  }, [socket, queryClient]);
}
