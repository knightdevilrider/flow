const fs = require('fs');
let code = fs.readFileSync('components/AreaAutocomplete.tsx', 'utf8');

if (!code.includes('required?: boolean;')) {
    code = code.replace(
        'selectedZone: string;\n}',
        'selectedZone: string;\n  required?: boolean;\n}'
    );
}

if (!code.includes('required = false')) {
    code = code.replace(
        'selectedZone\n}: AreaAutocompleteProps)',
        'selectedZone,\n  required = false\n}: AreaAutocompleteProps)'
    );
}

code = code.replace(
    'className={${styles.input} w-full pr-10}\n          required\n        />',
    'className={${styles.input} w-full pr-10}\n          required={required}\n        />'
);

fs.writeFileSync('components/AreaAutocomplete.tsx', code);
console.log('Patched AreaAutocomplete.tsx');
