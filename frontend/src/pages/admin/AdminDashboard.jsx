import { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Spin } from 'antd'
import { TeamOutlined, ShoppingOutlined, OrderedListOutlined, CloudServerOutlined } from '@ant-design/icons'
import api from '../../api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, plans: 0, orders: 0, servers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/plans'),
      api.get('/admin/orders'),
      api.get('/admin/servers'),
    ])
      .then(([u, p, o, s]) => {
        setStats({
          users: u.data.length,
          plans: p.data.length,
          orders: o.data.length,
          servers: s.data.length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card><Statistic title="用户总数" value={stats.users} prefix={<TeamOutlined />} /></Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card><Statistic title="套餐数" value={stats.plans} prefix={<ShoppingOutlined />} /></Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card><Statistic title="订单数" value={stats.orders} prefix={<OrderedListOutlined />} /></Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card><Statistic title="节点数" value={stats.servers} prefix={<CloudServerOutlined />} /></Card>
      </Col>
    </Row>
  )
}
