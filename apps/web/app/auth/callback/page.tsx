import { Suspense } from "react";
import CallbackClient from "./callback-client";
import { LoaderSplash } from "@/components/feedback/LoaderSplash";

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoaderSplash />}>
      <CallbackClient />
    </Suspense>
  );
}