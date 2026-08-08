const fs = require('fs');

// 1. Update types.ts
let typesData = fs.readFileSync('types.ts', 'utf8');
if (!typesData.includes('photoUrl')) {
  typesData = typesData.replace('deletionRequest?: {', 'photoUrl?: string;\n  publicDisplayConsent?: boolean;\n  deletionRequest?: {');
  fs.writeFileSync('types.ts', typesData);
}

// 2. Update PublicDisplayView.tsx
let pubData = fs.readFileSync('views/PublicDisplayView.tsx', 'utf8');

// Remove the User icon from the small cards
pubData = pubData.replace(
  /<div className=\"w-10 h-10 rounded-full bg-\[\#007AFF\]\/20 flex items-center justify-center shrink-0\">\s*<User className=\"w-5 h-5 text-\[\#0A84FF\]\" \/>\s*<\/div>/g,
  ''
);

// Add photo to FullScreenAnnouncement
pubData = pubData.replace(
  /<h2 className=\"text-5xl sm:text-7xl md:text-\[10rem\] lg:text-\[12rem\] font-black text-\[\#1D1D1F\] dark:text-white leading-tight sm:leading-none mb-4 tracking-tighter break-words\">/g,
  '{patient.publicDisplayConsent && patient.photoUrl && <div className=\"mb-8 flex justify-center\"><img src={patient.photoUrl} alt=\"Patient\" className=\"w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full border-8 border-[#0A84FF] shadow-2xl object-cover\" /></div>}\n        <h2 className=\"text-5xl sm:text-7xl md:text-[10rem] lg:text-[12rem] font-black text-[#1D1D1F] dark:text-white leading-tight sm:leading-none mb-4 tracking-tighter break-words\">'
);

fs.writeFileSync('views/PublicDisplayView.tsx', pubData);
console.log('types.ts and PublicDisplayView.tsx updated!');
