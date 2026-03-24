'use client';
import Character from './Character';
import type { AgentData } from '@/data/mockData';

const screenBgs: Record<string, string> = {
  coding: 'bg-gradient-to-b from-[#0d1117] to-[#161b22]',
  testing: 'bg-gradient-to-b from-[#0a1628] to-[#0d1f1a]',
  designing: 'bg-gradient-to-b from-[#1a0f28] to-[#2a1535]',
  infra: 'bg-gradient-to-b from-[#0f1a14] to-[#0d2818]',
  idle: 'bg-[#0d1117]',
  error: 'bg-gradient-to-b from-[#2a0f0f] to-[#1a0808]',
};

function MonitorScreen({ type }: { type: string }) {
  if (type === 'coding') {
    return (
      <div className="p-[5px] leading-[1.6]">
        {[
          { w: '70%', color: 'bg-[#74b9ff]', delay: '0s' },
          { w: '50%', color: 'bg-[#81ecec]', delay: '0.4s' },
          { w: '85%', color: 'bg-[#a29bfe]', delay: '0.8s' },
          { w: '40%', color: 'bg-[#00b894]', delay: '1.2s' },
          { w: '65%', color: 'bg-[#74b9ff]', delay: '1.6s' },
        ].map((line, i) => (
          <span key={i} className={`block h-[2.5px] my-[2.5px] rounded-sm ${line.color} animate-[typing_2.5s_infinite]`} style={{ width: line.w, animationDelay: line.delay }} />
        ))}
      </div>
    );
  }
  if (type === 'testing') {
    return (
      <div className="p-[5px]">
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[65%]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[55%]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#fdcb6e] w-[55%] animate-[typing_1.5s_infinite]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[45%]" />
      </div>
    );
  }
  if (type === 'designing') {
    return (
      <div className="p-[5px]">
        {[
          { w: '70%', color: 'bg-[#fd79a8]' },
          { w: '50%', color: 'bg-[#fdcb6e]' },
          { w: '80%', color: 'bg-[#a29bfe]' },
          { w: '45%', color: 'bg-[#fd79a8]' },
        ].map((line, i) => (
          <span key={i} className={`block h-[3.5px] my-[2px] rounded-sm ${line.color}`} style={{ width: line.w }} />
        ))}
      </div>
    );
  }
  if (type === 'infra') {
    return (
      <div className="p-[5px]">
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[90%]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[70%] animate-[typing_2s_infinite_.2s]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#81ecec] w-[80%]" />
        <span className="block h-[2.5px] my-[2.5px] rounded-sm bg-[#00b894] w-[60%]" />
      </div>
    );
  }
  if (type === 'error') {
    return <div className="flex items-center justify-center h-full text-lg animate-[blink-err_1s_infinite]">⚠️</div>;
  }
  // idle
  return <div className="flex items-center justify-center h-full text-[9px] text-[#7b7f9e] animate-[zzz_2.5s_infinite]">💤 Zzz</div>;
}

export default function DeskUnit({ agent }: { agent: AgentData }) {
  const isWorking = agent.status === 'working';

  return (
    <div className={`flex flex-col items-center w-[140px] transition-all duration-300 cursor-pointer hover:scale-105`}>
      {/* Monitor */}
      <div className="w-[76px] h-[52px] bg-gradient-to-br from-[#1a1f35] to-[#252a42] border-2 border-[#3a3f5a] rounded-t-[6px] rounded-b-[2px] relative z-[2] overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,.5)]">
        <div className={`absolute inset-[3px] rounded-[3px] overflow-hidden ${screenBgs[agent.screenType]}`}>
          <MonitorScreen type={agent.screenType} />
        </div>
      </div>
      {/* Stand + Base */}
      <div className="w-4 h-1.5 bg-[#2a2e45] mx-auto rounded-b-[3px]" />
      <div className="w-[38px] h-[3px] bg-[#2a2e45] mx-auto rounded-sm" />

      {/* Desk */}
      <div className="w-[118px] h-5 bg-gradient-to-b from-[#2a2440] to-[#1e1a30] rounded mt-0.5 relative z-[1] shadow-[0_4px_14px_rgba(0,0,0,.35)]">
        {/* Keyboard */}
        <div className="absolute bottom-1 right-3 w-[30px] h-[9px] bg-[#1a1828] border border-[#383450] rounded-sm" />
        {/* Mouse */}
        <div className="absolute bottom-1 right-1 w-[7px] h-2.5 bg-[#1a1828] border border-[#383450] rounded-t-[4px] rounded-b-[3px]" />
        {/* Mug */}
        {isWorking && (
          <div className="absolute bottom-[3px] left-2 w-[9px] h-2.5 bg-[#6c5ce7] rounded-b-[3px] border border-[#a29bfe]" />
        )}
      </div>

      {/* Character */}
      <Character
        colorTheme={agent.colorTheme}
        hairStyle={agent.hairStyle}
        hairColor={agent.hairColor}
        status={agent.status}
        mouth={agent.mouth}
      />

      {/* Name tags */}
      <div className={`mt-2 text-center text-xs font-semibold ${agent.status === 'idle' ? 'text-[#7b7f9e]' : ''}`}>
        {agent.name}
      </div>
      <div className="text-[9px] text-[#7b7f9e] text-center mt-[1px]">{agent.role}</div>
      <div className={`mt-1 text-[8px] px-2 py-[2px] rounded-[6px] text-center max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap ${
        agent.status === 'error'
          ? 'bg-[rgba(225,112,85,.1)] text-[#e17055]'
          : agent.status === 'idle'
            ? 'bg-[rgba(123,127,158,.08)] text-[#7b7f9e]'
            : 'bg-[rgba(129,236,236,.08)] text-[#81ecec]'
      }`}>
        {agent.task}
      </div>
    </div>
  );
}
