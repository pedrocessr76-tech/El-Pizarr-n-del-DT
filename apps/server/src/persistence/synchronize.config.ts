export function resolveSynchronize(explicitValue: string | undefined, isProduction: boolean): boolean {
  if (isProduction) return false;
  if (explicitValue === 'true') return true;
  if (explicitValue === 'false') return false;
  return true;
}