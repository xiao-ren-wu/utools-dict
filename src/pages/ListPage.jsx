import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Space, Modal, message, App, Dropdown, Tree } from 'antd'
import { DeleteOutlined, ClearOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

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
  const { modal } = App.useApp()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allData = window.utools.dbStorage.getItem('dict_data') || {}
    setData(allData)
    
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

  const generateTreeData = (records, config) => {
    if (!config || config.length === 0) return []

    const buildTree = (data, level = 0) => {
      if (level >= config.length) return []

      const currentConfig = config[level]
      const groups = {}

      data.forEach(record => {
        const key = currentConfig.columns.map(col => record[col]).join('-')
        if (!groups[key]) {
          groups[key] = {
            key,
            title: currentConfig.columns.map(col => `${col}: ${record[col]}`).join(', '),
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
          group.children = group.data.map(record => ({
            key: record._id,
            title: (
              <div>
                {Object.entries(record)
                  .filter(([key]) => key !== '_id' && key !== 'createTime')
                  .map(([key, value]) => (
                    <div key={key} style={{ marginLeft: 16 }}>
                      {key}: {value}
                    </div>
                  ))
                }
              </div>
            )
          }))
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

  const handleBackToList = () => {
    setIsTreeView(false)
    setTreeData([])
    setAggregateConfig([])
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
      <Button
        type="dashed"
        onClick={addAggregateLevel}
        icon={<PlusOutlined />}
        style={{ width: '100%' }}
      >
        添加聚合层级
      </Button>
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
          <Tree
            treeData={treeData}
            style={{ background: '#fff', padding: 16 }}
          />
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
    <Card title="数据字典列表" style={{ margin: 16 }}>
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