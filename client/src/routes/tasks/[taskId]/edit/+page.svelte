<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get, patch } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface User {
    id: string;
    fullName: string;
  }

  const user = $derived(getUser());
  const taskId = $derived($page.params.taskId);

  let title = $state('');
  let description = $state('');
  let dueDate = $state('');
  let assignedToId = $state('');
  let users: User[] = $state([]);
  let loading = $state(true);
  let submitting = $state(false);

  onMount(async () => {
    if (!user) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }

    const [taskResult, usersResult] = await Promise.all([
      get<any>(`/tasks/${taskId}`),
      get<any>('/users'),
    ]);

    if (taskResult.ok) {
      const t = taskResult.data.task ?? taskResult.data;
      title = t.title;
      description = t.description ?? '';
      dueDate = t.dueDate ? t.dueDate.split('T')[0] : '';
      assignedToId = t.assignedTo?.id ?? '';

      // ADDED: check if parent case is closed and redirect if so
      if (t.caseEntity?.id) {
        const caseResult = await get<any>(`/cases/${t.caseEntity.id}`);
        if (caseResult.ok) {
          const c = caseResult.data.case ?? caseResult.data;
          if (c.status === 'closed') {
            addToast('This task belongs to a closed investigation and cannot be edited', 'error');
            goto(`/tasks/${taskId}`);
            return;
          }
        }
      }
    } else {
      addToast('Failed to load task', 'error');
    }

    if (usersResult.ok) {
      users = usersResult.data.users ?? usersResult.data;
    }

    loading = false;
  });

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await patch(`/tasks/${taskId}`, {
      title,
      description,
      dueDate: dueDate || null,
      assignedToId: assignedToId || null,
    });

    if (result.ok) {
      addToast('Task updated!', 'success');
      goto(`/tasks/${taskId}`);
    } else if (result.status === 401) {
      addToast('Please log in', 'error');
      goto('/login');
    } else if (result.status === 403) {
      addToast('Only supervisors can edit tasks', 'error');
    } else {
      addToast('Failed to update task', 'error');
    }
    submitting = false;
  }
</script>

<hgroup>
  <h1>Edit Task</h1>
  <a href="/tasks/{taskId}">← Back to Task</a>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else}
  <article style="max-width: 600px;">
    <form onsubmit={handleSubmit}>
      <label>
        Title
        <input type="text" bind:value={title} required placeholder="Task title" />
      </label>

      <label>
        Description
        <textarea bind:value={description} rows={3} placeholder="Describe the task..."></textarea>
      </label>

      <label>
        Assign To
        <select bind:value={assignedToId}>
          <option value="">Unassigned</option>
          {#each users as u (u.id)}
            <option value={u.id}>{u.fullName}</option>
          {/each}
        </select>
      </label>

      <label>
        Due Date
        <input type="date" bind:value={dueDate} />
      </label>

      <div style="display: flex; gap: 1rem;">
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
        <a href="/tasks/{taskId}" role="button" class="secondary outline">Cancel</a>
      </div>
    </form>
  </article>
{/if}