import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Target, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-12 sm:space-y-16">
      <SEO 
        title="About Us - Hamro +2 Hub" 
        description="Learn about Hamro +2 Hub, Nepal's premier digital learning platform for NEB Class 11 and 12 Science and Management students." 
      />

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-6"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs sm:text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Empowering Nepal's Next Generation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          About <span className="text-[#F4B400]">Hamro +2 Hub</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          The unified academic platform built specifically for high school (+2) students in Nepal. 
          We bridge the gap between quality education and accessibility by delivering curated question papers, 
          structured notes, model solutions, and a collaborative learning community.
        </p>
      </motion.div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/85 p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl backdrop-blur-xl hover:border-amber-500/40 transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Our Mission</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            To democratize high-school education across all 7 provinces of Nepal by providing equal access to verified 
            academic resources. We empower students in both Science and Management streams to prepare effectively for board 
            and terminal examinations regardless of geographical or financial limitations.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/85 p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl backdrop-blur-xl hover:border-amber-500/40 transition-all relative overflow-hidden group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Our Vision</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A Nepal where every +2 student has a smart digital study companion at their fingertips. 
            We envision an active, peer-driven academic ecosystem where sharing knowledge is rewarded, 
            collaboration is effortless, and excellence is achievable for everyone.
          </p>
        </motion.div>
      </div>

      {/* Core Values / Why Choose Us */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Why Students Choose Us</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered specifically to solve the real challenges faced by NEB students.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: BookOpen,
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              title: 'NEB Curriculum Aligned',
              desc: 'Every syllabus, note, and question paper conforms strictly to the latest National Examination Board (NEB) curriculum.'
            },
            {
              icon: FileText,
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              title: 'Top College Question Banks',
              desc: 'Access terminal, pre-board, and model examination papers from prestigious institutions like CCRC, KMC, St. Xavier\'s, Prasadi, and Trinity.'
            },
            {
              icon: ShieldCheck,
              color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              title: 'Verified Solutions',
              desc: 'Step-by-step worked solutions for previous years questions reviewed and verified by top subject educators.'
            },
            {
              icon: Users,
              color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              title: 'Interactive Stream Chat',
              desc: 'Collaborate in real-time with classmates and peers from your exact stream and year across the nation.'
            },
            {
              icon: Layers,
              color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              title: 'Contribute & Earn Rewards',
              desc: 'Our unique incentive model rewards students with real cash rewards (via eSewa/Khalti) for sharing verified papers and notes.'
            },
            {
              icon: GraduationCap,
              color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              title: 'Free & Accessible Anywhere',
              desc: 'Optimized for high-speed mobile access so you can study seamlessly anytime, anywhere—even on low-bandwidth connections.'
            }
          ].map((pillar, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/85 p-5 sm:p-6 rounded-2xl border border-slate-700/60 hover:border-amber-500/40 shadow-sm backdrop-blur-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${pillar.color}`}>
                  <pillar.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Impact Numbers */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl p-6 sm:p-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-[#F4B400]">2+</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Streams (Science & Mgmt)</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-amber-400">1000+</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Question Papers & Solutions</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-blue-400">25+</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Top Colleges Covered</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-purple-400">100%</p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">NEB Syllabus Compliant</p>
          </div>
        </div>
      </div>

      {/* How Students Can Get Involved */}
      <div className="rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">How You Can Benefit</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Get the most out of Hamro +2 Hub in 3 simple steps.</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-full w-fit">
            <Heart className="w-3.5 h-3.5 fill-current" /> Made by Students, for Students
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-sm flex items-center justify-center border border-slate-700">
              1
            </div>
            <h3 className="font-bold text-white text-base">Explore Question Banks</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Browse previous years' board questions and terminal exam papers organized cleanly by year, college, and stream.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-sm flex items-center justify-center border border-slate-700">
              2
            </div>
            <h3 className="font-bold text-white text-base">Study Structured Notes</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Read concise chapter-wise notes and verified solutions tailored specifically to help you score high on the NEB exam.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-purple-400 font-bold text-sm flex items-center justify-center border border-slate-700">
              3
            </div>
            <h3 className="font-bold text-white text-base">Upload & Earn Rewards</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Got your college's latest exam question paper? Upload it on the Contribute page, get verified, and earn real money directly into your eSewa or Khalti account.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900/95 to-amber-500/10 border border-amber-500/30 shadow-2xl backdrop-blur-xl text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Ready to ace your +2 exams?</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Start exploring past papers, download verified notes, or join thousands of students preparing smarter today.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/pyq"
            className="px-6 py-2.5 bg-[#F4B400] hover:bg-[#e0b018] text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Past Questions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contribute"
            className="px-6 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Contribute & Earn
          </Link>
        </div>
      </div>
    </div>
  );
};
