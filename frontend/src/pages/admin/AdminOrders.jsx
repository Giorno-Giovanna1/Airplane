import { useState, useEffect } from 'react'
import { Table, Tag } from 'antd'
import dayjs from 'dayjs'
import api from '../../api'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户', dataIndex: 'user_email' },
    { title: '套餐', dataIndex: 'plan_name' },
    { title: '金额', dataIndex: 'amount', render: (v) => `¥${(v / 100).toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'paid' ? 'green' : s === 'expired' ? 'red' : 'orange'}>{s === 'paid' ? '已支付' : s === 'expired' ? '已过期' : '待支付'}</Tag>,
    },
    { title: '交易号', dataIndex: 'trade_no', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '支付时间', dataIndex: 'paid_at', render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
  ]

  return <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} scroll={{ x: 900 }} />
}
