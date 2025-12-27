import { Suspense } from "react";
import CallbackClient from "./callback-client";

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Finalizing login…</div>}>
      <CallbackClient />
    </Suspense>
  );
}