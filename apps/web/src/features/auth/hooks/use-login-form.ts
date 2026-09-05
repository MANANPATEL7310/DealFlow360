import { zodResolver } from "@hookform/resolvers/zod";
import { appRoutes, loginInputSchema, type LoginInput } from "@template/shared";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { z } from "zod";
import { login } from "@/features/auth/api/auth-service";
import { useAuthStore } from "@/stores/auth-store";

type LoginFormValues = z.input<typeof loginInputSchema>;

export function useLoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "changeme123",
      rememberMe: true,
    },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      setSession(session);
      toast.success("Signed in. Your dashboard is ready.");
      navigate(appRoutes.dashboard);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(values as LoginInput),
  );

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
  };
}
