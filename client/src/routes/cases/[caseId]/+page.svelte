<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get, patch } from '$lib/api.js';
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

  interface Task {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    assignedTo: { fullName: string } | null;
  }

  const user = $derived(getUser());
  const caseId = $derived($page.params.caseId);

  let caseData: Case | null = $state(null);
  let tasks: Task[] = $state([]);
  let loading = $state(true);
  let closing = $state(false);
  let reopening = $state(false); // ADDED

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    const [caseResult, tasksResult] = await Promise.all([
      get<any>(`/cases/${caseId}`),
      get<any>(`/cases/${caseId}/tasks`),
    ]);

    if (caseResult.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    if (caseResult.ok) {
      caseData = caseResult.data.case ?? caseResult.data;
    } else {
      addToast('Failed to load investigation', 'error');
    }

    if (tasksResult.ok) {
      tasks = Array.isArray(tasksResult.data)
        ? tasksResult.data
        : tasksResult.data.tasks ?? [];
    } else {
      addToast('Failed to load tasks', 'error');
    }

    loading = false;
  });

  async function closeCase(): Promise<void> {
    if (!confirm('Close this investigation?')) return;
    closing = true;

    const result = await patch(`/cases/${caseId}/close`, {});
    if (result.ok) {
      addToast('Investigation closed', 'success');
      const refreshed = await get<any>(`/cases/${caseId}`);
      if (refreshed.ok) caseData = refreshed.data.case ?? refreshed.data;
    } else {
      addToast('Failed to close investigation', 'error');
    }
    closing = false;
  }

  // ADDED: reopen a closed case
  async function reopenCase(): Promise<void> {
    if (!confirm('Reopen this investigation?')) return;
    reopening = true;

    const result = await patch(`/cases/${caseId}/reopen`, {});
    if (result.ok) {
      addToast('Investigation reopened', 'success');
      const refreshed = await get<any>(`/cases/${caseId}`);
      if (refreshed.ok) caseData = refreshed.data.case ?? refreshed.data;
    } else {
      addToast('Failed to reopen investigation', 'error');
    }
    reopening = false;
  }
</script>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if !caseData}
  <p>Investigation not found.</p>
  <a href="/cases">← Back to list</a>
{:else}
  <hgroup>
    <h1>{caseData.title}</h1>
    <p>
      Status: <strong>{caseData.status}</strong> |
      Priority: <strong>{caseData.priority}</strong>
      {#if caseData.dueDate} | Due: {new Date(caseData.dueDate).toLocaleDateString()}{/if}
    </p>
  </hgroup>

  <p>{caseData.description}</p>

  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
    <a href="/cases" role="button" class="outline secondary">← Back</a>

    {#if user?.role === 'supervisor' && caseData.status !== 'closed'}
      <a href="/cases/{caseId}/new-task" role="button">+ Add Task</a>
    {/if}

    {#if user?.role === 'supervisor' && caseData.status !== 'closed'}
      <a href="/cases/{caseId}/edit" role="button" class="outline">Edit</a>
    {/if}

    {#if user?.role === 'supervisor' && caseData.status !== 'closed'}
      <button
        class="outline contrast"
        onclick={closeCase}
        aria-busy={closing}
        disabled={closing}
      >
        {closing ? 'Closing...' : 'Close Investigation'}
      </button>
    {/if}

    {#if user?.role === 'supervisor' && caseData.status === 'closed'} <!-- ADDED -->
      <button
        class="outline"
        onclick={reopenCase}
        aria-busy={reopening}
        disabled={reopening}
      >
        {reopening ? 'Reopening...' : 'Reopen Investigation'}
      </button>
    {/if} <!-- ADDED -->

    <a href="/cases/{caseId}/timeline" role="button" class="outline">View Timeline</a>
  </div>

  <section>
    <h2>Tasks</h2>
    {#if tasks.length === 0}
      <p>No tasks yet for this investigation.</p>
    {:else}
      <ul>
        {#each tasks as task (task.id)}
          <li>
            <a href="/tasks/{task.id}">
              <strong>{task.title}</strong>
            </a>
            <small>
              — {task.status}
              {#if task.assignedTo} | Assigned to: {task.assignedTo.fullName}{/if}
              {#if task.dueDate} | Due: {new Date(task.dueDate).toLocaleDateString()}{/if}
            </small>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}