import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, message, Modal, QRCode, Spin, Typography } from 'antd'
import api from '../api'

const { Text } = Typography

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [payModal, setPayModal] = useState({ open: false, qrCode: '', orderId: null, mock: false, amount: 0 })
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    api.get('/plan/list').then((r) => setPlans(r.data)).finally(() => setLoading(false))
  }, [])

  const buy = async (plan) => {
    try {
      const { data } = await api.post('/order/create', { plan_id: plan.id })
      setPayModal({
        open: true,
        qrCode: data.qr_code,
        orderId: data.order_id,
        mock: data.mock,
        amount: data.amount,
      })
    } catch (e) {
      message.error(e.response?.data?.detail || '下单失败')
    }
  }

  const mockPay = async () => {
    setPaying(true)
    try {
      await api.post(`/order/mock-pay/${payModal.orderId}`)
      message.success('支付成功！订阅已激活')
      setPayModal({ open: false, qrCode: '', orderId: null, mock: false, amount: 0 })
    } catch (e) {
      message.error(e.response?.data?.detail || '支付失败')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <>
      <Row gutter={[16, 16]}>
        {plans.map((p) => (
          <Col xs={24} sm={12} md={8} key={p.id}>
            <Card
              title={p.name}
              extra={<Text strong style={{ color: '#1677ff', fontSize: 20 }}>¥{(p.price / 100).toFixed(2)}</Text>}
            >
              <p>时长: {p.duration_days} 天</p>
              <p>流量: {p.data_limit} GB</p>
              {p.description && <p>{p.description}</p>}
              <Button type="primary" block onClick={() => buy(p)}>立即购买</Button>
            </Card>
          </Col>
        ))}
        {plans.length === 0 && <Col span={24}><Card>暂无可用套餐</Card></Col>}
      </Row>

      <Modal
        title="支付订单"
        open={payModal.open}
        onCancel={() => setPayModal({ open: false, qrCode: '', orderId: null, mock: false, amount: 0 })}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>
            金额: <Text strong style={{ color: '#1677ff', fontSize: 24 }}>¥{(payModal.amount / 100).toFixed(2)}</Text>
          </p>
          {payModal.mock ? (
            <>
              <p style={{ color: '#faad14' }}>当前为模拟支付模式（未配置支付宝）</p>
              <Button type="primary" size="large" onClick={mockPay} loading={paying}>
                模拟支付
              </Button>
            </>
          ) : (
            <>
              <p>请使用支付宝扫码支付</p>
              <QRCode value={payModal.qrCode} size={200} style={{ margin: '0 auto' }} />
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
