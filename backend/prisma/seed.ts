import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@deligourmet.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed.');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@deligourmet.com',
      password: hashedPassword,
      nombre: 'Administrador',
      rol: 'ADMIN',
      activo: true,
    },
  });

  console.log('✅ Admin user created:');
  console.log('   Email:', admin.email);
  console.log('   Password: Admin123!');
  console.log('   Role:', admin.rol);
  console.log('');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
