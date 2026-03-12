import { Layout as AntLayout, Menu, Button, theme } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  LinkOutlined,
  UserOutlined,
  TeamOutlined,
  OrderedListOutlined,
  SettingOutlined,
  CloudServerOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = AntLayout

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  const { token: themeToken } = theme.useToken()

  const userMenuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/plans', icon: <ShoppingOutlined />, label: '购买套餐' },
    { key: '/subscribe', icon: <LinkOutlined />, label: '订阅链接' },
  ]

  const adminMenuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '管理概览' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/admin/plans', icon: <ShoppingOutlined />, label: '套餐管理' },
    { key: '/admin/orders', icon: <OrderedListOutlined />, label: '订单管理' },
    { key: '/admin/servers', icon: <CloudServerOutlined />, label: '节点管理' },
    { key: '/admin/admins', icon: <SettingOutlined />, label: '管理员' },
  ]

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('is_admin')
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          订阅管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={isAdmin ? adminMenuItems : userMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: themeToken.colorBgContainer, padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button icon={<LogoutOutlined />} onClick={logout}>退出登录</Button>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ padding: 24, background: themeToken.colorBgContainer, borderRadius: 8, minHeight: 360 }}>
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
