import { wrapListener, checkScroll, secondsToString, renderAmount } from '/lib/utils.js';
import {
  getProviders,
  pullEvents,
  fetchProposalStats,
  humanProposalTime,
  submitVote
} from '/lib/rollup.js';

const PROPOSAL_TEMPLATE =
`
<div style='height:2.5rem;overflow:hidden;'>
<a style='font-size:1.2rem;' class='bold' target='_blank' id='title'></a>
</div>
<div id='labels' class='flex row'></div>
<sep></sep>
<center style='padding-bottom:1rem;'>
<habitat-circle class='signal'></habitat-circle>
<p id='totalVotes' class='text-center smaller bold' style='padding:.3rem;'></p>
<p id='feedback' class='smaller center bold text-center' style='padding-top:.5rem;'> </p>
<p id='time' class='smaller center bold text-center' style='padding-top:.5rem;'> </p>
</center>

<div style="width:100%;height:1.4rem;font-size:.7rem;">
<h3 class="left inline" style="float:left;text-shadow:0 0 2px #909090;">❄️</h3>
<h3 class="right inline" style="float:right;text-shadow:0 0 2px #909090;">🔥</h3>
</div>

<habitat-slider></habitat-slider>
<label>
You can replace your vote any time.
</label>
<div class='flex row'>
<button id='vote' class='bold green'>Vote</button>
<a target='_blank' id='open' class='button smaller purple'>View Proposal</a>
</div>
`;

let vaultAddress, communityId;

async function updateItem (child, proposalId, startDate) {
  const { habitat } = await getProviders();
  const {
    totalShares,
    defaultSliderValue,
    signals,
    signalStrength,
    userShares,
    userSignal,
    totalVotes,
    participationRate,
    tokenSymbol,
  } = await fetchProposalStats({ communityId, proposalId });
  let proposal = {};
  let expired = false;
  let status = expired ? 'Voting Ended' : humanProposalTime(startDate);
  let votingDisabled = false;
  if (proposal.aborted) {
    status = 'aborted by proposer';
  } else if (proposal.didPass) {
    status = 'passed';
  } else if (proposal.processed) {
    status = 'processed';
  }

  child.querySelector('#time').textContent = status;
  child.querySelector('habitat-circle').setValue(signalStrength, renderAmount(totalShares), tokenSymbol);

  if (userSignal) {
    child.querySelector('#feedback').textContent = `You Voted with ${renderAmount(userShares)} ${tokenSymbol}.`;
  }

  const slider = child.querySelector('habitat-slider');
  if (slider.value == slider.defaultValue) {
    slider.setRange(1, 100, 100, defaultSliderValue);
  }
}

async function fetchProposals (vaultAddress) {
  const { habitat } = await getProviders();
  const blockNum = await habitat.provider.getBlockNumber();
  const filter = habitat.filters.ProposalCreated(vaultAddress);

  filter.toBlock = blockNum;

  const container = document.querySelector('#proposals');
  for await (const evt of pullEvents(habitat, filter, 100)) {
    console.log(evt);
    const { proposalId, startDate, title, actions } = evt.args;
    const proposalLink = `../proposal/#${evt.transactionHash}`;
    const child = document.createElement('div');
    child.className = 'listitem';
    child.innerHTML = PROPOSAL_TEMPLATE;

    const titleElement = child.querySelector('#title');
    titleElement.textContent = title;
    titleElement.href = proposalLink;
    child.querySelector('#open').href = proposalLink;

    const slider = child.querySelector('habitat-slider');
    wrapListener(
      child.querySelector('button#vote'),
      async () => {
        await submitVote(communityId, proposalId, slider.value);
        await updateItem(child, proposalId, startDate);
      }
    );

    container.appendChild(child);
    updateItem(child, proposalId, startDate);
  }
}

async function render () {
  [vaultAddress, communityId] = window.location.hash.replace('#', '').split(',');
  document.querySelector('a#propose').href = `../propose/#${vaultAddress},${communityId}`;
  document.querySelector('a#back').href = `../community/#${communityId}`;
  await fetchProposals(vaultAddress);
}

window.addEventListener('DOMContentLoaded', render, false);
