import { domain } from '@pronotes/core';

interface StoredSimUser {
  id: string;
  email: string;
  passwordHash: string;
}

export class LocalSimulatedAuthGateway implements domain.AuthGateway {
  private getUsers(): StoredSimUser[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem('pronotes_sim_auth_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredSimUser[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('pronotes_sim_auth_users', JSON.stringify(users));
  }

  async signUp(
    email: domain.Email,
    password: domain.AccountPassword,
  ): Promise<domain.Result<domain.User, domain.AuthenticationError>> {
    const users = this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return domain.err(new domain.AuthenticationError('email-taken'));
    }

    const idStr = 'usr_' + Math.random().toString(36).substring(2, 10);
    const idRes = domain.parseUserId(idStr);
    const userId = idRes.ok ? idRes.value : ('user-1' as domain.UserId);

    const newUser: StoredSimUser = {
      id: userId,
      email,
      passwordHash: btoa(password),
    };

    users.push(newUser);
    this.saveUsers(users);

    const domainUser: domain.User = { id: userId, email };
    localStorage.setItem('pronotes_sim_current_user', JSON.stringify(domainUser));
    return domain.ok(domainUser);
  }

  async signIn(
    email: domain.Email,
    password: domain.AccountPassword,
  ): Promise<domain.Result<domain.User, domain.AuthenticationError>> {
    const users = this.getUsers();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.passwordHash === btoa(password),
    );

    if (!found) {
      return domain.err(new domain.AuthenticationError('invalid-credentials'));
    }

    const domainUser: domain.User = {
      id: found.id as domain.UserId,
      email: found.email as domain.Email,
    };
    localStorage.setItem('pronotes_sim_current_user', JSON.stringify(domainUser));
    return domain.ok(domainUser);
  }

  async signOut(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pronotes_sim_current_user');
    }
  }

  async getCurrentUser(): Promise<domain.User | null> {
    if (typeof localStorage === 'undefined') return null;
    try {
      const data = localStorage.getItem('pronotes_sim_current_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}

export class LocalSimulatedSyncGateway implements domain.SyncGateway {
  constructor(
    private readonly noteRepo: domain.NoteRepository,
    private readonly tagRepo: domain.TagRepository,
    private readonly connectivity?: domain.ConnectivityMonitor,
  ) {}

  async synchronize(
    ownerId: domain.UserId,
  ): Promise<domain.Result<domain.SyncReport, domain.SyncFailedError>> {
    if (this.connectivity && !this.connectivity.isOnline()) {
      return domain.ok({ pushed: 0, pulled: 0 });
    }

    // Simulate minor network latency
    await new Promise((r) => setTimeout(r, 300));

    const localStandard = await this.noteRepo.findStandardByOwner(ownerId);
    const localVault = await this.noteRepo.findVaultByOwner(ownerId);
    const localTags = await this.tagRepo.findByOwner(ownerId);

    const pushedCount = localStandard.length + localVault.length + localTags.length;

    if (typeof localStorage !== 'undefined') {
      const snapshot = {
        ownerId,
        standardCount: localStandard.length,
        vaultCount: localVault.length,
        tagCount: localTags.length,
        syncedAt: new Date().toISOString(),
      };
      localStorage.setItem(`pronotes_sim_cloud_sync_${ownerId}`, JSON.stringify(snapshot));
    }

    return domain.ok({
      pushed: pushedCount,
      pulled: 0,
    });
  }
}
