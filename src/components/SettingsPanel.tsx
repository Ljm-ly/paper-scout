import React, { useState } from 'react'
import { Settings, Save, Eye, EyeOff, Key, Globe, Languages } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SettingsPanel() {
  const { settings, updateSettings } = useApp()
  const [form, setForm] = useState({ ...settings })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">设置</h2>
        </div>

        {/* CORS Proxy */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4" /> CORS 代理
          </label>
          <input
            type="text"
            value={form.corsProxy}
            onChange={e => setForm({ ...form, corsProxy: e.target.value })}
            placeholder="https://corsproxy.io/?"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            用于解决跨域问题。默认使用 corsproxy.io。留空则不使用代理。
          </p>
        </div>

        {/* OpenAI API Key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Key className="w-4 h-4" /> OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.openaiKey}
              onChange={e => setForm({ ...form, openaiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            用于 AI 翻译和关联推荐功能。密钥仅保存在本地浏览器中。
          </p>
        </div>

        {/* Model */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Languages className="w-4 h-4" /> AI 模型
          </label>
          <select
            value={form.openaiModel}
            onChange={e => setForm({ ...form, openaiModel: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white"
          >
            <option value="gpt-4o-mini">GPT-4o Mini（推荐，便宜快速）</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        {/* Translation toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">启用翻译功能</p>
            <p className="text-xs text-gray-500">在论文详情中显示翻译按钮</p>
          </div>
          <button
            onClick={() => setForm({ ...form, translateEnabled: !form.translateEnabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              form.translateEnabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.translateEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-100 text-green-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saved ? (
            <>已保存</>
          ) : (
            <>
              <Save className="w-4 h-4" /> 保存设置
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">关于数据安全</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            所有数据（收藏、笔记、设置）仅保存在你的浏览器本地存储中，不会上传到任何服务器。
            OpenAI API Key 也仅保存在本地，直接发送给 OpenAI 进行翻译。
          </p>
        </div>
      </div>
    </div>
  )
}
