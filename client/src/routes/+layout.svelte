<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchUser, getUser, setUser } from '$lib/auth.svelte.js';
  import { getToasts, removeToast } from '$lib/toast.svelte.js';
  import { del } from '$lib/api.js';
  import '@picocss/pico';

  let { children } = $props();

  let loaded = $state(false);
  const user = $derived(getUser());
  const toasts = $derived(getToasts());

  onMount(async () => {
    await fetchUser();
    loaded = true;
  });

  async function handleLogout(): Promise<void> {
    await del('/logout');
    setUser(null);
    goto('/');
  }
</script>

{#if !loaded}
  <p aria-busy="true">Loading...</p>
{:else}
  <nav class="container-fluid">
    <ul>
      <li><a href="/"><strong>Investigation App</strong></a></li>
    </ul>
    <ul>
      {#if user}
        <li><a href="/dashboard">Dashboard</a></li> <!-- CHANGED: was /cases -->
        <li><a href="/cases">Investigations</a></li>
        <li><a href="/profile">Profile</a></li>
        <li>
          <button onclick={handleLogout} class="outline secondary">
            Logout
          </button>
        </li>
      {:else}
        <li><a href="/login" role="button" class="outline">Login</a></li>
        <li><a href="/register" role="button">Register</a></li>
      {/if}
    </ul>
  </nav>

  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <article
        class="toast"
        class:toast-success={toast.type === 'success'}
        class:toast-error={toast.type === 'error'}
        class:toast-info={toast.type === 'info'}
        role="alert"
      >
        <span>{toast.message}</span>
        <button class="close-btn" onclick={() => removeToast(toast.id)}>✕</button>
      </article>
    {/each}
  </div>

  <main class="container">
    {@render children()}
  </main>

  <footer class="container">
    <small>About | Contact | Help</small>
  </footer>
{/if}

<style>
  nav {
    border-bottom: 1px solid var(--pico-muted-border-color);
    padding: 1rem;
  }

  main {
    padding: 2rem 1rem;
    min-height: 80vh;
  }

  footer {
    padding: 1rem;
    text-align: center;
    border-top: 1px solid var(--pico-muted-border-color);
  }

  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 360px;
  }

  .toast {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: var(--pico-border-radius);
    margin: 0;
  }

  .toast-success { background: #2d6a4f; color: white; }
  .toast-error { background: #d62828; color: white; }
  .toast-info { background: #1b6ca8; color: white; }

  .close-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0 0 0 0.5rem;
    font-size: 1rem;
  }
</style>