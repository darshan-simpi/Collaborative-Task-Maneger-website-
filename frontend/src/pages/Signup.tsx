import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "manager"]),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const { login } = useAuth();
  const mutation = useSignup();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "user",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = (data: SignupForm) => {
    mutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          toast.success("Account created successfully!");
          login(res.token);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to create account");
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
            className="w-full h-full object-cover opacity-80 scale-105"
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
            Join the new standard of work.
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign up to start organizing tasks, managing projects, and leading your team to success.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-background border-l border-border/50 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold font-display tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Full Name</label>
                <Input
                  {...register("name")}
                  placeholder="Jane Doe"
                  error={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

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
                  placeholder="Min. 6 characters"
                  error={!!errors.password}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-foreground">I am joining as a:</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setValue("role", "user")}
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                      selectedRole === "user" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold">Team Member</span>
                    <span className="text-xs text-center">Execute tasks</span>
                  </div>
                  <div 
                    onClick={() => setValue("role", "manager")}
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                      selectedRole === "manager" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold">Manager</span>
                    <span className="text-xs text-center">Assign & manage</span>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-lg h-14 mt-4" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Sign Up <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
