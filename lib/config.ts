// Firebase 設定
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDrgsg6OsOzGSJU0XFJQJ6QQI1XDWp7tMI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fir-f189e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fir-f189e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fir-f189e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "510066909737",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:510066909737:web:0e7ec3de0baaa7f50b7238",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
}

// 環境変数の例（.env.local に設定してください）
export const envExample = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "your-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your-project.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your-project-id",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "your-project.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:abcdef",
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ABCDEF"
}
