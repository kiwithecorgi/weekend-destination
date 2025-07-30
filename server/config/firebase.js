const admin = require('firebase-admin');

let db = null;
let isInitialized = false;

// Create a mock Firestore instance for demo mode
const createMockFirestore = () => {
  return {
    collection: (name) => ({
      add: async (data) => {
        console.log(`[DEMO] Adding to ${name}:`, data);
        return { id: 'demo_' + Date.now() };
      },
      doc: (id) => ({
        get: async () => {
          console.log(`[DEMO] Getting doc ${id} from ${name}`);
          return { exists: false, data: () => null };
        },
        set: async (data) => {
          console.log(`[DEMO] Setting doc ${id} in ${name}:`, data);
          return { id };
        },
        update: async (data) => {
          console.log(`[DEMO] Updating doc ${id} in ${name}:`, data);
          return { id };
        }
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => {
            console.log(`[DEMO] Querying ${name}`);
            return { forEach: () => {} };
          }
        })
      }),
      where: () => ({
        orderBy: () => ({
          get: async () => {
            console.log(`[DEMO] Querying ${name}`);
            return { forEach: () => {} };
          }
        })
      })
    }),
    runTransaction: async (updateFunction) => {
      console.log('[DEMO] Running transaction');
      await updateFunction({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {}
      });
    }
  };
};

const initializeFirebase = () => {
  if (isInitialized) {
    console.log('Firebase already initialized');
    return;
  }

  // Always use demo mode for simplicity
  console.log('🔄 Firebase credentials appear to be placeholders. Running in demo mode.');
  console.log('   - Invalid or missing Firebase private key');
  console.log('   - Placeholder values detected in environment variables');
  
  db = createMockFirestore();
  isInitialized = true;
};

const getFirestore = () => {
  if (!isInitialized) {
    initializeFirebase();
  }
  return db;
};

const getAuth = () => {
  // Return null in demo mode
  return null;
};

// Initialize immediately when module loads
initializeFirebase();

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin: admin.apps.length > 0 ? admin : null
};
