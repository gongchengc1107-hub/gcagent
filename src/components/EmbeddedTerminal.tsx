import { useEffect, useRef, type FC } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  ptyId: string
  onExit: (code: number) => void
}

const EmbeddedTerminal: FC<Props> = ({ ptyId, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // 用 ref 保存最新的 onExit，避免 stale closure
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  useEffect(() => {
    if (!containerRef.current) return

    // 初始化 xterm 实例
    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#10a37f',
        selectionBackground: '#10a37f55',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 1000,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    // 防止 ResizeObserver 回调在 dispose 之后继续执行
    let disposed = false

    // 通知主进程初始尺寸
    void window.electronAPI.invoke('pty:resize', ptyId, term.cols, term.rows)

    // 监听主进程推送的 PTY 输出
    const unlistenData = window.electronAPI.on('pty:data', (...args: unknown[]) => {
      const [id, data] = args as [string, string]
      if (id === ptyId && !disposed) term.write(data)
    })

    // 监听 PTY 退出事件
    const unlistenExit = window.electronAPI.on('pty:exit', (...args: unknown[]) => {
      const [id, exitCode] = args as [string, number]
      if (id === ptyId) onExitRef.current(exitCode)
    })

    // 键盘输入透传到 PTY
    term.onData((data) => {
      void window.electronAPI.invoke('pty:write', ptyId, data)
    })

    // 容器尺寸变化时自适应
    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return // 守卫：防止 dispose 后的残留回调
      fitAddon.fit()
      void window.electronAPI.invoke('pty:resize', ptyId, term.cols, term.rows)
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      disposed = true // 先置标志，再 disconnect，防止残留回调访问已销毁实例
      resizeObserver.disconnect()
      unlistenData()
      unlistenExit()
      void window.electronAPI.invoke('pty:destroy', ptyId)
      term.dispose()
    }
  }, [ptyId]) // ptyId 变化时重新创建终端；onExit 通过 ref 访问，不需要在 deps 中

  return (
    <div
      ref={containerRef}
      style={{
        height: 240,
        width: '100%',
        background: '#1e1e1e',
        borderRadius: 8,
        overflow: 'hidden',
        padding: '4px 2px',
        boxSizing: 'border-box',
      }}
    />
  )
}

export default EmbeddedTerminal
