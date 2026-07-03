import { PageHeader } from "@/components/PageHeader";
import { LmsHandoff } from "@/components/LmsHandoff";

export const dynamic = "force-dynamic";

export default function LmsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Enablement"
        title="LMS handoff"
        description="Generate an internal micro-training with AI and publish it to your Learning Management System. This demo runs the full flow with a mock LMS — no LMS API is required."
      />
      <LmsHandoff />
    </>
  );
}
