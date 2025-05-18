import React, { useEffect, useState } from 'react'
import { ConfigProvider, theme, App } from 'antd'
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import InputPage from './pages/InputPage'
import SearchPage from './pages/SearchPage'
import ListPage from './pages/ListPage'

const AppContent = () => {
  const navigate = useNavigate()
  const [enterAction, setEnterAction] = useState({})

  useEffect(() => {
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

const MainApp = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
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

export default MainApp
