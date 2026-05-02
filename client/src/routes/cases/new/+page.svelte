<script lang="ts">
  import { goto } from '$app/navigation';
  import { post } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';
  import { onMount } from 'svelte';

  const user = $derived(getUser());

  let title = $state('');
  let description = $state('');
  let status = $state('open');
  let priority = $state('medium');
  let dueDate = $state('');
  let submitting = $state(false);

  onMount(() => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
    }
  });

  async function handleSubmit(): Promise<void> {
    if (!title.trim()) {
      addToast('Title is required', 'error');
      return;
    }

    submitting = true;

    const result = await post<any>('/cases', {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null,
    });

    if (result.ok) {
      const created = result.data.case ?? result.data;
      addToast('Investigation created', 'success');
      goto(`/cases/${created.id}`);
    } else if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
    } else {
      addToast('Failed to create investigation', 'error');
      submitting = false;
    }
  }
</script>

<hgroup>
  <h1>New Investigation</h1>
  <p>Fill in the details below to open a new investigation.</p>
</hgroup>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <label>
    Title <span aria-hidden="true">*</span>
    <input
      type="text"
      bind:value={title}
      placeholder="Investigation title"
      required
      disabled={submitting}
    />
  </label>

  <label>
    Description
    <textarea
      bind:value={description}
      placeholder="Describe the investigation..."
      rows="4"
      disabled={submitting}
    ></textarea>
  </label>

  <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
    <label style="flex: 1; min-width: 160px;">
      Status
      <select bind:value={status} disabled={submitting}>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
    </label>

    <label style="flex: 1; min-width: 160px;">
      Priority
      <select bind:value={priority} disabled={submitting}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </label>
  </div>

  <label>
    Due Date
    <input
      type="date"
      bind:value={dueDate}
      disabled={submitting}
    />
  </label>

  <div style="display: flex; gap: 1rem; margin-top: 1rem;">
    <button type="submit" aria-busy={submitting} disabled={submitting}>
      {submitting ? 'Creating...' : 'Create Investigation'}
    </button>
    <a href="/cases" role="button" class="outline secondary">Cancel</a>
  </div>
</form>