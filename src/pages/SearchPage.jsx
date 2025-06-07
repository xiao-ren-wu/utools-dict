import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Table, Empty, message } from 'antd'
import dayjs from 'dayjs'

const SearchPage = ({ enterAction }) => {
  const location = useLocation()
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')

  // 重置搜索结果状态
  const resetSearchResults = () => {
    setData([])
    setColumns([])
  }

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
  }, [])

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
  }, [keyword, searchText])

  return (
    <Card title={`搜索结果${data.length > 0 ? ` (共 ${data.length} 条)` : ''}`} style={{ margin: 16 }}>
      {data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <Empty description="未找到匹配的数据" />
      )}
    </Card>
  )
}

export default SearchPage