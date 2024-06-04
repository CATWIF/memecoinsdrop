import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

document.getElementById('connectButton').addEventListener('click', async () => {
  try {
    // Sol·licita permís a l'usuari per accedir a la seva bitlletera Polkadot
    console.log('Sol·licitant permís per accedir a la bitlletera Polkadot...');
    const extensions = await web3Enable('STINK DROP');

    if (extensions.length === 0) {
      // No hi ha extensions disponibles (o l'usuari no ha donat permís)
      console.log('L\'usuari no ha donat permís per accedir a la bitlletera.');
      alert('No s\'ha trobat cap extensió de Polkadot o l\'usuari no ha donat permís.');
      return;
    }

    console.log('Extensions disponibles:', extensions);

    // Obtenim els comptes disponibles
    const accounts = await web3Accounts();

    if (accounts.length === 0) {
      console.log('No hi ha comptes disponibles a la bitlletera.');
      alert('No s\'han trobat comptes disponibles a la bitlletera.');
    } else {
      console.log('Comptes disponibles:', accounts);
      // Fes alguna cosa amb els comptes obtinguts, com per exemple mostrar l'adreça a la web
      document.getElementById('connectButton').innerText = `Connectat com ${accounts[0].address}`;

      // Crida a la funció principal per obtenir el saldo
      await main(accounts[0].address);
    }
  } catch (error) {
    console.error('Error durant la connexió amb la bitlletera:', error);
    alert('Hi ha hagut un error durant la connexió amb la bitlletera. Comprova la consola per més detalls.');
  }
});

async function main(accountAddress) {
  try {
    // Connecta amb la xarxa Polkadot
    console.log('Connectant amb la xarxa Polkadot...');
    const provider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({ provider });

    // Obtenim el saldo d'un compte
    console.log(`Obtenint el saldo per a l'adreça: ${accountAddress}...`);
    const { data: balance } = await api.query.system.account(accountAddress);

    console.log(`Saldo del compte: ${balance.free.toHuman()}`);
  } catch (error) {
    console.error('Error durant l\'obtenció del saldo:', error);
    alert('Hi ha hagut un error durant l\'obtenció del saldo. Comprova la consola per més detalls.');
  }
}
