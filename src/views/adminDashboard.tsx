import React from 'react';
import View from './view';
import { pizzaService } from '../service/service';
import { Role, User } from '../service/pizzaService';
import Button from '../components/button';

interface Props {
  user: User | null;
}

type Tab = 'franchises' | 'users';

export default function AdminDashboard(props: Props) {
  const user = props.user;

  // tabs
  const [tab, setTab] = React.useState<Tab>('franchises');

  // --- franchises state ---
  const [franchises, setFranchises] = React.useState<any[]>([]);
  const [franchiseMore, setFranchiseMore] = React.useState(false);
  const [franchisePage, setFranchisePage] = React.useState(0);
  const franchiseFilterRef = React.useRef<HTMLInputElement>(null);

  // --- users state ---
  const [users, setUsers] = React.useState<User[]>([]);
  const [usersMore, setUsersMore] = React.useState(false);
  const [usersPage, setUsersPage] = React.useState(1);
  const userFilterRef = React.useRef<HTMLInputElement>(null);
  const pageLimit = 10;

  React.useEffect(() => {
    (async () => {
      if (!user || !Role.isRole(user, Role.Admin)) return;

      if (tab === 'franchises') {
        const name = (franchiseFilterRef.current?.value || '*').trim() || '*';
        // Signature: (page, limit, nameFilter)
        const { franchises, more } = await pizzaService.getFranchises(franchisePage, 10, name);
        setFranchises(franchises ?? []);
        setFranchiseMore(!!more);
      } else {
        const name = (userFilterRef.current?.value || '*').trim() || '*';
        const { users, more } = await pizzaService.listUsers(usersPage, pageLimit, name);
        setUsers(users ?? []);
        setUsersMore(!!more);
      }
    })();
  }, [user, tab, franchisePage, usersPage]);

  async function submitFranchiseFilter(e: React.FormEvent) {
    e.preventDefault();
    setFranchisePage(0);
    if (!user) return;
    const name = (franchiseFilterRef.current?.value || '*').trim() || '*';
    const { franchises, more } = await pizzaService.getFranchises(0, 10, name);
    setFranchises(franchises ?? []);
    setFranchiseMore(!!more);
  }

  async function submitUserFilter(e: React.FormEvent) {
    e.preventDefault();
    setUsersPage(1);
    await refreshUsers(1);
  }

  async function refreshUsers(page = usersPage) {
    const name = (userFilterRef.current?.value || '*').trim() || '*';
    const { users, more } = await pizzaService.listUsers(page, pageLimit, name);
    setUsers(users ?? []);
    setUsersMore(!!more);
  }

  async function handleDeleteUser(userId: number) {
    await pizzaService.deleteUser(userId);
    await refreshUsers(); // reload with current page + filter
  }

  function formatRole(role: { role: Role; objectId?: string }) {
    if (role.role === Role.Franchisee) {
      return `franchisee:${role.objectId}`;
    }
    return role.role;
  }

  if (!user || !Role.isRole(user, Role.Admin)) {
    return (
      <View title="Admin dashboard">
        <div className="text-neutral-100 p-6">You must be an admin to view this page.</div>
      </View>
    );
  }

  return (
    <View title="Admin dashboard">
      <div className="px-4 sm:px-6 lg:px-8 py-6 text-neutral-100">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            title="Franchises"
            className={`px-3 py-1 ${tab === 'franchises' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onPress={() => setTab('franchises')}
          />
        { }
          <Button
            title="Users"
            className={`px-3 py-1 ${tab === 'users' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onPress={() => setTab('users')}
          />
        </div>

        {/* --- Franchises panel --- */}
        {tab === 'franchises' && (
          <div className="space-y-4">
            <form className="flex gap-2 items-center" onSubmit={submitFranchiseFilter}>
              <input
                ref={franchiseFilterRef}
                placeholder="Filter franchises"
                className="px-2 py-1 rounded text-gray-800"
                defaultValue="*"
              />
              {/* Button requires onPress; no-op since form handles submit */}
              <Button title="Submit" className="px-4 py-1" onPress={() => {}} />
            </form>

            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="min-w-full divide-y divide-gray-200 text-gray-800">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-start">Name</th>
                    <th className="px-4 py-2 text-start">Stores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {franchises.map((f: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{f.name}</td>
                      <td className="px-4 py-2">
                        {Array.isArray(f.stores) &&
                          f.stores.map((s: any, i: number) => (
                            <span key={i}>{i ? ', ' : ''}{s.name}</span>
                          ))}
                      </td>
                    </tr>
                  ))}
                  {franchises.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={2}>
                        No franchises found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button
                title="Prev"
                className="px-3 py-1 disabled:opacity-50"
                onPress={() => setFranchisePage(Math.max(0, franchisePage - 1))}
                disabled={franchisePage <= 0}
              />
              <Button
                title="Next"
                className="px-3 py-1 disabled:opacity-50"
                onPress={() => setFranchisePage(franchisePage + 1)}
                disabled={!franchiseMore}
              />
            </div>
          </div>
        )}

        {/* --- Users panel --- */}
        {tab === 'users' && (
          <div className="space-y-4">
            <form className="flex gap-2 items-center" onSubmit={submitUserFilter}>
              <input
                ref={userFilterRef}
                placeholder="Filter users"
                className="px-2 py-1 rounded text-gray-800"
                defaultValue="*"
              />
              {/* Button requires onPress; no-op since form handles submit */}
              <Button title="Submit" className="px-4 py-1" onPress={() => {}} />
            </form>

            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="min-w-full divide-y divide-gray-200 text-gray-800" role="table" aria-label="Users">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-start">Name</th>
                    <th className="px-4 py-2 text-start">Email</th>
                    <th className="px-4 py-2 text-start">Role</th>
                    <th className="px-4 py-2 text-start">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        {u.roles?.map((r, i) => <span key={i}>{i ? ', ' : ''}{formatRole(r)}</span>)}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          title={`Delete ${u.name}`}
                          className="px-3 py-1 bg-red-600 text-white"
                          onPress={() => handleDeleteUser(Number(u.id))}
                          disabled={user?.id === u.id} // prevent accidental self-delete
                        />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button
                title="Prev"
                className="px-3 py-1 disabled:opacity-50"
                onPress={() => setUsersPage(Math.max(1, usersPage - 1))}
                disabled={usersPage <= 1}
              />
              <Button
                title="Next"
                className="px-3 py-1 disabled:opacity-50"
                onPress={() => setUsersPage(usersPage + 1)}
                disabled={!usersMore}
              />
            </div>
          </div>
        )}
      </div>
    </View>
  );
}
