import { PhantomProvider } from "./types";

/**
 * Retrieves the Phantom Provider from the window object
 * @returns {PhantomProvider | undefined} a Phantom provider if one exists in the window
 */
const getProvider = (): PhantomProvider | undefined => {
  if (typeof window !== 'undefined' && "phantom" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.phantom?.solana;

    if (provider?.isPhantom) {
      return provider;
    }
  }

  if (typeof window !== 'undefined') {
    window.open("https://phantom.app/", "_blank");
  }
};
export default getProvider;
