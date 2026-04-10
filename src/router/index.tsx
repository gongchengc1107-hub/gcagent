import { createHashRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import AuthGuard from '@/components/AuthGuard'
import LoginPage from '@/pages/Login'
import ChatPage from '@/pages/Chat'
import AgentsPage from '@/pages/Agents'
import SkillsPage from '@/pages/Skills'
import MCPToolsPage from '@/pages/MCPTools'
import SettingsPage from '@/pages/Settings'
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
          element: <SettingsPage />
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
