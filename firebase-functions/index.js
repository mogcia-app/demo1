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

// ユーティリティ関数
const createAuditLog = async (userId, action, resourceType, resourceId, details = {}) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await db.collection('auditLogs').add({
      userId,
      userName: userData?.displayName || 'Unknown',
      action,
      resourceType,
      resourceId,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  } catch (error) {
    console.error('監査ログ作成エラー:', error);
  }
};

// データバリデーション関数
const validateEquipment = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('機材名は必須です');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('カテゴリーは必須です');
  }
  
  if (typeof data.stock !== 'number' || data.stock < 0) {
    errors.push('在庫数は0以上の数値である必要があります');
  }
  
  if (data.status && !['available', 'maintenance', 'out_of_order'].includes(data.status)) {
    errors.push('ステータスが無効です');
  }
  
  return errors;
};

const validateEvent = (data) => {
  const errors = [];
  
  if (!data.siteName || data.siteName.trim().length === 0) {
    errors.push('現場名は必須です');
  }
  
  if (!data.startDate || !data.endDate) {
    errors.push('開始日と終了日は必須です');
  }
  
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.push('開始日は終了日より前である必要があります');
  }
  
  if (!data.createdBy) {
    errors.push('作成者は必須です');
  }
  
  if (data.status && !['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('ステータスが無効です');
  }
  
  return errors;
};

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

// 機材管理関数
exports.createEquipment = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const { equipmentData } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // バリデーション
    const validationErrors = validateEquipment(equipmentData);
    if (validationErrors.length > 0) {
      throw new functions.https.HttpsError('invalid-argument', validationErrors.join(', '));
    }
    
    // 機材データを準備
    const newEquipment = {
      ...equipmentData,
      status: equipmentData.status || 'available',
      tags: equipmentData.tags || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // 機材を作成
    const docRef = await db.collection('equipment').add(newEquipment);
    
    // 監査ログを作成
    await createAuditLog(userId, 'create', 'equipment', docRef.id, {
      equipmentName: equipmentData.name,
      category: equipmentData.category
    });
    
    return {
      success: true,
      equipmentId: docRef.id,
      message: '機材が正常に作成されました'
    };
    
  } catch (error) {
    logger.error('機材作成エラー:', error);
    throw error;
  }
});

exports.updateEquipment = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const { equipmentId, equipmentData } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // バリデーション
    const validationErrors = validateEquipment(equipmentData);
    if (validationErrors.length > 0) {
      throw new functions.https.HttpsError('invalid-argument', validationErrors.join(', '));
    }
    
    // 機材データを準備
    const updatedEquipment = {
      ...equipmentData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // 機材を更新
    await db.collection('equipment').doc(equipmentId).update(updatedEquipment);
    
    // 監査ログを作成
    await createAuditLog(userId, 'update', 'equipment', equipmentId, {
      equipmentName: equipmentData.name,
      changes: equipmentData
    });
    
    return {
      success: true,
      message: '機材が正常に更新されました'
    };
    
  } catch (error) {
    logger.error('機材更新エラー:', error);
    throw error;
  }
});

exports.deleteEquipment = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const { equipmentId } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // 機材情報を取得（監査ログ用）
    const equipmentDoc = await db.collection('equipment').doc(equipmentId).get();
    const equipmentData = equipmentDoc.data();
    
    if (!equipmentData) {
      throw new functions.https.HttpsError('not-found', '機材が見つかりません');
    }
    
    // 機材を削除
    await db.collection('equipment').doc(equipmentId).delete();
    
    // 監査ログを作成
    await createAuditLog(userId, 'delete', 'equipment', equipmentId, {
      equipmentName: equipmentData.name,
      category: equipmentData.category
    });
    
    return {
      success: true,
      message: '機材が正常に削除されました'
    };
    
  } catch (error) {
    logger.error('機材削除エラー:', error);
    throw error;
  }
});

// イベント管理関数
exports.createEvent = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const { eventData } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // バリデーション
    const validationErrors = validateEvent(eventData);
    if (validationErrors.length > 0) {
      throw new functions.https.HttpsError('invalid-argument', validationErrors.join(', '));
    }
    
    // イベントデータを準備
    const newEvent = {
      ...eventData,
      createdBy: userId,
      status: eventData.status || 'draft',
      priority: eventData.priority || 'medium',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // イベントを作成
    const docRef = await db.collection('events').add(newEvent);
    
    // 監査ログを作成
    await createAuditLog(userId, 'create', 'event', docRef.id, {
      siteName: eventData.siteName,
      startDate: eventData.startDate,
      endDate: eventData.endDate
    });
    
    return {
      success: true,
      eventId: docRef.id,
      message: 'イベントが正常に作成されました'
    };
    
  } catch (error) {
    logger.error('イベント作成エラー:', error);
    throw error;
  }
});

// スケジュール管理関数
exports.createSchedule = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const { scheduleData } = request.data;
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // スケジュールデータを準備
    const newSchedule = {
      ...scheduleData,
      userId,
      status: scheduleData.status || 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // スケジュールを作成
    const docRef = await db.collection('schedules').add(newSchedule);
    
    // 監査ログを作成
    await createAuditLog(userId, 'create', 'schedule', docRef.id, {
      equipmentName: scheduleData.equipmentName,
      eventName: scheduleData.eventName,
      startDate: scheduleData.startDate,
      endDate: scheduleData.endDate
    });
    
    return {
      success: true,
      scheduleId: docRef.id,
      message: 'スケジュールが正常に作成されました'
    };
    
  } catch (error) {
    logger.error('スケジュール作成エラー:', error);
    throw error;
  }
});

// データ初期化関数
exports.initializeData = onCall({region: 'asia-northeast1'}, async (request) => {
  try {
    const userId = request.auth?.uid;
    
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
    }
    
    // デフォルトカテゴリーを作成
    const categories = [
      { name: '音響', color: '#1976d2', order: 1 },
      { name: '照明', color: '#d32f2f', order: 2 },
      { name: '映像', color: '#388e3c', order: 3 },
      { name: '配線', color: '#f57c00', order: 4 },
      { name: 'その他', color: '#7b1fa2', order: 5 }
    ];
    
    const categoryRefs = {};
    for (const category of categories) {
      const docRef = await db.collection('equipmentCategories').add({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      categoryRefs[category.name] = docRef.id;
    }
    
    // サンプル機材を作成
    const sampleEquipment = [
      { name: '音響システム A', category: categoryRefs['音響'], stock: 5, description: 'メイン音響システム' },
      { name: '音響システム B', category: categoryRefs['音響'], stock: 3, description: 'サブ音響システム' },
      { name: 'マイクセット C', category: categoryRefs['音響'], stock: 10, description: 'ワイヤレスマイク' },
      { name: '照明器具 D', category: categoryRefs['照明'], stock: 8, description: 'LED照明' },
      { name: '照明器具 E', category: categoryRefs['照明'], stock: 6, description: 'スポットライト' },
      { name: 'プロジェクター G', category: categoryRefs['映像'], stock: 4, description: '4Kプロジェクター' },
      { name: '大型スクリーン H', category: categoryRefs['映像'], stock: 3, description: '300インチスクリーン' },
      { name: 'ケーブルセット I', category: categoryRefs['配線'], stock: 20, description: '各種ケーブル' },
      { name: '電源タップ J', category: categoryRefs['配線'], stock: 15, description: '延長コード' }
    ];
    
    for (const equipment of sampleEquipment) {
      await db.collection('equipment').add({
        ...equipment,
        status: 'available',
        tags: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // 監査ログを作成
    await createAuditLog(userId, 'initialize', 'system', 'data', {
      categoriesCreated: categories.length,
      equipmentCreated: sampleEquipment.length
    });
    
    return {
      success: true,
      message: 'データが正常に初期化されました',
      categoriesCreated: categories.length,
      equipmentCreated: sampleEquipment.length
    };
    
  } catch (error) {
    logger.error('データ初期化エラー:', error);
    throw error;
  }
});

