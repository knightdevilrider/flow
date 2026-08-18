import re

with open('components/admin/PatientFormModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Props Interface
content = re.sub(
    r"doctors: Doctor\[\];\n\}",
    "doctors: Doctor[];\n  restrictToBasicInfo?: boolean;\n}",
    content
)

# 2. Update Component Definition
content = re.sub(
    r"doctors \}\) => \{",
    "doctors, restrictToBasicInfo = false }) => {",
    content
)

# 3. Add conditional render start
content = re.sub(
    r"\{\/\* Section 2: Medical Details \*\/\}",
    "{!restrictToBasicInfo && (\n            <>\n            {/* Section 2: Medical Details */}",
    content
)

# 4. Add conditional render end
content = re.sub(
    r"(<\/div>\s*<\/div>\s*)(<div className=\"flex gap-4 pt-8\">)",
    r"\1</>\n          )}\n\n          \2",
    content
)

with open('components/admin/PatientFormModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
