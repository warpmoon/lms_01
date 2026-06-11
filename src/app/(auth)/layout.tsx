export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* 인증 페이지 전역 레이아웃 (배경, 특정 폰트 등) */}
      {children}
    </div>
  );
}
