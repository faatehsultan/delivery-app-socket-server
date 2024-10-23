const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDDWAK0LEuPCt7bDOzsPfQZzE2oELJhCQA',
  authDomain: 'heavyvehicledelivery-dev.firebaseapp.com',
  projectId: 'heavyvehicledelivery-dev',
  storageBucket: 'heavyvehicledelivery-dev.appspot.com',
  messagingSenderId: '101461263129',
  appId: '1:101461263129:web:b67caf69f7f3fb3754fb88',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// features
const saveUserLocationToDb = async (uid, location) => {
  if (!uid || !location?.longitude || !location?.latitude) {
    return false;
  }
  await setDoc(doc(db, 'user_last_location', uid), {
    ...location,
    timestamp: new Date().toISOString(),
  });

  return true;
};

module.exports = {
  saveUserLocationToDb,
};
