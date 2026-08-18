import os

files = [
    'views/StaffReception.tsx',
    'views/StaffCheckin.tsx',
    'views/StaffDoctor.tsx',
    'views/StaffTreatment.tsx',
    'views/StaffPharmacy.tsx',
    'views/StaffLab.tsx',
    'views/StaffRadiology.tsx',
    'views/StaffWardCare.tsx',
    'views/StaffBilling.tsx',
    'views/StaffVisitorMgmt.tsx',
    'views/StaffAttendantMgmt.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove h-full overflow-y-auto custom-scrollbar so the layout can naturally grow
        # and trigger the browser's native scrollbar like in Gate Security
        content = content.replace('className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar"', 'className="flex flex-col w-full"')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
            
print('Fixed outer wrapper scrolling for all portals')
