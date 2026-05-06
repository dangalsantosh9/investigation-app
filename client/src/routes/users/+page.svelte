<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get, patch } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Member {
    id: string;
    fullName: string;
    email: string;
    role: string;
  }

  const user = $derived(getUser());

  let users: Member[] = $state([]);
  let loading = $state(true);
  let updatingId: string | null = $state(null);

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    if (user.role !== 'supervisor') { // ADDED: block non-supervisors
      addToast('Access denied', 'error');
      goto('/');
      return;
    }

    const result = await get<any>('/users');
    if (result.ok) {
      users = result.data.users ?? result.data;
    } else {
      addToast('Failed to load users', 'error');
    }
    loading = false;
  });

  async function changeRole(userId: string, newRole: string): Promise<void> {
    updatingId = userId;

    const result = await patch<any>(`/users/${userId}/role`, { role: newRole });

    if (result.ok) {
      addToast(`Role updated to ${newRole}`, 'success');
      users = users.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      );
    } else if (result.status === 403) {
      addToast('Only supervisors can change roles', 'error');
    } else {
      addToast('Failed to update role', 'error');
    }
    updatingId = null;
  }
</script>

<hgroup>
  <h1>Manage Users</h1>
  <p>Change user roles — only supervisors can access this page.</p>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if users.length === 0}
  <p>No users found.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {#each users as u (u.id)}
        <tr>
          <td>{u.fullName}</td>
          <td>{u.email}</td>
          <td><strong>{u.role}</strong></td>
          <td>
            {#if u.id === user?.userId}
              <em>You</em>
            {:else if u.role === 'member'}
              <button
                class="outline"
                style="padding: 0.3rem 0.8rem; font-size: 0.85rem;"
                onclick={() => changeRole(u.id, 'supervisor')}
                disabled={updatingId === u.id}
                aria-busy={updatingId === u.id}
              >
                Make Supervisor
              </button>
            {:else}
              <button
                class="outline secondary"
                style="padding: 0.3rem 0.8rem; font-size: 0.85rem;"
                onclick={() => changeRole(u.id, 'member')}
                disabled={updatingId === u.id}
                aria-busy={updatingId === u.id}
              >
                Make Member
              </button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}