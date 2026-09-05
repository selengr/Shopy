"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import User from "@/models/user";

export default function PermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const allowed = new User(user).canAccess(permission);

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/admin");
    }
  }, [allowed, loading, router, user]);

  if (loading || !allowed) {
    return (
      <div className="p-8 text-sm text-[#6b6459]">در حال بررسی دسترسی...</div>
    );
  }

  return children;
}
