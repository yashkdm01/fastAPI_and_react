export const LoadingTerminal = ({ message }) => (
  <div className="fixed inset-0 bg-neo-black z-[200] flex flex-col items-center justify-center p-10 font-mono">
    <div className="w-full max-w-2xl border-2 border-neo-white p-6 bg-black text-neo-green shadow-[0_0_20px_rgba(0,224,150,0.3)]">
      <div className="flex justify-between border-b border-neo-green mb-4 pb-2">
        <span>TERMINAL_OS v1.0</span>
        <span className="animate-pulse">● RUNNING</span>
      </div>
      <p className="text-xl mb-2">{'>'} {message}</p>
      <div className="w-full bg-gray-900 h-8 border border-neo-green relative overflow-hidden">
        <div className="h-full bg-neo-green animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
      </div>
      <p className="mt-4 text-xs opacity-50">ENCRYPTING PIXELS... MAPPING COORDINATES... BURNING METADATA...</p>
    </div>
  </div>
);