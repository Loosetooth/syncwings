"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/registration-open")
      .then(res => res.json())
      .then(data => {
        if (!data.open) {
          setRegistrationOpen(false);
        } else {
          setRegistrationOpen(true);
        }
      });
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.replace("/login");
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  }

  if (registrationOpen === false) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md shadow-lg text-center p-8">
            <CardHeader>
              <CardTitle>Registration Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">Self-Registration is only available for the first user. Adding further users requires admin privileges and can only be done in <a href="/admin" className="text-primary underline">the admin panel</a>.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (registrationOpen === null) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="text-gray-600 text-lg">Checking registration status...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Register First Admin User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Repeat Password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">Register</Button>
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
