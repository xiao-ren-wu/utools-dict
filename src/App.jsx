import React from 'react'
import { ConfigProvider, theme, App } from 'antd'
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import InputPage from './pages/InputPage'
import SearchPage from './pages/SearchPage'
import ListPage from './pages/ListPage'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

const AppContent = () => {
  const navigate = useNavigate()
  const [enterAction, setEnterAction] = React.useState({})

  React.useEffect(() => {
    window.utools.onPluginEnter((action) => {
      setEnterAction(action)
      switch (action.code) {
        case 'dictinput':
          navigate('/input')
          break
        case 'dict':
          navigate('/search')
          break
        case 'dictlist':
          navigate('/list')
          break
        default:
          break
      }
    })
  }, [navigate])

  return (
    <Routes>
      <Route path="/input" element={<InputPage enterAction={enterAction} />} />
      <Route path="/search" element={<SearchPage enterAction={enterAction} />} />
      <Route path="/list" element={<ListPage enterAction={enterAction} />} />
    </Routes>
  )
}

const ThemeWrapper = () => {
  const { themeConfig } = useTheme()

  return (
    <ConfigProvider
      theme={{
        algorithm: themeConfig.isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App>
        <Router>
          <AppContent />
        </Router>
      </App>
    </ConfigProvider>
  )
}

const MainApp = () => {
  return (
    <ThemeProvider>
      <ThemeWrapper />
    </ThemeProvider>
  )
}

export default MainApp
