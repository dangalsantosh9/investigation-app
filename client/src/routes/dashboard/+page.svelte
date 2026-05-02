<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Task {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    case: { id: string; title: string };
  }

  interface DashboardSummary {
    overdue: Task[];
    dueSoon: Task[];
  }

  const user = $derived(getUser());

  let tasks: Task[] = $state([]);
  let summary: DashboardSummary = $state({ overdue: [], dueSoon: [] });
  let loading = $state(true);
  let statusFilter = $state('');

  const filtered = $derived(
    tasks.filter((t) => statusFilter === '' || t.status === statusFilter)
  );

  onMount(async () => {
    if (!user) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }

    const [tasksResult, summaryResult] = await Promise.all([
      get<any>(`/users/${user.userId}/tasks`),
      get<any>(`/users/${user.userId}/dashboard`),
    ]);

    if (tasksResult.status === 401) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }

    if (tasksResult.ok) {
      tasks = Array.isArray(tasksResult.data)
        ? tasksResult.data
        : tasksResult.data.tasks ?? [];
    } else {
      addToast('Failed to load tasks', 'error');
    }

    if (summaryResult.ok) {
      summary = summaryResult.data;
    }

    loading = false;
  });
</script>

<hgroup>
  <h1>My Dashboard</h1>
  <p>Welcome, {user?.fullName}</p>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else}
  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
    <article style="flex: 1; min-width: 200px;">
      <header><h3>⚠️ Overdue</h3></header>
      {#if !summary.overdue?.length}
        <p>No overdue tasks.</p>
      {:else}
        <ul>
          {#each summary.overdue as t (t.id)}
            <li><a href="/tasks/{t.id}">{t.title}</a></li>
          {/each}
        </ul>
      {/if}
    </article>

    <article style="flex: 1; min-width: 200px;">
      <header><h3>🕐 Due Soon</h3></header>
      {#if !summary.dueSoon?.length}
        <p>No tasks due soon.</p>
      {:else}
        <ul>
          {#each summary.dueSoon as t (t.id)}
            <li><a href="/tasks/{t.id}">{t.title}</a></li>
          {/each}
        </ul>
      {/if}
    </article>
  </div>

  <section>
    <h2>My Assigned Tasks</h2>

    <label style="max-width: 300px;">
      Filter by Status
      <select bind:value={statusFilter}>
        <option value="">All</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </label>

    {#if filtered.length === 0}
      <p>No tasks found.</p>
    {:else}
      <ul>
        {#each filtered as t (t.id)}
          <li>
            <a href="/tasks/{t.id}"><strong>{t.title}</strong></a>
            <small>
              — {t.status}
              {#if t.case} | Case: {t.case.title}{/if}
              {#if t.dueDate} | Due: {new Date(t.dueDate).toLocaleDateString()}{/if}
            </small>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}