import { Prisma } from '@prisma/client'

// Models that have soft-delete support (deletedAt field)
const SOFT_DELETE_MODELS = new Set([
  'FAClient',
  'FAHolding',
  'FATransaction',
  'FASIP',
  'FABankAccount',
  'BseUccRegistration',
  'BseMandate',
  'BseOrder',
  'BseChildOrder',
  'BsePayment',
  'NseUccRegistration',
  'NseMandate',
  'NseOrder',
  'NseChildOrder',
  'NsePayment',
  'NseSystematicRegistration',
])

/**
 * Prisma client extension for soft-delete support.
 *
 * For soft-delete models:
 * - `delete` → sets `deletedAt` instead of removing the row
 * - `findMany`/`findFirst`/`count`/`updateMany` → auto-filters `deletedAt: null`
 *
 * To include soft-deleted records in a query, explicitly pass `deletedAt` in where:
 *   prisma.faClient.findMany({ where: { deletedAt: { not: null } } })
 *
 * Note: This extension is defined for future use. Currently the PrismaService
 * does not auto-apply it — the critical safeguards are schema-level:
 * - `deletedAt DateTime?` on all financial models
 * - `onDelete: Restrict` on FAClient → financial child relations
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      async delete({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        // Convert delete to update with deletedAt
        const context = Prisma.getExtensionContext(this) as any
        return context[model].update({
          ...args,
          data: { deletedAt: new Date() },
        })
      },
      async deleteMany({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const context = Prisma.getExtensionContext(this) as any
        return context[model].updateMany({
          where: args.where,
          data: { deletedAt: new Date() },
        })
      },
      async findMany({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const where = args.where as any
        if (where?.deletedAt !== undefined) {
          return query(args)
        }
        args.where = { ...where, deletedAt: null }
        return query(args)
      },
      async findFirst({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const where = args.where as any
        if (where?.deletedAt !== undefined) {
          return query(args)
        }
        args.where = { ...where, deletedAt: null }
        return query(args)
      },
      async findUnique({ model, args, query }) {
        // findUnique only supports unique fields in where — pass through
        return query(args)
      },
      async findFirstOrThrow({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const where = args.where as any
        if (where?.deletedAt !== undefined) {
          return query(args)
        }
        args.where = { ...where, deletedAt: null }
        return query(args)
      },
      async count({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const where = (args as any).where as any
        if (where?.deletedAt !== undefined) {
          return query(args)
        }
        ;(args as any).where = { ...where, deletedAt: null }
        return query(args)
      },
      async updateMany({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.has(model)) {
          return query(args)
        }
        const where = args.where as any
        if (where?.deletedAt !== undefined) {
          return query(args)
        }
        args.where = { ...where, deletedAt: null }
        return query(args)
      },
    },
  },
})
