<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { post, get } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface User {
    id: string;
    fullName: string;
    email: string;
  }

  const user = $derived(getUser());
  const caseId = $derived($page.params.caseId);

  let title = $state('');
  let description = $state('');
  let dueDate = $state('');
  let assignedToId = $state('');
  let users: User[] = $state([]);
  let submitting = $state(false);

  onMount(async () => {
    if (!user) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }
    const result = await get<{ users: User[] }>('/users');
    if (result.ok) users = result.data.users;
  });

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await post(`/cases/${caseId}/tasks`, {
      title,
      description,
      dueDate: dueDate || null,
      assignedToId: assignedToId || null,
    });

    if (result.ok || result.status === 201) {
      addToast('Task created!', 'success');
      goto(`/cases/${caseId}`);
    } else if (result.status === 401) {
      addToast('Please log in', 'error');
      goto('/login');
    } else if (result.status === 403) {
      addToast('Only supervisors can create tasks', 'error');
    } else {
      addToast('Failed to create task', 'error');
    }
    submitting = false;
  }
</script>

<hgroup>
  <h1>Add Task</h1>
  <a href="/cases/{caseId}">← Back to Investigation</a>
</hgroup>

<article style="max-width: 600px;">
  <form onsubmit={handleSubmit}>
    <label>
      Title
      <input
        type="text"
        bind:value={title}
        required
        placeholder="Task title"
      />
    </label>

    <label>
      Description
      <textarea
        bind:value={description}
        rows={3}
        placeholder="Describe the task..."
      ></textarea>
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
        {submitting ? 'Creating...' : 'Create Task'}
      </button>
      <a href="/cases/{caseId}" role="button" class="secondary outline">Cancel</a>
    </div>
  </form>
</article>
