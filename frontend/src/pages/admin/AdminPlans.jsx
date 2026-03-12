import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../../api'

export default function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editId: null })
  const [form] = Form.useForm()

  const fetch = () => {
    setLoading(true)
    api.get('/admin/plans').then((r) => setPlans(r.data)).finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const openAdd = () => {
    form.resetFields()
    setModal({ open: true, editId: null })
  }

  const openEdit = (record) => {
    form.setFieldsValue(record)
    setModal({ open: true, editId: record.id })
  }

  const onSubmit = async (values) => {
    if (modal.editId) {
      await api.put(`/admin/plans/${modal.editId}`, values)
      message.success('更新成功')
    } else {
      await api.post('/admin/plans', values)
      message.success('创建成功')
    }
    setModal({ open: false, editId: null })
    fetch()
  }

  const onDelete = async (id) => {
    await api.delete(`/admin/plans/${id}`)
    message.success('删除成功')
    fetch()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '价格', dataIndex: 'price', render: (v) => `¥${(v / 100).toFixed(2)}` },
    { title: '天数', dataIndex: 'duration_days' },
    { title: '流量(GB)', dataIndex: 'data_limit' },
    { title: '状态', dataIndex: 'is_active', render: (v) => v ? '上架' : '下架' },
    {
      title: '操作',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginBottom: 16 }}>添加套餐</Button>
      <Table dataSource={plans} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={modal.editId ? '编辑套餐' : '添加套餐'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editId: null })}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={onSubmit} layout="vertical" initialValues={{ is_active: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="price" label="价格(分)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="duration_days" label="时长(天)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="data_limit" label="流量(GB)" rules={[{ required: true }]}><InputNumber min={0.1} step={0.1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea /></Form.Item>
          <Form.Item name="is_active" label="上架" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
