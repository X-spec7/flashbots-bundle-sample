const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");
const { Wallet, JsonRpcProvider } = require("ethers");
const ethers = require("ethers");

const INFURA_API_KEY = "5add93bca5874c798ed710e830b2ac12";
const provider = new JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
const wallet = new Wallet(
  "primary key",
  provider
);
const start = async () => {

  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    wallet,
    "https://relay-sepolia.flashbots.net",
  );

  const gwei = ethers.parseUnits("1", "gwei");
  const LEGACY_GAS_PRICE = gwei * 40n;
  const PRIORITY_FEE = gwei * 100n;
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);

  const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 6);

  const amountInEther = '0.001';

  let signedTransactions;
  try {
    console.log("Signing bundle...");

    signedTransactions = await flashbotsProvider.signBundle([
      {
        signer: wallet,
        transaction: {
          to: '0x7fBD498D82adfc908634Dc656685BEA71690A361',
          type: 2,
          maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
          maxPriorityFeePerGas: PRIORITY_FEE,
          data: '0x',
          chainId: 11155111,
          value: ethers.parseEther(amountInEther),
        }
      },
      {
        signer: wallet,
        transaction: {
          to: '0x7fBD498D82adfc908634Dc656685BEA71690A361',
          gasPrice: LEGACY_GAS_PRICE,
          chainId: 11155111,
          data: '0x',
          value: ethers.parseEther(amountInEther),
        }
      },
    ]);
  } catch (error) {
    console.log("Error signing bundle: ", error);
    return;
  }

  console.log(new Date());
  console.log('Starting to run the simulation...');

  let simulation;
  try {
    console.log("Simulating bundle...");
    simulation = await flashbotsProvider.simulate(
      signedTransactions,
      blockNumber + 1,
    );
  } catch (error) {
    console.log("Error simulating bundle: ", error);
    return;
  }

  console.log(new Date());

  if ("error" in simulation) {
    return console.log(`Simulation Error: ${simulation.error.message}`);
  } else {
    console.log("simulation succeeded,");
  }

  for (var i = 1; i <= 10; i++) {
    const bundleSubmission = flashbotsProvider.sendRawBundle(
      signedTransactions,
      blockNumber + i,
    );
    console.log("submitted for block # ", blockNumber + i);
  }
  console.log("bundles submitted");
}

start();
