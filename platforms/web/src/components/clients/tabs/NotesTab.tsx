import { useState } from 'react'
import { useFATheme, formatDate } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import { MeetingNote, notesApi } from '@/services/api'
import {
  FATintedCard,
  FASectionHeader,
  FAButton,
  FAEmptyState,
  useNotification,
} from '@/components/advisor/shared'

interface NotesTabProps {
  client: Client
  clientId: string
  notes: MeetingNote[]
  onNotesChange: (notes: MeetingNote[]) => void
  onAddNote: () => void
}

export default function NotesTab({ client, clientId, notes, onNotesChange, onAddNote }: NotesTabProps) {
  const { colors } = useFATheme()
  const notification = useNotification()
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FASectionHeader title={`Meeting Notes (${notes.length})`} />
        <FAButton onClick={onAddNote}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Note
          </span>
        </FAButton>
      </div>

      {notes.length === 0 ? (
        <FAEmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
          title="No meeting notes yet"
          description="Record your client meetings, calls, and follow-ups here."
          action={
            <FAButton onClick={onAddNote}>Add First Note</FAButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const typeConfig: Record<string, { color: string; icon: string }> = {
              CALL: { color: '#3B82F6', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
              IN_PERSON: { color: '#10B981', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
              VIDEO: { color: '#8B5CF6', icon: 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z' },
              EMAIL: { color: '#F59E0B', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
              OTHER: { color: '#94A3B8', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
            }
            const config = typeConfig[note.meetingType] || typeConfig.OTHER
            const isExpanded = expandedNoteId === note.id
            const typeLabel = note.meetingType.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

            return (
              <FATintedCard
                key={note.id}
                accentColor={config.color}
                hover={false}
                padding="md"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${config.color}15` }}
                  >
                    <svg className="w-4 h-4" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                        {note.title}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: `${config.color}12`, color: config.color }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>
                      {formatDate(note.meetingDate)}
                    </p>
                    <p
                      className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}
                      style={{ color: colors.textSecondary, cursor: 'pointer' }}
                      onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                    >
                      {note.content}
                    </p>
                    {note.content.length > 120 && (
                      <button
                        onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                        className="text-xs font-medium mt-1"
                        style={{ color: colors.primary }}
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this note?')) return
                      try {
                        await notesApi.delete(clientId, note.id)
                        onNotesChange(notes.filter(n => n.id !== note.id))
                        notification.success('Note Deleted', 'Meeting note has been removed.')
                      } catch (err) {
                        notification.error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete note')
                      }
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70 flex-shrink-0"
                    style={{ color: colors.textTertiary }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </FATintedCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
