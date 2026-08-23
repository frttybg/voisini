import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
