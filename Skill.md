\---  
name: navbar-ui-builder  
description: Generates clean, accessible, and high-performance UI navbars with smart auto-hide, transparent-to-blur scroll transitions, theme-compatible color palettes, and minimalist design. Use when the user asks to create, build, style, or implement a navbar, navigation bar, top header, or web navigation component.  
\---

\# Navbar UI Builder

A specialized skill for building clean, silent, responsive, and accessible navigation bars. Enforces minimalist design principles, smart auto-hide and scroll-linked glassmorphism, theme-compatible color tokens, and curated typography.

\#\# When to Use

Use this skill whenever the user requests:  
\- Creating or designing a navbar or header component.  
\- Implementing transparent, sticky, or auto-hiding navigation.  
\- Adding dark/light theme toggles or responsive mobile navigation menus.  
\- Refactoring existing web navigation for better UX, aesthetics, or accessibility.

\#\# Strict Exclusions and Design Constraints

Always enforce the following negative constraints:  
\- \*\*No Online / Presence Indicators:\*\* Do not include active status badges, green indicator dots, or live presence pings.  
\- \*\*No Tech Stack Badges:\*\* Never display framework icons, runtime tags, or technology badges in the navbar.  
\- \*\*No Pulsing Animations:\*\* Prohibit pulse glows, radar pings, or looping attention-grabbing effects.  
\- \*\*No Emojis:\*\* Never use emojis for navigation icons, brand logos, or status markers. Use clean SVG geometric icons (e.g. Lucide or Radix icons) instead.  
\- \*\*Silent Navbar Principle:\*\* Keep the navbar distraction-free. Prohibit marketing announcement bars, secondary taglines, or promotional text. Restrict content strictly to Brand/Logo, Primary Nav Links, Theme Toggle, and Call to Action (CTA).

\#\# Core Behavior and Features

\#\#\# 1\. Transparent to Blur Backdrop  
\- \*\*At Top of Page (\`scrollY \=== 0\`):\*\* Navbar background is fully transparent (\`bg-transparent\`), blending into hero visuals.  
\- \*\*On Scroll (\`scrollY \> 20px\`):\*\* Smoothly transitions to glassmorphic backdrop blur (\`backdrop-blur-md bg-background/80\`) with a subtle 1px bottom border (\`border-b border-border/50\`).

\#\#\# 2\. Smart Auto-Hide (Scroll Direction Detection)  
\- \*\*Scrolling Down:\*\* Hides navbar smoothly off-screen (\`transform: translateY(-100%)\`) to maximize content viewing area.  
\- \*\*Scrolling Up or Reaching Top:\*\* Instantly slides navbar back into view (\`transform: translateY(0)\`).  
\- \*\*Accessibility Safeguard:\*\* Ensure auto-hide pauses when any element inside the navbar receives keyboard focus (\`:focus-within\`).

\#\#\# 3\. Smooth Fade Transitions  
\- Apply subtle transition curves to navigation links and buttons: \`transition: opacity 150ms ease-out, background-color 150ms ease-out, color 150ms ease-out\`.  
\- Avoid jarring scale or bounce effects on hover. Use gentle background tints or opacity shifts (e.g., \`opacity-80\` to \`opacity-100\`).

\#\#\# 4\. Theme System Compatibility  
\- All colors must map to CSS custom properties or Tailwind semantic tokens (\`bg-background\`, \`text-foreground\`, \`text-muted-foreground\`, \`border-border\`, \`bg-primary\`, \`text-primary-foreground\`).  
\- Include a minimalist SVG theme toggle (Sun / Moon) supporting light, dark, and system modes.

\#\#\# 5\. Mobile Navigation  
\- Seamless hamburger icon transitioning to close icon (X) on mobile viewports (\`\< 768px\`).  
\- Slide-out drawer or full-screen overlay with smooth opacity fade, background blur, and backdrop overlay.  
\- Trap keyboard focus inside open drawer and dismiss on \`Escape\` key or route change.

\#\# Theme-Compatible Color Palettes

Map all generated navbars to these curated color systems from Color Hunt:

\#\#\# SaaS and Enterprise  
\- \*\*Light:\*\* Background \`\#F2EFE7\`, Text \`\#3368A0\`, Hover/Border \`\#66A3BF\`, CTA \`\#0D47A1\`  
\- \*\*Dark:\*\* Background \`\#091540\`, Text \`\#ABD2FA\`, Hover/Border \`\#7692FF\`, CTA \`\#1B2CC1\`

\#\#\# Modern Developer and Cyber  
\- \*\*Light:\*\* Background \`\#F2F2ED\`, Text \`\#464B71\`, Hover/Border \`\#7CD5C7\`, CTA \`\#118AB2\`  
\- \*\*Dark:\*\* Background \`\#092328\`, Text \`\#8BBB92\`, Hover/Border \`\#2A835F\`, CTA \`\#12544F\`

\#\#\# Creative Startup and Consumer  
\- \*\*Light:\*\* Background \`\#FDF0D5\`, Text \`\#249D8F\`, Hover/Border \`\#E9C46A\`, CTA \`\#E76F51\`  
\- \*\*Dark:\*\* Background \`\#222831\`, Text \`\#DFD0B8\`, Hover/Border \`\#393E46\`, CTA \`\#948979\`

\#\#\# Eco and Wellness  
\- \*\*Light:\*\* Background \`\#F7F4ED\`, Text \`\#1B5E20\`, Hover/Border \`\#C7D3C0\`, CTA \`\#8FA28A\`  
\- \*\*Dark:\*\* Background \`\#152A38\`, Text \`\#D1D4C9\`, Hover/Border \`\#29435C\`, CTA \`\#556E53\`

\#\# Typography Recommendations (Fontshare)

Utilize high-quality, free font pairings from Fontshare:  
\- \*\*Universal Modern UI:\*\* Satoshi (Nav Links / Buttons) paired with Clash Display (Brand Logo).  
\- \*\*Enterprise / Tech:\*\* General Sans (Nav Links / Text) paired with Clash Grotesk (Brand Logo).  
\- \*\*Minimalist / Creative:\*\* Switzer or Supreme (Nav Links) paired with Cabinet Grotesk or Ranade (Brand Logo).  
\- \*\*Editorial / Premium:\*\* Switzer (Nav Links) paired with Sentient (Brand Logo).

\#\# Implementation Blueprint (React / Next.js \+ Tailwind CSS)

\`\`\`tsx  
'use client';

import React, { useState, useEffect } from 'react';  
import Link from 'next/link';

interface NavItem {  
  label: string;  
  href: string;  
}

const NAV\_ITEMS: NavItem\[\] \= \[  
  { label: 'Features', href: '\#features' },  
  { label: 'Pricing', href: '\#pricing' },  
  { label: 'Docs', href: '\#docs' },  
  { label: 'Changelog', href: '\#changelog' },  
\];

export function Navbar() {  
  const \[isScrolled, setIsScrolled\] \= useState(false);  
  const \[isVisible, setIsVisible\] \= useState(true);  
  const \[lastScrollY, setLastScrollY\] \= useState(0);  
  const \[mobileMenuOpen, setMobileMenuOpen\] \= useState(false);  
  const \[isDark, setIsDark\] \= useState(false);

  useEffect(() \=\> {  
    const handleScroll \= () \=\> {  
      const currentScrollY \= window.scrollY;  
      setIsScrolled(currentScrollY \> 20);

      if (currentScrollY \> lastScrollY && currentScrollY \> 80\) {  
        setIsVisible(false);  
      } else {  
        setIsVisible(true);  
      }  
      setLastScrollY(currentScrollY);  
    };

    window.addEventListener('scroll', handleScroll, { passive: true });  
    return () \=\> window.removeEventListener('scroll', handleScroll);  
  }, \[lastScrollY\]);

  return (  
    \<header  
      className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${  
        isVisible ? 'translate-y-0' : '-translate-y-full'  
      } ${  
        isScrolled  
          ? 'bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm'  
          : 'bg-transparent border-b border-transparent'  
      }\`}  
    \>  
      \<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"\>  
        \<Link href="/" className="font-bold text-lg tracking-tight text-foreground hover:opacity-90 transition-opacity duration-150"\>  
          Acme  
        \</Link\>

        \<nav className="hidden md:flex items-center space-x-8"\>  
          {NAV\_ITEMS.map((item) \=\> (  
            \<Link  
              key={item.href}  
              href={item.href}  
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"  
            \>  
              {item.label}  
            \</Link\>  
          ))}  
        \</nav\>

        \<div className="hidden md:flex items-center space-x-4"\>  
          \<button  
            onClick={() \=\> setIsDark(\!isDark)}  
            aria-label="Toggle Theme"  
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"  
          \>  
            {isDark ? (  
              \<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"\>  
                \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /\>  
              \</svg\>  
            ) : (  
              \<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"\>  
                \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /\>  
              \</svg\>  
            )}  
          \</button\>

          \<Link  
            href="/get-started"  
            className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150 shadow-sm"  
          \>  
            Get Started  
          \</Link\>  
        \</div\>

        \<button  
          onClick={() \=\> setMobileMenuOpen(\!mobileMenuOpen)}  
          aria-label="Open navigation menu"  
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"  
        \>  
          \<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"\>  
            \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /\>  
          \</svg\>  
        \</button\>  
      \</div\>

      {mobileMenuOpen && (  
        \<div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3"\>  
          {NAV\_ITEMS.map((item) \=\> (  
            \<Link  
              key={item.href}  
              href={item.href}  
              onClick={() \=\> setMobileMenuOpen(false)}  
              className="block text-base font-medium text-muted-foreground hover:text-foreground py-2"  
            \>  
              {item.label}  
            \</Link\>  
          ))}  
          \<div className="pt-4 border-t border-border/20 flex flex-col space-y-3"\>  
            \<Link  
              href="/get-started"  
              onClick={() \=\> setMobileMenuOpen(false)}  
              className="w-full text-center text-sm font-medium px-4 py-2.5 rounded-md bg-primary text-primary-foreground"  
            \>  
              Get Started  
            \</Link\>  
          \</div\>  
        \</div\>  
      )}  
    \</header\>  
  );  
}  
\`\`\`

\#\# Gotchas and Best Practices

\- \*\*Layout Shifts:\*\* Always set a fixed header height (e.g. \`h-16\`) and appropriate page top margin/padding when necessary.  
\- \*\*SSR Hydration:\*\* When using \`window.scrollY\`, guard with \`useEffect\` or \`typeof window \!== 'undefined'\` to avoid hydration mismatches.  
\- \*\*Touch Devices:\*\* Ensure touch target areas are at least \`44x44px\` on mobile screens.  
