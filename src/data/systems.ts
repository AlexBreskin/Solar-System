import type { StarSystemMeta } from '../types';

type SystemModule = { system?: StarSystemMeta };

const modules = import.meta.glob('./systems/*.json', { eager: true }) as Record<string, SystemModule>;

export const STAR_SYSTEMS: StarSystemMeta[] = Object.values(modules)
  .filter((m): m is { system: StarSystemMeta } => !!m.system?.id)
  .map(m => m.system)
  .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
