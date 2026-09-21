import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/useAuth";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof schema>;

const inputClass = "w-full rounded border border-gray-300 px-3 py-2";

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (values: LoginValues) => {
    try {
      await signIn(values.username, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      const wrongCredentials = isAxiosError(error) && error.response?.status === 401;
      setError("root", {
        message: wrongCredentials ? "Wrong username or password." : "Can't reach the server. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-blue-100 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-medium tracking-tight text-slate-900">Beauty Products Admin</h1>
        <p className="text-sm text-slate-500">Sign in to continue.</p>

        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input id="username" autoComplete="username" autoFocus {...register("username")} className={inputClass} />
          {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className={inputClass}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
