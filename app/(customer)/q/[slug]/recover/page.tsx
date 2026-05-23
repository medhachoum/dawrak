import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import RecoverTicketClient from "@/components/customer/RecoverTicketClient";

interface PageProps {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export default async function RecoverPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, nameAr: true },
  });
  if (!business) notFound();

  return (
    <RecoverTicketClient slug={params.slug} businessName={business.nameAr} />
  );
}
