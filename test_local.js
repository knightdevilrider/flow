const patients = [{ id: 'COMREF69', name: 'Emma Johnson', status: 'RECEPTION_WAITING' }];
const updates = { name: 'Emma Smith', pincode: '123456' };
const idx = patients.findIndex(p => p.id === 'COMREF69');
if (idx !== -1) {
    patients[idx] = { ...patients[idx], ...updates };
}
console.log(patients[0]);
