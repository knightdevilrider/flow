const patients = [{ id: '1', allowPhotoOnDisplay: false }];
const updates = { allowPhotoOnDisplay: true };
patients[0] = { ...patients[0], ...updates };
console.log(patients[0]);
