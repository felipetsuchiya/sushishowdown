import { initializeApp } from 'firebase/app';
// Importe o getFirestore e o Firestore
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIW__gg3zo-jocMNNByE5sk39lO2tQF10",
  authDomain: "sushi-showdown.firebaseapp.com",
  projectId: "sushi-showdown",
  storageBucket: "sushi-showdown.firebasestorage.app",
  messagingSenderId: "694021180632",
  appId: "1:694021180632:web:2589d16554b100c24fdbad"
};

const app = initializeApp(firebaseConfig);

// AQUI ESTÁ O SEGREDO: tem que ter 'export' antes do const db
export const db = getFirestore(app);