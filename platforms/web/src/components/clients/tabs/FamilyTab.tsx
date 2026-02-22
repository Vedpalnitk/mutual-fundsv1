import { useRouter } from 'next/router'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAChip,
  FAEmptyState,
} from '@/components/advisor/shared'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  aum: number
  clientId: string
  holdingsCount: number
  sipCount: number
  returns: number
  kycStatus: string
  hasFolio: boolean
}

interface FamilyTabProps {
  client: Client
  familyMembers: FamilyMember[]
}

const getRelationshipLabel = (rel: string) => {
  const map: Record<string, string> = { SELF: 'Self', SPOUSE: 'Spouse', CHILD: 'Child', PARENT: 'Parent', SIBLING: 'Sibling' }
  return map[rel] || rel
}

export default function FamilyTab({ client, familyMembers }: FamilyTabProps) {
  const { colors, isDark } = useFATheme()
  const router = useRouter()

  return (
    <FACard padding="md">
      <FASectionHeader title="Family Members" />
      {familyMembers.length === 0 ? (
        <FAEmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          title="No Family Members"
          description="This client is not part of a family group"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{
                  background: isDark
                    ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                    : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                  borderBottom: `1px solid ${colors.cardBorder}`,
                }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Relationship</th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>KYC</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Holdings</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>SIPs</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>AUM</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
              </tr>
            </thead>
            <tbody>
              {[...familyMembers]
                .sort((a, b) => {
                  if (a.relationship === 'SELF') return -1
                  if (b.relationship === 'SELF') return 1
                  return b.aum - a.aum
                })
                .map((member) => (
                <tr
                  key={member.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                  onClick={() => router.push(`/advisor/clients/${member.clientId}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${member.relationship === 'SELF' ? colors.primary : colors.secondary} 0%, ${member.relationship === 'SELF' ? colors.primaryDark : colors.secondaryDark} 100%)` }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium" style={{ color: colors.textPrimary }}>{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <FAChip size="xs" color={member.relationship === 'SELF' ? colors.primary : colors.secondary}>
                      {getRelationshipLabel(member.relationship)}
                    </FAChip>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <FAChip size="xs" color={member.kycStatus === 'VERIFIED' ? colors.success : colors.warning}>
                      {member.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                    </FAChip>
                  </td>
                  <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{member.holdingsCount}</td>
                  <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{member.sipCount}</td>
                  <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(member.aum)}</td>
                  <td className="py-3 text-right">
                    <span className="font-medium" style={{ color: member.returns >= 0 ? colors.success : colors.error }}>
                      {member.returns >= 0 ? '+' : ''}{member.returns.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                  Family Total
                </td>
                <td className="py-3 pr-4 text-right font-bold" style={{ color: colors.primary }}>
                  {formatCurrency(familyMembers.reduce((sum, m) => sum + m.aum, 0))}
                </td>
                <td className="py-3 text-right font-bold" style={{ color: (() => { const avg = familyMembers.length > 0 ? familyMembers.reduce((s, m) => s + m.returns, 0) / familyMembers.length : 0; return avg >= 0 ? colors.success : colors.error })() }}>
                  {(() => { const avg = familyMembers.length > 0 ? familyMembers.reduce((s, m) => s + m.returns, 0) / familyMembers.length : 0; return `${avg >= 0 ? '+' : ''}${avg.toFixed(1)}%` })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </FACard>
  )
}
