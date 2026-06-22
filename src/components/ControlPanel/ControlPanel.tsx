import { useState, type ReactNode } from 'react'
import UploadSection from './UploadSection'
import ExportTargetSelect from './ExportTargetSelect'
import MetadataPanel from './MetadataPanel'
import StylingPanel from './StylingPanel'
import BrandingPanel from './BrandingPanel'
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
      {open && children}
    </div>
  )
}

export default function ControlPanel() {
  return (
    <aside className={styles.panel}>
      <Collapsible title="Photos" defaultOpen>
        <UploadSection compact />
      </Collapsible>
      <Collapsible title="Export Target">
        <ExportTargetSelect compact />
      </Collapsible>
      <Collapsible title="Metadata Fields">
        <MetadataPanel compact />
      </Collapsible>
      <Collapsible title="Styling">
        <StylingPanel compact />
      </Collapsible>
      <Collapsible title="Branding">
        <BrandingPanel compact />
      </Collapsible>
      <BatchExport />
    </aside>
  )
}
