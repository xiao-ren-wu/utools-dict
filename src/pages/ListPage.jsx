import React, { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Space, Modal, message, App } from 'antd'
import { DeleteOutlined, ClearOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const ListPage = ({ enterAction }) => {
  const [activeTab, setActiveTab] = useState('')
  const [data, setData] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [columns, setColumns] = useState([])
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
      .filter(key => key !== '_id' && key !== 'createTime') // 过滤掉 _id 和 createTime 列
      .map(key => ({
        title: key,
        dataIndex: key,
        key: key
      }))

    // 将 createTime 列添加到最后
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
        // 使用 _id 过滤掉选中的记录
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
        
        // 如果还有其他分类，切换到第一个分类
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
        </Space>
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
      </div>
    )
  }))

  return (
    <Card title="数据字典列表" style={{ margin: 16 }}>
      {items.length > 0 ? (
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          暂无数据，请使用 dictinput 指令录入数据
        </div>
      )}
    </Card>
  )
}

export default ListPage 