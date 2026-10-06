// Select only successfully deployed main revisions. Newer failed builds do not
// become profile content, and late workflow_run deliveries cannot roll it back.
export function selectDeployment(runs, eventName, eventRun) {
  const latest = runs.filter(run => run.head_branch === 'main' && run.status === 'completed' && run.conclusion === 'success')
    .sort((a, b) => b.run_number - a.run_number || b.run_attempt - a.run_attempt)[0];
  if (!latest || !/^[a-f0-9]{40}$/.test(latest.head_sha)) throw Error('No successful main deployment available');
  if (eventName === 'workflow_run' && (eventRun?.id !== latest.id || eventRun?.head_sha !== latest.head_sha || eventRun?.run_attempt !== latest.run_attempt)) return null;
  if (!['workflow_run', 'workflow_dispatch'].includes(eventName)) throw Error('Unsupported profile sync event');
  return {sha: latest.head_sha, runId: String(latest.id), attempt: String(latest.run_attempt)};
}

export async function resolveDeployment({github, context, core}, expected) {
  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    ...context.repo, workflow_id: 'deploy-site.yml', branch: 'main', status: 'success', per_page: 100,
  });
  const selected = selectDeployment(runs, context.eventName, context.payload.workflow_run);
  if (!selected || (expected && (selected.runId !== expected.runId || selected.attempt !== expected.attempt || selected.sha !== expected.sha))) {
    core.info('Skipping a superseded deployment.');
    core.setOutput('publish', 'false');
    return;
  }
  core.setOutput('publish', 'true');
  core.setOutput('sha', selected.sha);
  core.setOutput('run-id', selected.runId);
  core.setOutput('attempt', selected.attempt);
}
