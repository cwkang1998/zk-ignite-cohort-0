import { Square } from './Square.js';
import { isReady, shutdown, Field, Mina, PrivateKey, AccountUpdate } from 'snarkyjs';

(async function main() {
  await isReady;
  
  console.log('SnarkyJS loaded');

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);

  const deployerAccount = Local.testAccounts[0].privateKey;

  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const contract = new Square(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({zkappKey: zkAppPrivateKey});
    contract.sign(zkAppPrivateKey);
  })
  await deployTxn.send();

  const num0 = contract.num.get();
  console.log('state after init:', num0.toString());

  // Update state
  const txn1 = await Mina.transaction(deployerAccount, () => {
    contract.update(Field(9));
    contract.sign(zkAppPrivateKey);
  })
  await txn1.send();

  const num1 = contract.num.get();
  console.log('state after txn1:', num1.toString());

  // Update state with failure
  try{
    const txn2 = await Mina.transaction(deployerAccount, () => {
      contract.update(Field(100));
      contract.sign(zkAppPrivateKey);
    })
    await txn2.send();
  }catch(err) {
    console.error(err);
  }

  const num2 = contract.num.get();
  console.log('state after txn2:', num2.toString());

  console.log('Shutting down');

  await shutdown();
})();