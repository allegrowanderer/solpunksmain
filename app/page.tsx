"use client";

import { useState, useEffect } from "react";
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, BN, Idl } from "@project-serum/anchor";
import Image from "next/image";
import Link from "next/link";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { supabase } from "../lib/supabaseClient";
import idl from "../idl/idl.json"; // Ensure the correct path

const programID = new PublicKey("AdtugN1JEE4esw19izQHVMGWvamDJs3oMHtjFwrcyBMD");

const recipient = "9u92hBMxYgcGNi1JYSbRsuEM1CsLVW48G7jKG6rRhXr8";
const rpcEndpoint =
  "https://mainnet.helius-rpc.com/?api-key=42734956-df14-4915-8bfe-56c62a20cd04";

export default function Home() {
  const { publicKey, signTransaction, sendTransaction }: WalletContextState =
    useWallet();
  const [amount, setAmount] = useState("");
  const [buyNowMessage, setBuyNowMessage] = useState<string>("");
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [balance, setBalance] = useState(0);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const connection = new Connection(rpcEndpoint, "confirmed");
      const pubKey = new PublicKey(recipient);
      const balance = await connection.getBalance(pubKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      setProgress((solBalance / 1000) * 100); // Update goal to 1000 SOL
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwitterUsername(e.target.value);
  };

  const handleUsernameSubmit = async () => {
    if (!hasFollowed || !hasPosted) {
      setSubmitMessage("Please complete the given Twitter tasks.");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }

    if (!twitterUsername) {
      setSubmitMessage("Please enter a Twitter username");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }

    if (!publicKey) {
      setSubmitMessage("Please connect your wallet first");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }

    const { data: existingData, error: existingError } = await supabase
      .from("twitter_usernames")
      .select("*")
      .eq("wallet_address", publicKey.toString());

    if (existingError) {
      console.error("Failed to fetch existing data:", existingError);
      setSubmitMessage("Failed to fetch existing data");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }

    if (existingData && existingData.length > 0) {
      setSubmitMessage("You already submitted your wallet address.");
      setTimeout(() => setSubmitMessage(""), 3000);
      return;
    }

    const { data, error } = await supabase
      .from("twitter_usernames")
      .insert([
        { username: twitterUsername, wallet_address: publicKey.toString() },
      ]);

    if (error) {
      console.error("Failed to save username:", error);
      setSubmitMessage("Failed to save username");
      setTimeout(() => setSubmitMessage(""), 3000);
    } else {
      setSubmitMessage("Username and wallet address saved successfully");
      setTimeout(() => setSubmitMessage(""), 3000);
      setTwitterUsername("");
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setBuyNowMessage("Please enter a valid amount");
      setTimeout(() => setBuyNowMessage(""), 3000);
      return;
    }

    if (!publicKey) {
      setBuyNowMessage("Please connect your wallet first.");
      setTimeout(() => setBuyNowMessage(""), 3000);
      return;
    }

    if (!window.solana || !window.solana.isPhantom) {
      setBuyNowMessage("Please use Phantom Wallet to proceed.");
      setTimeout(() => setBuyNowMessage(""), 3000);
      return;
    }

    try {
      const connection = new Connection(rpcEndpoint, "confirmed");
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;

      const { signature } = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "confirmed");

      setBuyNowMessage(`Transaction successful: ${signature}`);
      fetchBalance();
    } catch (error) {
      if (error instanceof Error) {
        setBuyNowMessage(`Transaction failed: ${error.message}`);
      } else {
        setBuyNowMessage("Transaction failed: An unknown error occurred.");
      }
    }
    setTimeout(() => setBuyNowMessage(""), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recipient).then(
      () => {
        setCopySuccess("Address copied to clipboard!");
        setTimeout(() => setCopySuccess(""), 2000);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      }
    );
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/runesbg.png')", backgroundSize: "40%" }}
    >
      {copySuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded z-50">
          {copySuccess}
        </div>
      )}
      {submitMessage && (
        <div
          className={`fixed top-4 right-4 ${
            submitMessage.includes("saved successfully")
              ? "bg-green-500"
              : "bg-red-500"
          } text-white p-2 rounded z-50`}
        >
          {submitMessage}
        </div>
      )}
      {buyNowMessage && (
        <div
          className={`fixed top-4 right-4 ${
            buyNowMessage.includes("successful") ? "bg-green-500" : "bg-red-500"
          } text-white p-2 rounded z-50`}
        >
          {buyNowMessage}
        </div>
      )}
      <header className="flex justify-between items-center p-2 lg:p-4 bg-teal-500 border-b-4 border-black">
        <div className="flex items-center">
          <Link href="https://solpunks.io">
            <Image
              src="/solpunkscoin.png"
              alt="SolPunks Logo"
              width={125}
              height={125}
              className="rounded-full cursor-pointer"
            />
          </Link>
          <h1
            className="ml-4 text-3xl font-runes text-black"
            style={{ fontSize: "300%" }}
          ></h1>
        </div>
        <div className="hidden lg:flex items-center space-x-12">
          <a href="#about" className="text-black font-runes text-7xl">
            ABOUT
          </a>
          <a href="#how-to-buy" className="text-black font-runes text-7xl">
            HOW TO BUY
          </a>
        </div>
        <div className="flex items-center space-x-4 lg:hidden">
          <button onClick={toggleMenu} className="text-black">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="https://twitter.com/RunesPunks"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/twitter.png"
              alt="Twitter"
              width={45}
              height={45}
              className="cursor-pointer"
            />
          </Link>
          <Link
            href="https://t.me/SolPunksOfficialTelegramChannel"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/telegram.png"
              alt="Telegram"
              width={45}
              height={45}
              className="cursor-pointer"
            />
          </Link>
          <WalletMultiButton className="wallet-adapter-button bg-purple-500 font-runes" />
        </div>
      </header>

      {isMenuOpen && (
        <div className="lg:hidden bg-teal-500 text-black font-runes flex flex-col items-center space-y-4 py-4">
          <a href="#about" className="text-6xl" onClick={toggleMenu}>
            ABOUT
          </a>
          <a href="#how-to-buy" className="text-6xl" onClick={toggleMenu}>
            HOW TO BUY
          </a>
        </div>
      )}

      <main className="flex flex-col lg:flex-row items-start justify-center flex-grow p-4 text-white">
        <div className="w-full max-w-md bg-teal-500 text-black rounded-lg shadow-md p-8 space-y-4 mt-0 lg:mt-10 border-4 border-black">
          <h2
            className="text-2xl font-bold text-center font-runes mb-4 "
            style={{ fontSize: "300%", marginTop: "23px" }}
          >
            PRESALE IS LIVE!
          </h2>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount in SOL"
            className="px-4 py-2 border-black border-2 rounded-md w-full bg-purple-600 text-white text-center"
          />
          <div className="flex justify-center">
            <button
              onClick={handleTransaction}
              className="px-4 py-2 bg-purple-700 text-white rounded-full w-2/5 font-runes"
              style={{ fontSize: "150%" }}
            >
              BUY NOW
            </button>
          </div>
          <div className="mt-4 progress-container relative">
            <div className="h-8 w-full bg-gray-200 border-black border-4">
              <div
                className="h-full bg-[#9333EA]"
                style={{ width: `${progress}%` }}
              ></div>
              <p
                className="absolute inset-0 flex items-center justify-center font-runes text-[#000000] mb-2"
                style={{ top: "25%", fontSize: "120%" }}
              >
                RAISED OF 1000 SOL GOAL
              </p>
            </div>
          </div>
          <p className="text-center mt-6 font-runes" style={{ fontSize: "120%" }}>
            {balance} SOL RAISED
          </p>
          <div className="mt-4 text-center text-xs">
            <p className="font-runes text-2xl">
              IF YOU HAVE PROBLEMS CONNECTING YOUR WALLET, SEND SOL TO:
            </p>
            <p
              className="font-bold bg-teal-500 text-purple-700 text-xl py-1 cursor-pointer break-all"
              style={{ fontSize: "110%" }}
              onClick={copyToClipboard}
            >
              9u92hBMxYgcGNi1JYSbRsuEM1CsLVW48G7jKG6rRhXr8
            </p>
            <p className="font-runes" style={{ fontSize: "150%" }}>
              AND TOKENS WILL BE AIRDROPPED TO THE SENDING WALLET.
            </p>
            <p className="font-runes" style={{ fontSize: "150%" }}>
              NB: DON’T USE A CEX TO SEND SOL. USE YOUR OWN WALLET.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center lg:ml-[5cm] mt-0 lg:mt-10 relative">
          <div className="w-full max-w-md bg-teal-500 text-black rounded-lg shadow-md p-7 space-y-4 border-4 border-black relative">
            <div className="absolute top-0 left-0 flex items-center mt-2 ml-2"></div>
            <h2
              className="text-5xl font-bold text-center font-runes mt-12"
              style={{ fontSize: "300%" }}
            >
              JOIN NOW
            </h2>
            <p
              className="text-center font-runes"
              style={{
                fontSize: "118%",
                marginTop: "30px",
                marginBottom: "35px",
              }}
            >
              10% OF PUNK’S TOTAL SUPPLY WILL BE AIRDROPPED FOR FREE TO EVENT
              PARTICIPANTS. TO JOIN THE AIRDROP, COMPLETE THE TWO SPECIFIED
              TASKS. TOKENS WILL BE SENT TO YOUR WALLET AFTER THE PRESALE
              CONCLUDES.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-runes text-xl">Step 1:</span>
              <button
                onClick={() => {
                  window.open("https://x.com/RunesPunks", "_blank");
                  setHasFollowed(true);
                }}
                className="px-4 py-2 bg-[#000000] text-white rounded-full w-3/5 font-runes"
                style={{ fontSize: "130%" }}
              >
                Follow @RunesPunks
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="font-runes text-xl">Step 2:</span>
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      "Missed $BORPA? Don't Miss $PUNK!\n\nSolPunks Pre-sale has started 🚀🚀🚀Whales Discover This New SOL Coin! 1000%x 📈📈📈\n\nPresale Link: https://solpunks.io\n\n#Solana #SolPunks #Airdrop"
                    )}`,
                    "_blank"
                  );
                  setHasPosted(true);
                }}
                className="px-4 py-2 bg-[#000000] text-white rounded-full w-3/5 font-runes"
                style={{ fontSize: "130%" }}
              >
                Post on Twitter
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="font-runes text-xl">Step 3:</span>
              <input
                type="text"
                value={twitterUsername}
                onChange={handleUsernameChange}
                placeholder="Submit your Twitter username"
                className="px-4 py-2 border-black border-2 rounded-md w-3/5 bg-purple-600 text-white"
              />
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                onClick={handleUsernameSubmit}
                className="px-2 py-1 bg-[#000000] text-white rounded-full w-1/3 ml-4 font-runes"
                style={{ fontSize: "130%" }}
              >
                Submit
              </button>
            </div>
            <Image
              src="/solpunksborder.png"
              alt="SolPunks Photo"
              width={145}
              height={145}
              className="absolute top-[-35px] right-[-28px]"
            />
          </div>
        </div>
      </main>

      {/* Duplicate Section */}
      <main className="flex flex-col items-center justify-center flex-grow p-4 text-white">
        <div
          id="about"
          className="w-full max-w-4xl bg-teal-500 text-black rounded-lg shadow-md p-8 space-y-4 mt-10 border-4 border-black"
        >
          <h2
            className="text-2xl font-bold text-center font-runes"
            style={{ fontSize: "230%" }}
          >
            WHAT IS{" "}
            <span className="text-[#9333EA]" style={{ fontSize: "130%" }}>
              $PUNK
            </span>
            ?
          </h2>
          <p className="text-xl font-runes">
            $PUNK is first token for SolPunks! $PUNK is a playful and
            community-driven token. We believe in the collective strength and
            creativity of our members to drive the project forward. Our token is
            not just about financial opportunity but also about embracing the
            fun and irreverence that memecoins bring to the cryptocurrency
            landscape. Offering thrill-seeking investors a wild ride! Join the
            PUNK community to grow and leave your worries behind. The total
            supply of $PUNK tokens is 250 million. With 10% allocated for
            marketing, 50% for liquidity pools (LP), and 40% for airdrops.
            Participate in the $PUNK Presale and watch your investment grow!
          </p>
        </div>
        <div
          id="how-to-buy"
          className="w-full max-w-4xl bg-teal-500 text-black rounded-lg shadow-md p-8 space-y-4 mt-10 border-4 border-black"
        >
          <h2
            className="text-2xl font-bold text-center font-runes"
            style={{ fontSize: "230%" }}
          >
            HOW TO BUY{" "}
            <span className="text-[#9333EA]" style={{ fontSize: "130%" }}>
              $PUNK
            </span>
            ?
          </h2>
          <p className="text-xl font-runes">
            1. CLICK ON THE “BUY NOW” BUTTON ABOVE.
            <br />
            <br />
            2. ENTER THE AMOUNT OF SOL TO SWAP FOR $PUNK.
            <br />
            <br />
            3. CLICK ‘BUY NOW’ AGAIN AND CONFIRM THE TRANSACTION.
            <br />
            <br />* IF YOU CAN’T CONNECT YOUR WALLET, SEND SOL TO{" "}
            <span
              onClick={copyToClipboard}
              className="cursor-pointer text-blue-500 underline"
            >
              CONTRACT ADDRESS
            </span>
            . TOKENS WILL BE AIRDROPPED TO THE SENDING WALLET.
            <br />
            <br />
          </p>
          <p
            className="text-xl font-runes text-center text-[#9333EA]"
            style={{ fontSize: "170%" }}
          >
            NB: DON’T USE A CEX TO SEND SOL! USE YOUR OWN WALLET.
          </p>
        </div>
      </main>

      <footer className="p-4 bg-teal-500 text-center">
        <p className="text-sm font-runes">
          &copy; 2024 SolPunks on Solana. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
