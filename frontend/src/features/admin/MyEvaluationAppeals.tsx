import { useState } from 'react'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { APPEAL_LABELS, type MyEvaluation } from './adminApi.ts'

export default function MyEvaluationAppeals() {
  const { data, error, reload } = useGet<MyEvaluation[]>('/api/my/evaluations')
  const [openId, setOpenId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  if (!data || data.length === 0) return error ? <p className="text-sm text-red-700">{error}</p> : null

  async function send(id: number) {
    setSendError(null)
    try {
      await api(`/api/my/evaluations/${id}/appeal`, { method: 'POST', body: { reason } })
      setOpenId(null)
      setReason('')
      reload()
    } catch (e) {
      setSendError((e as Error).message)
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[#DCE2DA] bg-white p-6">
      <h2 className="text-lg font-bold">내 평가 항의</h2>
      <p className="text-xs text-[#56635B]">부당한 평가라고 생각되면 항의를 보내 주세요. 관리자가 검토해서 평가를 지우거나 기각해요.</p>
      <ul className="divide-y divide-[#DCE2DA] border-t border-[#DCE2DA]">
        {data.map((e) => (
          <li key={e.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                <span className="font-semibold text-[#9A4508]">★ {e.score}</span> {e.comment ?? '(코멘트 없음)'}
              </p>
              {e.appealStatus ? (
                <span className="rounded-md bg-[#EEF1EC] px-2 py-0.5 text-xs font-medium text-[#3B4840]">
                  {APPEAL_LABELS[e.appealStatus]}
                </span>
              ) : null}
              {(e.appealStatus === null || e.appealStatus === 'REJECTED') && openId !== e.id && (
                <button
                  onClick={() => {
                    setOpenId(e.id)
                    setReason('')
                    setSendError(null)
                  }}
                  className="rounded-lg border border-[#C9D1C6] px-3 py-1 text-xs font-semibold hover:bg-[#EEF1EC]"
                >
                  항의하기
                </button>
              )}
            </div>
            {openId === e.id && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold" htmlFor={`appeal-${e.id}`}>
                  항의 이유
                </label>
                <textarea
                  id={`appeal-${e.id}`}
                  value={reason}
                  onChange={(ev) => setReason(ev.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-xl border border-[#C9D1C6] px-3 py-2 text-sm"
                />
                {sendError && <p className="text-xs text-red-700">{sendError}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setOpenId(null)} className="rounded-lg border border-[#C9D1C6] px-3 py-1.5 text-xs font-semibold">
                    취소
                  </button>
                  <button
                    onClick={() => send(e.id)}
                    disabled={!reason.trim()}
                    className="rounded-lg bg-[#1D6A43] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    항의 보내기
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
