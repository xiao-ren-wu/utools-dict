import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState(() => {
    const savedConfig = window.utools.dbStorage.getItem('theme_config')
    return savedConfig || {
      followSystem: true,
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  })

  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      if (themeConfig.followSystem) {
        setThemeConfig(prev => ({
          ...prev,
          isDarkMode: e.matches
        }))
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeConfig.followSystem])

  // 保存主题配置到本地存储
  useEffect(() => {
    window.utools.dbStorage.setItem('theme_config', themeConfig)
  }, [themeConfig])

  const updateThemeConfig = (newConfig) => {
    setThemeConfig(newConfig)
  }

  return (
    <ThemeContext.Provider value={{ themeConfig, updateThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 