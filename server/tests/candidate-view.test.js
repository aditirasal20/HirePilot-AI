import { test } from "node:test";
import assert from "node:assert/strict";
import { candidateApplicationView, candidateInterviewView } from "../src/utils/candidate-view.js";
test("candidate application detail omits private assessments without changing the recruiter record",()=>{
 const source={id:"application",recruiterNotes:"Private",status:"SHORTLISTED",interview:{id:"interview",feedback:"Private feedback",score:80,meetingLink:"https://example.com",notes:"Bring portfolio"}};
 const safe=candidateApplicationView(source);
 assert.equal(safe.recruiterNotes,undefined);
 assert.equal(safe.interview.feedback,undefined);
 assert.equal(safe.interview.score,undefined);
 assert.equal(safe.interview.notes,"Bring portfolio");
 assert.equal(safe.interview.meetingLink,"https://example.com");
 assert.equal(source.interview.score,80);
 assert.equal(source.recruiterNotes,"Private");
});
test("candidate interview view supports missing interviews and preserves status",()=>{
 assert.equal(candidateInterviewView(null),null);
 assert.deepEqual(candidateInterviewView({status:"SCHEDULED",score:10,feedback:"private"}),{status:"SCHEDULED"});
});
