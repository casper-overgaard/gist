import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSessionStore } from '../useSessionStore';
import { Asset } from '@signalboard/domain';
import { setDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getFirestore: vi.fn()
}));

// Mock the initialized db
vi.mock('@/lib/firebase', () => ({
  db: {}
}));

describe('useSessionStore', () => {
  beforeEach(() => {
    // Reset Zustand store
    useSessionStore.setState({ session: null, assets: [], isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('createSession initializes a new session and sends to Firebase', async () => {
    const store = useSessionStore.getState();
    const newSessionId = await store.createSession('Test Workspace');
    
    expect(newSessionId).toBeDefined();
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('addAsset adds an asset successfully when session exists', async () => {
    useSessionStore.setState({ session: { id: 'test-session-123' } as ReturnType<typeof useSessionStore.getState>['session'] });
    
    const store = useSessionStore.getState();
    const testAsset: Asset = {
      id: 'asset-1',
      sessionId: 'test-session-123',
      type: 'text',
      rawText: 'Hello',
      createdAt: new Date().toISOString()
    };
    
    await store.addAsset(testAsset);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('updateAssetPosition fires optimism locally and debounces Firebase push', async () => {
    useSessionStore.setState({ 
      session: { id: 'test-session-123' } as ReturnType<typeof useSessionStore.getState>['session'],
      assets: [{ id: 'asset-1', sessionId: 'test-session-123', type: 'text', rawText: 'Test', createdAt: new Date().toISOString() }]
    });

    const store = useSessionStore.getState();
    await store.updateAssetPosition('asset-1', 150, 300, false); // saveToDb is false (drag)

    const updatedAssetState = useSessionStore.getState().assets[0];
    expect(updatedAssetState.canvasPosition?.x).toBe(150);
    expect(updatedAssetState.canvasPosition?.y).toBe(300);

    // Firebase updateDoc should NOT have been called due to the saveToDb false
    expect(updateDoc).not.toHaveBeenCalled();

    // Now trigger a drop (saveToDb = true)
    await store.updateAssetPosition('asset-1', 200, 300, true);
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().assets[0].canvasPosition?.x).toBe(200);
  });
});
