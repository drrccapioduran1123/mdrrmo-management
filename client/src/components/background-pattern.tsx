export function BackgroundPattern() {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.1,
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(121, 101, 193, 0.2) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(243, 0, 89, 0.2) 0%, transparent 20%),
            repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(121, 101, 193, 0.1) 30px, rgba(121, 101, 193, 0.1) 60px)
          `,
        }}
        data-testid="background-pattern"
      />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 2 + "px",
              height: Math.random() * 6 + 2 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              background: "rgba(250, 204, 21, 0.3)",
              animation: `particle-float ${15 + Math.random() * 10}s infinite linear`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes particle-float {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(100px); opacity: 0; }
        }
      `}</style>
    </>
  );
}
