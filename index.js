const core = require('@actions/core');
const github = require('@actions/github');

const action = async () => {
  try {
    const environment = core.getInput('environment', { required: true });
    const ciToken = core.getInput('ciToken', { required: true });
    const serviceName = core.getInput('serviceName', { required: true });
    const serviceVersion = core.getInput('serviceVersion', { required: true });

    const octokit = github.getOctokit(ciToken);

    const serviceStatesRes = await octokit.repos.getContent({
      owner: 'Sthana-ai',
      repo: 'environments',
      path: `services/${environment}.json`,
      ref: 'refs/heads/master',
    });
    const serviceStates = JSON.parse(Buffer.from(serviceStatesRes.data.content, 'base64').toString());
    const serviceState = serviceStates.find((state) => state.name === serviceName);
    if (!serviceState) {
      core.setFailed(`service state not found for ${serviceName}`);
    }

    const updatedServiceStates = serviceStates.map((state) => {
      if (state.name === serviceName) {
        return { ...state, version: serviceVersion };
      }
      return state;
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: 'Sthana-ai',
      repo: 'environments',
      message: `chore(environment): update ${serviceName} version in ${environment} to ${serviceVersion}`,
      path: `services/${environment}.json`,
      content: Buffer.from(JSON.stringify(updatedServiceStates, null, 2)).toString('base64'),
      sha: serviceStatesRes.data.sha,
    });
  } catch (error) {
    core.setFailed(error);
  }
};

action();
