import { zodResolver } from "@hookform/resolvers/zod";
import {
  appRoutes,
  registerInputSchema,
  type RegisterInput,
} from "@template/shared";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { z } from "zod";
import { register } from "@/features/auth/api/auth-service";
import { useAuthStore } from "@/stores/auth-store";

type RegisterFormValues = z.input<typeof registerInputSchema>;

export function useRegisterForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "sales_rep",
    },
  });

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (session) => {
      setSession(session);
      toast.success(
        `Welcome to DealFlow360, ${session.user.name}! Your workspace is ready.`,
      );
      navigate(appRoutes.dashboard);
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(values as RegisterInput),
  );

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
  };
}
