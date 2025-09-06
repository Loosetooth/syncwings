"use client";
import Navbar from "./components/Navbar";
import Link from "next/link";
import { useSession } from "./components/useSession";
import { useRegistrationOpen } from "./components/useRegistrationOpen";
import { enableFileStash } from "./lib/constants.shared";

export default function Page() {
  const { loading, ...session } = useSession();
  const { open: registrationOpen, loading: registrationLoading } = useRegistrationOpen();

  // Wait for session and registration status to load
  if (loading || registrationLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-4 text-center">SyncWings</h1>
          <div className="text-center text-gray-600 text-lg">Loading...</div>
        </main>
      </>
    );
  }

  const isLoggedIn = !!session?.loggedIn;
  const isAdmin = !!session?.isAdmin;

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4 text-center">SyncWings</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          This app provides a simple web interface for managing multiple Syncthing instances, one per user. Each user gets their own isolated Syncthing container, managed via Docker Compose. Register, log in, and manage your own file sync instance.
        </p>

        <div className="flex flex-col gap-6 mb-10">
          {/* Show login button only if user is not logged in and registration is closed */}
          {!isLoggedIn && !registrationOpen && (
            <Link href="/login" className="block">
              <button className="w-full py-4 px-6 rounded-lg bg-primary text-white text-xl font-semibold shadow hover:bg-primary/90 transition mb-2 cursor-pointer">
                Login
              </button>
              <div className="text-gray-600 text-center text-sm">Access your personal Syncthing dashboard</div>
            </Link>
          )}
          {/* If logged in, show button to access user's Syncthing instance */}
          {isLoggedIn && (
            <Link href="/syncthing" className="block">
              <button className="w-full py-4 px-6 rounded-lg bg-primary text-white text-xl font-semibold shadow hover:bg-primary/90 transition mb-2 cursor-pointer">
                Go to My Syncthing
              </button>
              <div className="text-gray-600 text-center text-sm">Access your personal Syncthing dashboard</div>
            </Link>
          )}
          {/* Show Filestash button if logged in and Filestash is enabled */}
          {isLoggedIn && enableFileStash && (
            <Link href="/filestash/" className="block">
              <button className="w-full py-4 px-6 rounded-lg bg-primary text-white text-xl font-semibold shadow hover:bg-primary/90 transition mb-2 cursor-pointer">
                Browse My Folders
              </button>
              <div className="text-gray-600 text-center text-sm">Access your personal Filestash dashboard</div>
            </Link>
          )}
          {/* Show register button only if registration is open (no users yet) */}
          {registrationOpen && (
            <Link href="/register" className="block">
              <button className="w-full py-4 px-6 rounded-lg bg-secondary text-gray-900 text-xl font-semibold shadow hover:bg-secondary/80 transition mb-2 cursor-pointer">
                Register
              </button>
              <div className="text-gray-600 text-center text-sm">Create the first user and Syncthing instance</div>
            </Link>
          )}
          {/* Show admin button only if logged in and is admin */}
          {isLoggedIn && isAdmin && (
            <Link href="/admin" className="block">
              <button className="w-full py-4 px-6 rounded-lg bg-gray-800 text-white text-xl font-semibold shadow hover:bg-gray-700 transition mb-2 cursor-pointer">
                Admin
              </button>
              <div className="text-gray-600 text-center text-sm">Administer users and manage all Syncthing instances</div>
            </Link>
          )}
        </div>

        <section className="bg-gray-50 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-2">How does it work?</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Each user is registered and gets a dedicated Syncthing container. <br />
              The syncthing instance should start automatically after user creation.</li>
            <li>Login to access your own Syncthing web UI and manage your files.</li>
            <li>Admins can add or remove users via the admin panel.</li>
            <li>Runs on Docker for easy deployment.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
