<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Update {
    id: string;
    message: string;
    createdAt: string;
    createdBy: { fullName: string };
  }

  interface Evidence {
    id: string;
    type: string;
    note: string;
    uploadedAt: string;
    uploadedBy: { fullName: string };
  }

  interface TimelineTask {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updates: Update[];
    evidence: Evidence[];
  }

  const user = $derived(getUser());
  const caseId = $derived($page.params.caseId);

  let caseTitle = $state('');
  let tasks: TimelineTask[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    const result = await get<any>(`/cases/${caseId}/timeline`);

    if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }
    if (result.ok) {
      caseTitle = result.data.case?.title ?? '';
      tasks = result.data.timeline ?? [];
    } else {
      addToast('Failed to load timeline', 'error');
    }
    loading = false;
  });
</script>

<hgroup>
  <h1>Case Timeline</h1>
  {#if caseTitle}<p>{caseTitle}</p>{/if}
  <a href="/cases/{caseId}">← Back to Investigation</a>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if tasks.length === 0}
  <p>No timeline events yet.</p>
{:else}
  {#each tasks as task (task.id)}
    <article>
      <header>
        <strong>{task.title}</strong>
        <small> — Status: {task.status} | Created: {new Date(task.createdAt).toLocaleDateString()}</small>
      </header>

      {#if task.updates?.length > 0}
        <section>
          <h4>Updates</h4>
          <ul>
            {#each task.updates as u (u.id)}
              <li>
                <strong>{u.createdBy.fullName}</strong>
                <small> — {new Date(u.createdAt).toLocaleString()}</small>
                <p>{u.message}</p>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if task.evidence?.length > 0}
        <section>
          <h4>Evidence</h4>
          <ul>
            {#each task.evidence as ev (ev.id)}
              <li>
                {ev.type} — {ev.note || 'No note'}
                <small> — Uploaded by {ev.uploadedBy.fullName}</small>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </article>
  {/each}
{/if}