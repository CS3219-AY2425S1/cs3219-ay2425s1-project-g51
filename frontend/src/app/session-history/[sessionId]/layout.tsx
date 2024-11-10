import AppHeader from '@/components/commons/AppHeader';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='h-screen overflow-hidden flex flex-col'>
      <AppHeader />
      <main className='flex-grow overflow-hidden'>{children}</main>
    </div>
  );
}