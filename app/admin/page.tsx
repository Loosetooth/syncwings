"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../../user';

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
        else if (!data.isAdmin) router.replace('/syncthing');
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

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>Admin Panel</h2>
      <form onSubmit={handleAddUser} style={{ marginBottom: 20 }}>
        <input type="text" placeholder="New username" value={newUser} onChange={e => setNewUser(e.target.value)} required />
        <input type="text" placeholder="Password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
        <button type="submit">Add User</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>Username</th><th>Admin</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.username}>
              <td>{u.username}</td>
              <td>{u.isAdmin ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleRemoveUser(u.username)}>Remove</button>
                {!u.isAdmin && <button onClick={() => handlePromote(u.username)}>Promote to Admin</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
