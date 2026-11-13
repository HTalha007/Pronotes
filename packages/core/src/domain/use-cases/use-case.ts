/**
 * Application-level contract: one class = one user intention, a single
 * `execute`. Dependencies are injected through the constructor as ports.
 */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
