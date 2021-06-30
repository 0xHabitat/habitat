import {
  getSigner,
  wrapListener,
  renderAmount,
  walletIsConnected,
  getConfig,
  getToken,
  ethers
} from './utils.js';
import {
  getUsername,
  getProviders,
  getGasTank,
  onChainUpdate
} from './rollup.js';

import './HabitatColorToggle.js';

const { HBT } = getConfig();

const NAV_TEMPLATE =
`
<style>
.sidebar {
  display: flex;
  max-width: max-content;
  flex-direction: column;
  place-items: center;
  border-radius: 2em 0 2em 0;
  box-shadow: 4px 4px 20px rgba(0,0,0,.4);
  padding-bottom: 2em;
  overflow: hidden;
  padding: 0;
  margin: 2em auto;
  background-color: var(--color-bg-yellow);
}
.sidebar button,
.sidebar .button {
  width: 100%;
}
#top {
  background-color: var(--color-bg);
  border-radius: 0 0 2em 0;
  padding: 1em;
}
#balances {
  width: 100%;
}
.bl {
  text-align: center;
  font-size: .7em;
  border: 1px solid;
  border-radius: 1em;
  padding: .5em;
  background-color: var(--color-bg);
}
</style>
<div class='sidebar'>
  <div id='top'>
    <div class='flex col center around'>
      <div class='flex col'>
        <object type='image/svg+xml' style='height:2em;' data='/lib/assets/v2-logo-full.svg'></object>
      </div>
      <space></space>
      <div id='walletbox' class='flex col'>
        <a href='' id='connect' class='noHover' style='border:none;font-size:1.2em;'>Connect</a>
        <p id='status' class='smaller'></p>
      </div>
    </div>
    <space></space>
    <div class='flex col evenly'>
      <div class='no-max-width' style='display:grid;'>
        <a class='button black' href='#habitat-communities'>Communities</a>
        <a class='button' target='_blank' href='/evolution/'>Evolution</a>
        <a class='button' target='_blank' href='/explorer/'>Block Explorer</a>
        <button id='add747' style='' class='purple smaller noHover'>Add HBT to MetaMask</button>
      </div>
      <space></space>
    </div>
  </div>

  <div id='balances' class='flex col evenly'>
    <space></space>
    <div class='no-max-width' style='display:grid;width:calc(100% - 1em);'>
      <div>
        <p>♢ Mainnet</p>
        <space></space>
        <p id='mainnetBalance' class='bl'>0 HBT</p>
      </div>
      <space></space>
      <div>
        <p>🏕 Rollup</p>
        <space></space>
        <p id='rollupBalance' class='bl'>0 HBT</p>
      </div>
      <space></space>
      <div class='left'>
        <p>⛽️ Gas</p>
        <space></space>
        <p id='gasTankBalance' class='bl'>0 HBT</p>
      </div>
    </div>
    <space></space>
    <habitat-color-toggle style='position:relative;padding-bottom:1.5em;transform:none;'></habitat-color-toggle>
  </div>
</div>`;

class HabitatSidebar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback () {
    this.innerHTML = NAV_TEMPLATE;
    this._walletContainer = this.querySelector('#walletbox');

    wrapListener(this.querySelector('a#connect'), async () => {
      await getSigner();
      this.update();
      window.location.hash = '#habitat-account';
    });

    wrapListener(
      this.querySelector('#add747'),
      async () => {
        // EIP-747
        const signer = await getSigner();
        await signer.provider.send(
          'metamask_watchAsset',
          {
            type: 'ERC20',
            options: {
              address: HBT,
              symbol: 'HBT',
              decimals: 10,
              image: `${window.location.origin}/lib/assets/logo.png`,
            }
          }
        );
      }
    );

    this.update();
  }

  async update () {
    onChainUpdate(this.update.bind(this));

    if (!this.isConnected) {
      return;
    }

    if (!walletIsConnected()) {
      return;
    }

    const signer = await getSigner();
    const account = await signer.getAddress();
    const center = this._walletContainer.querySelector('#connect');
    const walletStatus = this._walletContainer.querySelector('#status');

    walletStatus.textContent = '🙌 Connected';

    center.textContent = await getUsername(account);
    this._walletContainer.classList.add('connected');

    const token = await getToken(HBT);
    const { habitat } = await getProviders();
    {
      const value = await token.balanceOf(account);
      this.querySelector('#mainnetBalance').textContent = `${renderAmount(value, token._decimals)} ${token._symbol}`;
    }
    {
      const value = await habitat.callStatic.getBalance(token.address, account);
      this.querySelector('#rollupBalance').textContent = `${renderAmount(value, token._decimals)} ${token._symbol}`;
    }
    {
      const { value } = await getGasTank(account);
      this.querySelector('#gasTankBalance').textContent = `${renderAmount(value, token._decimals)} ${token._symbol}`;
    }
  }
}
customElements.define('habitat-sidebar', HabitatSidebar);
