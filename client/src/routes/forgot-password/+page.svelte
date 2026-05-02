<script lang="ts">
  import { goto } from '$app/navigation';
  import { post } from '$lib/api.js';
  import { addToast } from '$lib/toast.svelte.js';

  let email = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let submitting = $state(false);

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    submitting = true;

    const result = await post<any>('/forgot-password', {
      email,
      newPassword,
    });

    if (result.ok) {
      addToast('Password reset successfully! Please log in.', 'success');
      goto('/login');
    } else if (result.status === 404) {
      addToast('No account found with that email', 'error');
    } else if (result.status === 400) {
      addToast('Invalid input', 'error');
    } else {
      addToast('Failed to reset password', 'error');
    }
    submitting = false;
  }
</script>

<article style="max-width: 400px; margin: 0 auto;">
  <header><h2>Reset Password</h2></header>

  <p>Enter your email and a new password to reset your account.</p>

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
      New Password
      <input
        type="password"
        bind:value={newPassword}
        required
        placeholder="••••••••"
      />
    </label>

    <label>
      Confirm New Password
      <input
        type="password"
        bind:value={confirmPassword}
        required
        placeholder="••••••••"
      />
    </label>

    <button type="submit" aria-busy={submitting} disabled={submitting}>
      {submitting ? 'Resetting...' : 'Reset Password'}
    </button>
  </form>

  <footer>
    <small>Remember your password? <a href="/login">Login</a></small>
  </footer>
</article>