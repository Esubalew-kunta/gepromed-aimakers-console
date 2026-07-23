import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  buildEngineeringNotification,
  type EngineeringNotificationInput,
} from "@/lib/pipeline/engineering-notifications";

export const runtime = "nodejs";

type DeliveryMode = "disabled" | "test" | "live";

function secureEqual(
    supplied: string,
    expected: string,
  ): boolean {
    const encoder = new TextEncoder();
    const suppliedBytes = encoder.encode(supplied);
    const expectedBytes = encoder.encode(expected);
  
    if (suppliedBytes.length !== expectedBytes.length) {
      return false;
    }
  
    return timingSafeEqual(
      suppliedBytes,
      expectedBytes,
    );
  }

function deliveryMode(): DeliveryMode {
  const value = process.env.ENG_INTERNAL_EMAIL_MODE;

  if (value === "test" || value === "live") {
    return value;
  }

  return "disabled";
}

function validRecord(
  value: unknown,
): value is EngineeringNotificationInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.kind === "string" &&
    typeof record.requester_name === "string" &&
    typeof record.requester_email === "string"
  );
}

export async function POST(request: Request) {
  const expectedSecret =
    process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Webhook authentication is not configured.",
      },
      { status: 503 },
    );
  }

  const suppliedSecret =
    request.headers.get("x-webhook-secret") ?? "";

  if (!secureEqual(suppliedSecret, expectedSecret)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const record =
    payload &&
    typeof payload === "object" &&
    "record" in payload
      ? (payload as { record: unknown }).record
      : null;

  if (!validRecord(record)) {
    return NextResponse.json(
      {
        ok: false,
        error: "A valid engineering request record is required.",
      },
      { status: 400 },
    );
  }

  const notification = buildEngineeringNotification(
    record,
    process.env.CONSOLE_BASE_URL,
  );

  if (!notification) {
    return NextResponse.json(
      {
        ok: false,
        error: "No approved route exists for this request.",
        requestId: record.id,
        equipmentKey:
          typeof record.meta?.item === "string"
            ? record.meta.item
            : null,
      },
      { status: 422 },
    );
  }

  const mode = deliveryMode();

  if (mode === "disabled") {
    return NextResponse.json({
      ok: true,
      deliveryEnabled: false,
      mode,
      notification: {
        ...notification,
        deliveryRecipient: null,
      },
    });
  }

  if (mode === "test") {
    const testRecipient =
      process.env.ENG_INTERNAL_EMAIL_TEST_RECIPIENT?.trim();

    if (!testRecipient) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Test mode requires ENG_INTERNAL_EMAIL_TEST_RECIPIENT.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      deliveryEnabled: true,
      mode,
      notification: {
        ...notification,
        deliveryRecipient: testRecipient,
        subject:
          `[TEST → ${notification.realRecipient}] ` +
          notification.subject,
        body:
          `MODE TEST\n` +
          `Destination réelle : ${notification.realRecipient}\n\n` +
          notification.body,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    deliveryEnabled: true,
    mode,
    notification: {
      ...notification,
      deliveryRecipient: notification.realRecipient,
    },
  });
}