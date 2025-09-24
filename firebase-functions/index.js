const {onRequest, onCall} = require('firebase-functions/v2/https');
const {onDocumentCreated, onDocumentDeleted} = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const {logger} = require('firebase-functions');

// Firebase Admin SDKを初期化（Firebase Functions環境では自動的に初期化される）
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestoreの参照を取得
const db = admin.firestore();

// Hello World 関数（Callable Function）
exports.helloWorld = onCall({region: 'asia-northeast1'}, async (request) => {
  const { name = 'Firebase World' } = request.data;
  
  logger.info('helloWorld function called', { name });
  
  return {
    message: `Hello, ${name}! from Firebase Functions`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    success: true
  };
});

// データ処理関数（Callable Function）
exports.processData = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const inputData = request.data;
    
    logger.info('processData function called', { inputData });
    
    // データ処理のシミュレーション
    const processedData = {
      originalData: inputData,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: 'Firebase Functions',
      dataLength: JSON.stringify(inputData).length,
      hash: Buffer.from(JSON.stringify(inputData)).toString('base64'),
      userId: request.auth?.uid || 'anonymous'
    };

    // 処理結果をFirestoreに保存（オプション）
    await db.collection('processedData').add(processedData);

    return {
      success: true,
      data: processedData,
      message: 'データが正常に処理されました'
    };
  } catch (error) {
    logger.error('processData error', error);
    throw new Error(`データ処理中にエラーが発生しました: ${error.message}`);
  }
});

// ユーザー情報取得関数（Callable Function）
exports.getUserInfo = onCall({region: 'asia-northeast1'}, async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new Error('ユーザーIDが必要です');
  }

  logger.info('getUserInfo function called', { userId });

  // モックユーザーデータ（実際はFirestoreやAuth から取得）
  const mockUserData = {
    userId: userId,
    name: `ユーザー ${userId}`,
    email: `${userId}@example.com`,
    createdAt: admin.firestore.Timestamp.now(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    profile: {
      age: Math.floor(Math.random() * 50) + 18,
      location: '東京',
      interests: ['プログラミング', 'Firebase', 'Next.js']
    },
    requestedBy: request.auth?.uid || 'anonymous'
  };

  return {
    success: true,
    data: mockUserData,
    message: 'ユーザー情報を取得しました'
  };
});

// タスク作成関数（Callable Function）
exports.createTask = onCall({region: 'asia-northeast1'}, async (request) => {
  const { title, description } = request.data;

  if (!title || title.trim() === '') {
    throw new Error('タスクタイトルが必要です');
  }

  logger.info('createTask function called', { title, description });

  try {
    const taskData = {
      title: title.trim(),
      description: description || '',
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth?.uid || 'anonymous'
    };

    const docRef = await db.collection('tasks').add(taskData);

    return {
      success: true,
      data: {
        id: docRef.id,
        ...taskData
      },
      message: 'タスクが正常に作成されました'
    };
  } catch (error) {
    logger.error('createTask error', error);
    throw new Error(`タスク作成中にエラーが発生しました: ${error.message}`);
  }
});

// タスク一覧取得関数（Callable Function）
exports.getTasks = onCall({region: 'asia-northeast1'}, async (request) => {
  logger.info('getTasks function called');

  try {
    const snapshot = await db.collection('tasks')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: tasks,
      message: `${tasks.length}件のタスクを取得しました`
    };
  } catch (error) {
    logger.error('getTasks error', error);
    throw new Error(`タスク取得中にエラーが発生しました: ${error.message}`);
  }
});

// タスク更新関数（Callable Function）
exports.updateTask = onCall({region: 'asia-northeast1'}, async (request) => {
  const { taskId, updates } = request.data;

  if (!taskId) {
    throw new Error('タスクIDが必要です');
  }

  logger.info('updateTask function called', { taskId, updates });

  try {
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || 'anonymous'
    };

    await db.collection('tasks').doc(taskId).update(updateData);

    return {
      success: true,
      data: { id: taskId, ...updateData },
      message: 'タスクが正常に更新されました'
    };
  } catch (error) {
    logger.error('updateTask error', error);
    throw new Error(`タスク更新中にエラーが発生しました: ${error.message}`);
  }
});

// タスク削除関数（Callable Function）
exports.deleteTask = onCall({region: 'asia-northeast1'}, async (request) => {
  const { taskId } = request.data;

  if (!taskId) {
    throw new Error('タスクIDが必要です');
  }

  logger.info('deleteTask function called', { taskId });

  try {
    await db.collection('tasks').doc(taskId).delete();

    return {
      success: true,
      data: { id: taskId },
      message: 'タスクが正常に削除されました'
    };
  } catch (error) {
    logger.error('deleteTask error', error);
    throw new Error(`タスク削除中にエラーが発生しました: ${error.message}`);
  }
});

// Firestoreトリガー: タスク作成時の処理
exports.onTaskCreated = onDocumentCreated('tasks/{taskId}', (event) => {
  const taskData = event.data.data();
  const taskId = event.params.taskId;

  logger.info('Task created', { taskId, taskData });

  // 必要に応じて通知やログ処理を追加
  // 例: メール送信、Slack通知、分析データ送信など

  return null;
});

// Firestoreトリガー: タスク削除時の処理
exports.onTaskDeleted = onDocumentDeleted('tasks/{taskId}', (event) => {
  const taskId = event.params.taskId;

  logger.info('Task deleted', { taskId });

  // 必要に応じてクリーンアップ処理を追加
  // 例: 関連データの削除、ログ記録など

  return null;
});

// HTTP関数の例（REST API）
exports.api = onRequest({region: 'asia-northeast1', cors: true}, (req, res) => {
  // 簡単なREST APIの例
  if (req.method === 'GET') {
    res.json({
      message: 'Firebase Functions API',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});

