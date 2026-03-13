import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create first category
  const cat1 = await prisma.forumCategory.create({
    data: {
      name: "DoraTeam Core",
      position: 0,
      channels: {
        create: [
          { name: "announcements", description: "Official system updates", type: "text", position: 0 },
          { name: "general-chat", description: "General bypass discussion", type: "text", position: 1 },
          { name: "rules-and-info", description: "Read before execution", type: "text", position: 2 },
        ]
      }
    }
  });

  // Create second category
  const cat2 = await prisma.forumCategory.create({
    data: {
      name: "Knowledge Base",
      position: 1,
      channels: {
        create: [
          { name: "technical-q-a", description: "Detailed forum discussions", type: "forum", position: 0 },
          { name: "mod-showcase", description: "Show off your bypasses", type: "forum", position: 1 },
        ]
      }
    }
  });

  console.log("Forum seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
