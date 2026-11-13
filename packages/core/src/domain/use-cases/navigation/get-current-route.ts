import type { AppRoute, NavigationPort } from '../../services/navigation-port';
import type { UseCase } from '../use-case';

export class GetCurrentRoute implements UseCase<void, AppRoute> {
  constructor(private readonly navigation: NavigationPort) {}

  async execute(): Promise<AppRoute> {
    return this.navigation.getCurrentRoute();
  }
}
