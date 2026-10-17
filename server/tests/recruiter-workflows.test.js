import "./env.js";
import { after,afterEach,beforeEach,mock,test } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/lib/prisma.js";
import jobRepository from "../src/modules/job/job.repository.js";
import applicationRepository from "../src/modules/application/application.repository.js";
import applicationService from "../src/modules/application/application.service.js";
import dashboardRepository from "../src/modules/dashboard/dashboard.repository.js";
import { getMyJobsQuerySchema } from "../src/modules/job/job.validation.js";
import { getJobApplicationsQuerySchema } from "../src/modules/application/application.validation.js";
import { updateCompanySchema,createCompanySchema } from "../src/modules/company/company.validation.js";
// Prisma delegates are dynamic proxies; replace delegates with plain test doubles.
const originalJob = prisma.job;
const originalApplication = prisma.application;
beforeEach(() => {
  prisma.job = { findMany() {}, count() {} };
  prisma.application = { findMany() {}, count() {}, groupBy() {} };
});
afterEach(()=>{ mock.restoreAll(); prisma.job = originalJob; prisma.application = originalApplication; });
after(()=>prisma.$disconnect());
test("job filters are applied across pages and remain scoped to the recruiter",async()=>{
 let listQuery,countQuery;
 mock.method(prisma.job,"findMany",async q=>{listQuery=q;return [];});
 mock.method(prisma.job,"count",async q=>{countQuery=q;return 27;});
 const result=await jobRepository.findRecruiterJobs("owner",{page:2,limit:10,status:"OPEN",search:"design"});
 assert.equal(listQuery.where.recruiterId,"owner");
 assert.equal(listQuery.where.status,"OPEN");
 assert.equal(listQuery.skip,10);
 assert.equal(listQuery.take,10);
 assert.equal(listQuery.where.OR[0].title.contains,"design");
 assert.deepEqual(countQuery.where,listQuery.where);
 assert.equal(result.totalJobs,27);
 assert.equal(listQuery.select._count.select.applications,true);
});
test("applicant search, resume-score filters, pagination and stage totals use the same job scope",async()=>{
 let listQuery,countQuery,stageQuery;
 mock.method(prisma.application,"findMany",async q=>{listQuery=q;return [{id:"app"}];});
 mock.method(prisma.application,"count",async q=>{countQuery=q;return 12;});
 mock.method(prisma.application,"groupBy",async q=>{stageQuery=q;return [{status:"APPLIED",_count:{_all:12}},{status:"SHORTLISTED",_count:{_all:3}}];});
 const result=await applicationRepository.findJobApplications("job",{page:2,limit:10,status:"APPLIED",search:"Alex",minScore:70,sort:"score"});
 assert.equal(listQuery.where.jobId,"job");
 assert.equal(listQuery.where.candidate.user.OR[0].fullName.contains,"Alex");
 assert.equal(listQuery.where.resume.analysisStatus,"COMPLETED");
 assert.equal(listQuery.where.resume.aiScore.gte,70);
 assert.equal(listQuery.skip,10);
 assert.equal(listQuery.orderBy[0].resume.aiScore.nulls,"last");
 assert.deepEqual(countQuery.where,listQuery.where);
 assert.equal(stageQuery.where.status,undefined);
 assert.equal(stageQuery.where.jobId,"job");
 assert.deepEqual(stageQuery.where.resume,listQuery.where.resume);
 assert.deepEqual(result.stageCounts,{APPLIED:12,SHORTLISTED:3});
});
test("pipeline retrieval rejects nonowner jobs before accessing applicant data",async()=>{
 mock.method(applicationRepository,"findRecruiterProfileByUserId",async()=>({id:"r1"}));
 mock.method(applicationRepository,"findJobByIdAndRecruiter",async()=>null);
 let queried=false;mock.method(applicationRepository,"findJobApplications",async()=>{queried=true;return {};});
 await assert.rejects(applicationService.getJobApplications("owner","other-job",{search:"Alex"}),/not authorized/);
 assert.equal(queried,false);
});
test("job application service forwards supported filters and returns aggregate counts",async()=>{
 mock.method(applicationRepository,"findRecruiterProfileByUserId",async()=>({id:"r1"}));
 mock.method(applicationRepository,"findJobByIdAndRecruiter",async()=>({id:"j1",title:"Designer",status:"OPEN"}));
 let filters;mock.method(applicationRepository,"findJobApplications",async(id,q)=>{filters=q;return {applications:[],totalApplications:0,stageCounts:{HIRED:2}};});
 const result=await applicationService.getJobApplications("owner","j1",{page:3,search:"Alex",minScore:0,sort:"oldest"});
 assert.equal(filters.page,3);assert.equal(filters.search,"Alex");assert.equal(filters.minScore,0);assert.equal(filters.sort,"oldest");assert.deepEqual(result.stageCounts,{HIRED:2});
});
test("dashboard pipeline counts remain scoped to recruiter-owned jobs",async()=>{
 let query;mock.method(prisma.application,"groupBy",async q=>{query=q;return [{status:"REVIEWING",_count:{_all:4}}];});
 assert.deepEqual(await dashboardRepository.countRecruiterStages("r1"),{REVIEWING:4});
 assert.deepEqual(query.where,{job:{recruiterId:"r1"}});
});
test("filter validation rejects invalid scores, stages, limits and sorts",()=>{
 assert.equal(getMyJobsQuerySchema.safeParse({status:"HIRED"}).success,false);
 assert.equal(getMyJobsQuerySchema.safeParse({page:0}).success,false);
 assert.equal(getJobApplicationsQuerySchema.safeParse({minScore:101}).success,false);
 assert.equal(getJobApplicationsQuerySchema.safeParse({sort:"random"}).success,false);
 const result=getJobApplicationsQuerySchema.parse({search:" Alex ",minScore:"0",sort:"score"});
 assert.equal(result.search,"Alex");assert.equal(result.minScore,0);
});
test("company updates can clear optional fields without weakening creation validation",()=>{
 const data={website:null,logo:null,companySize:null,description:null,industry:null,location:null};
 assert.deepEqual(updateCompanySchema.parse(data),data);
 assert.equal(createCompanySchema.safeParse({name:"Company",website:null}).success,false);
 assert.equal(updateCompanySchema.safeParse({name:null}).success,false);
});
