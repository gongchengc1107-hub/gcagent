import { createHashRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import AuthGuard from '@/components/AuthGuard'
import LoginPage from '@/pages/Login'
import ChatPage from '@/pages/Chat'
import AgentsPage from '@/pages/Agents'
import SkillsPage from '@/pages/Skills'
import MCPToolsPage from '@/pages/MCPTools'
import SettingsPage from '@/pages/Settings'
import AccountSettings from '@/pages/Settings/components/AccountSettings'
import ProviderSettings from '@/pages/Settings/components/ProviderSettings'
import UsageStats from '@/pages/Settings/components/UsageStats'
import AppearanceSettings from '@/pages/Settings/components/AppearanceSettings'
import DataManagement from '@/pages/Settings/components/DataManagement'
import TodoPage from '@/pages/Todo'

const router = createHashRouter(
  [
    {
      path: '/login',
      element: <LoginPage />
    },
    {
      path: '/',
      element: (
        <AuthGuard>
          <Layout />
        </AuthGuard>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/chat" replace />
        },
        {
          path: 'chat',
          element: <ChatPage />
        },
        {
          path: 'agents',
          element: <AgentsPage />
        },
        {
          path: 'skills',
          element: <SkillsPage />
        },
        {
          path: 'mcp',
          element: <MCPToolsPage />
        },
        {
          path: 'todo',
          element: <TodoPage />
        },
        {
          path: 'settings',
          element: <SettingsPage />,
          children: [
            {
              index: true,
              element: <Navigate to="/settings/account" replace />
            },
            {
              path: 'account',
              element: <AccountSettings />
            },
            {
              path: 'provider',
              element: <ProviderSettings />
            },
            {
              path: 'usage',
              element: <UsageStats />
            },
            {
              path: 'appearance',
              element: <AppearanceSettings />
            },
            {
              path: 'data',
              element: <DataManagement />
            }
          ]
        }
      ]
    },
    {
      path: '*',
      element: <Navigate to="/chat" replace />
    }
  ],
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true
    }
  }
)

export default router
