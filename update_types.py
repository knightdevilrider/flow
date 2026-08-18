import re

with open('types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"  exitTime\?: number; // Milestone End / Stage Forwarded\n",
    "  exitTime?: number; // Milestone End / Stage Forwarded\n  authorId?: string; // Who made the update\n  note?: string; // Any notes left at this stage\n",
    content
)

with open('types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
