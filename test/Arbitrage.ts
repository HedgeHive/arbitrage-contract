import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { ethers, parseEther } from "ethers";
import { Address, AmountMode, Interaction, LimitOrder, LimitOrderContract, MakerTraits, TakerTraits } from "@1inch/limit-order-sdk";
import { Faucet, MockERC20 } from "../typechain-types";

const DERIVATIVE = {
  endTime: 1743148800,
  margin: 1000000000000000000n,
  oracleId: "0xAF5F031b8D5F12AD80d5E5f13C99249d82AfFfe2",
  params: [
    3000000000000000000000n,
    1000000000000000000n,
    0
  ],
  syntheticId: "0x61EFdF8c52b49A347E69dEe7A62e0921A3545cF7",
  token: "0xaab14767959b8b3a3710eee8f4124aad22faceaf"
}

const LONG_POSITION_ADDRESS = '0x41E8A5e340f8a1d040e945a0aAD9A1d33C00280A'
const SHORT_POSITION_ADDRESS = '0x38aA483477C943546C2F6D75710e232eCa46A722'

const WETH_ADDRESS = DERIVATIVE.token
const FAUCET_ADDRESS = '0xe848bb034CC9CBBe610Ed484F5b2593444df111e'

hre.tracer.nameTags[WETH_ADDRESS] = "WETH"

const DERIVATIVE_BYTES = (new ethers.AbiCoder()).encode(
  [
    "tuple(uint256 margin, uint256 endTime, uint256[] params, address oracleId, address token, address syntheticId)"
  ],
  [
    [
      DERIVATIVE.margin,
      DERIVATIVE.endTime,
      DERIVATIVE.params,
      DERIVATIVE.oracleId,
      DERIVATIVE.token,
      DERIVATIVE.syntheticId,
    ]
  ]
);

describe("Arbitrage", function () {
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, longer, shorter, arbitrageur] = await hre.ethers.getSigners();
    hre.tracer.nameTags[owner.address] = "Owner"
    hre.tracer.nameTags[longer.address] = "Longer"
    hre.tracer.nameTags[shorter.address] = "Shorter"
    hre.tracer.nameTags[arbitrageur.address] = "Arbitrageur"

    const Faucet = await hre.ethers.getContractFactory("Faucet");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const Arbitrage = await hre.ethers.getContractFactory("Arbitrage");

    const arbitrage = await Arbitrage.deploy();
    const faucet = await Faucet.attach(FAUCET_ADDRESS) as Faucet
    const weth = await MockERC20.attach(WETH_ADDRESS) as MockERC20

    await faucet.connect(longer).claim()
    await faucet.connect(shorter).claim()

    const chainId = hre.network.config.chainId!

    return {
      chainId,
      longer, shorter, arbitrageur,
      arbitrage, weth,
    };
  }

  describe("Contract", function () {
    it("Should work", async function () {
      const {
        chainId,
        longer, shorter, arbitrageur,
        arbitrage, weth
      } = await loadFixture(deploy);

      const longPremium = parseEther('0.02')
      const shortPremium = parseEther('0.01')
      const margin = parseEther('1')
      const quantity = parseEther('1')

      const now = ~~(Date.now() / 1000)
      const expiresIn = 120n // 2m
      const expiration = BigInt(now) + expiresIn
      const makerTraits = MakerTraits.default().withExpiration(expiration)

      const LOP = await arbitrage.LOP()

      /** LEFT ORDER: Buy option for premium */
      await weth.connect(longer).approve(LOP, longPremium)
      const leftOrder = new LimitOrder({
        makerAsset: new Address(weth.target as string),
        takerAsset: new Address(LONG_POSITION_ADDRESS),
        makingAmount: longPremium,
        takingAmount: quantity,
        maker: new Address(longer.address),
      }, makerTraits)
      const leftOrderTypedData = leftOrder.getTypedData(chainId)
      const leftOrderSignature = await longer.signTypedData(
        leftOrderTypedData.domain,
        { Order: leftOrderTypedData.types.Order },
        leftOrderTypedData.message
      )

      /** RIGHT ORDER: Sell option for premium */
      await weth.connect(shorter).approve(LOP, margin - shortPremium)
      const rightOrder = new LimitOrder({
        makerAsset: new Address(weth.target as string),
        takerAsset: new Address(SHORT_POSITION_ADDRESS),
        makingAmount: margin - shortPremium,
        takingAmount: quantity,
        maker: new Address(shorter.address),
      }, makerTraits)
      const rightOrderTypedData = rightOrder.getTypedData(chainId)
      const rightOrderSignature = await shorter.signTypedData(
        rightOrderTypedData.domain,
        { Order: rightOrderTypedData.types.Order },
        rightOrderTypedData.message
      )
      const rightOrderFillCalldata = LimitOrderContract.getFillOrderArgsCalldata(
        rightOrder.build(),
        rightOrderSignature,
        TakerTraits.default().setAmountMode(AmountMode.taker).setInteraction(
          new Interaction(
            new Address(arbitrage.target as string),
            '0xff' + DERIVATIVE_BYTES.slice(2)
          )
        ),
        quantity
      )

      const calldata = LimitOrderContract.getFillOrderArgsCalldata(
        leftOrder.build(),
        leftOrderSignature,
        TakerTraits.default().setAmountMode(AmountMode.taker).setInteraction(
          new Interaction(
            new Address(arbitrage.target as string),
            rightOrderFillCalldata
          )
        ),
        quantity
      )

      await arbitrage.connect(arbitrageur).create(calldata)

      console.log('Arbitrageur balance: ', await weth.balanceOf(arbitrageur.address))
    });
  });
});
