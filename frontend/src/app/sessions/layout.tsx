import AppHeader from '@/components/commons/AppHeader';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}