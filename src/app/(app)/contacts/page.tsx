import { PageHeader } from "@/components/PageHeader";
import { getContactMessages } from "@/lib/contacts-data";
import { ContactsList } from "@/components/ContactsList";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const messages = await getContactMessages();

  return (
    <>
      <PageHeader
        eyebrow="Contacts"
        title="Contact messages"
        description="Submissions from the website's Contact page. New messages are highlighted; mark them read or archive once handled."
      />
      <ContactsList messages={messages} />
    </>
  );
}
