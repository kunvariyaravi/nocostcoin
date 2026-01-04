'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as BrowserWallet from '@/lib/wallet/browserWallet';

interface WalletContextType {
    wallet: BrowserWallet.Wallet | null;
    isConnected: boolean;
    isUnlocked: boolean;
    createWallet: (password: string) => Promise<{ wallet: BrowserWallet.Wallet; mnemonic: string }>;
    importWallet: (mnemonic: string, password: string) => Promise<BrowserWallet.Wallet>;
    unlockWallet: (password: string) => BrowserWallet.Wallet;
    lockWallet: () => void;
    disconnect: () => void;
    refreshWallet: () => void;
    exportMnemonic: (password: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [wallet, setWallet] = useState<BrowserWallet.Wallet | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Initialize wallet state on mount
    useEffect(() => {
        refreshWallet();

        // Check session periodically
        const interval = setInterval(() => {
            if (wallet && !BrowserWallet.isWalletUnlocked()) {
                // Session expired
                setWallet(null);
                setIsUnlocked(false);
            }
        }, 60000); // Check every minute

        // Refresh session on user activity
        const handleActivity = () => {
            if (wallet && BrowserWallet.isWalletUnlocked()) {
                BrowserWallet.refreshSession();
            }
        };

        // Listen for user activity
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, []);

    const refreshWallet = () => {
        const hasWallet = BrowserWallet.hasWallet();
        setIsConnected(hasWallet);

        if (hasWallet) {
            if (BrowserWallet.isWalletUnlocked()) {
                const unlockedWallet = BrowserWallet.getUnlockedWallet();
                setWallet(unlockedWallet);
                setIsUnlocked(true);
            } else {
                // Wallet exists but is locked
                const address = BrowserWallet.getWalletAddress();
                if (address) {
                    setWallet({
                        address,
                        publicKey: '', // Will be available when unlocked
                    });
                }
                setIsUnlocked(false);
            }
        } else {
            setWallet(null);
            setIsUnlocked(false);
        }
    };

    const createWallet = async (password: string) => {
        const result = await BrowserWallet.createWallet(password);
        setWallet(result.wallet);
        setIsConnected(true);
        setIsUnlocked(true);
        return result;
    };

    const importWallet = async (mnemonic: string, password: string) => {
        const wallet = await BrowserWallet.importWallet(mnemonic, password);
        setWallet(wallet);
        setIsConnected(true);
        setIsUnlocked(true);
        return wallet;
    };

    const unlockWallet = (password: string) => {
        const unlockedWallet = BrowserWallet.unlockWallet(password);
        setWallet(unlockedWallet);
        setIsUnlocked(true);
        return unlockedWallet;
    };

    const lockWallet = () => {
        BrowserWallet.lockWallet();
        const address = BrowserWallet.getWalletAddress();
        if (address) {
            setWallet({
                address,
                publicKey: '',
            });
        }
        setIsUnlocked(false);
    };

    const disconnect = () => {
        BrowserWallet.deleteWallet();
        setWallet(null);
        setIsConnected(false);
        setIsUnlocked(false);
    };

    const exportMnemonic = (password: string) => {
        return BrowserWallet.exportMnemonic(password);
    };

    return (
        <WalletContext.Provider
            value={{
                wallet,
                isConnected,
                isUnlocked,
                createWallet,
                importWallet,
                unlockWallet,
                lockWallet,
                disconnect,
                refreshWallet,
                exportMnemonic,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
