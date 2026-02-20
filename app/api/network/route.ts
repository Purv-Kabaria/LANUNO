import { NextResponse } from "next/server";
import { networkInterfaces } from "node:os";

export const dynamic = "force-dynamic";

export async function GET() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const nets = networkInterfaces();

  const addresses: { address: string; name: string }[] = [];

  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (!net) continue;
    for (const iface of net) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ address: iface.address, name: name.toLowerCase() });
      }
    }
  }

  // Sort addresses to find the most likely LAN IP
  // 1. Prefer Wi-Fi or Ethernet interfaces
  // 2. Prefer common LAN IP ranges
  // 3. Avoid virtual interfaces (WSL, VirtualBox, VMWare)

  const sortedAddresses = addresses.sort((a, b) => {
    const isAPhysical = a.name.includes("wi-fi") || a.name.includes("wlan") || a.name.includes("ethernet") || a.name.includes("en0") || a.name.includes("eth0");
    const isBPhysical = b.name.includes("wi-fi") || b.name.includes("wlan") || b.name.includes("ethernet") || b.name.includes("en0") || b.name.includes("eth0");

    if (isAPhysical && !isBPhysical) return -1;
    if (!isAPhysical && isBPhysical) return 1;

    const isAVirtual = a.name.includes("vbox") || a.name.includes("virtual") || a.name.includes("wsl") || a.name.includes("docker") || a.name.includes("vmnic") || a.name.includes("veth");
    const isBVirtual = b.name.includes("vbox") || b.name.includes("virtual") || b.name.includes("wsl") || b.name.includes("docker") || b.name.includes("vmnic") || b.name.includes("veth");

    if (isAVirtual && !isBVirtual) return 1;
    if (!isAVirtual && isBVirtual) return -1;

    // Finally check for common LAN prefixes (192.168, 10., 172.)
    const isALan = a.address.startsWith("192.168.") || a.address.startsWith("10.") || a.address.startsWith("172.");
    const isBLan = b.address.startsWith("192.168.") || b.address.startsWith("10.") || b.address.startsWith("172.");

    if (isALan && !isBLan) return -1;
    if (!isALan && isBLan) return 1;

    return 0;
  });

  const host = sortedAddresses.length > 0 ? sortedAddresses[0].address : "localhost";
  const baseUrl = `http://${host}:${port}`;

  return NextResponse.json({
    baseUrl,
    host,
    port,
    availableAddresses: addresses
  });
}
