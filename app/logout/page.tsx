"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/logout", { method: "POST" }).then(() => {
      router.replace("/");
    });
  }, [router]);
  return (
    <>
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-gray-600 text-lg">Logging out...</span>
      </div>
    </>
  );
}
