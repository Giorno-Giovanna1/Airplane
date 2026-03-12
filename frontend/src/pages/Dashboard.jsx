import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Table, Tag, Spin } from 'antd'
import { ClockCircleOutlined, CloudOutlined, ShoppingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../api'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(2)} ${units[i]}`
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/user/me'), api.get('/order/list')])
      .then(([u, o]) => { setUser(u.data); setOrders(o.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const expired = !user.expire_time || dayjs(user.expire_time).isBefore(dayjs())
  const columns = [
    { title: '套餐', dataIndex: 'plan_name' },
    { title: '金额', dataIndex: 'amount', render: (v) => `¥${(v / 100).toFixed(2)}` },
    { title: '状态', dataIndex: 'status', render: (s) => <Tag color={s === 'paid' ? 'green' : 'orange'}>{s === 'paid' ? '已支付' : '待支付'}</Tag> },
    { title: '时间', dataIndex: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ]

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="到期时间"
              value={expired ? '未订阅' : dayjs(user.expire_time).format('YYYY-MM-DD')}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: expired ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已用流量" value={formatBytes(user.data_used)} prefix={<CloudOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="总流量" value={formatBytes(user.data_limit)} prefix={<CloudOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card title="最近订单">
        <Table dataSource={orders} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>
    </>
  )
}
