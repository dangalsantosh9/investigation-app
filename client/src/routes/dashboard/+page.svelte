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
    case: { id: string; title: string } | null;
    assignedTo: { fullName: string } | null;
  }

  interface Case {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }

  interface Update {
    id: string;
    message: string;
    createdAt: string;
    editedAt: string | null;
    createdBy: { fullName: string };
    task: { id: string; title: string };
  }

  interface DashboardSummary {
    overdue: Task[];
    dueSoon: Task[];
  }

  const user = $derived(getUser());

  // member state
  let tasks: Task[] = $state([]);
  let summary: DashboardSummary = $state({ overdue: [], dueSoon: [] });
  let statusFilter = $state('');
  let loading = $state(true);

  // supervisor state
  let allCases: Case[] = $state([]);
  let allTasks: Task[] = $state([]);
  let recentUpdates: Update[] = $state([]);
  let totalOpen = $state(0);
  let totalInProgress = $state(0);
  let totalOverdue = $state(0);
  let totalCompleted = $state(0);
  let casesDueSoon: Case[] = $state([]);
  let overdueTasks: Task[] = $state([]);

  const filtered = $derived(
    tasks.filter((t) => statusFilter === '' || t.status === statusFilter)
  );

  onMount(async () => {
    if (!user) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }

    if (user.role === 'supervisor') {
      // SUPERVISOR DASHBOARD
      const [casesResult, tasksResult, updatesResult] = await Promise.all([
        get<any>('/cases'),
        get<any>('/tasks/all'),
        get<any>('/updates/recent'),
      ]);

      if (casesResult.ok) {
        allCases = Array.isArray(casesResult.data)
          ? casesResult.data
          : casesResult.data.cases ?? [];

        const now = new Date();
        const sevenDays = new Date();
        sevenDays.setDate(now.getDate() + 7);
        totalOpen = allCases.filter((c) => c.status === 'open').length;
        casesDueSoon = allCases.filter(
          (c) =>
            c.dueDate &&
            new Date(c.dueDate) >= now &&
            new Date(c.dueDate) <= sevenDays &&
            c.status !== 'closed'
        );
      }

      if (tasksResult.ok) {
        allTasks = Array.isArray(tasksResult.data)
          ? tasksResult.data
          : tasksResult.data.tasks ?? [];

        const now = new Date();
        totalInProgress = allTasks.filter((t) => t.status === 'in_progress').length;
        totalCompleted = allTasks.filter((t) => t.status === 'completed').length;
        overdueTasks = allTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
        );
        totalOverdue = overdueTasks.length;
      }

      if (updatesResult.ok) {
        recentUpdates = Array.isArray(updatesResult.data)
          ? updatesResult.data
          : updatesResult.data.updates ?? [];
      }

    } else {
      // MEMBER DASHBOARD
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
    }

    loading = false;
  });
</script>

{#if loading}
  <p aria-busy="true">Loading...</p>

{:else if user?.role === 'supervisor'}
  <!-- SUPERVISOR DASHBOARD -->
  <hgroup>
    <h1>Supervisor Dashboard</h1>
    <p>Welcome, {user?.fullName} — here's an overview of all investigations</p>
  </hgroup>

  <!-- Summary Cards -->
  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
    <article style="flex: 1; min-width: 160px; text-align: center;">
      <header><h3>📁 Open Cases</h3></header>
      <p style="font-size: 2rem; font-weight: bold; margin: 0;">{totalOpen}</p>
    </article>

    <article style="flex: 1; min-width: 160px; text-align: center;">
      <header><h3>🔄 In Progress</h3></header>
      <p style="font-size: 2rem; font-weight: bold; margin: 0;">{totalInProgress}</p>
    </article>

    <article style="flex: 1; min-width: 160px; text-align: center;">
      <header><h3>⚠️ Overdue Tasks</h3></header>
      <p style="font-size: 2rem; font-weight: bold; margin: 0; color: #d62828;">{totalOverdue}</p>
    </article>

    <article style="flex: 1; min-width: 160px; text-align: center;">
      <header><h3>✅ Completed</h3></header>
      <p style="font-size: 2rem; font-weight: bold; margin: 0; color: #2d6a4f;">{totalCompleted}</p>
    </article>
  </div>

  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
    <!-- Cases Due Soon -->
    <article style="flex: 1; min-width: 280px;">
      <header><h3>🕐 Cases Due Within 7 Days</h3></header>
      {#if casesDueSoon.length === 0}
        <p>No cases due soon.</p>
      {:else}
        <ul>
          {#each casesDueSoon as c (c.id)}
            <li>
              <a href="/cases/{c.id}"><strong>{c.title}</strong></a>
              <small> — {c.priority} | Due: {new Date(c.dueDate!).toLocaleDateString()}</small>
            </li>
          {/each}
        </ul>
      {/if}
    </article>

    <!-- Overdue Tasks -->
    <article style="flex: 1; min-width: 280px;">
      <header><h3>🚨 Overdue Tasks</h3></header>
      {#if overdueTasks.length === 0}
        <p>No overdue tasks.</p>
      {:else}
        <ul>
          {#each overdueTasks as t (t.id)}
            <li>
              <a href="/tasks/{t.id}"><strong>{t.title}</strong></a>
              <small>
                {#if t.assignedTo} — {t.assignedTo.fullName}{/if}
                {#if t.case} | <a href="/cases/{t.case.id}">{t.case.title}</a>{/if}
                | Due: {new Date(t.dueDate!).toLocaleDateString()}
              </small>
            </li>
          {/each}
        </ul>
      {/if}
    </article>
  </div>

  <!-- Recent Activity -->
  <section style="margin-bottom: 2rem;">
    <h2>📝 Recent Activity from Members</h2>
    {#if recentUpdates.length === 0}
      <p>No recent updates.</p>
    {:else}
      {#each recentUpdates as u (u.id)}
        <article>
          <header>
            <strong>{u.createdBy.fullName}</strong>
            <small> — {new Date(u.createdAt).toLocaleString()}</small>
            {#if u.editedAt}<small> (edited)</small>{/if}
            {#if u.task} | Task: <a href="/tasks/{u.task.id}">{u.task.title}</a>{/if}
          </header>
          <p>{u.message}</p>
        </article>
      {/each}
    {/if}
  </section>

  <!-- All Tasks Overview -->
  <section>
    <h2>📋 All Tasks Across Investigations</h2>
    {#if allTasks.length === 0}
      <p>No tasks found.</p>
    {:else}
      <ul>
        {#each allTasks as t (t.id)}
          <li>
            <a href="/tasks/{t.id}"><strong>{t.title}</strong></a>
            <small>
              — {t.status}
              {#if t.assignedTo} | {t.assignedTo.fullName}{/if}
              {#if t.case} | <a href="/cases/{t.case.id}">{t.case.title}</a>{/if}
              {#if t.dueDate} | Due: {new Date(t.dueDate).toLocaleDateString()}{/if}
            </small>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

{:else}
  <!-- MEMBER DASHBOARD -->
  <hgroup>
    <h1>My Dashboard</h1>
    <p>Welcome, {user?.fullName}</p>
  </hgroup>

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