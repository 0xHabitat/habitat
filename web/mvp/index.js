import { checkScroll, wrapListener } from '/lib/utils.js';
import { formatObject, computeVotePercentages, getProviders, pullEvents } from '/lib/rollup.js';
import { CreateCommunityFlow } from '/lib/flows.js';

async function fetchCommunities () {
  const { habitat } = await getProviders();
  const blockNum = await habitat.provider.getBlockNumber();
  const filter = habitat.filters.CommunityCreated();

  filter.toBlock = blockNum;

  checkScroll('.content', () => console.warn('pull more'));

  const container = document.querySelector('#communities');
  for await (const evt of pullEvents(habitat, filter, 10)) {
    const { communityId, governanceToken } = evt.args;
    let metadata;
    try {
      metadata = JSON.parse(evt.args.metadata);
    } catch (e) {
      console.error(e);
    }
    const child = document.createElement('div');
    child.className = 'listitem';
    child.innerHTML = `
      <a href='community/#${communityId}'></a>
      <sep></sep>
      <label>
      Governance Token
      <input disabled value='${governanceToken}'>
      </label>
    `;
    child.querySelector('a').textContent = (metadata ? metadata.title : '') || '???';
    container.appendChild(child);
  }
}

async function render () {
  wrapListener('button#community', (evt) => new CreateCommunityFlow(evt.target));
  await fetchCommunities();
}

window.addEventListener('DOMContentLoaded', render, false);
