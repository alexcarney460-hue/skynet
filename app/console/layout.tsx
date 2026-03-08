import WalletProvider from '@/app/components/WalletProvider';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
