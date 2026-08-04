import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const schemaPath = resolve(root, 'prisma/schema.prisma')
const navigationPath = resolve(root, 'src/lib/settings/navigation.ts')

const requiredOverlayFiles = [
  'src/app/(dashboard)/settings/master-data/reference-data/page.tsx',
  'src/app/(dashboard)/settings/master-data/reference-data/loading.tsx',
  'src/app/(dashboard)/settings/master-data/reference-data/error.tsx',
  'src/app/actions/reference-data.actions.ts',
  'src/components/settings/reference-data/ReferenceCategoryForm.tsx',
  'src/components/settings/reference-data/ReferenceDataManager.tsx',
  'src/components/settings/reference-data/ReferenceStatusToggle.tsx',
  'src/components/settings/reference-data/ReferenceValueForm.tsx',
  'src/lib/reference-data/types.ts',
  'src/lib/repositories/reference-data-repository.ts',
  'src/lib/services/reference-data-service.ts',
  'src/lib/validation/reference-data.schema.ts',
  'prisma/migrations/20260729010000_reference_data_module/migration.sql',
]

const referenceModels = `// ─── Reference Data ────────────────────────────────────────
model ReferenceDataCategory {
  id String @id @default(cuid())

  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  code        String
  nameEn      String
  nameAr      String?
  description String?
  isSystem    Boolean @default(false)
  isActive    Boolean @default(true)

  createdBy String?
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  values ReferenceDataValue[]

  @@unique([companyId, code])
  @@index([companyId, isActive])
  @@index([companyId, nameEn])
}

model ReferenceDataValue {
  id String @id @default(cuid())

  categoryId String
  category   ReferenceDataCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  code         String
  nameEn       String
  nameAr       String?
  description  String?
  displayOrder Int     @default(0)
  isDefault    Boolean @default(false)
  isSystem     Boolean @default(false)
  isActive     Boolean @default(true)

  createdBy String?
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([categoryId, code])
  @@index([categoryId, isActive, displayOrder])
  @@index([categoryId, isDefault])
}
`

function fail(message) {
  console.error(`Reference Data installer: ${message}`)
  process.exit(1)
}

function assertOverlayFiles() {
  const missing = requiredOverlayFiles.filter(file => !existsSync(resolve(root, file)))
  if (missing.length > 0) {
    fail(`missing extracted files:\n- ${missing.join('\n- ')}`)
  }
}

function patchSchema() {
  if (!existsSync(schemaPath)) fail('prisma/schema.prisma was not found')

  let schema = readFileSync(schemaPath, 'utf8')
  let changed = false

  if (!schema.includes('referenceDataCategories ReferenceDataCategory[]')) {
    const companyRelationsPattern = /(\s*\/\/ Relations\r?\n\s*branches\s+Branch\[\]\r?\n)/
    if (!companyRelationsPattern.test(schema)) {
      fail('could not locate the Company relations block in prisma/schema.prisma')
    }

    schema = schema.replace(
      companyRelationsPattern,
      match => `${match}  referenceDataCategories ReferenceDataCategory[]\n`,
    )
    changed = true
  }

  if (!schema.includes('model ReferenceDataCategory {')) {
    const branchesMarker = '// ─── Branches ─────────────────────────────────────────────'
    if (!schema.includes(branchesMarker)) {
      fail('could not locate the Branches section marker in prisma/schema.prisma')
    }

    schema = schema.replace(branchesMarker, `${referenceModels}\n${branchesMarker}`)
    changed = true
  }

  if (changed) {
    writeFileSync(schemaPath, schema, 'utf8')
    console.log('Updated prisma/schema.prisma')
  } else {
    console.log('prisma/schema.prisma already contains the Reference Data models')
  }
}

function patchNavigation() {
  if (!existsSync(navigationPath)) fail('src/lib/settings/navigation.ts was not found')

  let navigation = readFileSync(navigationPath, 'utf8')

  const referenceBlockPattern = /(slug:\s*'reference-data'[\s\S]*?status:\s*)'Coming soon'/
  if (referenceBlockPattern.test(navigation)) {
    navigation = navigation.replace(referenceBlockPattern, "$1'Available'")
    writeFileSync(navigationPath, navigation, 'utf8')
    console.log('Marked Reference Data as Available in settings navigation')
    return
  }

  const alreadyAvailablePattern = /slug:\s*'reference-data'[\s\S]*?status:\s*'Available'/
  if (alreadyAvailablePattern.test(navigation)) {
    console.log('Settings navigation already marks Reference Data as Available')
    return
  }

  fail('could not locate the Reference Data settings navigation entry')
}

assertOverlayFiles()
patchSchema()
patchNavigation()

console.log('\nReference Data module files are ready.')
console.log('Next: npm run db:generate && npm run db:migrate:dev && npm run typecheck')
