import re
import sys

def update_view(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import for PatientTimelineModal
    if 'PatientTimelineModal' not in content:
        content = re.sub(
            r"import \{ RegistryTable \} from '\.\.\/components\/RegistryTable';",
            "import { RegistryTable } from '../components/RegistryTable';\nimport PatientTimelineModal from '../components/admin/PatientTimelineModal';",
            content
        )

    # 2. Add state for timelinePatient
    if 'const [timelinePatient, setTimelinePatient]' not in content:
        content = re.sub(
            r"(const \[step, setStep\].*?;\n|const \[isOverrideUnlocked, setIsOverrideUnlocked\].*?;\n)",
            r"\1  const [timelinePatient, setTimelinePatient] = useState<Patient | null>(null);\n",
            content
        )

    # 3. Add onRowClick to RegistryTable
    # First, replace existing <RegistryTable ... /> to add onRowClick
    content = re.sub(
        r"(<RegistryTable\s+patients=\{.*?\}\s+theme=\{theme\}\s+onEdit=\{.*?\})",
        r"\1\n              onRowClick={(p) => isAdmin && setTimelinePatient(p)}",
        content
    )
    
    # StaffReception also has onDelete
    content = re.sub(
        r"(<RegistryTable\s+patients=\{patients\}\s+theme=\{theme\}\s+onEdit=\{onEditPatient\}\s+onDelete=\{handleRequestDelete\})",
        r"\1\n              onRowClick={(p) => isAdmin && setTimelinePatient(p)}",
        content
    )

    # 4. Add the PatientTimelineModal render at the bottom before final closing div
    if 'PatientTimelineModal patient={timelinePatient}' not in content:
        modal_str = """
      {timelinePatient && (
        <PatientTimelineModal
          patient={timelinePatient}
          theme={theme}
          onClose={() => setTimelinePatient(null)}
          onEdit={(p) => {
            setTimelinePatient(null);
            if (onEditPatient) onEditPatient(p);
          }}
          onDelete={(p, reason) => {
            setTimelinePatient(null);
            if (onDeletePatient) onDeletePatient(p);
          }}
        />
      )}
"""
        # Find the very last </div>
        content = re.sub(r'(\s*</div>\s*);\s*};\s*export default', modal_str + r'\1;\n};\n\nexport default', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_view('views/StaffGate.tsx')
update_view('views/StaffReception.tsx')
