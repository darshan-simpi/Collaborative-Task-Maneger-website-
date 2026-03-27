import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { getInitials, cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isManager, logout, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If loading auth or not logged in, just return empty layout or redirect happens inside App
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border/50 bg-card z-10">
        <div className="h-20 flex items-center px-8 border-b border-border/50">
          <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
              <CheckSquare size={18} strokeWidth={3} />
            </div>
            TaskFlow
          </div>
        </div>
        
        <div className="p-4 flex-1">
          <div className="space-y-1 mb-8">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main Menu
            </div>
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-border/50 mt-auto bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                <UserIcon size={12} /> {user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu size={24} />
            </button>
            <span className="font-display font-bold text-xl text-primary flex items-center gap-2">
              <CheckSquare size={20} className="text-primary" /> TaskFlow
            </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xl font-bold font-display capitalize">
              {location === "/" ? "Dashboard" : location.replace("/", "").split("/")[0]}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive hover:text-white px-4 py-2.5 rounded-full transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            <div className="relative w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left">
              <div className="h-20 flex items-center justify-between px-6 border-b border-border">
                <span className="font-display font-bold text-xl text-primary">TaskFlow</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 flex-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 mb-2 rounded-xl font-medium",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="p-6 border-t border-border bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
