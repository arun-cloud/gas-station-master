import { PrismaClient, FuelType, Nozzle, Role } from './generated/client'
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";


import bcrypt from 'bcryptjs'
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DIRECT_URL or DATABASE_URL is not configured.",
  );
}


// 1. Setup the connection pool
const pool = new pg.Pool({ connectionString });
// 2. Initialize the adapter
const adapter = new PrismaPg(pool);
// 3. Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });



async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@gasstation.com' },
    update: {},
    create: {
      name: 'Station Admin',
      email: 'admin@gasstation.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  const company = await prisma.company.upsert({
    where: {
      vatNumber: "300000000000003",
    },

    update: {
      nameEn: "Fuel Arkan",
      nameAr: "أركان الوقود",

      legalNameEn: "Fuel Arkan Company LLC",
      legalNameAr: "شركة أركان الوقود ذات مسؤولية محدودة",

      buildingNo: "1234",
      street: "Abdullah Sulayman Street",
      district: "Al Jami'ah",
      city: "Jeddah",
      postalCode: "22230",
      additionalNo: "5678",

      crNumber: "1010123456",
      logo: null,
    },

    create: {
      nameEn: "Fuel Arkan",
      nameAr: "أركان الوقود",

      legalNameEn: "Fuel Arkan Company LLC",
      legalNameAr: "شركة أركان الوقود ذات مسؤولية محدودة",

      buildingNo: "1234",
      street: "Abdullah Sulayman Street",
      district: "Al Jami'ah",
      city: "Jeddah",
      postalCode: "22230",
      additionalNo: "5678",

      vatNumber: "300000000000003",
      crNumber: "1010123456",
      logo: null,
    },
  });

  console.log(`Company seeded: ${company.nameEn}`);

  const branch = await prisma.branch.upsert({
    where: {
      branchCode: "JED-01",
    },

    update: {
      nameEn: "Fuel Arkan - Jeddah Main Station",
      nameAr: "أركان الوقود - محطة جدة الرئيسية",
      companyId: company.id,
    },

    create: {
      nameEn: "Fuel Arkan - Jeddah Main Station",
      nameAr: "أركان الوقود - محطة جدة الرئيسية",
      branchCode: "JED-01",

      buildingNo: "1234",
      street: "Abdullah Sulayman Street",
      district: "Al Jami'ah",
      city: "Jeddah",
      postalCode: "22230",

      companyId: company.id,
    },
  });

  console.log(`Branch seeded: ${branch.nameEn}`);

  const fuelTankData = [
    {
      tankNumber: 1,
      fuelType: FuelType.PETROL_91,
      capacity: "50000",
      currentLevel: "32000",
      minLevel: "5000",
    },
    {
      tankNumber: 2,
      fuelType: FuelType.PETROL_95,
      capacity: "30000",
      currentLevel: "18500",
      minLevel: "3000",
    },
    {
      tankNumber: 3,
      fuelType: FuelType.DIESEL,
      capacity: "60000",
      currentLevel: "41000",
      minLevel: "6000",
    },
    {
      tankNumber: 4,
      fuelType: FuelType.PREMIUM_DIESEL,
      capacity: "20000",
      currentLevel: "4200",
      minLevel: "2000",
    },
  ];

  for (const tank of fuelTankData) {
    const fuelTank = await prisma.fuelTank.upsert({
      where: {
        branchId_tankNumber: {
          branchId: branch.id,
          tankNumber: tank.tankNumber,
        },
      },

      update: {
        fuelType: tank.fuelType,
        capacity: tank.capacity,
        currentLevel: tank.currentLevel,
        minLevel: tank.minLevel,
      },

      create: {
        branchId: branch.id,
        tankNumber: tank.tankNumber,
        fuelType: tank.fuelType,
        capacity: tank.capacity,
        currentLevel: tank.currentLevel,
        minLevel: tank.minLevel,
      },
    });

    console.log(
      `Fuel tank seeded: Tank ${fuelTank.tankNumber} - ${fuelTank.fuelType}`,
    );
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
