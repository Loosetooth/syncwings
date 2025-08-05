"use client";
import Navbar from "../components/Navbar";

export default function UnauthorizedPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-gray-700 text-center max-w-md mb-6">
          You do not have permission to access this page. If you believe this is an error, please contact your administrator.
        </p>
        <a href="/" className="text-primary underline">Return to Home</a>
      </div>
    </>
  );
}
