import { useState } from 'react'
import { Card, Form, Input, Button, message, Typography } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

const { Title } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const { data } = await api.post('/user/login', values)
      localStorage.setItem('token', data.token)
      localStorage.setItem('is_admin', data.is_admin)
      message.success('登录成功')
      navigate(data.is_admin ? '/admin' : '/dashboard')
    } catch (e) {
      message.error(e.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>登录</Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          没有账号？<Link to="/register">立即注册</Link>
        </div>
      </Card>
    </div>
  )
}
