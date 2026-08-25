import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  // RegisterForm, davet kodunu adresten okumak için useSearchParams
  // kullanıyor; Next bunu bir Suspense sınırı içinde ister.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
