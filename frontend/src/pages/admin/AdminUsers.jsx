import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, message, Modal, InputNumber, Form } from 'antd'
import dayjs from 'dayjs'
import api from '../../api'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(2)} ${units[i]}`
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [renewModal, setRenewModal] = useState({ open: false, userId: null })
  const [form] = Form.useForm()

  const fetch = () => {
    setLoading(true)
    api.get('/admin/users').then((r) => setUsers(r.data)).finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const toggle = async (userId, isActive) => {
    await api.put(`/admin/users/${userId}/toggle`, { is_active: !isActive })
    message.success('操作成功')
    fetch()
  }

  const renew = async (values) => {
    await api.post(`/admin/users/${renewModal.userId}/renew`, values)
    message.success('续期成功')
    setRenewModal({ open: false, userId: null })
    fetch()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '邮箱', dataIndex: 'email' },
    { title: '状态', dataIndex: 'is_active', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? '正常' : '禁用'}</Tag> },
    { title: '角色', dataIndex: 'is_admin', render: (v) => v ? <Tag color="blue">管理员</Tag> : <Tag>用户</Tag> },
    { title: '流量', render: (_, r) => `${formatBytes(r.data_used)} / ${formatBytes(r.data_limit)}` },
    { title: '到期', dataIndex: 'expire_time', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { title: '注册时间', dataIndex: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => toggle(r.id, r.is_active)}>
            {r.is_active ? '禁用' : '启用'}
          </Button>
          <Button size="small" type="primary" onClick={() => { setRenewModal({ open: true, userId: r.id }); form.resetFields() }}>
            续期
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} scroll={{ x: 800 }} />
      <Modal title="手动续期" open={renewModal.open} onCancel={() => setRenewModal({ open: false, userId: null })} onOk={() => form.submit()}>
        <Form form={form} onFinish={renew} initialValues={{ days: 30, data_gb: 100 }}>
          <Form.Item name="days" label="天数"><InputNumber min={1} /></Form.Item>
          <Form.Item name="data_gb" label="流量(GB)"><InputNumber min={1} /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
