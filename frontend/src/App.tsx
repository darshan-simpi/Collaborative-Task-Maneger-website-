import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import { SocketProvider } from "@/providers/SocketProvider";
import { useTasksSocket } from "@/hooks/useTasksSocket";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import TaskDetails from "@/pages/TaskDetails";

setAuthTokenGetter(() => localStorage.getItem("task_manager_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, params }: { component: any, params?: any }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Component {...params} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      
      <Route path="/tasks/:id">
        {params => <ProtectedRoute component={TaskDetails} params={{ id: Number(params.id) }} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function SocketSyncer() {
  useTasksSocket();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ThemeProvider defaultTheme="system" storageKey="task-manager-theme">
          <AuthProvider>
            <SocketProvider>
              <SocketSyncer />
              <Router />
              <Toaster position="top-right" richColors />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
