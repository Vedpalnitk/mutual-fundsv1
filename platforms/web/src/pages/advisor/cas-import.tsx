/**
 * CAS Import Page — FA Portal
 *
 * Allows financial advisors to import CAS PDFs for their clients.
 * Parses CAMS/KFintech CAS and stores holdings + transactions.
 */

import { useState, useEffect } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { FACard } from '@/components/advisor/shared'
import CASUploadForm from '@/components/CASUploadForm'
import { clientsApi, casApi, CASImportRecord } from '@/services/api'

interface Client {
  id: string
  name: string
  email: string
  pan?: string
  dateOfBirth?: string
}

const CASImportPage = () => {
  const { colors, isDark } = useFATheme()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)
  const [imports, setImports] = useState<CASImportRecord[]>([])
  const [loadingImports, setLoadingImports] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadImports(selectedClient.id)
    }
  }, [selectedClient])

  const loadClients = async () => {
    try {
      const res = await clientsApi.list<Client>({ limit: 500 })
      setClients(res.data || [])
    } catch {
      // ignore
    } finally {
      setLoadingClients(false)
    }
  }

  const loadImports = async (clientId: string) => {
    setLoadingImports(true)
    try {
      const data = await casApi.getImports(clientId)
      setImports(data)
    } catch {
      // ignore
    } finally {
      setLoadingImports(false)
    }
  }

  return (
    <AdvisorLayout title="CAS Import">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Import CAS PDF
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Upload a CAMS or KFintech Consolidated Account Statement to import client portfolio data.
          </p>
        </div>

        {/* Client Selector */}
        <div className="p-5 rounded-xl" style={{
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 4px 24px ${colors.glassShadow}`,
        }}>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
            Select Client
          </label>
          {loadingClients ? (
            <div className="h-10 rounded-xl animate-pulse" style={{ background: colors.inputBg }} />
          ) : (
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clients.find((c) => c.id === e.target.value)
                setSelectedClient(client || null)
              }}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            >
              <option value="">Choose a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Upload Form */}
        {selectedClient && (
          <div className="p-5 rounded-xl" style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}>
            <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              }}>
                <span className="text-sm font-bold text-white">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{selectedClient.name}</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{selectedClient.email}</p>
              </div>
            </div>

            <CASUploadForm
              clientId={selectedClient.id}
              clientPan={selectedClient.pan}
              clientDob={selectedClient.dateOfBirth}
              onSuccess={() => loadImports(selectedClient.id)}
            />
          </div>
        )}

        {/* Import History */}
        {selectedClient && imports.length > 0 && (
          <div className="p-5 rounded-xl" style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
              Import History
            </h3>
            <div className="space-y-2">
              {imports.map((imp) => (
                <div
                  key={imp.id}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{
                    background: colors.chipBg,
                    border: `1px solid ${colors.chipBorder}`,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {imp.investorName || 'CAS Import'}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {imp.schemesImported} schemes, {imp.foliosImported} folios
                      {imp.fileType ? ` — ${imp.fileType}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-semibold"
                      style={{
                        background: imp.status === 'COMPLETED' ? `${colors.success}12` : imp.status === 'FAILED' ? `${colors.error}12` : `${colors.warning}12`,
                        color: imp.status === 'COMPLETED' ? colors.success : imp.status === 'FAILED' ? colors.error : colors.warning,
                      }}
                    >
                      {imp.status}
                    </span>
                    {imp.totalValue && (
                      <p className="text-sm font-bold mt-1" style={{ color: colors.textPrimary }}>
                        {formatCurrency(imp.totalValue)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="p-5 rounded-xl" style={{
          background: colors.chipBg,
          border: `1px solid ${colors.chipBorder}`,
        }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textTertiary }}>
            How it works
          </h3>
          <div className="space-y-2">
            {[
              'Client requests CAS from CAMS/KFintech via email or website',
              'CAS PDF is password-protected (PAN + DOB in DDMMYYYY)',
              'Upload the PDF here — we parse folios, schemes, and transactions',
              'Holdings and transaction history are imported into the client profile',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs font-bold mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                  background: `${colors.primary}12`,
                  color: colors.primary,
                }}>
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default CASImportPage
