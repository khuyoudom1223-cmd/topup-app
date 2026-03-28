const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function checkPlayerContract() {
  const healthUrl = `${BASE_URL}/api/player/health`;
  const successUrl = `${BASE_URL}/api/player?userId=12345&serverId=6789`;
  const errorUrl = `${BASE_URL}/api/player?userId=12&serverId=ab`;

  let hasFailure = false;

  try {
    const healthRes = await fetch(healthUrl);
    const healthJson = await healthRes.json();

    const isHealthValid =
      healthRes.ok &&
      healthJson &&
      healthJson.success === true &&
      healthJson.service === 'player-api';

    if (isHealthValid) {
      console.log('HEALTH CASE: OK');
      console.log(JSON.stringify(healthJson));
    } else {
      hasFailure = true;
      console.error('HEALTH CASE: FAILED');
      console.error(JSON.stringify(healthJson));
    }
  } catch (err) {
    hasFailure = true;
    console.error('HEALTH CASE: FAILED TO FETCH');
    console.error(err.message);
  }

  try {
    const successRes = await fetch(successUrl);
    const successJson = await successRes.json();

    const isSuccessValid =
      successRes.ok &&
      successJson &&
      successJson.success === true &&
      typeof successJson.username === 'string' &&
      successJson.username.length > 0;

    if (isSuccessValid) {
      console.log('SUCCESS CASE: OK');
      console.log(JSON.stringify(successJson));
    } else {
      hasFailure = true;
      console.error('SUCCESS CASE: FAILED');
      console.error(JSON.stringify(successJson));
    }
  } catch (err) {
    hasFailure = true;
    console.error('SUCCESS CASE: FAILED TO FETCH');
    console.error(err.message);
  }

  try {
    const errorRes = await fetch(errorUrl);
    const errorJson = await errorRes.json();

    const isErrorValid =
      !errorRes.ok &&
      errorJson &&
      errorJson.success === false &&
      errorJson.message === 'Player not found or invalid input';

    if (isErrorValid) {
      console.log('ERROR CASE: OK');
      console.log(JSON.stringify(errorJson));
    } else {
      hasFailure = true;
      console.error('ERROR CASE: FAILED');
      console.error(JSON.stringify(errorJson));
    }
  } catch (err) {
    hasFailure = true;
    console.error('ERROR CASE: FAILED TO FETCH');
    console.error(err.message);
  }

  if (hasFailure) {
    process.exitCode = 1;
  } else {
    console.log('PLAYER CONTRACT CHECK: PASSED');
  }
}

checkPlayerContract();
