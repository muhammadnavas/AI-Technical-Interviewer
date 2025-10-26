export default function AIAvatar3D({ className = '', isThinking = false }) {
  const stroke = isThinking ? '#f59e0b' : '#6366f1'
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="3.2" stroke={stroke} strokeWidth="1.5" />
      <path d="M5.5 19c0-2.8 3.6-5 6.5-5s6.5 2.2 6.5 5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}