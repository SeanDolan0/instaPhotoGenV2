import { useState, type ReactNode } from 'react'
import UploadSection from './UploadSection'
import ExportTargetSelect from './ExportTargetSelect'
import MetadataPanel from './MetadataPanel'
import StylingPanel from './StylingPanel'
import BrandingPanel from './BrandingPanel'
import PresetPanel from './PresetPanel'
import BatchExport from './BatchExport'
import styles from '../../styles/ControlPanel.module.css'

function Collapsible({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section}>
      <button
        className={styles.collapseBtn}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={styles.collapseIcon}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

interface ControlPanelProps {
  open?: boolean
  onClose?: () => void
}

export default function ControlPanel({ open = false, onClose }: ControlPanelProps) {
  return (
    <aside className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Controls</span>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close controls">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className={styles.panelScroll}>
        <Collapsible title="Photos" defaultOpen>
          <UploadSection />
        </Collapsible>
        <Collapsible title="Export Target">
          <ExportTargetSelect />
        </Collapsible>
        <Collapsible title="Metadata Fields">
          <MetadataPanel />
        </Collapsible>
        <Collapsible title="Styling">
          <StylingPanel />
        </Collapsible>
        <Collapsible title="Branding">
          <BrandingPanel />
        </Collapsible>
        <Collapsible title="Presets">
          <PresetPanel />
        </Collapsible>
        <BatchExport />
      </div>
    </aside>
  )
}
