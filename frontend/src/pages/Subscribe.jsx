import { useState, useEffect } from 'react'
import { Card, Button, Input, message, Typography, Space, Spin, Divider } from 'antd'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api'

const { Title, Paragraph } = Typography

export default function Subscribe() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    setLoading(true)
    api.get('/user/me').then((r) => setUser(r.data)).finally(() => setLoading(false))
  }

  useEffect(fetchUser, [])

  // 订阅链接直接指向后端 8000 端口（不走 Vite 代理，确保外部客户端能访问）
  const baseUrl = `${window.location.protocol}//${window.location.hostname}:8000`
  const token = user?.subscribe_token || ''
  const v2rayUrl = `${baseUrl}/api/subscribe/${token}`
  const clashUrl = `${baseUrl}/api/subscribe/${token}?format=clash`

  const copy = (url, label) => {
    navigator.clipboard.writeText(url)
    message.success(`${label} 已复制到剪贴板`)
  }

  const resetToken = async () => {
    try {
      await api.post('/user/reset-token')
      message.success('订阅链接已重置')
      fetchUser()
    } catch {
      message.error('重置失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <Card>
      <Title level={4}>订阅链接</Title>

      <Paragraph strong>V2RayN / Shadowrocket 通用订阅：</Paragraph>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input value={v2rayUrl} readOnly style={{ fontFamily: 'monospace' }} />
        <Button icon={<CopyOutlined />} onClick={() => copy(v2rayUrl, 'V2Ray 订阅链接')}>复制</Button>
      </Space.Compact>

      <Paragraph strong>Clash / Clash for Windows 订阅：</Paragraph>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input value={clashUrl} readOnly style={{ fontFamily: 'monospace' }} />
        <Button icon={<CopyOutlined />} onClick={() => copy(clashUrl, 'Clash 订阅链接')}>复制</Button>
      </Space.Compact>

      <Divider />
      <Button icon={<ReloadOutlined />} onClick={resetToken}>重置订阅链接</Button>
      <Paragraph type="warning" style={{ marginTop: 12 }}>
        重置后旧链接将失效，需要在客户端重新导入新链接。
      </Paragraph>
    </Card>
  )
}
