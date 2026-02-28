import { getAPIBaseURL } from '@/lib/config';

interface Props {
  label?: string;
  className?: string;
}

export default function GoogleSignInButton({ label = 'Continue with Google', className = '' }: Props) {
  const handleGoogleSignIn = () => {
    const apiBase = getAPIBaseURL();
    window.location.href = `${apiBase}/api/v1/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className={`w-full flex items-center justify-center gap-3 h-11 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 transition-all hover:shadow-md active:scale-[0.98] ${className}`}
    >
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.3 13.9 17.7 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.9-9.9 6.9-16.9z"/>
        <path fill="#FBBC05" d="M10.7 28.4c-.5-1.5-.8-3-.8-4.4s.3-2.9.8-4.4l-7-5.4C2.1 17 1 20.4 1 24s1.1 7 3.7 9.8l7-5.4z"/>
        <path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2.1-6.3 2.1-6.3 0-11.7-4.4-13.3-10.3l-7 5.4C7 41.3 14.8 47 24 47z"/>
        <path fill="none" d="M1 1h46v46H1z"/>
      </svg>
      <span>{label}</span>
    </button>
  );
}
