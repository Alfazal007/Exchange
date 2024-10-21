import { extractData } from "./helpers/fetchDataFromTransaction";

extractData("4BdNHsnY1LqBPWwcqShD4dR7oockYriwSGS3W6w428GkFd8sodWV1naDmvGGSUtoVNxziRaEyR2hmjKHgLQ5EAg2")
    .then(() => console.log('Done'))
    .catch(err => console.error('Error:', err));

// from fat to normal sol
// 4BdNHsnY1LqBPWwcqShD4dR7oockYriwSGS3W6w428GkFd8sodWV1naDmvGGSUtoVNxziRaEyR2hmjKHgLQ5EAg2
// from normal to fat sol
// 2tkn7mJbdpvf1Vw2BnvuaiZzuBsZMKSfa1cseLbAgZgX6FK8AhCnTgA2YdUkQF2L1izotoJkRpoHs53voZ6edPyp
// from fat to normal token
// 4n4nf1aq1yCbTkUwemFDRxGTMhjPdQrmrsKuPkboKp8QGb17vgnCgEFFzdzRAkaUTSgwCs6tisGEHUfSYTBPrDK3
// from notmal to fat tokjen
// 3PebGbRJpi2YT5n98X22NRkvdiCjLAVAxhEihgqS2E75oDXn7NEsYBaWMak9RJoBPM82pLxNrT6sAgBMpX6fY3eE
