import React from 'react';
import { Cookie } from 'lucide-react';

export const CookiePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-slate-900/85 border border-slate-700/60 shadow-xl backdrop-blur-xl p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-[#F5C21B] shadow-sm">
            <Cookie className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Cookie Policy</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">1. What Are Cookies</h2>
            <p>As is common practice with almost all professional websites this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it and why we sometimes need to store these cookies. We will also share how you can prevent these cookies from being stored however this may downgrade or 'break' certain elements of the sites functionality.</p>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">2. How We Use Cookies</h2>
            <p>We use cookies for a variety of reasons detailed below. Unfortunately in most cases there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">3. Disabling Cookies</h2>
            <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of the this site. Therefore it is recommended that you do not disable cookies.</p>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">4. The Cookies We Set</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li><strong className="text-white">Account related cookies:</strong> If you create an account with us then we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out however in some cases they may remain afterwards to remember your site preferences when logged out.</li>
              <li><strong className="text-white">Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page. These cookies are typically removed or cleared when you log out to ensure that you can only access restricted features and areas when logged in.</li>
              <li><strong className="text-white">Site preferences cookies:</strong> In order to provide you with a great experience on this site we provide the functionality to set your preferences for how this site runs when you use it. In order to remember your preferences we need to set cookies so that this information can be called whenever you interact with a page is affected by your preferences.</li>
            </ul>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">5. Third Party Cookies</h2>
            <p className="mb-3">In some special cases we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>This site uses Google Analytics which is one of the most widespread and trusted analytics solution on the web for helping us to understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.</li>
              <li>We also use social media buttons and/or plugins on this site that allow you to connect with your social network in various ways. For these to work the following social media sites including; Facebook, Twitter, LinkedIn, will set cookies through our site which may be used to enhance your profile on their site or contribute to the data they hold for various purposes outlined in their respective privacy policies.</li>
            </ul>
          </section>

          <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">6. More Information</h2>
            <p>Hopefully that has clarified things for you and as was previously mentioned if there is something that you aren't sure whether you need or not it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
