import { BodyType } from "@/types";
import type { BodyId } from "@/types";
import type { StarSystemData } from "@/shared/contexts/StarSystemContext";

export function getPlanetViewId(
  selectedBody: BodyId,
  bodies: StarSystemData["bodies"],
): BodyId | null {
  const body = bodies[selectedBody];
  if (
    (body?.type === BodyType.Moon || body?.type === BodyType.Companion) &&
    body.parent
  ) {
    return body.parent as BodyId;
  }
  if (body && body.type !== BodyType.Belt) return selectedBody;
  return null;
}
