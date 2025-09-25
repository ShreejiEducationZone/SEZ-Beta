// User's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_PcFeNPA45rdqIN3GL0JQagLnRo1QnBs",
    projectId: "sez-beta",
};

const API_KEY = firebaseConfig.apiKey;
const PROJECT_PATH = `projects/${firebaseConfig.projectId}/databases/(default)`;
const BASE_URL = `https://firestore.googleapis.com/v1/${PROJECT_PATH}/documents`;

// ========== Data Transformation Helpers ==========

// Transforms a Firestore REST API value object (e.g., { stringValue: 'hello' }) to a JS value.
const transformFirestoreValue = (valueObject: any): any => {
    if (!valueObject) return null;
    const type = Object.keys(valueObject)[0];
    switch (type) {
        case 'stringValue':
        case 'timestampValue':
            return valueObject[type];
        case 'integerValue':
            return parseInt(valueObject[type], 10);
        case 'doubleValue':
            return parseFloat(valueObject[type]);
        case 'booleanValue':
            return valueObject[type];
        case 'nullValue':
            return null;
        case 'mapValue':
            return transformFirestoreFieldsToObject(valueObject[type].fields || {});
        case 'arrayValue':
            return (valueObject[type].values || []).map(transformFirestoreValue);
        default:
            return valueObject[type];
    }
};

// Transforms a Firestore 'fields' object into a clean JavaScript object.
const transformFirestoreFieldsToObject = (fields: any): { [key: string]: any } => {
    const result: { [key: string]: any } = {};
    for (const key in fields) {
        result[key] = transformFirestoreValue(fields[key]);
    }
    return result;
};

// Transforms a full Firestore document response into a clean JS object with an 'id'.
const transformFirestoreDocResponse = (doc: any) => {
    if (!doc.fields) return { id: doc.name.split('/').pop() };
    const result = transformFirestoreFieldsToObject(doc.fields);
    result.id = doc.name.split('/').pop();
    return result;
};

// Transforms a JavaScript value into a Firestore REST API value object.
const transformValueToFirestore = (value: any): any => {
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'number' && Number.isInteger(value)) {
        return { integerValue: value.toString() };
    }
    if (typeof value === 'number') {
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (value === null || typeof value === 'undefined') {
        return { nullValue: null };
    }
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(item => transformValueToFirestore(item))
            }
        };
    }
    if (typeof value === 'object' && value.constructor === Object) {
        return {
            mapValue: {
                fields: transformObjectToFirestoreFields(value)
            }
        };
    }
    return { stringValue: String(value) };
};

// Transforms a JavaScript object into a Firestore 'fields' object.
const transformObjectToFirestoreFields = (obj: any): { [key: string]: any } => {
    const fields: { [key: string]: any } = {};
    for (const key in obj) {
        if (key === 'id') continue;
        fields[key] = transformValueToFirestore(obj[key]);
    }
    return fields;
};

// ========== API Request Helpers ==========

// Generic fetch wrapper for Firestore REST API
const firestoreRequest = async (url: string, options: RequestInit) => {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}key=${API_KEY}`;
    const response = await fetch(fullUrl, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!response.ok) {
        const error = await response.json();
        console.error(`Firestore API Error:`, error);
        throw new Error(error.error.message || 'Firestore API request failed');
    }
    return response.status === 204 ? {} : response.json();
};

// ========== Public API Functions ==========

/**
 * Fetches all documents from a collection.
 */
export const getCollection = async (collectionPath: string) => {
    const data = await firestoreRequest(`${BASE_URL}/${collectionPath}`, { method: 'GET' });
    return (data.documents || []).map(transformFirestoreDocResponse);
};

/**
 * Fetches a single document by its ID.
 * Returns null if the document is not found.
 */
export const getDocument = async (collectionPath: string, documentId: string) => {
    const url = `${BASE_URL}/${collectionPath}/${documentId}`;
    try {
        const doc = await firestoreRequest(url, { method: 'GET' });
        return transformFirestoreDocResponse(doc);
    } catch (error: any) {
        // Handle 404 Not Found gracefully by returning null.
        // The error message for a 404 contains "not found".
        if (error.message && error.message.toLowerCase().includes('not found')) {
            return null;
        }
        // Re-throw other types of errors.
        console.error(`Failed to get document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};


/**
 * Creates or updates a document. Behaves like setDoc with merge:true.
 */
export const setDocument = async (collectionPath: string, documentId: string, data: any) => {
    const url = `${BASE_URL}/${collectionPath}/${documentId}`;
    const firestoreData = { fields: transformObjectToFirestoreFields(data) };
    return firestoreRequest(url, { method: 'PATCH', body: JSON.stringify(firestoreData) });
};

/**
 * Deletes a document.
 */
export const deleteDocument = async (collectionPath: string, documentId: string) => {
    const url = `${BASE_URL}/${collectionPath}/${documentId}`;
    return firestoreRequest(url, { method: 'DELETE' });
};

/**
 * Performs a batch of writes (set or delete).
 */
export const runBatch = async (writes: { type: 'set' | 'delete'; path: string; data?: any }[]) => {
    const url = `${BASE_URL}:commit`;
    const transformedWrites = writes.map(write => {
        const resourceName = `${PROJECT_PATH}/documents/${write.path}`;
        if (write.type === 'delete') {
            return { delete: resourceName };
        }
        // 'update' in a commit acts like 'set' - it creates or overwrites.
        return {
            update: {
                name: resourceName,
                fields: transformObjectToFirestoreFields(write.data)
            }
        };
    });

    return firestoreRequest(url, { method: 'POST', body: JSON.stringify({ writes: transformedWrites }) });
};
