
import "./env.js";
import { after, afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import service from "../src/modules/job-matching/job-matching.service.js";
import repository from "../src/modules/job-matching/job-matching.repository.js";
import queue from "../src/ai/ai.queue.js";
import promptManager from "../src/ai/prompt.manager.js";
import gemini from "../src/ai/gemini.service.js";
import { processJobMatching } from "../src/modules/job-matching/job-matching.worker.js";
import { analyzeJobMatchSchema } from "../src/modules/job-matching/job-matching.validation.js";
import prisma from "../src/lib/prisma.js";
afterEach(()=>mock.restoreAll());
after(()=>prisma.$disconnect());
function fixture(status="COMPLETED",owner="c1"){
 mock.method(repository,"findCandidateProfileByUserId",async()=>({id:"c1"}));
 mock.method(repository,"findResumeById",async()=>({candidateProfileId:owner,analysisStatus:"COMPLETED",summary:"Frontend experience",extractedSkills:["React"]}));
 mock.method(repository,"findJobById",async()=>({title:"Frontend intern",status:"OPEN",description:"Build React interfaces",requiredSkills:["React"]}));
 mock.method(repository,"findExistingMatch",async()=>({id:"m1",analysisStatus:status}));
 mock.method(repository,"updateJobMatch",async()=>({}));
 return mock.method(queue,"addAIJob",async()=>({}));
}
test("completed reports stay cached unless explicitly refreshed",async()=>{
 const dispatch=fixture();
 assert.equal((await service.queueJobMatching("j1","r1","u1")).cached,true);
 assert.equal(dispatch.mock.callCount(),0);
 const result=await service.queueJobMatching("j1","r1","u1",{refresh:true});
 assert.equal(result.cached,false);
 assert.equal(result.status,"QUEUED");
 assert.equal(dispatch.mock.callCount(),1);
 assert.equal(dispatch.mock.calls[0].arguments[2].matchId,"m1");
});
test("refresh cannot bypass resume ownership",async()=>{
 const dispatch=fixture("COMPLETED","someone-else");
 await assert.rejects(service.queueJobMatching("j1","r1","u1",{refresh:true}),/Unauthorized/);
 assert.equal(dispatch.mock.callCount(),0);
});
test("refresh cannot dispatch an already running report",async()=>{
 const dispatch=fixture("PROCESSING");
 await assert.rejects(service.queueJobMatching("j1","r1","u1",{refresh:true}),/already in progress/);
 assert.equal(dispatch.mock.callCount(),0);
});
test("refresh validation accepts only booleans",()=>{
 assert.equal(analyzeJobMatchSchema.body.safeParse({resumeId:"ck123456789012345678901234",refresh:"true"}).success,false);
});
test("worker supplies dated candidate-facing instructions and persists the generated report",async()=>{
 fixture();
 const report={overallScore:75,matchedSkills:["React"],missingSkills:[],strengths:["Your React experience aligns."],weaknesses:[],summary:"Your React experience aligns with this role.",recommendation:"MEDIUM"};
 const generate=mock.method(gemini,"generateStructuredJSON",async()=>({data:report}));
 await processJobMatching({data:{matchId:"m1",resumeId:"r1",jobId:"j1"}});
 const input=generate.mock.calls[0].arguments[0];
 assert.match(input.prompt,/Current date [(]UTC[)]: [0-9]{4}-[0-9]{2}-[0-9]{2}/);
 assert.match(input.systemPrompt,/Address the reader as "you" and "your"/);
 assert.match(input.systemPrompt,/missing evidence, not proof/);
 assert.match(input.systemPrompt,/current month followed by "Present" is valid/);
 assert.equal(promptManager.getPrompt("JOB_MATCHING_V2").version,"1.1.0");
 const saved=repository.updateJobMatch.mock.calls.at(-1).arguments[1];
 assert.equal(saved.summary,report.summary);
 assert.equal(saved.analysisStatus,"COMPLETED");
});
