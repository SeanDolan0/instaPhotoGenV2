import UploadSection from './UploadSection'
import ExportTargetSelect from './ExportTargetSelect'
import MetadataPanel from './MetadataPanel'
import StylingPanel from './StylingPanel'
import BrandingPanel from './BrandingPanel'
import BatchExport from './BatchExport'
import styles from '../../styles/ControlPanel.module.css'

export default function ControlPanel() {
  return (
    <aside className={styles.panel}>
      <UploadSection />
      <ExportTargetSelect />
      <MetadataPanel />
      <StylingPanel />
      <BrandingPanel />
      <BatchExport />
    </aside>
  )
}
