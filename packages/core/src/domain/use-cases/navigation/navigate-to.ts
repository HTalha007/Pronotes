import type { AppRoute, NavigationPort } from '../../services/navigation-port';
import type { UseCase } from '../use-case';

export interface NavigateToInput {
  readonly route: AppRoute;
}

export class NavigateTo implements UseCase<NavigateToInput, void> {
  constructor(private readonly navigation: NavigationPort) {}

  async execute(input: NavigateToInput): Promise<void> {
    this.navigation.navigateTo(input.route);
  }
}
