import React from 'react';
import { X, Keyboard, Zap, Sparkles, Sliders, BarChart2, Video } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">
              {isAr ? 'دليل التحكم والضربات الاحترافية' : 'Pro Tennis Controls & Shot Repertoire'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Movement & Aim */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="font-black text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {isAr ? 'حركة اللاعب وتوجيه الزوايا' : 'Movement & Shot Direction'}
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded mr-1">
                  WASD / الأسهم
                </span>
                <span>{isAr ? 'التحرك والركض السريع في الملعب' : 'Court sprint & footwork'}</span>
              </div>
              <div>
                <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded mr-1">
                  سهم يسار / يمين (A/D)
                </span>
                <span>{isAr ? 'توجيه زاوية الكرة عرضية أو على الخطوط' : 'Cross-court & down-the-line angle'}</span>
              </div>
            </div>
          </div>

          {/* Shot types */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="font-black text-cyan-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              {isAr ? 'ترسانة الضربات الاحترافية (10 ضربات)' : 'Pro Shot Types (Full Repertoire)'}
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-lime-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  Space / مسافة
                </span>
                <span>
                  {isAr ? 'إرسال احترافي أو ضربة مستقيمة مسطحة (Flat Drive)' : 'Serve toss/strike or fast Flat Drive'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-cyan-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  J / توبسبين
                </span>
                <span>
                  {isAr ? 'توبسبين هابط بقوة ماغنوس وارتداد عالٍ' : 'Topspin dip with heavy bounce'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-purple-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  K / سلايس
                </span>
                <span>
                  {isAr ? 'سلايس خلفي مقطوع ينزلق زاحفاً' : 'Backspin slice skid low on court'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  O / لوب
                </span>
                <span>
                  {isAr ? 'كرة ساقطة دفاعية عالية فوق رأس الخصم (Lob)' : 'High defensive Lob over opponent'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-amber-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  P / دروب شوت
                </span>
                <span>
                  {isAr ? 'كرة قصيرة مباغتة قرب الشبكة (Drop shot)' : 'Touch Drop shot right over net'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-rose-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                  L / خارق
                </span>
                <span>
                  {isAr ? 'الضربة الخارقة (Super Smash) عند 100% طاقة' : 'Anime Ultimate Smash at 100%'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="font-black text-emerald-400 mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              {isAr ? 'اختصارات لوحة المفاتيح والتحكم' : 'Quick Keyboard Shortcuts'}
            </h4>
            <div className="grid sm:grid-cols-3 gap-2 text-slate-300">
              <div>
                <span className="font-bold text-cyan-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1">U</span>
                <span>{isAr ? 'قائمة الإعدادات والفيزياء' : 'Physics Settings'}</span>
              </div>
              <div>
                <span className="font-bold text-emerald-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1">I</span>
                <span>{isAr ? 'إحصائيات المباراة' : 'Match Statistics'}</span>
              </div>
              <div>
                <span className="font-bold text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1">R</span>
                <span>{isAr ? 'إعادة اللقطة البطيئة' : 'Instant Replay'}</span>
              </div>
              <div>
                <span className="font-bold text-purple-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1">C</span>
                <span>{isAr ? 'تبديل زاوية الكاميرا (4 زوايا)' : 'Cycle Camera (4 views)'}</span>
              </div>
            </div>
          </div>

          {/* Serving tips */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <h4 className="font-black text-amber-300 mb-1">
              {isAr ? '💡 نصيحة الإرسال الاحترافي:' : '💡 Pro Serve Tip:'}
            </h4>
            <p className="text-[11px] leading-relaxed">
              {isAr
                ? 'اضغط مسافة لرمي الكرة في الهواء، ثم انتظر وصولها إلى قمة الارتفاع (Apex) واضغط مسافة مجدداً لضربة ساحقة وقوية (Ace) بسرعة تفوق 160 كم/س!'
                : 'Press Space once to toss the ball into the air, wait until it reaches the apex of the toss, then press Space again for a blisteringly fast Ace (160+ km/h)!'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق والعودة للعب' : 'Back to Court'}
          </button>
        </div>
      </div>
    </div>
  );
};
