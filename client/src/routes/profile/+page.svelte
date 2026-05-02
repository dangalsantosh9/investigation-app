<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get, patch } from '$lib/api.js';
  import { getUser } from '$lib/auth.svelte.js';
  import { addToast } from '$lib/toast.svelte.js';

  interface Profile {
    id: string;
    email: string;
    fullName: string;
    role: string;
    profileViews: number;
  }

  const user = $derived(getUser());

  let profile: Profile | null = $state(null);
  let loading = $state(true);

  let fullName = $state('');
  let email = $state('');
  let submitting = $state(false);

  // ADDED: password change state
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let changingPassword = $state(false);

  onMount(async () => {
    if (!user) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    const result = await get<any>(`/users/${user.userId}/profile`);

    if (result.status === 401) {
      addToast('Please log in to continue', 'error');
      goto('/login');
      return;
    }

    if (result.ok) {
      profile = result.data.user ?? result.data;
      fullName = profile.fullName;
      email = profile.email;
    } else {
      addToast('Failed to load profile', 'error');
    }
    loading = false;
  });

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    submitting = true;

    const result = await patch<any>(`/users/${user?.userId}/profile`, {
      fullName,
      email,
    });

    if (result.ok) {
      addToast('Profile updated!', 'success');
      profile = result.data.user ?? result.data;
    } else if (result.status === 400) {
      addToast('Invalid input. Check your details.', 'error');
    } else {
      addToast('Failed to update profile', 'error');
    }
    submitting = false;
  }

  // ADDED: password change handler
  async function handlePasswordChange(e: Event): Promise<void> {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    changingPassword = true;

    const result = await patch<any>(`/users/${user?.userId}/password`, {
      currentPassword,
      newPassword,
    });

    if (result.ok) {
      addToast('Password changed successfully!', 'success');
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } else if (result.status === 403) {
      addToast('Current password is incorrect', 'error');
    } else if (result.status === 400) {
      addToast('Invalid input', 'error');
    } else {
      addToast('Failed to change password', 'error');
    }
    changingPassword = false;
  }
</script>

<hgroup>
  <h1>My Profile</h1>
</hgroup>

{#if loading}
  <p aria-busy="true">Loading...</p>
{:else if !profile}
  <p>Profile not found.</p>
{:else}
  <p>Role: <strong>{profile.role}</strong> | Profile Views: <strong>{profile.profileViews}</strong></p>

  <article style="max-width: 500px;">
    <header><h2>Edit Profile</h2></header>
    <form onsubmit={handleSubmit}>
      <label>
        Full Name
        <input type="text" bind:value={fullName} required placeholder="Your full name" />
      </label>

      <label>
        Email
        <input type="email" bind:value={email} required placeholder="your@email.com" />
      </label>

      <button type="submit" aria-busy={submitting} disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  </article>

  <!-- ADDED: password change section -->
  <article style="max-width: 500px; margin-top: 1.5rem;">
    <header><h2>Change Password</h2></header>
    <form onsubmit={handlePasswordChange}>
      <label>
        Current Password
        <input
          type="password"
          bind:value={currentPassword}
          required
          placeholder="••••••••"
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

      <button type="submit" aria-busy={changingPassword} disabled={changingPassword}>
        {changingPassword ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  </article>
{/if}