import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const mutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          toast.success("Welcome back!");
          login(res.token);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Invalid credentials");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
            alt="Auth Background" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent dark:from-background dark:via-background/50"></div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 text-primary font-display font-bold text-3xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <CheckSquare size={24} strokeWidth={3} />
          </div>
          <span className="text-foreground">TaskFlow</span>
        </div>
        
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-display font-bold text-foreground mb-6 leading-tight">
            Streamline your team's productivity.
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage tasks, track progress, and collaborate seamlessly with the ultimate professional workspace.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-background border-l border-border/50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                <CheckSquare size={28} />
              </div>
            </div>
            <h2 className="text-3xl font-bold font-display tracking-tight">Sign in</h2>
            <p className="text-muted-foreground">Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email</label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="name@company.com"
                  error={!!errors.email}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.password}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full text-lg h-14" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Sign in to Workspace <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
