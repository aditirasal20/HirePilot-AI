import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / ".demo-tools"))
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
import fitz
root = Path(__file__).resolve().parents[2]
data = json.loads((root / "server/prisma/demo-workspace.data.json").read_text())
out = root / "client/public/demo/hiring"
out.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Name", fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=HexColor("#18251c"), spaceAfter=8))
styles.add(ParagraphStyle(name="Section", fontName="Helvetica-Bold", fontSize=11, leading=16, textColor=HexColor("#385b2b"), spaceBefore=18, spaceAfter=8))
styles["BodyText"].fontSize=10
styles["BodyText"].leading=15
for c in data["candidates"]:
    path=out / (c["key"] + "-resume.pdf")
    story=[Paragraph(c["name"],styles["Name"]), Paragraph(c["position"]+" | "+c["location"],styles["BodyText"]),Paragraph(c["key"]+".candidate@hirepilot.example",styles["BodyText"])]
    for title, lines in [
      ("PROFILE",[c["bio"]]),
      ("SKILLS",[", ".join(c["skills"])]),
      ("EXPERIENCE",[c["experience"]]+c["bullets"]),
      ("PROJECT",[c["position"]+" portfolio project", "Built a sample service-workflow application, documented design decisions, and tested the core user journeys."]),
      ("EDUCATION",["Bachelor's degree | Example Institute of Technology (fictional)"]),
      ("DEMO PROFILE",["Fictional candidate and work history created for HirePilot product testing. Not a real person's resume."])
    ]:
        story.append(Paragraph(title,styles["Section"]))
        for line in lines: story.extend([Paragraph(line,styles["BodyText"]),Spacer(1,5)])
    SimpleDocTemplate(str(path),pagesize=(595,842),rightMargin=48,leftMargin=48,topMargin=44,bottomMargin=44,title=c["name"]+" - Demo Resume").build(story)
    doc=fitz.open(path)
    assert len(doc)==1
    assert c["name"] in doc[0].get_text()
    doc[0].get_pixmap(matrix=fitz.Matrix(1,1)).save(str(root/"server/.demo-output"/(c["key"]+"-resume.png")))
print("Generated and checked 5 single-page demo resumes.")
