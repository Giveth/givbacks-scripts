require('regenerator-runtime/runtime');

const { argv } = require('yargs');
const { mkdirSync, writeFileSync } = require('fs');

const verifiedProjects = require('./lib/projects.json');

const { bnum, fetchDonations } = require('./lib/utils');

if (!argv.round || !argv.givAvailable || !argv.givPrice || !argv.startTime || !argv.endTime) {
  console.log(
      'Usage: node index.js --round 1 --givAvailable 10000 --givPrice 10 --startTime 2021-04-01T10:00:00Z --endTime 2021-04-08T12:00:00Z'
  );
  process.exit();
}

// Round params
const ROUND = argv.round;
const END_TIME = new Date(argv.endTime); 
const START_TIME = new Date(argv.startTime);

// Distribution params
const GIVBACKS_MAX_FACTOR = 0.75;
const GIVBACKS_PRICE  = argv.givbacksPrice;
const GIVBACKS_AVAILABLE = bnum(argv.givAvailable);

(async function () {
  const { donations } = await fetchDonations();

  function isEligibleDonation({ createdAt }) {
    return new Date(createdAt) >= START_TIME && new Date(createdAt) < END_TIME;
  };

  const eligibleDonations = donations.filter(isEligibleDonation);

  const donationsFormatted = eligibleDonations.map(donation => ({ 
    walletAddress: donation.user.walletAddress, 
    valueUsd: donation.valueUsd * GIVBACKS_MAX_FACTOR
  }));

  const donationsGrouped = [];

  donationsFormatted.reduce((res, value) => {
    if (!res[value.walletAddress]) {
      res[value.walletAddress] = { walletAddress: value.walletAddress, valueUsd: 0 };
      donationsGrouped.push(res[value.walletAddress])
    }
    res[value.walletAddress].valueUsd += value.valueUsd;
    return res;
  }, {});

  const totalDonated = donationsGrouped.reduce((accumulator, { valueUsd }) => accumulator + valueUsd, 0);

  const cappedAmountDonated = totalDonated * GIVBACKS_MAX_FACTOR;

  const givbacksToDistribute = bnum(cappedAmountDonated / GIVBACKS_PRICE);

  const cappedGivbacksToDistribute = givbacksToDistribute.dp(18).gte(GIVBACKS_AVAILABLE.dp(18)) ? GIVBACKS_AVAILABLE : givbacksToDistribute;

  const giversRewards = donationsGrouped.map(donation => ({
    [donation.walletAddress]: cappedGivbacksToDistribute.times(donation.valueUsd).div(totalDonated)
  }));

  try {
    mkdirSync(`./reports/${ROUND}/`);
    writeFileSync(
        `./reports/${ROUND}/rewards.json`,
        JSON.stringify(giversRewards, null, 4)
    );
  } catch (err) {
      console.error(err);
  };

  return;
})();
