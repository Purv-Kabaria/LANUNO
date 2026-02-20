const os = require('os');
const nets = os.networkInterfaces();
console.log("All interfaces:");
for (const name of Object.keys(nets)) {
  const net = nets[name];
  console.log(`\nInterface: ${name}`);
  for (const iface of net) {
    console.log(`  Family: ${iface.family} Internal: ${iface.internal} Address: ${iface.address}`);
  }
}

let host = "localhost";
for (const name of Object.keys(nets)) {
  const net = nets[name];
  if (!net) continue;
  for (const iface of net) {
    if (iface.family === "IPv4" && !iface.internal) {
      host = iface.address;
      console.log(`\nSelected host: ${host} (from interface: ${name})`);
      break;
    }
  }
  if (host !== "localhost") break;
}
