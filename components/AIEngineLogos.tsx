'use client';

// Compact, brand-colored badges for the AI engines we monitor.
// Inline SVG/text to avoid external asset dependencies.

type EngineProps = {
  size?: number;
};

export function ChatGPTLogo({ size = 16 }: EngineProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#10A37F" />
      <path d="M16.5 9.5c.1-.4.2-.8.2-1.2 0-2.4-2-4.3-4.3-4.3-1.4 0-2.7.7-3.5 1.8-.3-.1-.6-.1-.9-.1C5.6 5.7 4 7.3 4 9.3c0 .4.1.8.2 1.2-1 .8-1.6 2-1.6 3.3 0 2.4 2 4.3 4.3 4.3.3 0 .6 0 .9-.1.8 1.1 2.1 1.8 3.5 1.8 2.4 0 4.3-2 4.3-4.3 0-.4-.1-.8-.2-1.2 1-.8 1.6-2 1.6-3.3 0-1.3-.6-2.5-1.6-3.3z" fill="#fff" opacity=".95" transform="translate(.5 0)"/>
    </svg>
  );
}

export function PerplexityLogo({ size = 16 }: EngineProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#20808D" />
      <path d="M7 5v14M17 5v14M12 5v14M5 9h14M5 15h14" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function GeminiLogo({ size = 16 }: EngineProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#g-gem)" />
      <path d="M12 4l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8z" fill="#fff" />
    </svg>
  );
}

export function GoogleAILogo({ size = 16 }: EngineProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path d="M12 6c1.4 0 2.7.5 3.6 1.4l1.6-1.6C15.7 4.4 14 3.6 12 3.6c-3.2 0-6 1.9-7.4 4.6l1.9 1.5C7.5 7.5 9.6 6 12 6z" fill="#EA4335" />
      <path d="M20 12.2c0-.6 0-1.2-.1-1.8H12v3.4h4.5c-.2 1-.8 1.9-1.7 2.5l1.9 1.4c1.8-1.6 2.8-3.9 2.8-6.5z" fill="#4285F4" />
      <path d="M6.5 13.6c-.3-.8-.4-1.6-.4-2.4s.1-1.6.4-2.4L4.6 7.3C3.6 8.7 3 10.3 3 12s.6 3.3 1.6 4.7l1.9-1.5c-.3-.5-.5-1-.5-1.6z" fill="#FBBC05" />
      <path d="M12 20.4c2 0 3.7-.7 5-1.9l-1.9-1.4c-.7.4-1.6.7-3.1.7-2.4 0-4.5-1.5-5.5-3.7l-1.9 1.5C6 18.5 8.8 20.4 12 20.4z" fill="#34A853" />
    </svg>
  );
}

export function ClaudeLogo({ size = 16 }: EngineProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#CC785C" />
      <path d="M9 7.5l-2.8 9h2l.7-2.2h3.5l.7 2.2h2l-2.9-9H9zm.3 5.4l1.2-3.8 1.2 3.8h-2.4z" fill="#fff" />
      <path d="M15.5 7.5h-1.8l3 9h1.8l-3-9z" fill="#fff" opacity=".7" />
    </svg>
  );
}

export const AI_ENGINES = [
  { name: 'ChatGPT', Logo: ChatGPTLogo, status: 'simulated' as const, sub: 'gpt-4o-mini roleplay' },
  { name: 'Perplexity', Logo: PerplexityLogo, status: 'tracked' as const, sub: 'via Nimble SERP' },
  { name: 'Gemini', Logo: GeminiLogo, status: 'tracked' as const, sub: 'via Nimble SERP' },
  { name: 'Google AIO', Logo: GoogleAILogo, status: 'tracked' as const, sub: 'via Nimble SERP' },
  { name: 'Claude.ai', Logo: ClaudeLogo, status: 'tracked' as const, sub: 'via Nimble SERP' },
];
