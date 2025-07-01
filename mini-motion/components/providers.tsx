import { ImageKitProvider } from "@imagekit/next";
import { SessionProvider } from "next-auth/react";
import React from "react";
function Providers({ children }: { children: React.ReactNode }) {
  const URL_ENDPOINT = process.env.NEXT_PUBLIC_URL_ENDPOINT;
  return (
    <SessionProvider refetchInterval={5 * 6}>
      <ImageKitProvider urlEndpoint={URL_ENDPOINT}>{children}</ImageKitProvider>
    </SessionProvider>
  );
}

export default Providers;
