import "./env.js";
import { after, afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import applicationService from "../src/modules/application/application.service.js";
import applicationRepository from "../src/modules/application/application.repository.js";
import interviewService from "../src/modules/interview/interview.service.js";
import interviewRepository from "../src/modules/interview/interview.repository.js";
import prisma from "../src/lib/prisma.js";
afterEach(()=>mock.restoreAll());
after(()=>prisma.$disconnect());
const interview={id:"i1",feedback:"Private",score:87,status:"SCHEDULED",meetingLink:"https://example.com",application:{candidate:{user:{id:"c1"}},job:{recruiterId:"r1"}}};
test("candidate application service omits private notes while preserving recruiter access",async()=>{
 const application={id:"a1",candidate:{userId:"c1"},job:{recruiter:{userId:"r1"}},recruiterNotes:"Private notes",interview};
 mock.method(applicationRepository,"findApplicationByIdForDetail",async()=>application);
 const candidate=await applicationService.getApplicationById("c1","CANDIDATE","a1");
 assert.equal(candidate.recruiterNotes,undefined);assert.equal(candidate.interview.feedback,undefined);
 const recruiter=await applicationService.getApplicationById("r1","RECRUITER","a1");
 assert.equal(recruiter.recruiterNotes,"Private notes");assert.equal(recruiter.interview.score,87);
 await assert.rejects(applicationService.getApplicationById("someone-else","CANDIDATE","a1"),/not found/);
});
test("candidate interview listing sanitizes assessment fields and preserves pagination",async()=>{
 mock.method(interviewRepository,"findCandidateProfileByUserId",async()=>({id:"candidate-profile"}));
 mock.method(interviewRepository,"findCandidateInterviews",async()=>({interviews:[interview],totalInterviews:12}));
 const result=await interviewService.getInterviews("c1","CANDIDATE",{page:1,limit:10});
 assert.equal(result.interviews[0].score,undefined);
 assert.equal(result.interviews[0].feedback,undefined);
 assert.equal(result.interviews[0].meetingLink,"https://example.com");
 assert.equal(result.pagination.totalPages,2);
});
test("candidate interview detail sanitizes assessments and rejects nonowners",async()=>{
 mock.method(interviewRepository,"findInterviewById",async()=>interview);
 const result=await interviewService.getInterviewById("c1","CANDIDATE","i1");
 assert.equal(result.feedback,undefined);
 assert.equal(result.status,"SCHEDULED");
 await assert.rejects(interviewService.getInterviewById("someone-else","CANDIDATE","i1"),/not found/);
});
