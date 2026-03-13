import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function bootstrapAdmin() {
  const adminName = process.env.ADMIN || "Admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  try {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existing) {
      console.log(`[Bootstrap] Updating existing admin account: ${adminEmail}`);
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: adminName,
          password: hashedPassword,
          role: "superadmin",
        },
      });
    } else {
      console.log(`[Bootstrap] Creating new admin account: ${adminEmail}`);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: "superadmin",
        },
      });
    }
  } catch (err) {
    console.error("[Bootstrap] Error initializing admin:", err);
  }
}
