import React, { useState } from 'react'
import { Card, Input, Button, message, Form, App } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const InputPage = ({ enterAction }) => {
  const [form] = Form.useForm()
  const { modal } = App.useApp()

  const handleSubmit = async (values) => {
    try {
      const { jsonData, keyword } = values
      const data = JSON.parse(jsonData)
      
      if (!Array.isArray(data)) {
        throw new Error('输入的数据必须是 JSON 数组格式')
      }

      // 为每条记录添加唯一 _id 和创建时间
      const dataWithIds = data.map((item, index) => ({
        _id: `${Date.now()}-${index}`,
        ...item,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')
      }))

      // 存储数据到本地
      const existingData = window.utools.dbStorage.getItem('dict_data') || {}
      existingData[keyword] = dataWithIds
      window.utools.dbStorage.setItem('dict_data', existingData)
      
      message.success('数据保存成功')
      
      // 询问是否继续录入
      modal.confirm({
        title: '录入完成',
        content: '数据已成功录入，是否继续录入新数据？',
        okText: '继续录入',
        cancelText: '关闭窗口',
        onOk: () => {
          form.resetFields()
        },
        onCancel: () => {
          window.utools.outPlugin()
        }
      })
    } catch (error) {
      message.error(error.message || '数据格式错误，请检查输入')
    }
  }

  return (
    <Card title="数据字典录入" style={{ margin: 16 }}>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="jsonData"
          label="JSON 数据"
          rules={[{ required: true, message: '请输入 JSON 数据' }]}
        >
          <Input.TextArea
            rows={6}
            placeholder='[{"age":22,"name":"lili","job":"外卖员"},{"age":28,"name":"erik","job":"研发"}]'
          />
        </Form.Item>
        
        <Form.Item
          name="keyword"
          label="关键字"
          rules={[{ required: true, message: '请输入关键字' }]}
        >
          <Input placeholder="请输入关键字" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default InputPage 