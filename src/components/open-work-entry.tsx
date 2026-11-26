"use client";

import { useEffect } from "react";

export function OpenWorkEntry({ destination }: { destination: string }) {
  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);
  return null;
}
