import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Table, Empty, message, Tree, Button, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'

const SearchPage = ({ enterAction }) => {
  const location = useLocation()
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [treeData, setTreeData] = useState([])
  const [isTreeView, setIsTreeView] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState({})

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
  }, [])

  useEffect(() => {
    // 设置 uTools 子输入框
    const subInput = window.utools.setSubInput(({ text }) => {
      if (text) {
        const parts = text.split(':')
        const searchParams = parts.length >= 2
          ? { keyword: parts[0].trim(), searchText: parts.slice(1).join(':').trim() }
          : { keyword: text.trim(), searchText: '' }
        setKeyword(searchParams.keyword)
        setSearchText(searchParams.searchText)
      } else {
        // 当输入框为空时只重置搜索结果
        resetSearchResults()
        setKeyword('')
        setSearchText('')
      }
    }, '输入关键字:模糊查询内容（例如：people:tom）')

    // 清理函数
    return () => {
      if (subInput) {
        window.utools.setSubInputValue('')
        resetSearchResults()
        setKeyword('')
        setSearchText('')
      }
    }
  }, [enterAction])

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
                          {value}
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
    if (!keyword || !searchText) {
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
        key: key
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
    const filteredData = keywordData.filter(record => 
      Object.entries(record)
        .filter(([key]) => key !== '_id')
        .some(([key, value]) => 
          key !== 'createTime' &&
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
    )

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
  )
}

export default SearchPage