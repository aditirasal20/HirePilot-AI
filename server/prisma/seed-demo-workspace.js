import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"../..");
const out=path.resolve(here,"../.demo-output");
const assets=path.join(root,"client/public/demo/hiring");
const manifest=path.join(out,"accounts.json");
const data=JSON.parse(fs.readFileSync(path.join(here,"demo-workspace.data.json"),"utf8"));
const prisma=new PrismaClient();
const origin=process.env.DEMO_CLIENT_ORIGIN || "http://localhost:5174";
const id=(kind,key)=>"c"+createHash("sha256").update("hp-demo-20260920-"+kind+"-"+key).digest("hex").slice(0,24);
const daysAgo=n=>new Date(Date.now()-n*86400000);
const states=["SHORTLISTED","REJECTED","INTERVIEW_SCHEDULED","HIRED","REVIEWING","APPLIED"];
const names=["Neha Kapoor","Vikram Sethi","Ananya Iyer","Kunal Malhotra","Sana Khan"];

async function main(){
 fs.mkdirSync(out,{recursive:true});
 fs.mkdirSync(assets,{recursive:true});
 if(process.env.NODE_ENV==="production") throw Error("Demo seeding is disabled in production.");
 if(fs.existsSync(manifest)){ console.log("Demo manifest already exists; no records changed."); return; }
 const accounts=[
 ...data.companies.map((c,i)=>({fullName:names[i],email:c.key+".recruiter@hirepilot.example",role:"RECRUITER",key:c.key,company:c.name+" (Demo)"})),
 ...data.candidates.map(c=>({fullName:c.name,email:c.key+".candidate@hirepilot.example",role:"CANDIDATE",key:c.key}))
 ].map(a=>({...a,password:"HP!"+randomBytes(10).toString("base64url")}));
 const existing=await prisma.user.count({where:{email:{in:accounts.map(a=>a.email)}}});
 if(existing) throw Error("Reserved demo emails already exist; refusing to overwrite accounts.");
 for(const c of data.candidates) if(!fs.existsSync(path.join(assets,c.key+"-resume.pdf"))) throw Error("Generate resumes first.");
 for(const c of data.companies){
   let found=false;
   for(const url of [c.logo,"https://www.google.com/s2/favicons?domain="+new URL(c.website).hostname+"&sz=128"]){
    try{
     const r=await fetch(url,{signal:AbortSignal.timeout(20000)});
     if(!r.ok||!r.headers.get("content-type")?.startsWith("image/")) continue;
     const bytes=Buffer.from(await r.arrayBuffer());
     if(bytes.length<100) continue;
     const ext=r.headers.get("content-type").includes("png")?"png":r.headers.get("content-type").includes("svg")?"svg":"ico";
     c.localLogo=c.key+"."+ext;
     fs.writeFileSync(path.join(assets,c.localLogo),bytes);
     found=true;break;
    }catch{}
   }
   if(!found) throw Error("Could not retrieve a company logo for "+c.name);
 }
 const hashes=await Promise.all(accounts.map(a=>bcrypt.hash(a.password,10)));
 await prisma.$transaction(async tx=>{
  for(let i=0;i<accounts.length;i++){
   const a=accounts[i];
   await tx.user.create({data:{id:id("user",a.key),fullName:a.fullName,email:a.email,password:hashes[i],role:a.role,isEmailVerified:false}});
  }
  for(const c of data.candidates){
   await tx.candidateProfile.create({data:{id:id("candidate",c.key),userId:id("user",c.key),location:c.location,currentPosition:c.position,yearsOfExperience:c.years,bio:c.bio+" Fictional demo profile."}});
   await tx.resume.create({data:{id:id("resume",c.key),candidateProfileId:id("candidate",c.key),title:c.name+" - "+c.position+" (Demo)",fileUrl:origin+"/demo/hiring/"+c.key+"-resume.pdf",publicId:"demo/hiring/"+c.key,originalFileName:c.key+"-resume.pdf",isDefault:true,analysisStatus:"IDLE",extractedSkills:c.skills,parsedText:[c.name,c.position,c.location,c.bio,c.skills.join(", "),c.experience,...c.bullets,"Fictional demo resume."].join("\n")}});
  }
  for(let i=0;i<data.companies.length;i++){
   const c=data.companies[i];
   await tx.company.create({data:{id:id("company",c.key),name:c.name+" (Demo)",website:c.website,logo:"/demo/hiring/"+c.localLogo,description:c.about+"\n\nDemo company profile for HirePilot testing. Recruiters and vacancies in this workspace are fictional and are not affiliated with "+c.name+". Company overview: "+c.source,industry:c.industry,location:c.location,isVerified:false}});
   await tx.recruiterProfile.create({data:{id:id("recruiter",c.key),userId:id("user",c.key),companyId:id("company",c.key),designation:"Technical Recruiter (Demo)",isVerified:false}});
   for(let j=0;j<2;j++){
    const [title,skills,years,min,max,summary,responsibilities,requirements]=c.roles[j];
    const description=[summary,"About the team", "This sample team builds maintainable products through close collaboration between engineering, design and product. The role is based in "+c.location+".","What you will work on",...responsibilities.split(";").map(v=>"- "+v+"."),"What you will bring",...requirements.split(";").map(v=>"- "+v+"."),"Experience and compensation",years+"+ years of relevant experience. Illustrative annual compensation: INR "+min.toLocaleString("en-IN")+" - "+max.toLocaleString("en-IN")+".","Interview process","Recruiter discussion, role-specific practical conversation, and a final team discussion. Share examples of your work and how you make technical or design decisions.","Demo vacancy","This is a fictional job for HirePilot testing, not an advertised opening at "+c.name+". Requirements, compensation and interview process are illustrative."].join("\n\n");
    await tx.job.create({data:{id:id("job",c.key+"-"+j),title,description,location:c.location,salaryMin:min,salaryMax:max,yearsOfExperience:years,employmentType:"FULL_TIME",requiredSkills:skills.split(","),status:"OPEN",companyId:id("company",c.key),recruiterId:id("recruiter",c.key),createdAt:daysAgo(12-i)}});
   }
   for(let k=0;k<states.length;k++){
    const cnd=data.candidates[(i+k)%5], status=states[k], jobId=id("job",c.key+"-"+Math.floor(k/3)), appId=id("application",c.key+"-"+k);
    await tx.application.create({data:{id:appId,candidateId:id("candidate",cnd.key),resumeId:id("resume",cnd.key),jobId,status,appliedAt:daysAgo(6-i),recruiterNotes:"Demo scenario: "+status.toLowerCase().replaceAll("_"," ")+". Review the attached fictional resume to explore this workflow."}});
    if(status==="INTERVIEW_SCHEDULED"||status==="HIRED"){
      const hired=status==="HIRED";
      const scheduledAt=hired?daysAgo(1):new Date(Date.now()+(i+2)*86400000);
      scheduledAt.setUTCHours(5+i,30,0,0);
      await tx.interview.create({data:{id:id("interview",c.key+"-"+k),applicationId:appId,interviewType:"ONSITE",scheduledAt,durationMinutes:45,timezone:"Asia/Kolkata",notes:"Demo interview only. Review your projects, role-related experience and questions for the team. No real meeting is booked.",status:hired?"COMPLETED":"SCHEDULED",completedAt:hired?new Date(scheduledAt.getTime()+45*60000):null,feedback:hired?"Demo outcome: completed the role discussion and progressed to hired.":null}});
    }
    await tx.notification.create({data:{id:id("notification",c.key+"-"+k),userId:id("user",cnd.key),title:"Demo application: "+status.toLowerCase().replaceAll("_"," "),message:"Your demo application for "+c.roles[Math.floor(k/3)][0]+" at "+c.name+" is "+status.toLowerCase().replaceAll("_"," ")+".",type:"APPLICATION",entityId:appId,entityType:"Application",createdAt:daysAgo(i/3)}});
   }
   await tx.notification.create({data:{id:id("notification-recruiter",c.key),userId:id("user",c.key),title:"Your demo hiring workspace is ready",message:"Two open sample roles and six applications are available. Explore shortlisting, interviews and hiring outcomes.",type:"SYSTEM"}});
  }
 },{timeout:60000,maxWait:15000});
 fs.writeFileSync(manifest,JSON.stringify({createdAt:new Date().toISOString(),origin,accounts},null,2));
 console.log("Created 10 accounts, 5 companies, 10 jobs, 5 resumes, 30 applications, 10 interviews and 35 in-app notifications.");
}
try{await main();}finally{await prisma.$disconnect();}
