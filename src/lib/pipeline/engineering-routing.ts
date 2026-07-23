/**
 * Internal notification routing for Engineering requests.
 *
 * Client-approved rules:
 * - Explant analysis → explant@gepromed.com
 * - Testing service → r-d@gepromed.com
 * - Imaging/microscopy equipment → explant@gepromed.com
 * - Mechanical-testing equipment → r-d@gepromed.com
 *
 * Pure and client-safe: no database, environment, or network imports.
 */

export const EXPLANT_EMAIL = "explant@gepromed.com";
export const TESTING_EMAIL = "r-d@gepromed.com";

export const EQUIPMENT_NAMES = {
  "keyence-vhx-7100": "Keyence VHX-7100",
  "faxitron-pathvision": "Faxitron PathVision",
  "zeiss-sem-300": "ZEISS SEM 300",
  "keyence-vhx-s7000e-ea300": "Keyence VHX-S7000E + EA-300",
  "zeiss-xradia-context": "ZEISS Xradia Context (Micro-CT)",
  histology: "Histologie",
  "mts-insight-50kn": "MTS Insight 50 kN",
  "blockwise-ttr2": "Blockwise Model TTR2",
  "ta-electroforce-15-325":
    "TA Instruments ElectroForce 15-325",
} as const;

export type EquipmentKey = keyof typeof EQUIPMENT_NAMES;

const IMAGING_AND_MICROSCOPY = new Set<EquipmentKey>([
  "keyence-vhx-7100",
  "faxitron-pathvision",
  "zeiss-sem-300",
  "keyence-vhx-s7000e-ea300",
  "zeiss-xradia-context",
  "histology",
]);

const MECHANICAL_TESTING = new Set<EquipmentKey>([
  "mts-insight-50kn",
  "blockwise-ttr2",
  "ta-electroforce-15-325",
]);

export type EngineeringRoute =
  | {
      matched: true;
      recipient: string;
      routeKey:
        | "explant"
        | "testing"
        | "equipment.imaging"
        | "equipment.mechanical";
      equipmentKey: EquipmentKey | null;
      equipmentName: string | null;
    }
  | {
      matched: false;
      recipient: null;
      routeKey: "unmapped";
      equipmentKey: string | null;
      equipmentName: string | null;
      reason:
        | "missing_equipment"
        | "unknown_equipment"
        | "unknown_request_kind";
    };

export function resolveEngineeringRoute(
  kind: string,
  equipmentKey?: string | null,
): EngineeringRoute {
  if (kind === "explant") {
    return {
      matched: true,
      recipient: EXPLANT_EMAIL,
      routeKey: "explant",
      equipmentKey: null,
      equipmentName: null,
    };
  }

  if (kind === "test") {
    return {
      matched: true,
      recipient: TESTING_EMAIL,
      routeKey: "testing",
      equipmentKey: null,
      equipmentName: null,
    };
  }

  if (kind !== "equipment") {
    return {
      matched: false,
      recipient: null,
      routeKey: "unmapped",
      equipmentKey: equipmentKey ?? null,
      equipmentName: null,
      reason: "unknown_request_kind",
    };
  }

  if (!equipmentKey) {
    return {
      matched: false,
      recipient: null,
      routeKey: "unmapped",
      equipmentKey: null,
      equipmentName: null,
      reason: "missing_equipment",
    };
  }

  if (!(equipmentKey in EQUIPMENT_NAMES)) {
    return {
      matched: false,
      recipient: null,
      routeKey: "unmapped",
      equipmentKey,
      equipmentName: null,
      reason: "unknown_equipment",
    };
  }

  const key = equipmentKey as EquipmentKey;
  const equipmentName = EQUIPMENT_NAMES[key];

  if (IMAGING_AND_MICROSCOPY.has(key)) {
    return {
      matched: true,
      recipient: EXPLANT_EMAIL,
      routeKey: "equipment.imaging",
      equipmentKey: key,
      equipmentName,
    };
  }

  if (MECHANICAL_TESTING.has(key)) {
    return {
      matched: true,
      recipient: TESTING_EMAIL,
      routeKey: "equipment.mechanical",
      equipmentKey: key,
      equipmentName,
    };
  }

  // Defensive fallback if a new equipment name is added without a routing group.
  return {
    matched: false,
    recipient: null,
    routeKey: "unmapped",
    equipmentKey: key,
    equipmentName,
    reason: "unknown_equipment",
  };
}