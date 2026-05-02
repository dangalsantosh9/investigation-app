<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Case {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }

  const user = $derived(getUser());

  let cases: Case[] = $state([]);
  let loading = $state(true);
  let statusFilter = $state('');
  let priorityFilter = $state('');

  const filtered = $derived(
    cases.filter((c) => {
      const matchStatus = statusFilter === '' || c.status === statusFilter;
      const matchPriority = priorityFilter === '' || c.priority === priorityFilter;
      return matchStatus && matchPriority;
    }),
  );

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    const result = await get<any>('/cases');

    if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }
    if (result.ok) {
      cases = Array.isArray(result.data) ? result.data : result.data.cases ?? [];
    } else {
      addToast('Failed to load investigations', 'error');
    }
    loading = false;
  });
</script>

<hgroup>
  <h1>Investigations</h1>
  {#if user?.role === 'supervisor'} <!-- ADDED: only supervisors see Create button -->
    <a href="/cases/new" role="button">+ Create Investigation</a>
  {/if} <!-- ADDED -->
</hgroup>

<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
  <label style="flex: 1; min-width: 160px;">
    Filter by Status
    <select bind:value={statusFilter}>
      <option value="">All</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  </label>

  <label style="flex: 1; min-width: 160px;">
    Filter by Priority
    <select bind:value={priorityFilter}>
      <option value="">All</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </label>
</div>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if filtered.length === 0}
  <p>No investigations found.</p>
{:else}
  <ul>
    {#each filtered as c (c.id)}
      <li>
        <a href="/cases/{c.id}">
          <strong>{c.title}</strong>
        </a>
        <small>
          — Status: {c.status} | Priority: {c.priority}
          {#if c.dueDate} | Due: {new Date(c.dueDate).toLocaleDateString()}{/if}
        </small>
      </li>
    {/each}
  </ul>
{/if}