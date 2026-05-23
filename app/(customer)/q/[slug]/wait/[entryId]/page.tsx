import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  QUEUE_ENTRY_STATUS,
  type QueueEntryStatus,
  type QueueStatus,
} from "@/lib/constants";
import {
  calculatePosition,
  estimateWaitTime,
  formatTicketDisplay,
} from "@/lib/queue-utils";
import { WaitingPageClient } from "@/components/customer/WaitingPageClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string; entryId: string };
};

export default async function WaitPage({ params }: PageProps) {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: params.entryId },
    include: {
      queue: {
        include: {
          business: true,
        },
      },
    },
  });

  if (!entry) notFound();
  if (entry.queue.business.slug !== params.slug) notFound();

  const business = entry.queue.business;
  const queue = entry.queue;

  const position = await calculatePosition(entry.id);
  const estimatedWaitMinutes = estimateWaitTime(
    position,
    queue.avgServiceTime,
  );
  const totalWaiting = await prisma.queueEntry.count({
    where: {
      queueId: queue.id,
      status: QUEUE_ENTRY_STATUS.waiting,
    },
  });

  return (
    <WaitingPageClient
      shopSlug={business.slug}
      shopNameAr={business.nameAr}
      primaryColor={business.primaryColor || "#0F766E"}
      entry={{
        id: entry.id,
        queueId: entry.queueId,
        ticketNumber: entry.ticketNumber,
        ticketDisplay: formatTicketDisplay(entry.ticketNumber),
        customerName: entry.customerName,
        status: entry.status as QueueEntryStatus,
        joinedAt: entry.joinedAt.toISOString(),
      }}
      queue={{
        id: queue.id,
        name: queue.name,
        avgServiceTime: queue.avgServiceTime,
        status: queue.status as QueueStatus,
      }}
      initialPosition={position}
      initialEstimatedWaitMinutes={estimatedWaitMinutes}
      initialTotalWaiting={totalWaiting}
    />
  );
}
