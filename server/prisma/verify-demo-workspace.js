import "dotenv/config";
import fs from "node:fs";
import {PrismaClient} from "@prisma/client";
import {z} from "zod";
const p=new PrismaClient();
const manifest=JSON.parse(fs.readFileSync(new URL("../.demo-output/accounts.json",import.meta.url),"utf8"));
const api=process.env.DEMO_API_ORIGIN || "http://localhost:5000/api/v1";
const assert=(value,message)=>{if(!value)throw Error(message);};
try{
 const users=await p.user.findMany({where:{email:{in:manifest.accounts.map(a=>a.email)}},include:{recruiterProfile:{include:{company:true,jobs:{include:{applications:{include:{interview:true}}}}}},candidateProfile:{include:{resumes:true,applications:true}}}});
 assert(users.length===10,"Expected 10 accounts");
 let jobs=0,applications=0,scheduled=0,completed=0;
 const counts={};
 for(const u of users){
  assert(z.string().cuid().safeParse(u.id).success,"Invalid user ID");
  if(u.recruiterProfile){
   assert(u.recruiterProfile.jobs.length===2,"Expected two jobs per recruiter");
   const logo=await fetch(manifest.origin+u.recruiterProfile.company.logo);
   assert(logo.ok && logo.headers.get("content-type")?.startsWith("image/"),"Company logo unavailable");
   for(const j of u.recruiterProfile.jobs){
    assert(z.string().cuid().safeParse(j.id).success,"Invalid job ID");
    jobs++;
    for(const a of j.applications){applications++;counts[a.status]=(counts[a.status]||0)+1;
     if(a.status==="INTERVIEW_SCHEDULED"){assert(a.interview?.status==="SCHEDULED"&&a.interview.scheduledAt>new Date(),"Invalid upcoming interview");scheduled++;}
     if(a.status==="HIRED"){assert(a.interview?.status==="COMPLETED","Hire missing completed interview");completed++;}
    }
   }
  }else{
   assert(u.candidateProfile.resumes.length===1,"Candidate resume missing");
   const r=await fetch(u.candidateProfile.resumes[0].fileUrl);
   assert(r.ok&&r.headers.get("content-type")?.includes("pdf"),"Resume not served as PDF");
   assert(Buffer.from(await r.arrayBuffer()).subarray(0,5).toString()==="%PDF-","Resume invalid");
  }
 }
 for(const a of manifest.accounts){
   const r=await fetch(api+"/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:a.email,password:a.password})});
   const json=await r.json();
   assert(r.ok,"Login failed for "+a.email+": "+json.message);
   assert(json.data.user.role===a.role,"Role mismatch");
   const headers={Authorization:"Bearer "+json.data.accessToken};
   const dashboard=await fetch(api+"/dashboard/"+a.role.toLowerCase(),{headers});
   assert(dashboard.ok,"Dashboard failed for "+a.email);
   const user=users.find(u=>u.email===a.email);
   const detail=a.role==="RECRUITER"?"/jobs/"+user.recruiterProfile.jobs[0].id:"/applications/"+user.candidateProfile.applications[0].id;
   const linked=await fetch(api+detail,{headers});assert(linked.ok,"Detail route failed: "+detail+" "+linked.status);
   await fetch(api+"/auth/logout",{method:"POST",headers});
   console.log("Verified login, dashboard and linked detail: "+a.email);
 }
 console.log(JSON.stringify({accounts:users.length,jobs,applications,stages:counts,scheduledInterviews:scheduled,completedInterviews:completed}));
 console.log("All five logos and five resume downloads verified.");
}finally{await p.$disconnect();}
