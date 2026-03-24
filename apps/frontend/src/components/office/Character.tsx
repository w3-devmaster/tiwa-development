'use client';

interface CharacterProps {
  colorTheme: string;
  hairStyle: string;
  hairColor: string;
  status: 'working' | 'thinking' | 'idle' | 'error';
  mouth: 'happy' | 'think' | 'sad' | 'neutral';
}

const headColors: Record<string, string> = {
  't-blue': 'bg-gradient-to-br from-[#dfe6e9] to-[#b2bec3]',
  't-purple': 'bg-gradient-to-br from-[#ffeaa7] to-[#fab1a0]',
  't-orange': 'bg-gradient-to-br from-[#ffeaa7] to-[#fdcb6e]',
  't-pink': 'bg-gradient-to-br from-[#ffeaa7] to-[#fab1a0]',
  't-green': 'bg-gradient-to-br from-[#dfe6e9] to-[#b2bec3]',
  't-red': 'bg-gradient-to-br from-[#fab1a0] to-[#ffeaa7]',
  't-gray': 'bg-gradient-to-br from-[#dfe6e9] to-[#b2bec3]',
  't-teal': 'bg-gradient-to-br from-[#dfe6e9] to-[#ffeaa7]',
};

const bodyColors: Record<string, string> = {
  't-blue': 'bg-gradient-to-br from-[#74b9ff] to-[#0984e3]',
  't-purple': 'bg-gradient-to-br from-[#a29bfe] to-[#6c5ce7]',
  't-orange': 'bg-gradient-to-br from-[#fdcb6e] to-[#e17055]',
  't-pink': 'bg-gradient-to-br from-[#fd79a8] to-[#e84393]',
  't-green': 'bg-gradient-to-br from-[#00b894] to-[#00cec9]',
  't-red': 'bg-gradient-to-br from-[#e17055] to-[#d63031]',
  't-gray': 'bg-gradient-to-br from-[#636e72] to-[#2d3436]',
  't-teal': 'bg-gradient-to-br from-[#00cec9] to-[#0984e3]',
};

const armColors: Record<string, string> = {
  't-blue': 'bg-[#5a9fd4]',
  't-purple': 'bg-[#8e86d6]',
  't-orange': 'bg-[#d4a054]',
  't-pink': 'bg-[#d46d91]',
  't-green': 'bg-[#00a388]',
  't-red': 'bg-[#c45044]',
  't-gray': 'bg-[#535a5d]',
  't-teal': 'bg-[#0abab5]',
};

const hairColorMap: Record<string, string> = {
  'hair-dark': 'bg-[#2d3436]',
  'hair-brown': 'bg-[#6d4c41]',
  'hair-green': 'bg-[#00b894]',
  'hair-purple': 'bg-[#6c5ce7]',
  'hair-gray': 'bg-[#636e72]',
  'hair-teal': 'bg-[#00cec9]',
  '': 'bg-[#2d3436]',
};

const hairStyleMap: Record<string, string> = {
  'hair-short': 'w-[36px] h-[18px] rounded-t-full -top-1',
  'hair-long': 'w-[40px] h-[24px] rounded-t-full rounded-b-[30%] -top-1',
  'hair-spiky': 'w-[38px] h-[20px] -top-1.5 [clip-path:polygon(10%_100%,0%_40%,15%_0%,30%_30%,50%_0%,70%_30%,85%_0%,100%_40%,90%_100%)]',
  'hair-bun': 'w-[36px] h-[22px] rounded-full -top-1.5',
};

const statusBubbleStyles: Record<string, { text: string; cls: string }> = {
  working: { text: 'Working', cls: 'bg-[rgba(0,184,148,.2)] text-[#00b894] border-[rgba(0,184,148,.3)]' },
  thinking: { text: 'Thinking...', cls: 'bg-[rgba(253,203,110,.2)] text-[#fdcb6e] border-[rgba(253,203,110,.3)] animate-[think-bob_2s_infinite]' },
  idle: { text: 'Idle', cls: 'bg-[rgba(123,127,158,.15)] text-[#7b7f9e] border-[rgba(123,127,158,.2)]' },
  error: { text: '⚠ Error', cls: 'bg-[rgba(225,112,85,.2)] text-[#e17055] border-[rgba(225,112,85,.3)] animate-[err-shake_.4s_infinite]' },
};

const charAnimation: Record<string, string> = {
  working: 'animate-[work-bob_3s_ease-in-out_infinite]',
  thinking: '',
  idle: 'animate-[doze_4s_ease-in-out_infinite]',
  error: 'animate-[err-char_.3s_infinite]',
};

export default function Character({ colorTheme, hairStyle, hairColor, status, mouth }: CharacterProps) {
  const bubble = statusBubbleStyles[status];
  const isWorking = status === 'working';
  const isThinking = status === 'thinking';
  const isIdle = status === 'idle';

  return (
    <div className={`relative w-[60px] h-[72px] -mt-1 z-[3] ${charAnimation[status]}`}>
      {/* Status bubble */}
      <div className={`absolute -top-[18px] left-1/2 -translate-x-1/2 px-2 py-[2px] rounded-lg text-[8px] font-bold whitespace-nowrap z-10 shadow-[0_2px_8px_rgba(0,0,0,.3)] border ${bubble.cls}`}>
        {bubble.text}
      </div>

      {/* Thinking dots */}
      {isThinking && (
        <div className="absolute -top-1.5 -right-2.5 flex gap-[2px] z-10">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[5px] h-[5px] bg-[#fdcb6e] rounded-full animate-[dot-b_.8s_infinite]" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* Hair */}
      <div className={`absolute left-1/2 -translate-x-1/2 z-[7] ${hairStyleMap[hairStyle] || ''} ${hairColor ? hairColorMap[hairColor] : 'bg-[#e17055]'}`} />

      {/* Head */}
      <div className={`w-[34px] h-[32px] rounded-full absolute top-0 left-1/2 -translate-x-1/2 z-[5] shadow-[0_3px_10px_rgba(0,0,0,.35)] ${headColors[colorTheme] || ''}`} />

      {/* Eyes */}
      <div className={`absolute top-3 left-1/2 -translate-x-1/2 flex gap-[7px] z-[6]`}>
        {isIdle ? (
          <>
            <div className="w-1.5 h-[2px] bg-white rounded-sm" />
            <div className="w-1.5 h-[2px] bg-white rounded-sm" />
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-[blink_4s_infinite]" />
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-[blink_4s_infinite]" />
          </>
        )}
      </div>

      {/* Mouth */}
      <div className="absolute top-[22px] left-1/2 -translate-x-1/2 z-[6]">
        {mouth === 'happy' && <div className="w-2 h-1 border-b-2 border-[#555] rounded-b-full" />}
        {mouth === 'think' && <div className="w-[5px] h-[5px] border-2 border-[#666] rounded-full animate-[think-m_3s_infinite]" />}
        {mouth === 'sad' && <div className="w-2 h-1 border-t-2 border-[#e17055] rounded-t-full" />}
        {mouth === 'neutral' && <div className="w-1.5 border-b-2 border-[#444]" />}
      </div>

      {/* Body */}
      <div className={`absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[38px] h-[30px] rounded-t-[14px] rounded-b-lg z-[4] ${bodyColors[colorTheme] || ''}`} />

      {/* Arms */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[54px] flex justify-between z-[4]">
        <div className={`w-[13px] h-3 rounded-[7px] ${armColors[colorTheme] || ''} ${isWorking ? 'animate-[arm-type_.4s_infinite_alternate]' : ''}`} />
        <div className={`w-[13px] h-3 rounded-[7px] ${armColors[colorTheme] || ''} ${isWorking ? 'animate-[arm-type_.4s_infinite_alternate]' : ''}`} />
      </div>

      {/* Chair */}
      <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[44px] h-[18px] bg-gradient-to-b from-[#222040] to-[#1a1830] rounded-[10px] z-0 shadow-[0_4px_10px_rgba(0,0,0,.35)]">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-[#18162a] rounded-sm" />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#18162a] rounded-[3px]" />
      </div>
    </div>
  );
}
