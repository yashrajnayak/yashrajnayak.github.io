import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDeployment, resolveDeployment} from './profile-deployment.mjs';
const run = (n, extra={}) => ({id:n,run_number:n,run_attempt:1,head_branch:'main',head_sha:String(n).padStart(40,'a'),status:'completed',conclusion:'success',...extra});
test('automatic sync uses the deployed SHA and rejects late older deliveries', () => {
  const a=run(1),b=run(2);
  assert.equal(selectDeployment([a], 'workflow_run', a).sha, a.head_sha);
  assert.equal(selectDeployment([b,a], 'workflow_run', a), null);
  assert.equal(selectDeployment([a,b], 'workflow_run', b).sha, b.head_sha);
});
test('manual sync selects a successful main deployment, never an undeployed head', () => {
  const a=run(1),b=run(2,{conclusion:'failure'}),c=run(3,{head_branch:'feature'});
  assert.equal(selectDeployment([c,b,a], 'workflow_dispatch').sha,a.head_sha);
  assert.throws(()=>selectDeployment([b,c], 'workflow_dispatch'));
});
test('rerun attempts cannot regress the profile', () => {
  const first=run(1),retry=run(1,{run_attempt:2});
  assert.equal(selectDeployment([retry],'workflow_run',first),null);
  assert.equal(selectDeployment([retry],'workflow_run',retry).attempt,'2');
});
test('final guard skips publication if another deployment succeeded while rendering', async () => {
  const a=run(1),b=run(2),outputs={};
  await resolveDeployment({github:{rest:{actions:{listWorkflowRuns:{}}},paginate:async()=>[a,b]},context:{repo:{},eventName:'workflow_dispatch',payload:{}},core:{info(){},setOutput:(k,v)=>outputs[k]=v}}, {sha:a.head_sha,runId:'1',attempt:'1'});
  assert.equal(outputs.publish,'false');
});
