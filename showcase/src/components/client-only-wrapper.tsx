"use client";

import { useEffect, useState } from "react";

interface ClientOnlyWrapperProps {
  children: React.ReactNode;
}

export const ClientOnlyWrapper = ({ children }: ClientOnlyWrapperProps) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};
