import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.08); }
        }
        @keyframes drift1 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.4; }
          33%  { transform: translate(40px, -60px) scale(1.2); opacity: 0.6; }
          66%  { transform: translate(-30px, -30px) scale(0.9); opacity: 0.3; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        }
        @keyframes drift2 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50%  { transform: translate(-50px, 40px) scale(1.15); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        @keyframes drift3 {
          0%   { transform: translate(0, 0); opacity: 0.25; }
          40%  { transform: translate(30px, 50px); opacity: 0.45; }
          80%  { transform: translate(-20px, 20px); opacity: 0.2; }
          100% { transform: translate(0, 0); opacity: 0.25; }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
          98% { opacity: 0.7; }
        }
        .float-card { animation: float 4s ease-in-out infinite; }
        .glow-blob  { animation: pulse-glow 5s ease-in-out infinite; }
        .orb1       { animation: drift1 12s ease-in-out infinite; }
        .orb2       { animation: drift2 16s ease-in-out infinite; }
        .orb3       { animation: drift3 10s ease-in-out infinite; }
        .flicker    { animation: flicker 8s ease-in-out infinite; }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #2d1060 0%, #1e0a4e 60%, #050212 100%)' }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Center glow */}
        <div className="glow-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] blur-3xl rounded-full pointer-events-none" style={{ background: 'rgba(124,58,237,0.25)' }} />

        {/* Floating orbs */}
        <div className="orb1 absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(124,58,237,0.3)' }} />
        <div className="orb2 absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(109,40,217,0.2)' }} />
        <div className="orb3 absolute top-1/2 right-1/3 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(196,181,253,0.25)' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-lg mx-auto">

          <div className="flex items-center justify-center gap-3 mb-10">
            <Image src="/gol-purple.png" alt="" width={36} height={36} />
            <span className="text-white font-bold text-lg tracking-tight">GraceOnlineLibrary</span>
          </div>

          <div className="float-card">
            <div
              className="flicker text-[120px] md:text-[160px] font-black leading-none tracking-tight select-none"
              style={{
                background: 'linear-gradient(135deg, #c4b5fd 0%, #7c3aed 50%, #ddd6fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.5))',
              }}
            >
              404
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              Thou hast wandered from the path.
            </h1>
            <p className="text-purple-200 text-base leading-relaxed mb-10 max-w-sm mx-auto">
              That page doesn&apos;t exist or has been moved. Let&apos;s get you back to the library.
            </p>

            <div className="flex items-center justify-center">
              <Link
                href="/"
                className="px-6 py-3 text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl transition-colors"
              >
                Back to the Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
