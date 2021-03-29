require('regenerator-runtime/runtime');

const { argv } = require('yargs');

const verifiedProjects = require('./lib/projects.json');

const { fetchDonations, fetchTokenPrice } = require('./lib/utils');

if (!argv.round || !argv.startTime || !argv.endTime) {
  console.log(
      'Usage: node index.js --round 1 --startTime TBU --endTime TBU'
  );
  process.exit();
}

// Round params
const ROUND = argv.round;
const END_TIME = argv.endTime; 
const START_TIME = argv.startTime;

// Distribution params
const GIVBACKS_AVAILABLE = 10000;
const GIVBACKS_MAX_FACTOR = 0.75;
const GIVBACK_ADDRESS  = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // TBU

(async function () {

  const { donations } = await fetchDonations();

  function isEligibleDonation(donation) {
    return verifiedProjects.includes(donation.project.id)
  }

  const eligibleDonations = donations.filter(isEligibleDonation)

  const amountDonated = eligibleDonations.reduce((accumulator, { valueUsd }) => accumulator + valueUsd, 0);

  const amountDonatedCapped = amountDonated * GIVBACKS_MAX_FACTOR;

  const givbackPrice = fetchTokenPrice(GIVBACK_ADDRESS, END_TIME);

  const givbacksToDistribute = amountDonatedCapped / givbackPrice;

  const givbacksToDistributeCapped = givbacksToDistribute >= GIVBACKS_AVAILABLE ? GIVBACKS_AVAILABLE : givbacksToDistribute;

  return;
})();
