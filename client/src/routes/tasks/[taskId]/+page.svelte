<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get, post, patch, postForm } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string | null;
    assignedTo: { userId: string; fullName: string } | null;
    createdBy: { fullName: string };
    caseEntity?: { id: string; status: string };
  }

  interface Update {
    id: string;
    message: string;
    createdAt: string;
    editedAt: string | null;
    createdBy: { fullName: string };
  }

  interface Evidence {
    id: string;
    type: string;
    note: string;
    uploadedAt: string;
    uploadedBy: { fullName: string };
  }

  const user = $derived(getUser());
  const taskId = $derived($page.params.taskId);

  let task: Task | null = $state(null);
  let updates: Update[] = $state([]);
  let evidence: Evidence[] = $state([]);
  let loading = $state(true);
  let caseClosed = $state(false);

  let newMessage = $state('');
  let postingUpdate = $state(false);

  let evidenceType = $state('file');
  let evidenceFile: File | null = $state(null);
  let evidenceNote = $state('');
  let uploading = $state(false);

  let newStatus = $state('');

  let editingUpdateId: string | null = $state(null);
  let editMessage = $state('');
  let savingUpdate = $state(false);

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    const [taskResult, updatesResult, evidenceResult] = await Promise.all([
      get<any>(`/tasks/${taskId}`),
      get<any>(`/tasks/${taskId}/updates`),
      get<any>(`/tasks/${taskId}/evidence`),
    ]);

    if (taskResult.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    if (taskResult.ok) {
      task = taskResult.data.task ?? taskResult.data;
      newStatus = task.status;

      // ADDED: check if parent case is closed
      if (task.caseEntity?.id) {
        const caseResult = await get<any>(`/cases/${task.caseEntity.id}`);
        if (caseResult.ok) {
          const c = caseResult.data.case ?? caseResult.data;
          caseClosed = c.status === 'closed';
        }
      }
    } else {
      addToast('Failed to load task', 'error');
    }

    if (updatesResult.ok) {
      updates = Array.isArray(updatesResult.data)
        ? updatesResult.data
        : updatesResult.data.updates ?? [];
    }

    if (evidenceResult.ok) {
      evidence = Array.isArray(evidenceResult.data)
        ? evidenceResult.data
        : evidenceResult.data.evidence ?? [];
    }

    loading = false;
  });

  async function postUpdate(e: Event): Promise<void> {
    e.preventDefault();
    if (!newMessage.trim()) return;
    postingUpdate = true;

    const result = await post<any>(`/tasks/${taskId}/updates`, {
      message: newMessage,
    });

    if (result.ok || result.status === 201) {
      addToast('Update posted', 'success');
      const refreshed = await get<any>(`/tasks/${taskId}/updates`);
      if (refreshed.ok) {
        updates = Array.isArray(refreshed.data)
          ? refreshed.data
          : refreshed.data.updates ?? [];
      }
      newMessage = '';
    } else if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
    } else {
      addToast('Failed to post update', 'error');
    }
    postingUpdate = false;
  }

  async function saveUpdate(e: Event, updateId: string): Promise<void> {
    e.preventDefault();
    if (!editMessage.trim()) return;
    savingUpdate = true;

    const result = await patch(`/updates/${updateId}`, { message: editMessage });

    if (result.ok) {
      addToast('Update edited', 'success');
      const refreshed = await get<any>(`/tasks/${taskId}/updates`);
      if (refreshed.ok) {
        updates = Array.isArray(refreshed.data)
          ? refreshed.data
          : refreshed.data.updates ?? [];
      }
      editingUpdateId = null;
      editMessage = '';
    } else {
      addToast('Failed to edit update', 'error');
    }
    savingUpdate = false;
  }

  function startEdit(u: Update): void {
    editingUpdateId = u.id;
    editMessage = u.message;
  }

  async function uploadEvidence(e: Event): Promise<void> {
    e.preventDefault();
    uploading = true;

    if (evidenceType === 'file') {
      if (!evidenceFile) {
        addToast('Please select a file', 'error');
        uploading = false;
        return;
      }
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('type', 'file');
      formData.append('note', evidenceNote);

      const result = await postForm<any>(`/tasks/${taskId}/evidence`, formData);

      if (result.ok || result.status === 201) {
        addToast('Evidence uploaded', 'success');
        const refreshed = await get<any>(`/tasks/${taskId}/evidence`);
        if (refreshed.ok) {
          evidence = Array.isArray(refreshed.data)
            ? refreshed.data
            : refreshed.data.evidence ?? [];
        }
        evidenceFile = null;
        evidenceNote = '';
      } else if (result.status === 401) {
        addToast('Please log in to continue', 'error');
        goto('/login');
      } else {
        addToast('Failed to upload evidence', 'error');
      }
    } else {
      if (!evidenceNote.trim()) {
        addToast('Please enter a note', 'error');
        uploading = false;
        return;
      }
      const formData = new FormData();
      formData.append('type', 'note');
      formData.append('note', evidenceNote);

      const result = await postForm<any>(`/tasks/${taskId}/evidence`, formData);

      if (result.ok || result.status === 201) {
        addToast('Note added', 'success');
        const refreshed = await get<any>(`/tasks/${taskId}/evidence`);
        if (refreshed.ok) {
          evidence = Array.isArray(refreshed.data)
            ? refreshed.data
            : refreshed.data.evidence ?? [];
        }
        evidenceNote = '';
      } else if (result.status === 401) {
        addToast('Please log in to continue', 'error');
        goto('/login');
      } else {
        addToast('Failed to add note', 'error');
      }
    }
    uploading = false;
  }

  async function changeStatus(): Promise<void> {
    if (!newStatus || newStatus === task?.status) return;

    const result = await patch(`/tasks/${taskId}/status`, { status: newStatus });
    if (result.ok) {
      addToast('Status updated', 'success');
      if (task) task = { ...task, status: newStatus };
    } else {
      addToast('Failed to update status', 'error');
    }
  }

  function handleFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    evidenceFile = input.files?.[0] ?? null;
  }
</script>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if !task}
  <p>Task not found.</p>
{:else}
  <hgroup>
    <h1>{task.title}</h1>
    <p>
      Status: <strong>{task.status}</strong>
      {#if task.assignedTo} | Assigned to: {task.assignedTo.fullName}{/if}
      {#if task.dueDate} | Due: {new Date(task.dueDate).toLocaleDateString()}{/if}
    </p>
  </hgroup>

  <p>{task.description}</p>

  <!-- CHANGED: hide Edit Task and Change Status if case is closed -->
  {#if !caseClosed}
    <a href="/tasks/{taskId}/edit" role="button" class="outline secondary" style="margin-bottom: 1rem; display: inline-block;">Edit Task</a>

    <details>
      <summary>Change Status</summary>
      <div style="display: flex; gap: 1rem; align-items: flex-end; margin-top: 0.5rem;">
        <label style="flex: 1;">
          New Status
          <select bind:value={newStatus}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <button onclick={changeStatus} class="outline">Update Status</button>
      </div>
    </details>
  {:else}
    <p><em>This task belongs to a closed investigation and cannot be modified.</em></p>
  {/if}

  <hr />

  <section>
    <h2>Progress Updates</h2>

    <!-- ADDED: hide post update form when case is closed -->
    {#if !caseClosed}
      <form onsubmit={postUpdate}>
        <label>
          Post an Update
          <textarea
            bind:value={newMessage}
            rows={3}
            placeholder="Describe your progress..."
            required
          ></textarea>
        </label>
        <button type="submit" aria-busy={postingUpdate} disabled={postingUpdate}>
          {postingUpdate ? 'Posting...' : 'Post Update'}
        </button>
      </form>
    {/if} <!-- ADDED -->

    {#if updates.length === 0}
      <p><em>No updates yet.</em></p>
    {:else}
      {#each updates as u (u.id)}
        <article>
          <header>
            <strong>{u.createdBy.fullName}</strong>
            <small> — {new Date(u.createdAt).toLocaleString()}</small>
            {#if u.editedAt}<small> (edited)</small>{/if}
            {#if u.createdBy.fullName === user?.fullName && !caseClosed} <!-- CHANGED: added !caseClosed -->
              <button
                class="outline secondary"
                style="margin-left: 1rem; padding: 0.2rem 0.5rem; font-size: 0.8rem;"
                onclick={() => startEdit(u)}
              >
                Edit
              </button>
              {#if editingUpdateId === u.id}
                <button
                  class="outline"
                  style="margin-left: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.8rem;"
                  onclick={() => { editingUpdateId = null; editMessage = ''; }}
                >
                  Cancel
                </button>
              {/if}
            {/if}
          </header>

          {#if editingUpdateId === u.id}
            <form onsubmit={(e) => saveUpdate(e, u.id)}>
              <textarea bind:value={editMessage} rows={2}></textarea>
              <button type="submit" aria-busy={savingUpdate} disabled={savingUpdate}>
                {savingUpdate ? 'Saving...' : 'Save'}
              </button>
            </form>
          {:else}
            <p>{u.message}</p>
          {/if}
        </article>
      {/each}
    {/if}
  </section>

  <hr />

  <section>
    <h2>Evidence</h2>

    <!-- ADDED: hide upload form when case is closed -->
    {#if !caseClosed}
      <form onsubmit={uploadEvidence}>
        <label>
          Evidence Type
          <select bind:value={evidenceType}>
            <option value="file">File Upload</option>
            <option value="note">Text Note</option>
          </select>
        </label>

        {#if evidenceType === 'file'}
          <label>
            Select File
            <input type="file" onchange={handleFileChange} />
          </label>
          <label>
            Note (optional)
            <input
              type="text"
              bind:value={evidenceNote}
              placeholder="Optional note about this file"
            />
          </label>
        {:else}
          <label>
            Note
            <textarea
              bind:value={evidenceNote}
              rows={3}
              placeholder="Enter your text note..."
              required
            ></textarea>
          </label>
        {/if}

        <button type="submit" aria-busy={uploading} disabled={uploading}>
          {uploading ? 'Saving...' : evidenceType === 'file' ? 'Upload Evidence' : 'Add Note'}
        </button>
      </form>
    {/if} <!-- ADDED -->

    {#if evidence.length === 0}
      <p><em>No evidence uploaded yet.</em></p>
    {:else}
      <ul>
        {#each evidence as ev (ev.id)}
          <li>
            {#if ev.type === 'file'}
              <a href="http://localhost:7715/evidence/{ev.id}/download" target="_blank">
                {ev.type} — {ev.note || 'No note'}
              </a>
            {:else}
              <span>📝 {ev.note}</span>
            {/if}
            <small>
              — Uploaded by {ev.uploadedBy.fullName}
              on {new Date(ev.uploadedAt).toLocaleDateString()}
            </small>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}