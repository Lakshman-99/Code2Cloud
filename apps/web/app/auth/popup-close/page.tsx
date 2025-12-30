"use client";

import { useEffect } from "react";
import { LoaderSplash } from "@/components/feedback/LoaderSplash";

export default function PopupClose() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoaderSplash text="ACCOUNT LINKING SUCCESSFUL! " />
  );
}