export default function Placeholder({ title, features }: { title: string; features: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{features} · 아직 만들지 않은 화면</p>
    </div>
  )
}
