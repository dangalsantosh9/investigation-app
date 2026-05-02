<script lang="ts">
  import { goto } from '$app/navigation';
  import { post } from '$lib/api.js';
  import { addToast } from '$lib/toast.svelte.js';

  let email = $state('');
  let password = $state('');
  let fullName = $state('');
  let submitting = $state(false);

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await post<{ message: string }>('/register', {
      email,
      password,
      fullName,
    });

    if (result.ok || result.status === 201) {
      addToast('Account created! Please log in.', 'success');
      goto('/login');
    } else if (result.status === 400) {
      addToast('Invalid input. Check your details.', 'error');
    } else if (result.status === 409) {
      addToast('An account with that email already exists.', 'error');
    } else {
      addToast('Something went wrong. Try again.', 'error');
    }

    submitting = false;
  }
</script>

<article style="max-width: 400px; margin: 0 auto;">
  <header><h2>Register</h2></header>

  <form onsubmit={handleSubmit}>
    <label>
      Full Name
      <input
        type="text"
        bind:value={fullName}
        required
        placeholder="Jane Smith"
      />
    </label>

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
      {submitting ? 'Creating account...' : 'Create Account'}
    </button>
  </form>

  <footer>
    <small>Already have an account? <a href="/login">Login</a></small>
  </footer>
</article>