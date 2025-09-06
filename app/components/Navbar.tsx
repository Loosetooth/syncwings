"use client";


import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "./useSession";
import { useRegistrationOpen } from "./useRegistrationOpen";
import { useState, useEffect, useRef } from "react";

// DropdownMenu component to close on outside click
function DropdownMenu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-4 top-14 z-50 bg-white border rounded shadow-md flex flex-col w-48 md:hidden animate-fade-in">
      {children}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { loading, ...session } = useSession();
  const { open: registrationOpen, loading: registrationLoading } = useRegistrationOpen();


  const [menuOpen, setMenuOpen] = useState(false);

  const isLoggedIn = !!session?.loggedIn;
  const isAdmin = !!session?.isAdmin;

  return (
    <nav className="bg-white border-b shadow flex items-center px-4 py-2 mb-8 relative">
      <div className="flex-1 flex items-center gap-2">
        <Link href="/" className="flex items-center group" aria-label="Home">
          <Image src="/logo.svg" alt="Logo" width={36} height={36} priority className="mr-2" />
          <span className="font-bold text-lg text-gray-800 hover:text-primary text-center">SyncWings</span>
        </Link>
      </div>
      {/* Only show links and menu if not loading */}
      {!(loading || registrationLoading) && (
        <>
          {/* Hamburger for small screens */}
          <button
            className="md:hidden ml-2 p-2 rounded hover:bg-gray-100 focus:outline-none cursor-pointer"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Inline links for md+ screens */}
          <div className="hidden md:flex gap-4 items-center">
            {/* Show login only if not logged in and registration is closed */}
            {!isLoggedIn && !registrationOpen && <Link href="/login" className="text-gray-700 hover:text-primary">Log in</Link>}
            {/* Show register only if registration is open (no users yet) */}
            {registrationOpen && <Link href="/register" className="text-gray-700 hover:text-primary">Register</Link>}
            {/* Show My Syncthing if logged in */}
            {isLoggedIn && <Link href="/syncthing" className="text-gray-700 hover:text-primary">My Syncthing</Link>}
            {/* Show Update Password if logged in */}
            {isLoggedIn && <Link href="/update-password" className="text-gray-700 hover:text-primary">Update Password</Link>}
            {/* Show Log out if logged in */}
            {isLoggedIn && <Link href="/logout" className="text-gray-700 hover:text-primary">Log out</Link>}
            {/* Show Admin only if logged in and is admin */}
            {isLoggedIn && isAdmin && <Link href="/admin" className="text-gray-700 hover:text-primary">Admin</Link>}
          </div>
          {/* Dropdown for small screens */}
          {menuOpen && (
            <DropdownMenu onClose={() => setMenuOpen(false)}>
              {/* Show login only if not logged in and registration is closed */}
              {!isLoggedIn && registrationOpen === false && <Link href="/login" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Log in</Link>}
              {/* Show register only if registration is open (no users yet) */}
              {registrationOpen === true && <Link href="/register" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Register</Link>}
              {/* Show My Syncthing if logged in */}
              {isLoggedIn && <Link href="/syncthing" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>My Syncthing</Link>}
              {/* Show Update Password if logged in */}
              {isLoggedIn && <Link href="/update-password" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Update Password</Link>}
              {/* Show Log out if logged in */}
              {isLoggedIn && <Link href="/logout" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Log out</Link>}
              {/* Show Admin only if logged in and is admin */}
              {isLoggedIn && isAdmin && <Link href="/admin" className="px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Admin</Link>}
            </DropdownMenu>
          )}
        </>
      )}
    </nav>
  );
}
