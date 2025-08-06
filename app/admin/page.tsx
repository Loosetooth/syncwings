"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../lib/user';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (!data.loggedIn) router.replace('/login');
        else if (!data.isAdmin) router.replace('/unauthorized');
        else fetchUsers();
      });
  }, [router]);

  function fetchUsers() {
    setLoading(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUser, password: newPass })
    });
    if (res.ok) {
      setNewUser(''); setNewPass(''); fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add user');
    }
  }

  async function handleRemoveUser(username: string) {
    if (!confirm(`Remove user ${username}?`)) return;
    const res = await fetch(`/api/admin/users?username=${encodeURIComponent(username)}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
    else setError('Failed to remove user');
  }

  async function handlePromote(username: string) {
    const res = await fetch(`/api/admin/promote?username=${encodeURIComponent(username)}`, { method: 'POST' });
    if (res.ok) fetchUsers();
    else setError('Failed to promote user');
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-gray-600 text-lg">Loading...</span>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card className="w-full shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                type="text"
                placeholder="New username"
                value={newUser}
                onChange={e => setNewUser(e.target.value)}
                required
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="Password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" className="min-w-[120px] cursor-pointer">Add User</Button>
            </form>
            {error && <div className="text-red-600 text-sm text-center mb-4">{error}</div>}
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg overflow-hidden text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Username</th>
                    <th className="py-2 px-3 text-left">Admin</th>
                    <th className="py-2 px-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username} className="border-t">
                      <td className="py-2 px-3">{u.username}</td>
                      <td className="py-2 px-3">{u.isAdmin ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-3 flex gap-2">
                        <Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => handleRemoveUser(u.username)}>
                          Remove
                        </Button>
                        {!u.isAdmin && (
                          <Button variant="secondary" size="sm" className="cursor-pointer" onClick={() => handlePromote(u.username)}>
                            Promote to Admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
