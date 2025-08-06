"use client";
import React from "react";
import Navbar from "../components/Navbar";
import { useSearchParams } from "next/navigation";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("msg") || "An unknown error occurred.";
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4 text-center">Error</h1>
        <p className="text-lg text-red-600 mb-8 text-center">{decodeURIComponent(errorMsg)}</p>
        <div className="flex flex-col items-center">
          <a href="/" className="w-full py-4 px-6 rounded-lg bg-primary text-white text-xl font-semibold shadow hover:bg-primary/90 transition mb-2 cursor-pointer text-center">
            Go Home
          </a>
        </div>
      </main>
    </>
  );
}
