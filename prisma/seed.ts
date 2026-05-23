/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Dawrak database...");

  // Clean slate (safe for dev)
  await prisma.queueEntry.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // 1) صالون الأمير للحلاقة
  const salon = await prisma.business.create({
    data: {
      name: "Salon Al-Amir",
      nameAr: "صالون الأمير للحلاقة",
      slug: "salon-al-amir",
      primaryColor: "#0F766E",
      phone: "+970599123456",
      timezone: "Asia/Riyadh",
      queues: {
        create: [
          {
            name: "الحلاقة الرجالية",
            status: "active",
            maxCapacity: 30,
            avgServiceTime: 20,
            entries: {
              create: [
                {
                  ticketNumber: 1,
                  customerName: "أحمد العلي",
                  customerPhone: "+970599111111",
                  status: "serving",
                  joinedAt: new Date(Date.now() - 40 * 60 * 1000),
                  calledAt: new Date(Date.now() - 25 * 60 * 1000),
                },
                {
                  ticketNumber: 2,
                  customerName: "خالد يوسف",
                  customerPhone: "+970599222222",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 30 * 60 * 1000),
                },
                {
                  ticketNumber: 3,
                  customerName: "سامي حسن",
                  customerPhone: "+970599333333",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 18 * 60 * 1000),
                },
                {
                  ticketNumber: 4,
                  customerName: "محمود إبراهيم",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 5 * 60 * 1000),
                },
              ],
            },
          },
          {
            name: "قص اللحية فقط",
            status: "paused",
            maxCapacity: 15,
            avgServiceTime: 10,
          },
        ],
      },
    },
  });

  // Owner for the salon
  const salonOwner = await prisma.user.create({
    data: {
      email: "owner@salon-al-amir.local",
      passwordHash,
      name: "مالك صالون الأمير",
      members: {
        create: { businessId: salon.id, role: "owner" },
      },
    },
  });

  // 2) مطعم الديوان
  const diwan = await prisma.business.create({
    data: {
      name: "Al-Diwan Restaurant",
      nameAr: "مطعم الديوان",
      slug: "mataem-al-diwan",
      primaryColor: "#B45309",
      phone: "+970599987654",
      timezone: "Asia/Riyadh",
      queues: {
        create: [
          {
            name: "طاولات العائلات",
            status: "active",
            maxCapacity: 60,
            avgServiceTime: 8,
            entries: {
              create: [
                {
                  ticketNumber: 1,
                  customerName: "عائلة أبو نصار",
                  customerPhone: "+970599444444",
                  status: "completed",
                  joinedAt: new Date(Date.now() - 90 * 60 * 1000),
                  calledAt: new Date(Date.now() - 80 * 60 * 1000),
                  completedAt: new Date(Date.now() - 30 * 60 * 1000),
                },
                {
                  ticketNumber: 2,
                  customerName: "عائلة الحاج",
                  customerPhone: "+970599555555",
                  status: "serving",
                  joinedAt: new Date(Date.now() - 45 * 60 * 1000),
                  calledAt: new Date(Date.now() - 10 * 60 * 1000),
                },
                {
                  ticketNumber: 3,
                  customerName: "عائلة شاهين",
                  customerPhone: "+970599666666",
                  status: "called",
                  joinedAt: new Date(Date.now() - 35 * 60 * 1000),
                  calledAt: new Date(Date.now() - 2 * 60 * 1000),
                },
                {
                  ticketNumber: 4,
                  customerName: "ليلى و أصدقاؤها",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 20 * 60 * 1000),
                },
                {
                  ticketNumber: 5,
                  customerName: "مجموعة طلاب",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 10 * 60 * 1000),
                },
              ],
            },
          },
          {
            name: "طلبات خارجية (Takeaway)",
            status: "active",
            maxCapacity: 40,
            avgServiceTime: 5,
            entries: {
              create: [
                {
                  ticketNumber: 1,
                  customerName: "زبون مجهول",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 8 * 60 * 1000),
                },
                {
                  ticketNumber: 2,
                  customerName: "رامي",
                  customerPhone: "+970599777777",
                  status: "waiting",
                  joinedAt: new Date(Date.now() - 3 * 60 * 1000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Owner for the restaurant
  const diwanOwner = await prisma.user.create({
    data: {
      email: "owner@mataem-al-diwan.local",
      passwordHash,
      name: "مالك مطعم الديوان",
      members: {
        create: { businessId: diwan.id, role: "owner" },
      },
    },
  });

  console.log(`✅ Created business: ${salon.nameAr} (${salon.slug})`);
  console.log(`   ↳ owner: ${salonOwner.email} / demo1234`);
  console.log(`✅ Created business: ${diwan.nameAr} (${diwan.slug})`);
  console.log(`   ↳ owner: ${diwanOwner.email} / demo1234`);
  console.log("🌱 Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
