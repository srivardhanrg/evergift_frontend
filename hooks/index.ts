// New unified state machine hook (replaces usePreviewLoader + useGenerationPolling)
export { usePreviewStateMachine } from './usePreviewStateMachine';

// Keep legacy hooks for backwards compatibility
export { usePreviewLoader } from './usePreviewLoader';
export { useGenerationPolling } from './useGenerationPolling';

// Other hooks
export { usePaymentFlow } from './usePaymentFlow';
export { usePdfDownload } from './usePdfDownload';

// Export types from state machine (preferred)
export type { LockedPage, GenerationPhase, MachineState } from './usePreviewStateMachine';

// Legacy type exports (for backwards compatibility)
export type { InitialPhaseState } from './usePreviewLoader';
