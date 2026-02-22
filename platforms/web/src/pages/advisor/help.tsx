import { useState, useEffect, useRef, useMemo, ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { FA_COLORS_LIGHT as COLORS_LIGHT, FA_COLORS_DARK as COLORS_DARK } from '@/utils/faColors'
import { useDarkMode } from '@/utils/faHooks'
import { GetStaticProps } from 'next'

interface Section {
  id: string
  title: string
  content: string
}

interface HelpPageProps {
  sections: Section[]
}

export const getStaticProps: GetStaticProps<HelpPageProps> = async () => {
  const fs = require('fs')
  const path = require('path')
  const docsDir = path.join(process.cwd(), '..', '..', 'docs', 'user-manual')

  let sections: Section[] = []
  try {
    const files: string[] = fs.readdirSync(docsDir).filter((f: string) => f.endsWith('.md')).sort()
    sections = files.map((f: string) => {
      const raw: string = fs.readFileSync(path.join(docsDir, f), 'utf8')
      const titleMatch = raw.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : f.replace(/^\d+-/, '').replace('.md', '')
      const id = f.replace(/^\d+-/, '').replace('.md', '')
      return { id, title, content: raw }
    })
  } catch (err) {
    console.error('Failed to read user manual docs:', err)
  }

  return { props: { sections } }
}

export default function HelpPage({ sections }: HelpPageProps) {
  const isDark = useDarkMode()
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections
    const q = searchQuery.toLowerCase()
    return sections.filter(
      s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    )
  }, [sections, searchQuery])

  // Track active section on scroll
  useEffect(() => {
    const container = contentRef.current
    if (!container) return
    const handleScroll = () => {
      const scrollTop = container.scrollTop + 120
      let current = filteredSections[0]?.id || ''
      for (const s of filteredSections) {
        const el = sectionRefs.current[s.id]
        if (el && el.offsetTop <= scrollTop) {
          current = s.id
        }
      }
      setActiveSection(current)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [filteredSections])

  // Scroll to section when clicking sidebar
  const scrollToSection = (id: string) => {
    setActiveSection(id)
    setSidebarOpen(false)
    const el = sectionRefs.current[id]
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
    }
  }

  // Markdown components styled with FA theme
  const mdComponents = useMemo(() => ({
    h1: ({ children }: { children?: ReactNode }) => (
      <h1
        style={{
          color: colors.textPrimary,
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: `1px solid ${colors.separator}`,
        }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2
        style={{
          color: colors.textPrimary,
          fontSize: '1.35rem',
          fontWeight: 600,
          marginTop: '2rem',
          marginBottom: '0.5rem',
        }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3
        style={{
          color: colors.textPrimary,
          fontSize: '1.1rem',
          fontWeight: 600,
          marginTop: '1.5rem',
          marginBottom: '0.4rem',
        }}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4
        style={{
          color: colors.textSecondary,
          fontSize: '1rem',
          fontWeight: 600,
          marginTop: '1.25rem',
          marginBottom: '0.3rem',
        }}
      >
        {children}
      </h4>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p style={{ color: colors.textSecondary, lineHeight: 1.7, marginBottom: '0.75rem', fontSize: '0.925rem' }}>
        {children}
      </p>
    ),
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a href={href} style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
        {children}
      </a>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul style={{ color: colors.textSecondary, paddingLeft: '1.5rem', marginBottom: '0.75rem', lineHeight: 1.8, fontSize: '0.925rem' }}>
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol style={{ color: colors.textSecondary, paddingLeft: '1.5rem', marginBottom: '0.75rem', lineHeight: 1.8, fontSize: '0.925rem' }}>
        {children}
      </ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li style={{ marginBottom: '0.25rem' }}>{children}</li>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong style={{ color: colors.textPrimary, fontWeight: 600 }}>{children}</strong>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote
        style={{
          borderLeft: `3px solid ${colors.primary}`,
          background: isDark
            ? 'rgba(147, 197, 253, 0.06)'
            : 'rgba(59, 130, 246, 0.04)',
          padding: '0.75rem 1rem',
          margin: '0.75rem 0',
          borderRadius: '0 0.5rem 0.5rem 0',
        }}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      if (className) {
        return (
          <pre
            style={{
              background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '0.5rem',
              padding: '1rem',
              overflowX: 'auto',
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <code style={{ color: colors.textPrimary }}>{children}</code>
          </pre>
        )
      }
      return (
        <code
          style={{
            background: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
            color: colors.primary,
            padding: '0.15rem 0.4rem',
            borderRadius: '0.25rem',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
          }}
        >
          {children}
        </code>
      )
    },
    pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
    table: ({ children }: { children?: ReactNode }) => (
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '0.5rem',
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead
        style={{
          background: isDark
            ? 'rgba(147, 197, 253, 0.08)'
            : 'rgba(59, 130, 246, 0.04)',
        }}
      >
        {children}
      </thead>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th
        style={{
          textAlign: 'left',
          padding: '0.6rem 0.75rem',
          color: colors.textPrimary,
          fontWeight: 600,
          borderBottom: `1px solid ${colors.cardBorder}`,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td
        style={{
          padding: '0.5rem 0.75rem',
          color: colors.textSecondary,
          borderBottom: `1px solid ${colors.cardBorder}`,
        }}
      >
        {children}
      </td>
    ),
    hr: () => (
      <hr style={{ border: 'none', borderTop: `1px solid ${colors.separator}`, margin: '1.5rem 0' }} />
    ),
  }), [colors, isDark])

  return (
    <AdvisorLayout title="Help Center">
      <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 10rem)', minHeight: 0 }}>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: '#FFFFFF',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Help Sidebar */}
        <aside
          className={`
            fixed lg:static z-50 lg:z-auto
            top-0 left-0 h-full lg:h-auto
            w-72 lg:w-64 flex-shrink-0
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            background: isDark ? colors.backgroundSecondary : colors.background,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: sidebarOpen ? '0' : '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '1rem', borderBottom: `1px solid ${colors.separator}` }}>
            <div style={{ position: 'relative' }}>
              <svg
                className="w-4 h-4"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.textTertiary,
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search help..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                }}
              />
            </div>
          </div>

          {/* Section list */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredSections.length === 0 && (
              <p style={{ color: colors.textTertiary, fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                No sections match your search.
              </p>
            )}
            {filteredSections.map((section, i) => {
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all text-sm"
                  style={{
                    background: isActive ? colors.activeBg : 'transparent',
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                    marginBottom: '0.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isActive
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : colors.chipBg,
                      color: isActive ? '#FFFFFF' : colors.textTertiary,
                      border: isActive ? 'none' : `1px solid ${colors.chipBorder}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate">{section.title}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: isDark ? colors.backgroundSecondary : colors.background,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '0.75rem',
            padding: '2rem',
            minWidth: 0,
          }}
        >
          {filteredSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <svg
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: colors.textTertiary }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p style={{ color: colors.textSecondary, fontSize: '1rem', fontWeight: 500 }}>
                No results found for &ldquo;{searchQuery}&rdquo;
              </p>
              <p style={{ color: colors.textTertiary, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Try a different search term
              </p>
            </div>
          ) : (
            filteredSections.map((section, i) => (
              <div
                key={section.id}
                ref={el => { sectionRefs.current[section.id] = el }}
                id={section.id}
                style={{
                  marginBottom: '3rem',
                  paddingTop: i > 0 ? '2rem' : 0,
                  borderTop: i > 0 ? `1px solid ${colors.separator}` : 'none',
                }}
              >
                <Markdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
                  {section.content}
                </Markdown>
              </div>
            ))
          )}
        </div>
      </div>
    </AdvisorLayout>
  )
}
