export const assetKey = job => `${job.kind}:${job.start ?? job.entity?.s ?? job.entity?.start ?? 0}:${job.entity?.center ?? ''}`;

export function campaignJobs(config) {
  const jobs = [];
  for (let start = -50; start < config.length + 200; start += 100) jobs.push({ job: {kind:'chunk',start}, start, end:start+100 });
  for (const entity of config.gaps) jobs.push({ job: {kind:'gap',entity}, start:entity.start-12, end:entity.end+12 });
  for (const entity of config.gates) jobs.push({ job: {kind:'gate',entity}, start:entity.s-15, end:entity.s+9 });
  for (const entity of config.obstacles) jobs.push({ job: {kind:'obstacle',entity}, start:entity.s-24, end:entity.s+entity.depth });
  jobs.push({ job: {kind:'checkpoint'}, start:config.length-15, end:config.length+15 });
  return jobs.sort((a,b)=>a.start-b.start);
}
