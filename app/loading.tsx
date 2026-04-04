export default function RootLoading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#FFFFFF' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* ロゴ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Connects+"
          style={{ width: 96, height: 'auto' }}
        />
        {/* スピナー */}
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  )
}
