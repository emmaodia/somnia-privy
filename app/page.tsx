'use client';

import {
  usePrivy,
  useCrossAppAccounts,
  useWallets,
  useSendTransaction,
} from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { createPublicClient, http, formatEther } from 'viem';
import { somniaTestnet } from 'viem/chains';

export default function Home() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { loginWithCrossAppAccount, sendTransaction } = useCrossAppAccounts();
  // const { sendTransaction } = useSendTransaction();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('');

  const providerAppId = 'cm8d9yzp2013kkr612h8ymoq8';

  const client = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  const startCrossAppLogin = async () => {
    try {
      setLoginError(null);
      const result = await loginWithCrossAppAccount({
        appId: providerAppId,
      });
      console.log(
        'Logged in via global wallet:',
        result,
        result.wallet?.address
      );
    } catch (err) {
      console.warn('Cross-app login failed:', err);
      setLoginError('Failed to log in with Global Wallet.');
    }
  };

  useEffect(() => {
    if (authenticated) {
      const globalWallet = user?.linkedAccounts?.find(
        (account) =>
          account.type === 'cross_app' &&
          account.providerApp?.id === providerAppId
      );

      console.log(globalWallet);
      const wallet = globalWallet?.embeddedWallets?.[0].address;
      console.log(wallet);
      setWalletAddress(wallet);
      if (wallet) {
        setWalletAddress(wallet);
        setHydrated(true);
        fetchBalance(wallet);
        console.log(wallet);
      } else if (user?.wallet?.address) {
        setWalletAddress(user.wallet.address);
        setHydrated(true);
        console.log(user?.wallet?.address);
        fetchBalance(user.wallet.address);
      } else {
        setHydrated(true);
      }
    }
  }, [authenticated, user]);

  const fetchBalance = async (address: string) => {
    try {
      const result = await client.getBalance({
        address: address as `0x${string}`,
      });
      const formatted = parseFloat(formatEther(result)).toFixed(3);
      setBalance(formatted);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const sendSTT = async () => {
    if (!walletAddress) return;
    console.log(walletAddress);

    const txn = {
      to: '0xb6e4fa6ff2873480590c68D9Aa991e5BB14Dbf03',
      value: 1000000000000000,
      chainId: 50312,
    };
    try {
      const tx = await sendTransaction(txn, { address: walletAddress });
      console.log('TX Sent:', tx);
      if (walletAddress) fetchBalance(walletAddress);
    } catch (err) {
      console.error('TX Failed:', err);
    }
  };

  return (
    <div className='grid min-h-screen items-center justify-items-center p-8 sm:p-20'>
      <main className='flex flex-col gap-6 row-start-2 items-center'>
        {!ready ? (
          <p>Loading...</p>
        ) : !authenticated ? (
          <>
            <button
              onClick={startCrossAppLogin}
              className='bg-purple-600 text-white px-4 py-2 rounded'
            >
              Login with Global Wallet
            </button>
            {loginError && <p className='text-red-500 text-sm'>{loginError}</p>}
          </>
        ) : hydrated ? (
          <div className='space-y-4 text-center'>
            {walletAddress ? (
              <p>Connected as: {walletAddress}</p>
            ) : (
              <p className='text-gray-600'>No wallet address found.</p>
            )}
            <p>Balance: {balance ? `${balance} STT` : 'Loading...'} </p>
            <button
              onClick={sendSTT}
              className='bg-blue-600 text-white px-4 py-2 rounded'
            >
              Send 0.001 STT
            </button>
            <button
              onClick={logout}
              className='bg-red-600 text-white px-4 py-2 rounded'
            >
              Logout
            </button>
          </div>
        ) : (
          <p>🔄 Logging in... Please wait</p>
        )}
      </main>
    </div>
  );
}
