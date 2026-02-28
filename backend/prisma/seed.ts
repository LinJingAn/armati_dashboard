import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@safetyglasses.com' },
    update: {},
    create: {
      email: 'admin@safetyglasses.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('Created admin user:', adminUser.email);

  const demoCompany = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      cnpj: '12.345.678/0001-90',
      corporateName: 'Demo Company Ltda',
      email: 'contact@democompany.com',
      phone: '(11) 1234-5678',
      status: 'active',
    },
  });

  console.log('Created demo company:', demoCompany.corporateName);

  const managerPassword = await bcrypt.hash('manager123', 12);
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@democompany.com' },
    update: {},
    create: {
      email: 'manager@democompany.com',
      name: 'Company Manager',
      password: managerPassword,
      role: Role.COMPANY_MANAGER,
      companyId: demoCompany.id,
      isActive: true,
    },
  });

  console.log('Created manager user:', managerUser.email);

  const frames = [
    { modelName: 'SafeVision Pro', sku: 'SVP-001', color: 'Black', size: 'Medium', category: 'Safety Glasses', brand: 'SafeVision', price: 199.99 },
    { modelName: 'SafeVision Classic', sku: 'SVC-001', color: 'Brown', size: 'Large', category: 'Safety Glasses', brand: 'SafeVision', price: 149.99 },
    { modelName: 'SafeVision Sport', sku: 'SVS-001', color: 'Blue', size: 'Small', category: 'Safety Glasses', brand: 'SafeVision', price: 179.99 },
    { modelName: 'SafeVision Elite', sku: 'SVE-001', color: 'Silver', size: 'Medium', category: 'Prescription Safety', brand: 'SafeVision', price: 249.99 },
    { modelName: 'SafeVision Basic', sku: 'SVB-001', color: 'Black', size: 'Universal', category: 'Safety Glasses', brand: 'SafeVision', price: 99.99 },
    { modelName: '3M SecureFit', sku: '3M-SF-001', color: 'Black', size: 'Medium', category: 'Safety Glasses', brand: '3M', price: 159.99 },
    { modelName: 'Honeywell Uvex', sku: 'HW-UV-001', color: 'Gray', size: 'Large', category: 'Goggles', brand: 'Honeywell', price: 189.99 },
    { modelName: 'Uvex Sportstyle', sku: 'UV-SS-001', color: 'Orange', size: 'Medium', category: 'Safety Glasses', brand: 'Uvex', price: 169.99 },
    { modelName: 'Bollé Safety Rush', sku: 'BOL-SR-001', color: 'Clear', size: 'Small', category: 'Safety Glasses', brand: 'Bollé', price: 139.99 },
    { modelName: 'MSA Flexichem', sku: 'MSA-FC-001', color: 'Green', size: 'XL', category: 'Goggles', brand: 'MSA', price: 219.99 },
    { modelName: 'SafeVision Shield Pro', sku: 'SVSP-001', color: 'Clear', size: 'Universal', category: 'Face Shields', brand: 'SafeVision', price: 79.99 },
    { modelName: '3M Full Face Shield', sku: '3M-FS-001', color: 'Clear', size: 'Large', category: 'Face Shields', brand: '3M', price: 89.99 },
  ];

  for (const frame of frames) {
    await prisma.frame.upsert({
      where: { id: frame.sku },
      update: {},
      create: frame,
    });
  }

  console.log('Created sample frames');

  const employees = [
    { name: 'John Doe', department: 'Production', registration: 'EMP001', shift: 'Morning', unit: 'Factory A' },
    { name: 'Jane Smith', department: 'Quality Control', registration: 'EMP002', shift: 'Afternoon', unit: 'Factory A' },
    { name: 'Bob Wilson', department: 'Maintenance', registration: 'EMP003', shift: 'Night', unit: 'Factory B' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.registration },
      update: {},
      create: {
        ...emp,
        companyId: demoCompany.id,
      },
    });
  }

  console.log('Created sample employees');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
