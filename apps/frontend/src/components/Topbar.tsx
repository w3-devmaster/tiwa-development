'use client';
import { useAppStore, pageNames } from '@/store/useAppStore';

export default function Topbar() {
  const { currentPage } = useAppStore();

  return (
    <header className="h-[52px] min-h-[52px] bg-[#111422] border-b border-[#2a2e45] flex items-center px-5 gap-3.5">
      <div className="text-[15px] font-semibold">{pageNames[currentPage]}</div>
      <div className="text-[11px] text-[#7b7f9e]">
        <span className="text-[#6c5ce7]">Tiwa</span> / {pageNames[currentPage]}
      </div>
      <div className="flex-1" />
      <input
        className="bg-[#181c2e] border border-[#2a2e45] rounded-[20px] px-4 py-1.5 text-[#e4e6f0] text-xs w-[220px] outline-none focus:border-[#6c5ce7] placeholder:text-[#555878]"
        placeholder="Search agents, tasks..."
      />
      <div className="flex gap-1.5">
        <button className="w-[34px] h-[34px] rounded-full bg-[#181c2e] border border-[#2a2e45] text-[#7b7f9e] flex items-center justify-center text-[15px] hover:bg-[#1e2238] hover:text-[#e4e6f0] transition-colors relative">
          🔔
          <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] bg-[#e17055] rounded-full border-2 border-[#111422]" />
        </button>
        <button className="w-[34px] h-[34px] rounded-full bg-[#181c2e] border border-[#2a2e45] text-[#7b7f9e] flex items-center justify-center text-[15px] hover:bg-[#1e2238] hover:text-[#e4e6f0] transition-colors">
          ⌨️
        </button>
        <button className="w-[34px] h-[34px] rounded-full bg-[#181c2e] border border-[#2a2e45] text-[#7b7f9e] flex items-center justify-center text-[15px] hover:bg-[#1e2238] hover:text-[#e4e6f0] transition-colors">
          ➕
        </button>
      </div>
    </header>
  );
}
