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
      }
    }, '输入关键字:模糊查询内容（例如：people:tom）')

    // 清理函数
    return () => {
      if (subInput) {
        subInput.remove()
      }
      // 重置状态
      setData([])
      setColumns([])
      setKeyword('')
      setSearchText('')
    }
  }, [])

  useEffect(() => {
    if (!keyword || !searchText) {
      message.warning('请通过 dict 指令进行搜索，格式：关键字:搜索内容')
      return
    }

    const allData = window.utools.dbStorage.getItem('dict_data') || {}
    const keywordData = allData[keyword] || []

    if (keywordData.length === 0) {
      message.info('未找到相关数据，请使用 dictinput 指令录入数据')
      return
    }

    // 生成表格列配置
    const firstRecord = keywordData[0]
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

    // 搜索匹配的记录
    const filteredData = keywordData.filter(record => 
      Object.entries(record)
        .filter(([key]) => key !== '_id') // 过滤掉 _id 字段的搜索
        .some(([key, value]) => 
          key !== 'createTime' && // 不搜索创建时间字段
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
    )

    setData(filteredData)
  }, [keyword, searchText])

  return (
    <Card title="搜索结果" style={{ margin: 16 }}>
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