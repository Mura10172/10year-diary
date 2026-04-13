"use client";

export default function SettingsView({
  onOpenDictionary,
}: {
  onOpenDictionary: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <p className="text-xs text-stone-300 tracking-widest whitespace-nowrap">設定</p>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <button
          onClick={onOpenDictionary}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-700">音声認識 辞書</p>
              <p className="text-xs text-stone-400 mt-0.5">発音と表示単語の変換ルールを登録</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
