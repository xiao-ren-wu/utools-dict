// 超链接工具函数

/**
 * 解析超链接格式的文本
 * @param {string} text - 要解析的文本
 * @returns {object} - 解析结果 { isHyperlink: boolean, displayText: string, url: string }
 */
export const parseHyperlink = (text) => {
  if (!text || typeof text !== 'string') {
    return { isHyperlink: false, displayText: text, url: '' }
  }

  // 匹配 [超链接名称|超链接地址] 格式
  const hyperlinkRegex = /^\[([^|]+)\|([^\]]+)\]$/
  const match = text.match(hyperlinkRegex)

  if (match) {
    return {
      isHyperlink: true,
      displayText: match[1].trim(),
      url: match[2].trim()
    }
  }

  return { isHyperlink: false, displayText: text, url: '' }
}

/**
 * 从文本中提取用于搜索的文本（如果是超链接，只提取显示名称）
 * @param {string} text - 要处理的文本
 * @returns {string} - 用于搜索的文本
 */
export const getSearchableText = (text) => {
  const parsed = parseHyperlink(text)
  return parsed.displayText
}

/**
 * 处理超链接点击事件
 * @param {string} url - 要打开的URL
 */
export const handleHyperlinkClick = (url) => {
  if (!url) return;
  if (window.utools && typeof window.utools.shellOpenExternal === 'function') {
    window.utools.shellOpenExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * 渲染超链接组件
 * @param {string} text - 要渲染的文本
 * @returns {object} - 渲染配置对象 { isHyperlink: boolean, displayText: string, url: string }
 */
export const renderHyperlink = (text) => {
  const parsed = parseHyperlink(text)
  
  if (parsed.isHyperlink) {
    return {
      isHyperlink: true,
      displayText: parsed.displayText,
      url: parsed.url
    }
  }

  return {
    isHyperlink: false,
    displayText: text,
    url: ''
  }
}

/**
 * 检查文本是否包含超链接格式
 * @param {string} text - 要检查的文本
 * @returns {boolean} - 是否为超链接格式
 */
export const isHyperlinkFormat = (text) => {
  return parseHyperlink(text).isHyperlink
} 