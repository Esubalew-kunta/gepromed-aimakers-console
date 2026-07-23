import {
    resolveEngineeringRoute,
    type EngineeringRoute,
  } from "./engineering-routing";
  
  export interface EngineeringNotificationInput {
    id: string;
    ref: string | null;
    kind: string;
    requester_name: string;
    requester_email: string;
    institution?: string | null;
    desired_date?: string | null;
    notes?: string | null;
    meta?: Record<string, unknown> | null;
  }
  
  export interface EngineeringNotification {
    requestId: string;
    reference: string;
    route: Extract<EngineeringRoute, { matched: true }>;
    realRecipient: string;
    equipmentKey: string | null;
    equipmentName: string | null;
    subject: string;
    body: string;
  }
  
  function requestTypeLabel(kind: string): string {
    if (kind === "explant") {
      return "Analyse d’explant";
    }
  
    if (kind === "test") {
      return "Prestation de test";
    }
  
    if (kind === "equipment") {
      return "Accès machine";
    }
  
    return "Demande d’ingénierie";
  }
  
  function clean(value: string | null | undefined): string {
    return value?.trim() || "Non renseigné";
  }
  
  export function buildEngineeringNotification(
    request: EngineeringNotificationInput,
    consoleBaseUrl?: string,
  ): EngineeringNotification | null {
    const equipmentKey =
      typeof request.meta?.item === "string"
        ? request.meta.item
        : null;
  
    const route = resolveEngineeringRoute(
      request.kind,
      equipmentKey,
    );
  
    if (!route.matched) {
      return null;
    }
  
    const reference = request.ref || request.id;
    const requestType = requestTypeLabel(request.kind);
    const equipmentName =
      route.equipmentName ||
      (typeof request.meta?.item_title === "string"
        ? request.meta.item_title
        : null);
  
    const subjectParts = [
      "[GEPROMED]",
      `Nouvelle demande — ${requestType}`,
      reference,
    ];
  
    if (equipmentName) {
      subjectParts.splice(2, 0, equipmentName);
    }
  
    const requestUrl = consoleBaseUrl
      ? `${consoleBaseUrl.replace(/\/$/, "")}/engineering`
      : null;
  
    const lines = [
      "Bonjour,",
      "",
      "Une nouvelle demande a été enregistrée depuis le site GEPROMED.",
      "",
      `Référence : ${reference}`,
      `Type : ${requestType}`,
    ];
  
    if (equipmentName) {
      lines.push(`Équipement : ${equipmentName}`);
    }
  
    if (equipmentKey) {
      lines.push(`Identifiant équipement : ${equipmentKey}`);
    }
  
    lines.push(
      `Routage : ${route.routeKey}`,
      "",
      `Demandeur : ${clean(request.requester_name)}`,
      `E-mail : ${clean(request.requester_email)}`,
      `Institution : ${clean(request.institution)}`,
    );
  
    if (request.kind === "equipment") {
      lines.push(
        `Créneau souhaité : ${clean(request.desired_date)}`,
      );
    }
  
    lines.push(
      "",
      "Message du demandeur :",
      clean(request.notes),
    );
  
    if (requestUrl) {
      lines.push(
        "",
        `Ouvrir la Console : ${requestUrl}`,
      );
    }
  
    lines.push(
      "",
      "Cet e-mail est une notification interne automatique.",
    );
  
    return {
      requestId: request.id,
      reference,
      route,
      realRecipient: route.recipient,
      equipmentKey,
      equipmentName,
      subject: subjectParts.join(" · "),
      body: lines.join("\n"),
    };
  }