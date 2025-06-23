import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Table, Empty, message, Tree, Button, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { renderHyperlink, getSearchableText, handleHyperlinkClick } from '../utils/hyperlinkUtils'

const SearchPage = ({ enterAction }) => {
  const location = useLocation()
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [treeData, setTreeData] = useState([])
  const [isTreeView, setIsTreeView] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState({})
  const [availableKeywords, setAvailableKeywords] = useState([])
  const [currentSuggestion, setCurrentSuggestion] = useState('')
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [allSuggestions, setAllSuggestions] = useState([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // 重置搜索结果状态
  const resetSearchResults = () => {
    setData([])
    setColumns([])
    setTreeData([])
    setIsTreeView(false)
  }

  useEffect(() => {
    // 加载保存的配置
    const savedConfigs = window.utools.dbStorage.getItem('dict_aggregate_configs') || {}
    setSavedConfigs(savedConfigs)
    
    // 获取所有可用的关键字
    const allData = window.utools.dbStorage.getItem('dict_data') || {}
    const keywords = Object.keys(allData).filter(key => key.trim() !== '')
    setAvailableKeywords(keywords)
  }, [])

  // 获取关键字建议
  const getKeywordSuggestions = (inputText) => {
    if (!inputText) return []
    
    const parts = inputText.split(':')
    const keywordPart = parts[0].trim()
    
    if (!keywordPart) return []
    
    return availableKeywords.filter(keyword => 
      keyword.toLowerCase().includes(keywordPart.toLowerCase())
    )
  }

  // 处理自动补全
  const handleAutocomplete = (inputText) => {
    const suggestions = getKeywordSuggestions(inputText)
    
    if (suggestions.length > 0) {
      const matchedSuggestion = suggestions.find(s => 
        s.toLowerCase().startsWith(inputText.split(':')[0].toLowerCase())
      )
      
      if (matchedSuggestion && matchedSuggestion !== inputText.split(':')[0]) {
        const parts = inputText.split(':')
        const newInputText = parts.length > 1 
          ? `${matchedSuggestion}:${parts.slice(1).join(':')}`
          : matchedSuggestion
        
        setCurrentSuggestion(newInputText)
        return newInputText
      }
    }
    
    setCurrentSuggestion('')
    return inputText
  }

  // 获取所有匹配的建议用于显示
  const getAllSuggestions = (inputText) => {
    const suggestions = getKeywordSuggestions(inputText)
    if (suggestions.length > 0) {
      const parts = inputText.split(':')
      return suggestions.map(suggestion => {
        return parts.length > 1 
          ? `${suggestion}:${parts.slice(1).join(':')}`
          : suggestion
      })
    }
    return []
  }

  useEffect(() => {
    // 使用全局变量存储当前输入值，避免状态更新导致的死循环
    let currentInputValue = '';
    let currentSelectedIndex = -1; // 局部变量跟踪选中索引

    // 键盘事件处理函数
    const handleKeyDown = (event) => {
      // 检查是否在uTools环境中
      if (!window.utools) return;
      
      const suggestions = getKeywordSuggestions(currentInputValue);
      console.log('Key pressed:', event.key, 'Current input:', currentInputValue, 'Suggestions:', suggestions, 'Selected index:', currentSelectedIndex);
      
      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          if (suggestions.length > 0) {
            const matchedSuggestion = suggestions.find(s =>
              s.toLowerCase().startsWith(currentInputValue.split(':')[0].toLowerCase())
            );
            if (matchedSuggestion) {
              const parts = currentInputValue.split(':');
              const processedText = parts.length > 1
                ? `${matchedSuggestion}:${parts.slice(1).join(':')}`
                : matchedSuggestion;
              console.log('Tab completion:', processedText);
              window.utools.setSubInputValue(processedText);
              currentInputValue = processedText;
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          console.log('ArrowRight pressed, suggestions:', suggestions);
          if (suggestions.length > 0) {
            const prefix = currentInputValue.split(':')[0].trim();
            const firstSuggestion = suggestions[0];
            console.log('Prefix:', prefix, 'First suggestion:', firstSuggestion);
            
            if (firstSuggestion && firstSuggestion !== prefix) {
              const parts = currentInputValue.split(':');
              const processedText = parts.length > 1
                ? `${firstSuggestion}:${parts.slice(1).join(':')}`
                : firstSuggestion;
              console.log('Setting input value to:', processedText);
              window.utools.setSubInputValue(processedText);
              currentInputValue = processedText;
            }
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (suggestions.length > 0) {
            const newIndex = currentSelectedIndex >= 0 && currentSelectedIndex < suggestions.length - 1
              ? currentSelectedIndex + 1
              : 0;
            console.log('ArrowDown selection index:', newIndex);
            // 只更新选中索引，不填充输入框
            currentSelectedIndex = newIndex;
            setSelectedSuggestionIndex(newIndex);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (suggestions.length > 0) {
            const newIndex = currentSelectedIndex > 0
              ? currentSelectedIndex - 1
              : suggestions.length - 1;
            console.log('ArrowUp selection index:', newIndex);
            // 只更新选中索引，不填充输入框
            currentSelectedIndex = newIndex;
            setSelectedSuggestionIndex(newIndex);
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (suggestions.length > 0) {
            // 如果有选中项，使用选中的建议
            if (currentSelectedIndex >= 0 && currentSelectedIndex < suggestions.length) {
              const selectedSuggestion = suggestions[currentSelectedIndex];
              const parts = currentInputValue.split(':');
              const processedText = parts.length > 1
                ? `${selectedSuggestion}:${parts.slice(1).join(':')}`
                : selectedSuggestion;
              console.log('Enter confirmation with selected:', processedText);
              window.utools.setSubInputValue(processedText);
              currentInputValue = processedText;
              // 确认后重置选中索引
              currentSelectedIndex = -1;
              setSelectedSuggestionIndex(-1);
            } else {
              // 如果没有选中项，使用第一个建议
              const firstSuggestion = suggestions[0];
              const parts = currentInputValue.split(':');
              const processedText = parts.length > 1
                ? `${firstSuggestion}:${parts.slice(1).join(':')}`
                : firstSuggestion;
              console.log('Enter using first suggestion:', processedText);
              window.utools.setSubInputValue(processedText);
              currentInputValue = processedText;
            }
          }
          break;
      }
    };

    // 添加全局键盘事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 设置 uTools 子输入框
    const subInput = window.utools.setSubInput(({ text }) => {
      if (text !== undefined) {
        let processedText = text;
        
        // 更新全局变量
        currentInputValue = text;
        
        // 计算最新建议
        const latestSuggestion = handleAutocomplete(text);
        // 获取所有匹配的建议
        const allSuggestionsList = getAllSuggestions(text);

        // 调试信息
        console.log('setSubInput callback:', { text, latestSuggestion, allSuggestionsList });

        // 更新推荐显示 - 显示所有匹配的建议
        if (allSuggestionsList.length > 0) {
          setCurrentSuggestion(allSuggestionsList.join(', '));
          setAllSuggestions(allSuggestionsList);
          // 重置选中索引
          setSelectedSuggestionIndex(-1);
        } else {
          setCurrentSuggestion('');
          setAllSuggestions([]);
          setSelectedSuggestionIndex(-1);
        }

        // 解析输入内容
        if (processedText) {
          const parts = processedText.split(':');
          const searchParams = parts.length >= 2
            ? { keyword: parts[0].trim(), searchText: parts.slice(1).join(':').trim() }
            : { keyword: processedText.trim(), searchText: '' };
          setKeyword(searchParams.keyword);
          setSearchText(searchParams.searchText);
        } else {
          resetSearchResults();
          setKeyword('');
          setSearchText('');
          setCurrentSuggestion('');
          setSuggestionIndex(-1);
        }
      }
    }, '输入关键字:模糊查询内容（例如：people:tom）');

    return () => {
      // 清理事件监听
      document.removeEventListener('keydown', handleKeyDown);
      
      if (subInput) {
        window.utools.setSubInputValue('');
        resetSearchResults();
        setKeyword('');
        setSearchText('');
        setCurrentSuggestion('');
        setSuggestionIndex(-1);
      }
    };
  }, [enterAction, availableKeywords]);

  const generateTreeData = (records, config) => {
    if (!config || config.length === 0) return []

    const aggregateColumns = config.reduce((acc, level) => {
      return [...acc, ...level.columns]
    }, [])

    const buildTree = (data, level = 0) => {
      if (level >= config.length) return []

      const currentConfig = config[level]
      const groups = {}

      data.forEach(record => {
        const key = currentConfig.columns.map(col => record[col]).join('-')
        if (!groups[key]) {
          groups[key] = {
            key,
            title: (
              <div style={{ 
                padding: '4px 8px',
                background: level === 0 ? '#f0f5ff' : '#f6ffed',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: level === 0 ? '#91caff' : '#b7eb8f',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  {currentConfig.columns.map(col => (
                    <div key={col} style={{ 
                      display: 'inline-block',
                      marginRight: '16px',
                      fontSize: '14px',
                      color: level === 0 ? '#1677ff' : '#52c41a'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{col}:</span> {record[col]}
                    </div>
                  ))}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: level === 0 ? '#1677ff' : '#52c41a',
                  background: level === 0 ? '#e6f4ff' : '#f6ffed',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: level === 0 ? '#91caff' : '#b7eb8f'
                }}>
                  包含 {data.filter(r => currentConfig.columns.every(col => r[col] === record[col])).length} 条记录
                </div>
              </div>
            ),
            children: [],
            data: []
          }
        }
        groups[key].data.push(record)
      })

      Object.values(groups).forEach(group => {
        if (level < config.length - 1) {
          group.children = buildTree(group.data, level + 1)
        } else {
          group.children = [{
            key: 'header',
            title: (() => {
              const leafColumns = Object.keys(group.data[0])
                .filter(key => 
                  key !== '_id' && 
                  key !== 'createTime' && 
                  !aggregateColumns.includes(key)
                )

              return (
                <div style={{
                  display: 'flex',
                  background: '#f0f5ff',
                  padding: '8px',
                  borderRadius: '4px 4px 0 0',
                  border: '1px solid #91caff',
                  borderBottom: 'none',
                  width: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex' }}>
                    {leafColumns.map(key => (
                      <div key={key} style={{
                        width: '90px',
                        padding: '0 4px',
                        fontWeight: 'bold',
                        color: '#1677ff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        <Tooltip title={key}>
                          {key}
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#1677ff',
                    background: '#e6f4ff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid #91caff'
                  }}>
                    共 {group.data.length} 条记录
                  </div>
                </div>
              )
            })()
          }, ...group.data.map(record => {
            const leafData = Object.entries(record)
              .filter(([key]) => 
                key !== '_id' && 
                key !== 'createTime' && 
                !aggregateColumns.includes(key)
              )
            
            return {
              key: record._id,
              title: (
                <div style={{
                  display: 'flex',
                  padding: '8px',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  width: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  {leafData.map(([key, value]) => (
                    <div key={key} style={{
                      width: '90px',
                      padding: '0 4px',
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <Tooltip title={value}>
                        <Typography.Text>
                          {(() => {
                            const linkInfo = renderHyperlink(value)
                            if (linkInfo.isHyperlink) {
                              return (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    handleHyperlinkClick(linkInfo.url)
                                  }}
                                  style={{
                                    color: '#1890ff',
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                  }}
                                  title={`点击打开: ${linkInfo.url}`}
                                >
                                  {linkInfo.displayText}
                                </a>
                              )
                            }
                            return linkInfo.displayText
                          })()}
                        </Typography.Text>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )
            }
          })]
        }
      })

      return Object.values(groups)
    }

    return buildTree(records)
  }

  useEffect(() => {
    if (!keyword) {
      resetSearchResults()
      return
    }

    const allData = window.utools.dbStorage.getItem('dict_data') || {}
    const keywordData = allData[keyword] || []

    if (keywordData.length === 0) {
      message.info('未找到相关数据，请使用 dictinput 指令录入数据')
      resetSearchResults()
      return
    }

    // 生成表格列配置
    const firstRecord = keywordData[0]
    const cols = Object.keys(firstRecord)
      .filter(key => key !== '_id' && key !== 'createTime')
      .map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        render: (text) => {
          const linkInfo = renderHyperlink(text)
          if (linkInfo.isHyperlink) {
            return (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleHyperlinkClick(linkInfo.url)
                }}
                style={{
                  color: '#1890ff',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                title={`点击打开: ${linkInfo.url}`}
              >
                {linkInfo.displayText}
              </a>
            )
          }
          return linkInfo.displayText
        }
      }))

    cols.push({
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      sorter: (a, b) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix(),
      defaultSortOrder: 'descend'
    })
    setColumns(cols)

    // 搜索匹配的记录
    let filteredData = keywordData
    if (searchText) {
      filteredData = keywordData.filter(record => 
        Object.entries(record)
          .filter(([key]) => key !== '_id')
          .some(([key, value]) => 
            key !== 'createTime' &&
            getSearchableText(String(value)).toLowerCase().includes(searchText.toLowerCase())
          )
      )
    }

    setData(filteredData)

    // 检查是否有保存的配置
    const savedConfig = savedConfigs[keyword]
    if (savedConfig) {
      const treeData = generateTreeData(filteredData, savedConfig)
      setTreeData(treeData)
      setIsTreeView(true)
    } else {
      setIsTreeView(false)
      setTreeData([])
    }
  }, [keyword, searchText, savedConfigs])

  return (
    <div>
      {/* 自动补全建议显示 */}
      {currentSuggestion && currentSuggestion !== `${keyword}${searchText ? ':' + searchText : ''}` && (
        <Card 
          size="small" 
          style={{ 
            margin: '16px 16px 0 16px',
            backgroundColor: '#f6ffed',
            borderColor: '#b7eb8f'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
            <div>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>建议: </span>
              <span style={{ color: '#666' }}>
                {allSuggestions.map((suggestion, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: index === selectedSuggestionIndex ? '#1890ff' : 'transparent',
                      color: index === selectedSuggestionIndex ? '#fff' : '#666',
                      padding: '2px 6px',
                      margin: '0 2px',
                      borderRadius: '4px',
                      fontWeight: index === selectedSuggestionIndex ? 'bold' : 'normal'
                    }}
                  >
                    {suggestion}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              按 → 接受建议 | Tab 快速补全 | ↑↓ 选择建议 | Enter 确认选择
            </div>
          </div>
        </Card>
      )}
      
      {/* 可用关键字提示 */}
      {availableKeywords.length > 0 && !keyword && (
        <Card 
          size="small" 
          style={{ 
            margin: '16px 16px 0 16px',
            backgroundColor: '#f0f5ff',
            borderColor: '#91caff'
          }}
        >
          <div style={{ fontSize: '14px' }}>
            <span style={{ color: '#1677ff', fontWeight: 'bold' }}>可用关键字: </span>
            <span style={{ color: '#666' }}>{availableKeywords.join(', ')}</span>
          </div>
        </Card>
      )}
      
      <Card 
        title={`搜索结果${data.length > 0 ? ` (共 ${data.length} 条)` : ''}`} 
        style={{ margin: 16 }}
        extra={
          isTreeView && (
            <Button onClick={() => setIsTreeView(false)}>返回列表视图</Button>
          )
        }
      >
        {data.length > 0 ? (
          isTreeView ? (
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <Tree
                treeData={treeData}
                style={{
                  background: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  overflowX: 'hidden',
                  boxSizing: 'border-box'
                }}
                showLine={{ showLeafIcon: false }}
                blockNode
              />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={data}
              rowKey="_id"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          )
        ) : (
          <Empty description="未找到匹配的数据" />
        )}
      </Card>
    </div>
  )
}

export default SearchPage