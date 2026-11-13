import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  AuthenticationError,
  createEmail,
  err,
  ok,
  parseUserId,
  type AccountPassword,
  type AuthGateway,
  type Email,
  type Result,
  type User,
} from '../../domain';

export class FirebaseAuthGateway implements AuthGateway {
  constructor(private readonly auth: Auth) {}

  async signUp(email: Email, password: AccountPassword): Promise<Result<User, AuthenticationError>> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = this.mapFirebaseUser(cred.user);
      if (!user) {
        return err(new AuthenticationError('unavailable'));
      }
      return ok(user);
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        return err(new AuthenticationError('email-taken'));
      }
      return err(new AuthenticationError('unavailable'));
    }
  }

  async signIn(email: Email, password: AccountPassword): Promise<Result<User, AuthenticationError>> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const user = this.mapFirebaseUser(cred.user);
      if (!user) {
        return err(new AuthenticationError('invalid-credentials'));
      }
      return ok(user);
    } catch (error: any) {
      if (
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/user-not-found' ||
        error?.code === 'auth/invalid-credential'
      ) {
        return err(new AuthenticationError('invalid-credentials'));
      }
      return err(new AuthenticationError('unavailable'));
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    const current = this.auth.currentUser;
    if (!current) {
      return null;
    }
    return this.mapFirebaseUser(current);
  }

  private mapFirebaseUser(user: FirebaseUser): User | null {
    const idRes = parseUserId(user.uid);
    const emailRes = createEmail(user.email ?? '');
    if (idRes.ok && emailRes.ok) {
      return {
        id: idRes.value,
        email: emailRes.value,
      };
    }
    return null;
  }
}
