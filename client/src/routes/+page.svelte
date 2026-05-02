<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getUser } from '$lib/auth.svelte.js';
  import { get } from '$lib/api.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Case {
    id: string;  // CHANGED: was caseId
    title: string;
    status: string;
    priority: string;
  }

  const user = $derived(getUser());

  let cases: Case[] = $state([]);
  let loading = $state(false);

  onMount(async () => {
    if (!user) return;

    loading = true;
    const result = await get<any>('/cases');
    if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }
    if (result.ok) {
      // CHANGED: backend returns { cases: [...] }
      cases = Array.isArray(result.data) ? result.data : result.data.cases ?? [];
    } else {
      addToast('Failed to load investigations', 'error');
    }
    loading = false;
  });
</script>

{#if !user}
  <hgroup>
    <h1>Investigation App</h1>
    <p>Track, create, and manage investigations</p>
  </hgroup>

  <div style="display: flex; gap: 1rem;">
    <a href="/register" role="button">Get Started</a>
    <a href="/login" role="button" class="outline secondary">Login</a>
  </div>
{:else}
  <hgroup>
    <h1>Welcome, {user.fullName}</h1>
    <p>Track, create, and manage investigations</p>
  </hgroup>

  {#if loading}
    <p aria-busy="true">Loading...</p>
  {:else if cases.length === 0}
    <p>No investigations found.</p>
  {:else}
    <ul>
      {#each cases as c (c.id)}
        <li>
          <a href="/cases/{c.id}">{c.title}</a>
          <small> — {c.status} / {c.priority}</small>
        </li>
      {/each}
    </ul>
  {/if}
{/if}