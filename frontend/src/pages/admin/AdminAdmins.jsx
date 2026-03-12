import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api'

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form] = Form.useForm()

  const fetch = () => {
    setLoading(true)
    api.get('/admin/admins').then((r) => setAdmins(r.data)).finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const onSubmit = async (values) => {
    try {
      await api.post('/admin/admins', values)
      message.success('管理员创建成功')
      setModal(false)
      form.resetFields()
      fetch()
    } catch (e) {
      message.error(e.response?.data?.detail || '创建失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '邮箱', dataIndex: 'email' },
    { title: '创建时间', dataIndex: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ]

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setModal(true); form.resetFields() }} style={{ marginBottom: 16 }}>
        添加管理员
      </Button>
      <Table dataSource={admins} columns={columns} rowKey="id" loading={loading} />
      <Modal title="添加管理员" open={modal} onCancel={() => setModal(false)} onOk={() => form.submit()}>
        <Form form={form} onFinish={onSubmit} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}
