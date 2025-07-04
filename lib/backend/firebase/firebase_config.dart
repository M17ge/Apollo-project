import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: FirebaseOptions(
            apiKey: "AIzaSyAVhK5GNgwz-DsMilSapF-6OO4LPhyfLXA",
            authDomain: "apollo-project-9c70b.firebaseapp.com",
            projectId: "apollo-project-9c70b",
            storageBucket: "apollo-project-9c70b.firebasestorage.app",
            messagingSenderId: "89948471233",
            appId: "1:89948471233:web:1cb2261333c6539a727940",
            measurementId: "G-GR4K54E6FP"));
  } else {
    await Firebase.initializeApp();
  }
}
