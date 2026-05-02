<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get, patch } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  const user = $derived(getUser());
  const caseId = $derived($page.params.caseId);

  let title = $state('');
  let description = $state('');
  let priority = $state('medium');
  let dueDate = $state('');
  let status = $state('open');
  let loading = $state(true);
  let submitting = $state(false);

  onMount(async () => {
    if (!user) {
      addToast('Please log in', 'error');
      goto('/login');
      return;
    }

    const result = await get<any>(`/cases/${caseId}`);
    if (result.ok) {
      const c = result.data.case ?? result.data;
      title = c.title;
      description = c.description ?? '';
      priority = c.priority;
      status = c.status;
      dueDate = c.dueDate ? c.dueDate.split('T')[0] : '';

      // ADDED: redirect away if case is closed
      if (c.status === 'closed') {
        addToast('This investigation is closed and cannot be edited', 'error');
        goto(`/cases/${caseId}`);
        return;
      }
    } else {
      addToast('Failed to load case', 'error');
    }
    loading = false;
  });

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await patch(`/cases/${caseId}`, {
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
    });

    if (result.ok) {
      addToast('Case updated!', 'success');
      goto(`/cases/${caseId}`);
    } else if (result.status === 401) {
      addToast('Please log in', 'error');
      goto('/login');
    } else if (result.status === 403) {
      // CHANGED: differentiate between closed case and role error
      const msg = result.data?.error ?? '';
      if (msg === 'Cannot modify a closed case') {
        addToast('This investigation is closed and cannot be edited', 'error');
      } else {
        addToast('Only supervisors can edit cases', 'error');
      }
    } else {
      addToast('Failed to update case', 'error');
    }
    submitting = false;
  }
</script>

<hgroup>
  <h1>Edit Investigation</h1>
  <a href="/cases/{caseId}">← Back to Investigation</a>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else}
  <article style="max-width: 600px;">
    <form onsubmit={handleSubmit}>
      <label>
        Title
        <input type="text" bind:value={title} required placeholder="Investigation title" />
      </label>

      <label>
        Description
        <textarea bind:value={description} rows={4} placeholder="Describe the investigation..."></textarea>
      </label>

      <label>
        Priority
        <select bind:value={priority}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <label>
        Status
        <select bind:value={status}>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
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
        <a href="/cases/{caseId}" role="button" class="secondary outline">Cancel</a>
      </div>
    </form>
  </article>
{/if}