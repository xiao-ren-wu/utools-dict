import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Space, Modal, message, App, Dropdown, Tree, Tooltip, Typography, Switch } from 'antd'
import { DeleteOutlined, ClearOutlined, MoreOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTheme } from '../contexts/ThemeContext'

const ListPage = ({ enterAction }) => {
  const [activeTab, setActiveTab] = useState('')
  const [data, setData] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [columns, setColumns] = useState([])
  const [isAggregateModalVisible, setIsAggregateModalVisible] = useState(false)
  const [aggregateConfig, setAggregateConfig] = useState([])
  const [treeData, setTreeData] = useState([])
  const [isTreeView, setIsTreeView] = useState(false)
  const [isColumnSelectModalVisible, setIsColumnSelectModalVisible] = useState(false)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(null)
  const [selectedColumns, setSelectedColumns] = useState([])
  const [savedConfigs, setSavedConfigs] = useState({})
  const { themeConfig, updateThemeConfig } = useTheme()
  const { modal } = App.useApp()

  useEffect(() => {
    loadData()
  }, [])

  // 监听主题变化，重新生成树状结构
  useEffect(() => {
    if (isTreeView && activeTab && data[activeTab]) {
      const newTreeData = generateTreeData(data[activeTab], aggregateConfig)
      setTreeData(newTreeData)
    }
  }, [themeConfig.isDarkMode])

  const loadData = () => {
    const allData = window.utools.dbStorage.getItem('dict_data') || {}
    const savedConfigs = window.utools.dbStorage.getItem('dict_aggregate_configs') || {}
    setData(allData)
    setSavedConfigs(savedConfigs)
    
    if (Object.keys(allData).length > 0) {
      const firstKey = Object.keys(allData)[0]
      setActiveTab(firstKey)
      generateColumns(allData[firstKey])
    }
  }

  const generateColumns = (records) => {
    if (!records || records.length === 0) return

    const firstRecord = records[0]
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
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
    generateColumns(data[key])
    setSelectedRowKeys([])

    // 检查是否有保存的配置
    const savedConfig = savedConfigs[key]
    if (savedConfig) {
      setAggregateConfig(savedConfig)
      const treeData = generateTreeData(data[key], savedConfig)
      setTreeData(treeData)
      setIsTreeView(true)
    } else {
      setIsTreeView(false)
      setTreeData([])
      setAggregateConfig([])
    }
  }

  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录')
      return
    }

    modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: () => {
        const newData = { ...data }
        newData[activeTab] = data[activeTab].filter(
          record => !selectedRowKeys.includes(record._id)
        )
        
        if (newData[activeTab].length === 0) {
          delete newData[activeTab]
          setActiveTab('')
        }
        
        window.utools.dbStorage.setItem('dict_data', newData)
        setData(newData)
        setSelectedRowKeys([])
        message.success('删除成功')
      }
    })
  }

  const handleClear = () => {
    if (!activeTab) {
      message.warning('请先选择要清空的分类')
      return
    }

    modal.confirm({
      title: '确认清空',
      content: `确定要清空"${activeTab}"分类下的所有数据吗？此操作不可恢复！`,
      onOk: () => {
        const newData = { ...data }
        delete newData[activeTab]
        window.utools.dbStorage.setItem('dict_data', newData)
        setData(newData)
        setSelectedRowKeys([])
        
        const remainingTabs = Object.keys(newData)
        if (remainingTabs.length > 0) {
          setActiveTab(remainingTabs[0])
          generateColumns(newData[remainingTabs[0]])
        } else {
          setActiveTab('')
        }
        
        message.success('清空成功')
      }
    })
  }

  const handleAggregate = () => {
    if (!activeTab || !data[activeTab] || data[activeTab].length === 0) {
      message.warning('当前分类没有数据')
      return
    }
    setIsAggregateModalVisible(true)
  }

  const addAggregateLevel = () => {
    setAggregateConfig([...aggregateConfig, { columns: [] }])
  }

  const removeAggregateLevel = (index) => {
    const newConfig = [...aggregateConfig]
    newConfig.splice(index, 1)
    setAggregateConfig(newConfig)
  }

  const updateAggregateLevel = (index, columns) => {
    const newConfig = [...aggregateConfig]
    newConfig[index] = { columns }
    setAggregateConfig(newConfig)
  }

  const handleColumnSelect = (index) => {
    setCurrentLevelIndex(index)
    setSelectedColumns(aggregateConfig[index]?.columns || [])
    setIsColumnSelectModalVisible(true)
  }

  const handleColumnSelectConfirm = () => {
    if (currentLevelIndex !== null) {
      updateAggregateLevel(currentLevelIndex, selectedColumns)
    }
    setIsColumnSelectModalVisible(false)
  }

  const handleColumnToggle = (col) => {
    setSelectedColumns(prev => {
      const newColumns = prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev, col]
      return newColumns
    })
  }

  const getNodeStyles = (level) => {
    if (themeConfig.isDarkMode) {
      return {
        container: {
          padding: '4px 8px',
          background: level === 0 ? '#1a1a1a' : '#1f1f1f',
          borderRadius: '4px',
          border: '1px solid #434343',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        },
        text: {
          display: 'inline-block',
          marginRight: '16px',
          fontSize: '14px',
          color: level === 0 ? '#177ddc' : '#49aa19'
        },
        count: {
          fontSize: '12px',
          color: level === 0 ? '#177ddc' : '#49aa19',
          background: level === 0 ? '#111b26' : '#162312',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid',
          borderColor: level === 0 ? '#177ddc' : '#49aa19'
        }
      }
    } else {
      return {
        container: {
          padding: '4px 8px',
          background: level === 0 ? '#f0f5ff' : '#f6ffed',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: level === 0 ? '#91caff' : '#b7eb8f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        },
        text: {
          display: 'inline-block',
          marginRight: '16px',
          fontSize: '14px',
          color: level === 0 ? '#1677ff' : '#52c41a'
        },
        count: {
          fontSize: '12px',
          color: level === 0 ? '#1677ff' : '#52c41a',
          background: level === 0 ? '#e6f4ff' : '#f6ffed',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid',
          borderColor: level === 0 ? '#91caff' : '#b7eb8f'
        }
      }
    }
  }

  const getHeaderStyles = () => {
    if (themeConfig.isDarkMode) {
      return {
        container: {
          display: 'flex',
          background: '#1a1a1a',
          padding: '8px',
          borderRadius: '4px 4px 0 0',
          border: '1px solid #434343',
          borderBottom: 'none',
          width: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          justifyContent: 'space-between',
          alignItems: 'center'
        },
        column: {
          width: '90px',
          padding: '0 4px',
          fontWeight: 'bold',
          color: '#177ddc',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0
        },
        count: {
          fontSize: '12px',
          color: '#177ddc',
          background: '#111b26',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid #177ddc'
        }
      }
    } else {
      return {
        container: {
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
        },
        column: {
          width: '90px',
          padding: '0 4px',
          fontWeight: 'bold',
          color: '#1677ff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0
        },
        count: {
          fontSize: '12px',
          color: '#1677ff',
          background: '#e6f4ff',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid #91caff'
        }
      }
    }
  }

  const generateTreeData = (records, config) => {
    if (!config || config.length === 0) return []

    const aggregateColumns = config.reduce((acc, level) => {
      return [...acc, ...level.columns]
    }, [])

    const buildTree = (data, level = 0) => {
      if (level >= config.length) return []

      const currentConfig = config[level]
      const groups = {}
      const styles = getNodeStyles(level)

      data.forEach(record => {
        const key = currentConfig.columns.map(col => record[col]).join('-')
        if (!groups[key]) {
          groups[key] = {
            key,
            title: (
              <div style={styles.container}>
                <div>
                  {currentConfig.columns.map(col => (
                    <div key={col} style={styles.text}>
                      <span style={{ fontWeight: 'bold' }}>{col}:</span> {record[col]}
                    </div>
                  ))}
                </div>
                <div style={styles.count}>
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
          const headerStyles = getHeaderStyles()
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
                <div style={headerStyles.container}>
                  <div style={{ display: 'flex' }}>
                    {leafColumns.map(key => (
                      <div key={key} style={headerStyles.column}>
                        <Tooltip title={key}>
                          {key}
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                  <div style={headerStyles.count}>
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
                  background: 'transparent',
                  border: '1px solid',
                  borderColor: themeConfig.isDarkMode ? '#434343' : '#f0f0f0',
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

  const handleAggregateConfirm = () => {
    if (aggregateConfig.length === 0) {
      message.warning('请至少配置一个聚合层级')
      return
    }

    const treeData = generateTreeData(data[activeTab], aggregateConfig)
    setTreeData(treeData)
    setIsTreeView(true)
    setIsAggregateModalVisible(false)
  }

  const handleSaveConfig = () => {
    if (aggregateConfig.length === 0) {
      message.warning('请先配置层级结构')
      return
    }

    const newConfigs = {
      ...savedConfigs,
      [activeTab]: aggregateConfig
    }
    
    window.utools.dbStorage.setItem('dict_aggregate_configs', newConfigs)
    setSavedConfigs(newConfigs)
    message.success('配置已保存')
  }

  const handleLoadConfig = () => {
    const savedConfig = savedConfigs[activeTab]
    if (!savedConfig) {
      message.warning('当前分类没有保存的配置')
      return
    }

    setAggregateConfig(savedConfig)
    setIsAggregateModalVisible(true)
  }

  const handleBackToList = () => {
    setIsTreeView(false)
    setTreeData([])
    setAggregateConfig([])
  }

  const handleThemeChange = (followSystem) => {
    const newConfig = {
      followSystem,
      isDarkMode: followSystem ? window.matchMedia('(prefers-color-scheme: dark)').matches : themeConfig.isDarkMode
    }
    updateThemeConfig(newConfig)
  }

  const handleDarkModeChange = (isDarkMode) => {
    const newConfig = {
      ...themeConfig,
      isDarkMode
    }
    updateThemeConfig(newConfig)
  }

  const aggregateModalContent = (
    <div>
      {aggregateConfig.map((level, index) => (
        <div key={index} style={{ marginBottom: 16 }}>
          <Space>
            <span>第 {index + 1} 级聚合：</span>
            <Button
              type="primary"
              onClick={() => handleColumnSelect(index)}
            >
              选择列 {level.columns.length > 0 ? `(${level.columns.length})` : ''}
            </Button>
            {index > 0 && (
              <Button
                danger
                onClick={() => removeAggregateLevel(index)}
              >
                删除此层级
              </Button>
            )}
          </Space>
        </div>
      ))}
      <Space style={{ marginTop: 16 }}>
        <Button
          type="dashed"
          onClick={addAggregateLevel}
          icon={<PlusOutlined />}
        >
          添加聚合层级
        </Button>
        <Button
          type="primary"
          onClick={handleSaveConfig}
          icon={<SaveOutlined />}
        >
          保存配置
        </Button>
      </Space>
    </div>
  )

  const items = Object.keys(data).map(key => ({
    key,
    label: `${key} (${data[key].length}条)`,
    children: (
      <div style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            disabled={selectedRowKeys.length === 0}
          >
            删除选中
          </Button>
          <Button
            type="primary"
            danger
            icon={<ClearOutlined />}
            onClick={handleClear}
          >
            清除所有
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'aggregate',
                  label: '层级结构聚合',
                  onClick: handleAggregate
                },
                {
                  key: 'loadConfig',
                  label: '加载已保存的配置',
                  onClick: handleLoadConfig
                }
              ]
            }}
          >
            <Button icon={<MoreOutlined />}>高级功能</Button>
          </Dropdown>
          {isTreeView && (
            <Button onClick={handleBackToList}>返回列表视图</Button>
          )}
        </Space>
        {isTreeView ? (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <Tree
              treeData={treeData}
              className="dark-tree"
              style={{
                background: 'transparent',
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
            dataSource={data[key]}
            rowKey="_id"
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => {
                setSelectedRowKeys(selectedKeys)
              }
            }}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>
    )
  }))

  return (
    <Card 
      title="数据字典列表" 
      style={{ margin: 16 }}
      extra={
        <Space>
          <span>跟随系统</span>
          <Switch
            checked={themeConfig.followSystem}
            onChange={handleThemeChange}
          />
          <span>暗色主题</span>
          <Switch
            checked={themeConfig.isDarkMode}
            onChange={handleDarkModeChange}
            disabled={themeConfig.followSystem}
          />
        </Space>
      }
    >
      {items.length > 0 ? (
        <>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={items}
          />
          <Modal
            title="配置层级聚合"
            open={isAggregateModalVisible}
            onOk={handleAggregateConfirm}
            onCancel={() => {
              setIsAggregateModalVisible(false)
              setAggregateConfig([])
            }}
            width={800}
          >
            {aggregateModalContent}
          </Modal>
          <Modal
            title="选择聚合列"
            open={isColumnSelectModalVisible}
            onOk={handleColumnSelectConfirm}
            onCancel={() => {
              setIsColumnSelectModalVisible(false)
              setSelectedColumns([])
            }}
            width={600}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                已选择: {selectedColumns.length} 列
                {selectedColumns.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {selectedColumns.map(col => {
                      const column = columns.find(c => c.dataIndex === col)
                      return column ? (
                        <span key={col} style={{ marginRight: 8 }}>
                          {column.title}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
              <div>
                {columns
                  .filter(col => col.dataIndex !== 'createTime')
                  .map(col => (
                    <Button
                      key={col.dataIndex}
                      type={selectedColumns.includes(col.dataIndex) ? 'primary' : 'default'}
                      style={{ margin: '4px' }}
                      onClick={() => handleColumnToggle(col.dataIndex)}
                    >
                      {col.title}
                    </Button>
                  ))}
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          暂无数据，请使用 dictinput 指令录入数据
        </div>
      )}
    </Card>
  )
}

export default ListPage