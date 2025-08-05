"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  // Hide navbar on /syncthing route
  if (pathname.startsWith("/syncthing")) return null;

  return (
    <nav className="bg-white border-b shadow flex items-center px-4 py-2 mb-8">
      <div className="flex-1">
        <Link href="/" className="font-bold text-lg text-gray-800 hover:text-primary">Syncthing Multi-User</Link>
      </div>
      <div className="flex gap-4 items-center">
        {!loggedIn && <Link href="/login" className="text-gray-700 hover:text-primary">Login</Link>}
        {!loggedIn && <Link href="/register" className="text-gray-700 hover:text-primary">Register</Link>}
        {loggedIn && <Link href="/syncthing" className="text-gray-700 hover:text-primary">My Syncthing</Link>}
        {loggedIn && <Link href="/logout" className="text-gray-700 hover:text-primary">Logout</Link>}
        {loggedIn && <Link href="/admin" className="text-gray-700 hover:text-primary">Admin</Link>}
      </div>
    </nav>
  );
}
