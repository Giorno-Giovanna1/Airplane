import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Switch, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../../api'

export default function AdminServers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editId: null })
  const [form] = Form.useForm()

  const fetch = () => {
    setLoading(true)
    api.get('/admin/servers').then((r) => setServers(r.data)).finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const openAdd = () => {
    form.resetFields()
    form.setFieldsValue({ is_active: true, protocol: 'vmess', settings_json: '{}' })
    setModal({ open: true, editId: null })
  }

  const openEdit = (record) => {
    form.setFieldsValue(record)
    setModal({ open: true, editId: record.id })
  }

  const onSubmit = async (values) => {
    try {
      if (modal.editId) {
        await api.put(`/admin/servers/${modal.editId}`, values)
        message.success('更新成功')
      } else {
        await api.post('/admin/servers', values)
        message.success('创建成功')
      }
      setModal({ open: false, editId: null })
      fetch()
    } catch (e) {
      message.error(e.response?.data?.detail || '操作失败')
    }
  }

  const onDelete = async (id) => {
    await api.delete(`/admin/servers/${id}`)
    message.success('删除成功')
    fetch()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'address' },
    { title: '端口', dataIndex: 'port' },
    { title: '协议', dataIndex: 'protocol', render: (v) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'is_active', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag> },
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
      <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginBottom: 16 }}>添加节点</Button>
      <Table dataSource={servers} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={modal.editId ? '编辑节点' : '添加节点'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editId: null })}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={onSubmit} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}><Input placeholder="IP 或域名" /></Form.Item>
          <Form.Item name="port" label="端口" rules={[{ required: true }]}><InputNumber min={1} max={65535} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="protocol" label="协议" rules={[{ required: true }]}>
            <Select options={[
              { value: 'vmess', label: 'VMess' },
              { value: 'vless', label: 'VLESS' },
              { value: 'ss', label: 'Shadowsocks' },
              { value: 'trojan', label: 'Trojan' },
            ]} />
          </Form.Item>
          <Form.Item name="settings_json" label="配置 JSON" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder='{"uuid":"...", "alter_id":0, "network":"ws"}' />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
