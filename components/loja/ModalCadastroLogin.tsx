'use client'

import { useState, FormEvent, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  abaInicial?: 'cadastro' | 'login'
  mostrarContinuarSemCadastro?: boolean
  onContinuarSemCadastro?: () => void
}

function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatTel(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export default function ModalCadastroLogin({ open, onClose, onSuccess, abaInicial = 'cadastro', mostrarContinuarSemCadastro, onContinuarSemCadastro }: Props) {
  const router = useRouter()
  const [aba, setAba] = useState<'cadastro' | 'login'>(abaInicial)

  // ── Campos cadastro ───────────────────────────────────────────────────────
  const [nome,        setNome]        = useState('')
  const [cpf,         setCpf]         = useState('')
  const [email,       setEmail]       = useState('')
  const [nascimento,  setNascimento]  = useState('')
  const [telefone,    setTelefone]    = useState('')
  const [senha,       setSenha]       = useState('')
  const [confirmar,   setConfirmar]   = useState('')

  // ── Campos login ──────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  // ── Estado geral ──────────────────────────────────────────────────────────
  const [erro,    setErro]    = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setErro('')
    setAba(abaInicial)
  }, [open, abaInicial])

  // Bloqueia scroll do body quando modal aberto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  // ── Cadastro ──────────────────────────────────────────────────────────────
  async function handleCadastro(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6)    { setErro('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/cadastro', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nome,
          email,
          senha,
          cpf:      cpf.replace(/\D/g, ''),
          telefone: telefone.replace(/\D/g, ''),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro || 'Erro ao criar conta.'); return }

      // Loga automaticamente
      const result = await signIn('credentials', { email, password: senha, redirect: false })
      if (result?.ok) {
        router.refresh()
        onSuccess?.()
        onClose()
      } else {
        setErro('Conta criada! Faça login para continuar.')
        setAba('login')
        setLoginEmail(email)
      }
    } catch {
      setErro('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email:    loginEmail,
        password: loginSenha,
        redirect: false,
      })
      if (result?.ok) {
        router.refresh()
        onSuccess?.()
        onClose()
      } else {
        setErro('E-mail ou senha inválidos.')
      }
    } catch {
      setErro('Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {aba === 'cadastro' ? 'Criar conta' : 'Entrar na conta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setAba('cadastro'); setErro('') }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              aba === 'cadastro'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Criar conta
          </button>
          <button
            onClick={() => { setAba('login'); setErro('') }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              aba === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Já tenho conta
          </button>
        </div>

        <div className="px-6 py-5">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {erro}
            </div>
          )}

          {/* ── FORMULÁRIO CADASTRO ── */}
          {aba === 'cadastro' && (
            <form onSubmit={handleCadastro} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  type="text" required value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  type="text" required value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de nascimento</label>
                <input
                  type="date" value={nascimento}
                  onChange={e => setNascimento(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text" value={telefone}
                  onChange={e => setTelefone(formatTel(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Senha * (mínimo 6 caracteres)</label>
                <input
                  type="password" required value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar senha *</label>
                <input
                  type="password" required value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
              >
                {loading ? 'Criando conta…' : 'Criar conta e continuar'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Ao criar sua conta você concorda com nossos Termos de Uso e Política de Privacidade.
              </p>
            </form>
          )}

          {/* ── FORMULÁRIO LOGIN ── */}
          {aba === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email" required value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  type="password" required value={loginSenha}
                  onChange={e => setLoginSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          )}
        </div>

        {/* Botão continuar sem cadastro */}
        {mostrarContinuarSemCadastro && (
          <div className="px-6 pb-5 text-center border-t border-gray-100 pt-4">
            <button
              onClick={onContinuarSemCadastro}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Continuar comprando sem cadastro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
