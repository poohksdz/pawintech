import os

filepath = r"d:\pawin\pawin-backend 31 20250106\frontend\src\components\Header.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_1 = """                                        <div className="py-20 px-8 text-center bg-white">
                                           <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-inner rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                              <MdNotifications className="text-slate-200 -rotate-12" size={40} />
                                           </div>
                                           <h4 className="text-sm font-bold text-slate-900 mb-1">Clean slate</h4>
                                           <p className="text-[11px] text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">You're all caught up! No notifications at the moment.</p>
                                        </div>"""

new_1 = """                                        <div className="py-8 sm:py-20 px-6 sm:px-8 text-center bg-white">
                                           <div className="w-14 h-14 sm:w-20 sm:h-20 bg-slate-50 rounded-full sm:rounded-[2rem] flex items-center justify-center mx-auto mb-3 sm:mb-5 border border-slate-100 shadow-inner rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                              <MdNotifications className="text-slate-200 -rotate-12 size-6 sm:size-10" />
                                           </div>
                                           <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Clean slate</h4>
                                           <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium max-w-[180px] sm:max-w-[200px] mx-auto leading-relaxed">You're all caught up! No notifications at the moment.</p>
                                        </div>"""

old_2 = """                                  <div className="p-4 bg-white border-t border-slate-100 text-center">
                                     <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] rounded-xl transition-all border border-slate-100 active:scale-[0.98]">
                                        Activity Dashboard
                                     </button>
                                  </div>"""

new_2 = """                                  <div className="p-3 sm:p-4 bg-white border-t border-slate-100 text-center">
                                     <button className="w-full py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100 text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] rounded-lg sm:rounded-xl transition-all border border-slate-100 active:scale-[0.98]">
                                        Activity Dashboard
                                     </button>
                                  </div>"""

content = content.replace(old_1, new_1)
content = content.replace(old_2, new_2)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("done patching Header.jsx")
