const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
admin.initializeApp();

exports.clearRoomData = functions
  .region('asia-northeast1')
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
  })
  .pubsub.schedule('0 0 * * *') //毎日0:00に実行
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    //roomData取得
    const db = admin.firestore();
    const ref = db.collection('rooms');
    const snapshot = await ref.get();

    const deleteDocumentRecursively = async (
      docRef: any //FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
    ) => {
      const collections = await docRef.listCollections();
      if (collections.length > 0) {
        for (const collection of collections) {
          const snapshot = await collection.get();
          for (const doc of snapshot.docs) {
            //単独のドキュメントに対して実行
            await deleteDocumentRecursively(doc.ref);
          }
        }
      }
      await docRef.delete(); //サブコレクションを削除してから実行
    };

    await Promise.all(
      snapshot.docs
        .filter((doc: any) => doc.data().isConnected === false)
        .map(async (doc: any) => {
          await deleteDocumentRecursively(db.collection('rooms').doc(doc.id));
        })
    ).catch((error) => error.message);
  });
