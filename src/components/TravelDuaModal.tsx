import React from 'react';
import { CheckCircle, ShieldCheck, BookOpen } from 'lucide-react';
import { HoopoMascot } from './HoopoMascot';

interface TravelDuaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TravelDuaModal: React.FC<TravelDuaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dua-title"
    >
      <div className="relative w-full max-w-2xl my-auto bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-950/50 text-slate-100 overflow-hidden">
        {/* Subtle geometric Islamic pattern accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-md shadow-amber-500/20 shrink-0">
              <img
                src="/assets/aistudio/hoopoe_logo_bedb9b31.png"
                alt="Hoopoe Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Islamic Travel Blessing • دعاء السفر
              </span>
              <h2 id="dua-title" className="text-base sm:text-lg font-bold text-white">
                Dua Before Travelling (Dua Safar)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HoopoMascot size="sm" mood="greeting" />
          </div>
        </div>

        {/* Content body */}
        <div className="my-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Sacred Arabic Text */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 text-center shadow-inner">
            <p
              dir="rtl"
              className="font-arabic text-xl sm:text-2xl lg:text-3xl leading-relaxed text-emerald-200 select-text"
              style={{ lineHeight: '1.9' }}
            >
              اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ. اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى...
            </p>
          </div>

          {/* Full Tamil Travel Dua & Reference */}
          <div className="bg-slate-850/80 rounded-2xl p-4 sm:p-5 border border-slate-750 text-left space-y-3 font-tamil">
            <div className="flex items-center justify-between border-b border-slate-750 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                பிரயாண துஆ (தமிழ் உச்சரிப்பு)
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                ஆதாரம்: முஸ்லிம் 2392
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium select-text">
              &ldquo;அல்லாஹு அக்(b)பர், அல்லாஹு அக்(b)பர், அல்லாஹு அக்(b)பர். ஸு(b)ப்ஹானல்ல(d)தீ ஸ(kh)க்கர லனா ஹா(d)தா வமா குன்னா லஹு மு(q)க்ரினீன். வஇன்னா இலா ர(b)ப்பினா லமுன்(q)கலிபூன். அல்லா ஹும்ம இன்னா நஸ்அலு(க்)க (f)பீ ஸ(f)பரினா ஹா(d)தல்(b)பிர்ர வ(th)த்த(q)க்வா வமினல் அமலி மா(th)தர்ளா. அல்லாஹும்ம ஹவ்வின் அலைனா ஸ(f)பரனா ஹா(d)தா வ(th)த்வி அன்னா (b)புஃ(d)தஹு, அல்லாஹும்ம அன்(த்)தஸ் ஸாஹி(b)பு (f)பிஸ்ஸ(f)பரி வல் (kh)கலீ(f)ப(th)து (f)பில் அஹ்லி அல்லா ஹும்ம இன்னீ அவூ(d)து பி(க்)க மின் வஃஸாயிஸ் ஸ(f)பரி வகா(b)ப(th)தில் மன்(d)ளரி வஸுயில் முன்(q)கல(b)பி (f)பில் மாலி வல் அஹ்லி&rdquo; எனக் கூறுவார்கள்.
            </p>

            <p className="text-xs sm:text-sm text-amber-300 font-semibold leading-relaxed border-t border-slate-750 pt-2 select-text">
              ஆயி(b)பூன (th)தாயி(b)பூன ஆ(b)பி(d)தூன லிர(b)ப்பினா ஹாமி(d)தூன்.
            </p>

            <div className="text-[11px] text-slate-400 italic">
              ஆதாரம்: ஸஹீஹ் முஸ்லிம் 2392
            </div>
          </div>

          {/* Hoopo's Gentle Note */}
          <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs sm:text-sm text-emerald-300">
            <span className="text-lg">✨</span>
            <p>
              <strong className="text-emerald-200">Hoopo says:</strong> &ldquo;இப்பயண துஆவை ஓதி பாதுகாப்பை நாடி பயணம் செய்யுங்கள். பிஸ்மில்லாஹ் கூறி இன்ஜினை தொடங்குங்கள்!&rdquo;
            </p>
          </div>
        </div>

        {/* Footer Action - Prominent I Read Button */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            aria-label="I Have Read"
          >
            <CheckCircle className="w-5 h-5" />
            <span>I Have Read (Proceed to HUD)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
