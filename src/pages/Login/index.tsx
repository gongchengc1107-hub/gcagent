import { useState, useEffect, useRef, type FC } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Alert, Spin } from 'antd'
import { RobotOutlined, LoadingOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'
import { useSettingsStore } from '@/stores/useSettingsStore'
import EmbeddedTerminal from '@/components/EmbeddedTerminal'

interface LocalAuthResult {
  username: string
  token: string
  expire: number
}

const LoginPage: FC = () => {
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const login = useAuthStore((s) => s.login)
  const setServePort = useSettingsStore((s) => s.setServePort)

  /** 全局加载状态（检测中 / 登录中） */
  const [loading, setLoading] = useState(true)
  /** 兜底错误信息 */
  const [error, setError] = useState<string | null>(null)

  /** null=检测中，false=未安装，true=已安装 */
  const [cliInstalled, setCliInstalled] = useState<boolean | null>(null)
  /** 安装脚本执行中 */
  const [installing, setInstalling] = useState(false)
  /** 实时安装日志 */
  const [installLog, setInstallLog] = useState('')
  /** 安装失败信息 */
  const [installError, setInstallError] = useState<string | null>(null)
  /** 内嵌终端的 pty ID，非空时展示终端 */
  const [ptyId, setPtyId] = useState<string | null>(null)

  /** 安装日志滚动容器 */
  const logRef = useRef<HTMLPreElement>(null)
  /** 并发守卫：防止 tryAutoLogin 被多处同时触发 */
  const loginInProgressRef = useRef(false)

  // 已登录用户访问 /login 时重定向到 /chat
  if (isLoggedIn) {
    return <Navigate to="/chat" replace />
  }

  /** 读取本地 auth 并自动登录（原有逻辑，不变） */
  const tryAutoLogin = async (): Promise<void> => {
    // 并发守卫：防止多处同时触发，拦截时确保 loading 回到 false
    if (loginInProgressRef.current) {
      setLoading(false)
      return
    }
    loginInProgressRef.current = true

    setLoading(true)
    setError(null)
    try {
      const [authResult, port] = await Promise.all([
        window.electronAPI.invoke('auth:getLocalAuth') as Promise<LocalAuthResult | null>,
        window.electronAPI.invoke('serve:getPort') as Promise<number>
      ])

      if (!authResult) {
        // 无凭证 → 启动内嵌终端执行 codemaker auth login
        const id = await window.electronAPI.invoke('pty:create', 80, 18) as string
        setPtyId(id)
        setLoading(false)
        return
      }

      // token 过期检查（提前 60s 认为过期）
      if (authResult.expire > 0 && authResult.expire - 60_000 < Date.now()) {
        // token 过期 → 同样启动终端重新登录
        const id = await window.electronAPI.invoke('pty:create', 80, 18) as string
        setPtyId(id)
        setLoading(false)
        return
      }

      // 同步 serve 端口
      if (port) setServePort(port)

      setLoading(false)
      login({
        id: authResult.username,
        username: authResult.username,
        email: authResult.username.includes('@')
          ? authResult.username
          : `${authResult.username}@codemaker.netease.com`,
        token: authResult.token,
        tokenExpire: authResult.expire
      })
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(`读取凭证失败：${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    } finally {
      loginInProgressRef.current = false
    }
  }

  /** 启动时：先检测 CLI，再检测凭证 */
  const checkThenLogin = async (): Promise<void> => {
    setLoading(true)
    const installed = await window.electronAPI.invoke('cli:checkInstalled') as boolean
    setCliInstalled(installed)
    if (installed) {
      void tryAutoLogin()
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    void checkThenLogin()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 安装日志自动滚动到底部
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [installLog])

  /** 点击"自动安装 codemaker"按钮 */
  const handleInstall = async (): Promise<void> => {
    setInstalling(true)
    setInstallLog('')
    setInstallError(null)

    const unlisten = window.electronAPI.on('cli:installProgress', (...args: unknown[]) => {
      setInstallLog((prev) => prev + (args[0] as string))
    })

    try {
      await window.electronAPI.invoke('cli:installCli')
      unlisten()
      setInstalling(false)
      // 双重校验：安装脚本 exit 0 不代表文件一定落盘，重新检测一次
      const verified = await window.electronAPI.invoke('cli:checkInstalled') as boolean
      setCliInstalled(verified)
      if (verified) {
        // 安装完成 → 自动检测凭证
        void tryAutoLogin()
      } else {
        setInstallError('安装脚本执行完成，但未检测到 codemaker 可执行文件，请手动安装后重试')
      }
    } catch (err) {
      unlisten()
      setInstallError(err instanceof Error ? err.message : '安装失败，请检查网络后重试')
      setInstalling(false)
    }
  }

  /** PTY 退出回调（用户完成 codemaker auth login） */
  const handlePtyExit = (_code: number): void => {
    setPtyId(null)
    // 等待 auth.json 写入完成后再读取
    setTimeout(() => { void tryAutoLogin() }, 800)
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e]">
      <div className="w-full max-w-[420px] rounded-2xl bg-white/95 px-10 py-12 shadow-2xl backdrop-blur-sm dark:bg-[#2a2a3a]/95">
        {/* Logo + 标题 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10a37f] text-3xl text-white shadow-lg">
            <RobotOutlined />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Codemaker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your AI Development Assistant</p>
        </div>

        {/* 全局 loading（检测中 / 凭证读取中） */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: '#10a37f' }} spin />} />
            <p className="text-sm text-gray-500">
              {cliInstalled === null ? '正在检测 codemaker CLI...' : '正在读取登录凭证...'}
            </p>
          </div>
        )}

        {/* CLI 未安装：安装引导区 */}
        {!loading && cliInstalled === false && (
          <div className="space-y-4">
            <Alert
              type="info"
              showIcon
              message="未检测到 codemaker CLI"
              description="需要先安装 codemaker 才能登录，点击下方按钮自动完成安装。"
            />

            {installError && (
              <Alert type="error" showIcon message="安装失败" description={installError} />
            )}

            {installing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spin size="small" />
                  <span>正在安装 codemaker，请稍候...</span>
                </div>
                {installLog && (
                  <pre
                    ref={logRef}
                    className="max-h-32 overflow-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-green-400"
                  >
                    {installLog}
                  </pre>
                )}
              </div>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                onClick={() => void handleInstall()}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 12,
                  backgroundColor: '#10a37f',
                  borderColor: '#10a37f',
                }}
              >
                自动安装 codemaker
              </Button>
            )}
          </div>
        )}

        {/* 内嵌终端：执行 codemaker auth login */}
        {ptyId && (
          <div className="space-y-3">
            <Alert
              type="info"
              showIcon
              message="请完成登录授权"
              description="在下方终端中按照提示完成网易账号授权，完成后将自动登录。"
            />
            <EmbeddedTerminal ptyId={ptyId} onExit={handlePtyExit} />
            <p className="text-center text-xs text-gray-400">
              完成授权后将自动登录...
            </p>
          </div>
        )}

        {/* 兜底错误提示 */}
        {!loading && !ptyId && error && (
          <div className="space-y-4">
            <Alert
              type="warning"
              showIcon
              message="登录失败"
              description={<span className="text-xs leading-relaxed">{error}</span>}
            />
            <Button
              type="primary"
              size="large"
              block
              onClick={() => void checkThenLogin()}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                backgroundColor: '#10a37f',
                borderColor: '#10a37f',
              }}
            >
              重试
            </Button>
          </div>
        )}

        {/* 底部文字 */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          网易内部工具 · 仅限内部使用
        </p>
      </div>
    </div>
  )
}

export default LoginPage
