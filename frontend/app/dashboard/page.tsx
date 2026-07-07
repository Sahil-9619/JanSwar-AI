"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function DashboardRedirectPage() {
    const router = useRouter();
    const { isLoaded: isClerkLoaded, user: clerkUser } = useUser();
    const user = useAuthStore((state) => state.user);
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        if (!isClerkLoaded) return;

        if (!clerkUser) {
            router.replace("/sign-in");
            return;
        }

        checkAuth();
    }, [checkAuth, clerkUser, isClerkLoaded, router]);

    useEffect(() => {
        if (!isClerkLoaded || !clerkUser || isLoading) return;

        if (!user) {
            router.replace("/citizen-dashboard");
            return;
        }

        if (user.role === "MP") {
            router.replace("/mp-dashboard");
        } else if (user.role === "DISTRICT_ADMIN" || user.role === "SUPER_ADMIN") {
            router.replace("/admin-dashboard");
        } else {
            router.replace("/citizen-dashboard");
        }
    }, [clerkUser, isClerkLoaded, isLoading, router, user]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            <div className="flex flex-col items-center gap-3 text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-sm text-slate-400">Preparing your dashboard...</p>
            </div>
        </div>
    );
}
