import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { SettingsProvider } from './contexts/SettingsContext'
import ControlPanel from './components/ControlPanel/ControlPanel'
import PreviewPane from './components/PreviewPane/PreviewPane'
import './styles/global.css'

function AppContent() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-logo">InstaPhotoGen</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <div className="app-body">
        <ControlPanel />
        <PreviewPane />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  )
}
