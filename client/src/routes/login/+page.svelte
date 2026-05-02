<script lang="ts">
  import { goto } from '$app/navigation';
  import { post } from '$lib/api.js';
  import { fetchUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  let email = $state('');
  let password = $state('');
  let submitting = $state(false);

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await post<{ message: string }>('/login', { email, password });

    if (result.ok) {
      await fetchUser();
      addToast('Logged in successfully', 'success');
      goto('/cases');
    } else if (result.status === 403) {
      addToast('Invalid email or password', 'error');
    } else {
      addToast('Something went wrong. Try again.', 'error');
    }

    submitting = false;
  }
</script>

<article style="max-width: 400px; margin: 0 auto;">
  <header><h2>Login</h2></header>

  <form onsubmit={handleSubmit}>
    <label>
      Email
      <input
        type="email"
        bind:value={email}
        required
        placeholder="you@example.com"
      />
    </label>

    <label>
      Password
      <input
        type="password"
        bind:value={password}
        required
        placeholder="••••••••"
      />
    </label>

    <button type="submit" aria-busy={submitting} disabled={submitting}>
      {submitting ? 'Logging in...' : 'Login'}
    </button>
  </form>

  <footer>
    <small>Don't have an account? <a href="/register">Register</a></small>
    <br /> <!-- ADDED -->
    <small><a href="/forgot-password">Forgot your password?</a></small> <!-- ADDED -->
  </footer>
</article>