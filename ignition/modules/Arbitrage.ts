import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArbitrageModule = buildModule("ArbitrageModule", (m) => {
  const lock = m.contract("Arbitrage", []);

  return { lock };
});

export default ArbitrageModule;
